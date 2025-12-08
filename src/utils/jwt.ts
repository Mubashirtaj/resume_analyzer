import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ENC_SECRET = process.env.ENC_SECRET! || "Mubi";

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENC_SECRET),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENC_SECRET),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function createAccessToken(payload: object) {

  
  const encrypted = encrypt(JSON.stringify(payload));
  return jwt.sign({ data: encrypted }, ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
}
export function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
    const decrypted = decrypt(decoded.data);
   
    
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export function createRefreshToken(payload: object) {
  const encrypted = encrypt(JSON.stringify(payload));
  return jwt.sign({ data: encrypted }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}
export function verifyRefreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
    const decrypted = decrypt(decoded.data);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
