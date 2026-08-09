# RPGMS 2.0

# Electricity Business Rules & Domain Design

**Status:** Stage 1, Stage 2, Stage 3, Stage 4 & Stage 5 Implemented
**Scope:** Ritu PG Supplier Electricity Billing & Allocation
**Current FR-6 baseline:** Meter / Reading / kWh / Tariff / Automated Split
**Target model:** Supplier Bill / Historical Occupancy / Operator Share Selection / Finance Posting

---

## 1. Purpose

This document defines the business rules and domain design for Electricity in RPGMS 2.0.

The design distinguishes two related but separate capabilities:

1. **Physical Electricity Consumption Engine**

   * Meter
   * Meter Reading
   * kWh consumption
   * Tariff calculation
   * Future consumption analytics

2. **Supplier Electricity Bill Allocation Engine**

   * Actual electricity supplier bill
   * Flat and billing period
   * Historical occupancy reconstruction
   * Potential shares
   * Operator-selected shares
   * Exact allocation
   * Finance posting
   * Permanent allocation history

The existing FR-6 implementation already provides the physical consumption capability and should not be discarded. The architecture audit confirms that the two capabilities can coexist cleanly.

---

# 2. Core Ritu PG Business Principle

Ritu PG does not calculate the electricity amount payable by residents from the sub-meter tariff calculation.

Ritu PG receives an actual electricity bill from the electricity supply company.

The actual supplier bill amount is therefore the authoritative financial amount to be allocated.

The allocation process is:

Supplier Bill
→ Flat
→ Billing Period
→ Historical Occupancy Activity
→ Potential Shares
→ Operator Selection
→ Selected Shares
→ Exact Allocation
→ Operator Confirmation
→ Finance Posting
→ Permanent Historical Record

This differs materially from the current FR-6 automatic meter/tariff/equal-split model.

---

# 3. Existing Rules BR-E-1 to BR-E-18

The existing authoritative wording of BR-E-1 through BR-E-18 must be preserved from the project's existing Electricity Business Rules documentation.

**Do not rewrite, renumber, or silently replace those rules during implementation.**

This specification extends the existing rule set with BR-E-19 onward.

---

# 4. ElectricityBill

## BR-E-19 — Bill Identity

An ElectricityBill represents one actual electricity supplier bill for one specific Flat.

One ElectricityBill belongs to exactly one Flat.

The bill is an external financial document received by Ritu PG.

---

## BR-E-20 — Supplier Amount

The amount recorded on ElectricityBill is the actual monetary amount appearing on the supplier bill.

The system must not replace the supplier amount with an amount calculated from:

* meter readings;
* kWh;
* tariff slabs;
* estimated consumption.

Physical consumption calculations may be retained for analytical purposes but must not override the supplier invoice amount.

---

## BR-E-21 — Billing Period

Every ElectricityBill must have an explicit:

* periodStart
* periodEnd

The billing period determines the historical occupancy activity considered for allocation.

The date the bill is entered or received is not a substitute for the billing period.

When creating the corresponding Finance receivable bill, the billing period must map to the canonical `YYYY-MM` representation (e.g., derived from `periodStart.substring(0, 7)`) expected by the existing Finance billing infrastructure.

---

## BR-E-22 — Supplier Reference

The supplier's bill/reference number must be retained.

The supplier reference exists for:

* audit;
* reconciliation;
* duplicate protection;
* retrieval of the original supplier document.

---

## BR-E-23 — Bill and Allocation Separation

The supplier bill and the operator's allocation decision are separate domain concerns.

ElectricityBill records what the supplier charged.

ElectricityAllocation records how Ritu PG decided to distribute that amount.

---

## BR-E-24 — No Partial Final Allocation

A normal ElectricityBill receives one complete confirmed allocation.

A bill must not be treated as finally allocated through multiple independent partial allocations.

Corrections after confirmation use the controlled correction/reversal mechanism.

---

## BR-E-25 — Historical Bill Preservation

A supplier bill that has participated in financial posting must never be destructively deleted or overwritten.

Corrections must preserve the original historical record.

---

## BR-E-26 — Duplicate Bill Protection

The combination of:

**Supplier + Supplier Bill Number + Flat**

constitutes the hard duplicate identity for normal bill entry.

A confirmed duplicate must not be entered as another independent supplier bill.

---

## BR-E-27 — One Final Allocation

One supplier bill has one final ElectricityAllocation.

Multiple partial final allocations are not part of the normal business process.

