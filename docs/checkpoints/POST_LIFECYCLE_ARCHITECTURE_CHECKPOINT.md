# RPGMS 2.0 — POST-LIFECYCLE ARCHITECTURE CHECKPOINT & FORWARD PLAN

**Checkpoint Date:** 8 August 2026
**Repository Baseline:** `abb9a0dd8d84b0d39f1afc631092d5134f1f0599`
**Branch:** `feature/application-shell`
**Baseline Status:** Local HEAD and `origin/feature/application-shell` identical; working tree clean.

---

# 1. Purpose of This Checkpoint

RPGMS 2.0 has now completed an end-to-end Resident Lifecycle validation covering:

Reservation → Admission → Active Stay → Notice → Checkout → Post-checkout Financial Activity.

The exercise was deliberately performed before continuing with further module development.

The purpose was to determine whether:

1. the fundamental domain boundaries are sound;
2. Resident, Stay, Accommodation and Finance maintain correct separation;
3. checkout and financial settlement are correctly treated as different lifecycle events;
4. post-checkout financial activity remains possible;
5. the deposit model is sufficiently extensible;
6. the Electricity implementation reflects the actual Ritu PG business model;
7. existing capability gaps represent architectural defects or incremental capability gaps; and
8. RPGMS 2.0 is ready for continued incremental development.

The checkpoint evidence indicates that the **core architecture is sound and does not require foundational redesign**.

---

# 2. Executive Architectural Verdict

## FOUNDATION: READY

The Resident Lifecycle foundation is sufficiently sound to support further incremental development.

The most important architectural boundaries have survived practical lifecycle testing.

In particular:

* Resident identity is distinct from Stay identity.
* Stay represents the operational occupancy relationship.
* Checkout terminates the Stay and releases accommodation.
* Checkout does not terminate the financial relationship.
* Post-checkout charges remain possible.
* Financial transactions remain attributable to the relevant Stay and Resident.
* Accommodation and financial lifecycle are not improperly coupled.
* The existing Electricity implementation can coexist with a future Ritu PG supplier-bill allocation capability.

The checkpoint therefore does **not** justify a foundational architectural rewrite.

---

# 3. Fundamental Invariants Established

The following principles should now be treated as established architectural invariants.

## 3.1 Resident and Stay Are Different Identities

The system must never assume:

`residentId == stayId`

A Resident may have multiple Stay relationships over the lifetime of the Resident.

The lifecycle testing explicitly confirmed distinct Resident and Stay identifiers.

---

## 3.2 Stay Represents Operational Occupancy

The Stay represents the operational relationship between:

Resident → Accommodation → Occupancy period.

The operational lifecycle is:

Reservation
→ Admission
→ ACTIVE Stay
→ ON_NOTICE
→ CHECKED_OUT

Checkout terminates the Stay.

---

## 3.3 Checkout Does Not End the Financial Relationship

This is one of the most important conclusions from the lifecycle test.

The rule is:

> **Checkout ends Stay, not financial relations.**

After checkout:

* the Stay remains historically available;
* accommodation is released;
* financial obligations remain open;
* deposits remain traceable;
* post-checkout charges remain possible;
* settlement may still occur.

This behaviour was empirically demonstrated during the lifecycle test.

---

## 3.4 Financial Relationship Ends at Final Settlement / Alumni

The financial relationship must not be considered closed merely because the Resident has checked out.

The intended conceptual lifecycle is:

Checkout
→ financial relationship remains OPEN
→ post-checkout charges / adjustments
→ final settlement
→ deposit adjustment/refund
→ financial relationship CLOSED
→ Resident becomes ALUMNI

`ALUMNI` therefore represents more than an operational status. It represents completion of the Resident's relationship with the PG from the financial perspective.

This distinction should be explicitly preserved in future architecture and business-rule documentation.

---

# 4. Lifecycle Validation Findings

## 4.1 Reservation

**Status: VALIDATED**

Reservation creation and conversion to Admission operate correctly.

