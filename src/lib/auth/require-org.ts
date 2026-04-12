import { auth } from "@/lib/auth/auth-config";
import { redirect } from "next/navigation";

export async function requireOrg() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const orgId = (session.user as { orgId?: string | null }).orgId;

  if (!orgId) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    orgId,
    session,
  };
}
