import "dotenv/config";
import { seedDatabase, seedUsers } from "../api/_lib/seed";

async function main() {
  console.log("Seeding database...");
  await seedDatabase();
  console.log("Seeding users...");
  await seedUsers();
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
