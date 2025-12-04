import express, { Router } from "express";

const ResumeOauth: Router = express.Router();
import passport from "../passport/index";
import { prisma } from "../config/prisma-client";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "../utils/jwt";

import { AuthRequest, isAuth } from "../middleware/auth";
import { sendOtpMail } from "../services/mailer";

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
      `http://localhost:3000/authcheck?accessToken=${accessToken}`
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
      `http://localhost:3000/authcheck?accessToken=${user.accessToken}&refreshToken=${user.refreshToken}`
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

  // Generate Random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email } });

    if (existingUser) {
      return { success: false, message: "Email already exists" };
    }

    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hash,
        provider: "email",
        Isverified: false, 
        profileimg: "/defaultimage.png",
        OTP:otp,
      },
    });

    console.log("New User Created:", newUser);
    return { success: true, user: newUser };
  });

  console.log("Transaction Result:", result);

  if (!result.success) {
    return res.json({ success: false, message: result.message });
  }

  try {
    await sendOtpMail(email, name, otp);
  } catch (err) {
    console.error("Email send error:", err);
    return res.json({
      success: false,
      message: "User created but failed to send verification email",
    });
  }

  return res.json({
    id:result.user?.id,
    email:result.user?.email,
    success: true,
    message: "Signup successful! Please check your email for the OTP.",
  });
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
      secure: false, // ✅ because ngrok is HTTPS
      sameSite: "lax", // ✅ allows cookies across origins
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

ResumeOauth.post("/user/update-profile", isAuth, async (req: AuthRequest, res) => {
  console.log("recieved");
  
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, geminiKey,   geminiModel, password, provider } = req.body;

    // Validation
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (name && name.trim().length > 100) {
      errors.push("Name must be less than 100 characters");
    }

    if (geminiKey && geminiKey.length > 500) {
      errors.push("Gemini API key is too long");
    }

    if (password && password.length < 6 && password !== 'Change Password') {
      errors.push("Password must be at least 6 characters long");
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed",
        errors 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: req.user?.id },
    });

    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      ...(geminiKey !== undefined && { 
        geminkey: geminiKey === 'Not Have' || geminiKey === '' ? null : geminiKey 
      }),
      ...(geminiModel && { geminimodel: geminiModel }),
      ...(provider && { provider }),
    };

    // Handle password update
    if (password && password !== 'Change Password' && password !== '••••••••••') {
      // In a real application, you should hash the password
      // const bcrypt = require('bcrypt');
      // const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = password; // Replace with hashed password in production
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profileimg: true,
        provider: true,
        geminimodel: true,
        geminkey: true,
        credits: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        geminkey: updatedUser.geminkey ? '••••••••••' : null
      }
    });

  } catch (error:any) {
    console.error("Profile update error:", error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});
ResumeOauth.post("/auth/verify", async (req, res) => {
  const { id, otp } = req.body as {
    id: string;
    otp: number;
  };
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { id },
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.Isverified) {
      return res.json({ success: true, message: "User already verified" });
    }

    if (user.OTP !== Number(otp)) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id },
      data: { Isverified: true, OTP: null },
    });
const accessToken = createAccessToken({
      id: user.id,
      name: user.name,
      profileimg: user.profileimg,
    });

    const refreshToken = createRefreshToken({ id: user.id });
       res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false, // ✅ because ngrok is HTTPS
      sameSite: "lax", // ✅ allows cookies across origins
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
   
    
    return res.json({
      accessToken,
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Verification failed" });
  }
});
ResumeOauth.post("/auth/resend-otp", async (req, res) => {
  const { id } = req.body as { id: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.Isverified) {
      return res.json({ success: false, message: "User already verified" });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);

    // Update OTP
    await prisma.user.update({
      where: { id },
      data: { OTP: newOtp },
    });

    await sendOtpMail(user.email, user.name, newOtp);

    return res.json({
      success: true,
      message: "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
});

export default ResumeOauth;
