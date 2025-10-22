import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export async function improveCVContent(cvText: string, country: string) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });

  const prompt = `
You are an expert HR and recruiter specialized in ${country} market.
The following text is a candidate's resume. Improve and rewrite it to fit professional standards and language used in ${country}.
Keep it clean, structured, and ATS-friendly.

Resume:
${cvText}
  `;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Error improving CV:", error);
    throw new Error("Failed to improve CV content");
  }
}
