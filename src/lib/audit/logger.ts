import { db } from "@/lib/db/client";
import { asAuditLog } from "@/lib/db/schema/asia-shine";

export async function logAuditEvent(event: {
  entityType: "coa" | "product" | "supplier";
  entityId: string;
  action: string;
  userId?: string;
  userName?: string;
  changes?: unknown;
  ipAddress?: string;
}) {
  await db.insert(asAuditLog).values({
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    userId: event.userId,
    userName: event.userName,
    changes: event.changes,
    ipAddress: event.ipAddress,
  });
}
