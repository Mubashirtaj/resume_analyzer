import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

export const isAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1️⃣ Try cookie first, then header
  const token = req.cookies?.atk || req.headers["authorization"]?.split(" ")[1];
  // console.log("this is token" + token);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No access token provided" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  req.user = payload;
  next();
};
