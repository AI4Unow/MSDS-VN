"use client";

import { useState } from "react";
import { SectionTabs } from "@/components/sds/section-tabs";
import { SectionEditor } from "@/components/sds/section-editor";

export function SdsDetailClient({
  sections,
  blobUrl,
}: {
  sections: Record<string, Record<string, unknown>>;
  blobUrl: string;
}) {
  const sectionKeys = Object.keys(sections);
  const [activeSection, setActiveSection] = useState(sectionKeys[0] ?? "section_1");

  // Compute per-section average confidence
  const sectionConfidence: Record<string, number> = {};
  for (const [key, data] of Object.entries(sections)) {
    const confidences: number[] = [];
    collectConfidences(data, confidences);
    sectionConfidence[key] =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 1;
  }

  return (
    <div className="space-y-4">
      <SectionTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionConfidence={sectionConfidence}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section editor */}
        <div className="rounded-lg border border-border bg-card p-4 group">
          <SectionEditor
            sectionKey={activeSection}
            data={sections[activeSection] ?? {}}
          />
        </div>

        {/* PDF preview */}
        <div className="rounded-lg border border-border overflow-hidden">
          <iframe
            src={blobUrl}
            className="w-full h-[60vh]"
            title="SDS PDF preview"
          />
        </div>
      </div>
    </div>
  );
}

function collectConfidences(obj: unknown, out: number[]) {
  if (obj === null || obj === undefined || typeof obj !== "object") return;
  if ("_confidence" in (obj as object)) {
    out.push((obj as { _confidence: number })._confidence);
    return;
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(val)) val.forEach((v) => collectConfidences(v, out));
    else if (typeof val === "object") collectConfidences(val, out);
  }
}