---

## BR-E-28 — Zero-Value Supplier Bill

A genuine supplier bill with an amount of ₹0 may be recorded.

A zero-value bill normally results in no resident receivable but remains part of supplier and electricity history.

---

## BR-E-29 — Source Document Preservation

The original supplier electricity bill should be attachable to the ElectricityBill as a PDF/image/document.

The source document is retained for future audit and reconciliation.

---

# 5. Historical Occupancy

The system must not determine electricity participants from current Resident or Stay status alone.

The existing FR-6 implementation incorrectly excludes CHECKED_OUT stays because it filters for ACTIVE and ON_NOTICE only.

Historical eligibility must therefore be based on occupancy activity during the billing period.

To discover historical occupancy, the repository layer must support a date-overlap query:

```text
findStaysByFlatAndPeriodOverlap(
  flatId,
  periodStart,
  periodEnd
)
```

This query resolves all Stays and BedAllocations that overlapped the billing period, ensuring residents who checked out or joined during the billing period are correctly identified.

---

# 6. Potential Shares

## BR-E-30 — Potential Share Calculation and Exact Allocation

One occupied bed represents one potential electricity share.

Therefore:

* 1 occupied bed → 1 potential share
* 2 occupied beds → 2 potential shares

Potential shares represent the system's historical observation.

They are not automatically financial charges.

---

## BR-E-31 — Operator Controls Selected Shares

The operator decides how many of the potential shares actually participate in the electricity allocation.

For a resident occupying two beds:

```text
Potential Shares = 2

Selected Shares:
0
1
or
2
```

The system must not automatically assume that all potential shares become chargeable shares.

---

## BR-E-32 — Potential vs Selected Shares

Potential shares and selected shares are separate concepts.

Example:

```text
potentialShares = 2
selectedShares  = 1
```

This means the resident had two potential shares but the operator deliberately selected one share for this electricity allocation.

The distinction must be preserved historically.

---

## BR-E-33 — Zero Selected Shares Remain Visible

A historical participant with:

```text
potentialShares > 0
selectedShares = 0
```

must remain visible in the allocation history.

This records that the person was considered but excluded by the operator.

The system must not silently remove such participants from the historical allocation.

---

# 7. ElectricityAllocation

An ElectricityAllocation represents the complete operator-controlled allocation of one ElectricityBill.

Conceptually:

```text
ElectricityBill
      |
      v
ElectricityAllocation
      |
      +-- Participant
      +-- Participant
      +-- Participant
```

The allocation is persistent.

The current FR-6 `ConsumptionAllocation` is transient and does not preserve the operator's historical decision. The audit explicitly identifies persistent allocation history as a missing capability.

---

# 8. Allocation Participant

Each allocation participant represents one historical Stay participating in the allocation.

Conceptually it contains:

```text
residentId
stayId
flatId

potentialShares
selectedShares
allocatedAmount
```

Additional historical metadata may be retained where required for audit.

The participant record is a historical snapshot.

It must not later change merely because the Resident:

* checks out;
* changes accommodation;
* receives another Stay;
* becomes ALUMNI.

---

# 9. Stay Attribution

## BR-E-34 — Stay-Based Attribution

Electricity charges are attributed to the historical Stay that participated in the allocation.

The Resident remains the parent identity, but Stay provides the historical operational context.

This avoids ambiguity when one Resident has multiple Stays.

---

# 10. Allocation Calculation

## BR-E-35 — Selected Share Total

The allocation maintains the total number of selected shares:

```text
totalSelectedShares =
sum(selectedShares)
```

The operator cannot confirm an allocation with zero selected shares.

---

## BR-E-36 — Per-Share Calculation

The supplier bill amount is divided by the total selected shares.

Conceptually:

```text
amountPerShare =
supplierBillAmount / totalSelectedShares
```

A participant's allocation is:

```text
selectedShares × amountPerShare
```

---

## BR-E-37 — Paise-Level Calculation

All financial calculations are performed at currency precision sufficient to represent paise.

The system must not rely on floating-point rupee arithmetic for final financial posting.

---

## BR-E-38 — Deterministic Remainder

Where the supplier bill cannot be divided evenly among the selected shares, the unavoidable remainder is distributed deterministically.

The deterministic remainder ordering is:

1. `residentCode` ASC
2. `stayId` ASC

Any remaining paise after equal division must be distributed one paise at a time to selected shares according to that deterministic ordering.

Example:

