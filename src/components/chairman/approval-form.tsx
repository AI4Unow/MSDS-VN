"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovalForm({ coaId }: { coaId: string }) {
  const [action, setAction] = useState<"approved" | "rejected">("approved");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/asia-shine/coas/${coaId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded space-y-4">
      <h3 className="font-semibold text-lg">Tier 3 Approval</h3>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="action"
            value="approved"
            checked={action === "approved"}
            onChange={() => setAction("approved")}
          />
          Approve
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="action"
            value="rejected"
            checked={action === "rejected"}
            onChange={() => setAction("rejected")}
          />
          Reject
        </label>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Approval notes (required for rejection)..."
        className="w-full border rounded p-2 min-h-[80px]"
      />

      <button
        type="submit"
        disabled={submitting || (action === "rejected" && !notes.trim())}
        className={`px-6 py-2 rounded text-white ${
          action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
        } disabled:opacity-50`}
      >
        {submitting ? "Submitting..." : action === "approved" ? "Approve" : "Reject"}
      </button>
    </form>
  );
}
