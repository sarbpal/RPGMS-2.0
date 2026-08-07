# FR-5 — Finance Architecture & Readiness Assessment

**Project:** RPGMS 2.0  
**Capability Release:** CR-3 — Financial Operations  
**Sprint:** FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces  
**Document:** `docs/finance/FR-5_FINANCE_ARCHITECTURE_READINESS.md`  
**Status:** Readiness Assessment Report (Sealed)  
**Date:** August 2026  
**Author:** RPGMS 2.0 Architectural Committee  

---

## 1. Executive Summary

This report establishes the architecture, business rule alignment, implementation gap analysis, and release readiness assessment for **Sprint FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces**.

Following the successful execution of **Sprint FR-1** (Finance Settlement Core & Test Stabilization), **Sprint FR-2** (Admission & Rent Billing Integration), **Sprint FR-3** (Payment Processing & Billing Core Stabilization), and **Sprint FR-4** (Financial Reporting, Activity Timeline & Workspace Integration), the core application services, domain models, double-entry ledger engines, and reporting coordinators of the **Finance Domain** are fully stabilized with **100% test pass rate** (32 test files, 239 tests green).

The objective of **Sprint FR-5** is to complete the user interface layer of **Capability Release 3 (CR-3 — Financial Operations)** by wiring draft UI modal components (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, `ResidentLedgerModal`, `SettlementDialog`) to application services via reactive workspace hooks and `FinanceWorkspaceCoordinator`, ensuring dynamic state refresh, interactive modal workflows, comprehensive UI unit test coverage, and an end-to-end financial lifecycle test suite.

### Primary Assessment Findings:
1. **Repository Baseline**: Working tree clean on branch `feature/application-shell`, fully synchronized with `origin/feature/application-shell`.
2. **Core Engine Stability**: All underlying application services (`ledgerService`, `balanceEngine`, `billingService`, `paymentService`, `settlementService`, `reportingService`, `timelineService`, `admissionFinanceService`) and application coordinators (`FinanceWorkspaceCoordinator`) are implemented with full Dependency Injection (DI) support.
3. **Primary Implementation Gap**: Draft UI components (`FinanceWorkspacePage.tsx`, `ResidentFinancialProfile.tsx`, `ReceivePaymentModal.tsx`, `GenerateRentModal.tsx`, `AddLaundryModal.tsx`) render read-only projections and metrics, but interactive user action buttons ("Receive Payment", "Generate Rent Bill", "Add Extra Charge", "Process Settlement") are either unwired or rely on draft stub handlers rather than calling application services and triggering workspace state refresh.
4. **Testing Gap**: UI components in `src/features/finance/pages/` and `src/features/finance/components/` currently lack automated Vitest component unit tests and an end-to-end financial workflow integration test suite.

**Readiness Decision:** **`READY FOR IMPLEMENTATION`**

---

## 2. Current Repository / Git Baseline

The current Git baseline was verified prior to preparing this readiness assessment:

- **HEAD Commit**: `14f950a feat(fr-4): integrate finance reporting and workspace`
- **Current Branch**: `feature/application-shell`
- **Tracking Branch**: `origin/feature/application-shell` (Synchronized, 0 commits ahead/behind)
- **Working Tree State**: Clean (No modified, untracked, or staged production files)
- **TypeScript Compilation (`npx tsc -b`)**: Passed with 0 errors
- **Production Build (`npm run build`)**: Passed cleanly
- **Automated Test Suite (`npx vitest run`)**: Passed 32/32 test files, 239/239 individual unit/integration tests (100% green)

---

## 3. Governing Documents Reviewed

The following authoritative governance, architectural, and operational documents were inspected:

1. **`README.md`**: Project overview, architectural scope, and setup baseline.
2. **`ROADMAP.md` (v3.0)**: Strategic milestone planning designating **CR-3 Financial Operations** as the active focus.
3. **`PROJECT_RULES.md`**: Constitutional engineering standards, architectural layering, and operating boundaries.
4. **`CAPABILITY_REGISTER.md`**: Operational log tracking capability maturity (CR-3 active in progress).
5. **`docs/MODULE_STATUS.md` (v3.1)**: Module implementation status declaring CR-3 active development.
6. **`docs/ARCHITECTURE.md` (v3.0)**: Layered Clean Architecture rules, feature-first structure, and coordinator patterns (ADR-014).
7. **`docs/DECISIONS.md`**: Architecture Decision Records, including **ADR-004** (Ledger Single Source of Truth), **ADR-014** (Application Layer Pattern), **ADR-018** (Admission Finance & Rollback), **ADR-019** (Payment & Billing DI), and **ADR-020** (Reporting & Timeline DI).
8. **`BUSINESS_RULES.md`**: Canonical business policies, specifically **BR-400 to BR-461** governing financial agreements, ledger immutability, payment allocation, deposit liability, and settlement.
9. **`BUSINESS_CONSTITUTION.md`**: High-level business philosophy, core domain relationships, and domain boundaries.
10. **`DOMAIN_MODEL.md`**: Conceptual entity definitions, aggregate boundaries, and domain invariants.
11. **`DOCUMENTATION_INDEX.md` (v3.0)**: Master documentation index and single source of truth matrix.
12. **`docs/finance/FINANCE_SPECIFICATION.md` (v2.0.0 Sealed)**: Formal functional specification for the Finance Domain.
13. **`docs/finance/FINANCE_IMPLEMENTATION_PLAN.md`**: Master blueprint breakdown for Finance sprints (F0 through F9).
14. **`docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md`**: Master architecture readiness report establishing the FR-1 through FR-5 roadmap.
15. **`docs/finance/FR-4_FINANCE_ARCHITECTURE_READINESS.md`**: Readiness report for Sprint FR-4.

---

## 4. Current Roadmap Position

The project is currently in **Phase 4 – Financial Operations** within the overall product roadmap:

- **CR-1 — Accommodation & Resident Management**: ✅ **Completed & MVP Frozen**
- **CR-2 — Reservation & Admission Management**: ✅ **Completed & Functional**
- **CR-3 — Financial Operations**: 🔄 **Active Development (In Progress)**

### Finance Sprint Progression within CR-3:
- **Sprint FR-1 — Settlement Core & Test Stabilization**: ✅ **Completed** (Double-entry settlement engine, reversal postings, preview snapshot calculations, 18 unit tests).
- **Sprint FR-2 — Admission & Rent Billing Integration**: ✅ **Completed** (Synchronous admission financial initialization, `AdmissionFinanceService`, deposit liability posting, rent bill creation, token advance handling, compensating rollback in `AdmissionCoordinator`).
- **Sprint FR-3 — Payment & Billing Core Stabilization**: ✅ **Completed** (Constructor DI refactoring for `billingService` and `paymentService`, balance math test suite, payment allocation tests).
- **Sprint FR-4 — Financial Reporting, Activity Timeline & Workspace Integration**: ✅ **Completed** (Constructor DI refactoring for `reportingService`, `timelineService`, `FinanceWorkspaceCoordinator`, 14 new unit tests covering property-wide metrics, chronological activity streams, outstanding dues tables, and completed settlements reports).
- **Sprint FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces**: 🎯 **CURRENT TARGET SPRINT**

---

## 5. Identification of Next Sprint

Based on `ROADMAP.md`, `CAPABILITY_REGISTER.md`, `docs/MODULE_STATUS.md`, `FINANCE_IMPLEMENTATION_PLAN.md`, and `FR-0_FINANCE_ARCHITECTURE_READINESS.md`:

1. **Next Sprint Name**: `Sprint FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces`
2. **Business Capability**: Financial Operations (CR-3)
3. **Primary Objective**: Wire draft UI modal components to application services via reactive workspace hooks and `FinanceWorkspaceCoordinator`, enable real-time UI state updates upon user actions, implement UI component unit tests, and create an end-to-end financial workflow test suite to achieve **Production Ready** status for CR-3.
4. **Already Implemented**:
   - Complete domain models (`Bill`, `LedgerEntry`, `Payment`, `Settlement`, `AccountType`).
   - Domain validation rules (`DoubleEntryValidation`, `DuplicateRentPrevention`, `PaymentAllocationRule`, `OutstandingBalanceRule`, `SettlementValidation`).
   - Application services (`ledgerService`, `balanceEngine`, `billingService`, `paymentService`, `settlementService`, `reportingService`, `timelineService`, `admissionFinanceService`).
   - Application Coordinator (`FinanceWorkspaceCoordinator`).
   - Unit test coverage for all application services and coordinators (32 test files, 239 tests green).
   - Draft presentation components (`FinanceWorkspacePage.tsx`, `FinancialSummaryCard.tsx`, `ResidentFinancialProfile.tsx`, `ReceivePaymentModal.tsx`, `GenerateRentModal.tsx`, `AddLaundryModal.tsx`, `ResidentLedgerModal.tsx`).
5. **Functionality Remaining**:
   - **Interactive Modal Action Wiring**: Adding state management to `FinanceWorkspacePage.tsx` to handle modal open/close state for "Receive Payment", "Generate Rent Bill", "Add Extra Charge", and "Process Settlement".
   - **Application Service Binding**: Connecting modal submission forms (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, `SettlementDialog`) to service execution calls (`paymentService.recordPayment()`, `billingService.createBill()`, `settlementService.confirmSettlement()`).
   - **Reactive Workspace State Management**: Creating a dedicated `useFinanceWorkspace` hook (or updating `useStayFinance` / `useFinanceActivity`) that refreshes metrics, activity streams, outstanding tables, and stay balances dynamically upon action completion.
   - **Resident Workspace Integration**: Wiring `ResidentFinancialProfile.tsx` (the Financial Tab inside Resident Workspace) so operators can collect rent payments, issue manual bills, and view immutable ledger entries directly from a resident profile.
   - **UI Component Vitest Testing**: Adding test suites for `FinanceWorkspacePage.test.tsx` and `ResidentFinancialProfile.test.tsx` verifying component rendering, modal triggers, and form submission behavior.
   - **End-to-End Financial Lifecycle Test**: Adding an E2E test suite (`FinanceE2EJourney.test.ts`) that verifies the complete lifecycle: Admission -> Initial Financial Posting -> Rent Payment Collection -> Outstanding Balance Derivation -> Checkout Settlement -> Financial Closure.
6. **Roadmap & Specification Consistency**: Fully consistent. The roadmap requires complete operational workspace integration for financial management before proceeding to CR-4 Operational Services.
7. **Prerequisite Satisfaction**: All underlying domain services, application coordinators, DI abstractions, and unit tests are in place. No pending prerequisites exist.

---

## 6. Existing Implementation Review

A comprehensive audit of the code in `src/features/finance/` and `src/features/resident/` confirmed the following state:

- **Domain Layer (`src/features/finance/domain/`)**:
  - `entities/`: `Bill.ts`, `LedgerEntry.ts`, `Payment.ts`, `Settlement.ts`, `StayBalance.ts`. Clean, immutable interfaces.
  - `rules/`: Clean functional domain rules enforcing double-entry balance equality, duplicate rent prevention, payment allocation, and settlement invariants.
