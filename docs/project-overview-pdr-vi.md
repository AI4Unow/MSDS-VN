# Tổng quan Dự án & PDR

## Giới thiệu
Nền tảng MSDS là ứng dụng web quản lý SDS dành cho các doanh nghiệp vừa và nhỏ (SMBs) tại Đông Nam Á. Nền tảng này giải quyết bài toán tuân thủ bắt buộc được quy định trong Luật Hóa chất 2025 và Thông tư 01/2026/TT-BCT, trong đó yêu cầu phải có phiếu an toàn hóa chất được bản địa hóa (tiếng Việt) cho tất cả các loại hóa chất.

## Đối tượng Mục tiêu
Các doanh nghiệp vừa và nhỏ tại Việt Nam có xử lý từ 20–500 loại hóa chất, đặc biệt là các nhà phân phối hóa chất, đơn vị nhập khẩu nguyên liệu dược phẩm/mỹ phẩm và phụ gia thực phẩm. Đối tác thiết kế (design partner) đầu tiên là Asia Shine.

## Các tính năng cốt lõi (MVP)
1. **Kho lưu trữ SDS**: Tải lên, quản lý phiên bản, tìm kiếm toàn văn bản + ngữ nghĩa.
2. **Trích xuất AI**: Claude vision trích xuất cấu trúc 16 phần GHS sang file JSON (không dùng OCR truyền thống).
3. **Trình tạo Phiếu An toàn Hóa chất (Tiếng Việt)**: Tạo file PDF tuân thủ quy định của Bộ Công Thương kèm theo mã QR để truy cập trên thiết bị di động.
4. **Chatbot Hỏi đáp Tuân thủ**: LLM dựa trên nền tảng LLM Wiki liên tục được cập nhật các kiến thức về pháp lý.
5. **Tra cứu CAS**: Tích hợp PubChem cho danh mục hóa chất cơ bản.
6. **Tổ chức Đa không gian làm việc (Multi-Tenant Org)**: Phân quyền truy cập bằng Supabase RLS.

## Tiêu chí Thành công của MVP
- Có 1 khách hàng trả phí (Asia Shine) trước ngày thứ 90.
- Chi phí API Claude < $0.30 cho mỗi SDS.
- 95% SDS được trích xuất tự động.
- Độ chính xác của chatbot đạt 80% so với chuyên gia tư vấn EHS.
