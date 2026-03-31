import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { scores, totalScore, segmentId } = req.body;
  const saved = await storage.saveCreativeScore({
    segmentId: segmentId || "creative-playbook",
    scores: typeof scores === "string" ? scores : JSON.stringify(scores),
    totalScore,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json(saved);
}
