# Sprint FR-2 — Admission & Rent Billing Integration Plan

> **Document Type:** Architectural & Implementation Plan  
> **Status:** Approved / Ready for Implementation  
> **Author:** Project Architect  
> **Date:** August 7, 2026  
> **Target Release:** Capability Release CR-3 (Financial Operations — Sprint FR-2)  

---

## Executive Summary

Sprint **FR-2 (Admission & Rent Billing Integration)** establishes the official domain hook connecting the **Admission** lifecycle (`AdmissionCoordinator`) with the **Finance** domain (`billingService`, `ledgerService`, `defaultFinanceRepository`). 

When an admission (either **Reservation Conversion** or **Walk-in Admission**) is committed, FR-2 ensures that:
1. **Initial Security Deposit Liability** is recorded on the resident ledger.
2. **First Month Rent Bill** (`MONTHLY_RENT`) is generated and posted to double-entry accounting.
3. **Reservation Token Adjustments** (`ADJUST_TO_SECURITY_DEPOSIT`, `ADJUST_TO_FIRST_RENT`, `LEAVE_PENDING`) are correctly reflected in initial financial postings.
4. **Transaction Atomicity & Compensating Rollback** guarantees that financial posting failures clean up created `Stay`, `Resident`, `Reservation`, and `Accommodation` changes cleanly without leaving partial operational or financial records.

---

## 1. Exact Admission Financial Trigger

### Trigger Location & Transaction Boundary
Financial initialization occurs **immediately after successful creation of Stay and Resident records** inside the `AdmissionCoordinator` confirmation pipeline, but **before returning the final `AdmissionResult` to the caller**.

```
[AdmissionCoordinator]
       │
       ├── 1. Evaluate Readiness & Snapshots
       ├── 2. Create / Reuse Resident Record
       ├── 3. Create Stay Aggregate (CommercialAgreement, BedAllocation, BusinessEvent)
       ├── 4. Update Reservation Status -> CONVERTED (if Reservation Admission)
       ├── 5. Update Bed Status -> OCCUPIED in Accommodation Aggregate
       │
       ▼
[AdmissionFinanceService.initializeAdmissionFinance(admissionResult)]
       │
       ├── A. Post Security Deposit Liability (Ledger: Debit ACCOUNTS_RECEIVABLE, Credit SECURITY_DEPOSIT_LIABILITY)
       ├── B. Create & Post Initial Rent Bill (Bill & Ledger: Debit ACCOUNTS_RECEIVABLE, Credit RENT_REVENUE)
       │
       ▼
   [Success?]
     ├── YES ──> Complete Transaction & Return AdmissionResult
     └── NO  ──> Trigger Compensating Rollback (Revert Stay, Resident, Reservation, Beds, & Ledger)
```

### Transaction Integrity Rationale
- **Why NOT before admission commitment?** Financial postings require a valid, persisted `stayId` and `residentId`. Attempting to bill before `Stay` creation violates relational identity invariants.
- **Why NOT asynchronous event queue?** RPGMS 2.0 MVP runs in a synchronous in-memory application architecture. Asynchronous event queues introduce eventual consistency windows where a resident could be checked in without an initial financial liability. Synchronous execution within the coordinator boundary guarantees strict consistency.

---

## 2. Initial Financial Postings

When an admission is committed, two distinct financial postings are created:

### A. Security Deposit Liability Posting
- **Purpose:** Establishes the hostel's liability to return or settle the security deposit upon checkout.
- **Account Mapping:**
  - **Debit:** `AccountType.ACCOUNTS_RECEIVABLE` (Amount = `adjustedDepositBalance`)
  - **Credit:** `AccountType.SECURITY_DEPOSIT_LIABILITY` (Amount = `adjustedDepositBalance`)
- **Reference Type:** `PAYMENT` or `BILL` (Reference ID: `stayId` or `dep_bill_id`)
- **Remarks:** `Security Deposit Liability - Admission Check-in`

