/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { chemicals, sdsExtractions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateText } from "ai";
import { geminiFlashLite } from "@/lib/ai/gemini-client";
import { upsertWikiPage } from "@/lib/wiki/ingest";
import { appendLogEntry, LOG_PREFIXES } from "@/lib/wiki/log-writer";
import { readWikiPage, writeWikiPage, listWikiPages } from "@/lib/wiki/blob-store";
import { parseWikiPage } from "@/lib/wiki/frontmatter-parser";

export const wikiIngestFromSds = inngest.createFunction(
  {
    id: "wiki-ingest-from-sds",
    retries: 3,
    triggers: {
      event: "chemical.enriched",
    },
  },
  async ({ event, step }) => {
    const { chemicalId, casNumber, sdsId, orgId, extractionId } = event.data as {
      chemicalId: string;
      casNumber: string;
      sdsId: string;
      orgId: string;
      extractionId?: string;
    };

    // Step A: Read enriched chemical row + the specific extraction
    const { chemical, extraction } = await step.run("fetch-data", async () => {
      const [chem] = await db
        .select()
        .from(chemicals)
        .where(eq(chemicals.id, chemicalId))
        .limit(1);

      let ext;
      if (extractionId) {
        [ext] = await db
          .select()
          .from(sdsExtractions)
          .where(eq(sdsExtractions.id, extractionId))
          .limit(1);
      }
      if (!ext) {
        [ext] = await db
          .select()
          .from(sdsExtractions)
          .where(eq(sdsExtractions.sdsId, sdsId))
          .orderBy(desc(sdsExtractions.extractedAt))
          .limit(1);
      }

      return { chemical: chem, extraction: ext };
    });

    if (!chemical) {
      throw new Error(`Chemical ${chemicalId} not found`);
    }

    // Step B: Summarize using Gemini Flash Lite
    const wikiContent = await step.run("summarize", async () => {
      const extractionData = extraction?.sections as any;
      const section2 = extractionData?.section_2 || {};
      const section3 = extractionData?.section_3 || {};
      const section4 = extractionData?.section_4 || {};
      const section10 = extractionData?.section_10 || {};
      const section15 = extractionData?.section_15 || {};

      const schema = `# Chemical Wiki Page Schema

## Frontmatter (JSON format)
\`\`\`json
{
  "type": "chemical",
  "slug": "chemical/{cas}",
  "title": "Chemical Name",
  "one_liner": "≤120 char summary for index cards",
  "category": "chemical",
  "created": "ISO date",
  "updated": "ISO date",
  "sources": ["raw-sources/... or URLs"],
  "cross_refs": ["chemical/{cas}", "hazard/...", "regulation/..."],
  "confidence": "medium",
  "locale": "en",
  "cas_number": "CAS",
  "molecular_formula": "formula",
  "synonyms": ["synonym1", "synonym2"],
  "ghs_classifications": ["H225", "H315", ...],
  "signal_word": "Danger or Warning",
  "pictograms": ["GHS02", "GHS07", ...]
}
\`\`\`

## Page Body Template
\`\`\`markdown
# {Chemical name} ({CAS})

## Summary
2-3 sentence overview: what it is, primary uses, key hazards

## Identification
- CAS: ...
- Synonyms: ...

## Physical properties
boiling point, flash point, solubility — if known

## Hazards (GHS)
list H-statements with links to hazard pages

## Regulatory status
- EU REACH: status
- VN Circular 01/2026/TT-BCT: status
- Other regulations: status

## Safe handling
storage, ventilation, PPE — neutral recommendations

## First aid
per GHS section 4 conventions

## Incompatibilities
what it can't be stored near, per GHS section 10

## Sources
list with confidence per source

## Cross-references
Related chemicals: [[chemical/{cas}/...]]
Hazards: [[hazard/...]]
Regulations: [[regulation/...]]
\`\`\`
`;

      const result = await generateText({
        model: geminiFlashLite,
        messages: [
          {
            role: "system",
            content: `You are maintaining a regulatory wiki. Create or update a chemical wiki page following the schema below. Use JSON format for the frontmatter between --- delimiters.`,
          },
          {
            role: "user",
            content: `Wiki Page Schema:\n${schema}\n\nChemical data:\n${JSON.stringify(chemical, null, 2)}\n\nSDS Extraction Data:\n- Section 2 (Identification): ${JSON.stringify(section2, null, 2)}\n- Section 3 (Composition): ${JSON.stringify(section3, null, 2)}\n- Section 4 (First Aid): ${JSON.stringify(section4, null, 2)}\n- Section 10 (Stability): ${JSON.stringify(section10, null, 2)}\n- Section 15 (Regulatory): ${JSON.stringify(section15, null, 2)}\n\nOutput the full markdown wiki page with JSON frontmatter (not YAML).`,
          },
        ],
      });
      return result.text;
    });

    // Parse frontmatter from LLM output
    let frontmatter: any = {};
    let contentMd = wikiContent;

    const ensureStringArray = (v: unknown): string[] | undefined => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (typeof v === "string") return [v];
      return undefined;
    };

    // Use shared frontmatter parser (H5 fix: replaced manual parsing)
    const parsed = parseWikiPage(wikiContent);
    if (parsed.frontmatter && Object.keys(parsed.frontmatter).length > 0) {
      frontmatter = parsed.frontmatter;
      contentMd = parsed.content;
    }

    // Step C: Upsert chemical wiki page to Blob
    const slug = `chemical/${casNumber}`;
    await step.run("upsert-wiki-page", async () => {
      // Read existing page from Blob to preserve metadata on re-ingest
      const existingRaw = await readWikiPage(slug);
      let existingFm: Record<string, unknown> | undefined;
      let existingOneLiner: string | null = null;

      if (existingRaw) {
        const parsed = parseWikiPage(existingRaw);
        existingFm = parsed.frontmatter;
        existingOneLiner = parsed.oneLiner;
      }

      const existingCreated = existingFm?.created as string | undefined;

      const safeSources =
        ensureStringArray(frontmatter.sources) ||
        (existingFm?.sources as string[]) ||
        [];
      const safeCrossRefs =
        ensureStringArray(frontmatter.cross_refs) ||
        (existingFm?.cross_refs as string[]) ||
        [];
      const safePictograms =
        ensureStringArray(frontmatter.pictograms) ||
        (existingFm?.pictograms as string[]) ||
        chemical.ghsPictograms ||
        undefined;

      await upsertWikiPage({
        slug,
        category: "chemical",
        title: chemical.name,
        oneLiner: frontmatter.one_liner || existingOneLiner || null,
        frontmatter: {
          type: "chemical",
          slug,
          title: chemical.name,
          category: "chemical",
          created: existingCreated || new Date().toISOString(),
          updated: new Date().toISOString(),
          sources: safeSources,
          cross_refs: safeCrossRefs,
          confidence:
            frontmatter.confidence ||
            (existingFm?.confidence as string) ||
            "medium",
          locale: frontmatter.locale || (existingFm?.locale as string) || "en",
          cas_number: chemical.casNumber || undefined,
          molecular_formula: chemical.formula || undefined,
          synonyms: chemical.synonymNames || undefined,
          ghs_classifications: chemical.ghsHazardCodes || undefined,
          signal_word:
            frontmatter.signal_word ||
            (existingFm?.signal_word as string) ||
            undefined,
          pictograms: safePictograms,
          reach_svhc: frontmatter.reach_svhc || undefined,
          vn_restricted: frontmatter.vn_restricted || undefined,
        },
        contentMd,
        sourceUrls: safeSources,
      });
    });

    // Step D: Ensure stub pages exist for related hazards/regulations.
    // Stub creation only — no per-chemical cited_by mutation (avoids read-modify-write race on shared pages).
    // Backlinks can be derived by scanning cross_refs across all pages, but are not
    // currently materialized during index rebuild. If needed, add to rebuildHierarchicalIndex().
    const pagesTouched = await step.run("revise-related", async () => {
      const ghsCodes: string[] = chemical.ghsHazardCodes || [];

      // Read existing page from Blob for cross_refs
      const existingRaw = await readWikiPage(slug);
      let refs: string[] = [];
      if (existingRaw) {
        const parsed = parseWikiPage(existingRaw);
        refs = ensureStringArray(
          (parsed.frontmatter as any)?.cross_refs,
        ) || ensureStringArray(frontmatter.cross_refs) || [];
      }

      const relatedSlugs = new Set<string>();
      for (const code of ghsCodes) {
        relatedSlugs.add(`hazard/${code.toLowerCase()}`);
      }
      for (const ref of refs) {
        if (ref !== slug && !ref.startsWith("chemical/")) {
          relatedSlugs.add(ref);
        }
      }

      const targets = [...relatedSlugs].slice(0, 15);
      let touched = 0;

      for (const targetSlug of targets) {
        const targetRaw = await readWikiPage(targetSlug);
        if (!targetRaw) {
          // Create stub page only if it doesn't exist yet (no race — onConflictDoNothing equivalent)
          const category = targetSlug.startsWith("hazard/")
            ? "hazard"
            : targetSlug.startsWith("regulation/")
              ? "regulation"
              : "topic";
          const title =
            targetSlug.split("/").pop()?.replace(/-/g, " ") || targetSlug;
          const stubFm = JSON.stringify(
            {
              type: category,
              slug: targetSlug,
              title,
              category,
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
            },
            null,
            2,
          );
          const stubPage = `---\n${stubFm}\n---\n\n# ${title}\n\n*This page is a stub. Content will be added automatically.*`;
          await writeWikiPage(targetSlug, stubPage);
          touched++;
        } else {
          touched++;
        }
      }

      return touched;
    });

    // Step F: Append to log
    await step.run("append-log", async () => {
      await appendLogEntry(LOG_PREFIXES.INGEST, {
        sds: sdsId,
        cas: casNumber,
        "pages-touched": pagesTouched,
      });
    });

    return { sdsId, casNumber, pagesTouched };
  },
);