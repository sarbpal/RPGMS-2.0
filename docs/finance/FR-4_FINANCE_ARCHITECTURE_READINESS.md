# Sprint FR-4 — Financial Reporting, Activity Timeline & Workspace Integration Architecture Readiness Report

**Sprint:** FR-4 — Financial Reporting, Activity Timeline & Workspace Integration  
**Document:** `docs/finance/FR-4_FINANCE_ARCHITECTURE_READINESS.md`  
**Status:** Readiness Assessment / Planning  
**Date:** August 2026  
**Author:** RPGMS 2.0 Architectural Committee  

---

## 1. FR-4 Candidate Scope

Following the successful implementation and verification of **FR-1** (Finance Settlement Core), **FR-2** (Admission & Rent Billing Integration), and **FR-3** (Payment & Billing Core Stabilization), the next logical capability in the RPGMS 2.0 Finance Domain is **Sprint FR-4 — Financial Reporting, Activity Timeline & Workspace Integration**.

### Governing Document References
1. **`FINANCE_SPECIFICATION.md` (Section 6, 8 & 14)**:
   - *Section 6 (Responsibilities)*: "The Finance domain is responsible for ... Financial Timeline, Financial Lifecycle, Outstanding Calculation, Financial Reporting."
   - *Section 14 (Reporting Architecture)*: "All financial reports derive their information strictly from the Finance domain. Reports answer questions; they do not perform business decisions independently."
2. **`FINANCE_IMPLEMENTATION_PLAN.md` (Section 8 — Sprint F7 & F9)**:
   - *Sprint F7 (Timeline & Custom Hooks)*: "Create presentation-facing services and hooks for single Stay financial timeline and property-wide activity."
   - *Sprint F9 (Reports & Workspace Integration)*: "Connect dynamic dashboard metrics, outstanding resident receivables, settlement audit logs, and complete workspace ViewModels."
3. **`ROADMAP.md` (Finance Milestone Phase 1)**:
   - Mandates property-wide auditability, outstanding dues tracking, and complete workspace integration prior to multi-property expansion.

---

## 2. Current-State Assessment

### Baseline State
- **Branch**: `feature/application-shell`
- **Working Tree**: Clean
- **Commits**:
  - `4b46292 feat(fr-1): stabilize finance settlement core`
  - `852f6b3 feat(fr-2): integrate admission finance initialization`
  - `8f2ca2f feat(fr-3): stabilize payment and billing core`
- **Test Suite**: 29/29 test files passed, 236/236 tests passed (100% green).
- **TypeScript**: `npx tsc -b` passes cleanly with 0 errors.
- **Production Build**: `npm run build` succeeds cleanly.

### Completed Work (FR-1, FR-2, FR-3)
1. **FR-1**: Built and stabilized the Settlement Engine (`settlementService.ts`), preview derivations, double-entry settlement postings (`CLEAR_DEPOSIT`, `CLEAR_ADVANCE`, `CLEAR_RECEIVABLE`, `DAMAGE_RECOVERY`, `REFUND_PAYABLE`), reversal entry engine, and 18 unit tests.
2. **FR-2**: Integrated Admission & Rent Billing (`AdmissionFinanceService`), synchronous deposit liability creation, rent bill generation, token advance credit handling, and compensating rollback in `AdmissionCoordinator`.
3. **FR-3**: Refactored `billingService.ts` and `paymentService.ts` for constructor `StayRepository` DI, established unit test coverage for `billingService.test.ts` (7 tests), `paymentService.test.ts` (4 tests), and `balanceEngine.test.ts` (5 tests), and recorded `ADR-019`.

### Remaining Incomplete Scope
- `reportingService.ts` lacks dedicated Vitest unit tests in `src/features/finance/services/__tests__/`.
- `timelineService.ts` lacks dedicated Vitest unit tests in `src/features/finance/services/__tests__/`.
- `FinanceWorkspaceCoordinator.ts` lacks dedicated unit testing for `createViewModel()`, property-wide summary derivation, and stay-level view model creation.
- Property-wide metric aggregation (`outstandingReceivables`, `totalMonthlyBilling`, `totalCollections`, `pendingSettlementsCount`) needs verified unit tests and DI constructor support for test isolation.

