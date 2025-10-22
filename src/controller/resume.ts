import { Request, Response } from "express";
import { extractTextFromPdf } from "../services/extractword";
import { improveCVContent } from "../services/gemini";
import geoip from "geoip-lite";
import { prisma } from "../config/prisma-client";

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

    const aiImprovedText = await improveCVContent(
      text,
      `${country} region:${region}`
    );

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