### B. Initial Rent Bill (`MONTHLY_RENT`)
- **Purpose:** Issues the first month's rent invoice and recognizes rent revenue.
- **Entity:** Persisted `Bill` entity with `billType: 'MONTHLY_RENT'`, `status: 'UNPAID'`.
- **Period:** Issue month in `YYYY-MM` format (derived from `checkInDate`).
- **Account Mapping:**
  - **Debit:** `AccountType.ACCOUNTS_RECEIVABLE` (Amount = `adjustedRentBalance`)
  - **Credit:** `AccountType.RENT_REVENUE` (Amount = `adjustedRentBalance`)
- **Reference Type:** `BILL` (Reference ID: `bill.id`)
- **Remarks:** `Invoice #INV-YYYYMM-XXXX - Monthly Rent (Check-in)`

---

## 3. Reservation → Admission → Finance Lineage

To satisfy ADR-015 and domain traceability requirements, complete lineage identifiers are preserved across the pipeline:

| Domain | Entity | Lineage Fields / Identifiers |
|---|---|---|
| **Reservation** | `Reservation` | `id`, `reservationNumber`, `convertedResidentId`, `convertedStayId` |
| **Admission** | `AdmissionDraft` | `sourceType` (`RESERVATION` \| `WALK_IN`), `reservationId`, `tokenDisposition` |
| **Resident** | `Resident` | `id`, `residentCode` (`RESID-XXXXXX`) |
| **Stay** | `Stay` | `id` (`stay-XXXXXX`), `residentId`, `businessEvents[0].metadata` (`reservationId`, `reservationNumber` or `admissionSource: 'WALK_IN'`) |
| **Finance** | `Bill` & `LedgerEntry` | `stayId`, `referenceId`, `remarks` referencing `reservationNumber` or `residentCode` |

---

## 4. Transaction Atomicity & Compensating Rollback

RPGMS 2.0 uses an **in-memory repository architecture**. Because true database ACID transactions across separate repository singletons do not exist, atomicity is enforced using a **Compensating Rollback Strategy**.

### Failure Scenarios & Rollback Matrix

| Failure Scenario | Action Taken by `AdmissionCoordinator` |
|---|---|
| **A. Admission succeeds, Finance posting fails** | 1. Delete created `Bill` & `LedgerEntry` records.<br>2. Delete created `Stay` record from `StayRepository`.<br>3. Delete created `Resident` or revert reused `Resident` snapshot.<br>4. Revert `Reservation` status to `ACTIVE` with snapshot.<br>5. Revert `Bed` status to `VACANT` in `AccommodationRepository`.<br>6. Throw error to caller. |
| **B. Finance posting succeeds, later step fails** | Finance posting is the final step in `confirmAdmission`. If it fails, all preceding steps are rolled back synchronously. |
| **C. Partial financial posting (e.g. Deposit succeeds, Rent fails)** | `AdmissionFinanceService` wraps postings in a try-catch block. Any partial ledger entries are reversed via `ledgerService.reverseEntries()` before propagating the failure. |
| **D. Duplicate admission submission** | Idempotency guard rejects the request prior to initiating repository mutations. |

---

## 5. Idempotency & Duplicate Protection

To prevent duplicate financial charges, duplicate rent bills, or double security deposit postings:

1. **Rent Bill Invariant Guard:** `billingService.checkDuplicateMonthlyRentBill(stayId, period)` is evaluated prior to creating the rent bill. If a rent bill already exists for the `stayId` in that period, duplicate billing is blocked.
2. **Stay Financial Initialization Guard:** `AdmissionFinanceService` checks if any `BILL` or `SECURITY_DEPOSIT_LIABILITY` entries already exist for the `stayId`.
3. **Idempotent Key:** `stayId` serves as the primary business key across Stay, Finance, and Billing domains.

---

## 6. Rent Billing Rules

- **Joining-Date Based Billing:** The issue date of the initial rent bill matches `checkInDate`.
- **Billing Period:** Formatted as `YYYY-MM` extracted from `checkInDate`.
- **No-Proration Rule:** Standard RPGMS 2.0 policy bills full agreed rent for the initial month unless an explicit discount/adjustment is passed.
- **Due Date:** Defaults to 7 days from check-in (`checkInDate + 7 days`).
- **Future Check-in Dates:** Supported. Rent bill is issued with `issueDate = checkInDate`.

---

## 7. Token Handling Matrix

When a reservation has a `tokenAmount > 0`, the disposition selected during admission affects initial Finance postings as follows:

