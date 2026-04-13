import { sql, Pool } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST() {
  try {
    console.log("Running database migration...");

    // Check if base schema is complete by verifying the last index unique to
    // 0000_elite_ego.sql. Use sds_extractions_sds_idx (not wiki_category_idx)
    // because 0001_wiki_schema_update.sql also creates wiki_category_idx, and
    // (not sds_org_hash_uniq) because there are still two statements after it.
    const baseSchemaExists = await sql`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = 'sds_extractions_sds_idx'
      )
    `.then(r => r.rows[0].exists);

    let baseExecuted = 0;
    let baseFailed = 0;
    let baseStatements: string[] = [];

    if (!baseSchemaExists) {
      // Apply base schema migration (0000_elite_ego.sql)
      const baseMigrationPath = join(process.cwd(), "drizzle/migrations/0000_elite_ego.sql");
      const baseMigrationSql = readFileSync(baseMigrationPath, "utf-8");

      console.log("Executing base schema migration SQL...");

      // Split by statement break and execute each statement
      baseStatements = baseMigrationSql.split("--> statement-breakpoint");

      // Pool.query() accepts raw SQL strings — sql`` tag would parameterize DDL as $1
      const pool = new Pool();
      try {
        for (const statement of baseStatements) {
          const trimmed = statement.trim();
          if (trimmed) {
            try {
              await pool.query(trimmed);
              baseExecuted++;
              console.log(`✓ Executed base statement ${baseExecuted}`);
            } catch (error) {
              const msg = (error as Error).message?.toLowerCase() || "";
              // Benign "already exists" errors mean the statement was applied in a
              // previous partial migration attempt — count as success, not failure.
              const isBenign = msg.includes("already exists");
              if (isBenign) {
                baseExecuted++;
                console.log(`✓ Base statement already applied (already exists), skipping`);
              } else {
                // Abort on first unexpected error — continuing would risk marking the
                // base migration as complete (via the sentinel check) even though
                // some statements never ran, leaving the schema partially applied.
                throw new Error(`Base migration statement failed: ${(error as Error).message}`);
              }
            }
          }
        }
      } finally {
        await pool.end();
      }

      console.log(`✓ Base migration complete: ${baseExecuted} statements executed, ${baseFailed} failed`);
    } else {
      console.log("✓ Base schema already exists, skipping base migration");
    }

    // Apply wiki schema migration (0001_wiki_schema_update.sql)
    // Check if wiki schema has been fully migrated by verifying slug PK AND
    // the search GIN index both exist. A half-migrated DB could have the slug PK
    // but miss the indexes if the migration died after the table rename.
    const wikiSchemaFullyMigrated = await sql`
      SELECT
        (SELECT EXISTS (
          SELECT FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public'
          AND tc.table_name = 'wiki_pages'
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = 'slug'
        )) AND
        (SELECT EXISTS (
          SELECT FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = 'wiki_pages'
          AND indexname = 'wiki_pages_search_gin'
        )) AS fully_migrated
    `.then(r => r.rows[0].fully_migrated);

    let executed = 0;
    let failed = 0;
    let statements: string[] = [];

    if (!wikiSchemaFullyMigrated) {
      const wikiMigrationPath = join(process.cwd(), "drizzle/migrations/0001_wiki_schema_update.sql");
      const wikiMigrationSql = readFileSync(wikiMigrationPath, "utf-8");

      console.log("Executing wiki schema migration SQL...");

      // Split by statement break and execute each statement
      statements = wikiMigrationSql.split("--> statement-breakpoint");

      // Pool.query() accepts raw SQL strings — sql`` tag would parameterize DDL as $1
      const pool = new Pool();
      try {
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (trimmed) {
            try {
              await pool.query(trimmed);
              executed++;
              console.log(`✓ Executed statement ${executed}`);
            } catch (error) {
              failed++;
              console.error("Error executing statement:", error);
              // Abort: any prior failure means destructive steps (DROP TABLE, ALTER TABLE RENAME) are unsafe
              throw new Error(`Migration statement failed, aborting before destructive steps: ${(error as Error).message}`);
            }
          }
        }
      } finally {
        await pool.end();
      }

      console.log(`✓ Wiki migration complete: ${executed} statements executed, ${failed} failed`);
    } else {
      console.log("✓ Wiki schema already migrated (slug PK exists), skipping wiki migration");
    }

    const totalExecuted = baseExecuted + executed;
    const totalFailed = baseFailed + failed;

    if (totalFailed > 0) {
      return NextResponse.json({
        success: false,
        message: `Migration completed with ${totalFailed} errors (base: ${baseFailed}, wiki: ${failed}) out of ${baseStatements.length + statements.length} statements`,
        baseExecuted,
        baseFailed,
        executed,
        failed,
        totalExecuted,
        totalFailed,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${totalExecuted} statements executed (base: ${baseExecuted}, wiki: ${executed})`,
      baseExecuted,
      baseFailed,
      executed,
      failed,
      totalExecuted,
      totalFailed,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
