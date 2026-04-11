# Nền tảng MSDS — Tuân thủ Bộ Công Thương Việt Nam

Phần mềm SaaS quản lý SDS (Phiếu an toàn hóa chất) tiên phong tại Đông Nam Á. Điểm nhấn là tính năng tạo Phiếu an toàn hóa chất bằng tiếng Việt tuân thủ Bộ Công Thương + hỏi đáp tuân thủ dựa trên LLM-Wiki. Được xây dựng để phục vụ các doanh nghiệp xử lý hóa chất tại Việt Nam nhằm tuân thủ Thông tư 01/2026/TT-BCT và Luật Hóa chất 2025.

## Điều hướng Tài liệu
Tất cả tài liệu dự án và kỹ thuật được quản lý trong thư mục `docs/`:
- [Tổng quan Dự án & PDR](docs/project-overview-pdr-vi.md)
- [Tóm tắt Source Code](docs/codebase-summary-vi.md)
- [Kiến trúc Hệ thống](docs/system-architecture-vi.md)
- [Tiêu chuẩn Code](docs/code-standards-vi.md)
- [Lộ trình Dự án](docs/project-roadmap-vi.md)

## Tech Stack
- Frontend & Backend: Next.js 15 App Router, TypeScript, shadcn/ui, Tailwind
- Database: Supabase Postgres + RLS + pgvector
- Auth & Storage: Supabase Auth & Storage 
- AI: Claude Sonnet 4.6 (Trích xuất) & Haiku 4.5 (Chat)
- Tác vụ bất đồng bộ (Async Jobs): Inngest
- Hosting: Vercel (Frontend) + Supabase (Backend)
