# BUSINESS CONSTITUTION RECONCILIATION
## Business Architecture Foundation (Milestone B0)

**Document Version:** 1.0 (Draft)

**Status:** Draft – Under Review

**Project:** RPGMS 2.0

**Owner:** Business Architecture

**Audience:**
- Product Owner
- Developers
- AI Development Assistants
- Future Contributors

---

# 1. Background

During implementation of the Accommodation Foundation (CR-1.x), a detailed review of the project's business documentation identified inconsistencies between the Business Constitution and other authoritative project documents.

These inconsistencies were not the result of incorrect design. Rather, they arose because the project evolved over time. Individual documents accurately described portions of the business, but the overall business architecture gradually diverged across the documentation set.

Examples included:

- Stay occupancy model
- Bed allocation lifecycle
- Accommodation amendments
- Commercial amendments
- Resident and Stay responsibilities
- Notice management
- Business terminology

Rather than correcting each document independently, the project initiated a structured Business Constitution Reconciliation (BCR).

The objective of the reconciliation is to establish one internally consistent business architecture before continuing implementation of subsequent Accommodation, Commercial and Billing features.

This document records every significant architectural decision made during the reconciliation process together with its rationale, alternatives considered, implementation impact and documentation impact.

It is intended to become the authoritative reference explaining **why** the business model is designed the way it is.

---

# 2. Purpose

The purpose of this document is to:

- reconcile inconsistencies across business documentation;
- establish a single authoritative business model;
- preserve the rationale behind major architectural decisions;
- identify documents requiring updates;
- distinguish MVP decisions from deferred architectural decisions; and
- provide future contributors with the business reasoning that guided the design of RPGMS 2.0.

This document is a governance document.

It records architectural decisions.

It does not replace the Business Constitution, Business Rules, Domain Model or Architecture documentation.

Instead, it serves as the bridge between the original documentation and the reconciled business architecture.

---

# 3. Scope

This reconciliation covers the core business architecture of RPGMS 2.0, including:

- Resident
- Stay
- Accommodation
- Bed Allocation
- Bed Release
- Commercial Agreement
- Commercial Amendments
- Notice Management
- Lock-in Periods
- Checkout
- Business Events
- Cross-domain Business Principles

Implementation details, user interface design and database design are outside the scope of this document unless directly affected by a business architecture decision.

---

# 4. Authority Order

Whenever inconsistencies exist, the following order of authority shall apply.

1. Actual Business Operations
2. Approved Business Constitution
3. Approved Business Rules
4. Domain Model
5. Architecture
6. Functional Specifications
7. Implementation

Implementation shall never become the source of business truth.

Where conflicts exist, the conflict shall be reconciled through the Business Constitution Reconciliation process before implementation proceeds.

---

# 5. Methodology

The reconciliation followed the following principles.

1. Business before implementation.
2. Business architecture before software architecture.
3. Preserve existing business practices wherever possible.
4. Expand the MVP only when essential.
5. Separate business philosophy from business rules.
6. Preserve historical truth through immutable business events.
7. Record not only the approved decision but also the reasoning behind it.
8. Clearly identify decisions intentionally deferred beyond the MVP.

Every reconciliation item follows a common structure:

- Background
- Existing Position
- Assessment
- Decision
- Rationale
- Rejected Alternatives
- Affected Documents
- MVP Classification
- Status

# 6. Business Architecture Principles

Business Architecture Principles define the enduring design philosophy of RPGMS 2.0.

Unlike business rules, which may evolve as business policies change, these principles describe the fundamental structure of the business domain and the responsibilities of its core entities. They guide business modelling, software architecture, implementation, and future evolution of the system.

All reconciliation decisions documented later in this document shall conform to these principles.

---

## BAP-001 — Decision Support

### Statement

RPGMS is a decision support system.

The system validates business rules, performs calculations, detects inconsistencies, and recommends actions. Final business decisions remain the responsibility of an authorised human operator.

### Rationale

Many hostel management decisions depend on business judgement, negotiation, exceptional circumstances, and customer relationships. These cannot always be automated without sacrificing flexibility.

The system therefore assists operators by providing accurate information and recommendations while preserving human control over final decisions.

### Consequences

The system may:

