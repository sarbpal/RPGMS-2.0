# DOMAIN_MODEL.md

**Project:** RPGMS 2.0  
**Document:** Domain Model  
**Version:** 1.0  
**Status:** Approved  
**Classification:** Core Project Documentation

---

# 1. Purpose

This document defines the conceptual business model of RPGMS 2.0.

It identifies the core business domains, business entities, aggregate boundaries, ownership relationships, and modelling principles that describe how the hostel management business operates.

The Domain Model is independent of software implementation, programming language, database design, user interface, or deployment architecture.

Its purpose is to establish a common business language shared by business stakeholders, developers, architects, and AI coding assistants.

---

# 2. Scope

This document defines:

- Core business domains
- Business entities
- Aggregate roots
- Entity ownership
- Relationships between domains
- Business processes
- Domain invariants
- Modelling principles

This document intentionally does **not** define:

- User interface behaviour
- API design
- Database schema
- Programming language implementation
- Framework-specific architecture

These concerns are documented elsewhere within the project.

---

# 3. Relationship to Other Documents

The RPGMS documentation follows a layered governance model.

| Document | Responsibility |
|-----------|----------------|
| BUSINESS_CONSTITUTION.md | Business architecture, constitution, and principles |
| BUSINESS_RULES.md | Operational policies and business rules |
| DOMAIN_MODEL.md | Business concepts and relationships |
| ARCHITECTURE.md | Software architecture and implementation principles |
| Domain Documents | Module-specific implementation guidance |

If two documents appear to conflict, the higher-level document takes precedence.

---

# 4. Domain Philosophy

The Domain Model represents the business rather than the software.

Business concepts should remain stable even when technologies, user interfaces, databases, or implementation approaches change.

Every Entity within the model exists because it represents an identifiable business concept with independent meaning and responsibility.

The objective of the Domain Model is not to describe how the application is built, but to describe how the business operates.

---

# 5. Domain Modelling Principles

The following principles govern the evolution of the Domain Model.

## DM-001 Business First

Business concepts always take precedence over technical implementation.

Technology should adapt to the business rather than forcing changes to the business model.

---

## DM-002 Single Responsibility

Every Entity represents one primary business responsibility.

An Entity should not accumulate unrelated responsibilities over time.

---

## DM-003 Single Ownership

Every Entity has exactly one owner.

Ownership is explicit, hierarchical, and never implied.

---

## DM-004 Stable Identity

Entities retain their identity throughout their lifecycle.

Changes to state do not create new identities unless the business concept itself changes.

---

## DM-005 Explicit Relationships

Relationships between business concepts must be explicitly modelled.

References communicate relationships.

References do not imply ownership.

---

## DM-006 Historical Integrity

Business history is a permanent business asset.

Historical records should be preserved rather than overwritten.

Corrections create new business records instead of modifying historical ones.

---

## DM-007 Aggregate Consistency

Aggregate Roots protect the consistency of the business concepts they own.

Business invariants are enforced within Aggregate boundaries.

---

## DM-008 Value Object Simplicity

Simple descriptive information should be modelled as Value Objects rather than Business Entities whenever independent identity is unnecessary.

---

## DM-009 Technology Independence

The Domain Model remains independent of implementation technologies.

Business concepts should not depend upon databases, frameworks, programming languages, or deployment environments.

---

## DM-010 Business Traceability

Every significant business event should be traceable through the Domain Model.

Business history should support reporting, audit, and operational review.

---

## DM-011 Entity Discovery

A new Business Entity should exist only when it possesses:

- Independent identity
- Independent responsibility
- Independent lifecycle
- Historical significance
- Independent business rules

If these characteristics do not exist, the behaviour should normally belong to an existing Entity or Value Object.

---

## DM-012 Behaviour Over Structure

Business behaviour should drive modelling decisions.

Entities exist to represent business responsibilities rather than database tables or screen layouts.

---

## DM-013 History Is a Business Asset

Historical information should be considered a first-class business concern.

The model favours preserving historical records over simplifying implementation.

---

## DM-014 Generalise Before Specialising

Before introducing a new Entity, determine whether the behaviour can be represented by extending an existing business concept.

New Entities should only be introduced when they provide genuine business value.

---

# 6. Ubiquitous Language

The following business terms are used consistently throughout the project.

