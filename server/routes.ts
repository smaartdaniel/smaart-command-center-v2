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

  const { generateDefaultPassword, hashPassword } = await import("@shared/password-utils");

  const accounts = [
    { email: "daniel@smaartcompany.com", name: "Daniel", role: "admin" },
    { email: "ray@smaartcompany.com", name: "Ray", role: "admin" },
    { email: "gus@smaartcompany.com", name: "Gus", role: "member" },
  ];

  for (const account of accounts) {
    const defaultPw = generateDefaultPassword(account.name);
    const hashed = await hashPassword(defaultPw);
    storage.createUser({
      email: account.email,
      password: hashed,
      name: account.name,
      role: account.role,
      mustChangePassword: "true",
    });
    console.log(`  Seeded: ${account.email} (default password: ${defaultPw})`);
  }
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

  // --- Change password (requires auth) ---
  app.post("/api/auth/change-password", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    const user = storage.getUserById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(403).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    storage.updateUserPassword(user.id, hashed, "false");
    res.json({ message: "Password updated successfully" });
  });

  // --- Forgot password ---
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const successMsg = { message: "If an account with that email exists, a password reset link has been sent." };
    if (!email) return res.json(successMsg);

    try {
      const user = storage.getUserByEmail(email);
      if (!user) return res.json(successMsg);

      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

      // Send email via Resend if configured
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const appUrl = process.env.APP_URL || "http://localhost:5000";
        const resetUrl = `${appUrl}/#/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "SMAART Command Center <noreply@smaartcompany.com>",
          to: email,
          subject: "Reset your SMAART Command Center password",
          html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;"><h2 style="color:#0f172a;">Password Reset Request</h2><p style="color:#475569;line-height:1.6;">Click the button below to reset your password for SMAART Command Center.</p><a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;margin:24px 0;font-weight:500;">Reset Password</a><p style="color:#94a3b8;font-size:14px;">This link expires in 1 hour.</p></div>`,
        });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
    }
    res.json(successMsg);
  });

  // --- Reset password ---
  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: "Token, email, and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const user = storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    const tokens = storage.getValidResetTokens(user.id);
    let validTokenId: number | null = null;
    for (const stored of tokens) {
      const isMatch = await bcrypt.compare(token, stored.tokenHash);
      if (isMatch) { validTokenId = stored.id; break; }
    }
    if (!validTokenId) return res.status(400).json({ message: "Invalid or expired reset link" });

    const hashed = await bcrypt.hash(newPassword, 10);
    storage.updateUserPassword(user.id, hashed, "false");
    storage.markTokenUsed(validTokenId);
    res.json({ message: "Password has been reset successfully" });
  });

  // --- Admin: list users ---
  app.get("/api/admin/users", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const currentUser = storage.getUserById(req.session.userId);
    if (!currentUser || currentUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const allUsers = storage.getAllUsers().map(({ password: _pw, ...u }) => u);
    res.json(allUsers);
  });

  // --- Admin: reset user password ---
  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const currentUser = storage.getUserById(req.session.userId);
    if (!currentUser || currentUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const targetId = parseInt(req.params.id);
    const target = storage.getUserById(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const { generateDefaultPassword, hashPassword } = await import("@shared/password-utils");
    const firstName = target.name.split(" ")[0];
    const defaultPassword = generateDefaultPassword(firstName);
    const hashed = await hashPassword(defaultPassword);
    storage.updateUserPassword(target.id, hashed, "true");

    res.json({ message: "Password has been reset", defaultPassword });
  });

  // --- Auth middleware for all other API routes ---
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    // Allow auth routes to pass through (already handled above)
    if (req.path.startsWith("/auth/") || req.path.startsWith("/admin/")) {
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
