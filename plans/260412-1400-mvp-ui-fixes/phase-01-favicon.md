# Phase 1: Favicon

**Status:** ✅ Completed

## Objective
Add a favicon to stop browser 404 requests and show a proper tab icon.

## Task Details

1. **Create `public/favicon.ico`**:
   - Generate a minimal SVG-based favicon (chemical flask or shield icon in brand primary color).
   - Convert to `.ico` or use an inline SVG `<link>` in `layout.tsx` metadata.
   - Alternative: use Next.js `icon.tsx` convention for a dynamic icon.

## Files Modified
- `public/favicon.ico` (NEW) or `src/app/icon.tsx` (NEW)

## Completion Criteria
- Network tab shows 200 for `/favicon.ico`.
- Browser tab displays recognizable icon instead of blank/broken.