```text
Supplier Bill = ₹10,000
Selected Shares = 3

Participant A (Code R-001) = ₹3,333.34
Participant B (Code R-002) = ₹3,333.33
Participant C (Code R-003) = ₹3,333.33

Total = ₹10,000.00
```

The final participant amounts are frozen in the confirmed allocation snapshot and must reconcile exactly to the supplier bill.

---

## BR-E-39 — Exact Reconciliation

At confirmation:

```text
sum(participant allocated amounts)
==
supplier bill amount
```

No unexplained remainder may remain.

The allocation cannot be confirmed if the totals do not reconcile exactly.

---

# 11. Operator Workflow

The Electricity workspace should follow:

### Step 1 — Enter Supplier Bill

Operator records:

* supplier;
* supplier bill/reference number;
* Flat;
* bill date;
* billing period;
* due date, if applicable;
* actual supplier amount;
* source document, if available.

### Step 2 — Discover Historical Occupancy

The system identifies relevant historical Stays whose occupancy overlapped the billing period.

The audit specifically identifies the need for historical date-overlap querying rather than current-status filtering.

### Step 3 — Display Occupancy Activity

The operator sees:

* Resident;
* Resident Code;
* Stay;
* check-in;
* checkout;
* occupancy status/history;
* occupied bed count;
* relevant join/leave activity.

### Step 4 — Determine Potential Shares

The system calculates potential shares from historical bed occupancy.

### Step 5 — Operator Selects Shares

The operator decides:

* included/excluded;
* selected share count.

### Step 6 — Live Recalculation

The system shows:

* total selected shares;
* amount per share;
* each participant amount;
* total allocated amount;
* reconciliation with supplier bill.

### Step 7 — Review

The operator verifies the allocation.

### Step 8 — Confirm & Post

The complete allocation is confirmed and financial charges are posted.

### Stage 4 UI Workspace Implementation Architecture

The Stage 4 implementation completes this 8-step workflow via an operator-facing React UI workspace in `src/features/electricity/`:

1. **Dual-Tab Electricity Workspace (`ElectricityPage.tsx`):**
   * **Tab 0 (Supplier Bill Allocations):** Primary Ritu PG operator billing workflow for actual supplier bills.
   * **Tab 1 (Physical Sub-Meters):** FR-6 analytical sub-meter consumption engine preserved intact (`meterRules.ts`, kWh readings, active tariff card).

2. **Supplier Bill Entry Dialog (`SupplierBillEntryModal.tsx`):**
   * Step 1 dialog form collecting supplier name, supplier bill reference number, supplier bill amount (₹), flat ID, and billing period date range (`periodStart`, `periodEnd`).
   * Usability validation ensures non-empty strings, positive amount > 0, and valid date ordering (`periodEnd >= periodStart`).

3. **Draft Allocation Review Panel (`DraftAllocationReviewPanel.tsx`):**
   * Steps 2–7 review panel rendering candidate historical participants (`residentCode`, `residentNameSnapshot`, `stayId`, `potentialShares`, `selectedShares`, `allocatedAmount`).
   * Interactive share selection inputs permitting operator adjustment between `0` and `potentialShares`, triggering `SupplierBillAllocationService.updateDraftShares()` to recalculate exact integer-paise share distribution via the Stage 1 allocation engine (`calculateShareBasedAllocation`).

4. **Financial Reconciliation Presentation Aid:**
   * Displays a reconciliation check alert confirming `Total Allocated Amount (₹) == Supplier Bill Amount (₹)`.
   * **Authoritative Boundary:** The reconciliation check is strictly a presentation and verification aid. Authoritative allocation math remains 100% in the Stage 1/3 domain/application layer; the UI does NOT become a second allocation engine.

5. **Explicit Confirmation & Action Controls:**
   * **`RESIDENT_ALLOCATED` Confirmation:** Enabled when `totalSelectedShares > 0`. Operator UI action invokes `SupplierBillAllocationService.confirmAllocation()`, delegating to the existing Stage 3 application service to perform authoritative confirmation and post Finance utility bills crediting `AccountType.ELECTRICITY_REVENUE`.
   * **`OWNER_ABSORBED` Confirmation:** Highlighted when `totalSelectedShares === 0`. Requires explicit operator confirmation click, creating ₹0 resident receivables while recording owner-absorbed expenses in electricity history. Zero selected shares do NOT automatically confirm an allocation.