- calculate rent
- calculate deposits
- recommend refunds
- recommend commercial amendments
- validate business rules
- detect inconsistencies
- highlight policy violations

The operator decides whether to accept, modify, or reject these recommendations.

---

## BAP-002 — Business Events

### Statement

Every significant change in the business shall be represented as an explicit business event.

Business events describe what happened. They do not rewrite history.

### Rationale

Operational history must remain complete, auditable, and explainable.

Recording business events instead of overwriting previous state provides a permanent record of how a Stay evolved over time.

### Consequences

Examples include:

- Admission
- Bed Allocation
- Bed Release
- Notice Submission
- Commercial Amendment
- Checkout

Each event records:

- what happened
- when it happened
- why it happened
- who authorised it

---

## BAP-003 — Identity

### Statement

A Resident represents a person.

A Stay represents a period of residence.

The identity of a Resident is independent of any individual Stay.

### Rationale

Residents may leave and return multiple times throughout the lifetime of the business.

Their identity, documents, history, and relationships should remain continuous across multiple stays.

### Consequences

- One Resident may have multiple historical Stays.
- A returning Resident receives a new Stay.
- Historical records remain immutable.
- Resident history is preserved independently of accommodation.

---

## BAP-004 — Accommodation

### Statement

Accommodation describes where a Resident lives during a Stay.

Accommodation is an operational concern and is independent of commercial agreements.

### Rationale

Operational accommodation may change during a Stay without necessarily creating a new Stay.

Examples include bed changes, partial bed releases, or accommodation amendments.

### Consequences

Accommodation events affect:

- Flat
- Bed
- Occupancy
- Capacity

They do not directly determine commercial obligations.

---

## BAP-005 — Commercial

### Statement

Commercial Agreements define the financial relationship between the Resident and the business.

### Rationale

Commercial terms such as rent, deposits, lock-in periods, concessions, and refunds may change independently of accommodation.

Separating commercial concerns from accommodation provides greater flexibility while preserving business history.

### Consequences

Commercial Agreements govern:

- Rent
- Deposit
- Lock-in Period
- Refunds
- Financial Amendments

Commercial changes do not necessarily require accommodation changes.

---

## BAP-006 — Separation of Operational and Commercial Concerns

### Statement

Operational events and commercial events are distinct business concerns.

Operational changes may trigger commercial recommendations, but they remain independent.

### Rationale

A change in accommodation does not automatically imply a change in financial obligations.

Likewise, a commercial concession does not necessarily require an accommodation change.

Maintaining this separation simplifies business logic and supports future commercial flexibility.

### Consequences

Examples include:

- Bed Release may recommend a rent recalculation.
- Bed Allocation may recommend a commercial amendment.
- Rent concessions do not alter accommodation.
- Lock-in periods belong to the Commercial Agreement, not the Stay.

# 7. Business Constitution Reconciliation (Decision Register)

The following decisions were approved during the Business Architecture Reconciliation Workshop.

Each decision records the issue identified, the reasoning behind the chosen approach, and the resulting business model for RPGMS 2.0.

---

## BCR-001 — Resident and Stay are Distinct Business Entities

**References**

- BAP-002 — Business Events
- BAP-003 — Identity

### Background

Earlier project documentation treated the concepts of *Resident* and *Stay* inconsistently. In some places they appeared interchangeable, while in others a Stay was treated as a separate business entity.

This inconsistency affected accommodation, billing, reporting, and historical record keeping.

### Existing Position

The Business Constitution correctly recognised that a Resident represents a person.

However, several downstream documents implicitly tied operational and commercial activities directly to the Resident rather than to a Stay.

This created ambiguity regarding:

- Returning residents
- Historical occupancy
- Multiple admissions over time
- Business event ownership

### Assessment

A Resident exists independently of accommodation.

Accommodation begins only when a Stay begins.

Likewise, commercial obligations are created for a Stay, not for the person in the abstract.

A returning Resident should not overwrite the history of a previous residence.

Instead, each period of residence must be represented as a separate Stay.

### Decision

The following business model is adopted:

- A Resident represents a person.
- A Stay represents one continuous period of residence.
- Every Stay belongs to exactly one Resident.
- A Resident may have multiple historical Stays.
- A returning Resident always begins a new Stay.
- A Stay owns its operational and commercial history.

