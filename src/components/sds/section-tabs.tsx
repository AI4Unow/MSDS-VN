"use client";

import { SECTION_NAMES } from "@/lib/ai/extraction-schema";
// ConfidenceBadge removed — using inline dot indicator instead

type SectionConfidence = Record<string, number>;

export function SectionTabs({
  activeSection,
  onSectionChange,
  sectionConfidence,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  sectionConfidence: SectionConfidence;
}) {
  const sections = Object.entries(SECTION_NAMES);

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-2 border-b border-border"
      aria-label="SDS sections"
    >
      {sections.map(([key, label]) => {
        const isActive = key === activeSection;
        const conf = sectionConfidence[key] ?? 1;
        return (
          <button
            key={key}
            onClick={() => onSectionChange(key)}
            className={`
              shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors
              ${isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
            aria-current={isActive ? "true" : undefined}
          >
            {label}
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor:
                  conf >= 0.9 ? "#22c55e" : conf >= 0.7 ? "#f59e0b" : "#ef4444",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
