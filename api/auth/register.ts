import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../_lib/storage";
import { signToken, extractToken, verifyToken } from "../_lib/auth";
import bcrypt from "bcryptjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, password, and name are required" });
  }

  // First user becomes admin automatically; subsequent registrations require admin
  const userCount = await storage.getUserCount();
  if (userCount > 0) {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { userId } = verifyToken(token);
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create users" });
      }
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  const existing = await storage.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "User with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await storage.createUser({
    email,
    password: hashedPassword,
    name,
    role: userCount === 0 ? "admin" : (role || "member"),
  });

  const token = signToken(user.id);
  const { password: _pw, ...safeUser } = user;
  return res.status(201).json({ token, user: safeUser });
}
