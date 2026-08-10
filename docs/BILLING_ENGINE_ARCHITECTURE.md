# Billing Engine Architecture

**Project:** RPGMS 2.0
**Document:** Billing Engine Architecture
**Status:** Authoritative Target Architecture
**Version:** 1.1
**Last Updated:** 2026-08-10

---

## 1. Purpose

The RPGMS 2.0 Billing Engine is a controlled billing-orchestration capability responsible for identifying eligible Charges, establishing authoritative Billing Run scope, coordinating claim and processing lifecycles, handling failures and recovery, preventing duplicate financial processing, and maintaining a complete business audit trail. The Billing Engine does not own the authoritative financial history of RPGMS; that responsibility remains with the Finance and Ledger capabilities.

The Billing Engine is not merely a calculation routine.

It is a **financial processing system with explicit lifecycle, claim, concurrency, recovery, retry, and audit semantics**.

This document defines the architectural rules that govern the Billing Engine and its interaction with Residents, Stays, Charges, Finance, the Ledger Engine, and operational workflows. It specializes the broader architecture defined by `docs/ARCHITECTURE.md` and does not replace `docs/BUSINESS_RULES.md`, `docs/DOMAIN_MODEL.md`, or `PROJECT_RULES.md`.

---

## 1.1 Architectural Ownership Boundary

The Billing Engine is an **Architectural Service**. It coordinates billing execution but does not become the owner of business concepts or financial truth. This follows the Architectural Service principles in `docs/ARCHITECTURE.md`.

The responsibility boundary is:

```text
Stay
  │
  ├── owns Charges and Stay financial context
  │
  ▼
Billing Engine
  │
  ├── Billing Run
  ├── Billing Operation
  ├── eligibility / scope
  ├── processing claim
  └── retry / recovery orchestration
  │
  ▼
Finance / Bill capability
  │
  ▼
Ledger Engine
  │
  ▼
Unified Stay Ledger
```

The Billing Engine does not become the source of truth for Bills, Payments, Settlements, Deposit Accounts, or Ledger history.

Commercial pricing rules remain within the owning business domains. In particular, the Billing Engine does not own rent rates, Commercial Agreements, billing-anniversary rules, electricity allocation rules, laundry rules, deposit rules, or settlement rules. It coordinates their execution when those rules make a Charge eligible for billing.

---

# 2. Constitutional Principles

The following principles are fundamental to the Billing Engine.

### 2.1 Preview is informational

A Billing Preview never establishes a financial claim.

Preview represents the state of the system at the time the Preview is generated.

The Preview may become stale before confirmation.

---

### 2.2 Confirmation is authoritative

When the operator confirms a Billing Run, RPGMS performs a fresh authoritative eligibility calculation.

The result of the original Preview is not treated as authoritative.

The authoritative claim boundary is established only after this fresh validation.

---

### 2.3 Claim before financial processing

A Charge must be authoritatively claimed before it can be submitted for Bill creation and corresponding financial posting. The Bill and Ledger remain financial records owned by the Finance/Ledger capabilities.

Once claimed, the charge is protected from competing Billing Runs.

---

### 2.4 First successful claim wins

When multiple Billing Runs overlap, the first successful authoritative claim establishes ownership of the charge.

A later Billing Run must revalidate and exclude charges already claimed or financially resolved.

The later Billing Run must not fail merely because some of its candidates have already been claimed.

---

### 2.5 Billing Runs are immutable historical records

A completed Billing Run must never be reopened and rewritten.

Corrections are handled through appropriate financial workflows such as adjustment, reversal, recovery, or retry.

A Retry Run is a new Billing Run, not a modification of the original.

---

### 2.6 Financial integrity takes precedence over operational convenience

A technical failure, timeout, crash, or uncertain result must never cause RPGMS to assume that a financial commitment did not occur.

When the financial outcome is uncertain, the operation enters `RECOVERY_REQUIRED`.

---

### 2.7 Audit history is append-only