- **Services Layer (`src/features/finance/services/`)**:
  - `ledgerService.ts`: Append-only write entry point enforcing `validateDoubleEntry` and immutability guards.
  - `balanceEngine.ts`: Dynamic $O(N)$ balance derivation engine for Receivables, Deposit Liabilities, and Advance Credits.
  - `billingService.ts`: Rent bill generation, duplicate bill protection, anniversary billing rules. Constructor DI supported.
  - `paymentService.ts`: Payment recording, CASH/BANK debit routing, bill allocation, advance credit creation. Constructor DI supported.
  - `settlementService.ts`: Stage 1 preview derivations and Stage 2 settlement execution with double-entry ledger postings. Constructor DI supported.
  - `reportingService.ts`: Property-wide metrics aggregation, outstanding dues sorting, settlement audit reporting. Constructor DI supported.
  - `timelineService.ts`: Chronological activity event projection. Constructor DI supported.
- **Application Layer (`src/features/finance/application/`)**:
  - `coordinator/FinanceWorkspaceCoordinator.ts`: Assembles property-wide `FinanceWorkspaceViewModel` and stay-level `StayFinanceViewModel`. Constructor DI supported.
- **Infrastructure Layer (`src/features/finance/infrastructure/` & `storage/`)**:
  - `InMemoryFinanceRepository.ts` backed by `financeStorage.ts` (`localStorage` keys: `rpgms_ledger_entries`, `rpgms_bills`, `rpgms_payments`, `rpgms_settlements`).
- **Presentation Layer (`src/features/finance/pages/` & `components/`)**:
  - `FinanceWorkspacePage.tsx`: Renders summary cards, activity streams, outstanding dues tables, and settlement audit reports. Uses `FinanceWorkspaceCoordinator`. Currently read-only without modal trigger state.
  - `ResidentFinancialProfile.tsx`: Renders stay balance metrics, bills list, payment history, and timeline. Embedded in `ResidentWorkspacePage.tsx`. Currently unwired for interactive modal actions.
  - Draft Modal Dialogs: `ReceivePaymentModal.tsx`, `GenerateRentModal.tsx`, `AddLaundryModal.tsx`, `ResidentLedgerModal.tsx` exist with draft form inputs and stub handlers.

---

## 7. Current Implementation Gap Analysis

