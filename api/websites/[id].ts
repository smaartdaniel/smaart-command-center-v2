import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { id } = req.query;
  const numId = parseInt(Array.isArray(id) ? id[0] : id as string);
  if (isNaN(numId)) {
    return res.status(400).json({ error: "Invalid website ID" });
  }

  if (req.method === "GET") {
    const website = await storage.getWebsiteById(numId);
    if (!website) return res.status(404).json({ error: "Website not found" });
    const connectors = await storage.getConnectorsByWebsite(numId);
    return res.json({ ...website, connectors });
  }

  if (req.method === "PATCH") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const updated = await storage.updateWebsite(numId, body);
      if (!updated) return res.status(404).json({ error: "Website not found" });
      return res.json(updated);
    } catch (err: any) {
      console.error("Update website error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const deleted = await storage.deleteWebsite(numId);
    if (!deleted) return res.status(404).json({ error: "Website not found" });
    return res.json({ success: true });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
