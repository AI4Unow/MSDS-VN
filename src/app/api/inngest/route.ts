import { inngest } from "@/inngest/client";
import { extractSds } from "@/inngest/functions/extract-sds";
import { generateSafetyCard } from "@/inngest/functions/generate-safety-card";
import { wikiIngestFromSds } from "@/inngest/functions/wiki-ingest-from-sds";
import { wikiIndexRebuild } from "@/inngest/functions/wiki-index-rebuild";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractSds, generateSafetyCard, wikiIngestFromSds, wikiIndexRebuild],
});
