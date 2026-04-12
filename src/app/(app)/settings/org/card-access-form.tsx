"use client";

import { useState } from "react";
import { updateCardAccessMode } from "./actions";

export function CardAccessForm({ currentMode }: { currentMode: string }) {
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateCardAccessMode(mode as "public_token" | "login_required");
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("public_token")}
          className={`flex-1 rounded-lg border p-3 text-sm text-left transition-colors ${
            mode === "public_token"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <p className="font-medium">Truy cập công khai</p>
          <p className="text-xs text-muted-foreground mt-1">
            Bất kỳ ai có mã QR đều có thể xem phiếu an toàn. Phù hợp cho phản
            ứng sự cố khẩn cấp.
          </p>
        </button>
        <button
          onClick={() => setMode("login_required")}
          className={`flex-1 rounded-lg border p-3 text-sm text-left transition-colors ${
            mode === "login_required"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <p className="font-medium">Yêu cầu đăng nhập</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chỉ người dùng đã đăng nhập mới xem được phiếu an toàn. An toàn hơn
            nhưng chậm hơn trong tình huống khẩn cấp.
          </p>
        </button>
      </div>
      {mode !== currentMode && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      )}
    </div>
  );
}
