import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test 1: basic
    const tests: Record<string, string> = { basic: "ok" };

    // Test 2: neon
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql`SELECT 1 as test`;
      tests.neon = `ok: ${JSON.stringify(result)}`;
    } catch (e: any) {
      tests.neon = `error: ${e.message}`;
    }

    // Test 3: bcrypt
    try {
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash("test", 10);
      tests.bcrypt = `ok: ${hash.substring(0, 10)}...`;
    } catch (e: any) {
      tests.bcrypt = `error: ${e.message}`;
    }

    // Test 4: jsonwebtoken
    try {
      const jwt = await import("jsonwebtoken");
      const token = jwt.default.sign({ test: true }, "secret");
      tests.jwt = `ok: ${token.substring(0, 20)}...`;
    } catch (e: any) {
      tests.jwt = `error: ${e.message}`;
    }

    // Test 5: schema import
    try {
      const schema = await import("../shared/schema");
      tests.schema = `ok: tables=${Object.keys(schema).filter(k => !k.startsWith("insert") && !k.startsWith("_")).length}`;
    } catch (e: any) {
      tests.schema = `error: ${e.message}`;
    }

    // Test 6: storage
    try {
      const { storage } = await import("./_lib/storage");
      const segments = await storage.getSegments();
      tests.storage = `ok: ${segments.length} segments`;
    } catch (e: any) {
      tests.storage = `error: ${e.message}`;
    }

    return res.json(tests);
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
