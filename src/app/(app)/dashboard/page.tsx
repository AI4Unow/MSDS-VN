import Link from "next/link";
import { FileText, Flask, ChatCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db/client";
import { sdsDocuments, chemicals } from "@/lib/db/schema";
import { requireOrg } from "@/lib/auth/require-org";
import { eq, count } from "drizzle-orm";

export default async function DashboardPage() {
  const { orgId } = await requireOrg();

  const [sdsCount] = await db
    .select({ count: count() })
    .from(sdsDocuments)
    .where(eq(sdsDocuments.orgId, orgId));

  const [chemCount] = await db
    .select({ count: count() })
    .from(chemicals)
    .where(eq(chemicals.orgId, orgId));

  const stats = [
    { label: "Tài liệu SDS", labelEn: "SDS Documents", value: String(sdsCount?.count ?? 0), icon: FileText, href: "/sds" },
    { label: "Hóa chất", labelEn: "Chemicals", value: String(chemCount?.count ?? 0), icon: Flask, href: "/chemicals" },
    { label: "Phiếu an toàn", labelEn: "Safety Cards", value: "0", icon: Warning, href: "/sds" },
    { label: "Câu hỏi tuân thủ", labelEn: "Chat Queries", value: "0", icon: ChatCircle, href: "/chat" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Xin chào, Dev User
        </h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan hoạt động quản lý SDS
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-border bg-card p-4 space-y-2 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={18} />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Bắt đầu bằng cách tải lên tài liệu SDS đầu tiên của bạn.
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Start by uploading your first SDS document.
        </p>
      </div>
    </div>
  );
}
