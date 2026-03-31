export default function handler(req: any, res: any) {
  res.json({ ok: true, env: !!process.env.DATABASE_URL });
}