6. **Data-Quality & Audit Acknowledgement:**
   * Renders warning alerts for historical occupancy anomalies (`AllocationDataQualityIssue`).
   * Collects `confirmedBy` (Operator Identity) and optional `operatorNotes`.
   * Domain entity stamps `acknowledgedBy`, `acknowledgedAt`, and `operatorNotes` onto data-quality issues upon confirmation.

7. **Confirmed Allocation History Audit Table (`AllocationHistoryTable.tsx`):**
   * Renders frozen historical allocation audit records.
   * Derives bill metadata by pairing existing repository records using `allocation.billId === bill.id` from `getAllocations()` and `getBills()`.
   * Displays outcome chips (`RESIDENT_ALLOCATED` / `OWNER_ABSORBED`), `confirmedBy`, `confirmedAt`, acknowledged data-quality tooltips, participant breakdowns, and linked `financeBillId`s.

---

# 12. Finance Integration

## BR-E-40 — Electricity Creates Receivable

A confirmed electricity allocation creates financial receivables for participants with selected shares greater than zero.

Electricity does not create payment automatically.

---

## BR-E-41 — Existing Finance Infrastructure

Electricity must use the existing Finance/Ledger infrastructure.

The current Finance boundary already supports electricity-style billing through BillingApplicationService and balanced double-entry ledger posting.

The new Supplier Bill Allocation Engine must therefore delegate financial posting to Finance rather than creating a parallel electricity ledger.

Electricity revenue must use a dedicated Finance revenue account:

`ELECTRICITY_REVENUE`

Do not use `RENT_REVENUE` for electricity billing. Introducing `ELECTRICITY_REVENUE` into `AccountType` and updating revenue account routing in `BillingApplicationService` is an architectural Finance dependency to be implemented later when the allocation engine is integrated.

---

# 13. Double Entry

For a ₹1,600 electricity charge:

```text
DEBIT   ACCOUNTS_RECEIVABLE   ₹1,600
CREDIT  ELECTRICITY_REVENUE   ₹1,600
```

The exact existing Finance category/account naming must be reused where appropriate.

The Electricity domain must not bypass the Finance boundary.

---

# 14. Payment Separation

Electricity allocation creates an obligation.

It does not constitute payment.

The lifecycle is:

```text
Electricity Allocation
        ↓
Receivable
        ↓
Resident Payment
        ↓
Receivable Settlement
```

The original electricity allocation remains historically intact.

---

# 15. Post-Checkout Electricity

## BR-E-42 — Post-Checkout Allocation

A legitimate electricity charge may be posted against a CHECKED_OUT Stay.

Posting must not:

* reopen the Stay;
* reoccupy a bed;
* create a new Stay;
* modify accommodation state.

This follows the validated lifecycle invariant:

> Checkout ends Stay, but does not end financial relations.

The existing Finance domain already permits bills to be posted against a checked-out stay, while the current FR-6 electricity filtering incorrectly prevents this.

---

# 16. Post-Alumni Electricity

## BR-E-43 — Post-Settlement Electricity Obligation

A legitimate electricity charge belonging to a historical Stay may be allocated and posted even after:

* checkout;
* final settlement;
* Resident conversion to ALUMNI.

The system must not resurrect the operational Stay.

It must not recreate accommodation.

It must not change the Resident from ALUMNI back to ACTIVE.

The new financial obligation remains attached to the historical Stay/Resident relationship.

---

# 17. Deposit Separation

## BR-E-44 — Electricity Does Not Automatically Consume Deposit

Posting an electricity charge does not automatically consume or refund the security deposit.

For example:

```text
Security Deposit Held = ₹4,500
Electricity Receivable = ₹1,600
```

Both remain separately identifiable until a permitted settlement/adjustment operation occurs.

This preserves the deposit lifecycle model:

* deposit can be received in parts;
* refunded in parts during stay;
* returned after checkout;
* adjusted during final settlement.

---

# 18. Atomicity

## BR-E-45 — Atomic Confirm & Post

Confirm & Post must not leave the system in an inconsistent state such as:

```text
Allocation = POSTED
Finance = NOT POSTED
```

or:

```text
Finance = POSTED
Allocation = DRAFT
```

The implementation uses an application-level compensating rollback. Because database-level ACID transactions across decoupled repositories are not present, `SupplierBillAllocationService` monitors multi-participant Finance postings during confirmation. If any participant billing fails mid-batch, all Finance bills and ledger entries previously created in that batch are reverted, the allocation remains in `DRAFT` status, and an error result is returned to prevent partial confirmation.

