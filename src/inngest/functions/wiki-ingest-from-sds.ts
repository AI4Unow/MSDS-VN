/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { chemicals, sdsExtractions, wikiPages } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { generateText } from "ai";
import { geminiFlashLite } from "@/lib/ai/gemini-client";
import { upsertWikiPage } from "@/lib/wiki/ingest";
import { appendLogEntry, LOG_PREFIXES } from "@/lib/wiki/log-writer";

export const wikiIngestFromSds = inngest.createFunction(
  {
    id: "wiki-ingest-from-sds",
    retries: 3,
    triggers: {
      event: "chemical.enriched"
    }
  },
  async ({ event, step }) => {
    const { chemicalId, casNumber, sdsId, orgId, extractionId } = event.data as {
      chemicalId: string;
      casNumber: string;
      sdsId: string;
      orgId: string;
      extractionId?: string;
    };

    // Step A: Read enriched chemical row + the specific extraction that produced this event
    const { chemical, extraction } = await step.run("fetch-data", async () => {
      const [chem] = await db
        .select()
        .from(chemicals)
        .where(eq(chemicals.id, chemicalId))
        .limit(1);

      // Use extractionId if available for deterministic lookup; fall back to latest
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

    // Parse frontmatter: match only the first pair of --- delimiters to avoid
    // breaking on markdown horizontal rules or code fences containing ---
    let frontmatter: any = {};
    let contentMd = wikiContent;

    // Coerce LLM output: ensure array fields are always string[], never scalars.
    // Gemini may return "sources": "https://..." instead of ["https://..."].
    const ensureStringArray = (v: unknown): string[] | undefined => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (typeof v === "string") return [v];
      return undefined;
    };

    const firstDelim = wikiContent.indexOf('---');
    if (firstDelim !== -1) {
      const afterFirst = wikiContent.indexOf('\n', firstDelim) + 1;
      const secondDelim = wikiContent.indexOf('---', afterFirst);
      if (secondDelim !== -1) {
        const fmText = wikiContent.slice(afterFirst, secondDelim).trim();
        const afterSecond = wikiContent.indexOf('\n', secondDelim);
        const candidateMd = afterSecond !== -1 ? wikiContent.slice(afterSecond + 1) : wikiContent.slice(secondDelim + 3);
        try {
          frontmatter = JSON.parse(fmText);
          // Only update contentMd when frontmatter parsed successfully
          contentMd = candidateMd;
        } catch {
          // LLM output may be YAML or invalid JSON — keep full wiki content
          // and empty frontmatter. Existing metadata is preserved via fallback
          // in Step C below.
          console.warn('Failed to parse frontmatter as JSON, preserving full content');
        }
      }
    }

    // Step C: Upsert chemical wiki page
    // One canonical page per CAS shared across orgs — wiki is reference material.
    // Last-write-wins on content; org-specific data stays in the chemicals table.
    // This is intentional: two orgs uploading the same chemical converge on one page.
    const slug = `chemical/${casNumber}`;
    await step.run("upsert-wiki-page", async () => {
      // Preserve original creation timestamp and metadata on re-ingest
      const existingPage = await db
        .select({
          frontmatter: wikiPages.frontmatter,
          oneLiner: wikiPages.oneLiner,
        })
        .from(wikiPages)
        .where(eq(wikiPages.slug, slug))
        .limit(1);
      const existingFm = existingPage[0]?.frontmatter as Record<string, unknown> | undefined;
      const existingCreated = existingFm?.created as string | undefined;
      const existingOneLiner = existingPage[0]?.oneLiner;

      // Merge: use Gemini's values when present, fall back to existing metadata.
      // ensureStringArray coerces scalar LLM output into valid text[] for PG.
      const safeSources = ensureStringArray(frontmatter.sources) || (existingFm?.sources as string[]) || [];
      const safeCrossRefs = ensureStringArray(frontmatter.cross_refs) || (existingFm?.cross_refs as string[]) || [];
      const safePictograms = ensureStringArray(frontmatter.pictograms) || (existingFm?.pictograms as string[]) || chemical.ghsPictograms || undefined;

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
          confidence: frontmatter.confidence || (existingFm?.confidence as string) || "medium",
          locale: frontmatter.locale || (existingFm?.locale as string) || "en",
          cas_number: chemical.casNumber || undefined,
          molecular_formula: chemical.formula || undefined,
          synonyms: chemical.synonymNames || undefined,
          ghs_classifications: chemical.ghsHazardCodes || undefined,
          signal_word: frontmatter.signal_word || (existingFm?.signal_word as string) || undefined,
          pictograms: safePictograms,
          reach_svhc: frontmatter.reach_svhc || undefined,
          vn_restricted: frontmatter.vn_restricted || undefined,
        },
        contentMd,
        sourceUrls: safeSources,
      });
    });

    // Step D: Update backlinks on hazard/regulation pages (bound ≤15 revisions)
    // Uses atomic SQL jsonb ops to prevent lost-update races when concurrent
    // chemical.enriched events touch the same hazard page.
    const pagesTouched = await step.run("revise-related", async () => {
      const ghsCodes: string[] = chemical.ghsHazardCodes || [];
      // Re-derive merged cross_refs: prefer Gemini output, fall back to existing page
      const existingPage = await db
        .select({ frontmatter: wikiPages.frontmatter })
        .from(wikiPages)
        .where(eq(wikiPages.slug, slug))
        .limit(1);
      const existingFm = existingPage[0]?.frontmatter as Record<string, unknown> | undefined;
      const refs: string[] = ensureStringArray(frontmatter.cross_refs)
        || (existingFm?.cross_refs as string[])
        || [];
      // Collect unique related page slugs from GHS codes + cross_refs
      const relatedSlugs = new Set<string>();
      for (const code of ghsCodes) {
        relatedSlugs.add(`hazard/${code.toLowerCase()}`);
      }
      for (const ref of refs) {
        if (ref !== slug && !ref.startsWith("chemical/")) {
          relatedSlugs.add(ref);
        }
      }
      // Cap at 15 to avoid runaway writes
      const targets = [...relatedSlugs].slice(0, 15);
      let touched = 0;
      const missingTargets: string[] = [];
      for (const targetSlug of targets) {
        // Atomic upsert: if the chemical slug already exists in cited_by,
        // keep count as-is (idempotent re-ingest). Otherwise append it.
        // This avoids the lost-update race of read-modify-write in JS.
        // Note: @> requires RHS to be an array for array containment check.
        const entry = JSON.stringify({ page: slug, count: 1 });
        const entryArr = JSON.stringify([{ page: slug, count: 1 }]);
        const result = await db
          .update(wikiPages)
          .set({
            citedBy: sql`
              CASE
                WHEN COALESCE(${wikiPages.citedBy}, '[]'::jsonb) @> ${entryArr}::jsonb
                THEN ${wikiPages.citedBy}
                ELSE COALESCE(${wikiPages.citedBy}, '[]'::jsonb) || ${entry}::jsonb
              END`,
            updatedAt: new Date(),
          })
          .where(eq(wikiPages.slug, targetSlug))
          .returning({ slug: wikiPages.slug });
        if (result.length > 0) {
          touched++;
        } else {
          // Target page doesn't exist yet — create a stub so backlinks
          // aren't lost. The stub will be filled in when the page is
          // properly created (by seed scripts or future ingest).
          missingTargets.push(targetSlug);
        }
      }

      // Create stub pages for targets that didn't exist, preserving backlinks
      for (const targetSlug of missingTargets) {
        const category = targetSlug.startsWith("hazard/") ? "hazard"
          : targetSlug.startsWith("regulation/") ? "regulation"
          : "topic";
        const title = targetSlug.split("/").pop()?.replace(/-/g, " ") || targetSlug;
        await db
          .insert(wikiPages)
          .values({
            slug: targetSlug,
            category,
            title,
            frontmatter: { type: category, slug: targetSlug, title },
            contentMd: `# ${title}\n\n*This page is a stub. Content will be added automatically.*`,
            citedBy: [{ page: slug, count: 1 }],
          })
          .onConflictDoNothing();
      }
      touched += missingTargets.length;
      return touched;
    });

    // Step E: Index rebuild is handled by the wiki.index.rebuild event emitted
    // from extract-sds after all chemicals are processed. This avoids concurrent
    // handlers overwriting each other's index snapshot.

    // Step F: Append to log.md
    await step.run("append-log", async () => {
      await appendLogEntry(LOG_PREFIXES.INGEST, { sds: sdsId, cas: casNumber, "pages-touched": pagesTouched });
    });

    return { sdsId, casNumber, pagesTouched };
  }
);