| Gap Category | Component / File Involved | Current State | Required Target State for FR-5 |
|---|---|---|---|
| **A. Already Implemented** | `services/*`, `coordinator/*`, `domain/*` | 100% completed & unit tested with constructor DI | Retain and reuse without breaking changes |
| **B. Partially Implemented** | `FinanceWorkspacePage.tsx` | Renders read-only dashboard metrics and tables | Add modal state management and action button click handlers |
| **B. Partially Implemented** | `ResidentFinancialProfile.tsx` | Renders stay-level financial summary tab | Wire "Receive Payment", "Generate Rent", and "View Ledger" action buttons to active modal handlers |
| **B. Partially Implemented** | `hooks/useFinanceActivity.ts`, `useStayFinance.ts` | Fetches read-only data arrays | Provide mutation execution triggers and state refresh callbacks |
| **C. Not Implemented** | `hooks/useFinanceWorkspace.ts` | Non-existent | Create custom hook encapsulating workspace state, modal visibility, form handlers, and reactive re-fetching |
| **C. Not Implemented** | `components/SettlementDialog.tsx` (or `SettlementModal.tsx`) | Draft / incomplete UI component for settlement | Create/wire interactive settlement modal that calls Stage 1 preview and Stage 2 `confirmSettlement()` |
| **D. Architecturally Incomplete** | Draft Modals (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`) | Use inline dummy handlers and static mock state | Bind form submissions to `paymentService`, `billingService`, and `settlementService` methods via workspace coordinator/hooks |
| **E. Insufficiently Tested** | `FinanceWorkspacePage.test.tsx`, `ResidentFinancialProfile.test.tsx` | Non-existent (0 UI component tests) | Create Vitest UI component test suites verifying rendering, modal triggers, and form submissions |
| **E. Insufficiently Tested** | `FinanceE2EJourney.test.ts` | Non-existent | Create end-to-end integration test verifying complete financial lifecycle from admission through checkout settlement |
| **F. Governance Impact** | `CAPABILITY_REGISTER.md`, `MODULE_STATUS.md`, `DECISIONS.md` | Reflect FR-4 completed state | Update post-FR-5 to mark CR-3 Financial Operations as Production Ready; record ADR-021 |

---

## 8. Architectural Readiness

The system is **architecturally ready** for Sprint FR-5:

1. **Domain Boundaries**: Clear separation between `Resident` (Identity), `Stay` (Operational & Financial Boundary), `Accommodation` (Physical Structure), and `Finance` (Accounting & Ledger).
2. **Application Services**: Inversion of control is fully established across all 7 application services and the `FinanceWorkspaceCoordinator`.
3. **Transaction & Rollback Boundaries**: Double-entry ledger postings are atomic. `AdmissionCoordinator` incorporates synchronous finance initialization with compensating rollback (ADR-018).
4. **State Transitions**: `Stay` operational states (`ACTIVE`, `ON_NOTICE`, `CHECKED_OUT`) and financial states (`Active Billing`, `Settlement Pending`, `Financially Closed`) are cleanly decoupled (BR-460).
5. **No Circular Dependencies**: Dependencies flow strictly downward: UI -> Hooks -> Application Coordinator -> Domain Services -> Repositories -> Storage.
6. **Future Supabase Compatibility**: In-memory repository operations map 1:1 to PostgreSQL SQL queries (`SUM(debit) - SUM(credit)` aggregations, append-only RLS policies).

---

## 9. Existing Components & Services for Reuse

The implementation of Sprint FR-5 shall maximize reuse of existing, verified assets:

| Existing Component / Service | Current Functionality | Why Reusable for FR-5 | Extension Required |
|---|---|---|---|
| `FinanceWorkspaceCoordinator` | Assembles ViewModels for property dashboard and stay views | Central application entry point for presentation data | Add facade methods or integrate with workspace hooks for executing write actions (`recordPayment`, `createBill`, `confirmSettlement`) |
| `paymentService.ts` | Validates, routes CASH/BANK, posts ledger debits/credits, allocates to bills | Single source of truth for payment processing | None (invoke existing `recordPayment()`) |
| `billingService.ts` | Generates rent bills, checks duplicate periods, posts ledger debits/credits | Single source of truth for bill generation | None (invoke existing `createBill()` and `generateMonthlyRentBills()`) |
| `settlementService.ts` | Generates Stage 1 preview snapshot, executes Stage 2 settlement commitment | Single source of truth for checkout settlements | None (invoke existing `generateSettlementPreview()` and `confirmSettlement()`) |
| `reportingService.ts` | Derives dashboard metrics, outstanding dues, settlement reports | Authoritative read model calculation service | None (reused via coordinator) |
| `timelineService.ts` | Aggregates chronological activity stream | Authoritative timeline generator | None (reused via coordinator) |
| `balanceEngine.ts` | Calculates `StayBalance` derived metrics | Dynamic balance engine | None (reused via coordinator & hooks) |
| `ledgerService.ts` | Append-only double-entry write core | Immutable ledger entry point | None (reused internally by services) |
| `formatCurrency` utility | Formats INR currency values (e.g. ₹12,500) | Consistent UI currency presentation | None |

> **Architectural Prohibition**: Developers MUST NOT duplicate payment allocation, balance calculation, or double-entry posting logic within React UI components or custom hooks. All actions must delegate strictly to application services.

---

## 10. Transaction / Atomicity Analysis

Sprint FR-5 involves interactive user actions that execute state-changing financial transactions:

1. **Recording Payment (`ReceivePaymentModal`)**:
   - User inputs amount, payment date, payment method (CASH/BANK), reference number, and optional target bill IDs.
   - Execution: Invokes `paymentService.recordPayment()`.
   - Atomicity: Creates immutable `Payment` record and atomic double-entry `LedgerEntry` postings (`CASH`/`BANK` Debit, `ACCOUNTS_RECEIVABLE` Credit or `ADVANCE_CREDIT` Credit).
2. **Generating Rent Bill (`GenerateRentModal`)**:
   - User selects target stay/month or executes property-wide billing.
   - Execution: Invokes `billingService.createBill()` or `billingService.generateMonthlyRentBills()`.
   - Atomicity: Checks duplicate billing index (`RENT-YYYY-MM-STAYID`), creates immutable `Bill` record, and posts atomic double-entry `LedgerEntry` postings (`ACCOUNTS_RECEIVABLE` Debit, `RENT_REVENUE` Credit).
3. **Adding Extra Charge (`AddLaundryModal` / Manual Charge)**:
   - User inputs charge type (LAUNDRY, ELECTRICITY, DAMAGE, MISC), amount, remarks.
   - Execution: Invokes `billingService.createBill()` with `ONE_TIME_CHARGE`.
   - Atomicity: Creates `Bill` line item and corresponding double-entry ledger postings.
4. **Processing Checkout Settlement (`SettlementDialog`)**:
   - User selects checked-out stay, reviews Stage 1 preview, inputs damage recovery deductions / deposit refund payout method.
   - Execution: Invokes `settlementService.confirmSettlement()`.
   - Atomicity: Posts settlement ledger debits/credits (`SECURITY_DEPOSIT_LIABILITY` Debit, `DAMAGE_RECOVERY` Credit, `CASH`/`BANK` Credit, `REFUND_PAYABLE`), updates `Settlement` record, and transitions Stay financial lifecycle to `Financially Closed`.

---

## 11. Business Rule Analysis

All interactive UI actions in FR-5 must strictly enforce canonical business rules:

- **BR-410 (Stay Financial Ownership)**: Payments and bills must be attached to a valid `stayId`.
- **BR-421 (Payment Immutability)**: Payments cannot be edited or deleted once submitted; UI forms must not provide "edit payment" controls.
- **BR-431 (Derived Balances)**: UI displays dynamically calculated balances from `balanceEngine.ts`; static balance inputs or overrides are forbidden.
- **BR-442 (Ledger Immutability)**: Ledger entries are append-only.
- **BR-450 (Deposit Liability Separation)**: Security deposits are held in `SECURITY_DEPOSIT_LIABILITY` and shown separately from operating receivables.
- **BR-460 (Independent Financial Closure)**: Settling a stay requires explicit checkout settlement confirmation.

---

## 12. Test Readiness

Sprint FR-5 requires establishing comprehensive UI component tests and end-to-end financial workflow tests:

### Required New Test Files:
1. `src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`:
   - Verify initial rendering of summary cards, activity streams, outstanding dues table, and completed settlements report.
   - Verify clicking "Receive Payment" opens `ReceivePaymentModal`.
   - Verify clicking "Generate Rent" opens `GenerateRentModal`.
   - Verify submitting payment updates dashboard metrics dynamically.
2. `src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`:
   - Verify rendering of resident stay balances, open bills list, and payment history.
   - Verify clicking "Record Payment" opens payment modal pre-populated with stay details.
   - Verify successful payment recording updates open bill status to `PAID`.
3. `src/features/finance/__tests__/FinanceE2EJourney.test.ts`:
   - End-to-end integration test verifying complete lifecycle:
     1. Admitting a resident via `AdmissionCoordinator` (verifying opening deposit liability + 1st rent bill).
     2. Verifying outstanding receivables on `reportingService.getFinanceDashboard()`.
     3. Recording rent payment via `paymentService.recordPayment()`.
     4. Verifying receivable balance reduces to ₹0 and bill status transitions to `PAID`.
     5. Generating 2nd month rent bill via `billingService.generateMonthlyRentBills()`.
     6. Recording overpayment and verifying `ADVANCE_CREDIT` creation.
     7. Executing Stage 1 settlement preview via `settlementService.generateSettlementPreview()`.
     8. Executing Stage 2 settlement commitment via `settlementService.confirmSettlement()`.
     9. Verifying final balances zero out and stay transitions to `Financially Closed`.

---

## 13. Documentation & Governance Impact

Executing Sprint FR-5 will require the following governance updates upon completion:

1. **`CAPABILITY_REGISTER.md`**:
   - Update Capability Register table: Transition **CR-3 Financial Operations** to `Functional` / `Level 3` maturity.
   - Update Capability Release Tracker (CR-3): Mark UI, Integration, Testing, and Documentation as `✓` Complete.
   - Add Change Log entry recording completion of Sprint FR-5 and closure of CR-3.
2. **`docs/MODULE_STATUS.md`**:
   - Update document header to August 2026.
   - Update Finance Module status to `🟢 Complete` / `State: Frozen`.
   - Update Overall Project Health and Module Maturity Summary tables.
3. **`docs/DECISIONS.md`**:
   - Add **ADR-021 — Finance UI Workspace Coordination & Interactive Modal Integration**.

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Risk Level | Mitigation Strategy |
|---|:---:|:---:|:---:|---|
| **UI State Out of Sync After Action** | Medium | Medium | **MEDIUM** | Implement reactive re-fetching in custom hook (`useFinanceWorkspace`) that automatically re-executes `coordinator.createViewModel()` immediately following any successful service mutation. |
| **Duplicate Form Submissions** | Low | High | **MEDIUM** | Disable submit buttons and display loading spinners in modal dialogs during async service processing; enforce idempotency checks in underlying services. |
| **Unwired Component Props / Stubs** | Low | Medium | **LOW** | Conduct thorough prop verification across `ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, and `SettlementDialog`. |
| **Vitest JSDOM Test Environment Warnings** | Low | Low | **LOW** | Ensure MUI components in unit tests are wrapped in proper test harnesses with mock providers if needed. |

---

## 15. Prerequisites

All technical and architectural prerequisites for Sprint FR-5 are **fully satisfied**:

- [x] **Git Synchronization**: Working tree clean, branch synchronized with remote baseline.
- [x] **Underlying Services Implemented**: All 7 finance services fully implemented with constructor DI.
- [x] **Application Coordinator Implemented**: `FinanceWorkspaceCoordinator` fully implemented and unit tested.
- [x] **Admission Integration Verified**: `AdmissionFinanceService` integrated into `AdmissionCoordinator` with compensating rollback (ADR-018).
- [x] **Test Baseline Passing**: 32 test files, 239 unit/integration tests passing (100% green).
- [x] **TypeScript & Build Clean**: `npx tsc -b` passes with 0 errors, `npm run build` succeeds cleanly.

---

## 16. Proposed Sprint Boundary

To prevent scope creep, the following strict implementation boundaries are defined for Sprint FR-5:

### IN SCOPE:
- Wiring `FinanceWorkspacePage.tsx` with modal open/close state for "Receive Payment", "Generate Rent", "Add Extra Charge", and "Process Settlement".
- Connecting form submissions in `ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, and `SettlementDialog` to application service methods (`paymentService`, `billingService`, `settlementService`).
- Creating a dedicated reactive workspace hook (`useFinanceWorkspace.ts` or updated `useStayFinance.ts`) for managing modal visibility, action processing, and immediate ViewModel refresh.
- Updating `ResidentFinancialProfile.tsx` (Resident Workspace Financial Tab) with functional action buttons for payment collection, bill issuance, and ledger inspection.
- Adding UI component unit tests: `FinanceWorkspacePage.test.tsx` and `ResidentFinancialProfile.test.tsx`.
- Adding end-to-end financial lifecycle test: `FinanceE2EJourney.test.ts`.
- Updating governance documents (`CAPABILITY_REGISTER.md`, `docs/MODULE_STATUS.md`, `docs/DECISIONS.md`) upon completion to close Capability Release 3 (CR-3).

### OUT OF SCOPE:
- Supabase / PostgreSQL database infrastructure (remains in-memory MVP architecture).
- Multi-property / multi-tenant financial accounting.
- Automated online payment gateway integration (Razorpay, Paytm, Stripe).
- GST / Tax calculation engines or TDS compliance.
- Operational Services capabilities (Electricity meter reading workspace, Maintenance complaints workspace — deferred to **CR-4 Operational Services**).

---

## 17. Recommended Implementation Approach

Implementation of Sprint FR-5 should proceed in 4 sequential phases:

```text
Phase 1: Reactive Workspace Hook & Coordinator Facade
   └─ Create/update `useFinanceWorkspace.ts` hook to encapsulate modal visibility state,
      service action execution handlers, and reactive ViewModel re-fetching.

Phase 2: Modal Dialog Integration & Wiring
   └─ Refactor draft modal components (`ReceivePaymentModal`, `GenerateRentModal`,
      `AddLaundryModal`, `SettlementDialog`) to accept active submission handlers,
      validating form inputs and delegating directly to application services.

Phase 3: Page & Profile Workspace Integration
   └─ Wire `FinanceWorkspacePage.tsx` and `ResidentFinancialProfile.tsx` to pass active
      modal handlers, trigger dialogs on button clicks, and render updated balances instantly.

Phase 4: Testing & Governance Closure
   └─ Build `FinanceWorkspacePage.test.tsx`, `ResidentFinancialProfile.test.tsx`, and
      `FinanceE2EJourney.test.ts`. Update `CAPABILITY_REGISTER.md`, `MODULE_STATUS.md`,
      and record `ADR-021` in `docs/DECISIONS.md`.
```

---

## 18. Readiness Decision

### **READY FOR IMPLEMENTATION**

The repository baseline is clean, architectural dependencies are inverted, unit tests are 100% green, and all prerequisites are fully satisfied. Sprint FR-5 can begin immediately upon authorization.

---

## 19. Files Likely to Change During Implementation

### Files to Create:
1. `docs/finance/FR-5_FINANCE_ARCHITECTURE_READINESS.md` *(This report)*
2. `src/features/finance/hooks/useFinanceWorkspace.ts`
3. `src/features/finance/components/SettlementDialog.tsx` *(if missing or replacing draft)*
4. `src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`
5. `src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`
6. `src/features/finance/__tests__/FinanceE2EJourney.test.ts`

### Files to Modify:
1. `src/features/finance/pages/FinanceWorkspacePage.tsx`
2. `src/features/finance/components/ResidentFinancialProfile.tsx`
3. `src/features/finance/components/ReceivePaymentModal.tsx`
4. `src/features/finance/components/GenerateRentModal.tsx`
5. `src/features/finance/components/AddLaundryModal.tsx`
6. `CAPABILITY_REGISTER.md` *(Post-implementation governance update)*
7. `docs/MODULE_STATUS.md` *(Post-implementation status update)*
8. `docs/DECISIONS.md` *(Addition of ADR-021 post-implementation)*

### Files that MUST NOT be modified:
- `src/features/finance/domain/` (entities, rules, valueObjects)
- `src/features/finance/services/` (`ledgerService`, `balanceEngine`, `billingService`, `paymentService`, `settlementService`, `reportingService`, `timelineService`)
- Any Admission, Resident, Stay, or Accommodation production domain or application code.

---

## 20. Explicit Confirmation of Read-Only Planning Scope

**CONFIRMATION**: This readiness assessment was conducted in strict adherence to the read-only operating rules of the planning phase. Zero production source files were created, edited, modified, deleted, or refactored. Zero existing documentation files were altered. Zero test files were changed. No Git staging (`git add`), commit (`git commit`), reset, checkout, or push operations were executed. Only this single planning document (`docs/finance/FR-5_FINANCE_ARCHITECTURE_READINESS.md`) was created.
