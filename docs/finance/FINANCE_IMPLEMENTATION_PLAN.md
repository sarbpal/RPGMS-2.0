# Finance Module Implementation Plan (Blueprint)

**Project:** RPGMS 2.0  
**Milestone:** Phase 1 – Finance Domain Scaffolding & Implementation  
**Document:** `docs/finance/FINANCE_IMPLEMENTATION_PLAN.md`  
**Status:** Planning / Refined Blueprint  
**Last Updated:** 22 July 2026  

---

## 1. Purpose

The objective of this implementation plan is to establish a comprehensive, production-grade **Finance Module** for RPGMS 2.0 that strictly adheres to `FINANCE_SPECIFICATION.md` (Version 2.0.0, Sealed).

The Finance module provides a deterministic, auditable, and immutable financial subsystem for managing rent billing, payment processing, security deposit tracking, checkout settlements, and financial ledger accounts.

### Governance Alignment
- **Canonical Specification**: Implements the architecture defined in `FINANCE_SPECIFICATION.md`.
- **Financial Boundary**: Bounded strictly to the **`Stay`** entity (`Stay is the Financial Boundary`).
- **Single Source of Truth**: All financial balances (Receivable, Deposit Held, Advance Credit) are dynamically **derived** from an immutable financial ledger rather than stored as mutable state.
- **Audit Integrity**: Financial records are append-only. Corrections are processed exclusively through reversing entries.

---

## 2. Accounting Principles

The Finance domain adheres strictly to the following fundamental accounting principles:

1. **Immutable Ledger**: All financial transactions are written to an append-only ledger (`rpgms_ledger_entries`).
2. **No Updates or Deletes**: Ledger records are immutable. Modifying or deleting an existing entry is strictly prohibited at both code and storage levels.
3. **Reversal Entries**: Corrections, cancellations, or voids are executed exclusively by posting explicit reversing entries (`REVERSAL` reference type) that negate prior entries.
4. **Derived Balances**: Financial balances (Receivable, Deposit Held, Advance Credit) are derived dynamically on demand by aggregating ledger entries, never stored as mutable columns.
5. **Event-Driven Financial Documents**: Source documents (`Bill`, `Payment`, `Settlement`) act as business triggers that emit ledger postings. Documents do not store independent balance truth.
6. **Derived Reporting**: Management, operational, and audit reports derive all metrics directly from the single ledger source of truth.

---

## 3. Financial Accounts

The system establishes eight core financial accounts. Every monetary movement must impact at least one of these accounts:

| Account Name | Account Type | Purpose & Description |
|---|---|---|
| **`ACCOUNTS_RECEIVABLE`** | Asset | Tracks unpaid rent, utility, or damage charges owed by a Stay. |
| **`RENT_REVENUE`** | Income | Recognizes earned rent revenue generated upon bill finalization. |
| **`CASH`** | Asset | Tracks physical currency payments received for rent or deposits. |
| **`BANK`** | Asset | Tracks digital payments (UPI, NEFT, IMPS, Card) received. |
| **`SECURITY_DEPOSIT_LIABILITY`** | Liability | Tracks refundable security deposits collected and held by the property manager. |
| **`ADVANCE_CREDIT`** | Liability | Tracks unallocated overpayments or pre-payments made by a Stay. |
| **`DAMAGE_RECOVERY`** | Income / Offset | Recognizes deposit deductions for physical property damage or penalties. |
| **`REFUND_PAYABLE`** | Liability / Clearing | Tracks finalized net deposit refund payouts owed to a resident at checkout. |

---

## 4. Double-Entry Posting Rules

The following deterministic posting rules govern every financial event in the system:

### 1. Monthly Rent Bill Generation
- **Debit**: `ACCOUNTS_RECEIVABLE` (+) [Increases amount owed by Stay]
- **Credit**: `RENT_REVENUE` (+) [Recognizes earned rent income]

### 2. Rent Payment Received (Cash or Bank)
- **Debit**: `CASH` or `BANK` (+) [Increases property liquid assets]
- **Credit**: `ACCOUNTS_RECEIVABLE` (-) [Decreases outstanding rent owed]