---

## 3. Business Rules

The proposed FR-4 reporting and timeline capabilities are governed strictly by canonical business rules defined in `BUSINESS_RULES.md` and `FINANCE_SPECIFICATION.md`:

1. **Single Source of Truth**: Financial summary metrics, outstanding dues tables, and activity timelines must be derived dynamically on demand from immutable `LedgerEntry`, `Bill`, `Payment`, and `Settlement` records.
2. **Stay is the Financial Boundary**: All financial reporting aggregations must index entries by `stayId`. Resident-level financial reporting is constructed by aggregating all historical stays belonging to that resident.
3. **Derived Balances**: No reporting service or UI component may read or store static balance numbers.
4. **Chronological Audit Stream**: Timeline activity streams must order events strictly by `date` (newest first). Reversal ledger entries must be explicitly represented as distinct audit events.
5. **No Independent Decision Making**: Reporting services answer analytical queries only; they must never mutate financial state, post ledger entries, or alter bill statuses.

---

## 4. Architecture Assessment

```text
               ┌──────────────────────────────────────────────┐
               │           FinanceWorkspacePage               │
               │   (Presentation / UI Workspace Layer)        │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         FinanceWorkspaceCoordinator          │
               │        (Application Coordinator DI)          │
               └───────┬──────────────┬──────────────┬────────┘
                       │              │              │
                       ▼              ▼              ▼
                ┌────────────┐ ┌────────────┐ ┌────────────┐
                │ Reporting  │ │ Timeline   │ │ Balance    │
                │  Service   │ │  Service   │ │   Engine   │
                └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
                       │              │              │
                       └──────────────┼──────────────┘
                                      │ (Read-Only Queries)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │              FinanceRepository               │
               │         (In-Memory / Storage Core)           │
               └──────────────────────────────────────────────┘
```

- **Domain Entities & Value Objects**: Reuses `LedgerEntry`, `Bill`, `Payment`, `Settlement`, `AccountType`, `LedgerReferenceType`.
- **Application Services**: Reuses `balanceEngine`, `billingService`, `paymentService`, `settlementService`, and refactors `reportingService`, `timelineService`.
- **Application Coordinator**: `FinanceWorkspaceCoordinator` receives `FinanceRepository`, `StayRepository`, and `ResidentRepository` via constructor DI.
- **Dependency Direction**: UI -> Coordinator -> Services -> Repositories -> Storage. Infrastructure dependencies remain strictly inverted.

---

## 5. Integration Points

- **Admission**: Displays newly admitted stays in recent finance activity stream.
- **Resident**: Maps resident identity (`residentName`, `phone`) to stay-level financial balances for outstanding dues reports.
- **Stay**: Provides stay status (`ACTIVE`, `NOTICE_GIVEN`, `CHECKED_OUT`) to filter active vs settled stays in financial reports.
- **Billing & Payment**: Provides bill generation and payment receipt events for the unified timeline stream.
- **Settlement**: Provides finalized checkout settlement records for the completed settlements audit report.

---

## 6. Data / Domain Changes

- **Domain Model Changes**: **None required**. Existing types (`FinanceSummary`, `StayBalance`, `FinanceTimelineEvent`, `FinanceDashboardMetrics`, `OutstandingResidentRow`, `SettlementReportRow`) are complete and sufficient.
- **Storage Changes**: **None required**. Reads existing `rpgms_ledger_entries`, `rpgms_bills`, `rpgms_payments`, `rpgms_settlements` keys.

---

## 7. Transaction / Atomicity Considerations

- FR-4 reporting and timeline derivations are **strictly read-only**.
- No database mutations, state updates, or ledger entries occur during reporting calculations.
- Transaction rollback handling is not applicable for FR-4 read operations.

