# Phase 2: Dashboard Navigation UX

**Status:** ✅ Completed

## Objective
Convert static statistical summary cards on the `Dashboard` overview into fully clickable links bridging users to features.

## Task Details

1. **Modify Dashboard Cards**:
   - File: `src/app/(app)/dashboard/page.tsx`
   - Add a `href` key to each object inside the `stats` array:
     - `Tài liệu SDS` -> `/sds`
     - `Hóa chất` -> `/chemicals`
     - `Phiếu an toàn` -> `/sds` (Assuming card generation routes through SDS for now)
     - `Câu hỏi tuân thủ` -> `/chat`
   - Refactor the inner mapping function `stats.map(...)` to turn the wrapper `<div>` into a `<Link href={stat.href}>`.
   - Update `className` to incorporate interactive feedback: `hover:bg-muted/50 cursor-pointer transition-colors`.

## Completion Criteria
- Cards act as functional hyperlinks across the app without client-side navigation errors.
- Hover states properly signal interactivity.
