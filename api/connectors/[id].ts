import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

async function testConnection(connector: any): Promise<{ success: boolean; message: string }> {
  const { platform, credentials } = connector;

  if (!credentials || Object.keys(credentials).length === 0) {
    return { success: false, message: "No credentials configured" };
  }

  if (platform === "ghl") {
    try {
      const apiKey = credentials.apiKey || credentials.api_key;
      if (!apiKey) return { success: false, message: "GHL API key missing" };
      const resp = await fetch("https://rest.gohighlevel.com/v1/contacts/?limit=1", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) return { success: true, message: "GHL connection successful" };
      return { success: false, message: `GHL API returned ${resp.status}` };
    } catch (err: any) {
      return { success: false, message: `GHL connection failed: ${err.message}` };
    }
  }

  if (platform === "google_analytics") {
    const propertyId = credentials.propertyId || credentials.property_id;
    if (!propertyId) return { success: false, message: "GA4 property ID missing" };
    const valid = /^\d+$/.test(propertyId.toString());
    if (!valid) return { success: false, message: "Invalid GA4 property ID format (expected numeric)" };
    return { success: true, message: "GA4 property ID format valid" };
  }

  if (platform === "meta") {
    const pixelId = credentials.pixelId || credentials.pixel_id;
    if (!pixelId) return { success: false, message: "Meta pixel ID missing" };
    const valid = /^\d+$/.test(pixelId.toString());
    if (!valid) return { success: false, message: "Invalid Meta pixel ID format (expected numeric)" };
    return { success: true, message: "Meta pixel ID format valid" };
  }

  // Generic: just verify credentials exist
  return { success: true, message: `Credentials present for ${platform}` };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { id } = req.query;
  const numId = parseInt(Array.isArray(id) ? id[0] : id as string);
  if (isNaN(numId)) {
    return res.status(400).json({ error: "Invalid connector ID" });
  }

  if (req.method === "GET") {
    const connector = await storage.getConnectorById(numId);
    if (!connector) return res.status(404).json({ error: "Connector not found" });
    const logs = await storage.getConnectorLogs(numId, 20);
    return res.json({ ...connector, recentLogs: logs });
  }

  if (req.method === "PATCH") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      // Handle action: test
      if (body.action === "test") {
        const connector = await storage.getConnectorById(numId);
        if (!connector) return res.status(404).json({ error: "Connector not found" });
        const result = await testConnection(connector);
        await storage.createConnectorLog({
          connectorId: numId,
          action: "test",
          status: result.success ? "success" : "error",
          message: result.message,
        });
        if (result.success) {
          await storage.updateConnector(numId, { status: "active", lastTestedAt: new Date().toISOString() });
        } else {
          await storage.updateConnector(numId, { status: "error", lastTestedAt: new Date().toISOString() });
        }
        return res.json(result);
      }

      // Handle action: sync
      if (body.action === "sync") {
        const connector = await storage.getConnectorById(numId);
        if (!connector) return res.status(404).json({ error: "Connector not found" });
        await storage.createConnectorLog({
          connectorId: numId,
          action: "sync",
          status: "success",
          message: `Sync triggered for ${connector.platform}`,
        });
        await storage.updateConnector(numId, { lastSyncedAt: new Date().toISOString() });
        return res.json({ success: true, message: "Sync triggered" });
      }

      // Standard update
      const updated = await storage.updateConnector(numId, body);
      if (!updated) return res.status(404).json({ error: "Connector not found" });
      return res.json(updated);
    } catch (err: any) {
      console.error("Update connector error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const deleted = await storage.deleteConnector(numId);
    if (!deleted) return res.status(404).json({ error: "Connector not found" });
    return res.json({ success: true });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