### 3. Security Deposit Collection
- **Debit**: `CASH` or `BANK` (+) [Increases liquid assets]
- **Credit**: `SECURITY_DEPOSIT_LIABILITY` (+) [Increases deposit liability held]

### 4. Advance Payment (Overpayment)
- **Debit**: `CASH` or `BANK` (+) [Increases liquid assets]
- **Credit**: `ADVANCE_CREDIT` (+) [Increases advance credit liability]

### 5. Deposit Refund at Checkout
- **Debit**: `SECURITY_DEPOSIT_LIABILITY` (-) [Reduces deposit liability held]
- **Credit**: `CASH` or `BANK` (-) (or `REFUND_PAYABLE`) [Decreases liquid assets]

### 6. Checkout Adjustment (Damage Deduction from Deposit)
- **Debit**: `SECURITY_DEPOSIT_LIABILITY` (-) [Reduces deposit liability held]
- **Credit**: `DAMAGE_RECOVERY` (+) [Recognizes damage recovery income]  
  *(Note: If deposit deduction covers unpaid rent, Credit goes to `ACCOUNTS_RECEIVABLE` (-)).*

---

## 5. Expanded LedgerEntry Definition

The `LedgerEntry` interface is the single atomic record of financial truth:

```typescript
export const AccountType = {
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
  RENT_REVENUE: 'RENT_REVENUE',
  CASH: 'CASH',
  BANK: 'BANK',
  SECURITY_DEPOSIT_LIABILITY: 'SECURITY_DEPOSIT_LIABILITY',
  ADVANCE_CREDIT: 'ADVANCE_CREDIT',
  DAMAGE_RECOVERY: 'DAMAGE_RECOVERY',
  REFUND_PAYABLE: 'REFUND_PAYABLE',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export const LedgerReferenceType = {
  BILL: 'BILL',
  PAYMENT: 'PAYMENT',
  SETTLEMENT: 'SETTLEMENT',
  REVERSAL: 'REVERSAL',
} as const;

export type LedgerReferenceType = typeof LedgerReferenceType[keyof typeof LedgerReferenceType];

export interface LedgerEntry {
  id: string;                // Unique immutable ID (e.g. 'led_xxx')
  stayId: string;            // Parent Stay reference ('stay_xxx')
  postingDate: string;       // Accounting posting date (YYYY-MM-DD)
  effectiveDate: string;     // Financial value/accrual date (YYYY-MM-DD)
  referenceType: LedgerReferenceType; // Trigger document type
  referenceId: string;       // Source document ID (billId, paymentId, settlementId)
  account: AccountType;      // Target financial account
  debit: number;             // Debit amount (>= 0; 0 if credit)
  credit: number;            // Credit amount (>= 0; 0 if debit)
  remarks: string;           // Audit narrative / memo
  createdBy: string;         // System component or operator user ID
  createdAt: string;         // Immutable ISO creation timestamp
}
```

### Rationale for Fields
- `id`: Ensures unique record addressability.
- `stayId`: Enforces `Stay` as the financial boundary.
- `postingDate` vs `effectiveDate`: Distinguishes accounting entry timestamp from value/accrual date.
- `referenceType` & `referenceId`: Provides complete bi-directional audit traceability back to source documents.
- `debit` & `credit`: Enforces double-entry precision without signed number ambiguity.

---

## 6. Target Architecture & Component Dependency Diagram

Only `ledgerService` writes entry records to `rpgms_ledger_entries`. All upstream business services invoke `ledgerService.postEntry()` as the **Single Entry Point for Ledger Writes**.

