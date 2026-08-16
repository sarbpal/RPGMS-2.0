# Billing Engine Architecture

**Project:** RPGMS 2.0
**Document:** Billing Engine Architecture
**Status:** Authoritative Target Architecture (Reconciled & Frozen)
**Version:** 1.2
**Last Updated:** August 2026

---

## 1. Purpose

The RPGMS 2.0 Billing Engine is a controlled billing-orchestration capability responsible for discovering eligible Charges, establishing authoritative Billing Run scope, coordinating claim and processing lifecycles, handling failures and recovery, preventing duplicate financial processing, and maintaining a complete business audit trail. The Billing Engine does not own the authoritative financial history of RPGMS; that responsibility remains with the Finance and Ledger capabilities.

The Billing Engine is not merely a calculation routine.

It is a **financial processing system with explicit lifecycle, claim, concurrency, recovery, retry, and audit semantics**.

This document defines the architectural rules that govern the Billing Engine and its interaction with Residents, Stays, Commercial Agreements, Charges, Electricity Allocations, Ancillary Services, Finance, the Ledger Engine, and operational workflows. It specializes the broader architecture defined by `docs/ARCHITECTURE.md` and remains consistent with `docs/BUSINESS_RULES.md`, `docs/DOMAIN_MODEL.md`, `docs/ELECTRICITY_BUSINESS_RULES_AND_DOMAIN_DESIGN.md`, and `PROJECT_RULES.md`.

---

## 1.1 Architectural Ownership Boundary

The Billing Engine is an **Architectural Service**. It coordinates billing execution but does not become the owner of business pricing, utility allocation math, or financial truth. This follows the Architectural Service principles in `docs/ARCHITECTURE.md`.

### Core Constitutional Ownership Principle:

> **"The Billing Engine orchestrates billable obligations; it does not create, calculate, allocate, or alter the underlying business obligation."**

The responsibility boundary is strictly partitioned across business domains:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DOMAIN OWNERSHIP BOUNDARY                                     │
│                                                                                                  │
│   RENT / STAY DOMAIN             ELECTRICITY DOMAIN                  FINANCE / LEDGER            │
│   ┌────────────────────────┐     ┌─────────────────────────────┐     ┌─────────────────────────┐ │
│   │ • CommercialAgreement  │     │ • Supplier Bill Ingestion   │     │ • Bill Entity (INV-...) │ │
│   │ • billingAnchorDay     │     │ • Historical Occupancy      │     │ • UnifiedStayLedger     │ │
│   │ • Rent Cycle Dates     │     │ • Potential Shares          │     │ • Double-Entry Rules    │ │
│   │ • Rent Rate & Concess. │     │ • Selected Shares           │     │ • BalanceEngine         │ │
│   └───────────┬────────────┘     │ • Exact Integer-Paise Math  │     │ • Deposit Accounts      │ │
│               │                  │ • Remainder Distribution    │     │ • Settlement Engine     │ │
│               │                  │ • Allocation Confirmation   │     └────────────▲────────────┘ │
│               │                  │ • Allocation Reversal       │                  │              │
│               │                  └──────────────┬──────────────┘                  │              │
│               │                                 │                                 │              │
│               │ Obligation:                     │ Direct Financial Posting:       │              │
│               │ Unbilled Rent Cycle             │ (Debit AR, Credit ELEC_REV)     │              │
│               ▼                                 └─────────────────────────────────┼──────────────┤
│   ┌────────────────────────────────────────────────────────────┐                  │              │
│   │ BILLING ENGINE (Orchestration Service)                     │                  │              │
│   │  • Discovers Unbilled Domain Obligations                   │                  │              │
│   │  • Observes Committed Domain-Posted Bills (No Re-billing)  │                  │              │
│   │  • Acquires Authoritative Claims (First Claim Wins)        │                  │              │
│   │  • Manages Run / Operation Lifecycle                       │                  │              │
│   │  • Dispatches Unbilled Claimed Batches to Finance ─────────┴──────────────────┘              │
│   │  • Manages Failure, Retry Lineage & Recovery Workbench                                       │
│   └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Rent Domain (Stay / Commercial)**: Owns `CommercialAgreement` (BR-400), `billingAnchorDay`, `checkInDate`, commercial amendments (BR-402), and monthly rent pricing truth.
2. **Electricity Domain**: Owns supplier bill data (`ElectricityBill`), historical flat occupancy reconstruction (`findStaysByFlatAndPeriodOverlap`), potential shares (BR-E-30), operator-selected shares (BR-E-31), exact integer-paise allocation (BR-E-37), deterministic remainder distribution (BR-E-38), allocation confirmation, data quality issue tracking, and allocation reversals (BR-E-49).
3. **Laundry / Ancillary Domains**: Owns service charge records, service dates, item quantities, and per-service rates.
4. **Billing Engine (Orchestrator)**: Coordinates batch discovery across domains, evaluates operator billing period scope against obligation business dates and eligibility cutoffs, enforces "First Claim Wins" concurrency protection, tracks `BillingRun` and `BillingOperation` lifecycles, and coordinates recovery/retry.
5. **Finance Domain**: The single source of financial truth. Owns `Bill` entity persistence, `UnifiedStayLedger` double-entry posting (`validateDoubleEntry`), payment allocation (BR-430), dynamic balance calculation (`balanceEngine`), security deposit liability (`depositService`), and checkout settlements (`settlementService`).

