import "dotenv/config";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    console.error("POSTGRES_URL or POSTGRES_URL_NON_POOLING must be set");
    console.error("Please set these environment variables in your .env.local file");
    process.exit(1);
  }

  console.log("Connecting to database...");
  
  // Read the migration SQL file
  const migrationPath = join(__dirname, "../drizzle/migrations/0000_elite_ego.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");
  
  console.log("Executing migration SQL...");
  
  // Split by statement break and execute each statement
  const statements = migrationSql.split("--> statement-breakpoint");
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      try {
        await sql`${trimmed}`;
        console.log("✓ Executed statement");
      } catch (error) {
        console.error("Error executing statement:", error);
        throw error;
      }
    }
  }
  
  console.log("✓ Schema pushed successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error pushing schema:", error);
  process.exit(1);
});
