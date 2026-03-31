import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../_lib/storage";
import { signToken } from "../_lib/auth";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await storage.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken(user.id);
  const { password: _pw, ...safeUser } = user;
  return res.json({ token, user: safeUser });
}