---

# 2. Constitutional Principles

The following principles are fundamental to the Billing Engine:

### 2.1 Preview is Informational Only
A Billing Preview never establishes a financial claim. It represents an informational snapshot of eligible obligations at the time the Preview is generated. A Preview may become stale before confirmation and performs zero database writes, zero ledger entries, and zero claim locks.

### 2.2 Confirmation is Authoritative
When the operator confirms a Billing Run, RPGMS performs a fresh authoritative eligibility calculation. The result of the original Preview is not treated as authoritative. The authoritative claim boundary is established only after this fresh revalidation at the `Eligibility Cutoff`.

### 2.3 Claim Before Financial Processing
An uncommitted Charge must be authoritatively claimed before it can be submitted for Bill creation and corresponding financial posting. Once claimed, the charge is protected from competing Billing Runs.

### 2.4 First Successful Claim Wins
When multiple Billing Runs overlap, the first successful authoritative claim establishes ownership of the charge. A later Billing Run must revalidate and exclude charges already claimed or financially resolved. The later Billing Run must not fail merely because some of its candidates have already been claimed.

### 2.5 Claim is Processing State, Not Financial Truth
A Claim is an ephemeral operational lock indicating that a specific Billing Operation has exclusive responsibility for processing a Charge. It is not financial truth. A charge is only `BILLED` when Finance successfully creates the `Bill` entity and posts balanced double-entry `LedgerEntry` records.

### 2.6 Billing Runs are Immutable Historical Records
A completed Billing Run must never be reopened and rewritten. Corrections are handled through appropriate financial workflows such as adjustment, reversal, recovery, or retry. A Retry Run is a new independent Billing Run linked via `retry_of`, not an in-place modification of the original.

### 2.7 Financial Integrity Takes Precedence Over Operational Convenience
A technical failure, timeout, crash, or uncertain result must never cause RPGMS to assume that a financial commitment did not occur. When the financial outcome is uncertain, the operation enters `RECOVERY_REQUIRED` and the Claim remains protected.

### 2.8 Audit History is Append-Only
Significant financial, operational, and authorization events are recorded as immutable business audit events. Historical events are never edited or deleted to make the current state appear cleaner.

### 2.9 Domain-Posted Invoices Remain Independent
Financial bills generated and posted directly by owning business domains (such as Electricity supplier bill allocations confirmed in the Electricity Workspace) remain independent Finance `Bill` records. The Billing Engine must never mutate, recreate, consolidate, or duplicate those bills.

### 2.10 Historical Stay Attribution
Financial obligation eligibility is attributed to the historical `Stay`, not current operational status alone. Legitimate post-checkout, post-settlement, and alumni-associated utility/adjustment obligations remain billable against their historical Stay without resurrecting operational occupancy.

---

# 3. Billing Period vs Commercial Rent Cycle vs Supplier Bill Period

RPGMS explicitly separates three distinct time concepts:

| Time Scope | Domain Owner | Definition & Semantics | Example |
| :--- | :--- | :--- | :--- |
| **Billing Engine Processing Period** | Billing Engine (Operator Scope) | Operator-selected execution window for discovering unbilled obligations. Does NOT dictate commercial cycles. | `2026-08-01` to `2026-08-31` |
| **Rent Cycle / Billing Anniversary** | Stay / Commercial (BR-400) | Monthly recurring commercial cycle defined by `Stay.billingAnchorDay` and `CommercialAgreement`. | `15-Aug-2026` to `14-Sep-2026` (Anchor: 15) |
| **Electricity Supplier Bill Period** | Electricity (BR-E-21) | Actual date range on the supplier invoice (`periodStart` to `periodEnd`). Governs historical occupancy reconstruction. | `2026-06-25` to `2026-07-24` |

---

## 3.1 Billing Period Does Not Imply Exclusive Processing

Billing Runs may overlap. For example:

```text
BR-022   01-Aug → 10-Aug
BR-023   01-Aug → 12-Aug
```

This is permitted. Duplicate prevention is achieved through authoritative claiming and checking financial commitment status rather than by prohibiting overlapping operator periods.

---

## 3.2 Full Selected Period is Evaluated

When an operator selects `01-Aug → 12-Aug`, RPGMS evaluates the complete period. It does not silently transform the period into only the currently unbilled portion. Charges already financially resolved are excluded during eligibility/claim processing.

```text
01-Aug → 10-Aug: already billed → excluded
11-Aug → 12-Aug: still eligible → included
```

The Billing Run nevertheless remains recorded as `01-Aug → 12-Aug` for audit and historical purposes.

---

## 3.3 Billing Period is Not the Rent Cycle

The Billing Period defines the business-date scope evaluated by a Billing Run. It does not replace or redefine the commercial billing cycle of a Stay.

RPGMS defines anniversary-based billing as the canonical commercial rent model. A Billing Run evaluates whether a Stay's billing anniversary date falls within the selected Billing Period. If a Stay has `billingAnchorDay = 15`, its rent cycle is `15-Aug → 14-Sep` with a Business Date of `15-Aug`. A Billing Run covering `01-Aug → 31-Aug` discovers this obligation on `15-Aug`. The Billing Engine does not force rent cycles into calendar months (`01-Aug → 31-Aug`).

---

## 3.4 Electricity Supplier Bill Period is Domain-Owned

The Electricity domain operates on supplier invoice date ranges (`periodStart` to `periodEnd`). The Billing Engine must never force an Electricity supplier bill period into a calendar month or rent anniversary cycle. An Electricity obligation is eligible for Billing Run discovery based on its authoritative business date and uncommitted financial status.

---

# 4. Business Date, Entry Date, Eligibility Cutoff & Historical Attribution

RPGMS distinguishes four temporal and attribution concepts:

### Business Date
The date to which an obligation belongs (e.g., Rent Anniversary Date = `15-Aug`, Laundry Date = `10-Aug`, Electricity Period End = `24-Jul`). The Business Date determines whether the obligation falls within the selected Billing Period.

### Entry Date
The date the obligation was recorded in the system (e.g., Laundry entered on `14-Aug`). Entry Date does not determine the obligation's Billing Period.

### Eligibility Cutoff
The exact timestamp at which the Billing Run performs its authoritative eligibility calculation and claim acquisition. Eligibility is determined from live state valid at this cutoff, not from an earlier Preview.

---

## 4.1 Late-Entered Charges

An obligation whose Business Date falls inside the selected Billing Period may still be billed if it is entered into RPGMS after an earlier Billing Run, provided it is available and uncommitted when a later Billing Run is confirmed.

```text
Laundry Date:       10-Aug (Business Date)
Entered:            14-Aug (Entry Date)

Billing Run 1:      01-Aug → 12-Aug (Confirmed 11-Aug) -> Missed Laundry
Billing Run 2:      01-Aug → 15-Aug (Confirmed 15-Aug) -> Ingests Laundry
```

---

## 4.2 Historical Stay Financial Attribution

Financial obligations belong to the historical `Stay` that incurred the occupancy or service, not current operational status alone.

