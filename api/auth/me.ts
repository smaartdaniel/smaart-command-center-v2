import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, verifyToken } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { userId } = verifyToken(token);
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _pw, ...safeUser } = user;
    return res.json(safeUser);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