---

# 19. Idempotency

## BR-E-46 — Idempotent Posting

A finalized ElectricityAllocation can create only one successful financial posting set.

Repeated submission/retry of the same allocation must not create duplicate resident charges.

When Finance creates a receivable from an Electricity Allocation Participant, the eventual Finance posting must pass:

* `referenceType = ELECTRICITY_ALLOCATION`
* `referenceId = participantAllocationId`

This provides a stable business reference that allows duplicate posting to be detected and prevented during retries via `hasDuplicateElectricityBill(participant.id)`.

*Runtime Guarantee Note:* In the current single-threaded / in-memory architecture, idempotency is enforced by verifying pre-existing ledger entries prior to posting. Future persistent SQL repositories may require database unique constraints for multi-node concurrency safety.

---

# 20. Corrections

## BR-E-47 — Immutable Confirmed Allocation

A confirmed allocation is historical evidence.

It must not be edited destructively.

If the operator made an error, the system creates a controlled correction/reversal process.

---

## BR-E-48 — Controlled Financial Correction

Corrections must use reversal/adjustment entries.

Original ledger entries remain intact.

Example:

```text
Original:
A → ₹1,600
B → ₹3,200

Corrected:
A → ₹3,200
B → ₹1,600

Correction:
A +₹1,600
B -₹1,600
```

The exact correction mechanics should reuse the existing Finance correction capabilities.

---

## BR-E-49 — Allocation Reversal Mechanics

A confirmed electricity allocation is immutable.

If a confirmed allocation must be corrected:

* the original allocation remains preserved;
* original financial postings remain historically traceable;
* a controlled reversal workflow transitions `ElectricityAllocation` status from `CONFIRMED → REVERSED`;
* resulting Finance ledger entries preserve double-entry integrity;
* the correction does not edit or delete historical financial records.

### 1. Authoritative Reversal Lifecycle
The allocation reversal lifecycle belongs strictly to `ElectricityAllocation`:

```text
CONFIRMED → REVERSED
```

Attempts to reverse an allocation in any other state are strictly prohibited:
* `DRAFT → REVERSED`: Rejected with a domain error.
* `REVERSED → REVERSED`: Rejected with a domain error.

### 2. Reversal Audit Metadata
When an allocation is reversed, explicit audit metadata is recorded on the `ElectricityAllocation` aggregate:
* `reversalReferenceId`: Stable business reference string (e.g., `rev_ealloc_123`).
* `reversedBy`: Mandatory operator identity initiating the reversal.
* `reversedAt`: ISO timestamp when the reversal was committed.
* `reversalReason`: Optional operational notes describing the reason for reversal.

### 3. Historical Immutability
Reversal does NOT alter historical calculation or attribution parameters on `ElectricityAllocation`:
* `totalSupplierAmount`, `totalPotentialShares`, `totalSelectedShares`, `amountPerShare`, `remainderPaise` remain unmutated;
* `periodStart`, `periodEnd`, `flatId`, `billId` remain unmutated;
* `confirmedBy` and `confirmedAt` confirmation metadata remain unmutated;
* `participants` array and historical `dataQualityIssues` remain unmutated.

### 4. Finance Integration (Resident Allocations)
Reversal of a `RESIDENT_ALLOCATED` electricity allocation delegates financial adjustments strictly to existing Finance domain primitives:
* **Finance Bill Cancellation**: Linked resident Finance bills transition to `status = 'CANCELLED'` via `FinanceRepository.saveBill()`.
* **Ledger Counter-Posting**: Counter-posting entries are created using `LedgerApplicationService.reverseEntries()`:
  * Original entries are located using `referenceType = 'ELECTRICITY_ALLOCATION'` (or fallback `'BILL'`) and `referenceId = participant.financeBillId`.
  * Generated counter-posting ledger entries are posted with `referenceType = 'REVERSAL'` and `referenceId = orig.id`.
  * Accounting entry direction:
    ```text
    Debit  ELECTRICITY_REVENUE
    Credit ACCOUNTS_RECEIVABLE
    ```

### 5. Owner-Absorbed Allocations
Reversing an `OWNER_ABSORBED` allocation transitions `ElectricityAllocation` status to `REVERSED` without executing resident Finance bill cancellations or resident ledger counter-postings, as no resident bills were created during confirmation.

