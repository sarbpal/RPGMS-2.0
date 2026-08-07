# Sprint FR-5 — Finance UI Integration & Interactive Workspaces Plan

**Project:** RPGMS 2.0  
**Capability Release:** CR-3 — Financial Operations  
**Sprint:** FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces  
**Document:** `docs/finance/FR-5_FINANCE_UI_INTEGRATION_PLAN.md`  
**Status:** Official Implementation Plan (Sealed)  
**Date:** August 2026  
**Author:** RPGMS 2.0 Architectural Committee  

---

## 1. Executive Summary

This document establishes the official technical implementation plan for **Sprint FR-5 — Finance UI Integration, Modal Actions & Interactive Workspaces**.

Following the completion of Sprints **FR-1** through **FR-4**, the core domain logic, append-only double-entry ledger engine, reporting services, timeline aggregation, and application coordinators of the **Finance Domain** are fully stabilized with **100% test pass rate** (32 test files, 239 individual tests passing).

The primary objective of **Sprint FR-5** is to complete the presentation and workspace layer of **Capability Release 3 (CR-3 — Financial Operations)**. This involves:
1. Wiring draft UI modal components (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, `ResidentLedgerModal`, and creating `SettlementDialog`) to application services (`paymentService`, `billingService`, `settlementService`) via a reactive workspace hook (`useFinanceWorkspace.ts`) and `FinanceWorkspaceCoordinator`.
2. Providing interactive action triggers on `FinanceWorkspacePage.tsx` and `ResidentFinancialProfile.tsx`.
3. Creating automated Vitest UI component unit tests (`FinanceWorkspacePage.test.tsx`, `ResidentFinancialProfile.test.tsx`) and a complete end-to-end financial lifecycle test suite (`FinanceE2EJourney.test.ts`).
4. Updating governance documents (`CAPABILITY_REGISTER.md`, `docs/MODULE_STATUS.md`, `docs/DECISIONS.md` for ADR-021) to designate CR-3 as **Production Ready**.

---

## 2. Current Architecture

The Finance domain adheres strictly to Clean Architecture, feature cohesion, and layered separation of concerns:

```text
Presentation Layer
┌───────────────────────────────┐      ┌───────────────────────────────┐
│   FinanceWorkspacePage.tsx    │      │ ResidentFinancialProfile.tsx  │
└──────────────┬────────────────┘      └──────────────┬────────────────┘
               │                                      │
               ▼                                      ▼
Presentation Hooks & Modals Layer
┌──────────────────────────────────────────────────────────────────────┐
│  useFinanceWorkspace  │ ReceivePaymentModal  │ GenerateRentModal     │
│  useStayFinance       │ AddLaundryModal      │ SettlementDialog      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ (Read ViewModels / Write Service Actions)
                               ▼
Application Layer
┌──────────────────────────────────────────────────────────────────────┐
│                  FinanceWorkspaceCoordinator                         │
│  (Coordinates read ViewModels across Reporting, Timeline & Balance)  │
├──────────────────────────────────────────────────────────────────────┤
│ paymentService │ billingService │ settlementService │ ledgerService  │
│ (Executes write actions, validates rules, posts ledger entries)     │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
Infrastructure / Persistence Layer
┌──────────────────────────────────────────────────────────────────────┐
│                      InMemoryFinanceRepository                       │
│  (Backed by financeStorage: ledger, bills, payments, settlements)    │
└──────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles Enforced:
- **Clean Separation of Concerns**: UI components render presentation data and capture user input. They never calculate balances, construct debit/credit entries, manipulate storage directly, or duplicate business rules.
- **Single Source of Truth**: All balances (Receivables, Deposit Liabilities, Advance Credits) are derived dynamically on demand by `balanceEngine.ts` aggregating append-only `LedgerEntry` records.
- **Dependency Inversion**: Application services receive repository interfaces via constructor dependency injection.

---

## 3. Current Implementation State

- **Domain Layer (`src/features/finance/domain/`)**: 100% complete (`Bill`, `LedgerEntry`, `Payment`, `Settlement`, `AccountType`, `DoubleEntryValidation`, `DuplicateRentPrevention`, `PaymentAllocationRule`, `OutstandingBalanceRule`, `SettlementValidation`).
- **Application Services (`src/features/finance/services/`)**: 100% complete with full constructor DI (`ledgerService`, `balanceEngine`, `billingService`, `paymentService`, `settlementService`, `reportingService`, `timelineService`, `admissionFinanceService`).
- **Application Coordinator (`src/features/finance/application/coordinator/`)**: `FinanceWorkspaceCoordinator.ts` is 100% complete and unit tested.
- **Presentation Components (`src/features/finance/components/` & `pages/`)**:
  - `FinanceWorkspacePage.tsx`: Renders read-only dashboard metrics and tables. Lacks action bar buttons and modal trigger state.
  - `ResidentFinancialProfile.tsx`: Renders resident stay financial snapshot and bills. "Checkout" action button opens a placeholder dialog instead of a settlement modal.
  - `ReceivePaymentModal.tsx`, `GenerateRentModal.tsx`, `AddLaundryModal.tsx`, `ResidentLedgerModal.tsx`: Draft components exist with complete form inputs and submit handlers, awaiting integration into pages via hooks.
- **Test Baseline**: 32 test files, 239 tests passing (100% green). UI components currently have 0 Vitest unit tests.

---

## 4. Gap Analysis

| Component / Area | Existing State | Missing Gap for FR-5 | Action Required |
|---|---|---|---|
| `hooks/useFinanceWorkspace.ts` | Non-existent | Missing custom hook for workspace state, modal visibility, and reactive refresh | Create `useFinanceWorkspace.ts` |
| `components/SettlementDialog.tsx` | Non-existent | Missing interactive settlement dialog component for Stage 1 preview and Stage 2 commit | Create `SettlementDialog.tsx` |
| `pages/FinanceWorkspacePage.tsx` | Read-only view | Missing top action bar buttons ("Receive Payment", "Generate Rent", "Add Extra Charge", "Process Settlement") and modal state | Wire page with header actions and `useFinanceWorkspace` hook |
| `components/ResidentFinancialProfile.tsx` | Partial modal triggers | "Checkout" button opens placeholder dialog instead of settlement modal | Connect `SettlementDialog` to `CHECKOUT` action |
| `pages/__tests__/FinanceWorkspacePage.test.tsx` | Non-existent | 0 unit tests for main finance page | Create component unit test suite |
| `components/__tests__/ResidentFinancialProfile.test.tsx` | Non-existent | 0 unit tests for resident financial profile | Create component unit test suite |
| `__tests__/FinanceE2EJourney.test.ts` | Non-existent | 0 E2E financial lifecycle integration tests | Create E2E integration test suite |

---

## 5. FR-5 Scope

### IN SCOPE:
1. Wiring `FinanceWorkspacePage.tsx` with modal open/close state for:
   - Receive Payment
   - Generate Rent
   - Add Extra Charge / Laundry
   - Process Settlement
2. Creating `src/features/finance/hooks/useFinanceWorkspace.ts` to manage workspace ViewModel loading, active modal visibility, target context selection, and reactive state refresh.
3. Creating `src/features/finance/components/SettlementDialog.tsx` to handle Stage 1 settlement preview display and Stage 2 settlement confirmation.
4. Updating `ResidentFinancialProfile.tsx` to wire functional action triggers for all actions including checkout settlement.
5. Exporting new hook and component in `src/features/finance/index.ts`.
6. Creating automated unit test suites:
   - `src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`
   - `src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`
7. Creating end-to-end financial workflow test suite:
   - `src/features/finance/__tests__/FinanceE2EJourney.test.ts`
8. Updating governance documents post-implementation:
   - `CAPABILITY_REGISTER.md`
   - `docs/MODULE_STATUS.md`
   - `docs/DECISIONS.md` (recording **ADR-021**).

---

## 6. Out-of-Scope Items

- PostgreSQL / Supabase production backend migration (remains in-memory MVP architecture).
- Online payment gateway integration (Razorpay, Paytm, Stripe).
- GST / Tax filing calculation engines.
- Operational Services capabilities (Electricity workspace, Maintenance workspace — deferred to **CR-4 Operational Services**).
- Refactoring underlying finance services, domain rules, or ledger storage.
- UI redesign of non-finance workspaces.

---

## 7. Proposed Implementation Sequence

```text
Phase 1: Custom Workspace Hook & Settlement Dialog Component
   ├─ 1. Create `src/features/finance/hooks/useFinanceWorkspace.ts`
   └─ 2. Create `src/features/finance/components/SettlementDialog.tsx`

Phase 2: UI Page & Component Action Wiring
   ├─ 3. Update `src/features/finance/pages/FinanceWorkspacePage.tsx`
   ├─ 4. Update `src/features/finance/components/ResidentFinancialProfile.tsx`
   └─ 5. Update barrel export `src/features/finance/index.ts`

