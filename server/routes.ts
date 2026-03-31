import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { segments, modules, bestPractices, segmentTools } from "@shared/schema";
import { SEGMENTS } from "./seed-data";
import { SEGMENT_TOOLS, SEGMENT_BUDGET_CONFIGS } from "./seed-tools-budget";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

function seedDatabase() {
  // Check if already seeded
  const existing = db.select().from(segments).all();
  if (existing.length > 0) return;

  for (const seg of SEGMENTS) {
    const inserted = storage.insertSegment({
      name: seg.name,
      slug: seg.slug,
      icon: seg.icon,
      description: seg.description,
      category: seg.category,
      status: seg.status as any,
      progress: seg.progress,
      order: seg.order,
      budgetConfig: SEGMENT_BUDGET_CONFIGS[seg.slug] ? JSON.stringify(SEGMENT_BUDGET_CONFIGS[seg.slug]) : null,
    });

    for (const mod of seg.modules) {
      storage.insertModule({
        segmentId: inserted.id,
        name: mod.name,
        slug: mod.slug,
        icon: mod.icon,
        description: mod.description,
        status: "not_started",
        progress: 0,
        order: mod.order,
        guide: (mod as any).guide || null,
        defaultTasks: (mod as any).defaultTasks || null,
      });
    }

    if (seg.bestPractices) {
      seg.bestPractices.forEach((bp, i) => {
        storage.insertBestPractice({
          segmentId: inserted.id,
          title: bp.title,
          source: bp.source,
          sourceUrl: bp.sourceUrl || null,
          content: bp.content,
          category: bp.category,
          howTo: (bp as any).howTo || null,
          order: i + 1,
        });
      });
    }

    const segTools = SEGMENT_TOOLS[seg.slug];
    if (segTools) {
      segTools.forEach((tool, i) => {
        storage.insertSegmentTool({
          segmentId: inserted.id,
          name: tool.name,
          type: tool.type,
          url: tool.url,
          description: tool.description,
          pricing: tool.pricing,
          campaigns: JSON.stringify(tool.campaigns),
          order: i + 1,
        });
      });
    }
  }
}

