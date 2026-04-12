import Link from "next/link";
import { Flame } from "@phosphor-icons/react/dist/ssr";

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">
          Thỏa thuận Xử lý Dữ liệu (DPA)
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Phiên bản 1.0 — Ngày có hiệu lực: 12/04/2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Các bên</h2>
            <p>
              <strong>Bên kiểm soát dữ liệu (&quot;Khách hàng&quot;):</strong>{" "}
              Tổ chức đăng ký sử dụng MSDS Platform.
            </p>
            <p>
              <strong>Bên xử lý dữ liệu (&quot;SDS Platform&quot;):</strong>{" "}
              Shine Group, nhà cung cấp nền tảng MSDS Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Phạm vi xử lý</h2>
            <p>SDS Platform xử lý dữ liệu cá nhân sau thay mặt Khách hàng:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Thông tin tài khoản người dùng (tên, email).</li>
              <li>Tài liệu SDS và dữ liệu hóa chất tải lên.</li>
              <li>Nội dung câu hỏi và câu trả lời tư vấn.</li>
              <li>Nhật ký hoạt động trong hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Nghĩa vụ của Bên xử lý</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Chỉ xử lý dữ liệu theo hướng dẫn của Khách hàng và pháp luật áp
                dụng.
              </li>
              <li>Đảm bảo nhân viên xử lý dữ liệu tuân thủ bảo mật.</li>
              <li>
                Thực hiện biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ
                liệu.
              </li>
              <li>Thông báo vi phạm dữ liệu trong vòng 72 giờ.</li>
              <li>Xóa hoặc trả lại dữ liệu khi kết thúc hợp đồng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Tiểu xử lý</h2>
            <p>SDS Platform sử dụng các tiểu xử lý sau:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Vercel Inc.</strong> — hạ tầng lưu trữ và tính toán (Hoa
                Kỳ).
              </li>
              <li>
                <strong>Google LLC.</strong> — dịch vụ AI Gemini (Hoa Kỳ).
              </li>
              <li>
                <strong>Resend Inc.</strong> — dịch vụ gửi email (Hoa Kỳ).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Chuyển dữ liệu quốc tế</h2>
            <p>
              Dữ liệu có thể được chuyển ra ngoài Việt Nam đến Hoa Kỳ và
              Singapore thông qua các nhà cung cấp dịch vụ nêu trên. SDS Platform
              đảm bảo các biện pháp bảo vệ phù hợp theo pháp luật Việt Nam về bảo
              vệ dữ liệu cá nhân.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Liên hệ</h2>
            <p>
              Mọi yêu cầu liên quan đến DPA vui lòng gửi đến: legal@msds.vn
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Thỏa thuận Xử lý Dữ liệu v1.0 — Có hiệu lực từ 12/04/2026
        </div>
      </main>
    </div>
  );
}
