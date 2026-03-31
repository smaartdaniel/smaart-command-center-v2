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
  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { id } = req.query;
  const numId = parseInt(Array.isArray(id) ? id[0] : id as string);
  if (isNaN(numId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  if (req.method === "PATCH") {
    const updated = await storage.updateTask(numId, req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    await recalculateModuleProgress(updated.moduleId);
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const deleted = await storage.deleteTask(numId);
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    await recalculateModuleProgress(deleted.moduleId);
    return res.json({ success: true });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
