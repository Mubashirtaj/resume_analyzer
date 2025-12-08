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
import { fetchJobs } from "../services/jobAggregator";
import { ENV } from "../config/env";
const GEMINI_API_KEY = ENV.GEMINI_API_KEY
import fs from "fs/promises";

export async function ResumeSubmit(req: Request, res: Response) {
  try {
    if (!req.file?.path) return res.status(400).json({ message: "No file uploaded" });
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const filePath = req.file.path;
    const text = await extractTextFromPdf(filePath);
    if (!text?.trim()) return res.status(400).json({ message: "Unable to extract text from resume" });

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = ip.replace("::ffff:", "").trim();

    const geo = geoip.lookup(ip);
    const country = geo?.country || "PK";
    const region = geo?.region || "SD";

    const prompt = Analyzerprompt(text, `${country} region:${region}`);
    let aiImprovedText: string;

    // --- Prisma transaction: get user + optionally decrement credits ---
    const cvRecord = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user!.id },
        select: { geminkey: true, credits: true, geminimodel: true },
      });

      if (!user) throw new Error("User not found");

      let keyToUse: string | null = null;
      let Gemin_Model = user.geminimodel;
      if (user.geminkey) {
        keyToUse = user.geminkey;
      } else if (user.credits && user.credits > 0) {
        keyToUse = GEMINI_API_KEY;
        await tx.user.update({
          where: { id: req.user!.id },
          data: { credits: { decrement: 1 } },
        });
      } else {
        throw new Error("NO_CREDITS");
      }

      return { user, keyToUse, Gemin_Model };
    });

    if (cvRecord.keyToUse === null) {
      return res.status(403).json({ message: "You do not have credits" });
    }

    aiImprovedText = await improveCVContent(prompt, cvRecord.keyToUse, cvRecord.Gemin_Model);

    const savedCV = await prisma.cV.create({
      data: {
        pdfUrl: filePath,
        ipAddress: ip,
        userID: req.user.id,
        improvedText: aiImprovedText,
        extractedText: text,
        country,
        region,
      },
    });

    // --- Delete the uploaded PDF after saving to DB ---
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted uploaded file: ${filePath}`);
    } catch (err) {
      console.warn(`⚠️ Failed to delete file: ${filePath}`, err);
    }

    res.status(200).json({ message: "Resume processed successfully", cv: savedCV });
  } catch (error: any) {
    console.error("❌ Error in ResumeSubmit:", error);
    if (error.message === "NO_CREDITS") {
      return res.status(403).json({ message: "You do not have credits" });
    }
    res.status(500).json({ message: "Internal server error during resume processing" });
  }
}



export async function ResumeGenerate(req: Request, res: Response) {
  const { cvId, theme } = req.body;
  if (!theme) return res.status(400).json({ message: "theme is required" });

  try {
    const extract = await prisma.cV.findUnique({
      where: { id: cvId },
      select: { extractedText: true },
    });

    const extractedText = extract?.extractedText || null;
    if (!extractedText)
      return res.status(400).json({ message: "Could not extract text from provided PDF" });

    const txResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user?.id },
        select: { geminkey: true, credits: true,geminimodel:true },
      });

      if (!user) throw new Error("User not found");
      let Gemin_Model = user.geminimodel
      let keyToUse: string | null = null;
      if (user.geminkey) {
        keyToUse = user.geminkey;
      } else if (user.credits && user.credits > 0) {
        keyToUse = GEMINI_API_KEY;

        await tx.user.update({
          where: { id: req.user!.id },
          data: { credits: { decrement: 1 } },
        });
      } else {
        throw new Error("NO_CREDITS");
      }

      return { keyToUse ,Gemin_Model};
    });

    if (!txResult.keyToUse) {
      return res.status(403).json({ message: "You do not have credits" });
    }

    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    if (Array.isArray(ip)) ip = ip[0];
    ip = String(ip).replace("::ffff:", "").trim();

    const geo = geoip.lookup(ip);
    const country = geo?.country || null;
    const region = geo?.region || null;

    const prompt = AnalyzerpromptWithDesign(extractedText, `${country} region:${region}`, theme);

    let aiHtml: any = await improveCVContent(prompt, txResult.keyToUse,txResult.Gemin_Model);

    try {
      if (typeof aiHtml === "string") {
        aiHtml = aiHtml.replace(/```json|```/gi, "").trim();
        aiHtml = JSON.parse(aiHtml);
      }
    } catch (err) {
      console.error("JSON parse error:", err);
    }

    const conversion = await prisma.conversion.create({
      data: {
        cvId,
        extractedText,
        userID: req.user?.id,
        prompt: theme,
        improvedText: aiHtml,
      },
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, message: "Success", id: conversion.id, data: aiHtml }));
  } catch (error: any) {
    console.error("ResumeGenerate error:", error);
    if (error.message === "NO_CREDITS") {
      return res.status(403).json({ message: "You do not have credits" });
    }
    res.status(500).json({ message: "Internal server error during resume generation", error: error.message });
  }
}


export const getJobs = async (req: Request, res: Response) => {
  let filePath: string | null = null;

  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    filePath = req.file.path;  // store for deletion later

    const page = req.body.page as number;
    const country = req.body.country as string;

    if (!page) return res.status(400).json({ message: "Page is required" });

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;

    const text = await extractTextFromPdf(filePath);
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Unable to extract text from resume" });
    }

    const prompt = Getjobprompt(text);

    const txResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { geminkey: true, credits: true, geminimodel: true },
      });

      if (!user) throw new Error("User not found");

      let keyToUse: string | null = null;
      let Gemini_Model = user.geminimodel;

      if (user.geminkey) {
        keyToUse = user.geminkey;
      } else if (user.credits && user.credits > 0) {
        keyToUse = GEMINI_API_KEY;

        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } },
        });
      } else {
        throw new Error("NO_CREDITS");
      }

      return { keyToUse, Gemini_Model };
    });

    if (!txResult.keyToUse) {
      return res.status(403).json({ message: "You do not have credits" });
    }

    const field = await improveCVContent(
      prompt,
      txResult.keyToUse,
      txResult.Gemini_Model
    );

    const jobs = await fetchJobs(field, country, page);

    return res.json({ count: jobs.length, jobs });

  } catch (err: any) {
    console.error("getJobs error:", err);
    if (err.message === "NO_CREDITS") {
      return res.status(403).json({ message: "You do not have credits" });
    }
    return res.status(500).json({ message: "Error fetching jobs", error: err.message || err });
  } finally {
    // ✅ DELETE FILE (always runs)
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log("PDF deleted:", filePath);
      } catch (deleteErr) {
        console.error("Failed to delete PDF:", deleteErr);
      }
    }
  }
};


export async function Conversation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversion.findMany({
      where: { cvId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        prompt: true,
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
export async function AllChats(req: Request, res: Response) {
  try {
    const id  = req.user?.id; 

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        profileimg: true,
        credits:true,
        provider: true,
        geminimodel:true,
        geminkey:true,
      },
    });

    if (!user) {
      return res.status(404).json({ improved: [], user: null });
    }

    const cvs = await prisma.cV.findMany({
      where: { userID: id },
      select: {
        id: true,
        improvedText: true,                  
      },
    });

    const improved = cvs.map((cv) => {
      const text = cv.improvedText || "";
      const previewText = text.split(" ").slice(0, 7).join(" ");
      return {
        id: cv.id,
        previewText,
      };
    });

    return res.status(200).json({ improved, user });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function ResumeUpdate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: "data is required" });
    }

    const updatedConversation = await prisma.conversion.update({
      where: { id },
      data: {
        improvedText: data,      // <-- resumeData store
      },
      select: {
        id: true,
        improvedText: true,
      }
    });

    return res.status(200).json({ ok: true, updatedConversation });

  } catch (error) {
    console.error("Error updating conversation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
