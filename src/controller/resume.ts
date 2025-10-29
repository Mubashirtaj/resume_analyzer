import { Request, Response } from "express";
import { extractTextFromPdf } from "../services/extractword";
import { improveCVContent } from "../services/gemini";
import geoip from "geoip-lite";
import { prisma } from "../config/prisma-client";
import {
  Analyzerprompt,
  AnalyzerpromptWithDesign,
  Getjobprompt,
} from "../utils/geminpromt";
import { unescapeAiHtml } from "../utils/unescapeHtml";
import { fetchJobs } from "../services/jobAggregator";

export async function ResumeSubmit(req: Request, res: Response) {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = ip.replace("::ffff:", "").trim();

    const geo = geoip.lookup(ip);
    const country = geo?.country || "PK";
    const region = geo?.region || "SD";

    const filePath = req.file.path;

    console.log("📄 Uploaded file path:", filePath);
    console.log("🌍 Location from IP:", { ip, country, region });

    const text = await extractTextFromPdf(filePath);
    if (!text || text.trim() === "") {
      res.status(400).json({ message: "Unable to extract text from resume" });
    }
    const prompt = Analyzerprompt(text, `${country} region:${region}`);
    const aiImprovedText = await improveCVContent(prompt);

    const [cvRecord, conversion] = await prisma.$transaction(async (tx) => {
      const cv = await tx.cV.create({
        data: {
          pdfUrl: filePath,
          ipAddress: ip,
          country,
          region,
        },
      });

      const conv = await tx.conversion.create({
        data: {
          cvId: cv.id,
          extractedText: text,
          improvedText: aiImprovedText || "AI did not return a result",
        },
      });

      return [cv, conv];
    });

    res.status(200).json({
      message: "Resume processed successfully",
      cv: cvRecord,
      conversion,
    });
  } catch (error) {
    console.error("❌ Error in ResumeSubmit:", error);
    res
      .status(500)
      .json({ message: "Internal server error during resume processing" });
  }
}
export async function ResumeGenerate(req: Request, res: Response) {
  const { cvId, theme, pdfurl } = req.body;

  if (!pdfurl) {
    return res.status(400).json({ message: "pdfurl is required" });
  }
  if (!theme) {
    return res.status(400).json({ message: "theme is required" });
  }

  try {
    const extractedText = await extractTextFromPdf(pdfurl);
    if (!extractedText || extractedText.trim() === "") {
      return res
        .status(400)
        .json({ message: "Could not extract text from provided PDF" });
    }

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = String(ip).replace("::ffff:", "").trim();
    const geo = geoip.lookup(ip);
    const country = geo?.country || null;
    const region = geo?.region || null;
    const prompt = AnalyzerpromptWithDesign(
      extractedText,
      `${country} region:${region}`,
      theme
    );
    const aiHtml = await improveCVContent(prompt);
    const html = unescapeAiHtml(aiHtml);
    const finalHtml =
      html.trim().startsWith("<!doctype") || html.trim().startsWith("<!DOCTYPE")
        ? html
        : `<!doctype html>\n${html}`;
    const result = await prisma.$transaction(async (tx) => {
      const cvRecord = await tx.cV.findUnique({
        where: { id: cvId },
      });

      if (!cvRecord) {
        throw new Error("CV not found — please upload your resume first.");
      }

      const conversion = await tx.conversion.create({
        data: {
          cvId: cvRecord.id,
          extractedText,
          improvedText: finalHtml,
        },
      });

      return { cv: cvRecord, conversion };
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");

    res.end(JSON.stringify({ message: "Success", data: finalHtml }));
  } catch (error) {
    console.error(" ResumeGenerate error:", error);
    res.status(500).json({
      message: "Internal server error during resume generation",
      error: (error as Error).message,
    });
  }
}
export const getJobs = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const page = req.body.page as string;
    const country = req.body.country as string;
    console.log(page);
    const filePath = req.file.path;
    const text = await extractTextFromPdf(filePath);
    const prompt = Getjobprompt(text);
    const field = await improveCVContent(prompt);

    if (!page) return res.status(400).json({ message: "Field is required" });

    const jobs = await fetchJobs(field, page, country);
    res.json({ count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs", error: err });
  }
};