Significant financial and authorization events are recorded as immutable business audit events.

Historical events are never edited or deleted to make the current state appear cleaner.

---

# 3. Billing Period

The Billing Period is explicitly selected by the operator.

It is **not hard-coded**.

Example:

```text
From: 01-Aug-2026
To:   12-Aug-2026
```

The selected period remains part of the identity and history of the Billing Run.

---

## 3.1 Billing Period does not imply exclusive processing

Billing Runs may overlap.

For example:

```text
BR-022   01-Aug → 10-Aug
BR-023   01-Aug → 12-Aug
```

This is permitted.

Duplicate prevention is achieved through charge eligibility and authoritative claiming rather than by prohibiting overlapping periods.

---

## 3.2 Full selected period is evaluated

When an operator selects:

```text
01-Aug → 12-Aug
```

RPGMS evaluates the complete period.

It does not silently transform the period into only the currently unbilled portion.

Charges already financially resolved are excluded during eligibility/claim processing.

Therefore:

```text
01-Aug → 10-Aug
already billed
       ↓
excluded

11-Aug → 12-Aug
still eligible
       ↓
included
```

The Billing Run nevertheless remains:

```text
01-Aug → 12-Aug
```

for audit and historical purposes.

### 3.3 Billing Period is not the Rent Cycle

The Billing Period defines the business-date scope evaluated by a Billing Run. It does not replace or redefine the commercial billing cycle of a Stay.

RPGMS currently defines anniversary-based billing as the default commercial billing model. A Billing Run may evaluate a broader or overlapping historical date range to discover eligible Charges without changing the Stay's billing anniversary.

Any rent-cycle change, prorated transition adjustment, or Commercial Amendment remains governed by the applicable business rules and is not invented by the Billing Engine.

---

# 4. Business Date, Entry Date and Eligibility Cutoff

RPGMS distinguishes three concepts.

### Business Date

The date to which a charge belongs.

Example:

```text
Laundry Date = 10-Aug
```

The Business Date determines whether the charge falls within the selected Billing Period.

### Entry Date

The date the charge was entered into RPGMS.

Example:

```text
Laundry entered = 14-Aug
```

Entry Date does not determine the charge's Billing Period.

### Eligibility Cutoff

The date/time at which the Billing Run performs its authoritative eligibility calculation and claim preparation.

Eligibility is determined from authoritative data available and valid at this cutoff. The operator may generate a Preview earlier, but the Preview timestamp is not the eligibility cutoff.

---

## 4.1 Late-entered charges

A charge whose Business Date falls inside the selected Billing Period may still be billed if it is entered into RPGMS after an earlier Billing Run, provided it is available and eligible when a later Billing Run is confirmed.

Example:

```text
Laundry Date:       10-Aug
Entered:            14-Aug

Billing Run:
01-Aug → 12-Aug
Confirmed:          15-Aug
```

The charge may be included.

If the charge did not exist when an earlier Billing Run was confirmed, it is not considered retrospectively processed by that earlier run.

A later Billing Run can evaluate the same historical period and pick it up.

---

# 5. Billing Run Lifecycle

A Billing Run follows a controlled lifecycle:

```text
CREATE
   ↓
PREVIEW
   ↓
CONFIRM
   ↓
AUTHORITATIVE REVALIDATION
   ↓
CLAIM
   ↓
PROCESS
   ↓
FINAL RESULT
```

Depending on circumstances, exception paths include:

```text
FAILED
CLAIM_FAILED
RECOVERY_REQUIRED
NOT_PROCESSED
RETRY
```

---

# 6. Billing Preview

The Preview is an informational snapshot.

It does not establish a financial claim.

The operator can review the Preview and may wait before confirmation.

The Preview must not be treated as guaranteed final billing output.

---

## 6.1 Preview default level

The default operator view is **Resident/Stay summary**.

The operator should not initially be presented with every individual charge line.

The summary should include operational context:

* Resident
* Stay
* Flat
* Beds / Bed Allocations
* Amount
* Billing status/outcome

Charge-level details are available through drill-down.

---

## 6.2 Charge detail

The expanded Resident/Stay view may show:

* Rent
* Electricity
* Laundry
* Other applicable charges
* Rate
* Quantity
* Amount
* Included/excluded status
* Hold status
* Exclusion reason

This provides transparency without overwhelming the default operational view.

---

# 7. Confirmation

When the operator confirms a Billing Run:

1. RPGMS performs a fresh eligibility calculation.
2. The original Preview is compared with the new authoritative result.
3. Material changes are identified.
4. If no material change exists, the authoritative claim process proceeds.
5. If a material change exists, the operator must review and explicitly reconfirm.

The original Preview remains preserved for audit purposes.

---

# 8. Material Change

A material change is primarily defined by a change in **financial scope or financial outcome**, not merely by the size of the rupee difference.

The following are always material:

* Resident/Stay added.
* Resident/Stay removed.
* Charge added.
* Charge removed.
* Expected billable financial amount changes.
* Previously held charge becomes billable.
* Previously billable charge becomes excluded.
* Any other change that alters the financial scope or outcome.

A small monetary change may therefore still be material.

Example:

```text
Preview:
44 Residents
₹2,91,450

Confirmation:
45 Residents
₹2,91,600
```

The ₹150 difference is small, but a Resident/Stay was added, so the change is material.

---

# 9. Material Change Reconfirmation

When a material change is detected:

```text
Authoritative recalculation
        ↓
Material change
        ↓
Show differences
        ↓
Updated Preview
        ↓
Explicit operator reconfirmation
```

The operator may:

* Review the changes.
* Reconfirm the updated result.
* Cancel/abandon the unconfirmed run.

If the operator does not reconfirm:

* The Billing Run remains unconfirmed.
* No claim is established.
* No Bill is created.
* No financial effect occurs.

---

# 10. Billing Operation

A Billing Run contains individual Billing Operations.

A Billing Operation represents the controlled processing scope for a Resident/Stay.

The Billing Operation records the charges included in its authoritative scope.

Once its claim boundary is established, that scope becomes immutable.

---

# 11. Atomicity and Financial Transaction Boundary

A Billing Operation is atomic over its **newly established processing scope**.

If the operation contains:

```text
LE-101
LE-102
LE-103
```

that scope is processed as one Billing Operation.

A Retry Run is a new Billing Run and establishes a fresh Billing Operation after revalidation. The original Billing Operation remains unchanged.

The implementation must establish an appropriate application transaction boundary so that claim acquisition and the resulting financial processing cannot create a state in which the same Charge is simultaneously available to competing Billing Operations and financially committed by more than one operation. The exact database transaction, locking, constraint, queue, or compensating mechanism is an implementation decision, but the business invariant is mandatory.

The financial commitment itself remains governed by the Finance/Ledger architecture: Bill creation and corresponding Ledger posting must preserve the existing financial atomicity rules. Where the system cannot determine whether financial commitment occurred, the Billing Operation enters `RECOVERY_REQUIRED` rather than releasing the Claim.

---

# 12. Claim Boundary

The claim boundary is the point at which RPGMS authoritatively associates eligible charges with a specific Billing Operation.

Before claim:

```text
Charge → eligible
```

After claim:

```text
Charge → exclusively associated with Billing Operation
```

A Preview never establishes a claim.

Only authoritative confirmation and claim processing establish the processing claim.

A Claim is a **Billing Engine processing state**, not financial truth. It means that a specific Billing Operation has exclusive responsibility for processing the Charge. It does not by itself mean that the Charge has been billed, paid, settled, or posted as final financial history.

---

# 13. Duplicate Prevention

A charge already claimed or financially resolved by another Billing Operation is unavailable to a competing Billing Run.

This remains true even when Billing Periods overlap.

Example:

