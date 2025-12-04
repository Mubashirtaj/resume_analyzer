import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env";
let apikey:string = "";
const genAI = new GoogleGenerativeAI(apikey || ENV.GEMINI_API_KEY);

export async function improveCVContent(prompt: string,key:string,Gemin_Model:string) {
  apikey = key 
  const model = genAI.getGenerativeModel({ model: Gemin_Model });

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
