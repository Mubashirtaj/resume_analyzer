import express, { Router } from "express";
import { ResumeSubmit, ResumeGenerate } from "../controller/resume";
import { upload } from "../services/mutler";

const ResumeApps: Router = express.Router();
ResumeApps.post("/upload", upload.single("resume"), ResumeSubmit);
ResumeApps.post("/generate", ResumeGenerate);
export default ResumeApps;