```text
BR-022
01-Aug → 10-Aug
       ↓
LE-101 claimed

BR-023
01-Aug → 12-Aug
       ↓
LE-101 encountered
       ↓
Already claimed/resolved
       ↓
Exclude
```

The second run continues processing its remaining valid scope.

---

# 14. Claimed vs Billed

`CLAIMED` and `BILLED` are distinct concepts.

### CLAIMED

The charge has been successfully associated with a Billing Operation and is protected from competing processing.

### BILLED

The financial bill containing the charge has been successfully finalized.

These states must not be collapsed.

This distinction is essential for handling crashes and uncertain financial outcomes.

---

# 15. Concurrent Billing Runs

Multiple Billing Runs may be created and Previewed concurrently.

Two operators may therefore initially see the same charge as eligible.

Example:

```text
Operator A → BR-022 → Preview
Operator B → BR-023 → Preview
```

Both may see:

```text
S-147 → eligible
```

At confirmation, the authoritative claim determines ownership.

The first successful claim wins.

The later run must revalidate and exclude the already claimed charge.

The second run should continue processing other eligible charges.

---

# 16. Failure Outcomes

A Billing Operation may produce several outcomes.

### SUCCESS

Financial processing completed successfully.

### NO_CHARGES

The operation had no charges requiring financial processing.

This is a valid successful outcome.

### NOT_PROCESSED

The operation was never attempted.

It is not considered a failure.

### FAILED

Processing was attempted but failed with a known failure outcome.

### CLAIM_FAILED

The operation could not establish its required claim.

### RECOVERY_REQUIRED

The financial outcome cannot safely be established.

This is an unresolved financial state and requires recovery.

---

# 17. `NOT_PROCESSED`

`NOT_PROCESSED` means the Billing Operation was never attempted.

It is therefore not a Retry candidate.

Example:

```text
Stop Processing
      ↓
Pending operations
      ↓
NOT_PROCESSED
```

These items return to the normal eligibility pool.

A future Billing Run performs a fresh eligibility calculation.

The old Preview and old eligibility result are not carried forward.

---

# 18. Deposit Boundary

Security Deposit is an independent financial account and is not ordinary recurring Billing Run scope. Deposit receipts, additional contributions, partial returns, adjustments, forfeitures, and refunds remain governed by the Deposit and Finance/Settlement architecture.

A future business rule may explicitly define a deposit-related billing workflow, but the Billing Engine must not infer that deposit transactions are ordinary recurring Charges merely because Security Deposit appears among the project's broader Charge classifications.

---

# 19. Retry Architecture

A Retry Run is a complete, independent Billing Run.

It is not a modification of the original Billing Run.

Example:

```text
BR-022
   ↓
BR-023
```

where:

```text
BR-023.retry_of = BR-022
```

The Retry Run has its own:

* Billing Run ID
* operator
* Preview
* confirmation
* authoritative claim
* Billing Operations
* status
* audit history

---

# 20. Retry Eligibility

Normal retry candidates include:

```text
CLAIM_FAILED
FAILED
```

`RECOVERY_REQUIRED` is not directly retryable.

It must first pass through the recovery workflow.

---

# 21. Retry Preview

Retry Preview is informational.

It performs a current informational revalidation.

It does not establish a claim.

At final confirmation, RPGMS performs another authoritative revalidation.

Therefore:

```text
Retry Preview
      ↓
Operator confirms
      ↓
Fresh authoritative revalidation
      ↓
Claim
```

---

# 22. Retry Partial Revalidation

A Retry Run revalidates the charges in the original failed scope.

Charges may have changed since the original failure.

For example:

```text
LE-101 → already billed
LE-102 → eligible
LE-103 → cancelled
```

The retry may establish a new scope containing:

```text
LE-102
```

Excluded charges receive explicit exclusion reasons.

If no eligible charges remain:

```text
NO_CHARGES / NOTHING_TO_RETRY
```

No zero-value Bill is created merely to represent the retry.

---

# 23. Retry Operator Selection

The operator does not manually select or deselect individual eligible charges.

