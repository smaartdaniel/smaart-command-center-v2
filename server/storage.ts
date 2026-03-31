import {
  type Segment, type InsertSegment, segments,
  type Module, type InsertModule, modules,
  type BestPractice, type InsertBestPractice, bestPractices,
  type Task, type InsertTask, tasks,
  type SegmentTool, type InsertSegmentTool, segmentTools,
  type CreativeScore, type InsertCreativeScore, creativeScores,
  type User, type InsertUser, users,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, sql, and } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    budget_config TEXT
  );
  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    guide TEXT,
    default_tasks TEXT
  );
  CREATE TABLE IF NOT EXISTS best_practices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    how_to TEXT,
    "order" INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    segment_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    owner TEXT,
    "order" INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS segment_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    pricing TEXT NOT NULL,
    campaigns TEXT NOT NULL,
    "order" INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS creative_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id TEXT NOT NULL DEFAULT 'creative-playbook',
    scores TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  // Segments
  getSegments(): Segment[];
  getSegmentBySlug(slug: string): Segment | undefined;
  getSegmentById(id: number): Segment | undefined;
  updateSegment(id: number, data: Partial<InsertSegment>): Segment | undefined;

  // Modules
  getModulesBySegment(segmentId: number): Module[];
  getModuleById(id: number): Module | undefined;
  updateModule(id: number, data: Partial<InsertModule>): Module | undefined;

  // Best Practices
  getBestPracticesBySegment(segmentId: number): BestPractice[];

  // Tasks
  getTasksByModule(moduleId: number): Task[];
  getTasksBySegment(segmentId: number): Task[];
  createTask(task: InsertTask): Task;
  updateTask(id: number, data: Partial<InsertTask>): Task | undefined;
  deleteTask(id: number): Task | undefined;
  getAllTasks(): Task[];

  // Stats
  getStats(): {
    totalSegments: number;
    activeModules: number;
    totalModules: number;
    completedTasks: number;
    totalTasks: number;
    averageProgress: number;
  };

  // Segment Tools
  getToolsBySegment(segmentId: number): SegmentTool[];
  insertSegmentTool(t: InsertSegmentTool): SegmentTool;

  // Creative Scores
  saveCreativeScore(score: InsertCreativeScore): CreativeScore;
  getLatestCreativeScore(): CreativeScore | undefined;

  // Users
  createUser(user: InsertUser): User;
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  getUserCount(): number;

  // Seed
  insertSegment(s: InsertSegment): Segment;
  insertModule(m: InsertModule): Module;
  insertBestPractice(bp: InsertBestPractice): BestPractice;
}

export class DatabaseStorage implements IStorage {
  getSegments(): Segment[] {
    return db.select().from(segments).orderBy(segments.order).all();
  }

  getSegmentBySlug(slug: string): Segment | undefined {
    return db.select().from(segments).where(eq(segments.slug, slug)).get();
  }

  getSegmentById(id: number): Segment | undefined {
    return db.select().from(segments).where(eq(segments.id, id)).get();
  }

  updateSegment(id: number, data: Partial<InsertSegment>): Segment | undefined {
    return db.update(segments).set(data).where(eq(segments.id, id)).returning().get();
  }

  getModulesBySegment(segmentId: number): Module[] {
    return db.select().from(modules).where(eq(modules.segmentId, segmentId)).orderBy(modules.order).all();
  }

  getModuleById(id: number): Module | undefined {
    return db.select().from(modules).where(eq(modules.id, id)).get();
  }

  updateModule(id: number, data: Partial<InsertModule>): Module | undefined {
    return db.update(modules).set(data).where(eq(modules.id, id)).returning().get();
  }

  getBestPracticesBySegment(segmentId: number): BestPractice[] {
    return db.select().from(bestPractices).where(eq(bestPractices.segmentId, segmentId)).orderBy(bestPractices.order).all();
  }

  getTasksByModule(moduleId: number): Task[] {
    return db.select().from(tasks).where(eq(tasks.moduleId, moduleId)).orderBy(tasks.order).all();
  }

  getTasksBySegment(segmentId: number): Task[] {
    return db.select().from(tasks).where(eq(tasks.segmentId, segmentId)).orderBy(tasks.order).all();
  }

  getAllTasks(): Task[] {
    return db.select().from(tasks).all();
  }

  createTask(task: InsertTask): Task {
    return db.insert(tasks).values(task).returning().get();
  }

  updateTask(id: number, data: Partial<InsertTask>): Task | undefined {
    return db.update(tasks).set(data).where(eq(tasks.id, id)).returning().get();
  }

  deleteTask(id: number): Task | undefined {
    return db.delete(tasks).where(eq(tasks.id, id)).returning().get();
  }

  getStats() {
    const allSegments = this.getSegments();
    const allModules = db.select().from(modules).all();
    const allTasks = this.getAllTasks();

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

  insertSegment(s: InsertSegment): Segment {
    return db.insert(segments).values(s).returning().get();
  }

  insertModule(m: InsertModule): Module {
    return db.insert(modules).values(m).returning().get();
  }

  insertBestPractice(bp: InsertBestPractice): BestPractice {
    return db.insert(bestPractices).values(bp).returning().get();
  }

  getToolsBySegment(segmentId: number): SegmentTool[] {
    return db.select().from(segmentTools).where(eq(segmentTools.segmentId, segmentId)).orderBy(segmentTools.order).all();
  }

  insertSegmentTool(t: InsertSegmentTool): SegmentTool {
    return db.insert(segmentTools).values(t).returning().get();
  }

  saveCreativeScore(score: InsertCreativeScore): CreativeScore {
    return db.insert(creativeScores).values(score).returning().get();
  }

  getLatestCreativeScore(): CreativeScore | undefined {
    return db.select().from(creativeScores).orderBy(sql`id DESC`).limit(1).get();
  }

  createUser(user: InsertUser): User {
    return db.insert(users).values({
      ...user,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserCount(): number {
    const result = db.select({ count: sql<number>`count(*)` }).from(users).get();
    return result?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
