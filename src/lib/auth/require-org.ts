/**
 * Auth guard — disabled for development.
 * Returns mock org context instead of checking session.
 */
export async function requireOrg() {
  return {
    userId: "dev-user",
    orgId: "dev-org",
    session: null,
  };
}