### Rationale

Separating Resident from Stay preserves the continuity of personal identity while maintaining an immutable operational history.

It enables:

- accurate historical reporting,
- multiple admissions over time,
- complete audit trails,
- simpler accommodation management, and
- cleaner commercial modelling.

This distinction becomes the foundation upon which Accommodation, Billing, and Reporting are built.

### Rejected Alternatives

**Alternative:** Treat the Resident as the operational entity.

**Reason for rejection:**

This approach merges identity with occupancy, making it difficult to preserve historical records, support re-admissions, or distinguish separate periods of residence.

---

**Alternative:** Update an existing Stay when a Resident returns.

**Reason for rejection:**

A Stay represents a completed period of residence. Reopening or extending a historical Stay would compromise auditability and business history.

### Affected Documents

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- STAY_SPECIFICATION.md
- ACCOMMODATION_SPECIFICATION.md
- ARCHITECTURE.md

### MVP Classification

**Critical**

This decision underpins the entire business model and must be implemented before subsequent accommodation and commercial features.

### Status

**Approved**

## BCR-001 — Resident and Stay are Distinct Business Entities

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Resident, Stay |
| **Related Principles** | BAP-002, BAP-003 |
| **Impacts** | Accommodation, Billing, Reporting |

## BCR-002 — One Stay Occupies One Flat but May Occupy Multiple Beds

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Stay, Accommodation |
| **Related Principles** | BAP-002, BAP-004, BAP-006 |
| **Impacts** | Accommodation, Billing, Reporting |

### Background

The original accommodation model assumed that a Stay occupied exactly one Bed.

During implementation, several real-world scenarios demonstrated that this assumption did not accurately represent hostel operations.

Examples included:

- Residents occupying two beds.
- Temporary reservation of an adjacent bed.
- Partial release of accommodation.
- Future expansion to premium accommodation.

These scenarios could not be represented without introducing unnecessary complexity or artificially splitting a single Stay.

### Existing Position

Earlier documentation implied:

One Stay → One Bed.

While simple, this model restricted operational flexibility and complicated several legitimate business cases.

### Assessment

A Bed is the smallest operational accommodation unit.

A Flat represents the physical living space.

A Stay represents the Resident's period of residence within a Flat.

During a Stay, the exact number of Beds occupied may change without changing the Resident's identity, the Flat, or the continuity of the Stay.

The workshop concluded that the architectural constraint should be the Flat—not the individual Bed.

### Decision

The approved accommodation model is:

- One Stay belongs to exactly one Flat.
- One Stay may occupy one or more Beds within that Flat.
- Bed occupancy may change during an active Stay.
- The Stay remains continuous while the Resident continues to reside in the same Flat.
- Bed changes are operational events and do not create a new Stay.

### Rationale

This model reflects actual hostel operations while remaining simple.

It supports:

- Multi-bed occupancy.
- Partial Bed Release.
- Future accommodation flexibility.
- Accurate occupancy calculations.
- Cleaner commercial modelling.

Most importantly, it separates the concept of *residence* from the mechanics of *bed allocation*.

### Rejected Alternatives

**Alternative:** One Stay must always occupy exactly one Bed.

**Reason for rejection**

Does not support genuine operational scenarios such as multiple-bed occupancy or partial releases without creating unnecessary complexity.

---

**Alternative:** Create multiple Stays for multiple Beds.

**Reason for rejection**

A Resident has one continuous period of residence in a Flat.

Artificially splitting that residence into multiple Stays would distort business history and complicate billing.

### Documentation Impact

The following documents require reconciliation:

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- ACCOMMODATION_SPECIFICATION.md
- STAY_SPECIFICATION.md

### Implementation Impact

Accommodation services must allow multiple active Bed allocations for a single Stay while enforcing that all allocated Beds belong to the same Flat.

Commercial calculations must operate at the Stay level rather than the individual Bed level.

## BCR-003 — Bed Release is an Operational Event, Not a Checkout

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Accommodation, Stay |
| **Related Principles** | BAP-002, BAP-004, BAP-006 |
| **Impacts** | Accommodation, Billing, Reporting |

### Background

