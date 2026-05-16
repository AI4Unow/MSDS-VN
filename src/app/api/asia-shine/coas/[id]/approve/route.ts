import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-config";
import { db } from "@/lib/db/client";
import { asCoas } from "@/lib/db/schema/asia-shine";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";
import { sendNotification } from "@/lib/coa/notification-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !["qc_manager", "chairman"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body;

  if (!["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [existing] = await db.select().from(asCoas).where(eq(asCoas.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "COA not found" }, { status: 404 });
  }

  if (existing.approvalStatus !== "pending") {
    return NextResponse.json({ error: "COA is not pending approval" }, { status: 400 });
  }

  await db
    .update(asCoas)
    .set({
      approvalStatus: action,
      approvalNotes: notes ?? null,
      approvedBy: session.user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(asCoas.id, id));

  await logAuditEvent({
    entityType: "coa",
    entityId: id,
    action: action === "approved" ? "approved" : "rejected",
    userId: session.user.id,
    userName: session.user.name ?? undefined,
    changes: { notes },
  });

  try {
    await sendNotification({
      type: action === "approved" ? "coa_approved" : "coa_rejected",
      coaId: id,
    });
  } catch {
    // notification failure is non-blocking
  }

  return NextResponse.json({ success: true });
}
