import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../../_lib/storage";
import { requireAuth } from "../../../_lib/auth";
import { generateDefaultPassword, hashPassword } from "../../../../shared/password-utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const user = await requireAuth(req);
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const targetId = parseInt(req.query.id as string);
    const target = await storage.getUserById(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const firstName = target.name.split(" ")[0];
    const defaultPassword = generateDefaultPassword(firstName);
    const hashed = await hashPassword(defaultPassword);
    await storage.updateUserPassword(target.id, hashed, "true");

    res.json({ message: "Password has been reset", defaultPassword });
  } catch (err: any) {
    if (err.message === "Unauthorized") return res.status(401).json({ message: "Unauthorized" });
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}
