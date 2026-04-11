# MSDS Platform — Vietnam MOIT Compliance

Solo-built, SEA-first SDS (Safety Data Sheet) management SaaS. The killer wedge is a MOIT-compliant Vietnamese safety card generator + LLM-Wiki-grounded compliance chat. Built to target Vietnamese chemical handlers to comply with Circular 01/2026/TT-BCT and Law on Chemicals 2025.

## Documentation Navigation
All technical and project documentation is maintained in the `docs/` folder:
- [Project Overview & PDR](docs/project-overview-pdr.md)
- [Codebase Summary](docs/codebase-summary.md)
- [System Architecture](docs/system-architecture.md)
- [Code Standards](docs/code-standards.md)
- [Project Roadmap](docs/project-roadmap.md)

## Tech Stack
- Frontend & Backend: Next.js 15 App Router, TypeScript, shadcn/ui, Tailwind
- Database: Supabase Postgres + RLS + pgvector
- Auth & Storage: Supabase Auth & Storage 
- AI: Claude Sonnet 4.6 (Extraction) & Haiku 4.5 (Chat)
- Async Jobs: Inngest
- Hosting: Vercel (Frontend) + Supabase (Backend)
