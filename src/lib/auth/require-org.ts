import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Auth guard — disabled for development.
 * Returns the first org from the database (or a seeded dev org).
 * Calling cookies() opts the route into dynamic rendering,
 * preventing static generation build errors when DB connection is missing.
 */
export async function requireOrg() {
  await cookies(); // Force dynamic rendering

  // Try to find an existing org; fall back to a deterministic dev UUID
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .limit(1);

  // Deterministic dev UUID so queries work even with no orgs in DB
  const devOrgId = "00000000-0000-0000-0000-000000000001";

  return {
    userId: "dev-user",
    orgId: org?.id ?? devOrgId,
    session: null,
  };
}