The original business model implicitly assumed that releasing a Bed marked the end of a Resident's accommodation.

During reconciliation, it became clear that this assumption did not reflect actual business operations.

Examples include:

- A Resident voluntarily giving up one of multiple occupied Beds.
- Temporary reduction in accommodation.
- Operational reorganisation within the same Flat.
- Future accommodation optimisation.

None of these situations represent the end of the Stay.

### Existing Position

Earlier documentation did not clearly distinguish between:

- releasing accommodation,
- ending a Stay, and
- checking out.

This ambiguity made it difficult to model partial accommodation changes without incorrectly terminating the Stay.

### Assessment

A Bed is an operational resource.

Releasing a Bed changes accommodation but does not necessarily change the Resident's relationship with the business.

The Stay continues until the Resident permanently leaves the Flat through the Checkout process.

Therefore, Bed Release should be treated as an operational event rather than a lifecycle event.

### Decision

The following business model is adopted:

- Bed Release removes occupancy from one or more Beds.
- Bed Release does not terminate the Stay.
- Bed Release does not automatically trigger Checkout.
- Bed Release may trigger commercial recommendations.
- Bed Release becomes part of the immutable operational history of the Stay.

### Rationale

Separating Bed Release from Checkout creates a clearer business model.

Operational accommodation changes remain operational.

Lifecycle events remain lifecycle events.

Commercial consequences become independent decisions rather than automatic side effects.

This separation improves flexibility while preserving business history.

### Rejected Alternatives

**Alternative:** Treat every Bed Release as Checkout.

**Reason for rejection**

Residents may legitimately continue their Stay after releasing part of their accommodation.

Automatically ending the Stay would misrepresent business reality.

---

**Alternative:** Modify the existing Bed Allocation record.

**Reason for rejection**

Overwriting operational history destroys auditability and prevents reconstruction of past occupancy.

### Documentation Impact

The following documents require reconciliation:

- BUSINESS_RULES.md
- ACCOMMODATION_SPECIFICATION.md
- STAY_SPECIFICATION.md
- DOMAIN_MODEL.md

### Implementation Impact

Bed Release shall be implemented as a distinct operational event.

Checkout remains a separate business process with its own validation rules.

Commercial recalculations, if required, are recommendations generated independently of the operational event.

## BCR-004 — Accommodation Amendments Modify Occupancy Without Ending the Stay

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Stay, Accommodation |
| **Related Principles** | BAP-002, BAP-004, BAP-006 |
| **Impacts** | Accommodation, Billing, Reporting |

### Background

During reconciliation it became evident that accommodation may legitimately change during an active Stay without affecting the continuity of residence.

Examples include:

- Adding an additional Bed.
- Releasing one of multiple occupied Beds.
- Reallocating a Resident to another Bed within the same Flat.
- Correcting an operational allocation error.

These changes modify accommodation but do not represent a new admission or a checkout.

### Existing Position

Earlier documentation did not clearly distinguish between:

- changes to accommodation,
- changes to the Stay, and
- commercial consequences.

As a result, operational changes risked becoming lifecycle events or triggering automatic commercial actions.

### Assessment

A Stay represents a continuous period of residence.

Accommodation describes how that Stay is physically realised within a Flat.

Accommodation may evolve during the Stay while the identity and continuity of the Stay remain unchanged.

Therefore, accommodation changes should be represented as amendments to occupancy rather than termination and recreation of the Stay.

### Decision

The approved business model is:

- Accommodation may be amended during an active Stay.
- Accommodation Amendments do not create a new Stay.
- Accommodation Amendments do not terminate the existing Stay.
- Every amendment is recorded as a separate business event.
- Commercial consequences, if any, are evaluated independently.

### Rationale

Separating accommodation amendments from Stay lifecycle events keeps the business model simple and historically accurate.

It enables operational flexibility while preserving:

- continuity of residence,
- audit history,
- reporting accuracy, and
- future extensibility.

### Rejected Alternatives

**Alternative:** End the Stay and create a new Stay whenever accommodation changes.

**Reason for rejection**

Accommodation changes are operational adjustments, not new periods of residence.

Creating multiple Stays for routine operational changes would fragment business history and complicate reporting.

---

**Alternative:** Modify existing accommodation records in place.

