import express from "express";
import { ENV } from "./config/env";
import ResumeApps from "./route/resume";
import path from "path";
import cors from "cors";
import cookieSession from "cookie-session";
const app = express();
const PORT = ENV.PORT;
import dotenv from "dotenv";
import "./passport/google"; // Google strategy attach hoti hai
import "./passport/github";
import session from "express-session";
import passport from "./passport/index";
import ResumeOauth from "./route/Oauth";
import cookieParser from "cookie-parser";
import { isAuth } from "./middleware/auth";
import router from "./route/auth";
dotenv.config();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://192.168.100.16:3000", // frontend URL
    credentials: true, // allow cookies
  })
);

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
app.use("/resume", isAuth, ResumeApps);
// app.use(
//   session({
//     secret: process.env.COOKIE_SECRET!,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { maxAge: 24 * 60 * 60 * 1000 },
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());

app.use("/", ResumeOauth);
app.use("/", router);
app.get("/me", (req, res) => {
  res.json(req.user);
});

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.send("Logged Out");
});
app.get("/test-cookie", (req, res) => {
  res.send("Cookie set");
});

app.use(cookieParser());
app.listen(PORT, "0.0.0.0", () => {
  console.log(`your server is successfully run at port ${PORT}`);
});