| Term | Definition |
|------|------------|
| Property | A physical hostel managed by the business |
| Flat | Primary operational accommodation unit within a Property |
| Area | A physical subdivision within a Flat |
| Bed | The smallest allocatable accommodation unit |
| Reservation | A future commitment to admit a prospective resident |
| Resident | A person known to the business (permanent identity profile) |
| Stay | One continuous period of residence bounded by one Flat |
| Accommodation Amendment | Domain concept representing an immutable business event for bed allocation changes within a Flat |
| Current Stay | The single active Stay representing the Resident's current operational relationship with the organisation |
| Current Projection | A derived operational view of the Current Stay used for day-to-day operations while preserving complete historical information |
| Bed Allocation | The relationship assigning one or more Beds to a Stay for a defined period |
| Commercial Agreement | The financial terms governing a Stay |
| Commercial Amendment | Domain concept representing an immutable business event for financial term revisions during a Stay |
| Lock-in Period | Financial commitment owned by the Commercial Agreement |
| Notice | Informational domain event communicating declared intent to vacate at a future date |
| Operational Checkout | Sole terminal operational Business Event concluding a Stay and releasing accommodation |
| Charge | A financial obligation owed by the Resident |
| Payment | Money received by the business |
| Payment Allocation | The relationship between Payments and Charges |
| Security Deposit | Refundable liability held during a Stay |
| Ledger Entry | Derived accounting representation of financial events |
| Business Event | Cross-domain conceptual model representing an immutable record of completed business activity |
| Laundry Item | A recognized physical category of laundry (not an individually tracked garment identity) |
| Laundry Service | An operational service requested for a Laundry Item (e.g. Cleaning, Ironing) |
| Laundry Charge Master | Commercial rate configuration applicable to a Laundry Item + Service combination |
| Rate Snapshot | Historical copy of applicable Charge Master rate captured at Collection Confirmation |
| Laundry Transaction | The complete operational container for one laundry collection relationship for a Stay |
| Garment Line | A quantity of the same Laundry Item sharing the same requested services and Rate Snapshots |
| Physical Quantity | The actual piece count of laundry (counted once regardless of the number of services) |
| Collection Confirmation | Point where collection facts, quantities, services, and rate snapshots become immutable |
| Condition Observation | Physical condition or defect noted during pre-processing inspection |
| Processing Route | Operational path for laundry processing (IN_HOUSE or EXTERNAL_VENDOR) |
| Laundry Return | Physical return of processed laundry back into RPGMS custody, verified by staff count |
| Handover Method | Method of physical delivery (DIRECT_HANDOVER to resident or ROOM_PLACEMENT) |
| Resident Verification | Whether resident personally checked laundry; separate from physical delivery |
| Laundry Exception | Operational discrepancy, missing item, damage, or service issue requiring investigation |
| Exception Resolution | Operational outcome determining physical resolution or operational basis for financial action |
| Resolved Quantity | Physical quantity conclusively accounted for where delivery will not occur (e.g. lost) |
| Service Fulfillment | Operational confirmation that a requested service has actually been performed |
| Chargeable Laundry Service | Service that has been fulfilled AND whose affected physical quantity has been delivered |
| Laundry Charge Event | `LaundryChargeRaised` domain event communicating chargeable service facts to Finance |

These terms form the common language used throughout the project.

---

# 7. Domain Overview

RPGMS is organised into four primary business domains, supported by a cross-domain Business Event model.

Accommodation
        │
        ▼
Reservation
        │
   Admission
        ▼
Resident
        │
        ▼
Current Stay
        │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Commercial   Bed     Business
Agreement Allocation Events
        │
        ▼
Current Projection
        │
        ▼
Finance

Each domain represents a distinct area of business responsibility.

Business Processes coordinate interactions between domains without transferring ownership of business concepts.


## Core Business Entities and Domain Concepts

| Domain | Entities and Domain Concepts |
|---------|----------|
| Accommodation | Property, Flat, Area, Bed, Accommodation Amendment (Domain Event Concept) |
| Reservation | Reservation, Reservation Preference, Reservation Token |
| Resident Lifecycle | Resident, Stay, Bed Allocation, Notice (Informational Event Concept) |
| Finance | Commercial Agreement, Commercial Amendment (Domain Event Concept), Charge, Payment, Payment Allocation, Security Deposit, Ledger Entry |
| Laundry (Operational Support) | Laundry Transaction, Garment Line, Rate Snapshot, Laundry Return, Laundry Delivery, Laundry Exception, Exception Resolution |
| Cross-Domain | Business Event (Cross-Domain Conceptual Model) |


# 8. Primary Business Domains

## Accommodation

Models the permanent physical accommodation managed by the business.

Responsible for:

- Properties
- Flats
- Areas
- Beds
- Accommodation Amendments

---

## Reservation

Models future commitments made before admission.

Responsible for:

- Reservations
- Reservation Preferences
- Reservation Tokens

---

## Resident Lifecycle

Models actual occupancy after admission.

Responsible for:

- Residents
- Stays
- Bed Allocation
- Notice Processing
- Operational Checkout

---

## Finance

Models the financial relationship between the business and its residents.

Responsible for:

- Commercial Agreements
- Commercial Amendments
- Charges
- Payments
- Payment Allocation
- Security Deposits
- Ledger Entries

---

## Operational Support Domains — Laundry

Models specialised resident service workflows that support day-to-day operations.

Responsible for:

- Laundry Item, Service, and Charge Masters
- Laundry Transactions and Garment Lines
- Collection Confirmation and Photographic Evidence
- Inspection and Condition Observations
- Processing Route Selection and Release
- Physical Return Verification and Count Reconciliation
- Physical Delivery Handover (Direct Handover, Room Placement)
- Exceptions, Investigations, and Resolutions
- Service Fulfillment Tracking and Chargeability Determination

---

# 9. Accommodation Domain

## 9.1 Purpose

The Accommodation Domain models the permanent physical structure of the hostel.

It represents accommodation independently of residents, reservations, finance, and operational activities.

The Accommodation Domain answers questions such as:

- What accommodation exists?
- How is accommodation organised?
- Where is a Bed physically located?
- Which Beds belong to a Flat?
- Which Areas exist within a Flat?

Operational activities reference accommodation but do not own it.

---

## 9.2 Accommodation Hierarchy

Accommodation follows a strict ownership hierarchy.

```
Property
    │
    ▼
 Flat
    │
    ▼
 Area
    │
    ▼
 Bed
```

Ownership is exclusive.

Every child Entity belongs to exactly one parent.

---

## 9.3 Aggregate Root

The Aggregate Root of the Accommodation Domain is:

**Flat**

The Flat protects the consistency of all Areas and Beds that it owns.

Structural changes to accommodation occur through the Flat Aggregate.

---

## 9.4 Property

### Purpose

A Property represents a physical hostel operated by the business.

It provides the highest organisational boundary for accommodation.

Although RPGMS currently manages a single Property, the Domain Model supports multiple Properties without structural change.

### Responsibilities

- Organise Flats
- Provide the physical ownership boundary

### Business Rules

- A Property owns one or more Flats.
- A Flat belongs to exactly one Property.
- Properties should normally be archived rather than deleted.

---

## 9.5 Flat

### Purpose

A Flat is the primary operational accommodation unit.

