"use client";

import { useState } from "react";
import { ConfidenceBadge } from "./confidence-badge";
import { PencilSimple, Check, X } from "@phosphor-icons/react/dist/ssr";

type FieldValue = {
  value: unknown;
  _confidence: number;
};

export function SectionEditor({
  sectionKey: _sectionKey,
  data,
}: {
  sectionKey: string;
  data: Record<string, unknown>;
}) {
  if (!data) return <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>;

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, val]) => {
        if (Array.isArray(val)) {
          return <ArrayFieldList key={key} label={key} items={val} />;
        }
        if (val !== null && typeof val === "object" && "_confidence" in (val as object)) {
          const fv = val as FieldValue;
          return (
            <EditableField key={key} label={key} value={fv.value as string} confidence={fv._confidence} />
          );
        }
        if (val !== null && typeof val === "object" && !("_confidence" in (val as object))) {
          return (
            <NestedFieldGroup key={key} label={key} data={val as Record<string, unknown>} />
          );
        }
        return null;
      })}
    </div>
  );
}

function EditableField({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string | null;
  confidence: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-xs text-muted-foreground w-36 shrink-0 pt-1">
        {formatLabel(label)}
      </span>
      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 rounded border border-primary bg-transparent px-2 py-1 text-sm focus-visible:outline-ring"
            autoFocus
          />
          <button className="p-1 rounded hover:bg-muted" aria-label="Lưu">
            <Check size={16} className="text-green-600" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setEditing(false)}
            aria-label="Hủy"
          >
            <X size={16} className="text-destructive" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm">{value ?? "—"}</span>
          <ConfidenceBadge confidence={confidence} />
          <button
            className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditing(true)}
            aria-label={`Chỉnh sửa ${formatLabel(label)}`}
          >
            <PencilSimple size={14} className="text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

function ArrayFieldList({
  label,
  items,
}: {
  label: string;
  items: unknown[];
}) {
  return (
    <div className="py-1">
      <span className="text-xs text-muted-foreground">{formatLabel(label)}</span>
      <ul className="mt-1 space-y-1">
        {items.map((item, idx) => {
          if (typeof item === "object" && item !== null && "_confidence" in (item as object)) {
            const fv = item as FieldValue;
            return (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span>{String(fv.value ?? "—")}</span>
                <ConfidenceBadge confidence={fv._confidence} />
              </li>
            );
          }
          if (typeof item === "object" && item !== null) {
            return (
              <li key={idx} className="pl-3 border-l-2 border-border">
                <NestedFieldGroup label={`#${idx + 1}`} data={item as Record<string, unknown>} />
              </li>
            );
          }
          return (
            <li key={idx} className="text-sm">{String(item)}</li>
          );
        })}
      </ul>
    </div>
  );
}

function NestedFieldGroup({
  label,
  data,
}: {
  label: string;
  data: Record<string, unknown>;
}) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{formatLabel(label)}</span>
      <div className="pl-2 mt-1 space-y-1">
        {Object.entries(data).map(([key, val]) => {
          if (val !== null && typeof val === "object" && "_confidence" in (val as object)) {
            const fv = val as FieldValue;
            return (
              <EditableField key={key} label={key} value={fv.value as string} confidence={fv._confidence} />
            );
          }
          return (
            <div key={key} className="flex gap-2 text-sm">
              <span className="text-xs text-muted-foreground">{formatLabel(key)}:</span>
              <span>{val !== null ? String(val) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
