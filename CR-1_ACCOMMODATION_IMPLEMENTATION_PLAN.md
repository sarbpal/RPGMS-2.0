# CR-1 — Accommodation Management Implementation Plan

**Module:** Accommodation (`src/features/accommodation`)  
**Capability:** CR-1 — Accommodation Management  
**Architecture:** Clean Architecture with Capability-Driven Development  
**Last Updated:** July 31, 2026  

---

## SPRINT PROGRESS & STATUS TRACKER

| Sprint | Capability / Phase | Scope | Status | Completion Date |
| :--- | :--- | :--- | :---: | :---: |
| **Sprint 1.1** | Architecture Cleanup | Repository interface standardization & dynamic casting elimination | ✅ Completed | July 31, 2026 |
| **Sprint 1.2** | Area & Flat Management | Domain validation rules, stable physical identifier guards & form UI feedback | ✅ Completed | July 31, 2026 |
| **Sprint 1.3** | Bed Management & Status Lifecycle | Single-bed status transitions, maintenance holds, and block/unblock actions | ⏳ Planned | Next Sprint |
| **Sprint 1.4** | Accommodation Test Suite | Unit tests for `flatRules.ts` and `occupancyRules.ts` | ⏳ Planned | TBD |
| **Sprint 1.5** | Supabase Persistence Integration | PostgreSQL migration DDL (`001_accommodation.sql`) & Supabase repository | ⏳ Planned | Post-Capability |

---

## SPRINT 1.1 SUMMARY — ARCHITECTURE CLEANUP
* **Status:** ✅ Completed
* **Achievements:**
  * Cleaned `AccommodationRepository` interface contract (`findAll`, `findById`, `save`, `saveAll`, `delete`).
  * Removed hacky optional sync methods (`getAllSync?`, `saveSync?`, `deleteSync?`).
  * Refactored `AccommodationWorkspaceCoordinator` to eliminate all dynamic runtime interface checks (`'getAllSync' in this.repository`) and dynamic type assertions (`as { ... }`).
  * Purged empty scaffold directories (`services/`, `hooks/`, `src/services/`, `src/types/`).
  * Production build verified cleanly (`npm run build`).

---

## SPRINT 1.2 SUMMARY — AREA & FLAT MANAGEMENT
* **Status:** ✅ Completed
* **Achievements:**
  * **Domain Rules Separation:** Created dedicated domain rule module `flatRules.ts` for structural validation rules (`validateFlatAreaConfigs`, `canModifyFlatNumber`, `canModifyAreaPrefix`, `canModifyAreaBeds`), keeping `occupancyRules.ts` focused on temporal status sync.
  * **Stable Physical Identifiers Guard (BR-ACC-003):** 
    * Flat Numbers become immutable in UI/Coordinator when a Flat contains occupied beds (`101-B1`).
    * Area Bed Prefixes become immutable in UI when an Area contains occupied beds.
  * **Validation Improvements:**
    * Enforced Area Name uniqueness within a Flat (**BR-ACC-015**).
    * Enforced Bed Prefix uniqueness across areas within a Flat (**BR-ACC-016**).
    * Enforced minimum 1 bed per Area (**BR-ACC-017**).
    * Enforced occupied bed truncation prevention (**BR-ACC-018**).
  * **UI Validation Enhancements:** Added reactive inline error helper text and input field disabling in `AddFlatDialog.tsx`.
  * **Coordinator Domain Guard:** Added `validateFlatAreaConfigs()` check inside `AccommodationWorkspaceCoordinator.saveFlatDraft()`.
  * **Documentation Synchronization:** Updated `BUSINESS_RULES.md`, `DOMAIN_MODEL.md`, and `ARCHITECTURE.md`.
  * **Production Build Result:** `npm run build` succeeded (Exit Code 0, 0 TypeScript errors).

---

## NEXT SPRINT: SPRINT 1.3 — BED MANAGEMENT & STATUS LIFECYCLE
* **Goal:** Implement Bed Status lifecycle management (`VACANT`, `OCCUPIED`, `ON_NOTICE`, `MAINTENANCE`, `BLOCKED`) with operational status change controls per bed.
