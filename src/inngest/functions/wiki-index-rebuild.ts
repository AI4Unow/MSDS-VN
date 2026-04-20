import { inngest } from "@/inngest/client";
import { listWikiPages, readWikiPage } from "@/lib/wiki/blob-store";
import { rebuildHierarchicalIndex } from "@/lib/wiki/hierarchical-index-builder";

// Single index rebuild per SDS upload, deduped by the id field
// set in extract-sds.ts (`rebuild-${extractionId}`).
// Sleeps 60s to let chemical.enriched handlers run, then checks
// if expected pages exist. If some are missing, retries once.
// Always rebuilds on the final attempt so successful pages aren't lost.
export const wikiIndexRebuild = inngest.createFunction(
  {
    id: "wiki-index-rebuild",
    retries: 2,
    triggers: {
      event: "wiki.index.rebuild",
    },
  },
  async ({ event, step, attempt }) => {
    const { expectedSlugs } = event.data as {
      sdsId: string;
      orgId: string;
      expectedSlugs?: string[];
    };

    // Sleep to allow concurrent chemical.enriched handlers to insert pages
    await step.sleep("wait-for-ingests", "60s");

    await step.run("rebuild", async () => {
      if (expectedSlugs && expectedSlugs.length > 0) {
        // Check Blob for expected pages instead of DB
        const existingSlugs = await listWikiPages();
        const existingSet = new Set(existingSlugs);
        const found = expectedSlugs.filter((s) => existingSet.has(s));

        const missing = expectedSlugs.length - found.length;
        if (missing > 0) {
          console.warn(
            `Wiki index rebuild: ${missing} pages missing (${found.length}/${expectedSlugs.length} found).`,
          );

          const isFinalAttempt = attempt >= 2;
          if (!isFinalAttempt) {
            throw new Error(
              `Wiki index rebuild: ${found.length}/${expectedSlugs.length} pages. Retrying.`,
            );
          }
          console.warn("Final attempt — rebuilding with partial pages.");
        }
      }

      return rebuildHierarchicalIndex();
    });
  },
);