### 6. Paid Bills & Overpayment Handling
If a resident bill was already paid prior to allocation reversal, counter-posting `Credit ACCOUNTS_RECEIVABLE` naturally leaves a negative running balance (credit/advance balance) on the resident's ledger view model.

Stage 5 does NOT introduce:
* custom credit-note mechanisms;
* cash/bank refund mechanisms;
* Electricity-specific resident credit tracking.

All accounting consequences remain 100% delegated to the standard Finance double-entry model.

### 7. Idempotency Boundary
An allocation is eligible for reversal only while `allocation.status === 'CONFIRMED'`. Once reversed, `allocation.status` becomes `'REVERSED'`, causing all subsequent reversal requests to be rejected immediately at the domain check.

### 8. Application-Level Compensating Rollback
Multi-participant financial reversals operate under an **application-level compensating rollback** pattern:
* Pre-reversal in-memory snapshots of Finance bills and ledger entries are captured before attempting batch reversals.
* If any participant ledger reversal or bill cancellation fails mid-batch, the Finance repository state is restored from the snapshot, `ElectricityAllocation` status remains `CONFIRMED`, and an error is returned.

### 9. Aggregate Ownership Distinction
* `ElectricityAllocation`: Authoritative aggregate root owning the allocation reversal lifecycle (`CONFIRMED → REVERSED`) and reversal audit metadata.
* `ElectricityBill`: Represents the physical supplier utility invoice received from the supply company. It remains `CONFIRMED` and does NOT have a `REVERSED` lifecycle state.

---

## BR-E-50 — Owner-Absorbed Supplier Bill

A supplier electricity bill may be finalized with:

```text
potentialShares > 0
selectedShares = 0
```

when the operator decides that no resident should bear the bill.

The final allocation outcome is:

```text
OWNER_ABSORBED
```

This is a legitimate business outcome, not an error.

For `OWNER_ABSORBED`:

* no resident electricity receivable is created;
* no resident allocation participant receives a charge;
* the supplier bill remains fully recorded;
* the historical potential-share discovery remains auditable;
* the operator's decision to select zero resident shares remains auditable;
* the supplier bill remains part of the Flat's electricity history;
* the owner/business bears the supplier bill;
* the operational Stay/Resident/Accommodation state is unaffected.

The allocation must still reconcile:

```text
supplierBillAmount = ownerAbsorbedAmount
```

Example:

```text
Supplier Bill = ₹10,000
Potential Shares = 4
Selected Shares = 0

Allocation Outcome = OWNER_ABSORBED
Resident Receivable = ₹0
Owner Absorbed Amount = ₹10,000
```

The system must not create a resident receivable merely because a supplier bill exists.

`OWNER_ABSORBED` must be explicitly selected/confirmed by the operator or otherwise arise from the approved allocation workflow; it must not be silently inferred from missing participants. Setting `selectedShares = 0` during draft review recalculates preview totals to ₹0, but confirmation requires explicit operator invocation (`confirmAllocation` / `confirmOwnerAbsorbed`).

---

## BR-E-51 — Data-Quality Issue Audit Acknowledgement

Data-quality anomalies discovered during historical participant discovery (e.g. `MISSING_RESIDENT_RECORD` where a historical Stay exists without a corresponding Resident master record) are attached to the `ElectricityAllocation` as `AllocationDataQualityIssue` records.

These data-quality issues are not silently ignored or discarded.

Upon explicit allocation confirmation (`RESIDENT_ALLOCATED` or `OWNER_ABSORBED`), all data-quality issues are permanently stamped with audit metadata:

* `acknowledgedBy` (operator ID)
* `acknowledgedAt` (ISO timestamp)
* `operatorNotes` (optional explanation)

The acknowledged data-quality issues become part of the frozen historical allocation snapshot and cannot be altered or removed.

# 21. Historical Traceability

The system should ultimately reconstruct:

```text
Supplier Bill
    ↓
Electricity Allocation
    ↓
Allocation Participant
    ↓
Resident
    ↓
Stay
    ↓
Electricity Charge
    ↓
Ledger Entry
    ↓
Payment
    ↓
Settlement
```

The historical allocation must preserve enough information to answer:

* Which supplier bill was allocated?
* Which Flat?
* Which billing period?
* Which residents were considered?
* Which residents were selected?
* How many potential shares did each have?
* How many shares were selected?
* What amount was allocated?
* Who confirmed it?
* When was it confirmed?
* Which Finance bill/ledger entries resulted?
* Were corrections subsequently made?

