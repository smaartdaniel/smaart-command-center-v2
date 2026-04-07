import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../_lib/storage";
import { requireAuth } from "../../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  try {
    const user = await requireAuth(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const allUsers = (await storage.getAllUsers()).map(({ password: _pw, ...u }) => u);
    res.json(allUsers);
  } catch (err: any) {
    if (err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}
