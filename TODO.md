# Campus Event Management System - Fix Plan

## Phase 1 — Backend Compilation ✅
- [x] Install missing dev types (@types/cors, @types/pdfkit, @types/express, typescript, @types/uuid)
- [x] Fix sanitizeUser to accept null for token fields
- [x] Fix analytics.service.ts arithmetic (guard overallRating)
- [x] Fix event.service.ts self-reference + CreateEventInput interface
- [x] Fix utils/response.ts spread type
- [x] Verify backend npm run build passes

## Phase 2 — Frontend Compilation
- [ ] Convert type imports to import type (TS1484)
- [ ] Remove unused imports (TS6133)
- [ ] Fix zodResolver maxCapacity type mismatch
- [ ] Add missing fields to Event type
- [ ] Fix Recharts percent undefined handling
- [ ] Fix StatsCard value type (number | null)
- [ ] Fix remaining property access errors
- [ ] Verify frontend npm run build passes

## Phase 3 — Verify & Finalize
- [ ] Run backend npm run build
- [ ] Run frontend npm run build
- [ ] Confirm both compile cleanly
