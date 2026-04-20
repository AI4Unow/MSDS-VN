import { put, list, del } from "@vercel/blob";

const WIKI_PREFIX = "wiki/";

// --- URL Cache (avoids double round-trip on every read) ---
// Request-scoped: cloned on read so concurrent requests don't share mutable state (P1-1 fix)
let urlCache: Map<string, string> | null = null;
let urlCacheExpiry = 0;
const URL_CACHE_TTL_MS = 60_000;

async function getUrlCache(): Promise<Map<string, string>> {
  if (urlCache && Date.now() < urlCacheExpiry) return new Map(urlCache);

  const slugs: Array<{ pathname: string; url: string }> = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: WIKI_PREFIX, cursor, limit: 1000 });
    slugs.push(
      ...result.blobs.map((b) => ({ pathname: b.pathname, url: b.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  urlCache = new Map(
    slugs.map((b) => [
      b.pathname.replace(WIKI_PREFIX, "").replace(/\.md$/, ""),
      b.url,
    ]),
  );
  urlCacheExpiry = Date.now() + URL_CACHE_TTL_MS;
  return new Map(urlCache);
}

function invalidateUrlCache() {
  urlCache = null;
  urlCacheExpiry = 0;
}

// --- Public API ---

export async function readWikiPage(slug: string): Promise<string | null> {
  const cache = await getUrlCache();
  const url = cache.get(slug);
  if (!url) return null;
  const res = await fetch(url);
  if (res.ok) return res.text();

  // Cache may be stale (e.g. after a delete). Clear and retry once.
  invalidateUrlCache();
  const freshCache = await getUrlCache();
  const freshUrl = freshCache.get(slug);
  if (!freshUrl || freshUrl === url) return null;
  const retry = await fetch(freshUrl);
  return retry.ok ? retry.text() : null;
}

export async function writeWikiPage(
  slug: string,
  content: string,
): Promise<void> {
  // Wiki content is public regulatory/compliance reference data (GHS, VN regulations).
  // NOT org-specific trade secrets. If private data is ever stored, switch to
  // access: "private" and serve through an authenticated API route with signed URLs.
  await put(`${WIKI_PREFIX}${slug}.md`, content, {
    access: "public",
    addRandomSuffix: false,
  });
  invalidateUrlCache();
}

export async function listWikiPages(prefix?: string): Promise<string[]> {
  const fullPrefix = prefix
    ? `${WIKI_PREFIX}${prefix}`
    : WIKI_PREFIX;
  const slugs: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: fullPrefix, cursor, limit: 1000 });
    slugs.push(
      ...result.blobs.map((b) =>
        b.pathname.replace(WIKI_PREFIX, "").replace(/\.md$/, ""),
      ),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return slugs;
}

export async function deleteWikiPage(slug: string): Promise<void> {
  let cache = await getUrlCache();
  let url = cache.get(slug);

  // If not in cache, try rebuilding once (H3 fix)
  if (!url) {
    invalidateUrlCache();
    cache = await getUrlCache();
    url = cache.get(slug);
  }

  if (url) {
    await del(url);
    invalidateUrlCache();
  }
}