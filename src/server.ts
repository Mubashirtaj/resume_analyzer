import express from "express";
import { ENV } from "./config/env";
import ResumeApps from "./route/resume";
import path from "path";
const app = express();
const PORT = ENV.PORT;
app.use(express.static(path.join(__dirname, "app")));
app.use("/public", express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});
app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "create.html"));
});
app.use("/resume", ResumeApps);

app.listen(PORT, () => {
  console.log(`your server is successfully run at port ${PORT}`);
});
