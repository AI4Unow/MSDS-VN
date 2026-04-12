import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema/audit-log";
import { eq, desc } from "drizzle-orm";

export default async function AuditLogPage() {
  const { orgId } = await requireOrg();

  const logs = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.orgId, orgId))
    .orderBy(desc(auditLog.ts))
    .limit(100);

  const actionLabels: Record<string, string> = {
    sds_upload: "Tải lên SDS",
    sds_extract: "Trích xuất SDS",
    extraction_field_update: "Cập nhật trường trích xuất",
    safety_card_generate: "Tạo phiếu an toàn",
    safety_card_view: "Xem phiếu an toàn",
    org_settings_update: "Cập nhật cài đặt tổ chức",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Nhật ký hoạt động</h1>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có hoạt động nào được ghi nhận.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Thời gian</th>
                <th className="pb-3 pr-4 font-medium">Hành động</th>
                <th className="pb-3 pr-4 font-medium">Đối tượng</th>
                <th className="pb-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                    {log.ts.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    {actionLabels[log.action] ?? log.action}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {log.targetType}{" "}
                    {log.targetId
                      ? log.targetId.slice(0, 8) + "..."
                      : ""}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
