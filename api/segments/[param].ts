import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { param } = req.query;
  const paramStr = Array.isArray(param) ? param[0] : param;

  if (!paramStr) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  if (req.method === "GET") {
    // GET by slug
    const seg = await storage.getSegmentBySlug(paramStr);
    if (!seg) return res.status(404).json({ error: "Segment not found" });

    const mods = await storage.getModulesBySegment(seg.id);
    const bps = await storage.getBestPracticesBySegment(seg.id);

    // Auto-create default tasks for modules that have defaultTasks but no tasks yet
    for (const mod of mods) {
      if (mod.defaultTasks) {
        const existingTasks = await storage.getTasksByModule(mod.id);
        if (existingTasks.length === 0) {
          try {
            const taskTitles: string[] = JSON.parse(mod.defaultTasks);
            for (let i = 0; i < taskTitles.length; i++) {
              await storage.createTask({
                moduleId: mod.id,
                segmentId: seg.id,
                title: taskTitles[i],
                status: "pending",
                priority: "medium",
                order: i + 1,
              });
            }
          } catch {
            // Skip if defaultTasks is not valid JSON
          }
        }
      }
    }

    const segTasks = await storage.getTasksBySegment(seg.id);

    const modulesWithTasks = mods.map((mod) => ({
      ...mod,
      tasks: segTasks.filter((t) => t.moduleId === mod.id),
    }));

    const tools = await storage.getToolsBySegment(seg.id);
    const budgetConfig = seg.budgetConfig ? JSON.parse(seg.budgetConfig) : null;

    return res.json({ ...seg, modules: modulesWithTasks, bestPractices: bps, tools, budgetConfig });
  }

  if (req.method === "PATCH") {
    // PATCH by numeric id
    const id = parseInt(paramStr);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid segment ID" });
    }
    const updated = await storage.updateSegment(id, req.body);
    if (!updated) return res.status(404).json({ error: "Segment not found" });
    return res.json(updated);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
