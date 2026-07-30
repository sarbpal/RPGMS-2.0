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
| BUSINESS_BLUEPRINT.md | Business vision, objectives and scope |
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
| Flat | Primary accommodation unit within a Property |
| Area | A physical subdivision within a Flat |
| Bed | The smallest allocatable accommodation unit |
| Reservation | A future commitment to admit a prospective resident |
| Resident | A person known to the business |
| Stay | One continuous period of occupancy |
| Commercial Agreement | The financial terms governing a Stay |
| Charge | A financial obligation owed by the Resident |
| Payment | Money received by the business |
| Payment Allocation | The relationship between Payments and Charges |
| Security Deposit | Refundable liability held during a Stay |
| Ledger Entry | Derived accounting representation of financial events |

These terms form the common language used throughout the project.

---

# 7. Domain Overview

RPGMS is organised into four primary business domains.

```
Accommodation
        │
        ▼
Reservation
        │
   Admission
        ▼
Resident Lifecycle
        │
        ▼
Finance
```

Each domain represents a distinct area of business responsibility.

Business Processes coordinate interactions between domains without transferring ownership of business concepts.


## Core Business Entities

| Domain | Entities |
|---------|----------|
| Accommodation | Property, Flat, Area, Bed |
| Reservation | Reservation, Reservation Preference, Reservation Token |
| Resident Lifecycle | Resident, Stay, Bed Allocation |
| Finance | Commercial Agreement, Charge, Payment, Payment Allocation, Security Deposit, Ledger Entry |


# 8. Primary Business Domains

## Accommodation

Models the permanent physical accommodation managed by the business.

Responsible for:

- Properties
- Flats
- Areas
- Beds

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

---

## Finance

Models the financial relationship between the business and its residents.

Responsible for:

- Commercial Agreements
- Charges
- Payments
- Payment Allocation
- Security Deposits
- Ledger Entries

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
- A Bed may have at most one Active Stay at any point in time.
- Historical occupancy is preserved through Stay history.

Operational status (Vacant, Occupied, Reserved, Under Maintenance, Blocked) does not change structural ownership.

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

A Stay represents one continuous period during which a Resident occupies accommodation.

A Stay is the primary operational entity of the Resident Lifecycle Domain.

### Responsibilities

- Manage occupancy
- Reference Commercial Agreement
- Maintain operational history
- Support Bed Transfers
- Support Checkout

### Relationships

References:

- Resident
- Bed
- Commercial Agreement

Owns:

- Bed Allocation history

### Business Rules

- Every Stay belongs to one Resident.
- Every Stay references one Commercial Agreement.
- Every Active Stay occupies one Bed.
- A Stay concludes only through Checkout.
- Historical Stays remain permanently preserved.

---

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

Admission may begin from:

- Reservation

or

- Walk-in Admission

A successful Admission performs the following business activities:

1. Create or identify Resident.
2. Create Stay.
3. Create Commercial Agreement.
4. Allocate Bed.
5. Activate Stay.

When Admission originates from a Reservation, the Reservation lifecycle concludes with Conversion.

---

## 11.7 Checkout

Checkout is a Business Process.

It concludes an active Stay.

Typical Checkout activities include:

- End occupancy
- Release Bed
- Settle outstanding finances
- Settle Security Deposit
- Close Stay

Historical records remain permanently available after Checkout.

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

A Commercial Agreement defines the commercial terms under which a Stay operates.

Examples include:

- Monthly Rent
- Security Deposit
- Electricity Policy
- Included Services

A Commercial Agreement represents the agreed financial terms rather than the financial transactions themselves.

### Responsibilities

- Define pricing
- Define billing policy
- Define deposit requirements
- Support agreement revisions

### Relationships

Referenced by:

- Stay

Produces:

- Charges

### Business Rules

- Every Stay references one Commercial Agreement.
- A Commercial Agreement may be superseded by a newer Agreement.
- Previous Agreements remain part of business history.

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

```
Reservation
      │
      ▼
 Admission
      │
      ▼
 Resident
      │
      ▼
   Stay
      │
      ▼
Commercial Agreement
      │
      ▼
 Finance
```

Business Processes coordinate domains.

Business Entities own business state.

---

## 13.4 Business Processes

The following activities are Business Processes rather than Business Entities.

- Reservation Management
- Admission
- Monthly Billing
- Payment Collection
- Bed Transfer
- Checkout
- Deposit Settlement

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

- A Bed may have at most one Active Stay.
- A Resident may have at most one Active Stay.

### Reservation

- Reservations never allocate Beds.
- Admission performs Bed Allocation.

### Finance

- Charges are immutable.
- Payments are immutable.
- Payment Allocation preserves settlement history.
- Security Deposits remain separate from revenue.

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

### Transaction Data

- Reservation
- Stay
- Bed Allocation
- Charge
- Payment
- Payment Allocation
- Security Deposit

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
Resident  
│  
▼  
Stay  
│  
├───────────────┐  
│               │  
▼               ▼  
Billing     Bed Transfer  
│               │  
└───────┬───────┘  
│  
▼  
Checkout  
│  
▼  
Historical Records

---

# 15. Domain Evolution

The RPGMS Domain Model is expected to evolve as the business grows.

Future enhancements should extend the existing model while preserving the principles, Aggregate boundaries, and business responsibilities defined in this document.

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

Together with **BUSINESS_BLUEPRINT.md**, **BUSINESS_RULES.md**, and **ARCHITECTURE.md**, this document forms part of the constitutional foundation of RPGMS 2.0.

Future development should preserve the business principles defined in these documents while allowing the implementation to evolve as business requirements and technology change.

