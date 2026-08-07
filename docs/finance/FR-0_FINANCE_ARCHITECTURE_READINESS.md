# FR-0 — Finance Architecture & Readiness Report

**Project:** RPGMS 2.0  
**Capability Release:** Preparation for CR-3 — Financial Operations  
**Document:** `docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md`  
**Status:** Frozen Planning & Architecture Report  
**Date:** 07 August 2026  
**Author:** RPGMS 2.0 Lead Architect & Engineering Team  

---

## 1. Executive Summary

This report establishes the authoritative architecture, business rules reconciliation, implementation assessment, and release roadmap for **CR-3 — Financial Operations** in RPGMS 2.0.

Following the successful implementation of **CR-1 (Resident & Stay Management)** and **CR-2 (Reservation & Admission Management)**, the system possesses complete operational onboarding capabilities. To prepare for financial management, an exhaustive audit was conducted across all constitutional documentation (`BUSINESS_CONSTITUTION.md`, `BUSINESS_RULES.md`, `FINANCE_SPECIFICATION.md` v2.0.0 Sealed) and existing codebase implementation (`src/features/finance/`).

### Primary Audit Findings:
1. **Architectural Alignment**: The fundamental financial boundary is strictly bound to the **`Stay`** entity (`Stay is the Financial Boundary`). A `Resident` owns identity truth across multiple stays, but each `Stay` maintains an independent, isolated financial ledger.
2. **Double-Entry Ledger Foundation**: The core accounting engine operates as an append-only double-entry ledger (`LedgerEntry`), enforcing debit-credit equality (`validateDoubleEntry`) and immutable financial records.
3. **Derived Balances**: All financial metrics (Receivables, Deposit Liability, Advance Credit) are derived dynamically from transaction history (`balanceEngine.ts`), eliminating mutable balance state columns.
4. **Code vs. Documentation Discrepancies**:
   - `CAPABILITY_REGISTER.md` uses outdated indexing (`CR-5`, `CR-6`, `CR-7`) that conflicts with `ROADMAP.md` v3.0 (`CR-3 Financial Operations`).
   - `FINANCE_IMPLEMENTATION_PLAN.md` mentions `prorationCalculator.ts` and `calculateProratedRent()`, whereas constitutional business rules (`BUSINESS_RULES.md` BR-400) enforce anniversary-date billing without mid-month pro-ration.
   - `settlementService.ts` currently instantiates `new InMemoryStayRepository()` directly instead of using constructor dependency injection.
   - `AdmissionCoordinator` (CR-2) currently does not post initial financial ledger entries (Security Deposit Liability / opening Rent Bill) upon admission commitment.
   - `src/features/finance/` currently has **`0` automated Vitest test cases**.

**FR-0 Readiness Status:** **`READY WITH CONDITIONS`**

---

## 2. Current Finance/Billing State

| Layer | Implementation State | Production Readiness |
|---|---|:---:|
| **Constitutional Specs** | `FINANCE_SPECIFICATION.md` (Sealed v2.0.0), `FINANCE_IMPLEMENTATION_PLAN.md`, `BUSINESS_RULES.md` (BR-400 to BR-461) | 🟢 Complete |
| **Domain Layer** | `Bill.ts`, `LedgerEntry.ts`, `Payment.ts`, `Settlement.ts`, `AccountType.ts`, `StayBalance.ts` | 🟢 Complete |
| **Domain Rules** | `DoubleEntryValidation.ts`, `DuplicateRentPrevention.ts`, `PaymentAllocationRule.ts`, `OutstandingBalanceRule.ts`, `SettlementValidation.ts` | 🟢 Complete |
| **Application Services** | `ledgerService.ts`, `balanceEngine.ts`, `billingService.ts`, `paymentService.ts`, `settlementService.ts`, `reportingService.ts`, `timelineService.ts`, `FinanceWorkspaceCoordinator.ts` | 🟡 Substantially Scaffolded |
| **Infrastructure** | `InMemoryFinanceRepository.ts`, `financeStorage.ts` (`localStorage` keys: `rpgms_ledger_entries`, `rpgms_bills`, `rpgms_payments`, `rpgms_settlements`) | 🟡 In-Memory Functional |
| **User Interface** | `FinanceWorkspacePage.tsx`, `ResidentFinancialProfile.tsx`, `FinancialSummaryCard.tsx`, `GenerateRentModal.tsx`, `ReceivePaymentModal.tsx`, `AddLaundryModal.tsx`, `ResidentLedgerModal.tsx` | 🟡 Draft Components |
| **Automated Testing** | Unit/Integration Test Suite (`src/features/finance/__tests__/`) | 🔴 Not Implemented (0 Tests) |

