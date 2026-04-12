# Tóm tắt Source Code

Tài liệu này tóm tắt cấu trúc và trạng thái của mã nguồn Nền tảng MSDS.

*(Cập nhật 2026-04-11. Stack: Next.js 16.2.3, React 19.2.4, Supabase, Inngest, Claude API.)*

## Cấu trúc Thư mục
- `/src/app/` — Các trang và API route của Next.js 16 App Router (xác thực, ứng dụng, tiếp thị, pháp lý, thẻ an toàn công khai)
- `/src/components/` — Thành phần giao diện (app-shell, auth, chat, org, sds, search, shadcn/ui)
- `/src/lib/` — Logic nghiệp vụ cốt lõi (ai/, audit/, auth/, billing/, chat/, chem/, safety-card/, storage/, supabase/, wiki/)
- `/src/inngest/` — Hàm xử lý nền (extract-sds, enrich-chemical, generate-safety-card)
- `/src/hooks/` — React hooks
- `/supabase/migrations/` — 12 migration Postgres (từ init đến rate-limit)
- `/plans/` — Kế hoạch triển khai, báo cáo ý tưởng, kịch bản phỏng vấn, schema wiki
- `/docs/` — Kiến trúc dự án, lộ trình, tiêu chuẩn code, tóm tắt source code (EN + VI)

## Trạng thái Hiện tại (2026-04-11)
Dự án đã hoàn thành xây dựng nền tảng và triển khai các tính năng cốt lõi:

**Đã triển khai đầy đủ (Giai đoạn 01–04, 08):**
- Ứng dụng Next.js 16 với Supabase auth, RLS, storage
- Pipeline tải lên SDS với Inngest background jobs
- Trích xuất GHS 16 mục bằng Claude với điểm tin cậy
- Làm giàu dữ liệu hóa chất PubChem với xác thực số CAS
- Cài đặt tổ chức với chế độ truy cập thẻ an toàn
- Giao diện ứng dụng (sidebar, top nav, user menu, tìm kiếm toàn cục)

**Triển khai một phần (Giai đoạn 05–07, 09):**
- Wiki index-builder + trang duyệt đã có; script tạo dữ liệu mẫu và lint cron chưa hoàn thành
- Bảng thuật ngữ MOIT, trình dịch, QR generator đã có; template react-pdf chưa hoàn thành
- Chat agent + wiki tools đã có; giao diện citation và model routing chưa hoàn thành
- Trang marketing/pháp lý/thanh toán đã có; Stripe webhook và đánh giá luật sư chưa hoàn thành

**Chưa bắt đầu:**
- Giai đoạn 00 (phỏng vấn xác thực trước khi code)

## Ghi chú Kiến trúc
Truy xuất wiki sử dụng **index-driven** (mô hình Karpathy) — không dùng pgvector, không dùng embeddings. Xem `docs/system-architecture.md` để biết chi tiết.