```text
               ┌──────────────────────────────────────────────┐
               │                 Stay Domain                  │
               │         (Financial Boundary Owner)           │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │                Finance Module                │
               └───────┬──────────────┬──────────────┬────────┘
                       │              │              │
                       ▼              ▼              ▼
                ┌────────────┐ ┌────────────┐ ┌────────────┐
                │  Billing   │ │  Payment   │ │ Settlement │
                │  Service   │ │  Service   │ │  Service   │
                └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
                       │              │              │
                       └──────────────┼──────────────┘
                                      │ (Single Entry Point for Writes)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │                Ledger Service                │
               │   (Enforces Immutability & Validations)      │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │            rpgms_ledger_entries              │
               │        (Immutable Ledger Core Store)         │
               └──────────────────────┬───────────────────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
       ┌──────────────────────────────┐ ┌───────────────────────────┐
       │        Balance Engine        │ │ Financial Timeline Engine │
       │ (Dynamic Balance Derivations)│ │  (Audit Stream & History) │
       └──────────────────────────────┘ └───────────────────────────┘
```

---

## 7. Implementation Order

Implementation proceeds strictly from the **Core Storage & Data Layer** upwards to the **User Interface & Reports**:

```text
Step 1: Domain Foundation & Types (F1)
   ↓
Step 2: Ledger Core (Append-only storage & validation) (F2)
   ↓
Step 3: Balance Engine (Dynamic balance derivations) (F3)
   ↓
Step 4: Billing Engine (Bill generation & pro-ration) (F4)
   ↓
Step 5: Payment Engine (Payment recording & allocation) (F5)
   ↓
Step 6: Settlement Engine (Checkout settlement & deposit refund) (F6)
   ↓
Step 7: Timeline & Hooks Layer (F7)
   ↓
Step 8: UI Integration (Workspaces, profile tab, payment dialogs) (F8)
   ↓
Step 9: Reports, Verification & Stabilization (F9)
```

---

## 8. Refined Sprint Breakdown

### Sprint F0: Planning & Blueprint Architecture
- **Objective**: Create initial `docs/finance/FINANCE_IMPLEMENTATION_PLAN.md`.
- **Status**: Completed.

### Sprint F0.1: Blueprint Refinement (CURRENT)
- **Objective**: Refine blueprint with Ledger/Balance separation, Financial Accounts, Posting Rules, and Dependency Diagram.
- **Status**: Active / Refined.

### Sprint F1: Domain Foundation & Type Definitions
- **Objective**: Establish Finance domain folder structure and core interfaces.
- **Deliverables**:
  - `src/features/finance/types/index.ts` (`LedgerEntry`, `Bill`, `Payment`, `Settlement`, `AccountType`, `LedgerReferenceType`).
  - Storage keys definition (`rpgms_ledger_entries`, `rpgms_bills`, `rpgms_payments`, `rpgms_settlements`).
  - Feature barrel export `src/features/finance/index.ts`.

### Sprint F2: Ledger Core
- **Objective**: Build append-only ledger storage, entry posting validation, and immutability guards.
- **Deliverables**:
  - `src/features/finance/services/ledgerService.ts`: `postLedgerEntry()`, `getLedgerEntriesByStayId()`.
  - Immutability guards preventing updates or deletions of existing ledger entries.

### Sprint F3: Balance Engine
- **Objective**: Separate Balance Engine from Ledger Core to compute dynamic balances on demand.
- **Deliverables**:
  - `src/features/finance/services/balanceEngine.ts`: `calculateStayBalances(stayId)` deriving Receivable Balance, Security Deposit Held, and Advance Credit Balance.
  - Pure unit math calculations.

### Sprint F4: Billing Engine
- **Objective**: Build rent bill generation, pro-ration algorithms, and bill status tracking.
- **Deliverables**:
  - `src/features/finance/services/billingService.ts`: `createBill()`, `generateMonthlyRentBills()`, `calculateProratedRent()`.
  - Automated ledger postings (`RECEIVABLE` Debit / `RENT_REVENUE` Credit) via `ledgerService`.

### Sprint F5: Payment Processing Engine
- **Objective**: Build payment recording, multi-bill allocation, and overpayment handling.
- **Deliverables**:
  - `src/features/finance/services/paymentService.ts`: `recordPayment()`, `allocatePaymentToBills()`.
  - Automated ledger postings (`CASH`/`BANK` Debit, `RECEIVABLE` Credit / `ADVANCE_CREDIT` Credit) via `ledgerService`.