**Reason for rejection**

Overwriting historical occupancy would destroy the audit trail and make historical reconstruction impossible.

### Documentation Impact

The following documents require reconciliation:

- ACCOMMODATION_SPECIFICATION.md
- STAY_SPECIFICATION.md
- DOMAIN_MODEL.md
- BUSINESS_RULES.md

### Implementation Impact

Accommodation services shall support amendment events while preserving immutable historical records.

Current occupancy shall always be derived from the sequence of approved accommodation events rather than by overwriting previous state.

## BCR-005 — Commercial Agreements and Commercial Amendments

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Commercial, Stay |
| **Related Principles** | BAP-001, BAP-002, BAP-005, BAP-006 |
| **Impacts** | Billing, Deposits, Lock-in, Reporting |

### Background

During the reconciliation workshop, it became evident that operational accommodation and commercial obligations represent different aspects of the business relationship.

Historically, hostel management systems often derive commercial outcomes directly from accommodation changes. While this approach appears simple, it tightly couples operational decisions with financial policy and reduces business flexibility.

The reconciliation sought to establish a clear separation between operational accommodation and commercial agreements.

### Existing Position

Previous documentation implicitly linked commercial terms to accommodation.

Examples included:

- Rent determined solely by Bed allocation.
- Lock-in periods associated with occupancy.
- Financial changes occurring automatically when accommodation changed.

This coupling made it difficult to support negotiated arrangements, concessions, exceptional approvals, and future commercial policies.

### Assessment

A Stay establishes that a Resident is living in the PG.

A Commercial Agreement establishes the financial terms under which that Stay exists.

Although related, these represent different business concerns.

Accommodation may change without requiring commercial changes.

Likewise, commercial terms may change without requiring any change in accommodation.

The relationship between the two is one of influence rather than dependency.

### Decision

The approved commercial model is:

- Every Stay is governed by one active Commercial Agreement.
- Commercial Agreements define financial obligations.
- Commercial terms may be revised through Commercial Amendments.
- Commercial Amendments do not create a new Stay.
- Commercial Amendments do not modify accommodation.
- Operational events may generate commercial recommendations.
- Commercial changes require explicit operator approval.

### Commercial Agreement governs

- Rent
- Security Deposit
- Lock-in Period
- Commercial Discounts
- Financial Concessions
- Refund Policy
- Other financial obligations

### Commercial Amendment may modify

- Rent
- Deposit
- Lock-in
- Discounts
- Concessions
- Refund calculations

while preserving the continuity of both the Resident and the Stay.

### Rationale

Separating commercial agreements from accommodation provides a more accurate representation of real business operations.

It enables:

- negotiated commercial arrangements,
- policy-driven concessions,
- future pricing models,
- flexible commercial workflows,
- clearer audit history, and
- independent evolution of operational and financial domains.

The system remains capable of recommending commercial changes while ensuring that financial decisions remain under human control.

### Rejected Alternatives

**Alternative:** Derive commercial terms directly from accommodation.

**Reason for rejection**

Accommodation describes where the Resident lives.

It does not completely define the financial relationship between the Resident and the business.

---

**Alternative:** Create a new Stay whenever commercial terms change.

**Reason for rejection**

Commercial revisions do not represent a new period of residence.

They represent a revised financial agreement within the existing Stay.

---

**Alternative:** Automatically apply financial changes whenever accommodation changes.

**Reason for rejection**

Business judgement is frequently required.

Automatic financial changes would reduce operational flexibility and conflict with the Decision Support Principle.

### Documentation Impact

The following documents require reconciliation:

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- BILLING_SPECIFICATION.md
- STAY_SPECIFICATION.md
- ARCHITECTURE.md

### Implementation Impact

Commercial Agreements become first-class business entities.

Commercial Amendments shall be implemented as immutable business events.

Accommodation services may recommend commercial actions, but they shall never apply financial changes directly.

Billing shall operate from the active Commercial Agreement rather than from accommodation state alone.

## BCR-006 — Notice Represents Intent, Not Execution

| Item | Value |
|------|-------|
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Stay, Commercial |
| **Related Principles** | BAP-001, BAP-002, BAP-003, BAP-006 |
| **Impacts** | Checkout, Billing, Reporting |

