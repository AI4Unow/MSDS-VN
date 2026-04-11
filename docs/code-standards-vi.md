# Tiêu chuẩn Code & Hướng dẫn

## Giới hạn Tech Stack
- **Next.js 15 App Router**: Tuyệt đối tránh thiết kế Pages router. Tối đa hóa hiệu năng qua React Server Components, Client Components chỉ sử dụng khi thật sự cần tính tương tác.
- **Supabase**: Áp dụng mô hình Supabase SSR auth cho Next.js 15. Tính năng cách ly doanh nghiệp (tenant separation) bắt buộc phải được áp dụng chặt chẽ ở cấp độ Cơ sở dữ liệu thông qua Row Level Security (RLS).
- **TypeScript**: Bật chế độ Strict mode. Định nghĩa rõ ràng các interface cho mọi cấu trúc Database và API.

## Yêu cầu Tổ chức File
- Cấu trúc các tệp tin dựa trên chức năng nghiệp vụ/module thay vì theo định dạng đuôi file (ví dụ: gộp các logic chat, hooks, và các thành phần giao diện liên quan vào cùng một thư mục).
- Sử dụng quy tắc `kebab-case` cho tên file cấu trúc TS/JS nhằm hỗ trợ các công cụ nhận dạng ngữ cảnh của LLM (Grep, Glob) hoạt động hiệu quả hơn.
- Hàm component (Component files) nên được tách nhỏ (< 200 dòng). Tách các logic lớn bên trong vào các file utility hỗ trợ tương ứng.

## Quy tắc Cấu trúc Database
- Mọi Database (schema) phải phân chia kiến trúc `org_id` để hoạt động theo chuẩn multi-tenancy ngoại trừ các bảng dùng cho hệ thống chung (như danh sách hóa chất gốc, wiki pages).
- Các lệnh DDL file migrate (tệp cập nhật thay đổi DB) phải được tạo từ lệnh script và quản lý bằng cửa sổ ứng dụng CLI của Supabase.

## Tuân thủ Nội dung Pháp lý
- Tất cả các lệnh nhắc nhở sử dụng (prompts) dành cho kịch bản AI trong mọi tình huống về từ ngữ pháp lý **PHẢI** tuân thủ bảng khai ngữ theo Thông tư 01/2026/TT-BCT và Luật Hóa chất 2025. KHÔNG dùng mẫu thuật ngữ cũ của năm 2007.