### Sprint F6: Settlement & Deposit Engine
- **Objective**: Build security deposit collection, damage deduction, and final checkout settlement logic.
- **Deliverables**:
  - `src/features/finance/services/settlementService.ts`: `recordDepositCollection()`, `processCheckoutSettlement()`.
  - Ledger postings for deposit holding, damage recovery deductions, and refund settlements via `ledgerService`.

### Sprint F7: Timeline & Custom Hooks Layer
- **Objective**: Create presentation-facing React hooks for financial state management.
- **Deliverables**:
  - `src/features/finance/hooks/useStayFinance.ts`: Fetches balances, open bills, payment history, and timeline for a Stay.
  - `src/features/finance/hooks/useFinanceSummary.ts`: Aggregates property-wide financial metrics for Dashboard.

### Sprint F8: UI Integration & Workspaces
- **Objective**: Build UI components and integrate financial tabs into Resident Profile and Navigation.
- **Deliverables**:
  - `src/features/finance/components/`: `FinancialSummaryCard`, `BillsTable`, `PaymentHistoryTable`, `RecordPaymentDialog`, `SettlementDialog`.
  - `src/features/finance/pages/FinancePage.tsx`: Main property-wide Finance workspace page.
  - Resident Profile page integration (Financial Tab / Section).

### Sprint F9: Reports, Verification & Stabilization
- **Objective**: Connect dynamic reports, Dashboard metrics, audit transaction concurrency, and lock documentation.
- **Deliverables**:
  - Dashboard metrics connection (Outstanding Dues, Monthly Collection, Deposit Liabilities).
  - Financial summary report views.
  - `npm run build` verification.
  - Updated `MODULE_STATUS.md`, `SESSION.md`, `CHANGELOG.md`.

---

## 9. New Files

The following files will be created under `src/features/finance/`:

```text
src/features/finance/
├── types/
│   └── index.ts                 # Financial domain interfaces & enums
├── services/
│   ├── ledgerService.ts         # Append-only ledger storage & posting entry point
│   ├── balanceEngine.ts         # Dynamic balance calculation engine
│   ├── billingService.ts        # Bill generation & pro-ration algorithms
│   ├── paymentService.ts        # Payment recording & allocation logic
│   └── settlementService.ts     # Checkout settlement & deposit refund engine
├── hooks/
│   ├── useStayFinance.ts        # Hook for single Stay financial workspace
│   └── useFinanceSummary.ts     # Hook for property-wide financial stats
├── components/
│   ├── FinancialSummaryCard.tsx # Visual summary of Receivable, Deposit, Credit
│   ├── BillsTable.tsx           # Table displaying bills & status chips
│   ├── PaymentHistoryTable.tsx  # Table displaying recorded payments
│   ├── RecordPaymentDialog.tsx  # Dialog for recording cash/UPI payments
│   └── SettlementDialog.tsx     # Dialog for processing checkout settlements
├── pages/
│   └── FinancePage.tsx          # Main property-wide Finance workspace page
├── utils/
│   ├── currencyFormatters.ts    # INR formatting helpers (e.g. ₹12,500)
│   └── prorationCalculator.ts   # Pro-rated rent calculation utilities
└── index.ts                     # Feature barrel export file
```

---

## 10. Existing Files Expected to Change

| File | Reason for Change |
|---|---|
| `src/app/router.tsx` | Register `/finance` route pointing to `FinancePage`. |
| `src/features/residents/pages/ResidentProfilePage.tsx` | Add financial summary card / tab displaying Stay balances and payment history. |
| `src/features/residents/components/ResidentOnboardingWizard.tsx` | Trigger initial Security Deposit & First Month Rent bill generation upon onboarding submission. |
| `src/features/dashboard/pages/DashboardPage.tsx` | Connect Dashboard summary cards to real dynamic financial metrics from `useFinanceSummary`. |
| `docs/MODULE_STATUS.md` | Update Finance module status to reflect sprint progress. |
| `SESSION.md` & `CHANGELOG.md` | Document completion of Finance sprints. |

