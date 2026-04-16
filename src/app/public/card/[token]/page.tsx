import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema/organizations";
import { safetyCards } from "@/lib/db/schema/safety-cards";
import { sdsDocuments } from "@/lib/db/schema/sds-documents";
import { sdsExtractions } from "@/lib/db/schema/sds-extractions";

export const metadata: Metadata = {
  robots: "noindex",
};

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const card = await db
    .select()
    .from(safetyCards)
    .where(eq(safetyCards.publicToken, token))
    .limit(1);

  if (!card[0]) {
    notFound();
  }

  const org = await db
    .select({
      name: organizations.name,
      cardAccessMode: organizations.cardAccessMode,
    })
    .from(organizations)
    .where(eq(organizations.id, card[0].orgId))
    .limit(1);

  const sds = await db
    .select()
    .from(sdsDocuments)
    .where(eq(sdsDocuments.id, card[0].sdsId))
    .limit(1);

  const extraction = await db
    .select()
    .from(sdsExtractions)
    .where(eq(sdsExtractions.sdsId, card[0].sdsId))
    .limit(1);

  const sections = (extraction[0]?.sections ?? {}) as Record<string, unknown>;
  const section2 = (sections.section2 ?? {}) as {
    signalWord?: string;
    hazardStatements?: string[];
    pictograms?: string[];
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-amber-600 text-white p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-center">
            PHIẾU AN TOÀN HÓA CHẤT
          </h1>
          <p className="text-xs text-center opacity-80">
            Safety Data Sheet - MOIT Circular 01/2026/TT-BCT
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="text-xs text-gray-500 text-right">
          {org[0]?.name ?? "—"} | Tạo:{" "}
          {card[0].createdAt.toLocaleDateString("vi-VN")}
        </div>

        {sds[0] && (
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h2 className="font-semibold text-sm">1. Nhận dạng sản phẩm</h2>
            </div>
            <div className="p-4 space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Tên file:</span>{" "}
                {sds[0].filename}
              </p>
            </div>
          </section>
        )}

        <section className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h2 className="font-semibold text-sm">2. Nhận biết nguy hại</h2>
          </div>
          <div className="p-4 space-y-2 text-sm">
            {section2.signalWord && (
              <div
                className={`px-3 py-2 rounded font-semibold text-center ${
                  section2.signalWord === "Danger"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {section2.signalWord === "Danger" ? "NGUY HIỂM" : "CẢNH BÁO"}
              </div>
            )}
            {Array.isArray(section2.hazardStatements) &&
              section2.hazardStatements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Câu cảnh báo:</p>
                  <div className="flex flex-wrap gap-1">
                    {section2.hazardStatements.map(
                      (statement: unknown, index: number) =>
                        typeof statement === "string" && (
                          <span
                            key={index}
                            className="bg-amber-50 text-amber-900 px-2 py-1 rounded text-xs"
                          >
                            {statement}
                          </span>
                        )
                    )}
                  </div>
                </div>
              )}
            {Array.isArray(section2.pictograms) &&
              section2.pictograms.length > 0 && (
                <p className="text-xs text-gray-600">
                  Biểu tượng GHS: {section2.pictograms.join(", ")}
                </p>
              )}
          </div>
        </section>

        {card[0].blobUrl && (
          <a
            href={card[0].blobUrl}
            download
            className="block w-full text-center bg-amber-600 text-white px-6 py-4 rounded-lg font-semibold text-base hover:bg-amber-700 transition-colors"
            style={{ minHeight: 48 }}
          >
            Tải Phiếu an toàn (PDF)
          </a>
        )}

        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
          <p className="text-red-800 font-semibold text-sm">
            Đường dây nóng khẩn cấp
          </p>
          <p className="text-red-700 text-lg font-bold mt-1">
            1900 54 54 54
          </p>
          <p className="text-red-600 text-xs mt-1">
            Trung tâm Thông tin Chống độc
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Phiếu này được tạo tự động bằng AI. Người dùng phải tự xác minh
            trước khi sử dụng. SDS Platform không chịu trách nhiệm pháp lý cho
            việc sử dụng không đúng.
          </p>
          <p className="text-[10px] text-gray-400 text-center mt-1">
            This card was AI-generated. Users must verify before use.
          </p>
        </div>
      </main>
    </div>
  );
}
