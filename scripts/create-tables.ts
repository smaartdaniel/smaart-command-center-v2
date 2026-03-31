import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Dropping existing tables...");
  await sql`DROP TABLE IF EXISTS creative_scores, segment_tools, tasks, best_practices, modules, segments, users, tools, budget_configs CASCADE`;

  console.log("Creating tables from schema...");

  await sql`CREATE TABLE segments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    budget_config TEXT
  )`;

  await sql`CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    guide TEXT,
    default_tasks TEXT
  )`;

  await sql`CREATE TABLE best_practices (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    how_to TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL,
    segment_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    owner TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE segment_tools (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    pricing TEXT NOT NULL,
    campaigns TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE creative_scores (
    id SERIAL PRIMARY KEY,
    segment_id TEXT NOT NULL DEFAULT 'creative-playbook',
    scores TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`;

  await sql`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT
  )`;

  console.log("All tables created!");
}

main().catch(e => { console.error(e); process.exit(1); });
