"use client";

import { useState } from "react";
import { updateOrgName } from "./actions";

export function UpdateOrgNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await updateOrgName(name.trim());
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-input bg-card px-4 py-2 text-sm focus-visible:outline-ring"
      />
      <button
        type="submit"
        disabled={saving || !name.trim() || name === currentName}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
