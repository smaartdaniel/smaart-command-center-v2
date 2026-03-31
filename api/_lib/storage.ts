import {
  type Segment, type InsertSegment, segments,
  type Module, type InsertModule, modules,
  type BestPractice, type InsertBestPractice, bestPractices,
  type Task, type InsertTask, tasks,
  type SegmentTool, type InsertSegmentTool, segmentTools,
  type CreativeScore, type InsertCreativeScore, creativeScores,
  type User, type InsertUser, users,
} from "./schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Segments
  getSegments(): Promise<Segment[]>;
  getSegmentBySlug(slug: string): Promise<Segment | undefined>;
  getSegmentById(id: number): Promise<Segment | undefined>;
  updateSegment(id: number, data: Partial<InsertSegment>): Promise<Segment | undefined>;

  // Modules
  getModulesBySegment(segmentId: number): Promise<Module[]>;
  getModuleById(id: number): Promise<Module | undefined>;
  updateModule(id: number, data: Partial<InsertModule>): Promise<Module | undefined>;

  // Best Practices
  getBestPracticesBySegment(segmentId: number): Promise<BestPractice[]>;

  // Tasks
  getTasksByModule(moduleId: number): Promise<Task[]>;
  getTasksBySegment(segmentId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;

  // Stats
  getStats(): Promise<{
    totalSegments: number;
    activeModules: number;
    totalModules: number;
    completedTasks: number;
    totalTasks: number;
    averageProgress: number;
  }>;

  // Segment Tools
  getToolsBySegment(segmentId: number): Promise<SegmentTool[]>;
  insertSegmentTool(t: InsertSegmentTool): Promise<SegmentTool>;

  // Creative Scores
  saveCreativeScore(score: InsertCreativeScore): Promise<CreativeScore>;
  getLatestCreativeScore(): Promise<CreativeScore | undefined>;

  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserCount(): Promise<number>;

  // Seed
  insertSegment(s: InsertSegment): Promise<Segment>;
  insertModule(m: InsertModule): Promise<Module>;
  insertBestPractice(bp: InsertBestPractice): Promise<BestPractice>;
}

export class DatabaseStorage implements IStorage {
  async getSegments(): Promise<Segment[]> {
    return await db.select().from(segments).orderBy(segments.order);
  }

  async getSegmentBySlug(slug: string): Promise<Segment | undefined> {
    return await db.select().from(segments).where(eq(segments.slug, slug)).then(r => r[0]);
  }

  async getSegmentById(id: number): Promise<Segment | undefined> {
    return await db.select().from(segments).where(eq(segments.id, id)).then(r => r[0]);
  }

  async updateSegment(id: number, data: Partial<InsertSegment>): Promise<Segment | undefined> {
    return await db.update(segments).set(data).where(eq(segments.id, id)).returning().then(r => r[0]);
  }

  async getModulesBySegment(segmentId: number): Promise<Module[]> {
    return await db.select().from(modules).where(eq(modules.segmentId, segmentId)).orderBy(modules.order);
  }

  async getModuleById(id: number): Promise<Module | undefined> {
    return await db.select().from(modules).where(eq(modules.id, id)).then(r => r[0]);
  }

  async updateModule(id: number, data: Partial<InsertModule>): Promise<Module | undefined> {
    return await db.update(modules).set(data).where(eq(modules.id, id)).returning().then(r => r[0]);
  }

  async getBestPracticesBySegment(segmentId: number): Promise<BestPractice[]> {
    return await db.select().from(bestPractices).where(eq(bestPractices.segmentId, segmentId)).orderBy(bestPractices.order);
  }

  async getTasksByModule(moduleId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.moduleId, moduleId)).orderBy(tasks.order);
  }

  async getTasksBySegment(segmentId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.segmentId, segmentId)).orderBy(tasks.order);
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async createTask(task: InsertTask): Promise<Task> {
    return await db.insert(tasks).values(task).returning().then(r => r[0]);
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    return await db.update(tasks).set(data).where(eq(tasks.id, id)).returning().then(r => r[0]);
  }

  async deleteTask(id: number): Promise<Task | undefined> {
    return await db.delete(tasks).where(eq(tasks.id, id)).returning().then(r => r[0]);
  }

  async getStats() {
    const allSegments = await this.getSegments();
    const allModules = await db.select().from(modules);
    const allTasks = await this.getAllTasks();

    const activeModules = allModules.filter(m => m.status !== "not_started").length;
    const completedTasks = allTasks.filter(t => t.status === "completed").length;
    const averageProgress = allSegments.length > 0
      ? Math.round(allSegments.reduce((acc, s) => acc + s.progress, 0) / allSegments.length)
      : 0;

    return {
      totalSegments: allSegments.length,
      activeModules,
      totalModules: allModules.length,
      completedTasks,
      totalTasks: allTasks.length,
      averageProgress,
    };
  }

  async insertSegment(s: InsertSegment): Promise<Segment> {
    return await db.insert(segments).values(s).returning().then(r => r[0]);
  }

  async insertModule(m: InsertModule): Promise<Module> {
    return await db.insert(modules).values(m).returning().then(r => r[0]);
  }

  async insertBestPractice(bp: InsertBestPractice): Promise<BestPractice> {
    return await db.insert(bestPractices).values(bp).returning().then(r => r[0]);
  }

  async getToolsBySegment(segmentId: number): Promise<SegmentTool[]> {
    return await db.select().from(segmentTools).where(eq(segmentTools.segmentId, segmentId)).orderBy(segmentTools.order);
  }

  async insertSegmentTool(t: InsertSegmentTool): Promise<SegmentTool> {
    return await db.insert(segmentTools).values(t).returning().then(r => r[0]);
  }

  async saveCreativeScore(score: InsertCreativeScore): Promise<CreativeScore> {
    return await db.insert(creativeScores).values(score).returning().then(r => r[0]);
  }

  async getLatestCreativeScore(): Promise<CreativeScore | undefined> {
    return await db.select().from(creativeScores).orderBy(sql`id DESC`).limit(1).then(r => r[0]);
  }

  async createUser(user: InsertUser): Promise<User> {
    return await db.insert(users).values({
      ...user,
      createdAt: new Date().toISOString(),
    } as any).returning().then(r => r[0]);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await db.select().from(users).where(eq(users.email, email)).then(r => r[0]);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return await db.select().from(users).where(eq(users.id, id)).then(r => r[0]);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).then(r => r[0]);
    return result?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
