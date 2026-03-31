import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../_lib/auth";
import { storage } from "../_lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await requireAuth(req);
  } catch {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { connectorId, limit } = req.query;
  const numId = parseInt(Array.isArray(connectorId) ? connectorId[0] : connectorId as string);
  if (isNaN(numId)) {
    return res.status(400).json({ error: "Invalid connector ID" });
  }

  const numLimit = limit
    ? parseInt(Array.isArray(limit) ? limit[0] : limit as string)
    : 50;

  const logs = await storage.getConnectorLogs(numId, isNaN(numLimit) ? 50 : numLimit);
  return res.json(logs);
}
