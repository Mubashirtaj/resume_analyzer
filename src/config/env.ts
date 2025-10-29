import dotenv from "dotenv";
dotenv.config();
export const ENV = {
  PORT: process.env.PORT || 4000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  RAPID_API_KEY: process.env.RAPID_API_KEY || "",
};