RPGMS determines financial eligibility according to its rules.

The Retry Preview is therefore a review surface, not a manual bill-construction tool.

If an operator needs to defer an otherwise eligible charge, the appropriate Hold/Defer workflow must be used.

---

# 24. Retry Authorization

Operators may initiate controlled retries for:

* `FAILED`
* `CLAIM_FAILED`

Operators may not:

* Resolve `RECOVERY_REQUIRED`
* Release a recovery claim
* Perform financial overrides

Recovery and financial override workflows require the explicit permissions defined by the Authorization Service.

---

# 25. Retry Lineage

Retry lineage is explicit and permanent.

Example:

```text
BR-022
   ↓
BR-023
   ↓
BR-024
```

Each Billing Run remains independently auditable.

Original runs are never reopened or rewritten.

Multiple retry generations are permitted when genuinely necessary.

---

# 26. Repeated Failures

There is no hard maximum retry count.

A configurable repeated-failure threshold is used to surface persistent problems.

Crossing the threshold does not automatically prevent further retry.

Example:

```text
1st failure → normal retry
2nd failure → normal retry
3rd failure → prominent warning
4th failure → still possible, but flagged
```

The complete retry lineage and failure history remain visible.

The threshold is an administrative/system configuration, not an ordinary operator setting.

---

# 27. Retry Run Final Status

Retry Runs use the same Billing Run status semantics as normal Billing Runs.

Examples:

```text
All successful / no-charge
        ↓
COMPLETED
```

```text
Some successful + some failed
        ↓
PARTIALLY_COMPLETED
```

```text
Nothing successfully processed and failures remain
        ↓
FAILED
```

`RECOVERY_REQUIRED` remains an unresolved financial outcome.

`NOT_PROCESSED` prevents the run from being considered fully completed when scoped work was never attempted.

---

# 28. Recovery

Recovery exists to resolve uncertainty about the financial outcome of an already claimed Billing Operation.

Recovery is **not another billing attempt**.

Example:

```text
CLAIMED
   ↓
PROCESSING
   ↓
Crash / timeout / uncertain result
   ↓
RECOVERY_REQUIRED
```

---

# 29. Claim Protection During Recovery

Once a charge is claimed, it remains protected until the original Billing Operation reaches a definitive financial outcome.

A second Billing Run cannot claim it merely because the Bill is not yet visible.

A timeout, crash, or technical error is never sufficient by itself to release a claim.

---

# 30. Recovery Outcomes

A `RECOVERY_REQUIRED` operation can ultimately resolve to:

### Financial Success

Evidence establishes that the Bill was successfully created.

The existing Bill is linked to the original Billing Operation.

No second Bill is created.

### No Financial Commitment

Evidence establishes that no financial commitment occurred.

The original claim may then be released through the authorized recovery process.

The operation becomes eligible for controlled retry.

### Still Uncertain

Evidence is insufficient or conflicting.

The operation remains:

```text
RECOVERY_REQUIRED
```

The claim remains protected.

---

# 31. Recovery Authorization

Only users granted the explicit financial recovery permission may resolve `RECOVERY_REQUIRED`. The Billing Engine does not hard-code a role name; the Authorisation Service determines which roles or users possess that permission.

Operators may:

* View the recovery case.
* Review evidence.
* View the Resident/Stay.
* View the Flat and Bed.
* View charges.
* View Billing Run and Billing Operation.
* View the processing timeline.

Operators cannot:

* Resolve recovery.
* Release claims.
* Retry unresolved recovery cases.

---

# 32. Recovery Workbench

RPGMS must provide a consolidated Recovery Workbench.

The Workbench automatically assembles a read-only evidence package.

It should include:

### Operation identity

* Billing Run ID
* Billing Operation ID
* Resident
* Stay
* Flat
* Beds / Bed Allocations
* Current status

### Immutable financial scope

* Charge ID
* Charge type
* Business date
* Quantity
* Rate
* Amount
* Total operation amount

