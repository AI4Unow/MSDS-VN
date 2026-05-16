interface KpiGaugeProps {
  label: string;
  current: number;
  target: number;
  baseline: number;
  unit: string;
}

export function KpiGauge({ label, current, target, baseline, unit }: KpiGaugeProps) {
  const range = Math.abs(target - baseline) || 1;
  const progress = Math.min(100, Math.max(0, ((current - baseline) / range) * 100));
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="p-4 border rounded">
      <p className="text-sm text-gray-600 mb-1">{displayLabel}</p>
      <p className="text-2xl font-bold">
        {current.toFixed(1)} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </p>
      <div className="mt-2 w-full bg-gray-200 rounded h-2">
        <div className="bg-blue-600 rounded h-2 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Baseline: {baseline}</span>
        <span>Target: {target}</span>
      </div>
    </div>
  );
}
