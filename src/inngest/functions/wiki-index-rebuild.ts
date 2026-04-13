import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { rebuildWikiIndex } from "@/lib/wiki/index-builder";

// Single index rebuild per SDS upload, deduped by the id field
// set in extract-sds.ts (`rebuild-${extractionId}`).
// Sleeps 60s to let chemical.enriched handlers run, then checks
// if expected pages exist. If some are missing, retries once.
// Always rebuilds on the final attempt so successful pages aren't lost.
// Note: late-arriving pages from other SDS uploads will be picked up by
// that upload's own rebuild event, so no page stays unindexed permanently.
export const wikiIndexRebuild = inngest.createFunction(
  {
    id: "wiki-index-rebuild",
    retries: 2,
    triggers: {
      event: "wiki.index.rebuild",
    },
  },
  async ({ event, step, attempt }) => {
    const { sdsId, orgId, expectedSlugs } = event.data as {
      sdsId: string;
      orgId: string;
      chemicalCount?: number;
      expectedSlugs?: string[];
    };

    // Sleep to allow concurrent chemical.enriched handlers to insert pages
    await step.sleep("wait-for-ingests", "60s");

    await step.run("rebuild", async () => {
      if (expectedSlugs && expectedSlugs.length > 0) {
        const rows = await db
          .select({ slug: wikiPages.slug })
          .from(wikiPages)
          .where(inArray(wikiPages.slug, expectedSlugs));

        const missing = expectedSlugs.length - rows.length;
        if (missing > 0) {
          console.warn(`Wiki index rebuild: ${missing} pages missing (${rows.length}/${expectedSlugs.length} found).`);

          // On non-final attempts, throw to retry. On final attempt, rebuild anyway
          // so successfully created pages still appear in the index.
          // Inngest attempt is zero-indexed: retries:2 → attempts 0,1,2
          const isFinalAttempt = attempt >= 2;
          if (!isFinalAttempt) {
            throw new Error(`Wiki index rebuild: ${rows.length}/${expectedSlugs.length} pages. Retrying.`);
          }
          console.warn("Final attempt — rebuilding with partial pages.");
        }
      }

      return rebuildWikiIndex();
    });
  },
);
