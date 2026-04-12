"use server";

import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema/organizations";
import { eq } from "drizzle-orm";

export async function updateOrgName(name: string) {
  const { orgId } = await requireOrg();
  // Only update name — don't overwrite settings JSON
  await db
    .update(organizations)
    .set({ name })
    .where(eq(organizations.id, orgId));
}

export async function updateCardAccessMode(
  mode: "public_token" | "login_required"
) {
  const { orgId } = await requireOrg();
  await db
    .update(organizations)
    .set({ cardAccessMode: mode })
    .where(eq(organizations.id, orgId));
}
