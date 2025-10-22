import { GoogleGenerativeAI } from "@google/generative-ai";

// Load API key from environment variable or paste it directly (not recommended for production)
const API_KEY = "AIzaSyAZIki5rowaHUqpFjkwos8oujjHaZLd7iA";

// Initialize the Generative AI
const genAI = new GoogleGenerativeAI(API_KEY);
async function runGeminiPrompt() {
  // Use model from your list, e.g. gemini-2.5-pro
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });

  const prompt = "Explain TypeScript in simple terms";

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini says:", text);
  } catch (err) {
    console.error("Error using Gemini:", err);
  }
}
runGeminiPrompt();