### Background

Earlier discussions and documentation sometimes treated the submission of Notice as equivalent to initiating the checkout process.

However, actual business operations demonstrated that a Notice merely communicates the Resident's intention to vacate.

Operational and commercial activities continue until the Resident actually checks out.

### Existing Position

Previous documentation blurred the distinction between:

- Notice
- Notice Period
- Checkout

This ambiguity affected billing, occupancy reporting, and operational workflows.

### Assessment

Submitting Notice changes neither accommodation nor commercial obligations.

It simply records the Resident's declared intention.

The Stay continues unchanged until the Checkout event is completed.

Business actions during the notice period remain possible, including:

- Commercial Amendments
- Accommodation Amendments
- Notice withdrawal (if permitted by policy)
- Revised checkout dates

### Decision

The approved business model is:

- Notice records an intention to leave.
- Notice does not terminate the Stay.
- Notice does not release accommodation.
- Notice does not automatically stop billing.
- Checkout remains the only event that ends a Stay.

### Rationale

Separating intent from execution reflects actual hostel operations and preserves flexibility.

Residents frequently change plans, extend their stay, or negotiate revised departure dates.

Treating Notice as informational rather than terminal avoids unnecessary complexity and preserves accurate business history.

### Rejected Alternatives

**Alternative:** Automatically schedule Checkout when Notice is submitted.

**Reason for rejection**

Operational and commercial circumstances may change before departure.

Automatic checkout would reduce flexibility and conflict with the Decision Support Principle.

---

**Alternative:** Treat Notice as the end of commercial liability.

**Reason for rejection**

Commercial obligations continue until Checkout or another authorised commercial decision.

### Documentation Impact

The following documents require reconciliation:

- BUSINESS_RULES.md
- STAY_SPECIFICATION.md
- BILLING_SPECIFICATION.md
- CHECKOUT_SPECIFICATION.md

### Implementation Impact

Notice shall be implemented as an informational business event.

Checkout shall remain the only lifecycle event that terminates a Stay.

Billing continues according to the active Commercial Agreement unless an approved Commercial Amendment specifies otherwise.

## BCR-007 — Lock-in Period Belongs to the Commercial Agreement

| Item | Value |
|------|-------|
| **Category** | Commercial Architecture |
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Commercial Agreement |
| **Related Principles** | BAP-001, BAP-005, BAP-006 |
| **Impacts** | Billing, Refunds, Checkout |

### Background

During the reconciliation workshop, the ownership of the Lock-in Period was reviewed.

Earlier documentation treated the Lock-in Period as an attribute of the Stay. However, analysis of actual business operations demonstrated that the Lock-in Period represents a negotiated commercial commitment rather than an operational characteristic of residence.

### Existing Position

The project documentation did not consistently define the ownership of the Lock-in Period.

Some sections associated it with the Stay, while others implicitly treated it as part of the financial agreement.

This ambiguity affected refund calculations, early checkout handling, and future commercial flexibility.

### Assessment

A Stay answers the question:

*"When and where did the Resident live?"*

A Lock-in Period answers a different question:

*"What financial commitment was agreed between the Resident and the business?"*

These are distinct business concerns.

Since the Lock-in Period influences financial obligations rather than accommodation, it belongs to the Commercial Agreement.

### Decision

The approved business model is:

- Every Lock-in Period belongs to the Commercial Agreement.
- Lock-in Periods may be revised through Commercial Amendments.
- Changing the Lock-in Period does not create a new Stay.
- Changing the Lock-in Period does not affect accommodation.
- Early Checkout consequences are determined from the active Commercial Agreement.

### Rationale

This separation aligns the business model with real-world commercial practice.

Lock-in commitments are negotiated financial terms and should evolve independently of accommodation.

It also simplifies future enhancements such as promotional pricing, negotiated waivers, and policy changes.

### Rejected Alternatives

**Alternative:** Store the Lock-in Period within the Stay.

**Reason for rejection**

The Stay represents operational residence.

Embedding financial commitments within the Stay unnecessarily couples operational and commercial concerns.

---

**Alternative:** Prevent modification of the Lock-in Period.

**Reason for rejection**

Commercial negotiations occasionally require authorised revisions without affecting the Resident's accommodation.