async function seedUsers() {
  const count = storage.getUserCount();
  if (count > 0) return;

  const hashedPassword = await bcrypt.hash("SmaartAdmin2026!", 10);

  storage.createUser({
    email: "daniel@smaartcompany.com",
    password: hashedPassword,
    name: "Daniel",
    role: "admin",
  });

  storage.createUser({
    email: "ray@smaartcompany.com",
    password: hashedPassword,
    name: "Ray",
    role: "admin",
  });

  storage.createUser({
    email: "gus@smaartcompany.com",
    password: hashedPassword,
    name: "Gus",
    role: "member",
  });
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function recalculateProgress(segmentId: number) {
  const mods = storage.getModulesBySegment(segmentId);
  const avgProgress = mods.length > 0
    ? Math.round(mods.reduce((acc, m) => acc + m.progress, 0) / mods.length)
    : 0;
  storage.updateSegment(segmentId, { progress: avgProgress });
}

function recalculateModuleProgress(moduleId: number) {
  const moduleTasks = storage.getTasksByModule(moduleId);
  if (moduleTasks.length === 0) {
    const mod = storage.updateModule(moduleId, { progress: 0, status: "not_started" });
    if (mod) recalculateProgress(mod.segmentId);
    return;
  }
  const completed = moduleTasks.filter(t => t.status === "completed").length;
  const progress = Math.round((completed / moduleTasks.length) * 100);
  const status = progress === 100 ? "active" : progress > 0 ? "in_progress" : "not_started";
  const mod = storage.updateModule(moduleId, { progress, status });
  if (mod) {
    recalculateProgress(mod.segmentId);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed on startup
  seedDatabase();
  await seedUsers();

  // --- Auth routes (unprotected) ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.session.userId = user.id;
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // First user becomes admin automatically; subsequent registrations require admin
    const userCount = storage.getUserCount();
    if (userCount > 0) {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const currentUser = storage.getUserById(req.session.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create users" });
      }
    }

    const existing = storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = storage.createUser({
      email,
      password: hashedPassword,
      name,
      role: userCount === 0 ? "admin" : (role || "member"),
    });

    const { password: _pw, ...safeUser } = user;
    res.status(201).json(safeUser);
  });

  // --- Auth middleware for all other API routes ---
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    // Allow auth routes to pass through (already handled above)
    if (req.path.startsWith("/auth/")) {
      return next();
    }
    return requireAuth(req, res, next);
  });

  // GET all segments with module count
  app.get("/api/segments", (_req, res) => {
    const segs = storage.getSegments();
    const result = segs.map(seg => {
      const mods = storage.getModulesBySegment(seg.id);
      return { ...seg, moduleCount: mods.length };
    });
    res.json(result);
  });

  // GET single segment with modules, best practices, tasks
  app.get("/api/segments/:slug", (req, res) => {
    const seg = storage.getSegmentBySlug(req.params.slug);
    if (!seg) return res.status(404).json({ error: "Segment not found" });

    const mods = storage.getModulesBySegment(seg.id);
    const bps = storage.getBestPracticesBySegment(seg.id);

    // Auto-create default tasks for modules that have defaultTasks but no tasks yet
    for (const mod of mods) {
      if (mod.defaultTasks) {
        const existingTasks = storage.getTasksByModule(mod.id);
        if (existingTasks.length === 0) {
          try {
            const taskTitles: string[] = JSON.parse(mod.defaultTasks);
            taskTitles.forEach((title, i) => {
              storage.createTask({
                moduleId: mod.id,
                segmentId: seg.id,
                title,
                status: "pending",
                priority: "medium",
                order: i + 1,
              });
            });
          } catch (e) {
            // Skip if defaultTasks is not valid JSON
          }
        }
      }
    }

    const segTasks = storage.getTasksBySegment(seg.id);

    const modulesWithTasks = mods.map(mod => ({
      ...mod,
      tasks: segTasks.filter(t => t.moduleId === mod.id),
    }));

    const tools = storage.getToolsBySegment(seg.id);
    const budgetConfig = seg.budgetConfig ? JSON.parse(seg.budgetConfig) : null;

    res.json({ ...seg, modules: modulesWithTasks, bestPractices: bps, tools, budgetConfig });
  });

  // PATCH segment
  app.patch("/api/segments/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const updated = storage.updateSegment(id, req.body);
    if (!updated) return res.status(404).json({ error: "Segment not found" });
    res.json(updated);
  });

  // PATCH module
  app.patch("/api/modules/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const updated = storage.updateModule(id, req.body);
    if (!updated) return res.status(404).json({ error: "Module not found" });
    recalculateProgress(updated.segmentId);
    res.json(updated);
  });

  // GET stats
  app.get("/api/stats", (_req, res) => {
    res.json(storage.getStats());
  });

  // POST task
  app.post("/api/tasks", (req, res) => {
    const task = storage.createTask(req.body);
    recalculateModuleProgress(task.moduleId);
    res.status(201).json(task);
  });

  // PATCH task
  app.patch("/api/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const updated = storage.updateTask(id, req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    recalculateModuleProgress(updated.moduleId);
    res.json(updated);
  });

  // POST creative score
  app.post("/api/creative-scores", (req, res) => {
    const { scores, totalScore, segmentId } = req.body;
    const saved = storage.saveCreativeScore({
      segmentId: segmentId || "creative-playbook",
      scores: typeof scores === "string" ? scores : JSON.stringify(scores),
      totalScore,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(saved);
  });

  // GET latest creative score
  app.get("/api/creative-scores/latest", (_req, res) => {
    const latest = storage.getLatestCreativeScore();
    if (!latest) return res.json(null);
    res.json(latest);
  });

  // DELETE task
  app.delete("/api/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = storage.deleteTask(id);
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    recalculateModuleProgress(deleted.moduleId);
    res.json({ success: true });
  });

  return httpServer;
}
