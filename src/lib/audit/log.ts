import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function logAudit(params: {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { userId, orgId } = await getAuthContext();
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;

  await db.insert(auditLog).values({
    userId,
    orgId,
    action: params.action,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    metadata: params.metadata ?? null,
    ipAddress: ip,
  });
}

async function getAuthContext() {
  try {
    const { auth } = await import("@/lib/auth/auth-config");
    const session = await auth();
    const user = session?.user as { id?: string; orgId?: string | null } | undefined;
    return {
      userId: user?.id ?? null,
      orgId: user?.orgId ?? null,
    };
  } catch {
    return { userId: null, orgId: null };
  }
}
