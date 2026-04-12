import { Inngest } from "inngest";
import { env } from "@/env";

export const inngest = new Inngest({
  id: "msds-platform",
  signingKey: env.INNGEST_SIGNING_KEY,
});
