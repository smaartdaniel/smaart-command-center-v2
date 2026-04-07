import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../_lib/storage";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const successMsg = { message: "If an account with that email exists, a password reset link has been sent." };

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { email } = body;
    if (!email) return res.json(successMsg);

    const user = await storage.getUserByEmail(email);
    if (!user) return res.json(successMsg);

    const token = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.APP_URL || "https://smaart-command-center-v2.vercel.app";
      const resetUrl = `${appUrl}/#/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "SMAART Command Center <noreply@smaartcompany.com>",
        to: email,
        subject: "Reset your SMAART Command Center password",
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;"><h2 style="color:#0f172a;">Password Reset Request</h2><p style="color:#475569;line-height:1.6;">Click the button below to reset your password.</p><a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;margin:24px 0;font-weight:500;">Reset Password</a><p style="color:#94a3b8;font-size:14px;">This link expires in 1 hour.</p></div>`,
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
  }

  res.json(successMsg);
}
