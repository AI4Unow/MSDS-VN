import Link from "next/link";
import { Flame } from "@phosphor-icons/react/dist/ssr";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Chính sách Bảo mật</h1>
        <p className="text-sm text-gray-500 mb-8">
          Phiên bản 1.0 — Ngày có hiệu lực: 12/04/2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Dữ liệu thu thập</h2>
            <p>Chúng tôi thu thập các loại dữ liệu sau:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Thông tin tài khoản:</strong> tên, email, tên tổ chức.
              </li>
              <li>
                <strong>Tài liệu SDS:</strong> file PDF tải lên, nội dung trích
                xuất, dữ liệu hóa chất.
              </li>
              <li>
                <strong>Dữ liệu sử dụng:</strong> lịch sử chat, nhật ký hoạt
                động.
              </li>
              <li>
                <strong>Dữ liệu kỹ thuật:</strong> địa chỉ IP, loại trình duyệt.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Mục đích xử lý</h2>
            <p>Dữ liệu được xử lý nhằm:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Cung cấp và cải thiện dịch vụ.</li>
              <li>Trích xuất và dịch thuật SDS.</li>
              <li>Tạo phiếu an toàn hóa chất.</li>
              <li>Tư vấn tuân thủ quy định.</li>
              <li>Đảm bảo bảo mật và chống lạm dụng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Lưu trữ và bảo vệ</h2>
            <p>
              Dữ liệu được lưu trữ trên hạ tầng Vercel (Hoa Kỳ / Singapore) với
              mã hóa tại chỗ (encryption at rest) và truyền tải (TLS). Tài liệu
              SDS được lưu trữ riêng theo tổ chức (tenant isolation).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Chia sẻ dữ liệu</h2>
            <p>
              Chúng tôi không bán dữ liệu khách hàng. Dữ liệu chỉ được chia sẻ
              với:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Nhà cung cấp hạ tầng (Vercel, Google AI).</li>
              <li>Cơ quan chức năng khi có yêu cầu pháp lý hợp lệ.</li>
            </ul>
            <p className="mt-2">
              Nội dung chat chỉ ghi siêu dữ liệu (model, token, duration) vào
              hệ thống giám sát — không ghi nội dung chat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Quyền của bạn</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Truy cập và tải xuống dữ liệu cá nhân.</li>
              <li>Yêu cầu xóa dữ liệu (trừ khi pháp luật yêu cầu lưu trữ).</li>
              <li>Kháng nghị việc xử lý dữ liệu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Liên hệ</h2>
            <p>
              Cán bộ bảo vệ dữ liệu: privacy@msds.vn
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Chính sách Bảo mật v1.0 — Có hiệu lực từ 12/04/2026
        </div>
      </main>
    </div>
  );
}