The Reservation retains its identity and is transitioned to `CONVERTED` after admission.

---

## 4.2 Admission

**Status: VALIDATED**

Admission successfully establishes:

* Resident
* Stay
* Commercial Agreement
* Bed Allocation
* initial financial obligations

The semantic separation of Resident ID and Stay ID was confirmed.

---

## 4.3 Accommodation

**Status: READY WITH CAPABILITY GAP**

The underlying Stay model supports multiple beds through:

`allocatedBedIds: string[]`

However, the operator workflow currently lacks a post-admission mechanism for assigning an additional vacant bed to an existing Stay.

This is presently classified as a:

**UI / WORKFLOW CAPABILITY GAP**

rather than a foundational domain defect.

No domain/API bypass should be used to conceal this gap.

---

## 4.4 Rent and Payment

**Status: VALIDATED**

Rent billing, payment and ledger attribution function correctly.

Double-entry ledger integrity was preserved.

Financial records retain appropriate attribution through the Stay and Resident relationship.

---

## 4.5 Deposit

**Status: ARCHITECTURALLY USABLE, BUSINESS CAPABILITY INCOMPLETE**

The current system supports the basic deposit relationship, including:

* deposit obligation;
* token adjustment;
* deposit collection;
* deposit held after checkout;
* deposit traceability.

However, the actual Ritu PG deposit lifecycle is richer.

The deposit may:

* be collected in parts;
* receive additional contributions;
* be partially returned during the Stay;
* remain held after checkout;
* be used against post-checkout obligations;
* be adjusted during final settlement;
* be partially or fully refunded;
* finally close as part of settlement.

The deposit should therefore be treated as an **account-like financial relationship with a history of movements**, rather than merely a single balance field.

This is a capability gap, not currently a foundational blocker.

---

## 4.6 Notice

**Status: VALIDATED**

Notice changes the Stay state without:

* releasing accommodation;
* refunding deposit;
* closing financial relations;
* converting the Resident to Alumni.

---

## 4.7 Checkout

**Status: VALIDATED**

Checkout correctly:

* ends the operational Stay;
* releases the bed;
* preserves the Resident;
* preserves the financial relationship;
* preserves deposit and advance balances.

This is a critical architectural success.

---

## 4.8 Post-checkout Financial Activity

**Status: VALIDATED**

A post-checkout damage charge was successfully posted against the completed Stay.

The operation did not:

* reopen the Stay;
* reoccupy accommodation;
* create a new Stay;
* automatically settle the financial relationship.

This establishes that the Finance architecture is appropriately decoupled from operational occupancy.

---

## 4.9 Settlement / Alumni

**Status: FOUNDATION PRESENT, CAPABILITY INCOMPLETE**

The architecture contains the necessary concepts, but the complete real-world Ritu PG settlement lifecycle still requires further validation and capability work.

Future work must preserve:

Checkout
≠
Settlement

and:

Settlement completion
→ financial relationship closure
→ Alumni

---

# 5. Electricity — Major Business Model Finding

The FR-6 Electricity implementation is not fundamentally wrong.

It implements a different electricity capability.

## Current FR-6 model

The current implementation is primarily:

**Meter → Reading → Consumption → Tariff → Allocation → Ledger**

It provides useful capabilities including:

* meter registration;
* meter readings;
* consumption calculation;
* monotonicity validation;
* tariff calculation;
* ledger integration;
* consumption history.

---

# 6. Ritu PG Electricity Business Model

The actual Ritu PG process is:

**Supplier Bill → Flat → Billing Period → Occupancy Activity → Operator Selection → Shares → Allocation → Confirmation → Ledger**

The supplier's actual bill is the starting financial fact.

The system should show the operator the relevant occupancy history for the flat during that billing period.

The operator then decides:

* who participates;
* who is excluded;
* how many shares each participant receives.

The system supports the decision; it does not replace the operator's business judgment.

---

# 7. Electricity Requirements Established

The future Ritu PG electricity capability must support:

### Supplier Bill