---

# 22. Supplier Bill vs Physical Consumption

The two models must remain separate.

## Physical Consumption Engine

```text
Meter
 ↓
Meter Reading
 ↓
kWh
 ↓
Tariff
 ↓
Consumption Analytics
```

## Supplier Bill Allocation Engine

```text
Supplier Bill
 ↓
Flat
 ↓
Billing Period
 ↓
Historical Occupancy
 ↓
Potential Shares
 ↓
Operator Selection
 ↓
Exact Allocation
 ↓
Finance
```

The existing Meter, MeterReading and ElectricityTariff capabilities should be retained for physical consumption and future analytics.

---

# 23. Future Analytical Capability

Keeping the two engines separate allows future analysis of:

### Physical usage

* kWh per Flat
* monthly consumption
* annual consumption
* consumption trends

### Supplier cost

* actual supplier expenditure by Flat
* annual electricity expenditure
* supplier bill trends

### Resident recovery

* electricity recovered per Flat
* electricity cost per share
* historical resident participation
* allocated vs collected electricity amounts

This separation is necessary because physical consumption, supplier cost, and resident recovery are different business facts.

---

# 24. Future Prorated Allocation

Proration is intentionally **not part of the current Ritu PG allocation method**.

The architecture should, however, remain capable of supporting multiple allocation methods in the future.

Conceptually:

```text
Electricity Allocation Method

SHARE_BASED
    ↓
Current Ritu PG method

PRORATED
    ↓
Future method
```

The current method remains:

> One bed = one potential share; operator decides the number of selected shares.

A future prorated method must not alter historical share-based allocations.

Proration will be designed and approved as a separate business-rule decision after the core Supplier Bill Allocation model is completed.

---

# 25. Domain Model — Conceptual

```text
                    ElectricityBill
                         │
                         │ 1
                         │
                         ▼
                ElectricityAllocation
                         │
                         │ 1..many
                         ▼
             AllocationParticipant
                         │
                  ┌──────┴──────┐
                  │             │
             residentId      stayId
```

### ElectricityBill

Represents the actual supplier invoice.

### ElectricityAllocation

Represents the complete operator decision for that invoice.

### AllocationParticipant

Represents the historical Stay's participation and share decision.

---

# 26. Recommended New Domain Capabilities

The existing audit recommends a complementary Supplier Bill Allocation Engine and identifies the following conceptual entities:

* SupplierBill
* ElectricityAllocationRecord
* ParticipantAllocation

It also recommends a historical occupancy query based on Flat and billing-period overlap.

The final implementation names should be chosen after the repository impact assessment, rather than blindly copying preliminary names.

---

# 27. Existing FR-6 — Retain

The following capabilities should remain:

* Meter
* MeterReading
* reading monotonicity validation
* ElectricityTariff
* kWh calculation
* physical consumption analytics
* repository abstraction
* existing Finance delegation pattern
* existing tests where still applicable

The existing implementation already provides these capabilities.

---

# 28. Existing FR-6 — Adapt

The following areas require adaptation:

* Electricity workspace
* electricity application/service layer
* Finance integration for the new allocation workflow
* historical occupancy resolution
* allocation preview/confirmation patterns
* electricity tests
* documentation and governance

---

# 29. Existing FR-6 — No Longer Authoritative for Ritu PG Billing

The following must not remain the authoritative Ritu PG electricity process:

* automatic equal split across current occupants;
* current-status-only participant filtering;
* one Stay = one automatic share;
* tariff-derived amount as the authoritative supplier bill;
* transient ConsumptionAllocation as the only allocation history.

The gap analysis explicitly identifies these as business-model gaps.

---

# 30. New Capability

The following must be introduced:

* Supplier Electricity Bill entity;
* persistent Electricity Allocation;
* persistent Allocation Participant records;
* historical Flat occupancy query;
* potential-share calculation;
* operator share selection;
* exact allocation calculation;
* deterministic remainder handling;
* allocation reconciliation;
* allocation confirmation;
* idempotent Finance posting;
* correction/reversal workflow;
* supplier document attachment;
* historical electricity reporting.

---

# 31. Architectural Boundary

The target architecture is:

```text
                ELECTRICITY DOMAIN
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
 Physical Consumption Engine    Supplier Bill Allocation Engine
          │                             │
 Meter / Reading / Tariff       Supplier Bill / Occupancy / Shares
          │                             │
          ▼                             ▼
       Analytics                    Finance
                                        │
                                        ▼
                                  Resident Ledger
```

