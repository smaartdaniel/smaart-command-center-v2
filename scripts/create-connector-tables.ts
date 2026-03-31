import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating connector tables...");

  await sql`CREATE TABLE IF NOT EXISTS websites (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    division TEXT NOT NULL DEFAULT 'default',
    gtm_container_id TEXT,
    ga4_property_id TEXT,
    ga4_measurement_id TEXT,
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'active',
    last_health_check TIMESTAMPTZ,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`;

  await sql`CREATE TABLE IF NOT EXISTS connectors (
    id SERIAL PRIMARY KEY,
    website_id INTEGER,
    platform TEXT NOT NULL,
    display_name TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT 'api_key',
    credentials TEXT,
    config TEXT,
    status TEXT DEFAULT 'disconnected',
    last_sync TEXT,
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`;

  await sql`CREATE TABLE IF NOT EXISTS connector_logs (
    id SERIAL PRIMARY KEY,
    connector_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`;

  console.log("All connector tables created!");
}

main().catch(e => { console.error(e); process.exit(1); });