1. **Rent Discovery**: Evaluates active/current commercial Stays for upcoming anniversary dates within the period.
2. **Utility & Adjustment Discovery**: Evaluates historical Stays based on date overlap (`findStaysByFlatAndPeriodOverlap`). In accordance with BR-E-42 and BR-E-43, legitimate utility and adjustment obligations may be billed against `CHECKED_OUT`, `CLOSED`, or `ALUMNI`-associated Stays.
3. **Status Filter Restriction**: The Billing Engine must **never** apply a generic `Stay.status === ACTIVE` filter across all discovery providers.

---

# 5. Billing Run Lifecycle

A Billing Run follows a strict state machine:

```text
CREATE
   ↓
PREVIEW (Informational Snapshot)
   ↓
CONFIRM
   ↓
AUTHORITATIVE REVALIDATION (Eligibility Cutoff)
   ↓
CLAIM ("First Claim Wins")
   ↓
PROCESS (Financial Dispatch to Finance)
   ↓
FINAL OUTCOME (COMPLETED / PARTIALLY_COMPLETED / FAILED)
```

Exception and branch outcomes include:

```text
STOP_PROCESSING (Graceful Stop -> NOT_PROCESSED)
CLAIM_FAILED (Lost Concurrency Race)
RECOVERY_REQUIRED (Uncertain Financial State)
RETRY (New Independent Billing Run)
```

---

# 6. Billing Preview

The Preview is a strictly read-only informational snapshot.

```text
Default Summary View:
┌────────────┬──────────┬──────────┬──────────┬─────────────┬─────────────────┐
│ Resident   │ Stay ID  │ Flat/Bed │ Amount   │ Status      │ Exceptions      │
├────────────┼──────────┼──────────┼──────────┼─────────────┼─────────────────┤
│ Rahul S.   │ STAY-101 │ F-101/A1 │ ₹12,000  │ Billable    │ None            │
│ Amit K.    │ STAY-102 │ F-102/B1 │ ₹13,450  │ Billable    │ 1 Late Laundry  │
│ Priya M.   │ STAY-103 │ F-103/A2 │ ₹0       │ No Charges  │ Cycle is Sep 05 │
└────────────┴──────────┴──────────┴──────────┴─────────────┴─────────────────┘
```

The operator can drill down to inspect individual charge items (Rent, Electricity, Laundry, etc.) along with inclusion/exclusion reasons and hold statuses.

---

# 7. Confirmation and Material Change Detection

When the operator confirms a Billing Run:
1. RPGMS performs a fresh authoritative eligibility calculation at the `Eligibility Cutoff`.
2. The fresh scope is compared against the original Preview.
3. If no material change exists, claim acquisition proceeds immediately.
4. If a material change exists, the run halts, presents the delta, and requires explicit operator reconfirmation.

A material change is defined by any change in **financial scope or financial outcome**:
- Resident/Stay added or removed.
- Charge added or removed.
- Billable amount changes by > ₹0.00.
- Previously held charge becomes billable (or vice versa).

---

# 8. Billing Operation & Scope

A `BillingRun` contains individual `BillingOperation` records. A `BillingOperation` represents the processing scope for one Stay within that run.

Once authoritative claims are acquired, the `BillingOperation` scope becomes immutable for that run.

---

# 9. Invoice Consolidation & Domain-Posted Bill Independence (Amended D-5)

RPGMS establishes the following rules for invoice generation:

1. **Domain-Posted Bills Remain Independent**: Bills generated and posted during domain-specific workflows (such as Electricity supplier bill allocations confirmed under BR-E-45) are already finalized in Finance. The Billing Engine acknowledges them as `COMMITTED` and **never mutates or recreates them**.
2. **Billing Run Batch Consolidation**: A `BillingRun` consolidates into a single `Bill` *only those unbilled obligations that are claimed and dispatched simultaneously within that specific run* (e.g., Monthly Rent + unbilled Laundry Service Charges).
3. **Multi-Category Double-Entry Routing**: When a consolidated Bill contains multiple categories (`RENT`, `UTILITIES`, `MAINTENANCE`, `OTHER`), Finance posts balanced ledger entries crediting the appropriate revenue accounts (`RENT_REVENUE`, `ELECTRICITY_REVENUE`, etc.) in accordance with double-entry rules.
4. **No Universal "One Bill Per Stay" Mandate**: System architecture permits multiple independent bills per Stay when obligations originate from separate domain lifecycles.

---

# 10. Generic Financial Commitment Contract