---

## 11. Risks & Mitigation Strategies

| Risk | Severity | Mitigation Strategy |
|---|:---:|---|
| **Ledger Data Mutation / Corruption** | High | Enforce immutable append-only operations in `ledgerService.ts`. Throw explicit runtime errors if an edit/delete operation is attempted. |
| **Partial Transaction Failure** | High | Wrap multi-entity updates (e.g., Payment recording + Ledger posting + Bill status update) inside atomic service methods with rollback error handling. |
| **Incorrect Pro-ration Calculations** | Medium | Isolate pro-ration math in pure, unit-tested utility functions (`prorationCalculator.ts`). |
| **Duplicate Bill Generation** | Medium | Maintain unique bill period indexes (e.g., `RENT-2026-07-STAY123`) to prevent double-billing for the same month. |
| **Out-of-Sync Derived Balances** | Low | Never store balances in `localStorage`. Derive balances on demand directly from `LedgerEntry` arrays using `balanceEngine.ts`. |

---

## 12. Migration Strategy

### Storage Versioning & Keys
- Storage version metadata remains `rpgms_storage_version: 2`.
- Dedicated storage keys introduced:
  - `rpgms_ledger_entries`
  - `rpgms_bills`
  - `rpgms_payments`
  - `rpgms_settlements`

### Legacy Data Seeding / Compatibility
- Existing mock/migrated residents with active stays will have initial opening ledger entries generated automatically on first access (e.g., opening security deposit credit, initial month rent debit).
- Backward compatibility: If no financial records exist for a legacy `Stay`, `ledgerService` seeds an initial opening balance based on `stay.agreedRent` and `stay.agreedDeposit`.

---

## 13. Testing & Verification Strategy

Every sub-sprint will be verified using the following protocols:

1. **Deterministic Unit Math Verification**:
   - Verify that `sum(DEBIT) - sum(CREDIT) == Receivable Balance` for all test cases.
   - Verify pro-rated rent calculations for partial months (e.g., check-in on 15th of a 30-day month = exactly 50% rent).
2. **Manual Transaction Testing**:
   - Onboard new resident -> verify initial bill and deposit entry created.
   - Record payment -> verify bill status updates to `PAID` and receivable balance decreases.
   - Record overpayment -> verify advance credit balance increases.
3. **Build & Type Verification**:
   - Run `npm run build` (`tsc -b && vite build`) after every sprint.
   - Zero TypeScript or lint errors allowed.

---

## 14. Out of Scope for Phase 1

The following capabilities are explicitly **OUT OF SCOPE** for Phase 1 Finance implementation:

- GST / Tax calculation engines
- Tax Deducted at Source (TDS) compliance
- Automated online payment gateway integration (Razorpay, Paytm, Stripe)
- Accounting software exports (Tally XML, Zoho Books CSV)
- Multi-currency support
- Automatic bank feed reconciliation

---

## 15. Definition of Done (Finance Version 1.0)

Phase 1 Finance implementation is considered **DONE** when:

1. [ ] **Ledger Core & Balance Engine**: Immutable double-entry ledger (`rpgms_ledger_entries`) records all monetary transactions reliably and derives balances on demand.
2. [ ] **Billing Engine**: Rent bills (initial pro-rated & monthly recurring) are generated and tracked accurately.
3. [ ] **Payment Engine**: Cash/UPI payments are recorded, allocated against bills, and reflected in receivables.
4. [ ] **Deposit & Settlement Engine**: Security deposit collection, damage deductions, and checkout settlements execute cleanly.
5. [ ] **UI Integration**: `/finance` page and `ResidentProfilePage` display live financial balances and payment controls.
6. [ ] **Reports & Dashboard Integration**: Dashboard summary cards display real-time financial metrics from ledger entries.
7. [ ] **Build Integrity**: `npm run build` completes with zero TypeScript or build errors.

---

*Blueprint refined and saved to `docs/finance/FINANCE_IMPLEMENTATION_PLAN.md`.*  
*Awaiting approval before starting Sprint F1 implementation.*