### Business processing timeline

Examples:

```text
Operation created
Charges claimed
Processing started
Financial processing initiated
Processing interrupted
Recovery Required
```

### Financial reconciliation

The Workbench should automatically check:

* Bill existence
* Bill ID
* Finalization status
* Bill amount
* Bill-line existence
* Link to Billing Operation
* Charge financial resolution

---

# 33. Recovery Recommendation

RPGMS may provide a recommended recovery resolution.

Examples:

```text
Bill found and correctly linked
→ Recommended: FINANCIAL SUCCESS
```

or:

```text
No Bill
No finalized bill lines
No financial commitment
→ Recommended: NO FINANCIAL COMMITMENT
```

or:

```text
Conflicting / incomplete evidence
→ Recommended: REQUIRES INVESTIGATION
```

The recommendation is advisory.

The authorized user makes the final resolution through the Authorisation Service.

---

# 34. Recovery Evidence Authority

`NO_FINANCIAL_COMMITMENT` may be resolved using RPGMS's internal evidence when that evidence is conclusive.

An external reconciliation reference is not mandatory in every case.

However, where internal evidence is inconclusive, conflicting, or indicates possible external financial activity, the case remains `RECOVERY_REQUIRED` until further reconciliation is performed.

External/manual evidence may be attached or referenced where required.

---

# 35. Recovery Audit

Every recovery resolution must record:

* Resolver
* Timestamp
* Resolution
* Reason
* Evidence/reference used where applicable
* Original Billing Operation
* Affected charges

Recovery evidence itself is read-only and cannot be rewritten by the resolver.

The resolution creates a new immutable business audit event.

---

# 36. Billing Run Cancellation

Cancellation is permitted only before the authoritative claim boundary.

### Unconfirmed Run

An unconfirmed Preview Run may be cancelled/abandoned.

No financial claim exists.

No Bill is created.

The cancellation remains in the audit history.

---

## 36.1 Confirmed/Processing Run

Once the run has crossed the claim boundary, the operator cannot cancel it.

The available action is:

```text
STOP PROCESSING
```

not Cancel.

---

## 36.2 Completed Run

Completed, partially completed, failed, or recovery-related historical runs are not cancelled.

Corrections use appropriate financial workflows.

---

# 37. Graceful Stop

`Stop Processing` is a graceful operation.

When requested:

1. No new Billing Operations are started.
2. Operations already in flight are allowed to finish.
3. Each in-flight operation must reach a definitive outcome or `RECOVERY_REQUIRED`.
4. Operations that never started become `NOT_PROCESSED`.
5. Claims are never released merely because processing was stopped.
6. The stop event is recorded in the audit history.

Example:

```text
S-101 → SUCCESS
S-102 → SUCCESS
S-103 → PROCESSING
S-104 → PENDING
S-105 → PENDING
```

After Stop:

```text
S-103 → allowed to finish
S-104 → NOT_PROCESSED
S-105 → NOT_PROCESSED
```

---

# 38. Business Audit Trail

The Billing Engine maintains a business-oriented audit trail.

Business audit events include significant events such as:

```text
RUN_CREATED
RUN_PREVIEWED
RUN_CONFIRMED
RUN_PROCESSING_STARTED
RUN_STOP_REQUESTED
RUN_STOPPED
RUN_COMPLETED
RUN_FAILED

OPERATION_CLAIMED
OPERATION_COMPLETED
OPERATION_FAILED
OPERATION_RECOVERY_REQUIRED
OPERATION_NOT_PROCESSED

RETRY_INITIATED
RECOVERY_RESOLVED
HOLD_PLACED
HOLD_RELEASED
```

The exact event catalogue may be expanded during implementation without changing the constitutional principles in this document.

---

# 39. Business Audit vs Technical Logs

Business audit and technical logging are separate.

### Business Audit

Answers:

* What happened?
* Who did it?
* When?
* Why?
* What financial decision occurred?

### Technical Logging