---

## 3. Governing Business Rules

The Finance architecture is governed strictly by the following non-negotiable business rules:

1. **BR-400 Commercial Agreement**: Every Stay operates under exactly one active Commercial Agreement defining Monthly Rent, Security Deposit, and Billing Anniversary date.
2. **BR-410 Charge & Payment Ownership**: Every Charge, Bill, and Payment belongs to exactly one `Stay` (`stayId`). They never belong directly to a `Resident` identity.
3. **BR-421 Payment Recording & Immutability**: Payments represent physical currency or digital transfers received. Payments are immutable and cannot be physically deleted or edited.
4. **BR-431 Derived Outstanding Balance**: Outstanding receivable balances are derived dynamically by subtracting allocated settlements/payments from total ledger debits. Stored balance fields are prohibited.
5. **BR-440 Unified Stay Ledger**: The ledger is the single source of truth for all monetary activity associated with a Stay.
6. **BR-442 Ledger Immutability**: Ledger entries are append-only. Corrections are processed exclusively through explicit reversing entries (`REVERSAL` reference type).
7. **BR-450 Deposit Account Separation**: Security Deposits are held in an independent liability account (`SECURITY_DEPOSIT_LIABILITY`) and are not merged into operating rent revenue.
8. **BR-460 Independent Settlement & Checkout**: Operational checkout (releasing the bed) and Financial Closure are separate events. A checked-out stay remains in `Settlement Pending` state until all post-checkout obligations (electricity adjustments, damage recovery) reach zero balance.

---

## 4. Existing Domain Model

The existing domain model in `src/features/finance/domain/` establishes 8 core financial accounts:

```typescript
export const AccountType = {
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',               // Asset: Owed by Stay
  RENT_REVENUE: 'RENT_REVENUE',                             // Income: Billed Rent Revenue
  CASH: 'CASH',                                             // Asset: Liquid Cash
  BANK: 'BANK',                                             // Asset: Liquid Digital Payments
  SECURITY_DEPOSIT_LIABILITY: 'SECURITY_DEPOSIT_LIABILITY', // Liability: Held Refundable Deposit
  ADVANCE_CREDIT: 'ADVANCE_CREDIT',                         // Liability: Pre-payments / Overpayments
  DAMAGE_RECOVERY: 'DAMAGE_RECOVERY',                       // Income/Offset: Deductions for damage
  REFUND_PAYABLE: 'REFUND_PAYABLE',                         // Liability: Final net refund owed at checkout
} as const;
```

### Core Entities:
- **`LedgerEntry`**: Atomic double-entry posting (`stayId`, `postingDate`, `effectiveDate`, `referenceType`, `referenceId`, `account`, `debit`, `credit`, `remarks`).
- **`Bill`**: Obligation document for monthly rent, recurring charges, or one-time charges (`billNumber`, `stayId`, `issueDate`, `dueDate`, `totalAmount`, `status`, `lineItems`).
- **`Payment`**: Money receipt record (`paymentNumber`, `stayId`, `amount`, `paymentDate`, `paymentMethod`, `referenceNumber`, `status`).
- **`Settlement`**: Checkout settlement record (`settlementNumber`, `stayId`, `settlementDate`, `finalAmount`, `outcome`, `previewSnapshot`).

---

## 5. Existing Application Layer

The application layer (`src/features/finance/services/`) consists of 7 application services:

1. **`LedgerApplicationService` (`ledgerService.ts`)**: Single entry point for ledger write postings. Validates double-entry balance equality and handles document reversal posting (`reverseEntries`).
2. **`BalanceApplicationService` (`balanceEngine.ts`)**: Calculates account totals and derives `StayBalance` metrics on demand.
3. **`BillingApplicationService` (`billingService.ts`)**: Manages rent bill generation and duplicate billing prevention.
4. **`PaymentApplicationService` (`paymentService.ts`)**: Records payments and allocates funds to open bills or `ADVANCE_CREDIT`.
5. **`SettlementApplicationService` (`settlementService.ts`)**: Executes read-only Stage 1 settlement previews (`generateSettlementPreview`) and Stage 2 settlement commitments (`confirmSettlement`).
6. **`ReportingApplicationService` (`reportingService.ts`)**: Compiles property-wide metrics, outstanding dues lists, and collection summaries.
7. **`TimelineApplicationService` (`timelineService.ts`)**: Projects chronological financial timeline events for operator review.

