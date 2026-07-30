# CR-1 — Accommodation Management Implementation Plan

**Module:** Accommodation (`src/features/accommodation`)  
**Capability:** CR-1 — Accommodation Management  
**Architecture:** Clean Architecture with Capability-Driven Development  
**Standard:** Capability Release (CR-x.y)  
**Last Updated:** July 31, 2026  

---

## CAPABILITY RELEASE TRACKER

| Capability Release | Title / Phase | Scope | Status | Completion Date |
| :--- | :--- | :--- | :---: | :---: |
| **CR-1.1** | Architecture Cleanup | Repository interface standardization & dynamic casting elimination | ✅ Completed | July 31, 2026 |
| **CR-1.2** | Area & Flat Management | Domain validation rules, stable physical identifier guards & form UI feedback | ✅ Completed | July 31, 2026 |
| **CR-1.3** | Bed Management & Status Lifecycle | Single-bed status transitions, maintenance holds, and block/unblock actions | ✅ Completed | July 31, 2026 |
| **CR-1.4** | Bed Allocation | Bed allocation rules, resident assignment integration & availability checks | ⏳ Planned | Next Release |
| **CR-1.5** | Accommodation Reports | Occupancy statistics, vacancy reports, and capacity utilization analytics | ⏳ Planned | TBD |
| **CR-1.6** | Testing & Hardening | Vitest unit test suite for `flatRules.ts`, `bedRules.ts`, and `occupancyRules.ts` | ⏳ Planned | TBD |

---

## CR-1.1 SUMMARY — ARCHITECTURE CLEANUP
* **Status:** ✅ Completed
* **Achievements:**
  * Cleaned `AccommodationRepository` interface contract (`findAll`, `findById`, `save`, `saveAll`, `delete`).
  * Removed hacky optional sync methods (`getAllSync?`, `saveSync?`, `deleteSync?`).
  * Refactored `AccommodationWorkspaceCoordinator` to eliminate all dynamic runtime interface checks (`'getAllSync' in this.repository`) and dynamic type assertions (`as { ... }`).
  * Purged empty scaffold directories (`services/`, `hooks/`, `src/services/`, `src/types/`).
  * Production build verified cleanly (`npm run build`).

---

## CR-1.2 SUMMARY — AREA & FLAT MANAGEMENT
* **Status:** ✅ Completed
* **Achievements:**
  * **Domain Rules Separation:** Created dedicated domain rule module `flatRules.ts` for structural validation rules (`validateFlatAreaConfigs`, `canModifyFlatNumber`, `canModifyAreaPrefix`, `canModifyAreaBeds`), keeping `occupancyRules.ts` focused on temporal status sync.
  * **Stable Physical Identifiers Guard (BR-ACC-003 / BR-013 / BR-014):** 
    * Flat Numbers become immutable in UI/Coordinator when a Flat contains occupied beds (`101-B1`).
    * Area Bed Prefixes become immutable in UI when an Area contains occupied beds.
  * **Validation Improvements:**
    * Enforced Area Name uniqueness within a Flat (**BR-015**).
    * Enforced Bed Prefix uniqueness across areas within a Flat (**BR-016**).
    * Enforced minimum 1 bed per Area (**BR-017**).
    * Enforced occupied bed truncation prevention (**BR-018**).
  * **UI Validation Enhancements:** Added reactive inline error helper text and input field disabling in `AddFlatDialog.tsx`.
  * **Coordinator Domain Guard:** Added `validateFlatAreaConfigs()` check inside `AccommodationWorkspaceCoordinator.saveFlatDraft()`.
  * **Documentation Synchronization:** Updated `BUSINESS_RULES.md`, `DOMAIN_MODEL.md`, and `ARCHITECTURE.md`.
  * **Production Build Result:** `npm run build` succeeded (Exit Code 0, 0 TypeScript errors).

---

## CR-1.3 SUMMARY — BED MANAGEMENT & STATUS LIFECYCLE
* **Status:** ✅ Completed
* **Achievements:**
  * **Business Operations Implemented:** Refactored application coordinator to expose explicit business operations (`blockBed`, `unblockBed`, `startBedMaintenance`, `completeBedMaintenance`) rather than generic state mutations.
  * **Bed Lifecycle Enforcement:** Created `bedRules.ts` domain module containing transition guards (`canBlockBed`, `canUnblockBed`, `canStartMaintenance`, `canCompleteMaintenance`) and execution logic (**BR-019**, **BR-021**, **BR-022**).
  * **Occupancy & Reservation Protection:** Enforced guards preventing manual state modifications for occupied, on-notice, or reserved beds (**BR-020**, **BR-023**).
  * **Details-First UI Experience:** Created `BedDetailsDialog.tsx` displaying primary bed metadata (ID, Flat, Area, Rent, Deposit, Occupant status) first, and allowed business operations second.
  * **Interactive Bed Cards:** Updated `BedCard.tsx`, `AreaSection.tsx`, and `FlatCard.tsx` with interactive hover states and click handlers to trigger `BedDetailsDialog`.
  * **Documentation Synchronization:** Updated `BUSINESS_RULES.md` (BR-019 through BR-023), `DOMAIN_MODEL.md` (Section 9.9 Operational Ownership Boundary), and `ARCHITECTURE.md` (Module separation & Business Operations).
  * **Production Build Result:** `npm run build` succeeded (Exit Code 0, 0 TypeScript errors).

---

## NEXT CAPABILITY RELEASE: CR-1.4 — BED ALLOCATION
* **Goal:** Implement Bed Allocation rules, resident assignment integration, and operational availability checks.