May contain:

* API requests
* Database errors
* Network failures
* Worker retries
* Infrastructure diagnostics
* Internal technical details

Technical logs should not pollute the operator-facing financial audit history.

Stable Run, Operation, and Transaction identifiers should allow correlation between the two.

---

# 40. Audit Immutability

Business audit events are append-only.

If an earlier event needs clarification, a new event is created.

Historical events are not edited to replace the original record.

Example:

```text
Event 1
Hold placed
Reason: "Dispute"

Event 2
Clarification
Reason: "Quantity dispute"
```

The original event remains visible.

---

# 41. Billing Run Operator UI

The Billing Run UI should follow the business lifecycle:

```text
CREATE
   ↓
PREVIEW
   ↓
CONFIRM
   ↓
PROCESS
   ↓
REVIEW RESULT
   ↓
RESOLVE EXCEPTIONS
   ↓
RETRY / RECOVER / NEXT RUN
```

The UI must not reduce Billing to a simple:

```text
Run Billing → Wait → Result
```

The operator must always be able to understand:

* What is about to happen?
* What has happened?
* What remains?
* What requires attention?

---

# 42. Billing Run List

The Billing Run list should provide concise operational information including:

* Billing Run ID
* Billing Period
* Run Type
* Created By
* Created At
* Status
* Resident/Stay count
* Amount billed
* Exceptions
* Retry relationship

---

# 43. Billing Preview UI

The Preview should show:

```text
Billing Period
Residents/Stays
Billable
No Charges
On Hold
Exceptions
Expected Billing Amount
```

Resident/Stay rows should provide:

* Resident
* Stay
* Flat
* Beds / Bed Allocations
* Amount
* Status

Charge details are available through drill-down.

---

# 44. Processing UI

During processing, the operator should see meaningful progress.

Example:

```text
Processed: 41 / 50

Success:          39
No Charges:        1
Failed:            1
Recovery:          0
Pending:           9
```

The UI should provide access to individual Resident/Stay outcomes.

---

# 45. Exceptions

Exceptions are first-class operational information.

The UI should surface:

* Resident
* Stay
* Flat
* Bed
* Outcome
* Failure reason
* Recovery requirement
* Retry availability

The operator should not have to search through the complete run to discover failures.

---

# 46. Final Run Status

At completion, the operator should receive a concise summary:

```text
Successful
No Charges
Failed
Recovery Required
Not Processed
Amount Billed
```

Relevant actions may include:

```text
View Exceptions
View Bills
View Audit
Create Retry Run
```

The available actions depend on the run's actual state.

---

# 47. Retry UI

Retry follows the same Preview → Confirm → Revalidate → Claim principle as a normal Billing Run.

The Retry Preview must clearly show:

* Original Billing Run
* Retry Run
* Candidate Resident/Stays
* Original outcome
* Current eligibility
* Included charges
* Excluded charges
* Exclusion reasons

Eligible charges cannot be arbitrarily deselected by the operator.

---

# 48. Financial Safety Invariants

The following invariants are mandatory:

### Invariant 1

A charge cannot be financially billed twice.

### Invariant 2

A claimed charge cannot be claimed by another Billing Operation.

### Invariant 3

A Preview cannot establish a financial claim.

### Invariant 4

Confirmation always performs fresh authoritative validation.

### Invariant 5

A timeout or crash cannot by itself release a claim.

### Invariant 6

`RECOVERY_REQUIRED` charges remain protected.

### Invariant 7

A Bill already created during an uncertain operation must never be recreated.

### Invariant 8

Original Billing Runs and Billing Operations remain historically immutable.

### Invariant 9

`NOT_PROCESSED` is not treated as a failed operation requiring Retry.

### Invariant 10

Retry creates a new Billing Run and new Billing Operations.

### Invariant 11

Overlapping Billing Periods are permitted; duplicate financial claiming is not.

### Invariant 12

Late-entered charges can be captured by a later Billing Run covering the relevant Business Date.

