import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SdsTable } from "@/components/sds/sds-table";
import Link from "next/link";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr";

export default async function SdsPage() {
  const { orgId } = await requireOrg();

  const documents = await db
    .select()
    .from(sdsDocuments)
    .where(eq(sdsDocuments.orgId, orgId))
    .orderBy(desc(sdsDocuments.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tài liệu SDS</h1>
        <Link
          href="/sds/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <UploadSimple size={16} />
          Tải lên
        </Link>
      </div>

      <SdsTable documents={documents} />
    </div>
  );
}