---

## 8. Testing Strategy

### New Unit Test Suites to Create:
1. `src/features/finance/services/__tests__/reportingService.test.ts`
   - Test `getFinanceDashboard()` metrics calculation (Receivables, Monthly Billed, Collections, Pending Settlements).
   - Test `getOutstandingResidents()` sorting (highest dues first) and zero-balance exclusion.
   - Test `getSettlementReport()` formatting and net refund / payment amounts.
2. `src/features/finance/services/__tests__/timelineService.test.ts`
   - Test `getTimelineForStay()` aggregating Bills, Payments, and Reversals in chronological order.
   - Test `getRecentFinanceActivity()` property-wide event formatting and limit constraints.
   - Test `getTimelineSummary()` calculating total billed vs total paid.
3. `src/features/finance/application/coordinator/__tests__/FinanceWorkspaceCoordinator.test.ts`
   - Test `createViewModel()` assembling complete `FinanceWorkspaceViewModel`.
   - Test `getStayFinanceViewModel()` assembling stay balance and timeline details.
   - Test constructor dependency injection with mock repositories.

---

## 9. UI / UX Impact

- Reuses existing MUI workspace components in `src/features/finance/pages/FinanceWorkspacePage.tsx` and `src/features/finance/components/`.
- No new UI libraries or visual breaking changes required.

---

## 10. Governance & Documentation Impact

- **`CAPABILITY_REGISTER.md`**: Update operational log recording completion of FR-3 and designation of FR-4 as active.
- **`docs/MODULE_STATUS.md`**: Update document date to August 2026 and mark FR-4 active.
- **`docs/DECISIONS.md`**: Document **ADR-020 — Financial Reporting, Activity Timeline & Workspace Coordination**.

---

## 11. Risks & Open Questions

- **Risk**: Performance of property-wide reporting when aggregating large arrays of ledger entries.
- **Mitigation**: Pure array `reduce` functions in `reportingService` and `balanceEngine` compute metrics in single-pass linear time $O(N)$.

---

## 12. Prerequisites

- All prior finance sprints (FR-1, FR-2, FR-3) committed and pushed (**Verified Green**).

---

## 13. Recommended File-by-File Implementation Scope

### Files to Create:
1. `docs/finance/FR-4_FINANCE_ARCHITECTURE_READINESS.md` *(This planning report)*
2. `src/features/finance/services/__tests__/reportingService.test.ts`
3. `src/features/finance/services/__tests__/timelineService.test.ts`
4. `src/features/finance/application/coordinator/__tests__/FinanceWorkspaceCoordinator.test.ts`

### Files to Modify:
1. `src/features/finance/services/reportingService.ts` *(Constructor DI for repositories)*
2. `src/features/finance/services/timelineService.ts` *(Constructor DI for repositories)*
3. `src/features/finance/application/coordinator/FinanceWorkspaceCoordinator.ts` *(Constructor DI)*
4. `CAPABILITY_REGISTER.md` *(Governance update)*
5. `docs/MODULE_STATUS.md` *(Status update)*
6. `docs/DECISIONS.md` *(ADR-020 addition)*

### Files that MUST NOT be modified:
- `src/features/finance/services/settlementService.ts`
- `src/features/finance/services/ledgerService.ts`
- `src/features/finance/services/billingService.ts`
- `src/features/finance/services/paymentService.ts`
- `src/features/finance/services/balanceEngine.ts`
- Any Admission, Resident, Stay, or Accommodation production code.

---

## 14. Recommended Sprint Breakdown

Sprint FR-4 is well-bounded and focused on **Reporting, Activity Timeline & Coordinator DI**. It can be executed as a single coherent sprint:

- **Sprint FR-4**: Financial Reporting, Activity Timeline & Workspace Integration.

---

## 15. Final Readiness Status

### **READY FOR IMPLEMENTATION**

*(Awaiting user review and authorization before starting FR-4 implementation).*