---

# 49. State Relationship

The overall financial processing model can be represented as:

```text
ELIGIBLE
   │
   │ authoritative claim
   ▼
CLAIMED
   │
   ▼
PROCESSING
   │
   ├───────────────┬───────────────────┐
   ▼               ▼                   ▼
SUCCESS          FAILED          RECOVERY_REQUIRED
   │               │                   │
   │               │                   ├── Financial Success
   │               │                   │       ↓
   │               │                   │    SUCCESS
   │               │                   │
   │               │                   └── No Financial Commitment
   │               │                           ↓
   │               │                       Claim Release
   │               │                           ↓
   │               │                       RETRYABLE
   │               │
   │               └── Controlled Retry
   │
   └── Finished

NOT_PROCESSED
   │
   └── Fresh eligibility in future Billing Run
```

---

# 50. Retry Relationship

Retry lineage must remain visible:

```text
BR-022
  │
  └── BR-023
        │
        └── BR-024
```

Each run is independent and immutable.

The lineage explains why a later run exists without rewriting the original financial history.

---

# 51. Implementation Principle

The Billing Engine must be implemented from these architectural rules.

Implementation details such as:

* database table structure;
* indexes;
* constraints;
* transaction mechanisms;
* API contracts;
* queue/worker architecture;
* exact UI components;

must conform to the financial invariants in this document.

Implementation convenience must not override these rules.

Where implementation choices appear to conflict with the constitutional rules, the conflict must be resolved before code is written.

---

# 52. Governance

This document is the authoritative **target architecture** for the Billing Engine. It specializes `docs/ARCHITECTURE.md` and must remain consistent with `docs/BUSINESS_RULES.md`, `docs/DOMAIN_MODEL.md`, and `PROJECT_RULES.md`.

Significant Billing Engine architectural or financial-processing decisions made during implementation must be evaluated against this document.

If a future decision changes one of the constitutional principles, this document must be updated before the corresponding implementation is considered complete.

Any significant architectural change should also be reflected in the project's broader:

* `docs/ARCHITECTURE.md`
* `PROJECT_RULES.md`
* `docs/DECISIONS.md`

as appropriate.

---

# 53. Open Design Items

The following items have **not yet been fully specified** and should not be assumed by implementation:

1. Exact Billing Run status enum and whether additional intermediate statuses are required.
2. Exact Billing Operation status enum.
3. Exact Charge-level processing status model.
4. Exact database schema, uniqueness constraints, and persistence model implementing the Claim boundary.
5. Exact implementation mechanism for atomic Claim acquisition under concurrent transactions.
6. Exact definition of the configurable repeated-failure threshold and default value.
7. Exact authorization matrix for Hold/Defer operations.
8. Exact authorization matrix for financial overrides and recovery-related evidence attachments.
9. Exact material-change comparison algorithm for aggregate changes that do not otherwise alter scope.
10. Exact recovery evidence sources and reconciliation interfaces available from the Finance subsystem.
11. Exact handling of partially committed multi-Charge operations at the database/application transaction level.
12. Exact UI component and API design.
13. Exact implementation interfaces between Billing Engine, Finance/Bill processing, Settlement, and the Ledger Engine.
14. Exact treatment of future Charge types beyond the currently established business rules.

These are implementation/design follow-up items and must be resolved before the affected functionality is implemented. They must not be used to weaken the financial invariants already locked by this document.

# 54. Constitutional Summary

The RPGMS 2.0 Billing Engine follows one central principle:

-  **Calculate openly, validate freshly, claim atomically, process safely, recover explicitly, retry through new runs, and preserve everything in an immutable audit trail.**

The Billing Engine must always be able to answer:

-  **What was supposed to be billed?**
-  **What was actually claimed?**
-  **What was financially committed?**
-  **What failed?**
-  **What remains unresolved?**
-  **Who made each consequential decision?**
-  **Can the same charge ever be billed twice?**

The answer to the final question must always be:
 - **No.**