import Link from "next/link";
import { Flame } from "@phosphor-icons/react/dist/ssr";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Flame size={28} weight="fill" className="text-amber-600" />
          <span className="font-bold text-lg">MSDS Platform</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* AI Disclaimer */}
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 mb-8">
          <p className="text-sm font-semibold text-amber-800">
            Thông báo quan trọng về AI
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Tất cả phiếu an toàn hóa chất và câu trả lời tư vấn được tạo tự động
            bằng trí tuệ nhân tạo (AI). Khách hàng hoàn toàn chịu trách nhiệm
            xác minh tính chính xác trước khi sử dụng. SDS Platform không chịu
            trách nhiệm pháp lý cho bất kỳ thiệt hại nào phát sinh từ việc sử
            dụng kết quả AI mà không có xác minh độc lập.
          </p>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Điều khoản Sử dụng Dịch vụ
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Phiên bản 1.0 — Ngày có hiệu lực: 12/04/2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập hoặc sử dụng MSDS Platform (&quot;Dịch vụ&quot;),
              bạn đồng ý bị ràng buộc bởi các Điều khoản Sử dụng này. Nếu bạn
              không đồng ý, vui lòng không sử dụng Dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Mô tả dịch vụ</h2>
            <p>
              MSDS Platform cung cấp nền tảng quản lý phiếu an toàn hóa chất
              (SDS) bao gồm: trích xuất thông tin từ tài liệu SDS bằng AI, dịch
              thuật sang tiếng Việt theo quy định MOIT (Circular 01/2026/TT-BCT),
              tạo phiếu an toàn hóa chất Việt Nam, và tư vấn tuân thủ quy định
              hóa chất.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Miễn trừ trách nhiệm AI</h2>
            <p>
              Dịch vụ sử dụng trí tuệ nhân tạo (AI) để trích xuất, dịch thuật và
              tạo nội dung. Khách hàng thừa nhận rằng:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Kết quả AI mang tính tham khảo và không thay thế tư vấn chuyên
                môn.
              </li>
              <li>
                Khách hàng phải tự xác minh tính chính xác của mọi phiếu an toàn
                và câu trả lời tư vấn.
              </li>
              <li>
                SDS Platform không đảm bảo độ chính xác 100% của kết quả AI.
              </li>
              <li>
                Nội dung wiki quy định đã được chuyên gia EHS tư vấn kiểm tra.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Giới hạn trách nhiệm</h2>
            <p>
              Tổng trách nhiệm bồi thường của SDS Platform trong mọi trường hợp
              sẽ không vượt quá số phí mà khách hàng đã thanh toán trong 12 tháng
              liên tục trước khi phát sinh khiếu nại. Trong giai đoạn miễn phí,
              giới hạn này áp dụng theo mức tối thiểu do pháp luật quy định.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Bồi hoàn</h2>
            <p>
              Khách hàng đồng ý bồi hoàn và bảo vệ SDS Platform khỏi mọi khiếu
              nại, thiệt hại và chi phí phát sinh từ việc khách hàng sử dụng kết
              quả AI mà không thực hiện xác minh độc lập theo yêu cầu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Quyền sở hữu trí tuệ</h2>
            <p>
              Khách hàng giữ quyền sở hữu đối với dữ liệu SDS tải lên. SDS
              Platform giữ quyền sở hữu đối với nền tảng phần mềm, thuật toán AI
              và wiki quy định.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Chấm dứt dịch vụ</h2>
            <p>
              SDS Platform có quyền tạm ngừng hoặc chấm dứt tài khoản nếu phát
              hiện sử dụng sai mục đích, vi phạm điều khoản, hoặc hành vi có thể
              gây nguy hiểm cho người dùng khác.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Luật áp dụng</h2>
            <p>
              Các điều khoản này chịu sự điều chỉnh của pháp luật Việt Nam. Mọi
              tranh chấp sẽ được giải quyết thông qua trọng tài hoặc tòa án có
              thẩm quyền theo quy định pháp luật.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Liên hệ</h2>
            <p>
              Mọi câu hỏi về Điều khoản này vui lòng gửi đến email:
              legal@msds.vn
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          Điều khoản Sử dụng v1.0 — Có hiệu lực từ 12/04/2026
        </div>
      </main>
    </div>
  );
}
