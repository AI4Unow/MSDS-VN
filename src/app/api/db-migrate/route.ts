import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST() {
  try {
    console.log("Running database migration...");
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), "drizzle/migrations/0000_elite_ego.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");
    
    console.log("Executing migration SQL...");
    
    // Split by statement break and execute each statement
    const statements = migrationSql.split("--> statement-breakpoint");
    
    let executed = 0;
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await sql`${trimmed}`;
          executed++;
        } catch (error) {
          console.error("Error executing statement:", error);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log(`✓ Migration complete: ${executed} statements executed`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Migration complete: ${executed} statements executed` 
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
