import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { SEGMENTS } from "./seed-data";
import { SEGMENT_TOOLS, SEGMENT_BUDGET_CONFIGS } from "./seed-tools-budget";

export async function seedDatabase(): Promise<void> {
  const existing = await storage.getSegments();
  if (existing.length > 0) return;

  for (const seg of SEGMENTS) {
    const inserted = await storage.insertSegment({
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
      await storage.insertModule({
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
      for (let i = 0; i < seg.bestPractices.length; i++) {
        const bp = seg.bestPractices[i];
        await storage.insertBestPractice({
          segmentId: inserted.id,
          title: bp.title,
          source: bp.source,
          sourceUrl: bp.sourceUrl || null,
          content: bp.content,
          category: bp.category,
          howTo: (bp as any).howTo || null,
          order: i + 1,
        });
      }
    }

    const segTools = SEGMENT_TOOLS[seg.slug];
    if (segTools) {
      for (let i = 0; i < segTools.length; i++) {
        const tool = segTools[i];
        await storage.insertSegmentTool({
          segmentId: inserted.id,
          name: tool.name,
          type: tool.type,
          url: tool.url,
          description: tool.description,
          pricing: tool.pricing,
          campaigns: JSON.stringify(tool.campaigns),
          order: i + 1,
        });
      }
    }
  }
}

export async function seedUsers(): Promise<void> {
  const count = await storage.getUserCount();
  if (count > 0) return;

  const hashedPassword = await bcrypt.hash("SmaartAdmin2026!", 10);

  await storage.createUser({
    email: "daniel@smaartcompany.com",
    password: hashedPassword,
    name: "Daniel",
    role: "admin",
  });

  await storage.createUser({
    email: "ray@smaartcompany.com",
    password: hashedPassword,
    name: "Ray",
    role: "admin",
  });

  await storage.createUser({
    email: "gus@smaartcompany.com",
    password: hashedPassword,
    name: "Gus",
    role: "member",
  });
}
