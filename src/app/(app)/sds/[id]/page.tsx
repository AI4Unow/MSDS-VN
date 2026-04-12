import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { sdsDocuments, sdsExtractions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SdsStatusBadge } from "@/components/sds/sds-status-badge";
import { SdsDetailClient } from "./detail-client";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default async function SdsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await requireOrg();
  const { id } = await params;

  const [doc] = await db
    .select()
    .from(sdsDocuments)
    .where(and(eq(sdsDocuments.id, id), eq(sdsDocuments.orgId, orgId)))
    .limit(1);

  if (!doc) notFound();

  // Fetch extraction if available
  const [extraction] = doc.status !== "pending"
    ? await db
        .select()
        .from(sdsExtractions)
        .where(eq(sdsExtractions.sdsId, id))
        .limit(1)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/sds"
          className="p-2 rounded-md hover:bg-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold truncate">{doc.filename}</h1>
        <SdsStatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaItem label="Nhà cung cấp" value={doc.supplier} />
        <MetaItem label="Ngôn ngữ gốc" value={doc.sourceLang.toUpperCase()} />
        <MetaItem label="Phiên bản" value={`v${doc.version}`} />
        <MetaItem
          label="Ngày tạo"
          value={new Intl.DateTimeFormat("vi-VN").format(new Date(doc.createdAt))}
        />
      </div>

      {/* Extraction viewer or empty state */}
      {extraction?.sections ? (
        <SdsDetailClient
          sections={extraction.sections as Record<string, Record<string, unknown>>}
          blobUrl={doc.blobUrl}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <iframe
            src={doc.blobUrl}
            className="w-full h-[70vh]"
            title={doc.filename}
          />
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}
