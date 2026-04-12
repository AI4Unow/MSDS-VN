import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { reviewQueue } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; path: string }> }
) {
  const orgId = "dev-org";

  const { id: extractionId, path: fieldPath } = await params;
  const body = await request.json();
  const { value } = body as { value: unknown };

  if (value === undefined) {
    return NextResponse.json({ error: "Missing value" }, { status: 400 });
  }

  // Validate fieldPath format — only allow alphanumeric, dots, brackets
  if (!/^[\w.[\]]+$/.test(fieldPath)) {
    return NextResponse.json({ error: "Invalid field path" }, { status: 400 });
  }

  // Build JSONB path from fieldPath
  const pathParts = fieldPath
    .split(".")
    .flatMap((part) => {
      const match = part.match(/^(\w+)(?:\[(\d+)\])?$/);
      if (!match) return [part];
      const [, key, idx] = match;
      if (idx !== undefined) return [key, idx];
      return [key];
    });

  const jsonPath = `{${pathParts.join(",")},value}`;
  const jsonValue = JSON.stringify(value);

  // Use parameterized binding — NO sql.raw() with user input
  await db.execute(sql`
    UPDATE sds_extractions
    SET sections = jsonb_set(sections, ${jsonPath}::text[], ${jsonValue}::jsonb)
    WHERE id = ${extractionId}
  `);

  // Mark review queue item as resolved (org-scoped)
  await db
    .update(reviewQueue)
    .set({
      humanValue: value as Record<string, unknown>,
      status: "resolved",
      resolvedBy: "dev-user",
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(reviewQueue.sdsId, extractionId),
        eq(reviewQueue.fieldPath, fieldPath),
        eq(reviewQueue.orgId, orgId)
      )
    );

  return NextResponse.json({ success: true });
}