It groups Areas and Beds into a manageable business unit and serves as the Aggregate Root for the Accommodation Domain.

### Responsibilities

- Maintain structural consistency
- Organise Areas
- Protect Bed ownership

### Relationships

Owns:

- Areas

Indirectly owns:

- Beds

Belongs to:

- Property

### Business Rules

- Every Flat belongs to one Property.
- Every Flat contains one or more Areas.
- Beds inherit Flat ownership through their Area.
- A Flat cannot be deleted while any Bed within the Flat is occupied.

---

## 9.6 Area

### Purpose

An Area represents a physical subdivision within a Flat.

Examples include:

- Bedroom
- Hall
- Study Area (future)
- Dormitory Section (future)

### Responsibilities

- Organise Beds
- Represent physical layout

### Relationships

Belongs to:

- Flat

Owns:

- Beds

### Business Rules

- Every Area belongs to exactly one Flat.
- Every Bed belongs to exactly one Area.
- Areas cannot be shared between Flats.

---

## 9.7 Bed

### Purpose

A Bed is the smallest allocatable accommodation unit.

Beds are the operational units used for occupancy management.

### Responsibilities

- Support occupancy
- Support reservation preferences
- Maintain operational status

---

## 9.8 Stable Physical Identifiers

### Architectural Invariant

The Accommodation Domain enforces the architectural concept of **Stable Physical Identifiers** to preserve referential integrity across the system.

- **Flat Number as Physical Identifier:** The Flat Number (e.g. `101`) acts as a primary physical identifier within a Property.
- **Bed Prefix as Identity Component:** The Area Bed Prefix (e.g. `B`, `H`) forms a core component of every generated Bed identity (`{flatNumber}-{prefix}{index}`).

### Referential Integrity Across Domains

Once a Bed is referenced by active occupancy (a Stay record), its identity becomes a permanent operational reference across the system.

To protect referential integrity across Stays, Resident Financial Profiles, Billing, Reports, and Audit trails:
1. **Flat Numbers become immutable** once a Flat contains occupied or on-notice beds.
2. **Bed Prefixes become immutable** once an Area contains occupied or on-notice beds.
3. **Bed inventory cannot be truncated** below the index of an active occupant.

---

## 9.9 Bed Status Operational Ownership Boundary

### Operational Ownership Model

Bed status lifecycle is governed by strict operational ownership boundaries across domains:

| Domain | Owned Statuses | Permitted Operations |
| :--- | :--- | :--- |
| **Accommodation Domain** | `VACANT`, `BLOCKED`, `MAINTENANCE` | Block Bed, Unblock Bed, Start Maintenance, Complete Maintenance |
| **Stay Management Domain** | `OCCUPIED`, `ON_NOTICE` | Check-in, Notice Processing, Check-out |
| **Reservation Domain** | `RESERVED` | Create Reservation, Confirm Reservation, Cancel Reservation |

### Domain Ownership Invariant

The Accommodation Domain owns physical availability and operational holds (`VACANT`, `BLOCKED`, `MAINTENANCE`). The Stay Management Domain owns resident occupancy (`OCCUPIED`, `ON_NOTICE`). Direct state mutation across domain ownership boundaries is strictly prohibited.



### Relationships

Belongs to:

- Area

Referenced by:

- Reservation Preferences
- Bed Allocation
- Maintenance
- Reporting

### Business Rules

- Every Bed belongs to exactly one Area.
- Every Bed ultimately belongs to exactly one Flat.
- A Bed may have at most one Active Stay at any point in time. However, a single Active Stay may occupy multiple Beds within its assigned Flat simultaneously (BCR-002).
- Releasing a single Bed (partial bed release) transitions that Bed to `VACANT` while the Stay remains active in the Flat.
- Historical occupancy is preserved through Stay history.

Operational status (Vacant, Occupied, Reserved, Under Maintenance, Blocked) does not change structural ownership. Operational availability (`VACANT`, `BLOCKED`, `MAINTENANCE`) is owned by the Accommodation Domain, while resident occupancy (`OCCUPIED`, `ON_NOTICE`) is owned by the Stay Management Domain (BR-023).

---

## 9.10 Accommodation Amendments

### Purpose

An Accommodation Amendment is a domain concept representing an immutable business event for operational bed occupancy changes (bed allocations, bed releases, bed transfers) within a Flat during an active Stay.

### Responsibilities

- Record operational changes in bed occupancy within a Flat over time
- Preserve an auditable, immutable operational timeline of accommodation changes
- Support multi-bed allocations and partial bed releases without altering Stay continuity

### Business Rules

- Accommodation Amendments are domain concepts representing immutable business events (BCR-004).
- Accommodation Amendments alter bed occupancy within a Flat without creating a new Stay or terminating an existing Stay.

---

# 10. Reservation Domain

## 10.1 Purpose

The Reservation Domain models commitments made by the business before a resident is admitted.

A Reservation represents an agreement to provide accommodation at a future date, subject to agreed conditions.

Reservations exist independently of Residents and Stays.

A Reservation may eventually result in a Stay, but it is not required to do so.

---

## 10.2 Aggregate Root

The Aggregate Root of the Reservation Domain is:

**Reservation**

The Reservation Aggregate owns all concepts associated with the reservation until the admission process is completed.

---

## 10.3 Reservation

### Purpose

A Reservation represents a future commitment between the business and a prospective resident.

It models the relationship before occupancy begins.

A Reservation is neither a Resident nor a Stay.

### Responsibilities

- Record reservation details
- Record expected admission
- Manage reservation lifecycle
- Record accommodation preferences
- Manage Reservation Tokens
- Support Admission
- Support cancellation

### Relationships

Owns:

- Reservation Preferences
- Reservation Token (when present)

May produce:

- Admission

Never owns:

- Resident
- Stay
- Commercial Agreement

