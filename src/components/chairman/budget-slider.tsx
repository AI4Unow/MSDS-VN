"use client";

interface BudgetSliderProps {
  componentId: number;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function BudgetSlider({ label, value, onChange }: BudgetSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-48 text-sm font-medium truncate">{label}</span>
      <input
        type="range"
        min={0}
        max={25}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
      />
      <span className="w-20 text-sm text-right font-mono">{value} tỷ</span>
    </div>
  );
}
