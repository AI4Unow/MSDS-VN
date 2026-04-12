"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const companyName = form.get("companyName") as string;
    const role = form.get("role") as string;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi không xác định");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi gửi form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-16">
        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle
              size={48}
              weight="fill"
              className="mx-auto text-green-500"
            />
            <h1 className="text-2xl font-bold">Cảm ơn bạn đã đăng ký!</h1>
            <p className="text-gray-600">
              Chúng tôi sẽ liên hệ khi nền tảng sẵn sàng.
            </p>
            <Link href="/" className="text-amber-600 text-sm hover:underline">
              Quay về trang chủ
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">
              Tham gia danh sách chờ
            </h1>
            <p className="text-gray-600 mb-8">
              Đăng ký để sớm trải nghiệm nền tảng quản lý an toàn hóa chất.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium mb-1"
                >
                  Tên công ty
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Công ty TNHH ABC"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1">
                  Vai trò
                </label>
                <select
                  id="role"
                  name="role"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">Chọn vai trò</option>
                  <option value="ehs_manager">Quản lý EHS</option>
                  <option value="safety_officer">Cán bộ an toàn</option>
                  <option value="plant_manager">Giám đốc nhà máy</option>
                  <option value="consultant">Tư vấn viên</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-600 px-6 py-3 text-base font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Đang gửi..." : "Đăng ký"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
