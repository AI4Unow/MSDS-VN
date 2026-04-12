import Link from "next/link";
import { Gear, Buildings, ClipboardText } from "@phosphor-icons/react/dist/ssr";

export default async function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Cài đặt</h1>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Tài khoản</h2>
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Tên:</span>{" "}
            Dev User
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span>{" "}
            dev@ai4u.now
          </p>
        </div>
      </section>

      {/* Settings links */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Quản lý</h2>
        <div className="space-y-2">
          <Link
            href="/settings/org"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Buildings size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Cài đặt tổ chức</p>
              <p className="text-xs text-muted-foreground">
                Tên, logo, chế độ truy cập phiếu an toàn
              </p>
            </div>
          </Link>
          <Link
            href="/settings/audit"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <ClipboardText size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Nhật ký hoạt động</p>
              <p className="text-xs text-muted-foreground">
                Xem lịch sử các hành động trong tổ chức
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