---

## 6. Existing Infrastructure/Persistence

Currently, persistence is implemented via:
- **`InMemoryFinanceRepository.ts`**: Implements `FinanceRepository` storing arrays of `LedgerEntry`, `Bill`, `Payment`, and `Settlement`.
- **`financeStorage.ts`**: Synchronizes in-memory state with browser `localStorage` using keys:
  - `rpgms_ledger_entries`
  - `rpgms_bills`
  - `rpgms_payments`
  - `rpgms_settlements`

### Architectural Issues Identified:
- `settlementService.ts` currently instantiates `new InMemoryStayRepository()` directly within method calls rather than receiving `StayRepository` via constructor dependency injection.

---

## 7. Existing Finance UI

The UI layer (`src/features/finance/`) includes:
- **`FinanceWorkspacePage.tsx`**: Property-wide financial dashboard featuring:
  - Financial summary cards (Receivables, Monthly Billing, Collections, Pending Settlements).
  - Chronological financial activity stream.
  - Outstanding dues table.
  - Completed checkout settlements report table.
- **`ResidentFinancialProfile.tsx`**: Resident workspace tab rendering current balances, open bills, payment history, and action buttons.
- **Modal Dialogs**: `ReceivePaymentModal.tsx`, `GenerateRentModal.tsx`, `AddLaundryModal.tsx`, `ResidentLedgerModal.tsx`.

---

## 8. Legacy RPGMS 1.0 Reconciliation

| RPGMS 1.0 Concept | RPGMS 2.0 Architectural Mapping | Rationale |
|---|---|---|
| **Google Sheet Rows / Signed Balances** | **Immutable Double-Entry Ledger** | Replaced mutable single-entry row edits with append-only debits and credits. |
| **Resident-Centric Ledger** | **Stay-Centric Ledger (`stayId`)** | Prevents financial leakage when a resident checks out and re-admits later under a new stay. |
| **Manual Cash Tracking** | **`CASH` & `BANK` Financial Accounts** | Distinguishes physical cash receipts from digital bank transfers for audit reconciliation. |
| **Informal Security Deposit Notes** | **`SECURITY_DEPOSIT_LIABILITY` Account** | Tracks held deposits as formal accounting liabilities separate from rent revenue. |
| **Combined Checkout & Final Settlement** | **Independent Checkout vs Financial Closure** | Accommodates post-checkout utility bills and delayed damage assessments cleanly. |

---

## 9. Architectural Ownership

```text
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Resident Domain  │       │   Stay Domain    │       │  Finance Domain  │
│  (Identity Owner)│──────►│ (Operational)    │──────►│ (Financial Owner)│
└──────────────────┘       └──────────────────┘       └──────────────────┘
  • Identity Truth           • Operational Truth        • Financial Truth
  • Permanent Record         • Bed Allocation           • Double-Entry Ledger
  • Document Records         • Check-in / Checkout      • Bills & Payments
                             • Commercial Terms         • Derived Balances
```

- **Finance owns money**: Bills, Payments, Settlements, Ledger Entries, and derived balances belong strictly to Finance.
- **Other modules interact via Domain Events**: Admission, Checkout, Bed Change, or Electricity readings emit domain events; Finance processes these events and posts corresponding ledger entries.

---

## 10. Proposed Finance Architecture

The target architecture enforces a 4-layer execution pipeline for every financial transaction:

```text
1. Business Event (e.g. Admission Confirmed / Rent Billed)
         │
         ▼
2. Business Transaction (Bill / Payment / Settlement Document created)
         │
         ▼
3. Settlement Allocation (Value mapped from Source Account to Target Account)
         │
         ▼
4. Ledger Entry Posting (Single Entry Point: ledgerService.postEntries)
```

---

## 11. Ledger / Transaction / Payment Model

Every transaction adheres strictly to double-entry accounting posting rules:

1. **Monthly Rent Billing**:
   - Debit: `ACCOUNTS_RECEIVABLE` (+)
   - Credit: `RENT_REVENUE` (+)
2. **Rent Payment Received**:
   - Debit: `CASH` or `BANK` (+)
   - Credit: `ACCOUNTS_RECEIVABLE` (-)
