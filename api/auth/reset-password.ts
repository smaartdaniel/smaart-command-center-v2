import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../_lib/storage";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { token, email, newPassword } = body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: "Token, email, and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    const tokens = await storage.getValidResetTokens(user.id);
    let validTokenId: number | null = null;
    for (const stored of tokens) {
      const isMatch = await bcrypt.compare(token, stored.tokenHash);
      if (isMatch) { validTokenId = stored.id; break; }
    }
    if (!validTokenId) return res.status(400).json({ message: "Invalid or expired reset link" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(user.id, hashed, "false");
    await storage.markTokenUsed(validTokenId);
    res.json({ message: "Password has been reset successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}
