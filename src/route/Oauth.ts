import express, { Router } from "express";

const ResumeOauth: Router = express.Router();
import passport from "../passport/index";
import { prisma } from "../config/prisma-client";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
import { use } from "passport";
import { AuthRequest, isAuth } from "../middleware/auth";
import { ref } from "process";
import cookieParser from "cookie-parser";

ResumeOauth.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

ResumeOauth.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user: any = req.user;
    prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: user.refreshToken },
    });
    const accessToken = createAccessToken({
      id: user.id,
      name: user.name,
      profileimg: user.profileimg,
    });
    const refreshToken = createRefreshToken({ id: user.id });

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(
      `http://192.168.100.16:3000/authcheck?accessToken=${accessToken}`
    );
  }
);

ResumeOauth.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

ResumeOauth.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  async (req, res) => {
    const user: any = req.user;

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: user.refreshToken },
    });

    res.cookie("jid", user.refreshToken, {
      httpOnly: true,
      path: "/refresh_token",
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("atk", user.accessToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    return res.redirect(
      `http://192.168.100.16:3000/authcheck?accessToken=${user.accessToken}&refreshToken=${user.refreshToken}`
    );
  }
);

ResumeOauth.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };
  const hash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "Email already exists" };
    }

    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hash,
        provider: "email",
        Isverified: true,
        profileimg: "/defaultimage.png",
      },
    });
    console.log(result);

    return { success: true, user: newUser };
  });

  if (!result.success) {
    return res.json({ success: false, message: result.message });
  }

  return res.json({ success: true, message: "Your Signup Successfully" });
});

ResumeOauth.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email aur password zaruri hain" });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password)
      return res.status(404).json({ message: "User Doesn't Exist" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ message: "Galat password" });

    const accessToken = createAccessToken({
      id: user.id,
      name: user.name,
      profileimg: user.profileimg,
    });

    const refreshToken = createRefreshToken({ id: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: true, // ✅ because ngrok is HTTPS
      sameSite: "none", // ✅ allows cookies across origins
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("atk", accessToken, {
      httpOnly: true,
      secure: true, // ✅ because ngrok is HTTPS
      sameSite: "none", // ✅ allows cookies across origins
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileimg: user.profileimg,
      },
    });
  } catch (err) {
    console.error("Signin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

ResumeOauth.post("/auth/check", isAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileimg: true,
        provider: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default ResumeOauth;
