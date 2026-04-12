import Link from "next/link";
import { SdsStatusBadge } from "./sds-status-badge";
import { Eye } from "@phosphor-icons/react/dist/ssr";

type SdsRow = {
  id: string;
  filename: string;
  supplier: string | null;
  status: string;
  sizeBytes: number;
  createdAt: Date;
};

export function SdsTable({ documents }: { documents: SdsRow[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Chưa có tài liệu SDS nào. Tải lên tài liệu đầu tiên để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium">File</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Nhà cung cấp</th>
            <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Dung lượng</th>
            <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Ngày tạo</th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <span className="font-medium truncate block max-w-[200px]">
                  {doc.filename}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {doc.supplier ?? "—"}
              </td>
              <td className="px-4 py-3">
                <SdsStatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                {formatBytes(doc.sizeBytes)}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                {formatDate(doc.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/sds/${doc.id}`}
                  className="inline-flex p-1.5 rounded hover:bg-muted"
                  aria-label={`Xem ${doc.filename}`}
                >
                  <Eye size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
