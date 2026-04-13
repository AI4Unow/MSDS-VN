import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function appendLogEntry(prefix: string, data: Record<string, unknown>) {
  const isoDate = new Date().toISOString();
  const dataStr = Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  const logEntry = `${prefix} ${isoDate} ${dataStr}\n`;

  // Use atomic SQL update to append without race condition
  await db
    .insert(wikiPages)
    .values({
      slug: "log",
      category: "meta",
      title: "Wiki Log",
      frontmatter: { type: "meta" },
      contentMd: logEntry,
      citedBy: [],
      sourceUrls: [],
      version: 1,
      updatedBy: "llm",
    })
    .onConflictDoUpdate({
      target: wikiPages.slug,
      set: {
        contentMd: sql`${logEntry} || ${wikiPages.contentMd}`,
        updatedAt: new Date(),
      },
    });
}

export const LOG_PREFIXES = {
  INGEST: "INGEST",
  QUERY: "QUERY",
  LINT: "LINT",
  PROMOTE: "PROMOTE",
} as const;
