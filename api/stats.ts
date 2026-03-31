import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth";
import { storage } from "./_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const stats = await storage.getStats();
  return res.json(stats);
}
