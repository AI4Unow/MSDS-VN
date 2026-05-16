import { auth } from "@/lib/auth/auth-config";
import { redirect } from "next/navigation";
import type { userRoleEnum } from "@/lib/db/schema/auth";

type UserRole = (typeof userRoleEnum.enumValues)[number];

export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await auth();
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }
  return session;
}