The Billing Engine relies on a normalized discovery contract across all charge-owning domains:

```typescript
export interface DiscoveredObligation {
  /** Deterministic unique identifier: e.g. "RENT:STAY-101:2026-08-15" */
  readonly obligationKey: string;

  /** Owning Stay ID (BR-410) */
  readonly stayId: string;

  /** Resident identification snapshot */
  readonly residentId: string;
  readonly residentCode: string;

  /** Obligation classification */
  readonly chargeType: 'RENT' | 'ELECTRICITY' | 'LAUNDRY' | 'MAINTENANCE' | 'OTHER';

  /** Authoritative monetary amount (paise precision) */
  readonly amount: number;

  /** Business date governing period inclusion */
  readonly businessDate: string;

  /** Timestamp when obligation was entered into source domain */
  readonly entryDate: string;

  /** Human-readable description */
  readonly description: string;

  /** Revenue category routing for Finance ledger */
  readonly category: 'RENT' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';

  /** Financial commitment status */
  readonly commitmentStatus: 'UNCOMMITTED' | 'COMMITTED';

  /** Stable financial reference if already committed (e.g. Finance Bill ID) */
  readonly financialReferenceId?: string;

  /** Source period label where applicable */
  readonly sourcePeriodLabel?: string;

  /** Source-domain traceability metadata */
  readonly metadata?: Record<string, unknown>;
}

export interface ChargeDiscoveryProvider {
  /**
   * Discovers all obligations within the date range for specified Stays.
   * If stayIds is omitted, empty, or undefined, discovers obligations property-wide across all candidate Stays.
   *
   * @param stayIds Target Stays to evaluate (optional; empty or omitted indicates property-wide)
   * @param periodStart Selected billing period start date (YYYY-MM-DD)
   * @param periodEnd Selected billing period end date (YYYY-MM-DD)
   * @param cutoffTimestamp Authoritative eligibility cutoff timestamp (ISO)
   */
  discoverObligations(
    stayIds: string[] | undefined,
    periodStart: string,
    periodEnd: string,
    cutoffTimestamp: string
  ): Promise<DiscoveredObligation[]>;
}
```

### Source-Domain Commitment & Duplicate Detection Principle:

> **"Source-domain duplicate detection and financial commitment determination are owned by the source domain. The Billing Engine relies on the normalized commitment status and financial reference and does not contain domain-specific duplicate-detection logic."**

---

# 11. Charge Ownership Matrix

| Charge Type | Owning Domain | Obligation Authority | Discovery Provider | Calculation Owner | Allocation Owner | Finance Posting Owner | Billing Engine Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rent** | Stay / Commercial | `CommercialAgreement` (BR-400) | `RentDiscoveryAdapter` | Stay Aggregate (`agreedRent`) | N/A (1:1 with Stay) | **Billing Engine** (via Finance Adapter) | Evaluates anniversary date in period, claims unbilled cycle, dispatches to Finance. |
| **Electricity** | Electricity Domain | Confirmed `ElectricityAllocation` (BR-E-19) | `ElectricityDiscoveryAdapter` | Electricity Tariff / Supplier Bill | Electricity Module (`calculateShareBasedAllocation`) | **Electricity Module** (at Confirmation) | Observes confirmed Electricity obligations for reconciliation/audit; does not claim or repost financially committed allocations. |
| **Laundry** | Operations / Service | Recorded Laundry Service Entry | `LaundryDiscoveryAdapter` | Operations Entry (Rate × Qty) | N/A (1:1 with Stay) | **Billing Engine** (via Finance Adapter) | Evaluates service date in period, claims unbilled charge, dispatches to Finance. |
| **Security Deposit** | Finance / Deposit | `DepositTransaction` (BR-450, ADR-024) | N/A (**EXCLUDED**) | Deposit Service / Commercial Agreement | N/A | **Deposit Service** (`depositService.ts`) | **STRICTLY EXCLUDED** from recurring Billing Runs. |
| **Maintenance / Penalties (Future / TBD)** | Maintenance / Operations | TBD (Requires domain-specific architecture decision) | TBD (Future Adapter) | TBD (Assessment / Approved Work Order) | N/A | TBD | **TBD / Excluded from MVP** (Requires domain-specific architecture decision before implementation). |
| **Checkout Settlement Adjustments** | Finance / Settlement | `Settlement` Record (BR-460) | N/A (**EXCLUDED**) | Settlement Engine (`settlementService.ts`) | N/A | **Settlement Service** (`settlementService.ts`) | **STRICTLY EXCLUDED** from recurring Billing Runs. |

