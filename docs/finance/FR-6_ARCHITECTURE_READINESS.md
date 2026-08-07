# Sprint FR-6 / OS-1 — Operational Services & Electricity Readiness Assessment

**Project:** RPGMS 2.0  
**Capability Release Transition:** CR-3 (Financial Operations) ➔ CR-4 (Operational Services)  
**Sprint Target:** Sprint FR-6 / OS-1 — Electricity Metering, Consumption Allocation & Financial Ledger Integration  
**Document:** `docs/finance/FR-6_ARCHITECTURE_READINESS.md`  
**Status:** Official Readiness & Transition Assessment  
**Date:** August 2026  
**Author:** RPGMS 2.0 Architectural Committee  

---

## 1. Executive Summary

With the successful completion and remote synchronization of **Sprint FR-5** (HEAD `0b7c9cb`), **Capability Release 3 (CR-3 — Financial Operations)** has achieved **Production Ready / Level 3 Maturity**. The core double-entry ledger, balance engine, billing service, payment processing, checkout settlement, reporting aggregation, timeline feeds, interactive workspace pages (`FinanceWorkspacePage.tsx`), and resident profile tabs (`ResidentFinancialProfile.tsx`) are 100% operational with **35 test files and 245 tests passing 100% green**.

According to the official project roadmap ([`ROADMAP.md`](file:///C:/Users/harsh/GitHub/RPGMS-2.0/ROADMAP.md) v3.0) and Capability Register ([`CAPABILITY_REGISTER.md`](file:///C:/Users/harsh/GitHub/RPGMS-2.0/CAPABILITY_REGISTER.md)), the next sequential business capability is **CR-4 — Operational Services**.

The primary objective of **Sprint FR-6 / OS-1** is to establish the domain models, application services, meter reading workflows, flat/bed consumption split allocation logic, and financial ledger billing integration for **Electricity Operations & Utility Allocation**.

---

## 2. Current Repository Baseline

- **Git Baseline**: HEAD `0b7c9cb feat(fr-5): integrate finance workspace` on branch `feature/application-shell` (synchronized with `origin/feature/application-shell`, clean working tree).
- **TypeScript Compilation**: `npx tsc -b` passes with **0 errors**.
- **Production Build**: `npm run build` succeeds cleanly.
- **Automated Test Suite**: 35 test files, 245 unit and integration tests passing (**100% green**).
- **Existing Scaffolding for CR-4**: Placeholder workspace pages exist at `src/features/electricity/ElectricityPage.tsx` and `src/features/maintenance/MaintenancePage.tsx`. Service, hook, and type subdirectories are initialized but currently empty.

---

## 3. Capability Roadmap Transition

```text
CR-1 Accommodation Management  ──► ✅ Completed
CR-2 Reservation & Admission   ──► ✅ Completed
CR-3 Financial Operations       ──► ✅ Completed (FR-1 through FR-5)
                                    │
                                    ▼
CR-4 Operational Services       ──► 🚧 NEXT FOCUS (Sprint FR-6 / OS-1)
 ├─ Electricity Workspace & Meter Reading Ingestion
 ├─ Flat & Bed Consumption Split Calculation
 ├─ Tariff Slab Application
 ├─ Financial Ledger Billing Integration (posting to Accounts Receivable)
 └─ Maintenance Complaints & Resolution Workflow (Sprint OS-2)
```

---

## 4. Architectural Boundaries & Domain Analysis

### Proposed Electricity Domain Model (`src/features/electricity/domain/`):
1. **`Meter` (Entity)**: Represents physical or sub-meter tied to a Flat or Bed (`id`, `meterNumber`, `flatId`, `bedId`, `status: ACTIVE | INACTIVE`, `lastReadingDate`, `lastReadingValue`).
2. **`MeterReading` (Entity)**: Append-only periodic reading entry (`id`, `meterId`, `readingDate`, `previousReading`, `currentReading`, `unitsConsumed`, `recordedBy`).
3. **`ElectricityTariff` (Value Object)**: Rate structure (`ratePerUnit`, `fixedCharge`, `effectiveFrom`).
4. **`ConsumptionAllocation` (Value Object)**: Split calculation for shared flat meters (`flatId`, `stayId`, `residentId`, `allocatedUnits`, `allocatedAmount`).

### Application Services Layer (`src/features/electricity/services/`):
- **`electricityService.ts`**:
  - `recordMeterReading(request)`: Validates reading monotonicity (`currentReading >= previousReading`).
  - `calculateFlatConsumption(flatId, readingPeriod)`: Aggregates total units consumed across flat meters.
  - `allocateFlatElectricityToStays(flatId, totalAmount, activeStays)`: Calculates equal or occupancy-weighted unit/cost splits across active resident stays.
  - `postElectricityBillToFinance(allocationResult)`: Delegates bill creation directly to `billingService.createBill()` with `billType: 'RECURRING_CHARGE'` / `category: 'UTILITIES'`, generating balanced double-entry ledger postings (`ACCOUNTS_RECEIVABLE` Debit, `ELECTRICITY_REVENUE` / `UTILITIES` Credit).

---

## 5. Business Rule Safety & Constraints

1. **Monotonic Meter Readings**: A new meter reading MUST NOT be less than the previous recorded reading (`currentReading >= previousReading`).
2. **Strict Financial Delegation**: The Electricity domain MUST NOT construct double-entry ledger entries or mutate finance storage directly. It MUST delegate billing creation to `billingService` in the Finance domain.
3. **Active Stay Eligibility**: Electricity charges can ONLY be allocated to stays that were `ACTIVE` or `ON_NOTICE` during the reading period.
4. **Zero UI Calculation Leakage**: React presentation components (`ElectricityPage.tsx`, meter modals) MUST NOT compute tariff rates or split calculations inline.

---

## 6. Verification & Testing Strategy

### Required Baseline Checks:
- Vitest suite must remain 100% green across all 35 existing test files.
- `npx tsc -b` must maintain 0 errors.
- Production build must succeed.

### Proposed Test Additions for Sprint FR-6 / OS-1:
1. `src/features/electricity/domain/rules/__tests__/meterRules.test.ts`: Test reading monotonicity and tariff calculation.
2. `src/features/electricity/services/__tests__/electricityService.test.ts`: Test meter reading ingestion, split allocation across stays, and integration with `billingService`.
3. `src/features/electricity/pages/__tests__/ElectricityPage.test.tsx`: Test workspace UI rendering, meter list display, and reading modal triggers.

---

## 7. Proposed Sprint Scope Boundary

### IN SCOPE (Sprint FR-6 / OS-1):
- Creating Electricity domain entities, value objects, and business rules in `src/features/electricity/domain/`.
- Creating `InMemoryElectricityRepository` in `src/features/electricity/infrastructure/`.
- Creating `electricityService.ts` for reading ingestion, consumption split allocation, and `billingService` integration.
- Creating `useElectricityWorkspace.ts` hook.
- Building interactive `ElectricityPage.tsx` workspace with meter reading ingestion modals.
- Unit and integration tests for Electricity domain and services.
- Post-implementation governance updates for CR-4 initiation.

### OUT OF SCOPE:
- Maintenance complaint ticket management (deferred to **Sprint OS-2**).
- Automated IoT smart meter hardware API integrations (remains manual/assisted entry for MVP).
- PostgreSQL / Supabase backend persistence migration.
- External utility vendor payment integrations.

---

## 8. Governance & Potential ADRs

- **ADR-022 Requirement**: If Electricity billing allocation requires a specialized sub-ledger posting rule or split-billing strategy, **`ADR-022 — Electricity Consumption Allocation & Financial Ledger Billing Integration`** will be documented.
- **Register Updates**: At sprint completion, update `CAPABILITY_REGISTER.md` and `docs/MODULE_STATUS.md` to transition CR-4 Operational Services to `In Progress`.

---

## 9. Readiness Decision

### **`READY FOR IMPLEMENTATION PLANNING`**

The repository is structurally clean, fully tested, and ready for Phase 7 implementation planning of Sprint FR-6 / OS-1.

---

## 10. Repository Verification Summary

- **Current Branch**: `feature/application-shell`
- **HEAD Commit**: `0b7c9cb feat(fr-5): integrate finance workspace`
- **Working Tree Status**: Clean (0 modified, 0 staged, untracked readiness doc created)
- **Production Source Code**: 0 files modified.
- **Existing Documentation**: 0 files modified.
- **Staging/Commit/Push Status**: None performed.