* actual supplier bill amount;
* flat;
* billing period;
* supplier bill identity;
* historical bill record.

### Occupancy Activity

The operator must be able to see:

* who occupied the flat;
* who joined;
* who left;
* when they joined;
* when they left;
* residents who checked out during the billing period.

A resident who checked out during the billing period may still be included in the electricity allocation.

Therefore:

> Current Stay status must not be the sole determinant of electricity participation.

### Operator Selection

The operator must be able to:

* select a participant;
* exclude a participant;
* review potential participants;
* override the automatically suggested participant list.

### Share Model

A Resident occupying two beds may produce:

**two potential shares**

but the operator may choose:

* one share; or
* two shares.

Therefore:

> One Stay does not automatically equal one electricity share.

Electricity shares must be an explicit allocation concept.

### Confirmation

The operator must review and confirm the allocation before financial posting.

### History

The system should preserve:

Supplier Bill
→ Flat
→ Billing Period
→ Occupancy Activity
→ Potential Participants
→ Selected Participants
→ Share Counts
→ Allocation Amount
→ Confirming Operator
→ Ledger Posting

This history is required for auditability and future analysis.

---

# 8. Electricity Architectural Direction

The existing meter/consumption subsystem should **not be discarded**.

The preferred future architecture is to allow two complementary capabilities:

### A. Consumption Engine

Meter
→ Reading
→ kWh
→ Tariff
→ Consumption Analytics

### B. Supplier Bill Allocation Engine

Supplier Bill
→ Flat
→ Occupancy History
→ Operator Allocation
→ Resident Charges

Both may ultimately feed the Finance / Ledger layer.

Conceptually:

```text
                    ELECTRICITY
                         |
             +-----------+-----------+
             |                       |
      Consumption Engine      Supplier Bill
      Meter / kWh / Tariff    Allocation Engine
             |                       |
             +-----------+-----------+
                         |
                       Finance
```

This is an extension of capability, not a replacement of FR-6.

---

# 9. Historical Traceability Principle

Historical reconstruction must be treated as a first-class architectural requirement.

For any electricity charge, the system should eventually be able to answer:

> Why was this resident charged this amount for this billing period?

The answer should be reconstructable from the system itself.

The historical chain should contain:

1. Supplier bill
2. Flat
3. Billing period
4. Occupancy/activity evidence
5. Potential participants
6. Selected participants
7. Share counts
8. Per-share amount
9. Resident allocation
10. Operator confirmation
11. Ledger posting

The current FR-6 implementation does not yet preserve the complete allocation decision history.

This is a significant future capability gap.

---

# 10. Capability Classification

| Finding                                    | Classification        |                 Severity | Block Further Expansion?                              |
| ------------------------------------------ | --------------------- | -----------------------: | ----------------------------------------------------- |
| Resident / Stay identity separation        | Established invariant |                        — | No                                                    |
| Reservation → Admission                    | Functional            |                        — | No                                                    |
| Checkout / financial separation            | Established invariant |                        — | No                                                    |
| Post-checkout billing                      | Functional            |                        — | No                                                    |
| Multi-bed domain support                   | Existing capability   |                        — | No                                                    |
| Post-admission multi-bed UI                | UI / Workflow Gap     |                   Medium | No                                                    |
| Deposit account lifecycle                  | Capability Gap        |                   Medium | No                                                    |
| Partial deposit refund during Stay         | Capability Gap        |                   Medium | No                                                    |
| Settlement → Alumni completion             | Capability Gap        |                   Medium | No                                                    |
| Ritu PG electricity supplier-bill workflow | Capability Gap        | High business importance | No, unless Electricity is selected as next capability |
| Electricity participant selection          | Capability Gap        |                     High | No                                                    |
| Electricity share model                    | Capability Gap        |                     High | No                                                    |
| Electricity allocation history             | Data / Capability Gap |                     High | No                                                    |
| Meter / consumption engine                 | Existing capability   |                        — | No                                                    |
| Foundational domain redesign               | Not required          |                        — | No                                                    |

