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
import { ok } from "node:assert";

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

    const [cvRecord] = await prisma.$transaction(async (tx) => {
      const cv = await tx.cV.create({
        data: {
          pdfUrl: filePath,
          ipAddress: ip,
          improvedText: aiImprovedText,
          extractedText: text,
          country,
          region,
        },
      });

      return [cv];
    });

    res.status(200).json({
      message: "Resume processed successfully",
      cv: cvRecord,
    });
  } catch (error) {
    console.error("❌ Error in ResumeSubmit:", error);
    res
      .status(500)
      .json({ message: "Internal server error during resume processing" });
  }
}
export async function ResumeGenerate(req: Request, res: Response) {
  const { cvId, theme } = req.body;
  if (!theme) {
    return res.status(400).json({ message: "theme is required" });
  }

  try {
    const extract = await prisma.cV.findUnique({
      where: { id: cvId },
      select: { extractedText: true },
    });

    const extractedText = extract?.extractedText || null;
    if (!extractedText) {
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

    let html = aiHtml;

    try {
      if (typeof html === "string") {
        // Remove ```json or ``` from response
        html = html.replace(/```json|```/gi, "").trim();

        html = JSON.parse(html);
      }
    } catch (error) {
      console.error("JSON parse error:", error);
    }

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
          prompt: theme,
          improvedText: html, // ✅ RAW JSON stored
        },
      });

      return { cv: cvRecord, conversion };
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");

    res.end(
      JSON.stringify({
        ok: true,
        message: "Success",
        id: result.conversion.id,
        data: html, // ✅ return JSON not string
      })
    );
  } catch (error) {
    console.error("ResumeGenerate error:", error);
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

export async function Conversation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversion.findMany({
      where: { cvId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        prompt: true,
        improvedText: true,
        createdAt: true,
      },
    });
    const CVTEXT = await prisma.cV.findFirst({
      where: { id: id },
      select: {
        improvedText: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json({ conversation, CVTEXT });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function PDFPreview(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversion.findUnique({
      where: { id: id },
      select: {
        improvedText: true,
        createdAt: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json({ data: conversation.improvedText });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
