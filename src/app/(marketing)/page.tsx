import Link from "next/link";
import { Flame, FileText, ChatCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-graphite-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Bảng giá
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Phiếu an toàn hóa chất
              <br />
              <span className="text-amber-600">tuân thủ Circular 01/2026</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-[62ch] leading-relaxed">
              Tự động trích xuất SDS, dịch sang tiếng Việt theo mẫu MOIT, tạo
              phiếu an toàn có mã QR. Giúp quản lý EHS tuân thủ quy định Việt
              Nam nhanh hơn 10 lần.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/waitlist"
                className="rounded-lg bg-amber-600 px-6 py-3 text-base font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                Tham gia danh sách chờ
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Xem bảng giá
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            {/* Product screenshot placeholder */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <ShieldCheck size={18} weight="fill" />
                  Phiếu an toàn đã tạo
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-amber-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 bg-amber-50 rounded border border-amber-200" />
                  <div className="h-8 flex-1 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Quản lý hóa chất toàn diện
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <FileText size={28} className="text-amber-600 mb-4" />
              <h3 className="font-semibold mb-2">Trích xuất SDS bằng AI</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tải lên PDF SDS tiếng Anh. AI Gemini trích xuất 16 phần GHS,
                đánh giá độ tin cậy từng trường. Nhân viên EHS kiểm tra và chỉnh
                sửa trực tiếp.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <ShieldCheck size={28} className="text-amber-600 mb-4" />
              <h3 className="font-semibold mb-2">
                Phiếu an toàn tiếng Việt MOIT
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dịch thuật thuật ngữ chuyên ngành theo bảng thuật ngữ MOIT. Tạo
                PDF theo mẫu Circular 01/2026/TT-BCT kèm mã QR truy cập nhanh.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <ChatCircle size={28} className="text-amber-600 mb-4" />
              <h3 className="font-semibold mb-2">Tư vấn tuân thủ</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hỏi đáp về quy định hóa chất Việt Nam. AI trả lời dựa trên kho
                kiến thức quy định pháp luật, kèm trích dẫn nguồn cụ thể.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Sẵn sàng tuân thủ Circular 01/2026?
          </h2>
          <p className="text-gray-600 mb-8 max-w-[62ch] mx-auto">
            Tham gia danh sách chờ để sớm trải nghiệm nền tảng quản lý an toàn
            hóa chất đầu tiên dành riêng cho thị trường Việt Nam.
          </p>
          <Link
            href="/waitlist"
            className="inline-block rounded-lg bg-amber-600 px-8 py-4 text-base font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Tham gia danh sách chờ
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame size={20} weight="fill" className="text-amber-600" />
            <span className="text-sm font-semibold">MSDS Platform</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-700">
              Điều khoản
            </Link>
            <Link href="/privacy" className="hover:text-gray-700">
              Bảo mật
            </Link>
            <Link href="/dpa" className="hover:text-gray-700">
              DPA
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
