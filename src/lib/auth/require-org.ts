import { cookies } from "next/headers";

/**
 * Auth guard — disabled for development.
 * Returns mock org context instead of checking session.
 * Calling cookies() opts the route into dynamic rendering,
 * preventing static generation build errors when DB connection is missing.
 */
export async function requireOrg() {
  cookies(); // Force dynamic rendering

  return {
    userId: "dev-user",
    orgId: "dev-org",
    session: null,
  };
}
