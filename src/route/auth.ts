import express, { Router } from "express";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
} from "../utils/jwt";
import { prisma } from "../config/prisma-client";

const router: Router = express.Router();

router.post("/auth/refresh_token", async (req, res) => {
  const token = req.cookies?.jid; // refresh token stored in httpOnly cookie
  console.log("refresh " + token);

  if (!token) return res.send({ success: false, accessToken: "" });

  const payload: any = verifyRefreshToken(token);
  if (!payload) return res.send({ success: false, accessToken: "" });

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.refreshToken !== token)
    return res.send({ success: false, accessToken: "" });

  const newAccessToken = createAccessToken({ id: user.id });
  const newRefreshToken = createRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  res.cookie("jid", newRefreshToken, {
    httpOnly: true,
    path: "/",
  });

  res.send({ success: true, accessToken: newAccessToken });
});

export default router;
