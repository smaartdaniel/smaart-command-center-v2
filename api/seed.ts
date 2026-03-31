import type { VercelRequest, VercelResponse } from "@vercel/node";
import { seedDatabase, seedUsers } from "./_lib/seed";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await seedDatabase();
    await seedUsers();
    return res.json({ success: true, message: "Seed complete" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Seed failed" });
  }
}
