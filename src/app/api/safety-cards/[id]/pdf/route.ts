import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { safetyCards } from "@/lib/db/schema/safety-cards";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId } = await requireOrg();
  const { id } = await params;

  const card = await db
    .select()
    .from(safetyCards)
    .where(eq(safetyCards.id, id))
    .limit(1);

  if (!card[0] || card[0].orgId !== orgId || !card[0].blobUrl) {
    return notFound();
  }

  // Redirect to Vercel Blob URL
  return Response.redirect(card[0].blobUrl);
}
