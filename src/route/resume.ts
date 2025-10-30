import express, { Router } from "express";
import {
  ResumeSubmit,
  ResumeGenerate,
  getJobs,
  Conversation,
} from "../controller/resume";
import { upload } from "../services/mutler";

const ResumeApps: Router = express.Router();
ResumeApps.post("/upload", upload.single("resume"), ResumeSubmit);
ResumeApps.post("/generate", ResumeGenerate);
ResumeApps.get("/conversation/:id", Conversation);
ResumeApps.post("/jobs", upload.single("resume"), getJobs);
export default ResumeApps;
