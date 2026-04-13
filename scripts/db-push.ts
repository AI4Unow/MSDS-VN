import { config } from "dotenv";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { sql, Pool } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load .env files — .env.local takes precedence over .env
config({ path: join(__dirname, "../.env.local") });
config({ path: join(__dirname, "../.env") });

async function main() {
  // Step 1: Apply data-preserving wiki migration before drizzle-kit push
  // drizzle-kit push diffs live schema and may rewrite wiki_pages without
  // carrying data over. Run the custom migration first if wiki_pages exists
  // but hasn't been fully migrated to the new slug-PK schema.
  try {
    const wikiSchemaFullyMigrated = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'wiki_pages'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = 'slug'
      )
    `.then(r => r.rows[0].exists);

    if (!wikiSchemaFullyMigrated) {
      // Recover from interrupted migration: if wiki_pages_new exists but wiki_pages
      // doesn't, the previous run dropped wiki_pages but didn't finish the rename.
      // Rename wiki_pages_new → wiki_pages so the migration can re-run cleanly.
      const wikiNewExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'wiki_pages_new'
        )
      `.then(r => r.rows[0].exists);

      const wikiExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'wiki_pages'
        )
      `.then(r => r.rows[0].exists);

      if (wikiNewExists && !wikiExists) {
        console.log("Recovering interrupted migration: renaming wiki_pages_new → wiki_pages...");
        await sql`ALTER TABLE wiki_pages_new RENAME TO wiki_pages`;
        console.log("✓ Recovered wiki_pages_new → wiki_pages.");
      }

      // Re-check after potential recovery rename
      const wikiExistsAfterRecovery = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'wiki_pages'
        )
      `.then(r => r.rows[0].exists);

      if (wikiExistsAfterRecovery) {
        console.log("Applying data-preserving wiki migration before push...");
        const migrationSql = await import("fs").then(fs =>
          fs.readFileSync(join(__dirname, "../drizzle/migrations/0001_wiki_schema_update.sql"), "utf-8")
        );
        const statements = migrationSql.split("--> statement-breakpoint");
        // Pool.query() accepts raw SQL strings — sql`` tag would parameterize DDL as $1
        const pool = new Pool();
        try {
          for (const stmt of statements) {
            const trimmed = stmt.trim();
            if (trimmed) {
              await pool.query(trimmed);
            }
          }
        } finally {
          await pool.end();
        }
        console.log("✓ Wiki migration applied.");
      }
    } else {
      console.log("✓ Wiki schema already migrated, skipping.");
    }
  } catch (error) {
    console.error("Wiki migration failed, aborting before drizzle-kit push:", error);
    process.exit(1);
  }

  // Step 2: Push remaining schema via drizzle-kit
  console.log("Running drizzle-kit push to apply schema changes...");

  try {
    execSync("pnpm drizzle-kit push", {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
      env: process.env,
    });
    console.log("✓ Schema pushed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
}

main();
