import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "smaart-secret-key";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } {
  return jwt.verify(token, JWT_SECRET) as { userId: number };
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function requireAuth(req: any) {
  const token = extractToken(req.headers.authorization);
  if (!token) throw new Error("Unauthorized");
  const { userId } = verifyToken(token);
  const user = await storage.getUserById(userId);
  if (!user) throw new Error("Unauthorized");
  return user;
}
