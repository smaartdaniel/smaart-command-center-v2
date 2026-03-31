import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

async function recalculateProgress(segmentId: number): Promise<void> {
  const mods = await storage.getModulesBySegment(segmentId);
  const avgProgress = mods.length > 0
    ? Math.round(mods.reduce((acc, m) => acc + m.progress, 0) / mods.length)
    : 0;
  await storage.updateSegment(segmentId, { progress: avgProgress });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { id } = req.query;
  const numId = parseInt(Array.isArray(id) ? id[0] : id as string);
  if (isNaN(numId)) {
    return res.status(400).json({ error: "Invalid module ID" });
  }

  const updated = await storage.updateModule(numId, req.body);
  if (!updated) return res.status(404).json({ error: "Module not found" });

  await recalculateProgress(updated.segmentId);
  return res.json(updated);
}
