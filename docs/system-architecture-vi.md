# Kiến trúc Hệ thống

Nền tảng MSDS sử dụng kiến trúc serverless hiện đại, tập trung vào sự tối giản và hiệu suất cao tại edge.

## Core Stack
- **Framework**: Next.js 15 (App Router)
- **Ngôn ngữ**: TypeScript
- **Giao diện**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (Postgres kết hợp `pgvector` cho tìm kiếm ngữ nghĩa, RLS cho multi-tenancy)
- **Xác thực (Auth)**: Supabase Auth
- **Lưu trữ**: Supabase Storage (Tương thích S3) để lưu trữ file PDF thô và các Phiếu an toàn hóa chất tiếng Việt được tạo
- **Background Jobs**: Inngest cho các tác vụ bất đồng bộ (vd: trích xuất SDS)
- **AI/LLM**: API Anthropic Claude (Sonnet 4.6 xuất cấu trúc dữ liệu + dịch vụ vision, Haiku 4.5 cho logic chat)
- **Hosting**: Vercel (Next.js) + Supabase Cloud (Backend)

## Luồng Xử lý Dữ liệu

### 1. Tải lên và Trích xuất SDS
- Người dùng tải file PDF SDS lên Supabase Storage.
- Tạo một bản ghi mới trong bảng `sds_documents` (trạng thái = `pending`).
- Inngest kích hoạt tác vụ `extract-sds`.
- Claude Vision trích xuất các phần theo chuẩn GHS thành dạng JSONB, tiếp theo đối chiếu mã CAS thông qua PubChem.
- Tính toán điểm tin cậy; nếu thấp, tài liệu được đưa vào `review_queue`.
- Cập nhật trạng thái tài liệu thành `ready` và báo về UI qua Supabase Realtime.

### 2. Trình tạo Phiếu an toàn Hóa chất
- Khi có yêu cầu tạo Phiếu An toàn Hóa chất (tiếng Việt), hệ thống sẽ sinh ra mẫu 16 mục.
- Claude thực hiện dịch và chuẩn hóa dữ liệu trên các thuật ngữ quy định của Bộ Công Thương (Thông tư 01/2026).
- Tài liệu được xuất thành file PDF tích hợp một mã QR dùng chung, dẫn liên kết tới giao diện phần mềm dành cho thiết bị di động.

### 3. Chat Hỏi đáp Tuân thủ (RAG)
- Được xây dựng dựa trên khái niệm LLM Wiki.
- Truy vấn được xử lý qua Voyage/Claude embeddings.
- Quá trình tìm kiếm ngữ nghĩa pgvector kết hợp tìếm kiếm từ khóa tsvector sẽ trích xuất ra top 5 trang wiki.
- Claude trả lời các câu hỏi dựa theo trích dẫn kèm theo ngay tại nguồn.