### Documentation Impact

The following documents require reconciliation:

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- BILLING_SPECIFICATION.md
- STAY_SPECIFICATION.md

### Implementation Impact

Commercial services shall evaluate Lock-in compliance from the active Commercial Agreement.

Accommodation services shall not interpret or enforce Lock-in policies directly.

## BCR-008 — Business Events Form the Immutable History of a Stay

| Item | Value |
|------|-------|
| **Category** | Architectural Foundation |
| **Status** | Approved |
| **Priority** | Critical |
| **Business Domains** | Entire Business Model |
| **Related Principles** | BAP-001, BAP-002, BAP-003, BAP-004, BAP-005, BAP-006 |
| **Impacts** | Entire System |

### Background

Throughout the reconciliation workshop, a recurring theme emerged:

Business history must explain **how** a Stay evolved, not merely describe its current state.

This required a consistent approach to recording operational and commercial changes.

### Existing Position

Earlier documentation primarily described the current state of entities.

The treatment of historical changes was inconsistent and risked overwriting important business information.

### Assessment

Business operations are naturally event-driven.

Examples include:

- Admission
- Bed Allocation
- Bed Release
- Accommodation Amendment
- Commercial Amendment
- Notice Submission
- Checkout

These events collectively describe the complete lifecycle of a Stay.

Rather than replacing previous information, each event contributes to an immutable historical record.

### Decision

The approved business model is:

- Significant business changes are recorded as immutable Business Events.
- Business Events are never rewritten or deleted.
- Current business state is derived from approved Business Events.
- Every Business Event records:
  - what happened,
  - when it happened,
  - why it happened,
  - who authorised it.

### Rationale

An event-driven history provides:

- complete auditability,
- historical reconstruction,
- regulatory transparency,
- operational accountability,
- simpler troubleshooting, and
- future analytical capabilities.

It ensures that RPGMS records not only the current state of the business but also the journey that produced that state.

### Rejected Alternatives

**Alternative:** Continuously overwrite the current state.

**Reason for rejection**

Overwriting state destroys historical context, limits auditability, and makes past business decisions difficult to explain.

---

**Alternative:** Record history only for selected modules.

**Reason for rejection**

A consistent event model across all business domains simplifies architecture and provides a complete operational timeline.

### Documentation Impact

This decision affects the entire documentation set.

All specifications shall treat Business Events as immutable historical records rather than mutable state.

### Implementation Impact

Future implementation shall adopt an event-oriented business model.

Operational and commercial workflows shall create Business Events rather than modifying historical records wherever practical.

---

# Appendix A — Business Architecture Invariants

Business Architecture Invariants are fundamental truths of the RPGMS 2.0 business model.

These invariants shall remain true regardless of future implementation changes, user interface redesigns, database schema modifications, or technology migrations.

Any proposed feature that violates an invariant shall trigger a Business Architecture Review before implementation.

## Identity

- A Resident represents a person.
- A Resident may have multiple historical Stays.
- A Stay belongs to exactly one Resident.
- A returning Resident always begins a new Stay.

## Stay

- A Stay represents one continuous period of residence.
- A Stay belongs to exactly one Flat.
- A Stay may occupy one or more Beds within that Flat.
- Bed occupancy may change during an active Stay.
- Accommodation changes do not create a new Stay.

## Accommodation

- Bed Allocation is an operational event.
- Bed Release is an operational event.
- Bed Release does not terminate a Stay.
- Checkout is the only event that terminates a Stay.

## Commercial

- Every active Stay has one active Commercial Agreement.
- Commercial Agreements govern financial obligations.
- Lock-in Period belongs to the Commercial Agreement.
- Commercial Amendments modify financial terms without affecting the Stay.

## Notice

- Notice represents intent.
- Notice does not terminate a Stay.
- Notice does not release accommodation.
- Notice does not stop billing.

## Business Events

- Significant business changes are recorded as Business Events.
- Business Events are immutable.
- Business history is never rewritten.
- Current business state is derived from approved Business Events.

## Decision Support

- RPGMS is a Decision Support System.
- The system recommends actions.
- The operator makes business decisions.

---

# Appendix B — Business Taxonomy

