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
    origin: ["http://localhost:3000", "http://192.168.100.16:3000"], // frontend URLs
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
app.use(
  session({
    secret: process.env.COOKIE_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", ResumeOauth);
app.use("/", router);
app.get("/me",isAuth, (req, res) => {
  res.json(req.user);
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("jid", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  req.logout(() => {});
  res.send("Logged Out");
});


app.use(cookieParser());
app.listen(PORT, () => {
  console.log(`your server is successfully run at port ${PORT}`);
});
