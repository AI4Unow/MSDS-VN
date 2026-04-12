import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema/sds-documents";
import { safetyCards } from "@/lib/db/schema/safety-cards";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileText, QrCode, Download } from "@phosphor-icons/react/dist/ssr";

export default async function SafetyCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireOrg();
  const { id } = await params;

  // Verify SDS belongs to org
  const sds = await db
    .select()
    .from(sdsDocuments)
    .where(and(eq(sdsDocuments.id, id), eq(sdsDocuments.orgId, orgId)))
    .limit(1);

  if (!sds[0]) return notFound();

  // Find existing card
  const cards = await db
    .select()
    .from(safetyCards)
    .where(eq(safetyCards.sdsId, id))
    .orderBy(desc(safetyCards.createdAt));

  const latestCard = cards[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <FileText size={24} className="text-primary" />
        <h1 className="text-xl font-bold">Phiếu an toàn hóa chất</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Phiếu an toàn (Safety Card) cho: <strong>{sds[0].filename}</strong>
      </p>

      {latestCard ? (
        <div className="space-y-4">
          {/* Card status */}
          <div className="flex items-center gap-2 p-4 rounded-lg border border-border bg-card">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                latestCard.status === "ready"
                  ? "bg-green-500"
                  : latestCard.status === "generating"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {latestCard.status === "ready"
                ? "Phiếu đã sẵn sàng"
                : latestCard.status === "generating"
                  ? "Đang tạo phiếu..."
                  : "Lỗi tạo phiếu"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {latestCard.createdAt.toLocaleDateString("vi-VN")}
            </span>
          </div>

          {/* Actions */}
          {latestCard.status === "ready" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Download PDF */}
              {latestCard.blobUrl && (
                <a
                  href={latestCard.blobUrl}
                  download
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Download size={24} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium">Tải PDF</p>
                    <p className="text-xs text-muted-foreground">
                      Phiếu an toàn A4
                    </p>
                  </div>
                </a>
              )}

              {/* QR Code info */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                <QrCode size={24} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">Mã QR</p>
                  <p className="text-xs text-muted-foreground">
                    Token: {latestCard.publicToken.slice(0, 8)}...
                  </p>
                  <a
                    href={`/public/card/${latestCard.publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Xem trang công khai →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <QrCode size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Chưa có phiếu an toàn cho tài liệu này.
          </p>
          <form>
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Tạo Phiếu an toàn
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
