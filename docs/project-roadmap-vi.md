# Lộ trình Dự án

Lộ trình triển khai MVP của nền tảng MSDS Platform được dự kiến gói gọn trong vòng 90 ngày.

> **Cập nhật lần cuối:** 2026-04-11. Stack: Next.js 16 + React 19 + Supabase + Inngest + Claude API. Truy xuất: index-driven (không dùng embeddings).

## Giai đoạn 00: Đánh giá Nhu cầu Trước khi Khởi tạo Code (Tuần 0) — Chưa bắt đầu
- Tổ chức các cuộc phỏng vấn trực tiếp với các nhà Quản lý EHS (An toàn, Sức khỏe, Môi trường) tại Việt Nam, bao gồm thiết kế đối tác thí điểm Asia Shine.
- Thẩm định tính khả thi của dự án và đảm bảo vượt qua tiêu chí "3 ý kiến thật sự Cần/Sẽ mua".

## Giai đoạn 01: Xây dựng Nền tảng (Tuần 1) — ✅ Hoàn thành
- Xây dựng bản mẫu chuẩn theo mô hình Next.js 16 (16.2.3 + React 19.2.4).
- Cấu hình dự án thiết kế Supabase (Xác thực, Lưu trữ, và RLS - Bảo mật cấp hàng).
- Xây dựng bản mẫu giao diện ứng dụng với shadcn/ui.
- Bảng audit logging + helper.

## Giai đoạn 02: Hệ thống đẩy SDS + Inngest (Tuần 2) — ✅ Hoàn thành
- Hệ thống hỗ trợ xử lý file PDF SDS văn bản đẩy qua giao diện người dùng (UI).
- Thiết lập cấu trúc lõi với Inngest xử lý background job chạy nền.

## Giai đoạn 03: AI trích xuất hệ thống & Xem lại Giao diện người dùng UI (Tuần 3-4) — ✅ Hoàn thành
- Xây dựng mô hình đọc dạng hình ảnh với prompt từ Claude đo lường 16 tiêu chuẩn GHS để chuyển thông số thành đoạn JSON.
- Theo dõi cấp độ tin cậy và sự can thiệp review vòng lại của con người.

## Giai đoạn 04: Bộ tổng về Hóa Chất + Tích hợp PubChem (Tuần 5) — ✅ Hoàn thành
- Hợp nhất và tra cứu các chuẩn hệ thống PubChem.
- Gửi lên các bảng danh mục dữ liệu `chemicals` toàn cầu theo chuẩn Full-text Search.

## Giai đoạn 05: Tính năng LLM Wiki Phiên bản đầu (Tuần 6) — 🔄 Đang triển khai
- Xây dựng mô hình tệp sườn bằng định dạng Markdown cho hệ thống bảng văn bản Pháp luật - Tiêu chuẩn hiện hành.
- Truy xuất dựa trên chỉ mục (Karpathy pattern) — không dùng pgvector, không dùng embeddings.
- Cập nhật hạt giống khởi chạy kho 50 hóa chất thường gặp, Thông tư 01/2026, và hệ thống phân loại hóa chất GHS Phiên bản T10.
- **Còn lại:** Script tạo dữ liệu mẫu, lint cron hàng đêm, trình biên tập admin.

## Giai đoạn 06: Trình tạo Phiếu Thông số An toàn Hóa chất (VI) (Tuần 7-8) — 🔄 Đang triển khai
- Phát triển quy trình khởi tạo Phiếu khai hóa chất được tích hợp cho hệ thống sinh file PDF phù hợp Mẫu Thông tư 01 của Bộ Công Thương.
- Thiết kế hệ thống xem công khai qua di động và tích hợp lấy file qua quét mã QR.
- **Còn lại:** Template react-pdf, hàm Inngest generate đầy đủ, cổng kiểm duyệt tư vấn viên.

## Giai đoạn 07: Kênh Chat Khảo tra Tuân thủ (Tuần 9) — 🔄 Đang triển khai
- Tìm kiếm dựa trên chỉ mục (index-driven) qua các trang wiki (không dùng embeddings, không dùng pgvector).
- Phát triển hệ thống nền hỏi/đáp LLM cung cấp các trích dẫn và thông báo giải trình liên kết gốc.
- **Còn lại:** Giao diện citation, model routing, đo lường chi phí, benchmark.

## Giai đoạn 08: Hồ sơ Tổ chức + Cài đặt Truy cập (Tuần 10) — ✅ Hoàn thành
- Hoàn thiện hồ sơ tổ chức, chế độ truy cập phiếu an toàn.
- Mô hình người dùng đơn trên mỗi tổ chức (không có team membership).

## Giai đoạn 09: Thanh toán + Trang chủ + Khởi động (Tuần 11-12) — ✅ Hoàn thành
- Gói thanh toán + kiểm tra quyền truy cập + theo dõi sử dụng.
- Trang cài đặt thanh toán với thanh sử dụng.
- Trang marketing landing + trang pháp lý (điều khoản, bảo mật, DPA).
- Bộ xử lý thanh toán (Stripe/MoMo) hoãn đến sau MVP.
- Sẵn sàng chuyển đổi Asia Shine.
