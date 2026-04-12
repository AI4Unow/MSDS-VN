const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  extracting: {
    label: "Đang trích xuất",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  needs_review: {
    label: "Cần kiểm tra",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  ready: {
    label: "Sẵn sàng",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  failed: {
    label: "Lỗi",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function SdsStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
