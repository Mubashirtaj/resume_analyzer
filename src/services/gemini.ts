import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export async function improveCVContent(prompt: string) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });

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