---

# 12. Electricity Discovery Adapter Architecture

The `ElectricityDiscoveryAdapter` is strictly a **READ / DISCOVERY** adapter:

```text
Confirmed Electricity Allocation Participant (Frozen Snapshot)
                     ↓
         ElectricityDiscoveryAdapter
                     ↓
     DiscoveredObligation (COMMITTED)
                     ↓
               Billing Engine
```

The adapter:
- **MUST**: Read confirmed participants from `ElectricityRepository`, map amounts, business dates, and existing `financeBillId` references into `DiscoveredObligation`.
- **MUST NOT**: Calculate electricity shares, calculate tariffs, reconstruct historical occupancy, select participants, confirm allocations, alter allocation records, or create duplicate Finance postings.

---

# 13. Claim Boundary & Concurrency Model

### Business Guarantee
"First successful authoritative claim wins." Once an uncommitted charge is claimed by a `BillingOperation`, it is protected from all competing runs.

### MVP Technical Mechanism
In the single-threaded in-memory architecture, `InMemoryBillingRunRepository` maintains an atomic check-and-set claim map (`Map<string, BillingClaim>`). Claim acquisition is atomic prior to financial dispatch.

### Future Persistence Mechanism (PostgreSQL / Supabase)
Future persistent repositories will enforce concurrency via row-level locking (`SELECT ... FOR UPDATE`), transactional boundaries, and partial unique indexes:
```sql
CREATE UNIQUE INDEX idx_active_billing_claims
ON billing_claims (obligation_key)
WHERE status = 'CLAIM_ACQUIRED';
```

---

# 14. Billing Engine → Finance Transaction Boundary

```typescript
export interface CreateBilledInvoicePayload {
  readonly billingRunId: string;
  readonly billingOperationId: string;
  readonly stayId: string;
  readonly period: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly billType: 'MONTHLY_RENT' | 'RECURRING_CHARGE' | 'ONE_TIME_CHARGE';
  readonly lineItems: Array<{
    readonly id: string;
    readonly description: string;
    readonly amount: number;
    readonly category: 'RENT' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
    readonly obligationKey: string;
  }>;
  readonly totalAmount: number;
  readonly remarks: string;
}
```

1. **Billing Engine**: Assembles claimed obligations into `CreateBilledInvoicePayload` and dispatches to Finance.
2. **Finance Engine**: Validates double-entry balance, persists `Bill` entity, posts balanced `LedgerEntry` records in `UnifiedStayLedger`, and returns the created `billId`.
3. **Point of Financial Truth**: A charge is considered **`BILLED`** if and only if Finance returns a successful result with persisted `Bill` and `LedgerEntry` IDs.

---

# 15. Failure Outcomes & Recovery Architecture

```text
                                  EXECUTION STARTED
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             All Invariants Succeeded              Technical or Domain Error
                        │                                   │
                        ▼                                   ▼
               [Operation: SUCCESS]                Was Financial Outcome
             [Claim: CLAIM_COMMITTED]                 Authoritatively Known?
                                                            │
                                             ┌──────────────┴──────────────┐
                                             ▼                             ▼
                                   NO FINANCIAL COMMITMENT        UNCERTAIN / UNKNOWN
                                             │                             │
                                             ▼                             ▼
                                    [Operation: FAILED]               [Operation:
                                   [Claim: CLAIM_RELEASED]         RECOVERY_REQUIRED]
                                             │                   [Claim: CLAIM_HELD]
                                             ▼                             │
                                     Eligible for Retry                    ▼
                                     in New Billing Run            Protected until Human
                                                                    Recovery Resolution
```

- **`SUCCESS`**: Bill created, ledger entries posted, claim committed.
- **`NO_CHARGES`**: Stay had zero unbilled obligations for the period.
- **`NOT_PROCESSED`**: Operator clicked `Stop Processing` before operation started. Claims were never acquired; items return to future eligibility pool.
- **`FAILED`**: Explicit non-financial failure. Conclusively no financial commitment; claim released; eligible for Retry Run.
- **`CLAIM_FAILED`**: Lost concurrency race to another run during confirmation. Bypassed in current run.
- **`RECOVERY_REQUIRED`**: Unhandled crash, timeout, or partial write. Claim remains **protected and locked** until resolved via the Recovery Workbench.

