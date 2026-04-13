-- Migrate wiki_pages table to new schema per Phase 05 spec
-- This is a breaking change: PK changes from id to slug, new fields added
-- Preserve existing data by migrating to new table

-- Create new table with new schema
CREATE TABLE IF NOT EXISTS "wiki_pages_new" (
	"slug" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"one_liner" text,
	"frontmatter" jsonb NOT NULL,
	"content_md" text NOT NULL,
	"cited_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_urls" text[],
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" text DEFAULT 'llm' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Migrate existing data from old table to new table if old table exists.
-- ALL branches use dynamic SQL (EXECUTE + format()) to avoid static references
-- to columns that may not exist (tags, source_url) in partially-migrated states.
-- PostgreSQL parses the entire DO block upfront and rejects unknown column names.
DO $$
DECLARE
	has_id_col BOOLEAN;
	has_one_liner BOOLEAN;
	has_frontmatter BOOLEAN;
	has_cited_by BOOLEAN;
	has_source_urls BOOLEAN;
	has_version BOOLEAN;
	has_updated_by BOOLEAN;
	has_tags_col BOOLEAN;
	has_source_url_col BOOLEAN;
	has_frontmatter_col BOOLEAN;
	dyn_frontmatter TEXT;
	dyn_source_urls TEXT;
	dyn_cited_by TEXT;
	dyn_version TEXT;
	dyn_updated_by TEXT;
	dyn_slug TEXT;
	dyn_one_liner TEXT;
BEGIN
	IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wiki_pages' AND table_schema = 'public') THEN
		-- Detect which columns exist
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'id' AND table_schema = 'public') INTO has_id_col;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'one_liner' AND table_schema = 'public') INTO has_one_liner;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'frontmatter' AND table_schema = 'public') INTO has_frontmatter;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'cited_by' AND table_schema = 'public') INTO has_cited_by;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'source_urls' AND table_schema = 'public') INTO has_source_urls;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'version' AND table_schema = 'public') INTO has_version;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'updated_by' AND table_schema = 'public') INTO has_updated_by;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'tags' AND table_schema = 'public') INTO has_tags_col;
		SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'source_url' AND table_schema = 'public') INTO has_source_url_col;
		has_frontmatter_col := has_frontmatter;

		-- Build slug expression: use slug if available, else derive from id
		IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'slug' AND table_schema = 'public') THEN
			IF has_id_col THEN
				dyn_slug := 'COALESCE(slug::text, ''migrated-'' || id::text)';
			ELSE
				dyn_slug := 'slug::text';
			END IF;
		ELSIF has_id_col THEN
			dyn_slug := '''migrated-'' || id::text';
		ELSE
			dyn_slug := '''migrated-unknown''';
		END IF;

		-- Build one_liner expression: use existing one_liner, else extract from tags
		-- so pre-existing wiki cards do not lose their subtitle after migration.
		IF has_one_liner THEN
			dyn_one_liner := 'one_liner::text';
		ELSIF has_tags_col THEN
			dyn_one_liner := 'tags::text';
		ELSE
			dyn_one_liner := 'NULL';
		END IF;

		-- Build frontmatter expression
		IF has_frontmatter_col AND has_tags_col THEN
			dyn_frontmatter := 'COALESCE(frontmatter, ''{}''::jsonb) || CASE WHEN tags IS NOT NULL THEN jsonb_build_object(''tags'', tags) ELSE ''{}''::jsonb END';
		ELSIF has_frontmatter_col THEN
			dyn_frontmatter := 'COALESCE(frontmatter, ''{}''::jsonb)';
		ELSIF has_tags_col THEN
			dyn_frontmatter := 'CASE WHEN tags IS NOT NULL THEN jsonb_build_object(''tags'', tags) ELSE ''{}''::jsonb END';
		ELSE
			dyn_frontmatter := '''{}''::jsonb';
		END IF;

		-- Build source_urls expression
		IF has_source_url_col AND has_source_urls THEN
			dyn_source_urls := 'CASE WHEN source_url IS NOT NULL THEN ARRAY[source_url] ELSE source_urls END';
		ELSIF has_source_url_col THEN
			dyn_source_urls := 'CASE WHEN source_url IS NOT NULL THEN ARRAY[source_url] ELSE NULL END';
		ELSIF has_source_urls THEN
			dyn_source_urls := 'source_urls';
		ELSE
			dyn_source_urls := 'NULL';
		END IF;

		-- Build cited_by expression
		IF has_cited_by THEN
			dyn_cited_by := 'COALESCE(cited_by, ''[]''::jsonb)';
		ELSE
			dyn_cited_by := '''[]''::jsonb';
		END IF;

		-- Build version expression
		IF has_version THEN
			dyn_version := 'COALESCE(version, 1)';
		ELSE
			dyn_version := '1';
		END IF;

		-- Build updated_by expression
		IF has_updated_by THEN
			dyn_updated_by := 'COALESCE(updated_by::text, ''llm'')';
		ELSE
			dyn_updated_by := '''llm''';
		END IF;

		EXECUTE format(
			'INSERT INTO wiki_pages_new (slug, category, title, one_liner, frontmatter, content_md, cited_by, source_urls, version, updated_by, created_at, updated_at)
			SELECT
				%s,
				category::text,
				title::text,
				%s,
				%s,
				content_md::text,
				%s,
				%s,
				%s,
				%s,
				COALESCE(created_at, now()),
				COALESCE(updated_at, now())
			FROM wiki_pages
			ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, one_liner = EXCLUDED.one_liner, frontmatter = EXCLUDED.frontmatter, content_md = EXCLUDED.content_md, cited_by = EXCLUDED.cited_by, source_urls = EXCLUDED.source_urls, version = EXCLUDED.version, updated_by = EXCLUDED.updated_by, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at',
			dyn_slug,
			dyn_one_liner,
			dyn_frontmatter,
			dyn_cited_by,
			dyn_source_urls,
			dyn_version,
			dyn_updated_by
		);
	END IF;
END $$;--> statement-breakpoint

-- Atomic swap: drop old table and rename new in a single DO block so a crash
-- between DROP and RENAME cannot leave the database without a wiki_pages table.
DO $$ BEGIN
	IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wiki_pages_new' AND table_schema = 'public') THEN
		DROP TABLE IF EXISTS "wiki_pages" CASCADE;
		ALTER TABLE "wiki_pages_new" RENAME TO "wiki_pages";
	ELSE
		RAISE NOTICE 'wiki_pages_new does not exist, skipping swap';
	END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "wiki_category_idx" ON "wiki_pages" ("category");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "wiki_pages_search_gin" ON "wiki_pages" USING gin (to_tsvector('simple', title || ' ' || content_md));--> statement-breakpoint
