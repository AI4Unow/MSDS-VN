# Project Overview & PDR

## Introduction
The MSDS Platform is an SEA-first SDS management web app built for Vietnamese SMBs. It solves the critical compliance problem introduced by the Law on Chemicals 2025 and Circular 01/2026/TT-BCT, which require localized (Vietnamese) safety data sheets for all chemicals.

## Target Audience
Vietnamese SMBs handling 20–500 chemicals, specifically chemical distributors, pharma/cosmetic raw material importers, and food ingredient traders. First design partner is Asia Shine.

## Core Features (MVP)
1. **SDS Vault**: Upload, versioning, full-text + semantic search.
2. **AI Extraction**: OCR-free Gemini Flash extraction of 16 GHS sections into structured JSON.
3. **VI Safety Card Generator**: MOIT-compliant PDF generator (aligned with Circular 01/2026/TT-BCT) with mobile QR access.
4. **Compliance Q&A Chat**: LLM grounded on an actively maintained LLM Wiki for regulatory knowledge (updated for 2026 Law on Chemicals).
5. **CAS Lookup**: PubChem integration for a basic chemical master list.
6. **Multi-Tenant Org (Deferred)**: Scoped access architecture exists but is disabled/mocked in the current MVP to allow frictionless public testing.

## MVP Success Criteria
- 1 paying customer (Asia Shine) by Day 90.
- <$0.30 Claude API cost per SDS.
- 95% automated SDS extractions.
- 80% chat answer accuracy vs EHS consultant baseline.