Phase 3: Automated Testing Suite Creation
   ├─ 6. Create `src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`
   ├─ 7. Create `src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`
   └─ 8. Create `src/features/finance/__tests__/FinanceE2EJourney.test.ts`

Phase 4: Governance Updates & Closure
   ├─ 9. Update `CAPABILITY_REGISTER.md`
   ├─ 10. Update `docs/MODULE_STATUS.md`
   └─ 11. Record `ADR-021` in `docs/DECISIONS.md`
```

---

## 8. File-by-File Change Plan

### A. New Files to Create:

1. **`src/features/finance/hooks/useFinanceWorkspace.ts`**:
   - *Purpose*: Custom React hook managing property-wide finance workspace state, active modal visibility (`'RECEIVE_PAYMENT' | 'GENERATE_RENT' | 'ADD_LAUNDRY' | 'PROCESS_SETTLEMENT' | null`), selected context (`resident`, `stayId`, `selectedFlat`), action execution handlers, and reactive ViewModel refresh.
   - *Rationale*: Encapsulates presentation state coordination without adding business logic to UI components.

2. **`src/features/finance/components/SettlementDialog.tsx`**:
   - *Purpose*: Interactive MUI modal dialog rendering Stage 1 settlement preview (unpaid debits, deposit held, advance credit, net refund/payable, outcome chip) via `settlementService.generateSettlementPreview()`, capturing damage recovery deductions and refund payment method, and executing Stage 2 `settlementService.confirmSettlement()`.
   - *Rationale*: Fulfills the "Process Settlement" UI requirement of FR-5.

3. **`src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`**:
   - *Purpose*: Vitest component test suite verifying dashboard rendering, header action buttons, opening/closing each modal, form submission, and workspace metrics refresh.
   - *Rationale*: Establishes test coverage for main finance workspace.

4. **`src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`**:
   - *Purpose*: Vitest component test suite verifying resident financial tab metrics rendering, action button clicks ("Receive Payment", "Generate Rent", "Add Laundry", "View Ledger", "Checkout"), and modal success callbacks.
   - *Rationale*: Establishes test coverage for resident financial workspace tab.

5. **`src/features/finance/__tests__/FinanceE2EJourney.test.ts`**:
   - *Purpose*: End-to-end integration test verifying complete financial lifecycle: Admission -> Initial Financial Initialization -> Rent Payment Collection -> Ancillary Billing -> Overpayment Advance -> Checkout Settlement -> Financial Closure.
   - *Rationale*: Verifies complete cross-domain financial workflow integrity.

### B. Existing Files to Modify:

1. **`src/features/finance/pages/FinanceWorkspacePage.tsx`**:
   - *Changes*: Integrate `useFinanceWorkspace` hook. Add header action bar buttons ("Receive Payment", "Generate Rent", "Add Extra Charge", "Process Settlement") and table row action buttons. Render modal dialogs dynamically based on `activeModal` state.
   - *Rationale*: Connects read-only dashboard to interactive user actions.

2. **`src/features/finance/components/ResidentFinancialProfile.tsx`**:
   - *Changes*: Replace static placeholder dialog for `activeAction === 'CHECKOUT'` with interactive `SettlementDialog`. Ensure `handleSuccess` callbacks trigger `refresh()`.
   - *Rationale*: Makes checkout settlement action fully operational within resident profile.

3. **`src/features/finance/index.ts`**:
   - *Changes*: Export `useFinanceWorkspace` and `SettlementDialog`.
   - *Rationale*: Maintains clean feature barrel exports.

4. **`CAPABILITY_REGISTER.md`**:
   - *Changes*: Mark CR-3 Financial Operations as `Functional` / `Level 3` maturity; mark UI, Integration, Testing, Documentation as `✓`; record FR-5 completion in Change Log.

5. **`docs/MODULE_STATUS.md`**:
   - *Changes*: Update header date; mark Finance module `🟢 Complete` / `State: Frozen`.

6. **`docs/DECISIONS.md`**:
   - *Changes*: Record **ADR-021 — Finance UI Workspace Coordination & Interactive Modal Integration**.

---

## 9. Data/Action Flow for Each UI Action

### Action 1: Receive Payment
`FinanceWorkspacePage` / `ResidentFinancialProfile` ➔ Click "Receive Payment" ➔ Opens `ReceivePaymentModal` ➔ User enters amount, date, mode (CASH/BANK), reference # ➔ Click "Confirm Payment" ➔ `paymentService.recordPayment()` ➔ Posts double-entry `LedgerEntry` (`CASH`/`BANK` Debit, `ACCOUNTS_RECEIVABLE` / `ADVANCE_CREDIT` Credit) ➔ Storage saved ➔ Modal `onSuccess()` invoked ➔ `refresh()` called ➔ `useFinanceWorkspace` re-calculates `createViewModel()` ➔ Dashboard metrics and outstanding table update immediately.

### Action 2: Generate Rent
`FinanceWorkspacePage` / `ResidentFinancialProfile` ➔ Click "Generate Rent" ➔ Opens `GenerateRentModal` ➔ Select billing period (e.g. `2026-08`), due date ➔ Click "Generate Rent" ➔ `billingService.generateMonthlyRentBill()` ➔ Checks duplicate rent rule ➔ Posts double-entry `LedgerEntry` (`ACCOUNTS_RECEIVABLE` Debit, `RENT_REVENUE` Credit) ➔ Storage saved ➔ Modal `onSuccess()` invoked ➔ `refresh()` called ➔ Dashboard metrics update immediately.

### Action 3: Add Extra Charge / Laundry
`FinanceWorkspacePage` / `ResidentFinancialProfile` ➔ Click "Add Extra Charge" ➔ Opens `AddLaundryModal` ➔ Enter charge amount, date, preset description ➔ Click "Add Laundry Charge" ➔ `billingService.generateLaundryChargeBill()` ➔ Creates `Bill` (`ONE_TIME_CHARGE`) & posts ledger entries ➔ Storage saved ➔ Modal `onSuccess()` invoked ➔ `refresh()` called ➔ Dashboard activity stream & balances update immediately.

### Action 4: Process Settlement
`FinanceWorkspacePage` / `ResidentFinancialProfile` ➔ Click "Process Settlement" (or "Checkout") ➔ Opens `SettlementDialog` ➔ Invokes `settlementService.generateSettlementPreview()` to display Stage 1 preview (unpaid debits, deposit held, advance credit, net refund/payable, outcome) ➔ User enters optional damage recovery deduction & refund payout method ➔ Click "Confirm Settlement" ➔ `settlementService.confirmSettlement()` ➔ Posts settlement ledger entries (`SECURITY_DEPOSIT_LIABILITY` Debit, `DAMAGE_RECOVERY` Credit, `CASH`/`BANK` Credit, `REFUND_PAYABLE`) ➔ Stay status transitions to `Financially Closed` ➔ Modal `onSuccess()` invoked ➔ `refresh()` called ➔ Completed settlements report table updates immediately.

---

## 10. State Refresh Strategy

To prevent stale UI state without introducing global state libraries:
1. Workspace hooks (`useFinanceWorkspace`, `useStayFinance`) maintain an internal `refreshCount` counter (`useState(0)`).
2. All read queries (`createViewModel()`, `getRecentActivity()`, `getStayFinanceViewModel()`) are wrapped in `useMemo` depending on `refreshCount`.
3. When any modal execution completes successfully, `onSuccess` calls `refresh()`, which executes `setRefreshCount(prev => prev + 1)`.
4. React synchronously re-runs the `useMemo` calculations against updated in-memory storage, updating presentation components instantly.

---

## 11. Error Handling Strategy

- Modal form handlers capture errors cleanly inside `try ... catch` blocks.
- If an application service returns `{ success: false, errors: [...] }`, the modal displays errors in an inline MUI `<Alert severity="error">` without closing the dialog.
- Runtime exceptions set an `errorMessage` state, displaying a clear alert.
- Form inputs remain editable so the user can correct errors or retry submission.

---

## 12. Duplicate Submission Strategy

- UI modals maintain an `isSubmitting` boolean state.
- When submission begins, `isSubmitting` is set to `true`. Submit buttons are disabled (`disabled={isSubmitting}`) and display a `<CircularProgress size={18} />` spinner.
- Backdrop and escape key modal dismissal are disabled during submission (`onClose={isSubmitting ? undefined : onClose}`).
- Application services enforce underlying domain idempotency protections (e.g., `checkDuplicateMonthlyRentBill`).

---

## 13. Modal Lifecycle Strategy

1. **Opening**: Clicking an action button sets `activeModal` and populates selected resident/stay/flat context.
2. **User Interaction**: Form inputs update local modal state; real-time validation highlights invalid inputs.
3. **Submission**: User clicks confirm ➔ `isSubmitting` becomes `true` ➔ Service action executes.
4. **Completion**: If successful ➔ `onSuccess(message)` triggers snackbar alert ➔ `refresh()` updates workspace state ➔ `closeModal()` closes dialog and resets selection.

---

## 14. Testing Strategy

### Unit Tests:
- `FinanceWorkspacePage.test.tsx`:
  - Test initial rendering of metrics cards, activity stream, outstanding table, and settlements report.
  - Test opening each modal ("Receive Payment", "Generate Rent", "Add Extra Charge", "Process Settlement").
  - Test closing modals.
  - Test successful payment submission refreshes metrics.
- `ResidentFinancialProfile.test.tsx`:
  - Test rendering of stay balance snapshot.
  - Test clicking action buttons opens pre-populated modals.
  - Test payment recording updates open bill status to `PAID`.

---

## 15. E2E Financial Journey

`src/features/finance/__tests__/FinanceE2EJourney.test.ts` will verify the complete lifecycle:
1. **Admission**: Call `AdmissionCoordinator.confirmReservedAdmission()`, verifying opening deposit liability + 1st rent bill posting.
2. **Dashboard Verification**: Check `reportingService.getFinanceDashboard()` reflects initial receivable balance and monthly billing.
3. **Payment Collection**: Call `paymentService.recordPayment()`, verifying receivable balance reduces to ₹0.
4. **Ancillary Charge**: Call `billingService.generateLaundryChargeBill()`, verifying balance increases by laundry charge.
5. **Overpayment**: Call `paymentService.recordPayment()` exceeding dues, verifying `advanceCreditBalance` creation.
6. **Checkout Settlement Stage 1**: Call `settlementService.generateSettlementPreview()` with damage deduction, verifying net refund calculation.
7. **Checkout Settlement Stage 2**: Call `settlementService.confirmSettlement()`, verifying double-entry settlement postings and transition to `Financially Closed`.

---

## 16. Governance & ADR Impact

- **Verified Next ADR Number**: **`ADR-021`**
- **Title**: `ADR-021 — Finance UI Workspace Coordination & Interactive Modal Integration`
- **Context**: Integrates modal dialogs and workspace actions with application services using reactive workspace hooks while maintaining strict layered separation of concerns.

---

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|:---:|---|
| **Stale UI State After Action** | Medium | Reactive re-fetching via `useFinanceWorkspace` `refreshCount` counter. |
| **Double Submission** | Medium | Disable submit buttons and show loading spinner during async processing. |
| **Global vs Row Modal Context** | Low | Modals support both global resident selection and row-prepopulated resident context. |

---

## 18. Definition of Done

Sprint FR-5 will be considered **DONE** when:
1. `useFinanceWorkspace.ts` hook and `SettlementDialog.tsx` are created and fully functional.
2. `FinanceWorkspacePage.tsx` and `ResidentFinancialProfile.tsx` are fully wired with working action triggers for all financial operations.
3. `FinanceWorkspacePage.test.tsx` and `ResidentFinancialProfile.test.tsx` pass 100% green.
4. `FinanceE2EJourney.test.ts` passes 100% green.
5. `npx tsc -b` passes with 0 errors and `npm run build` succeeds cleanly.
6. `CAPABILITY_REGISTER.md`, `docs/MODULE_STATUS.md`, and `docs/DECISIONS.md` (ADR-021) are updated.

---

## 19. Verification Commands

Upon completing FR-5 implementation, run:
```bash
npx vitest run
npx tsc -b
npm run build
git status
```

---

## 20. Explicit List of Files Expected to be Modified/Created

### Files to Create:
1. `docs/finance/FR-5_FINANCE_UI_INTEGRATION_PLAN.md` *(This plan)*
2. `src/features/finance/hooks/useFinanceWorkspace.ts`
3. `src/features/finance/components/SettlementDialog.tsx`
4. `src/features/finance/pages/__tests__/FinanceWorkspacePage.test.tsx`
5. `src/features/finance/components/__tests__/ResidentFinancialProfile.test.tsx`
6. `src/features/finance/__tests__/FinanceE2EJourney.test.ts`

### Files to Modify:
1. `src/features/finance/pages/FinanceWorkspacePage.tsx`
2. `src/features/finance/components/ResidentFinancialProfile.tsx`
3. `src/features/finance/index.ts`
4. `CAPABILITY_REGISTER.md` *(Post-implementation)*
5. `docs/MODULE_STATUS.md` *(Post-implementation)*
6. `docs/DECISIONS.md` *(Post-implementation)*
