# Project Roadmap

The MVP rollout for the MSDS Platform is scheduled for 90 days.

## Phase 00: Pre-Code Validation (Week 0)
- End-user interviews with Vietnamese EHS managers, including design partner Asia Shine.
- Determine if the project passes the "3 enthusiastic yeses" kill criteria.

## Phase 01: Foundation (Week 1)
- Next.js 15 scaffolding.
- Supabase project configuration (Auth, Storage, RLS policies).
- Basic application shell with shadcn/ui.

## Phase 02: SDS Upload + Inngest Pipeline (Week 2)
- Upload interface for PDF documents.
- Basic Inngest background job architecture.

## Phase 03: AI Extraction & Review UI (Week 3-4)
- Claude Vision prompt logic for 16 GHS section structural extraction.
- Confidence scoring and human-in-the-loop review interface.

## Phase 04: Chemicals Master + PubChem (Week 5)
- Integrate PubChem lookup.
- Seed global `chemicals` table for full-text search.

## Phase 05: LLM Wiki v0 (Week 6)
- Setup Markdown-based regulatory wiki schema.
- Seed 50 common chemicals, Circular 01/2026, and GHS Rev 10 documents.

## Phase 06: VI Safety Card Generator (Week 7-8)
- Generation pipeline for MOIT-compliant SDS PDFs.
- Public mobile views and QR codes setup.

## Phase 07: Compliance Chat (Week 9)
- Embedded search infrastructure (pgvector over wiki pages).
- LLM QA interface with citation support.

## Phase 08 & 09: Finalization & Launch (Week 10-12)
- Multi-tenant organizations and invites.
- Stripe (MoMo stubbing) billing structure.
- Asia Shine paid conversion and public beta launch.
