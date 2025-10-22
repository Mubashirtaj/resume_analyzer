import { pdfToText } from "pdf-ts";
import fs from "fs/promises"; // For reading the PDF file
// import path from "path";

export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // const filePath1 = path.join(__dirname, "../public", filePath);

    const pdfBuffer = await fs.readFile(filePath);
    const extractedText = await pdfToText(pdfBuffer);
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}