3. **Security Deposit Collection**:
   - Debit: `CASH` or `BANK` (+)
   - Credit: `SECURITY_DEPOSIT_LIABILITY` (+)
4. **Advance Payment (Overpayment)**:
   - Debit: `CASH` or `BANK` (+)
   - Credit: `ADVANCE_CREDIT` (+)
5. **Checkout Settlement (Deposit Refund)**:
   - Debit: `SECURITY_DEPOSIT_LIABILITY` (-)
   - Credit: `BANK` or `CASH` (-)
6. **Checkout Settlement (Damage Deduction)**:
   - Debit: `SECURITY_DEPOSIT_LIABILITY` (-)
   - Credit: `DAMAGE_RECOVERY` (+)

---

## 12. Billing Engine Assessment

- **Existing Logic**: `billingService.ts` implements rent bill generation, period tag indexing (`RENT-2026-08-STAY123`), and duplicate billing prevention.
- **Reusability**: Highly reusable and well-structured.
- **Discrepancy Resolution**: `FINANCE_IMPLEMENTATION_PLAN.md` mentions mid-month pro-ration math (`prorationCalculator.ts`). However, constitutional rules (`BUSINESS_RULES.md` BR-400) enforce anniversary-date billing. `billingService.ts` must generate full-period bills based on the Stay's billing anniversary date.

---

## 13. Immutability & Audit Rules

1. Ledger records are append-only (`rpgms_ledger_entries`). Update and Delete operations are strictly forbidden.
2. Corrections generate explicit reversing entries (`REVERSAL` reference type) referencing the original entry ID.
3. Audit metadata (`createdBy`, `createdAt`, `postingDate`, `effectiveDate`, `remarks`) is required for every entry.

---

## 14. Resident Lifecycle Interaction

- **Admission**: Confirming an admission creates the `Stay` and triggers initial ledger postings (Opening Deposit Liability + First Rent Bill).
- **Active Stay**: Monthly billing runs generate recurring rent bills; payments adjust receivables.
- **Notice Period**: Stay status transitions to `ON_NOTICE`; recurring billing continues normally.
- **Checkout**: Releases accommodation; Stay transitions to `CHECKED_OUT`; financial lifecycle transitions to `Settlement Pending`.
- **Financial Closure**: Once net settlement amount and post-checkout hold accounts reach 0 balance, Stay transitions to `Financially Closed`.

---

## 15. Accommodation Interaction

- Accommodation defines physical areas, flats, beds, and default rent/deposit values.
- Rent changes resulting from bed transfers create new `CommercialAgreement` amendments on `Stay`.
- Accommodation never performs financial calculations directly.

---

## 16. Electricity/Laundry Interaction

- **Electricity Domain**: Computes meter reading differences and per-bed consumption shares, then emits an `ElectricityChargeGenerated` event. Finance creates a `Bill` (`ONE_TIME_CHARGE`) and posts `ACCOUNTS_RECEIVABLE` Debit.
- **Laundry Domain**: Records laundry usage events. Finance creates a `Bill` line item for recovery.

---

## 17. Supabase/PostgreSQL Readiness

The Finance architecture is 100% compatible with PostgreSQL:
- `rpgms_ledger_entries` table maps cleanly to PostgreSQL with append-only RLS policies (`GRANT INSERT, SELECT; REVOKE UPDATE, DELETE`).
- Idempotency keys (`referenceType` + `referenceId`) prevent duplicate postings during network retries.
- Dynamic balances are computed using standard SQL `SUM(debit) - SUM(credit)` aggregations or indexed materialized views.

---

## 18. Identified Gaps

1. **Zero Automated Tests**: `src/features/finance/` currently has `0` Vitest test files.
2. **Missing Repository Injection**: `settlementService.ts` instantiates `new InMemoryStayRepository()` internally instead of using constructor dependency injection.
3. **Admission-to-Finance Event Disconnect**: `AdmissionCoordinator` (CR-2) does not post opening deposit/rent entries into `ledgerService`.
4. **Documentation Version Mismatch**: `CAPABILITY_REGISTER.md` uses outdated CR numbering.

---

## 19. Risks

1. **Data Corruption Risk**: Without automated tests, manual modifications could break double-entry invariants.
2. **Repository Isolation Risk**: Direct instantiation of `InMemoryStayRepository` inside services creates isolated data stores during testing.

---

## 20. Decisions Requiring Approval

