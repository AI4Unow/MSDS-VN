"use server";

import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { del } from "@vercel/blob";
import { logAudit } from "@/lib/audit/log";

export async function finalizeSdsUpload(params: {
  url: string;
  pathname: string;
  hash: string;
  filename: string;
  sizeBytes: number;
}) {
  const { userId, orgId } = await requireOrg();

  // Dedupe check — if same org+hash exists, delete new blob and return existing
  const existing = await db
    .select({ id: sdsDocuments.id })
    .from(sdsDocuments)
    .where(
      and(
        eq(sdsDocuments.orgId, orgId),
        eq(sdsDocuments.fileHash, params.hash)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Delete the newly uploaded blob (it's a duplicate)
    try {
      await del(params.url);
    } catch {
      // Best effort cleanup
    }
    return { sdsId: existing[0].id, duplicate: true };
  }

  // Insert new SDS document record
  const [doc] = await db
    .insert(sdsDocuments)
    .values({
      orgId,
      uploadedBy: userId,
      blobUrl: params.url,
      blobPathname: params.pathname,
      fileHash: params.hash,
      filename: params.filename,
      sizeBytes: params.sizeBytes,
      status: "pending",
    })
    .returning();

  if (!doc) {
    throw new Error("Failed to create SDS document");
  }

  // Enqueue Inngest extraction job
  await inngest.send({
    name: "sds.uploaded",
    data: { sdsId: doc.id, orgId },
  });

  // Audit log
  await logAudit({
    action: "sds.upload",
    targetType: "sds",
    targetId: doc.id,
    metadata: { filename: params.filename, sizeBytes: params.sizeBytes },
  });

  return { sdsId: doc.id, duplicate: false };
}
