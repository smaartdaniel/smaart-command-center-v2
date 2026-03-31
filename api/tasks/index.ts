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

async function recalculateModuleProgress(moduleId: number): Promise<void> {
  const moduleTasks = await storage.getTasksByModule(moduleId);
  if (moduleTasks.length === 0) {
    const mod = await storage.updateModule(moduleId, { progress: 0, status: "not_started" });
    if (mod) await recalculateProgress(mod.segmentId);
    return;
  }
  const completed = moduleTasks.filter(t => t.status === "completed").length;
  const progress = Math.round((completed / moduleTasks.length) * 100);
  const status = progress === 100 ? "active" : progress > 0 ? "in_progress" : "not_started";
  const mod = await storage.updateModule(moduleId, { progress, status });
  if (mod) {
    await recalculateProgress(mod.segmentId);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const task = await storage.createTask(req.body);
  await recalculateModuleProgress(task.moduleId);
  return res.status(201).json(task);
}