### Business Rules

- A Reservation may exist without a Reservation Token.
- A Reservation may exist without a Bed assignment.
- A Reservation may exist without a Resident record.
- Expected Admission Date may change without changing Reservation identity.
- A Reservation concludes either by Conversion or Cancellation.
- Historical Reservations are preserved permanently.

---

## 10.4 Reservation Lifecycle

A Reservation progresses through the following business states.

```
Created
    │
    ▼
Confirmed
    │
    ▼
Awaiting Admission
    │
    ├────────► Cancelled
    │
    ▼
Converted
```

Business state represents the legal position of the Reservation.

Operational indicators are managed separately.

---

## 10.5 Reservation Preferences

### Purpose

Reservation Preferences record accommodation preferences before Admission.

Preferences assist operational planning but do not reserve accommodation.

### Examples

- Preferred Flat
- Preferred Area
- Preferred Bed
- Lower Bed
- Upper Bed
- Any Bed

### Business Rules

- Preferences are requests, not guarantees.
- Preferences never allocate Beds.
- Actual Bed Allocation occurs during Admission.

---

## 10.6 Reservation Token

### Purpose

A Reservation Token represents money received before Admission to secure a Reservation.

A Reservation Token is distinct from a Security Deposit.

### Responsibilities

- Record reservation commitment
- Support adjustment during Admission
- Support refund
- Support forfeiture

### Business Rules

- Reservation Tokens are optional.
- Reservation Tokens belong exclusively to the Reservation Domain.
- Reservation Tokens never become Security Deposits automatically.
- Business policy determines whether a Reservation Token is adjusted, refunded, or forfeited.
- **Cancellation Disposition (MVP):** When cancelling an Active Reservation with a token, the operator must select either `REFUND` (full token amount) or `FORFEIT` (full token amount). Partial/editable refunds are deferred to V2.
- The Reservation domain preserves the structured Token Disposition outcome (`outcome`, `amount`, `decidedOn`) and cancellation timestamp (`cancelledAt`); financial postings remain the responsibility of Finance.


---

## 10.7 Expected Admission Date

Expected Admission Date represents the currently anticipated Admission date.

It is operational information rather than business state.

Changing the Expected Admission Date does not alter:

- Reservation identity
- Reservation status
- Reservation Token

---

## 10.8 Business State and Operational Indicators

Business state and operational indicators are independent concepts.

Business State examples:

- Created
- Confirmed
- Awaiting Admission
- Converted
- Cancelled

Operational Indicator examples:

- Overdue
- Admission Today
- Awaiting Documents
- Follow-up Required

Operational indicators assist day-to-day management but do not change business state.

---

# 11. Resident Lifecycle Domain

## 11.1 Purpose

The Resident Lifecycle Domain models the relationship between the business and the people who occupy its accommodation.

Unlike the Reservation Domain, which models future commitments, the Resident Lifecycle Domain models actual occupancy.

---

## 11.2 Aggregate Roots

The Resident Lifecycle Domain contains two Aggregate Roots.

- Resident
- Stay

Resident represents identity.

Stay represents occupancy.

---

## 11.3 Resident

### Purpose

A Resident represents a person known to the business.

Resident identity exists independently of any individual Stay.

### Responsibilities

- Maintain personal identity
- Maintain contact information
- Maintain permanent resident profile

### Relationships

May have:

- Zero Active Stays
- One Active Stay
- Multiple Historical Stays

### Business Rules

- Resident identity is permanent.
- A Resident may exist without an Active Stay.
- A Resident may have many historical Stays.
- A Resident may never have more than one Active Stay at any point in time.

---

## 11.4 Stay

### Purpose

A Stay represents one continuous period of residence between Admission and Operational Checkout.

The Stay is the primary operational entity governing the relationship between the Resident and the organisation during that period.

The Stay preserves operational history while exposing a Current Projection for day-to-day operations.

### Responsibilities

- Preserve the operational lifecycle of the Stay
- Maintain Commercial Agreement history
- Maintain Bed Allocation history
- Maintain Business Events
- Expose the Current Projection
- Support Notice processing
- Support Operational Checkout

### Relationships

Belongs to:

- Resident
- Flat (1 Stay = 1 Flat boundary)

Occupies:

- One or more Beds within the assigned Flat

References:

- Commercial Agreement (1 Active)

Owns:

- Bed Allocation history
- Accommodation Amendments history

### Business Rules

- Every Stay belongs to one Resident.
- Every Active Stay belongs to exactly one Flat.
- Every Active Stay occupies one or more Beds within its assigned Flat (BCR-002).
- Every Stay operates under one active Commercial Agreement.
- A Stay concludes only through Operational Checkout.
- Historical Stays remain permanently preserved.

---

## 11.4.1 Current Projection

### Purpose

The Current Projection represents the derived operational state of an active Stay.

It provides the information required for day-to-day hostel operations while preserving complete historical information within the Stay.

### Characteristics

The Current Projection is derived from:

- Current Stay Status
- Active Commercial Agreement
- Active Bed Allocation(s)
- Current Door ID
- Current Notice information

The Current Projection is an operational view.

It is not the authoritative source of historical information.

### Business Rules

- Every Active Stay exposes one Current Projection.
- Historical business information remains authoritative.
- Changes to business history are reflected through updates to the Current Projection.
  
## 11.5 Bed Allocation

### Purpose

Bed Allocation records where a Stay is located over time.

It preserves complete occupancy history.

### Responsibilities

- Record occupancy location
- Record Bed transfer history
- Preserve historical movement

### Relationships

Belongs to:

- Stay

References:

- Bed

### Business Rules

- Every Bed Allocation belongs to one Stay.
- Every Bed Allocation references one Bed.
- Bed Transfers create new Bed Allocation records.
- Historical Bed Allocations are never modified.

---

