import express, { Router } from "express";
import { ResumeSubmit } from "../controller/resume";
import { upload } from "../services/mutler";

const ResumeApps: Router = express.Router();
ResumeApps.post("/upload", upload.single("resume"), ResumeSubmit);

export default ResumeApps;