| Token Disposition | Security Deposit Posting | Rent Bill Posting (`MONTHLY_RENT`) | Token Ledger Posting |
|---|---|---|---|
| **`ADJUST_TO_SECURITY_DEPOSIT`** | `agreedDeposit - tokenAmount` | `agreedRent` | Token credited toward deposit balance. |
| **`ADJUST_TO_FIRST_RENT`** | `agreedDeposit` | `agreedRent - tokenAmount` | Token credited toward first month rent invoice. |
| **`LEAVE_PENDING`** | `agreedDeposit` | `agreedRent` | Token held as `ADVANCE_CREDIT` (Debit `BANK`/`CASH`, Credit `ADVANCE_CREDIT`). |
| **`WALK_IN` (No Token)** | `agreedDeposit` | `agreedRent` | N/A (`tokenAmount = 0`). |

---

## 8. Cross-Domain Architecture & Application Services

To prevent `AdmissionCoordinator` from becoming a monolithic "God-class", a new dedicated application service is introduced: **`AdmissionFinanceService`**.

```
                           ┌──────────────────────────┐
                           │   AdmissionCoordinator   │
                           └────────────┬─────────────┘
                                        │
                                        ▼ (on confirmation)
                           ┌──────────────────────────┐
                           │ AdmissionFinanceService  │
                           └─────┬──────────────┬─────┘
                                 │              │
                                 ▼              ▼
                       ┌────────────────┐ ┌───────────────┐
                       │ billingService │ │ ledgerService │
                       └────────────────┘ └───────────────┘
```

### Domain Responsibilities

- **`AdmissionCoordinator`**: Manages Admission readiness evaluation, Resident aggregate creation/reuse, Stay aggregate creation, Bed allocation, and orchestrates `AdmissionFinanceService`.
- **`AdmissionFinanceService`**: Dedicated application service responsible for translating `AdmissionResult` into Security Deposit postings and Rent Bills.
- **`billingService`**: Generates and persists `Bill` entities.
- **`ledgerService`**: Validates and posts balanced double-entry accounting records.

---

## 9. Existing Finance Services Reuse Analysis

| Service | Reuse Status | Reason |
|---|:---:|---|
| `ledgerService` | **REUSE** | Core double-entry posting engine. |
| `billingService` | **REUSE** | Bill creation and duplicate rent bill check. |
| `balanceEngine` | **REUSE** | Derives stay receivable and advance balances. |
| `settlementService` | **DO NOT REUSE** | `settlementService` is strictly for Checkout & Termination. Admission billing is an onboarding event. |

---

## 10. Accounting & Double-Entry Ledger Integrity

### Event 1: Initial Security Deposit Liability
- **Transaction Type:** `DEPOSIT_LIABILITY`
- **Debit Account:** `AccountType.ACCOUNTS_RECEIVABLE` (Amount: `adjustedDepositBalance`)
- **Credit Account:** `AccountType.SECURITY_DEPOSIT_LIABILITY` (Amount: `adjustedDepositBalance`)
- **Audit CreatedBy:** `ADMISSION_ENGINE`

### Event 2: Initial Rent Bill (`MONTHLY_RENT`)
- **Transaction Type:** `BILL`
- **Debit Account:** `AccountType.ACCOUNTS_RECEIVABLE` (Amount: `adjustedRentBalance`)
- **Credit Account:** `AccountType.RENT_REVENUE` (Amount: `adjustedRentBalance`)
- **Audit CreatedBy:** `BILLING_ENGINE`

---

## 11. Failure & Recovery Model

If any stage of the admission + finance pipeline fails, consistency is restored via the **Compensating Rollback Strategy**:

1. **Invalid Admission Data**: Caught during `evaluateReadiness()` prior to any repository mutation.
2. **Bed Occupied**: Blocked during `evaluateReadiness()`.
3. **Duplicate Resident**: Handled via `checkDuplicateResidentMobile()`. Active stay blocks; checked-out stay reuses resident.
4. **Finance Posting Failure**: `AdmissionCoordinator` catches error, deletes created `Stay` & `Resident`, restores `Reservation` & `Bed` snapshots, and throws exception.

---

## 12. Test Strategy