## 11.6 Admission

Admission is a Business Process.

It is **not** a Business Entity.

Admission converts a prospective resident into an active Stay.

Admission is an Integration Capability responsible for coordinating the creation of Resident, Stay, Commercial Agreement, and Accommodation allocation.

Admission is not a persistent domain aggregate.

Admission may begin from:

- Reservation

or

- Walk-in Admission

A successful Admission performs the following business activities:

1. Create or identify Resident.
2. Create Stay and assign Flat.
3. Establish Commercial Agreement.
4. Allocate one or more Beds within the Flat.
5. Activate Stay.

When Admission originates from a Reservation, the Reservation lifecycle concludes with Conversion.

---

## 11.7 Bed Release

Bed Release is a Business Process.

It is **not** a standalone Business Entity.

Bed Release reduces the allocated Beds of an Active Stay.

The final allocated Bed is released only through Operational Checkout.

### Business Rules

- Bed Release removes bed occupancy without ending the Stay, as long as the Stay remains active in the Flat (BCR-003).
- Every Bed Release generates an immutable Accommodation Amendment.

---

## 11.8 Notice

Notice of Intent to Vacate is an informational domain event.

It communicates the Resident's declared intention to end a Stay at a future date.

### Responsibilities

- Record declared departure intent
- Inform operational and financial planning
- Support Notice revision or withdrawal

### Business Rules

- Notice is an informational event communicating intent, not execution (BCR-006).
- Notice submission does not release allocated Beds, stop recurring billing, or terminate the Stay.
- Notice may be revised or withdrawn prior to Operational Checkout, subject to commercial implications under the active Commercial Agreement (BR-216).

---

## 11.9 Operational Checkout

Operational Checkout is a Business Process and the sole terminal operational Business Event.

It concludes an Active Stay.

Operational Checkout performs the following activities:

- Terminate active Stay occupancy
- Release all allocated Beds within the Flat
- Release assigned operational resources and Door IDs
- Close operational Stay lifecycle

Operational Checkout is strictly separated from Financial Settlement. Operational departure does not perform Financial Settlement.

Historical records remain permanently available after Operational Checkout.

# 12. Finance Domain

## 12.1 Purpose

The Finance Domain models the financial relationship between the business and its residents.

It records financial obligations, payments received, refundable deposits, and the accounting history required to operate the business.

The Finance Domain is responsible for representing financial truth rather than user interface workflows or accounting reports.

---

## 12.2 Aggregate Root

The Aggregate Root of the Finance Domain is:

**Commercial Agreement**

A Commercial Agreement defines the financial terms governing a Stay and provides the foundation from which Charges are generated.

---

## 12.3 Financial Layers

The Finance Domain is organised into three conceptual layers.

```
Commercial Layer
        │
        ▼
Operational Finance
        │
        ▼
Accounting Projection
```

### Commercial Layer

Defines the financial agreement between the business and the Resident.

Responsible for:

- Commercial Agreement

### Operational Finance

Records financial activity.

Responsible for:

- Charges
- Payments
- Payment Allocation
- Security Deposit

### Accounting Projection

Produces financial reporting.

Responsible for:

- Ledger Entries
- Outstanding Balance
- Advance Balance
- Deposit Balance

The Accounting Projection is derived from operational data and does not own business state.

---

## 12.4 Commercial Agreement

### Purpose

A Commercial Agreement defines the financial terms governing a Stay.

Commercial terms owned by the Commercial Agreement include:

- Monthly Rent
- Security Deposit requirement
- Lock-in Period (financial commitment)
- Notice Period requirement
- Commercial Concessions and Discounts

A Commercial Agreement represents the agreed financial commitments rather than the financial transactions themselves.

### Responsibilities

- Define pricing and recurring billing terms
- Define deposit requirements and lock-in period commitment (BCR-007)
- Define notice period requirements and commercial concessions
- Support commercial term revisions via Commercial Amendments

### Relationships

Referenced by:

- Stay

Owns:

- Commercial Amendments history

Produces:

- Charges

### Business Rules

- Every Stay operates under one active Commercial Agreement.
- Lock-in Period belongs to the Commercial Agreement as a financial commitment (BCR-007).
- Revisions to financial terms create immutable Commercial Amendments without altering accommodation or Stay continuity (BCR-005).
- Historical Commercial Agreements and Amendments remain immutable.

---

## 12.4.1 Commercial Amendments

### Purpose

A Commercial Amendment is a domain concept representing an immutable business event for financial term revisions (rent, deposit, lock-in period, concessions) during an active Stay.

### Responsibilities

- Record revisions to financial terms during occupancy
- Preserve an auditable, immutable commercial timeline of financial term changes
- Modify commercial terms without creating a new Stay or altering accommodation

### Business Rules

- Commercial Amendments are domain concepts representing immutable business events (BCR-005).
- Commercial Amendments belong to the Commercial Agreement associated with the Stay.

---

---

## 12.5 Charge

### Purpose

A Charge represents a financial obligation owed by the Resident.

Charges are immutable records of what the business is entitled to collect.

### Examples

- Monthly Rent
- Electricity
- Laundry
- Maintenance Recovery
- Security Deposit Charge

### Responsibilities

- Record financial obligations
- Support payment allocation
- Preserve billing history

### Relationships

Referenced by:

- Payment Allocation

Generated from:

- Commercial Agreement
- Operational activities

### Business Rules

- Charges are never edited after creation.
- Corrections create new Charges.
- Every Charge remains permanently auditable.

---

## 12.5.1 Billing Engine Orchestration Model

### Purpose

The Billing Engine is an Architectural Service that coordinates the discovery, claim locking, and financial batching of billable obligations across Stays. It does not own underlying business pricing or ledger balances.

### Core Concepts