Both engines may use:

* Accommodation;
* Flat;
* Bed;
* Stay;
* Finance infrastructure.

Neither engine should corrupt the responsibilities of the other.

---

# 32. Critical Invariants

The implementation must preserve these invariants:

1. Supplier bill amount is authoritative.
2. One bill belongs to one Flat.
3. One bill has one final allocation.
4. Historical occupants are determined from the billing period, not current status.
5. One occupied bed creates one potential share.
6. Two occupied beds create two potential shares.
7. Operator controls selected shares.
8. Potential and selected shares remain distinguishable.
9. Zero-selected historical participants remain auditable.
10. Final allocation equals supplier bill exactly.
11. Currency calculations preserve paise precision.
12. Remainders are deterministic.
13. Confirmed allocations are immutable.
14. Finance charges reference the historical Stay.
15. Checkout does not prevent legitimate financial posting.
16. Alumni status does not erase historical financial relationships.
17. Electricity does not automatically consume the deposit.
18. Posting is idempotent.
19. Corrections preserve original history.
20. Physical consumption and supplier billing remain separate concerns.

---

# 33. Implementation Governance

Before source-code modification:

1. Read the repository documentation.
2. Read the existing FR-6 implementation.
3. Read this approved Business Rules & Domain Design.
4. Produce a read-only implementation impact assessment.
5. Identify:

   * retain;
   * adapt;
   * deprecate;
   * add.
6. Do not modify source code during the assessment.
7. Architect reviews and approves the implementation plan.
8. Only then begin implementation.

This follows the project's established practice of having Gemini read the project documentation and come up to speed before modifying code.

---

# 34. Current Design Status

### CONFIRMED & IMPLEMENTED

The following stages have been fully designed, implemented, code-reviewed, tested (100% passing rate), committed, and synchronized:

* **Stage 1 (Allocation Engine Baseline):** Pure domain integer-paise allocation engine (`calculateShareBasedAllocation`), deterministic remainder distribution (`residentCode` ASC, `stayId ASC`), `ElectricityBill`, `ElectricityAllocation`, and `AllocationParticipant` entities.
* **Stage 2 (Historical Occupancy & Participant Discovery):** Repository date-overlap query (`findStaysByFlatAndPeriodOverlapSync`), maximum concurrent bed share calculation engine, `ParticipantDiscoveryService`, historical resident metadata snapshots.
* **Stage 3 (Supplier-Bill Allocation Service & Finance Posting):** Application service layer (`SupplierBillAllocationService`), explicit confirmation state machine (`DRAFT` -> `RESIDENT_ALLOCATED` or `OWNER_ABSORBED`), `AllocationDataQualityIssue` audit acknowledgement persistence, Finance utility bill creation crediting `AccountType.ELECTRICITY_REVENUE`, Finance reference identity (`referenceType = ELECTRICITY_ALLOCATION`, `referenceId = participantAllocationId`), single-process idempotency check, and application-level compensating rollback on mid-batch billing failures.
* **Stage 4 (Supplier-Bill Allocation UI Workspace & UI ViewModel Coordinator):** Stage 4 acts as the Electricity UI workspace (`ElectricityPage.tsx`) and UI/ViewModel coordinator (`useSupplierBillAllocation.ts`), consuming the existing Stage 1–3 domain/application services. Includes supplier bill entry modal (`SupplierBillEntryModal.tsx`), interactive draft review panel (`DraftAllocationReviewPanel.tsx`), and frozen historical audit table (`AllocationHistoryTable.tsx`). Dual-tab workspace preserving physical sub-meter analytics (FR-6) untouched.

### PARKED FOR LATER

**Prorated Electricity Allocation**

Proration is a future allocation method and is deliberately excluded from the current implementation decision.

---

# 35. Implementation Status

Electricity Stage 1, Stage 2, Stage 3, and Stage 4 are fully implemented, tested, committed, and synchronized.

* Stage 1 Baseline Commit: `69727e956988be4bbbed106324fd188c41f84110`
* Stage 2 Baseline Commit: `49ec2d9ebe7e23993d6b632f70c1d61f5f912747`
* Stage 3 Baseline Commit: `479e4bd549b054d10f0ebadd7ba866ac760e2a30`
* Stage 4 Baseline Commit: `f2044f313f9718016acf1e6e5750962549d1294f` (`feat: implement electricity stage 4 ui workspace`)



