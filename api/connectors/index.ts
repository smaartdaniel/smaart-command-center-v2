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
    const { platform, websiteId } = req.query;

    if (platform) {
      const p = Array.isArray(platform) ? platform[0] : platform;
      const connectors = await storage.getConnectorsByPlatform(p);
      return res.json(connectors);
    }

    if (websiteId) {
      const wId = parseInt(Array.isArray(websiteId) ? websiteId[0] : websiteId as string);
      if (isNaN(wId)) return res.status(400).json({ error: "Invalid websiteId" });
      const connectors = await storage.getConnectorsByWebsite(wId);
      return res.json(connectors);
    }

    const connectors = await storage.getConnectors();
    return res.json(connectors);
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const connector = await storage.createConnector(body);
      return res.status(201).json(connector);
    } catch (err: any) {
      console.error("Create connector error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