- **`BillingRun`**: An immutable historical record representing an operator-executed billing workflow over a selected processing period (Preview → Revalidate → Confirm → Claim → Process).
- **`BillingOperation`**: Represents the exclusive processing scope and execution outcome for one Stay within a Billing Run.
- **`BillingClaim`**: An ephemeral operational lock (`CLAIM_ACQUIRED` → `CLAIM_COMMITTED` / `CLAIM_RELEASED`) guaranteeing that an uncommitted obligation cannot be billed more than once across concurrent or overlapping runs ("First Claim Wins").
- **`DiscoveredObligation`**: A normalized read-only representation of an upstream domain obligation (Rent cycle, Electricity participant share, Laundry fee) exposed via domain discovery adapters, carrying financial commitment status (`UNCOMMITTED` vs `COMMITTED`).

### Business Rules

- The Billing Engine orchestrates execution; it does not calculate rent pricing, utility tariffs, or ledger totals.
- Domain-posted invoices (such as Electricity supplier bill allocations confirmed under BR-E-45) remain independent Finance Bills and are never re-billed or mutated by Billing Runs.
- Financial obligations are attributed to the historical Stay regardless of operational status (permitting post-checkout and alumni utility billing under BR-E-42 and BR-E-43).

---

## 12.6 Credits

Credits represent negative Charges.

Examples include:

- Billing Adjustment
- Promotional Discount
- Goodwill Credit
- Refund Adjustment

Credits participate in financial calculations using the same mechanisms as Charges.

Credits are not separate Business Entities.

---

## 12.7 Payment

### Purpose

A Payment records money received by the business.

Payments represent cash movement independently of billing.

### Responsibilities

- Record receipt of funds
- Support allocation
- Preserve payment history

### Relationships

Allocated to:

- Charges

Through:

- Payment Allocation

### Business Rules

- Payments are immutable.
- One Payment may settle multiple Charges.
- Multiple Payments may settle one Charge.
- Unallocated balances remain available for future allocation.

---

## 12.8 Payment Allocation

### Purpose

Payment Allocation records how Payments settle Charges.

It preserves settlement history independently of the Payment itself.

### Responsibilities

- Allocate Payments
- Record settlement history
- Support partial payments

### Relationships

References:

- Payment
- Charge

### Business Rules

- Allocation never changes the original Payment.
- Allocation never changes the original Charge.
- Historical allocations remain permanently preserved.

---

## 12.9 Security Deposit

### Purpose

A Security Deposit represents refundable money held by the business during a Stay.

Although funded through a Payment, it is managed independently because it represents a liability rather than revenue.

### Responsibilities

- Track deposit balance
- Support adjustment
- Support refund
- Support forfeiture

### Relationships

Originates from:

- Security Deposit Charge
- Payment

Referenced during:

- Checkout

### Business Rules

- Security Deposit is tracked separately from Rent.
- Security Deposit remains associated with the Stay.
- Refunds and forfeitures are recorded as independent financial events.

---

## 12.10 Ledger Entry

### Purpose

A Ledger Entry represents the accounting projection of financial events.

Ledger Entries support reporting without becoming the source of business truth.

### Responsibilities

- Financial reporting
- Audit
- Account balances

### Business Rules

- Ledger Entries are derived.
- Ledger Entries never own financial state.
- Business transactions remain the source of truth.

---

## 12.11 Derived Financial Concepts

The following concepts are calculated rather than stored as independent Business Entities.

- Outstanding Balance
- Advance Balance
- Deposit Balance
- Account Balance

These values are derived from Charges, Payments and Payment Allocations.

---

# Operational Support Domain — Laundry

## Purpose

The Laundry Domain models the complete operational lifecycle of resident laundry services within RPGMS.

It provides a unified operational model supporting both in-house processing and external vendor processing, preserving physical counting, rate snapshots, inspection evidence, returns verification, physical delivery handovers, exception investigations, and service-level chargeability determination.

---

## Aggregate Root

The Aggregate Root of the Laundry Domain is:

**`LaundryTransaction`**

The `LaundryTransaction` protects the operational consistency of all Garment Lines, Rate Snapshots, Return records, Delivery records, and Exceptions that it owns.

---

## Core Entities and Domain Concepts

| Concept | Nature | Responsibility |
|---|---|---|
| `LaundryTransaction` | Aggregate Root | Represents the complete operational relationship for one laundry collection during a Stay |
| `GarmentLine` | Child Entity | Represents a physical piece quantity of a Laundry Item with uniform requested services |
| `ServiceAllocation` | Child Entity | Represents a requested operational service quantity on a GarmentLine |
| `LaundryChargeRecord` | Child Entity | Represents an immutable, deterministic operational charge tranche owned by ServiceAllocation |
| `RateSnapshot` | Value Object | Preserves the historical Charge Master rates applicable at Collection Confirmation |
| `LaundryBusinessEvent` | Value Object | Immutable audit fact recording meaningful operational events (11 canonical events) |
| `ConditionObservation` | Entity / Value Object | Records pre-processing physical condition or pre-existing defects |
| `LaundryReturn` | Entity | Records physical quantities received back into RPGMS custody verified by staff count |
| `LaundryDelivery` | Entity | Records physical handover of returned laundry via Direct Handover or Room Placement |
| `DeliveryLine` | Entity / Value Object | Specific garment line quantity included in a physical delivery |
| `LaundryException` | Entity | Records operational issues (missing, damaged, disputes, service failures) with independent lifecycle |
| `ExceptionResolution` | Entity / Value Object | Final business outcome of an exception investigation |

---

## Master Data

- **Laundry Item Master**: Configurable catalog of recognized laundry items (e.g. Shirt, Trouser).
- **Laundry Service Master**: Configurable catalog of available resident services (e.g. Cleaning, Ironing).
- **Laundry Charge Master**: Configurable rate matrix for Item + Service combinations with effective periods.

