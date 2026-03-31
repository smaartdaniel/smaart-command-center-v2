import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.method === "GET") {
    const websites = await storage.getWebsites();
    return res.json(websites);
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const website = await storage.createWebsite(body);
      return res.status(201).json(website);
    } catch (err: any) {
      console.error("Create website error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
