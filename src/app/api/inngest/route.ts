import { inngest } from "@/inngest/client";
import { extractSds } from "@/inngest/functions/extract-sds";
import { generateSafetyCard } from "@/inngest/functions/generate-safety-card";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractSds, generateSafetyCard],
});