---

## Domain Ownership

The Laundry Domain owns:

- Laundry Item Master, Service Master, Charge Master, and Rate Snapshots
- Laundry Transactions, Garment Lines, and piece counts
- Collection Confirmation and photographic evidence
- Condition Observations and pre-processing inspections
- Processing Route selection (IN_HOUSE / EXTERNAL_VENDOR) and Processing Release
- Verified physical Returns and count reconciliation
- Physical Deliveries and Handover Methods (DIRECT_HANDOVER, ROOM_PLACEMENT)
- Laundry Exceptions, Investigations, and Resolutions
- Service Fulfillment tracking and operational chargeability determination
- Emission of `LaundryChargeRaised` domain events

The Laundry Domain does **not** own:

- Resident identity (owned by Resident domain)
- Stay lifecycle and occupancy (owned by Stay domain)
- Room/bed allocation (owned by Accommodation domain)
- Financial Charges, Payments, and Ledger entries (owned by Finance domain)

---

## Physical Reconciliation Invariant

$$\text{Outstanding} = \text{Collected} - \text{Delivered} - \text{Resolved}$$

- **Physical Completion**: Occurs strictly when $\text{Outstanding} = 0$.
- **Resolved Quantity**: Physical pieces conclusively accounted for through Exception Resolution where physical delivery will no longer occur (such as permanently lost laundry).
- **Separation of Facts**: $\text{Returned} \neq \text{Delivered}$.

---

## Chargeability and Finance Integration

1. **Chargeability Rule**: A service is chargeable only when fulfilled AND the affected physical quantity has been delivered.
2. **Event Emission**: Laundry emits `LaundryChargeRaised` upon confirmed delivery of fulfilled services.
3. **Finance Authority**: Finance creates the authoritative Charge in the Unified Stay Ledger. Laundry never maintains a parallel financial ledger.
4. **Billing Engine**: The Billing Engine discovers unbilled obligations via `LaundryDiscoveryAdapter` without calculating laundry rates or altering pricing.

---

# 13. Cross-Domain Architecture

## 13.1 Aggregate Overview

The Domain Model contains the following Aggregate Roots.

| Domain | Aggregate Root |
|---------|----------------|
| Accommodation | Flat |
| Reservation | Reservation |
| Resident Lifecycle | Resident |
| Resident Lifecycle | Stay |
| Finance | Commercial Agreement |
| Laundry | LaundryTransaction |

Aggregate Roots protect business consistency within their boundaries.

---

## 13.2 Ownership Principles

Ownership follows strict hierarchical rules.

```
Property
    │
    ▼
Flat
    │
    ▼
Area
    │
    ▼
Bed
```

```
Reservation
    │
    ├── Reservation Preferences
    └── Reservation Token
```

```
Resident
    │
    ▼
Stay
    │
    ▼
Bed Allocation
```

Business references never imply ownership.

---

## 13.3 Domain Relationships

The primary business relationships are shown below.



Business Processes coordinate domains.

Business Entities own business state.

---

Reservation
      │
      ▼
Admission
      │
      ▼
Resident
      │
      ▼
Current Stay
      │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Commercial   Bed     Business
Agreement Allocation Events
      │
      ▼
Current Projection
      │
      ▼
Finance

## 13.4 Business Processes

The following activities are Business Processes rather than Business Entities:

- Reservation Management
- Admission
- Monthly Billing
- Payment Collection
- Bed Allocation & Additional Bed Allocation
- Bed Release
- Bed Transfer
- Notice Processing
- Operational Checkout
- Financial Settlement & Deposit Settlement

Business Processes coordinate work across multiple Aggregates.

They do not own business information.

---

## 13.5 Domain Invariants

The following business rules must always remain true.

### Accommodation

- Every Bed belongs to one Area.
- Every Area belongs to one Flat.
- Every Flat belongs to one Property.

### Occupancy

- A Bed may have at most one Active Stay at any point in time.
- A single Active Stay belongs to exactly one Flat and occupies one or more Beds within that Flat (BCR-002).
- A Resident may have at most one Active Stay at any point in time.
- Operational Checkout is the sole terminal operational Business Event concluding a Stay and releasing accommodation (BCR-003, BCR-006).

### Reservation

- Reservations never allocate Beds.
- Admission performs Bed Allocation within a Flat.

### Finance

- Charges are immutable.
- Payments are immutable.
- Commercial term revisions create immutable Commercial Amendments (BCR-005).
- Lock-in Period belongs to the Commercial Agreement as a financial commitment (BCR-007).
- Payment Allocation preserves settlement history.
- Security Deposits remain separate from revenue.

### Laundry

- Physical laundry is counted once per garment regardless of the number of requested services.
- Confirmed collection quantities, requested services, and Rate Snapshots become immutable at Collection Confirmation.
- Historical Rate Snapshots never reprice when the Laundry Charge Master changes.
- Processing Route is an operational choice and does not determine resident pricing.
- Deliverable quantity shall never exceed verified physically returned and available quantity.
- Physical completion occurs strictly when $\text{Collected} - \text{Delivered} - \text{Resolved} = 0$.
- A requested service becomes chargeable only when fulfilled and the affected physical quantity is delivered.
- No physical quantity shall be charged more than once for the same service.
- Laundry emits `LaundryChargeRaised`; Finance creates and owns the authoritative financial Charge.

Violating these invariants would compromise the integrity of the business model.

---

## 13.6 Master Data and Transaction Data

The Domain Model distinguishes between relatively static reference information and operational business transactions.

### Master Data

- Property
- Flat
- Area
- Bed
- Resident
- Commercial Agreement
- Laundry Item Master
- Laundry Service Master
- Laundry Charge Master

### Transaction Data