A comprehensive Vitest test suite will be created at:  
`src/features/admission/application/coordinator/__tests__/AdmissionFinanceIntegration.test.ts`

### Planned Test Scenarios

1. `TC-AF-01`: Reserved admission creates Security Deposit Liability and Rent Bill.
2. `TC-AF-02`: Reserved admission with `ADJUST_TO_SECURITY_DEPOSIT` reduces deposit posting by token amount.
3. `TC-AF-03`: Reserved admission with `ADJUST_TO_FIRST_RENT` reduces first rent bill by token amount.
4. `TC-AF-04`: Reserved admission with `LEAVE_PENDING` posts token as `ADVANCE_CREDIT`.
5. `TC-AF-05`: Walk-in admission creates full Security Deposit Liability and Rent Bill without token.
6. `TC-AF-06`: Verifies double-entry debit-credit equality (`sum(debit) === sum(credit)`) for admission postings.
7. `TC-AF-07`: Finance posting failure triggers compensating rollback of Stay, Resident, and Bed allocations.
8. `TC-AF-08`: Duplicate admission finance posting is prevented if financial records already exist for `stayId`.

---

## 13. Documentation & Governance Impact

The following governance documents will be updated upon completion of FR-2:
- `CAPABILITY_REGISTER.md`: Update FR-2 activity status.
- `docs/MODULE_STATUS.md`: Record Admission → Finance event hook completion.

---

## 14. File-by-File Implementation Plan

| File Path | Action | Purpose / Responsibility |
|---|:---:|---|
| `src/features/finance/services/admissionFinanceService.ts` | **CREATE** | Dedicated application service for admission financial initialization. |
| `src/features/admission/application/coordinator/AdmissionCoordinator.ts` | **MODIFY** | Connect `AdmissionFinanceService` call & compensating rollback after Step 3. |
| `src/features/admission/application/coordinator/__tests__/AdmissionFinanceIntegration.test.ts` | **CREATE** | Vitest integration test suite (8 test scenarios). |
| `CAPABILITY_REGISTER.md` | **MODIFY** | Update FR-2 status tracker upon completion. |
| `docs/MODULE_STATUS.md` | **MODIFY** | Update Finance / Admission integration status upon completion. |

---

## 15. Architectural Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Tight Coupling between Domains** | High | Introduce `AdmissionFinanceService` as a clean application service interface. |
| **Partial Financial Postings** | High | Wrap finance postings in a try-catch and use `ledgerService.reverseEntries()`. |
| **In-Memory Non-ACID Rollbacks** | Medium | Take deep snapshots of `Reservation` and `Flat` entities before mutation. |
| **Duplicate Rent Billing** | High | Enforce `checkDuplicateMonthlyRentBill()` invariant before posting. |

---

## 16. Prerequisites

- Sprint **FR-1** completed, committed, and pushed. **(COMPLETED)**
- `SettlementApplicationService` and `ledgerService` dependency injection stabilized. **(COMPLETED)**
- All 25 Vitest test suites passing cleanly. **(COMPLETED)**

---

## 17. Sprint Boundary

### IN-SCOPE for FR-2
- Synchronous Admission → Finance financial posting trigger.
- Initial Security Deposit Liability posting.
- Initial Rent Bill (`MONTHLY_RENT`) generation and double-entry posting.
- Token adjustment handling (`ADJUST_TO_SECURITY_DEPOSIT`, `ADJUST_TO_FIRST_RENT`, `LEAVE_PENDING`).
- Walk-in admission financial initialization.
- Compensating rollback for failed admission/finance transactions.
- Vitest integration test suite (`AdmissionFinanceIntegration.test.ts`).

### OUT-OF-SCOPE for FR-2
- Cash/Bank payment collection UI modal during check-in.
- Monthly recurring billing cron / batch job engine.
- Settlement & Checkout (completed in FR-1).
- Electricity / Laundry / Maintenance billing integration.
- Database / Supabase migration.

---

## 18. Final Recommendation

**FR-2 STATUS: READY FOR IMPLEMENTATION**

The architecture, event hooks, account mappings, double-entry rules, and compensating rollback strategies for **Sprint FR-2 — Admission & Rent Billing Integration** are fully specified and approved for implementation.
