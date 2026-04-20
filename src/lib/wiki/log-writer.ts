import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const WIKI_PREFIX = "wiki/";

/**
 * Append a log entry as an individual Blob entry.
 * Each log entry is its own file: wiki/log/YYYY-MM-DD/UUID-PREFIX.md
 * UUID suffix prevents collision when concurrent handlers write in the same millisecond.
 */
export async function appendLogEntry(
  prefix: string,
  data: Record<string, unknown>,
) {
  const isoDate = new Date().toISOString();
  const dateKey = isoDate.slice(0, 10);
  const uid = randomUUID().slice(0, 8);
  const dataStr = Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  const logEntry = `${prefix} ${isoDate} ${dataStr}`;

  const logSlug = `log/${dateKey}/${uid}-${prefix}`;
  await put(`${WIKI_PREFIX}${logSlug}.md`, logEntry, {
    access: "public",
    addRandomSuffix: false,
  });
}

export const LOG_PREFIXES = {
  INGEST: "INGEST",
  QUERY: "QUERY",
  LINT: "LINT",
  PROMOTE: "PROMOTE",
} as const;