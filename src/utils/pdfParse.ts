// src/utils/pdfParse.ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const pdfParse = require("pdf-parse"); // <-- Correct way in NodeNext

export default pdfParse;