- Reservation
- Stay
- Bed Allocation
- Charge
- Payment
- Payment Allocation
- Security Deposit
- Laundry Transaction
- Garment Line
- Rate Snapshot
- Laundry Return
- Laundry Delivery
- Laundry Exception
- Exception Resolution

Master Data defines the business.

Transaction Data records business activity.

---

## 13.7 Architectural Principles

The Domain Model is governed by the following architectural principles.

- Business concepts remain independent of technology.
- Aggregate ownership is explicit.
- Historical information is preserved.
- Financial events are immutable.
- Derived information is calculated rather than stored.
- Business Processes coordinate entities without owning them.
- References communicate relationships but never ownership.

---

## 13.8 Business Event Model & Decision Support

### Business Event Model

The Domain Model incorporates a cross-domain **Business Event** conceptual model (BCR-008, BAP-002).

A Business Event represents an immutable record of a completed business activity (such as Admission, Bed Allocation, Bed Release, Accommodation Amendment, Commercial Amendment, Notice Submission, or Operational Checkout).

The Business Event model is a cross-domain conceptual model rather than a mandatory persisted entity or aggregate root. Current operational and financial state across all domains is derived from the sequence of approved Business Events.

### Decision Support Principle (BAP-001)

RPGMS operates under the **Decision Support** principle:

- The system calculates, validates, and generates recommendations (e.g. rent recalculations, deposit refunds, payment allocations, or operational warnings).
- Final approval and posting of operational or commercial decisions rests with an authorised human operator.
- System calculations or recommendations do not automatically mutate business state without explicit operator authorization.

---

# 14. Business Lifecycle

The following diagram illustrates the conceptual lifecycle of a resident within RPGMS.


Prospective Resident  
│  
▼  
Reservation (Optional)  
│  
▼  
Admission  
│  
▼  
Resident Profile (Permanent)  
│  
▼  
Active Stay (Bounded by 1 Flat)  
│  
├──────────────────────┬──────────────────────┬──────────────────────┐  
│                      │                      │                      │  
▼                      ▼                      ▼                      ▼  
Billing & Charges    Bed Allocations /      Commercial Amendments   Notice of Intent  
(Commercial Agr.)    Releases / Transfers   (Term Revisions)        (Informational)  
│                    (Accom. Amendments)      │                      │  
└──────────────────────┼──────────────────────┴──────────────────────┘  
                       │  
                       ▼  
             Operational Checkout  
             (Sole Terminal Event)  
                       │  
                       ▼  
              Financial Settlement  
             (Commercial Closure)  
                       │  
                       ▼  
               Historical Records

---

# 15. Domain Evolution

The RPGMS Domain Model is expected to evolve as the business grows.

Future enhancements should extend the existing model while preserving the principles, Aggregate boundaries, and business responsibilities defined in this document.

The Laundry domain has formally transitioned from a future candidate to an approved Operational Support Domain specification (`docs/LAUNDRY_SPECIFICATION.md`).

Potential future domains include:

- Visitor Management
- Staff Management
- Vendor Management
- Inventory Management
- Housekeeping
- Asset Management
- Notifications
- Compliance
- Multi-Property Operations

Future domains should integrate with existing business concepts through explicit relationships rather than altering established ownership boundaries.

---

# 16. Domain Evolution Guidelines

The following principles should guide future changes to the Domain Model.

## Preserve Business First

Business requirements should always drive changes to the Domain Model.

Technical implementation details must never dictate business concepts.

---

## Preserve Historical Integrity

Historical information is a business asset.

Domain Events should be recorded rather than overwritten. Corrections should create new business records wherever practical.

---

## Respect Aggregate Boundaries

Aggregate ownership should remain explicit and consistent.

References between Aggregates communicate relationships but must never imply ownership.

---

## Introduce New Entities Carefully

A new Entity should only be introduced when it has:

- Independent identity
- Independent responsibility
- Independent lifecycle
- Independent business rules
- Long-term business significance

Otherwise, extending an existing Entity or introducing a Value Object should be preferred.

---

## Separate Business from Technology

The Domain Model should remain independent of:

- Database design
- API contracts
- User interface design
- Frameworks
- Programming languages
- Deployment architecture

Implementation may evolve without changing the business model.

---

# 17. Relationship to Implementation

The Domain Model provides the conceptual foundation for the implementation of RPGMS 2.0.

The software architecture, database design, APIs, user interface, and application services should implement the business concepts defined in this document while remaining free to optimise technical concerns.

Typical implementation mappings include:

| Domain Concept | Typical Implementation |
|----------------|------------------------|
| Aggregate Root | Domain Service Boundary |
| Entity | Domain Object |
| Value Object | Immutable Value Type |
| Business Process | Application Service / Workflow |
| Reference | Identifier / Foreign Key |
| Derived Concept | Computed Projection |

These mappings are implementation guidance only.

The Domain Model remains the authoritative description of the business regardless of implementation technology.

---

# 18. Document Governance

This document is one of the constitutional documents of RPGMS 2.0.

It should be updated only when the underlying business concepts, Aggregate boundaries, or business relationships change.

Changes to implementation details, application architecture, user interface, database schema, or technology stack should not normally require changes to this document.

The Domain Model should remain stable and evolve only as the business evolves.

---

# 19. Conclusion

The RPGMS Domain Model defines the conceptual structure of the business and establishes a common language for business stakeholders, developers, architects, and AI coding assistants.

It defines:

- Core business domains
- Business entities
- Aggregate boundaries
- Ownership relationships
- Business processes
- Financial responsibilities
- Historical preservation principles
- Rules governing future evolution

Together with **BUSINESS_CONSTITUTION.md**, **BUSINESS_RULES.md**, and **ARCHITECTURE.md**, this document forms part of the constitutional foundation of RPGMS 2.0.

Future development should preserve the business principles defined in these documents while allowing the implementation to evolve as business requirements and technology change.