---

# 11. What Must Be Preserved

Future development must not compromise the following:

### Identity

`Resident ID ≠ Stay ID`

### Operational Lifecycle

Reservation → Admission → Stay → Notice → Checkout

### Financial Lifecycle

Financial relationship continues beyond checkout.

### Settlement

Checkout does not imply settlement.

### Alumni

Alumni conversion occurs only after the financial relationship is properly closed.

### Accommodation

Accommodation release is an operational event.

### Finance

Financial events must not reopen or alter completed operational Stay state unless explicitly required by a defined business process.

### Electricity

Electricity allocation must remain operator-driven and historically reconstructable.

---

# 12. What Is Safe to Defer

The following can be deferred without requiring foundational redesign:

* post-admission additional-bed UI;
* partial deposit refund workflow;
* complete deposit movement UI;
* final settlement workflow refinements;
* Ritu PG electricity allocation capability;
* persistent electricity allocation history;
* advanced electricity analytics;
* consumption trend reports;
* additional operational modules.

These are capabilities to be added incrementally.

---

# 13. What Should Be Documented Before Continuing

The checkpoint itself should eventually be reflected in the authoritative project documentation.

The following architectural/business decisions should be captured:

### ARCHITECTURE.md

Document:

* Resident vs Stay identity;
* operational vs financial lifecycle separation;
* Checkout does not end financial relationship;
* Settlement / Alumni boundary;
* electricity dual-model architecture.

### DECISIONS.md

Record the decisions:

1. Resident and Stay remain separate identities.
2. Stay terminates at checkout while financial relationship remains open.
3. Post-checkout financial activity is legitimate.
4. Electricity supplier-bill allocation is distinct from meter-consumption calculation.
5. Electricity allocation is operator-selected.
6. Electricity shares are independent allocation units.

### PROJECT_RULES.md

Add operational rules where appropriate, particularly:

* no financial closure at checkout;
* no automatic Alumni conversion at checkout;
* no assumption that one Stay equals one electricity share;
* no use of current Stay status as the sole electricity participation criterion.

### CAPABILITY_REGISTER.md

Update capability maturity for:

* Deposit lifecycle;
* Settlement;
* Multi-bed allocation;
* Electricity supplier-bill allocation;
* Electricity allocation history.

No documentation should be changed during this break. These are the planned documentation actions for the next working session.

---

# 14. Recommended Forward Strategy

The project should now move into **incremental capability expansion**, not architectural reconstruction.

The recommended sequence is:

## STEP 1 — Preserve the Checkpoint

Treat the current repository baseline as the stable architectural baseline.

No broad refactoring.

---

## STEP 2 — Formalize the Architectural Decisions

Before starting another implementation sprint, record the checkpoint conclusions in the authoritative documentation.

This prevents future AI-assisted development from accidentally weakening the lifecycle boundaries we have just validated.

---

## STEP 3 — Decide the Next Business Capability

Do not choose the next sprint merely because it is numerically "FR-7".

Choose based on actual Ritu PG business priority.

The leading candidates are:

### Candidate A — Ritu PG Electricity Allocation

Build the supplier-bill allocation workflow around:

Supplier Bill → Flat → Occupancy Activity → Operator Selection → Shares → Confirmation → Ledger → History.

This directly addresses the largest business-model mismatch discovered during the lifecycle test.

### Candidate B — Deposit Account Lifecycle

Strengthen:

Deposit Contributions → Partial Refunds → Checkout → Post-checkout Adjustments → Final Settlement → Refund → Alumni.

This would complete another important financial lifecycle.

### Candidate C — Multi-bed Accommodation Workflow

Add:

Active Stay → Assign Additional Bed → Multiple Bed Allocations → Release Individual Bed(s).

This would complete the operational multi-bed capability already supported by the domain model.

---

# 15. Recommended Priority

The recommended order is:

## Priority 1 — Ritu PG Electricity Business Model

Because the current electricity workflow is the clearest mismatch between application behaviour and actual business operation.