### 15.1 Recovery Resolution & Retry Lineage (Slice 4B)

The Recovery Workbench and Retry Run engine enforce the following conclusive rules:

1. **Authoritative Evidence Correlation**:
   The Recovery Service queries the authoritative `FinanceRepository` by `stayId`, matching against `obligationKey`(s), `remarks` containing the Billing Run ID and Stay ID, billing period, and total amounts.
   - **`COMMITTED`**: An active (non-cancelled) Finance Bill exists with verified, balanced double-entry `LedgerEntry` postings.
   - **`NOT_COMMITTED`**: Zero Bills and zero ledger entries exist in Finance for these obligations.
   - **`UNKNOWN`**: Inconclusive evidence (e.g. cancelled bills, unbalanced ledgers, partial writes, or amount mismatches).

2. **Resolution Semantics**:
   - `resolveAsCommitted(financialBillId, notes)`: Transitions operation to `SUCCESS`, records `financialBillId`, commits associated claims to `CLAIM_COMMITTED`, and permanently bars the operation from entering any retry run.
   - `resolveAsNotCommitted(reason, notes)`: Requires a mandatory operator reason, transitions operation to `FAILED`, releases associated claims to `CLAIM_RELEASED`, and returns obligations to the eligible pool for retry.
   - **Strict Gating**: No force-resolution is permitted for `UNKNOWN` evidence. Both resolution actions are locked until manual audit resolves financial certainty.

3. **Immutable Retry Lineage**:
   - A Retry Run is instantiated as an independent, immutable `BillingRun` with `retryOfRunId = originalRun.id`.
   - **Scope Invariants**: Includes only `FAILED`, `CLAIM_FAILED`, `NOT_PROCESSED`, and resolved `NOT_COMMITTED` operations. Strictly excludes `SUCCESS` (already billed) and `NO_CHARGES`.
   - **Blocking Invariant**: Any unresolved `RECOVERY_REQUIRED` operation in the parent run blocks Retry Run creation until explicitly resolved in the Recovery Workbench.
   - **Lifecycle Guarantee**: A Retry Run enters `DRAFT_PREVIEW` and must follow the standard preview → revalidation → confirmation → execution workflow.

---

# 16. Security Deposit Boundary

In strict compliance with BR-450 and ADR-024, Security Deposits are independent running liability accounts (`AccountType.SECURITY_DEPOSIT_LIABILITY`) managed exclusively by `DepositApplicationService` and `SettlementApplicationService`.

**Security deposits are strictly excluded from recurring Billing Runs.**

---

# 17. Governance & Status Enums (Locked for Slice 1)

The following canonical status enums are formally locked:

### `BillingRunStatus`
`'DRAFT_PREVIEW' | 'CONFIRMED' | 'PROCESSING' | 'STOPPING' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED'`

### `BillingOperationOutcome`
`'PENDING' | 'CLAIMED' | 'PROCESSING' | 'SUCCESS' | 'NO_CHARGES' | 'NOT_PROCESSED' | 'FAILED' | 'CLAIM_FAILED' | 'RECOVERY_REQUIRED'`

### `BillingClaimStatus`
`'CLAIM_ACQUIRED' | 'CLAIM_COMMITTED' | 'CLAIM_RELEASED'`

### `ObligationCommitmentStatus`
`'UNCOMMITTED' | 'COMMITTED'`

---

# 18. Constitutional Summary

The RPGMS 2.0 Billing Engine follows one central principle:

- **Calculate openly, validate freshly, claim atomically, process safely, recover explicitly, retry through new runs, respect domain-posted invoices, and preserve everything in an immutable audit trail.**

The Billing Engine must always be able to answer:
- **What was supposed to be billed?**
- **What was actually claimed?**
- **What was financially committed?**
- **What failed?**
- **What remains unresolved?**
- **Who made each consequential decision?**
- **Can the same charge ever be billed twice?**

The answer to the final question must always be:
- **No.**