The following taxonomy defines the categories used throughout the RPGMS business architecture.

## Business Architecture Principle (BAP)

A timeless architectural principle that defines how the business is structured.

Examples:

- Decision Support
- Business Events
- Identity
- Accommodation
- Commercial

---

## Business Entity

A persistent business concept with its own identity and lifecycle.

Examples:

- Resident
- Stay
- Commercial Agreement
- Flat
- Bed

---

## Business Event

An immutable record describing something that happened in the business.

Examples:

- Admission
- Bed Allocation
- Bed Release
- Accommodation Amendment
- Commercial Amendment
- Notice Submission
- Checkout

---

## Business Process

A sequence of activities performed to achieve a business outcome.

Examples:

- Admission Process
- Checkout Process
- Notice Process
- Billing Process

---

## Business Rule

A policy or constraint governing business behaviour.

Examples:

- Lock-in Period
- Refund Policy
- Deposit Rules
- Billing Cycle

Business Rules may evolve without changing the underlying business architecture.

---

## Business Decision

A formally approved architectural decision recorded during Business Constitution Reconciliation.

Examples:

- Resident and Stay are separate entities.
- One Stay may occupy multiple Beds.
- Notice represents intent.

---

# Appendix C — Business Architecture Glossary

## Resident

A person who has or has had a business relationship with the PG.

---

## Stay

A continuous period during which a Resident occupies accommodation within the PG.

---

## Flat

The physical accommodation unit assigned to a Stay.

---

## Bed

The smallest operational accommodation unit.

---

## Bed Allocation

The operational event assigning a Bed to a Stay.

---

## Bed Release

The operational event removing a Bed from a Stay.

---

## Accommodation Amendment

A business event that changes accommodation during an active Stay without ending the Stay.

---

## Commercial Agreement

The active financial agreement governing a Stay.

---

## Commercial Amendment

A business event modifying the Commercial Agreement without affecting the continuity of the Stay.

---

## Notice

A declaration of the Resident's intention to end the Stay at a future date.

---

## Checkout

The business event that formally terminates a Stay.

---

## Lock-in Period

The minimum commercial commitment defined by the Commercial Agreement.

---

## Business Event

An immutable record of a significant operational or commercial change.

---

# Appendix D — Documents Requiring Reconciliation

The following project documents shall be reviewed and updated to align with the approved Business Architecture Foundation.

| Document | Status | Remarks |
|----------|--------|---------|
| BUSINESS_CONSTITUTION.md | Pending | Align with approved business architecture. |
| BUSINESS_RULES.md | Pending | Update business rules to match reconciliation decisions. |
| DOMAIN_MODEL.md | Pending | Reconcile entities, relationships and ownership. |
| ARCHITECTURE.md | Pending | Reflect updated business architecture and domain boundaries. |
| STAY_SPECIFICATION.md | Pending | Update Stay lifecycle and ownership rules. |
| ACCOMMODATION_SPECIFICATION.md | Pending | Update accommodation model and amendment workflow. |
| BILLING_SPECIFICATION.md | Pending | Align Commercial Agreement and billing behaviour. |
| CHECKOUT_SPECIFICATION.md | Pending | Reconcile Notice, Checkout and Stay termination. |

---

## Reconciliation Completion Criteria

The Business Constitution Reconciliation shall be considered complete when:

- All Business Architecture Principles have been approved.
- All Business Constitution Reconciliation decisions have been approved.
- All affected documents have been updated.
- No contradictions remain between business documentation.
- Implementation reflects the approved business architecture.

---

This document is the authoritative record of the Business Architecture Reconciliation undertaken during Milestone B0. It preserves both the approved decisions and the architectural reasoning behind them. Subsequent governance documents shall reflect the decisions recorded herein.

# Document Approval

| Item | Value |
|------|-------|
| **Document** | Business Constitution Reconciliation |
| **Version** | 1.0 |
| **Milestone** | B0 – Business Architecture Foundation |
| **Status** | Approved |
| **Approved By** | Product Owner |
| **Effective From** | RPGMS 2.0 |
| **Supersedes** | Previous Business Architecture interpretations |

---

## Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | YYYY-MM-DD | Initial Business Constitution Reconciliation following the Business Architecture Workshop (Milestone B0). |

