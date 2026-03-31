import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  order: integer("order").notNull(),
  budgetConfig: text("budget_config"),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  order: integer("order").notNull(),
  guide: text("guide"),
  defaultTasks: text("default_tasks"),
});

export const bestPractices = pgTable("best_practices", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  content: text("content").notNull(),
  category: text("category").notNull(),
  howTo: text("how_to"),
  order: integer("order").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  segmentId: integer("segment_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  owner: text("owner"),
  order: integer("order").notNull(),
});

export const segmentTools = pgTable("segment_tools", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull(),
  pricing: text("pricing").notNull(),
  campaigns: text("campaigns").notNull(), // JSON string array
  order: integer("order").notNull(),
});

export const creativeScores = pgTable("creative_scores", {
  id: serial("id").primaryKey(),
  segmentId: text("segment_id").notNull().default("creative-playbook"),
  scores: text("scores").notNull(),
  totalScore: integer("total_score").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertCreativeScoreSchema = createInsertSchema(creativeScores).omit({ id: true });

export const insertSegmentToolSchema = createInsertSchema(segmentTools).omit({ id: true });
export const insertSegmentSchema = createInsertSchema(segments).omit({ id: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertBestPracticeSchema = createInsertSchema(bestPractices).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type Segment = typeof segments.$inferSelect;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type BestPractice = typeof bestPractices.$inferSelect;
export type InsertBestPractice = z.infer<typeof insertBestPracticeSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SegmentTool = typeof segmentTools.$inferSelect;
export type InsertSegmentTool = z.infer<typeof insertSegmentToolSchema>;
export type CreativeScore = typeof creativeScores.$inferSelect;
export type InsertCreativeScore = z.infer<typeof insertCreativeScoreSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("member"), // "admin" | "member" | "viewer"
  createdAt: text("created_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
