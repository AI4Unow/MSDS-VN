# Kiến trúc Hệ thống

Nền tảng MSDS sử dụng kiến trúc serverless hiện đại, tập trung vào sự tối giản và hiệu suất cao tại edge.

## Core Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Ngôn ngữ**: TypeScript (strict mode)
- **Giao diện**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (Postgres với RLS cho multi-tenancy)
- **Xác thực (Auth)**: Supabase Auth (magic link + Google OAuth)
- **Lưu trữ**: Supabase Storage (Tương thích S3) để lưu trữ file PDF thô và các Phiếu an toàn hóa chất tiếng Việt được tạo
- **Background Jobs**: Inngest cho các tác vụ bất đồng bộ (vd: trích xuất SDS, làm giàu hóa chất, tạo phiếu an toàn)
- **AI/LLM**: API Anthropic Claude (Sonnet 4.6 xuất cấu trúc dữ liệu + dịch vụ vision, Haiku 4.5 cho logic chat)
- **Hosting**: Vercel (Next.js) + Supabase Cloud (Backend)

> **Kiến trúc truy vấn (MVP):** Hệ thống chat tuân thủ và wiki sử dụng **truy xuất dựa trên chỉ mục** (index-driven retrieval) theo mô hình Karpathy — KHÔNG dùng pgvector, KHÔNG dùng embeddings, KHÔNG dùng Voyage/OpenAI embeddings. Ở quy mô MVP (~100–500 trang), một danh mục `index.md` được biên soạn + LLM đọc index để chọn trang liên quan là đủ. **Đường nâng cấp:** Nếu wiki vượt quá ~500 trang hoặc `index.md` vượt ~8k tokens, chuyển sang Postgres `tsvector` BM25 hoặc hybrid BM25 + vector + re-rank. Xem kế hoạch Giai đoạn 05 để biết chi tiết.

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
- Claude thực hiện dịch và chuẩn hóa dữ liệu trên các thuật ngữ quy định của Bộ Công Thương (Thông tư 01/2026/TT-BCT).
- Tài liệu được xuất thành file PDF tích hợp một mã QR dùng chung, dẫn liên kết tới giao diện phần mềm dành cho thiết bị di động.

### 3. Chat Hỏi đáp Tuân thủ (Index-Driven Retrieval)
- Được xây dựng dựa trên khái niệm LLM Wiki sử dụng truy xuất dựa trên chỉ mục.
- Luồng truy vấn: Claude đọc `index.md` → chọn slug trang wiki liên quan → đọc nội dung đầy đủ qua tool-use → trả lời với trích dẫn inline.
- Không dùng embeddings hay vector search trong MVP. Truy xuất hoàn toàn do LLM điều khiển qua chỉ mục được biên soạn.

## Nhật ký Rủi ro

### RL-1: Không mua Bảo hiểm E&O (Quyết định 2026-04-11)
- **Quyết định:** Không mua tại thời điểm ra mắt.
- **Hệ thống phòng thủ:** Giới hạn trách nhiệm EULA (12 tháng phí, tối đa 30M VND/yêu cầu) + tuyên bố miễn trừ AI trên mỗi phiếu + giao diện kiểm tra con người + cổng tư vấn EHS cho 50 phiếu đầu tiên + điều khoản bồi thường của khách hàng.
- **Điều kiện đánh giá lại:** (a) Nhận được đe dọa pháp lý đầu tiên, (b) >10 khách hàng trả phí, (c) Khách hàng doanh nghiệp yêu cầu bằng chứng bảo hiểm trong mua sắm.

### RL-2: Truy cập Phiếu an toàn Công khai (Quyết định 2026-04-11)
- **Quyết định:** Mặc định `public_token` (token 128-bit không thể đoán, không cần đăng nhập).
- **Lý do:** UX ứng phó sự cố — nhân viên kho lúc 2 giờ sáng trên điện thoại chung.
- **Biện pháp giảm thiểu:** Chuyển đổi per-org sang `login_required`, xoay vòng token, giới hạn 60 req/phút/IP, hết hạn tùy chọn, header `noindex`.
