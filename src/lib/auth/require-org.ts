import { auth } from "@/lib/auth/auth-config";

export async function requireOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized: no session");
  }

  const orgId = (session.user as { orgId?: string | null }).orgId;

  if (!orgId) {
    throw new Error("Forbidden: no organization assigned");
  }

  return {
    userId: session.user.id,
    orgId,
    session,
  };
}
