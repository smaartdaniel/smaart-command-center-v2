import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../_lib/storage";
import { requireAuth } from "../_lib/auth";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const user = await requireAuth(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(403).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(user.id, hashed, "false");
    res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    if (err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}
