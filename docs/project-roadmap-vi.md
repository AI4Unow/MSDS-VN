# Lộ trình Dự án

Lộ trình triển khai MVP của nền tảng MSDS Platform được dự kiến gói gọn trong vòng 90 ngày.

## Giai đoạn 00: Đánh giá Nhu cầu Trước khi Khởi tạo Code (Tuần 0)
- Tổ chức các cuộc phỏng vấn trực tiếp với các nhà Quản lý EHS (An toàn, Sức khỏe, Môi trường) tại Việt Nam, bao gồm thiết kế đối tác thí điểm Asia Shine.
- Thẩm định tính khả thi của dự án và đảm bảo vượt qua tiêu chí "3 ý kiến thật sự Cần/Sẽ mua".

## Giai đoạn 01: Xây dựng Nền tảng (Tuần 1)
- Xây dựng bản mẫu chuẩn theo mô hình Next.js 15.
- Cấu hình dự án thiết kế Supabase (Xác thực, Lưu trữ, và RLS - Bảo mật cấp hàng).
- Xây dựng bản mẫu giao diện ứng dụng với shadcn/ui.

## Giai đoạn 02: Hệ thống đẩy SDS + Inngest (Tuần 2)
- Hệ thống hỗ trợ xử lý file PDF SDS văn bản đẩy qua giao diện người dùng (UI).
- Thiết lập cấu trúc lõi với Inngest xử lý background job chạy nền.

## Giai đoạn 03: AI trích xuất hệ thống & Xem lại Giao diện người dùng UI (Tuần 3-4)
- Xây dựng mô hình đọc dạng hình ảnh với prompt từ Claude đo lường 16 tiêu chuẩn GHS để chuyển thông số thành đoạn JSON.
- Theo dõi cấp độ tin cậy và sự can thiệp review vòng lại của con người.

## Giai đoạn 04: Bộ tổng về Hóa Chất + Tích hợp PubChem (Tuần 5)
- Hợp nhất và tra cứu các chuẩn hệ thống PubChem.
- Gửi lên các bảng danh mục dữ liệu `chemicals` toàn cầu theo chuẩn Full-text Search.

## Giai đoạn 05: Tính năng LLM Wiki Phiên bản đẩu (Tuần 6)
- Xây dựng mô hình tệp sườn bằng định dạng Markdown cho hệ thống bảng văn bản Pháp luật - Tiêu chuẩn hiện hành.
- Cập nhật hạt giống khởi chạy kho 50 hóa chất thường gặp, Thông tư 01/2026, và hệ thống phân loại hóa chất GHS Phiên bản T10.

## Giai đoạn 06: Trình tạo Phiếu Thông số An toàn Hóa chất (VI) (Tuần 7-8)
- Phát triển quy trình khởi tạo Phiếu khai hóa chất được tích hợp cho hệ thống sinh file PDF phù hợp Mẫu Thông tư 01 của Bộ Công Thương.
- Thiết kế hệ thống xem công khai qua đi động và tích hợp lấy file qua quét mã QR.

## Giai đoạn 07: Kênh Chat Khảo tra Tuân thủ (Tuần 9)
- Gộp nội dung kho vector hạ tầng nhúng pgvector phủ định trên các tệp giao diện trang wiki.
- Phát triển hệ thống nền hỏi/đáp LLM cung cấp các trích dẫn và thông báo giải trình liên kết gốc.

## Giai đoạn 08 & 09: Bảng quyền - Thanh toán và Khởi động Lên sóng (Tuần 10-12)
- Hỗ trợ mô hình Doanh nghiệp tập trung (Mời thành viên cấp vai trò/Quyền hạn nhiều Không gian truy cập tổ chức).
- Tích hợp khung thanh toán (Stripe / Stub hỗ trợ MoMo).
- Chuyển dự án qua khách hàng Asia Shine và thanh toán ứng dụng chạy bản Beta trải nghiệm lên cộng đồng.