## Priority 2 — Deposit / Settlement Lifecycle

Because deposit is a long-lived financial relationship and ultimately controls the transition to Alumni.

## Priority 3 — Multi-bed Accommodation Workflow

Because the domain already supports the concept and the remaining gap is primarily operator workflow.

This order is not absolute. Business priorities may change it.

The important principle is:

> **Choose the next capability based on business value and architectural readiness, not sprint numbering.**

---

# 16. Proposed Development Method for Each Future Capability

Every significant future capability should follow the same disciplined cycle:

### 1. Business Model Confirmation

Confirm how Ritu PG actually operates.

### 2. Architecture Review

Identify the correct domain boundary and ownership.

### 3. Read-only Capability Audit

Ask Gemini to inspect the existing implementation without modification.

### 4. Evidence-based Design Decision

Agree on the target behaviour before coding.

### 5. Implementation

Give Gemini a tightly scoped implementation prompt.

### 6. Verification

Run focused tests and production build.

### 7. Lifecycle / Business Scenario Test

Test the capability through the operator workflow.

### 8. Documentation

Update architecture / decisions / capability register as appropriate.

### 9. Commit and Push

Gemini may perform the commit and push following the established workflow.

### 10. Baseline Verification

Confirm:

* full SHA;
* remote SHA;
* clean working tree;
* tests;
* TypeScript;
* build;
* relevant lint status.

Then move to the next capability.

---

# 17. AI Development Governance

The recent lifecycle exercise reinforces an important working practice.

Gemini should not be allowed to infer business behaviour merely from the existing code.

For every significant business capability:

> **Business rule first → architecture second → implementation third.**

When testing:

> **Evidence first → classification second → change decision third.**

When a capability is absent:

> **Record the gap rather than bypassing the operator workflow.**

This is especially important for:

* Electricity allocation;
* Deposit;
* Settlement;
* Multi-bed accommodation.

---

# 18. Current Project Position

RPGMS 2.0 has reached an important milestone.

We have moved beyond simply building individual screens and services.

We have now demonstrated that the core application can represent a meaningful Resident lifecycle while maintaining the separation between:

**Operational State**

and

**Financial State**

This is the architectural foundation on which the remaining modules should be built.

The remaining work is primarily **capability expansion and business-model refinement**, rather than fundamental architectural repair.

---

# 19. Final Checkpoint Statement

> **The RPGMS 2.0 foundation is READY because the core Resident, Stay, Accommodation and Financial boundaries have survived an end-to-end lifecycle validation without requiring foundational redesign.**

> **The most important unresolved business capability is the Ritu PG supplier-bill Electricity Allocation model.**

> **The most important architectural invariant to preserve is that operational checkout ends the Stay but does not end the financial relationship.**

> **Settlement and Alumni conversion must remain separate from Checkout.**

> **FR-7 should be selected based on business priority rather than numerical sequencing.**

> **The next development phase should be incremental capability expansion, supported by explicit architecture and business-rule decisions.**

---

# 20. Immediate Next-Session Plan

When development resumes:

### First

Review and formally accept this checkpoint.

### Second

Update the authoritative documentation to preserve the decisions.

### Third

Compare the three leading next-capability candidates:

1. Ritu PG Electricity Allocation
2. Deposit / Settlement Lifecycle
3. Multi-bed Accommodation Workflow

### Fourth

Select the next capability.

### Fifth

Prepare a read-only Gemini architecture/capability prompt for that capability.

### Sixth

Only after the capability is understood and approved, begin implementation.

**No FR-7 implementation should begin before the capability selection and architectural intent are agreed.**

---

## Checkpoint Status

**RPGMS 2.0 FOUNDATION: READY**

**FOUNDATIONAL REDESIGN: NOT REQUIRED**

**CURRENT DEVELOPMENT: PAUSED**

**NEXT ACTION: BUSINESS CAPABILITY SELECTION**

**REPOSITORY BASELINE: `abb9a0d`**
