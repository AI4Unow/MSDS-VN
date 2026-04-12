import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { safetyCards } from "@/lib/db/schema/safety-cards";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId } = await requireOrg();
  const { id } = await params;
  
  // Rate limit: 20 requests per minute per org
  const rateLimitResult = rateLimit(`safety-card:${orgId}`, 20, 60_000);
  if (!rateLimitResult.success) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

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
