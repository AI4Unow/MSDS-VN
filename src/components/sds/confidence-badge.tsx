export function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color: string;
  let label: string;

  if (confidence >= 0.9) {
    color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    label = "Cao";
  } else if (confidence >= 0.7) {
    color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    label = "Trung bình";
  } else {
    color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    label = "Thấp";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${color}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {label} ({(confidence * 100).toFixed(0)}%)
    </span>
  );
}