1. **Approval of CR-3 Release Framing**: Confirm `CR-3 — Financial Operations` as the single active capability release replacing legacy CR-5/6/7 indexing in `CAPABILITY_REGISTER.md`.
2. **Approval of Billing Rule**: Confirm anniversary-date billing without mid-month pro-ration.
3. **Approval of Sprint FR-1 Plan**: Authorize starting **FR-1 — Finance Core & Test Stabilization**.

---

## 21. Proposed CR-3 Scope

- **Finance Workspace & Dashboard**: Property-wide financial metrics and resident dues overview.
- **Immutable Double-Entry Ledger Core**: Append-only transaction logging and reversal posting.
- **Dynamic Balance Engine**: On-demand calculation of Receivables, Deposit Liabilities, and Advance Credits.
- **Rent & Charge Billing Engine**: Recurring rent billing, manual charges, and duplicate billing prevention.
- **Payment Collection & Allocation**: Cash/Bank receipts, bill allocation, and advance handling.
- **Checkout Settlement & Deposit Refunds**: Two-stage checkout settlement and deposit refund processing.

---

## 22. Recommended Implementation Sequence

```text
Sprint FR-1: Finance Core & Test Stabilization (Ledger, Balance Engine, Repository Injection, Unit Tests)
   ↓
Sprint FR-2: Admission & Rent Billing Integration (Admission Hook, Rent Bill Engine, Duplicate Prevention)
   ↓
Sprint FR-3: Payment Processing & Advance Handling (Payment Receipt, Bill Allocation, Overpayment)
   ↓
Sprint FR-4: Checkout Settlement & Deposit Engine (Settlement Preview, Deposit Refund, Financial Closure)
   ↓
Sprint FR-5: UI Integration & Dashboard Metrics (Finance Page, Resident Profile Tab, Reports)
```

---

## 23. Test Strategy

1. **Domain Unit Tests**: Test `DoubleEntryValidation`, `PaymentAllocationRule`, `OutstandingBalanceRule`, `SettlementValidation`.
2. **Service Integration Tests**: Test `ledgerService.postEntries()`, `reverseEntries()`, `balanceEngine.calculateStayBalances()`, `billingService`, `paymentService`, `settlementService`.
3. **Target**: 100% test pass rate across all finance services before UI deployment.

---

## 24. Documentation Updates Required

1. Update `CAPABILITY_REGISTER.md` to reflect CR-2 Completion and CR-3 Financial Operations as active.
2. Update `MODULE_STATUS.md` to mark CR-2 as Completed and CR-3 as In Progress.

---

## FR-0 STATUS: `READY WITH CONDITIONS`

### Conditions to fulfill prior to writing CR-3 feature code:
1. Reconcile `CAPABILITY_REGISTER.md` and `MODULE_STATUS.md` documentation versioning.
2. Refactor `settlementService.ts` to use constructor dependency injection for `StayRepository`.
3. Execute **Sprint FR-1** to build comprehensive Vitest unit test coverage for `src/features/finance/`.

---

## Session Summary

1. **Files Inspected**:
   - `README.md`, `ROADMAP.md`, `PROJECT_RULES.md`, `CAPABILITY_REGISTER.md`, `MODULE_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/BUSINESS_RULES.md`, `docs/BUSINESS_CONSTITUTION.md`
   - `docs/finance/FINANCE_SPECIFICATION.md`, `FINANCE_IMPLEMENTATION_PLAN.md`, `FINANCIAL_POLICIES.md`, `FINANCIAL_TRANSACTION_TYPES.md`
   - `src/features/finance/domain/` (entities, rules, valueObjects)
   - `src/features/finance/services/` (`ledgerService`, `balanceEngine`, `billingService`, `paymentService`, `settlementService`)
   - `src/features/finance/components/` and `src/features/finance/pages/FinanceWorkspacePage.tsx`
2. **Files Created**:
   - `docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md`
3. **Files Modified**:
   - **`0` production source code files modified.**
4. **Confirmation**:
   - **CONFIRMED**: Zero production source code files were created, edited, or modified.
5. **Git Status**:
   - Branch: `feature/application-shell` (clean, synchronized with `origin/feature/application-shell`).
6. **Tests / Typecheck / Build Executed**:
   - Not executed (read-only architecture planning session).
7. **Recommended Next Step**:
   - Review and approve `docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md` report and authorize **Sprint FR-1 (Finance Core & Test Stabilization)**.
