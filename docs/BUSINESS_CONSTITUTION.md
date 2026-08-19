# RPGMS 2.0

# RPGMS 2.0 Business Constitution

**Document ID:** RPGMS-BP-001
**Version:** 2.0
**Status:** Approved
**Owner:** Product Architecture
**Classification:** Core Business Architecture
**Applies To:** RPGMS 2.0+
**Last Updated:** July 2026

---

# Document Purpose

The Business Constitution is the authoritative description of the business architecture of RPGMS 2.0.

It defines how the business operates independently of software implementation.

The purpose of this document is to establish a stable and implementation-independent business model before software development. Every major business concept, business object, workflow, responsibility and architectural principle is defined here.

This document serves as the foundation for:

- Business Rules
- Business Policies
- Software Architecture
- Database Design
- User Interface Design
- API Design
- AI-assisted Development
- Testing Strategy
- Future Product Evolution

Where implementation differs from this document, the implementation should be reviewed first. Changes to the business architecture should only be made after deliberate architectural review.

---

# Vision

RPGMS (Ritu PG Management System) is designed to be a complete business operating system for managing paying guest accommodation.

Its objective is not merely to record transactions, but to accurately model how the business operates.

The system should:

- represent real-world business objects
- preserve complete business history
- support informed business decisions
- minimise operational errors
- remain flexible where business policy permits
- enforce business rules consistently
- provide complete auditability
- remain scalable for future business growth

The software exists to support the business—not define it.

---

# Scope

Version 1.0 of RPGMS focuses on the complete lifecycle of resident accommodation and its associated commercial operations.

The primary business domains include:

- Resident Management
- Reservation Management
- Admission
- Accommodation
- Operational Support Services (Laundry)
- Commercial Agreements
- Billing
- Charges
- Payments
- Unified Stay Ledger
- Settlement
- Reporting
- Compliance
- Configuration
- Audit
- Document Management
- Notifications
- Search
- Roles & Permissions

The architecture is intentionally designed to support future expansion without requiring redesign.

Examples include:

- Resident Portal
- Mobile Applications
- Multi-property Operations
- Vendor Management
- Expense Management
- Asset Management
- Business Intelligence
- AI-assisted Operations

These future capabilities are architectural extensions rather than changes to the underlying business model.

---

# Intended Audience

This document is intended for:

- Product Owners
- Business Owners
- Software Architects
- Developers
- AI Coding Assistants
- Quality Assurance Engineers
- Future Project Contributors

It should be considered the primary business reference for every architectural and implementation decision within RPGMS.

---

# Relationship to Other Project Documents

The Business Constitution defines the business architecture.

Other project documents derive their direction from this document.

| Document | Primary Purpose |
|----------|-----------------|
| BUSINESS_BLUEPRINT.md | Business Architecture |
| ARCHITECTURE.md | Software Architecture |
| PROJECT_RULES.md | Engineering Standards |
| BUSINESS_RULES.md | Detailed Business Rules |
| ROADMAP.md | Product Planning |
| CHANGELOG.md | Historical Changes |
| AI_CONTEXT.md | AI Project Context |
| AI_WORKFLOW.md | AI Development Workflow |

The Business Constitution takes precedence whenever business intent must be interpreted.

---

# How to Read This Document

The Business Constitution is organised by business domains rather than software modules.

Each chapter explains:

- Why the business object exists
- What it represents
- What responsibilities it owns
- How it relates to other business objects
- Which business rules govern it

Implementation details are intentionally excluded wherever possible.

The objective is to describe the business independently of technology.

---

# Design Philosophy

The architecture of RPGMS is based upon a simple principle:

> **Software should model the business—not force the business to model the software.**

Every significant architectural decision within RPGMS follows this philosophy.

Business objects exist because they represent real-world entities.

Business rules exist because they represent immutable truths.

Business policies exist because organisations require operational flexibility.

Historical facts are preserved rather than overwritten.

Business decisions remain explainable through recorded events, audit history and documented business rules.

The architecture therefore prioritises:

- Clarity over complexity
- Consistency over convenience
- Business correctness over implementation shortcuts
- Long-term maintainability over short-term optimisation

These principles guide every chapter that follows.

---

# Business Philosophy

Business Philosophy defines the fundamental beliefs upon which RPGMS has been designed.

These principles are independent of technology, programming language, database design or user interface. They describe how the business itself should operate and therefore influence every architectural decision throughout the system.

---

## BP-001 History is Immutable

Historical business facts must never be overwritten.

When business circumstances change, RPGMS records new Domain Events rather than modifying historical records.

Examples include:

- Commercial Agreement amendments
- Charge adjustments
- Payment reversals
- Deposit adjustments
- Settlement corrections
- Compliance updates

This principle preserves the complete history of every business transaction and ensures that the system always reflects what actually occurred.

---

## BP-002 Assisted Decision Making

RPGMS assists the operator but does not replace business judgement.

The system should:

- Calculate
- Validate
- Recommend
- Warn
- Record
- Audit

The final business decision remains with an authorised operator wherever business policy allows.

Typical examples include:

- Payment allocation
- Deposit adjustment
- Commercial concessions
- Bed allocation
- Settlement approval
- Admission with deferred payment

Where recommendations are overridden, the decision must be recorded and auditable.

---

## BP-003 Controlled Flexibility

Routine business operations should remain simple, efficient and predictable.

Exceptional business operations should remain possible, but only through controlled and auditable processes.

Examples include:

- Commercial Agreement amendments
- Charge waivers
- Payment reversals
- Deposit refunds
- Billing corrections
- Manual settlement adjustments

Exceptional operations should record:

- Authorised user
- Date and time
- Business reason
- Supporting audit trail

---

## BP-004 Business Object Ownership

Every piece of business information belongs to the business object that naturally owns it.

Examples include:

| Business Object | Owns |
|-----------------|------|
| Resident | Identity |
| Stay | Occupancy |
| Reservation | Future occupancy |
| Commercial Agreement | Financial terms |
| Charge | Financial obligation |
| Payment | Money received |
| Unified Stay Ledger | Financial history |
| Settlement | Financial closure |
| Document | Supporting evidence |

No information should exist solely because a particular screen or report requires it.

Business objects remain the primary source of truth.

---

## BP-005 Business Rules and Business Policies

RPGMS distinguishes between Business Rules and Business Policies.

### Business Rules

Business Rules define immutable truths about the business.

They cannot be overridden through configuration or user permissions.

Examples include:

- A Stay belongs to exactly one Resident.
- A bed cannot be occupied by multiple residents simultaneously.
- Historical financial records are never overwritten.

---

### Business Policies

Business Policies define how the organisation chooses to operate.

Policies may vary between organisations and may evolve over time.

Examples include:

- Standard monthly rent
- Security deposit amount
- Notice period
- Reservation validity
- Lock-in period
- Billing reminders

Business Policies are configurable without changing the software.

---

## BP-006 Explainability

Every significant business decision should be explainable.

The system should always be able to answer questions such as:

- Why was this charge created?
- Why was a deposit adjusted?
- Why was a concession approved?
- Why was a payment reversed?
- Why was a resident charged this amount?

The explanation should be traceable through:

- Business Rules
- Business Policies
- Domain Events
- Audit History
- Recorded Exceptions

Business decisions should never depend upon undocumented operator knowledge.

---

# Business Architecture Principles

Business Architecture Principles define the enduring design philosophy of RPGMS 2.0.

Unlike business rules, which may evolve as business policies change, these principles describe the fundamental structure of the business domain and the responsibilities of its core entities. They guide business modelling, software architecture, implementation, and future evolution of the system.

All business operations, rules, and domain models shall conform to these principles.

---

## BAP-001 — Decision Support

### Statement

RPGMS is a decision support system.

The system validates business rules, performs calculations, detects inconsistencies, and recommends actions. Final business decisions remain the responsibility of an authorised human operator.

### Rationale

Hostel management decisions frequently depend upon business judgement, negotiation, exceptional circumstances, and customer relationships. The system assists operators by providing accurate calculations and recommendations while preserving human control over final decisions.

---

## BAP-002 — Business Events

### Statement

Every significant change in the business shall be represented as an explicit business event.

Business events describe what happened. They do not rewrite history.

### Rationale

Operational and financial history must remain complete, auditable, and explainable. Recording immutable business events instead of overwriting previous state provides a permanent record of how a Stay evolved over time.

---

## BAP-003 — Identity

### Statement

A Resident represents a person.

A Stay represents a period of residence.

The identity of a Resident is independent of any individual Stay.

### Rationale

Residents may leave and return multiple times throughout the lifetime of the business. Their identity, documents, and history remain continuous across multiple stays.

---

## BAP-004 — Accommodation

### Statement

Accommodation describes where a Resident lives during a Stay.

Accommodation is an operational concern and is independent of commercial agreements.

### Rationale

Operational accommodation may change during a Stay (e.g. bed changes, partial bed releases, or accommodation amendments) without creating a new Stay or altering commercial commitments directly.

---

## BAP-005 — Commercial

### Statement

Commercial Agreements define the financial relationship between the Resident and the business.

### Rationale

Commercial terms such as rent, deposits, lock-in periods, concessions, and refunds may change independently of accommodation. Separating commercial concerns from accommodation provides operational flexibility while preserving business history.

---

## BAP-006 — Separation of Operational and Commercial Concerns

### Statement

Operational events and commercial events are distinct business concerns.

Operational changes may trigger commercial recommendations, but they remain independent.

### Rationale

A change in accommodation does not automatically imply a change in financial obligations. Likewise, a commercial concession does not require an accommodation change. Maintaining this separation simplifies business logic and preserves decision support governance.

---

# Core Architectural Principles

The following architectural principles govern the design of RPGMS.

Unlike Business Philosophy, which describes how the business operates, these principles describe how the software models that business.

---

## AP-001 Event-Driven History

Business history is recorded through events rather than by modifying historical records.

---

## AP-002 Object-Centric Design

Every business object owns its own information, responsibilities and lifecycle.

Business information should never be duplicated unnecessarily.

---

## AP-003 Separation of Operational and Financial Processes

Operational activities and financial activities are related but independent.

Examples include:

- Checkout is separate from Settlement.
- Admission is separate from Payment.
- Reservation is separate from Stay.

This separation allows each business process to complete independently while remaining fully traceable.

---

## AP-004 Audit for Accountability

Every significant business operation should be attributable to an authorised user.

Audit records provide accountability rather than business history.

---

## AP-005 Future Compatibility

Architectural decisions should support future business growth without requiring redesign.

Examples include:

- Resident Portal
- Mobile Applications
- Multiple Properties
- AI-assisted Operations
- Additional Business Domains

Version 1.0 should remain focused while preserving long-term extensibility.

---

## AP-006 Simplicity First

Where multiple architectural solutions are possible, preference should be given to the solution that is:

- Easier to understand
- Easier to maintain
- Easier to explain
- Easier to extend

Complexity should only be introduced when it provides clear long-term value.

---

# Core Business Domain

The Resident and the Stay together form the foundation of the RPGMS business model.

Although closely related, they represent two fundamentally different business concepts.

Understanding this distinction is essential because almost every other business object within RPGMS depends upon it.

---

# Core Business Architecture

Business Architecture defines how RPGMS models, manages and preserves organisational truth.

These principles apply uniformly across every business domain and every workspace within RPGMS.

They are independent of implementation technology and shall remain stable as the system evolves.

All workspace specifications, engineering decisions and implementation details shall conform to these constitutional principles.

The objective of these principles is to ensure that RPGMS maintains a consistent business architecture throughout its lifetime.

## Business Objects

Business Objects represent long-lived entities within the organisation.

They own Business Truth and continue to exist beyond individual business transactions.

Examples include:

- Reservation
- Resident
- Stay
- Accommodation
- Finance

Business Objects possess the following characteristics:

- They own Business Truth.
- They have defined business lifecycles.
- They support ongoing operational management.
- They are continuously updated throughout their lifetime.

Business Objects represent the enduring state of the organisation.

## Business Transactions

Business Transactions establish, modify or conclude Business Truth.

Unlike Business Objects, Business Transactions do not permanently own information.

Their purpose is to coordinate the creation, transfer or conclusion of Business Truth.

Examples include:

- Admission
- Checkout
- Settlement
- Admission Reversal

Business Transactions possess the following characteristics:

- They are temporary.
- They execute atomically.
- They coordinate multiple Business Objects.
- They transfer Business Ownership.
- They generate Business Events.

Business Transactions conclude immediately after their business responsibilities have been completed.
## Business Truth

Business Truth represents information formally accepted by the organisation.

Business Truth is established only through authorised business transactions.

Business Truth shall always have one authoritative owner.

Business Truth evolves through the resident lifecycle but ownership remains explicit at every stage.

The transition from expectation to Business Truth follows the constitutional business model.

Expected Truth

↓

Business Confirmation

↓

Business Transaction

↓

Business Truth

↓

Operational Ownership

## Business Responsibility

Every business capability within RPGMS shall have a clearly defined business responsibility.

Business responsibility describes why a business object or business transaction exists.

Responsibilities shall be:

- explicit,
- non-overlapping,
- business-oriented,
- independent of implementation.

Where business responsibilities become unclear or overlap, the architecture shall be revised before implementation proceeds.

---

# Resident

## Purpose

A Resident represents the permanent identity of a person who interacts with the organisation.

The Resident exists independently of accommodation, payments or occupancy.

The Resident remains part of the business history even after every Stay has been completed.

---

## Definition

A Resident is the authoritative record describing an individual.

The Resident represents **who the person is**, not **where they currently live**.

A Resident may:

- Never stay
- Stay once
- Stay multiple times
- Return after several years

The Resident record remains the same throughout.

---

## Responsibilities

The Resident owns all permanent identity information.

Typical information includes:

- Full Name
- Photograph
- Date of Birth
- Gender
- Mobile Number
- Email Address
- Permanent Address
- Emergency Contact
- Government Identity Documents
- Compliance Documents

The Resident does not own occupancy information.

---

## Relationships

A Resident may have:

- Zero or many Reservations
- Zero or many Stays
- Zero or many Commercial Agreements (through Stays)
- Zero or many Documents
- Zero or many Notifications

Every Stay belongs to exactly one Resident.

---

## Lifecycle

Typical lifecycle:

Resident Created

↓

Identity Verified

↓

One or More Stays

↓

Resident Inactive

↓

Resident History Retained

Residents are never deleted merely because they are no longer staying.

---

## Business Rules

- Every Resident has a unique identity.
- A Resident may exist without a Stay.
- Historical Residents are never deleted.
- Resident identity remains independent of accommodation history and commercial agreements.
- Permanent identity belongs to the Resident.
- A returning Resident always receives a new Stay; historical Stays remain immutable.

---

## Future Considerations

The architecture supports future expansion including:

- Resident Portal
- Digital KYC
- Online Profile Updates
- Multiple Contact Methods
- Family Relationships
- Resident Preferences

---

# Stay

## Purpose

A Stay represents one continuous period during which a Resident occupies accommodation.

The Stay is the central operational and financial business object within RPGMS.

Almost every business transaction relates to a Stay rather than directly to a Resident.

---

## Definition

A Stay represents the complete commercial and operational relationship between a Resident and the organisation for a single period of occupancy within a single Flat.

A Stay owns its operational and financial history, derived from approved immutable Business Events.

A Stay begins with Admission and is operationally terminated by Operational Checkout. Financial obligations arising from the Stay continue until Financial Settlement is completed.

---

## Responsibilities

A Stay owns:

- Admission
- Bed Allocation (within Flat)
- Active Commercial Agreement
- Charges
- Payments
- Unified Stay Ledger
- Settlement
- Operational Timeline
- Financial Timeline

The Stay does not own permanent identity.

---

## Relationships

Each Stay belongs to exactly one Resident.

Each Stay belongs to exactly one Flat.

Each Stay may occupy one or more Beds within that Flat simultaneously.

Each Stay has:

- One active Commercial Agreement
- Many Charges
- Many Payments
- One Unified Stay Ledger
- One Settlement
- Many Documents
- Many Business Events (Bed Allocations, Bed Releases, Accommodation Amendments, Commercial Amendments, Notice)
- Many Notifications

---

## Lifecycle

Typical lifecycle:

Reservation (Optional)

↓

Admission

↓

Active Stay (with Bed Allocations & Amendments)

↓

Optional Notice (Declared Intent)

↓

Operational Checkout

↓

Financial Settlement

↓

Stay Closed

Historical Stays remain permanently available for reporting and audit.

---

## Business Rules

- Every Stay belongs to exactly one Resident.
- A Stay belongs to exactly one Flat, but may occupy one or more Beds within that Flat.
- Operational changes (Bed Allocation (which may allocate one or more Beds), releases, transfers within flat) are recorded as Accommodation Amendments and do not terminate the Stay.
- A Stay owns its financial history and operational history.
- A Stay cannot be deleted once business activity exists.
- Operational Checkout and Financial Settlement are separate business processes.
- Current business state of a Stay is derived from approved immutable Business Events.

---

## Future Considerations

The architecture naturally supports:

- Stay Extensions
- Stay Transfers
- Property Transfers
- Temporary Vacations
- Multi-property Occupancy

without changing the underlying business model.

---

# Resident–Stay Relationship

The distinction between Resident and Stay is one of the most important architectural decisions within RPGMS.

The Resident represents the person.

The Stay represents the business relationship.

This separation allows RPGMS to preserve both permanent identity and complete occupancy history without duplication.

Examples:

A Resident may leave and return after several years.

The Resident record remains unchanged.

A new Stay is created for the new period of occupancy.

Historical Stays remain permanently attached to the Resident.

This model preserves complete business history while avoiding duplication of identity information.

---

# Architectural Summary

The Resident and the Stay together establish the foundation upon which every other business domain is built.

Subsequent business objects such as Reservations, Commercial Agreements, Charges, Payments, Documents and Audit Events relate to either the Resident, the Stay, or both.

No subsequent business object should duplicate responsibilities already owned by the Resident or the Stay.

---

# Reservation

## Purpose

Reservation exists to record the organisation's current expectation of a future Admission.

It provides a structured mechanism through which the organisation records proposed residency before any operational commitment has been made.

Reservation enables business planning while preserving the distinction between expected information and confirmed business information.

Reservation creates no Residency, no operational allocation and no financial relationship.

---

## Definition

A Reservation represents the organisation's current expectation of a future Admission.

A Reservation is neither:

- a Stay,
- an Admission,
- a contract,
- nor an accommodation allocation.

It records the organisation's present understanding of a prospective resident together with the expected commercial and operational information required to prepare for a future Admission.

A Reservation represents Expected Truth.

---

## Business Responsibility

Reservation is responsible for managing Expected Truth.

Its responsibilities include:

- recording expected resident information,
- recording expected commercial terms,
- recording expected joining information,
- recording accommodation preferences,
- supporting future Admission.

Reservation does not establish Business Truth.

---

## Business Ownership

Reservation is the sole owner of Expected Truth.

Expected Truth includes:

- expected joining date,
- expected monthly rent,
- expected security deposit,
- accommodation preferences,
- business notes,
- other provisional information relating to a future Admission.

Expected Truth remains provisional until a successful Admission Transaction establishes Business Truth.

---

## Business Relationships

Reservation supports, but does not create, Residency.

Reservation may lead to:

- Admission,
- Cancellation.

Reservation does not create:

- Resident,
- Stay,
- Accommodation Allocation,
- Financial Relationship.

These are established only through the Admission Transaction.

---

## Reservation Lifecycle

A Reservation follows one of the following constitutional states:

- Active
- Converted
- Cancelled

A Reservation remains Active until either:

- successfully converted into an Admission, or
- cancelled by the organisation.

Reservation has no Expired state.

---

## Constitutional Principles

### RES-001

Reservation shall always represent Expected Truth.

---

### RES-002

Reservation shall be the sole owner of Expected Truth.

---

### RES-003

Reservation shall create no operational Business Truth.

---

### RES-004

Reservation shall never allocate operational resources.

---

### RES-005

Reservation shall preserve Expected Truth until an authorised business transaction establishes Business Truth.

---

### RES-006

Every Reservation shall follow a defined constitutional lifecycle.

---

### RES-007

Reservation shall preserve complete business history through Business Events.


---

# Admission

## Purpose

Admission exists to establish operational business relationships through an authorised business transaction.

It represents the organisational commitment that transforms provisional business understanding into confirmed Business Truth.

Admission creates the organisational foundation upon which operational business activities are performed.

---

## Definition

Admission is a Business Transaction.

It is not a long-lived Business Object.

Its purpose is to establish Business Truth by creating the operational business relationships required for Residency.

Admission concludes immediately after its business responsibilities have been completed.

---

## Business Responsibility

Admission is responsible for establishing Business Truth.

Its responsibilities include:

- establishing Residency,
- creating operational business relationships,
- transferring Business Ownership,
- generating Business Events.

Admission creates no continuing operational responsibility.

---

## Business Ownership

Admission temporarily coordinates the transfer of Business Truth.

Upon successful completion of the transaction, Business Ownership transfers to the appropriate Business Objects.

Admission retains no permanent ownership.

---

## Business Relationships

Admission establishes operational business relationships.

These relationships include:

- Resident
- Stay
- Accommodation
- Finance

Admission coordinates their creation but does not become their long-term owner.

---

## Business Transaction

Admission is an atomic Business Transaction.

Every operational business relationship shall either:

- be established successfully,

or

- not be established at all.

Partial commitment is not a valid business state.

Admission concludes immediately after Business Truth has been established and Business Ownership has been transferred.

---

## Constitutional Principles

- Admission is a Business Transaction.
- Admission establishes Business Truth.
- Admission transfers Business Ownership.
- Admission creates operational business relationships.
- Admission executes atomically.
- Admission generates Business Events.
- Admission retains no continuing ownership.
- Admission preserves complete business history.

---

# Accommodation

## Purpose

Accommodation represents the physical assets managed by the organisation.

It defines where Residents live during a Stay.

Accommodation exists independently of Residents and Stays.

---

## Definition

Accommodation is the physical structure available for occupancy.

The architecture models accommodation hierarchically to accurately represent real-world layouts.

---

## Accommodation Hierarchy

The standard hierarchy is:

Property

↓

Building

↓

Floor

↓

Area / Flat

↓

Room (optional)

↓

Bed

The architecture allows future expansion without changing the business model.

---

## Bed

The Bed is the smallest allocatable accommodation unit.

Occupancy is always assigned to a Bed.

Beds have operational states such as:

- Vacant
- Occupied
- Reserved
- Maintenance
- Blocked

Business policies may introduce additional operational states.

---

## Responsibilities

Accommodation owns:

- Physical Locations
- Bed Inventory
- Occupancy Capacity
- Maintenance Status
- Availability

Accommodation does not own Resident identity or financial information.

---

## Relationships

Accommodation may have:

- Many Beds
- Many Stays over time
- Maintenance Records
- Inspection Records

One Stay belongs to exactly one Flat, but may occupy one or more Beds within that Flat simultaneously.

Beds may be occupied by different Residents over time, but never simultaneously.

---

## Recognized Accommodation Events

Accommodation changes during a Stay are recorded as explicit, immutable Business Events:

- **Bed Allocations**: Assigns one or more Beds within the assigned Flat to a Stay.
- **Bed Release**: Removes occupancy from one or more Beds within the Flat. Bed Release is an operational event and does not terminate the Stay.
- **Accommodation Amendment**: Records changes to bed occupancy (allocations, releases, transfers within the Flat) during an active Stay without ending the Stay.

---

## Lifecycle

Accommodation typically progresses through:

Created

↓

Available

↓

Occupied

↓

Vacated

↓

Available Again

Maintenance activities may temporarily interrupt availability.

---

## Business Rules

- A Bed may have only one active occupant at a time.
- One Stay belongs to exactly one Flat, but may occupy one or more Beds within that Flat.
- Bed Release is an operational event and does not terminate a Stay or trigger Checkout.
- Accommodation changes during an active Stay are recorded as immutable Accommodation Amendments.
- Occupancy belongs to the Stay rather than the Resident.
- Accommodation history is retained permanently.
- Beds cannot be deleted while historical occupancy exists.
- Operational status reflects physical availability.

---

## Future Considerations

The architecture supports future expansion including:

- Multiple Properties
- Multiple Buildings
- Smart Access Systems
- IoT Devices
- Occupancy Analytics
- Maintenance Scheduling
- Space Optimisation

---

# Operational Relationship

Reservation, Admission and Accommodation together define the operational lifecycle of occupancy.

Reservation expresses future intent.

Admission initiates occupancy.

Accommodation provides the physical location.

Stay records the complete operational and commercial relationship.

Together these business objects provide a complete and traceable operational model while remaining independent of financial processing.

---

# Financial Architecture

The Financial Architecture governs every commercial relationship between the organisation and a Resident during a Stay.

Unlike operational activities, financial activities create, modify or settle monetary obligations.

Every financial transaction within RPGMS belongs to a Stay and is permanently recorded as part of the financial history.

The architecture is designed around the principle that financial history is immutable, auditable and completely explainable.

---

# Commercial Agreement

## Purpose

The Commercial Agreement defines the financial contract governing a Stay.

It establishes the commercial terms agreed between the organisation and the Resident before or during Admission.

---

## Definition

A Commercial Agreement represents the financial understanding for a single Stay.

It specifies the commercial conditions under which accommodation is provided.

The agreement belongs to the Stay rather than the Resident because different Stays may have different commercial terms.

---

## Responsibilities

The Commercial Agreement owns:

- Monthly Rent
- Security Deposit
- Billing Anniversary
- Lock-in Period
- Notice Period
- Commercial Concessions
- Refund Calculations
- Special Financial Terms

It does not own Charges, Payments, or physical accommodation state.

---

## Relationships

Each Stay has one active Commercial Agreement.

Commercial Agreements may be amended during the lifetime of a Stay.

Amendments never overwrite historical agreements. Instead, RPGMS records successive agreement versions.

---

## Recognized Commercial Events

Financial term revisions during a Stay are recorded as explicit, immutable Business Events:

- **Commercial Amendment**: Commercial Amendments modify commercial terms without creating a new Stay or altering accommodation directly.
- Operational changes (such as Bed Allocations or releases) may generate commercial recommendations, but financial changes require an explicit Commercial Amendment approved by an authorized operator (BAP-001, BAP-006).

---

## Business Rules

- Every Stay must have one active Commercial Agreement.
- Lock-in Period belongs to the Commercial Agreement, not the Stay or Bed.
- Commercial terms are revised through immutable Commercial Amendments.
- Commercial Amendments modify financial obligations without altering accommodation or Stay continuity.
- Historical agreement versions are preserved permanently.
- Charges shall always be generated using the active Commercial Agreement applicable at the time of charge generation.

---

# Charges

## Purpose

Charges represent financial obligations owed by the Resident.

Charges define what the Resident is required to pay.

They do not represent money received.

---

## Typical Charge Types

Examples include:

- Rent
- Electricity
- Laundry
- Damage Recovery
- Miscellaneous Charges
- Administrative Charges

Future versions may introduce additional charge categories without altering the financial architecture.

---

## Responsibilities

Charges own:

- Charge Type
- Charge Amount
- Charge Date
- Charge Status
- Charge Source

---

## Business Rules

- Charges create obligations.
- Charges are immutable.
- Incorrect charges are corrected through adjustment entries.
- Historical charges are never overwritten.
- Charges belong to a Stay.

---

# Payments

## Purpose

Payments represent money received from the Resident.

Payments reduce financial obligations but do not themselves determine which obligations have been settled.

---

## Responsibilities

Payments own:

- Payment Amount
- Payment Date
- Payment Method
- Reference Information
- Receipt Details

---

## Business Rules

- Payments represent money received.
- Payments belong to a Stay.
- Payments are immutable.
- Payment corrections occur through reversals or adjustment events.

---

# Payment Allocation

## Purpose

Payment Allocation connects Payments to outstanding Charges.

It determines how received money satisfies financial obligations.

---

## Responsibilities

Payment Allocation records:

- Allocated Payment
- Allocated Charge
- Allocation Amount
- Allocation Date
- Allocation Method

---

## Business Behaviour

RPGMS should recommend an allocation based upon business policy.

Authorised operators may override recommendations where appropriate.

Overrides should always be audited.

---

## Business Rules

- Allocation is independent of Payment.
- One Payment may satisfy multiple Charges.
- One Charge may be settled through multiple Payments.
- Allocation history is immutable.

---

# Unified Stay Ledger

## Purpose

The Unified Stay Ledger is the authoritative financial history of a Stay.

Every financial event belonging to the Stay is recorded within a single chronological ledger.

The ledger is the primary source for financial reporting, outstanding balances and settlement calculations.

---

## Characteristics

The Unified Stay Ledger is:

- Chronological
- Immutable
- Event Driven
- Fully Auditable
- Explainable

Outstanding balances are calculated from ledger entries rather than stored independently.

---

## Typical Ledger Events

Examples include:

- Charge Created
- Payment Received
- Payment Allocation
- Charge Adjustment
- Payment Reversal
- Charge Waiver
- Deposit Received
- Deposit Adjustment
- Deposit Refund
- Settlement Completed

---

## Business Rules

- Every financial event generates a ledger entry.
- Ledger entries are never edited.
- Corrections create additional ledger events.
- The ledger represents the complete financial history of the Stay.

---

# Security Deposit

## Purpose

The Security Deposit protects the organisation against future financial obligations while remaining a liability until settlement.

---

## Deposit Lifecycle

Typical lifecycle:

Commercial Agreement

↓

Deposit Agreed

↓

Deposit Received

↓

Resident Occupancy

↓

Operational Checkout

↓

Interim Refund (Optional)

↓

Final Electricity Billing

↓

Outstanding Adjustments

↓

Final Refund

↓

Deposit Closed

---

## Business Notes

Security Deposits:

- may be refunded in multiple stages
- may be partially retained until outstanding obligations are resolved
- remain financial liabilities until fully settled
- generate ledger events throughout their lifecycle

---

# Settlement

## Purpose

Settlement represents the financial closure of a Stay.

It determines the final financial position between the Resident and the organisation.

---

## Responsibilities

Settlement includes:

- Final Charges
- Outstanding Balance Calculation
- Deposit Adjustment
- Interim Refunds
- Final Refund
- Ledger Closure

Settlement is independent of Operational Checkout.

---

## Business Rules

- Settlement completes the financial relationship.
- Settlement cannot overwrite financial history.
- Settlement generates final ledger events.
- Financial history remains permanently available after settlement.

---

# Notice

## Purpose

Notice records a Resident's declared intention to end a Stay at a future date.

It provides operational and commercial visibility into planned departures without altering active occupancy or commercial commitments.

---

## Definition

Notice is an informational Business Event communicating intent.

Notice communicates **when the Resident intends to vacate**, not **that the Resident has vacated**.

---

## Operational Reality

Notice represents intent, not execution (BCR-006).

- Submitting Notice does not terminate the Stay.
- Submitting Notice does not release accommodation or beds.
- Submitting Notice does not automatically stop billing.
- Operational and commercial activities continue normally during the notice period.
- Accommodation Amendments and Commercial Amendments may still occur during the notice period.
- Notice may be revised or withdrawn subject to organizational policy.

---

## Business Rules

- Notice is an informational Business Event.
- Notice does not release accommodation or alter bed availability.
- Notice does not stop commercial billing obligations.
- Operational Checkout remains the sole event that terminates a Stay.

---

# Operational Checkout and Financial Settlement

Operational Checkout and Financial Settlement are separate business processes.

Operational Checkout represents physical departure and operational termination of a Stay.

Financial Settlement represents commercial closure.

Operational Checkout is the sole operational Business Event that terminates a Stay (BCR-003, BCR-006).

Operational Checkout includes:

- Resident Vacates
- All Beds Released
- Access / Door ID Returned
- Stay Status marked Checked Out

Operational Checkout is distinct from:

- **Notice** (intent vs execution)
- **Bed Release** (operational bed adjustment vs Stay termination)
- **Financial Settlement** (commercial closure vs physical departure)

Financial Settlement includes:

- Final Charges
- Deposit Adjustments
- Refund Processing
- Ledger Closure

A Stay is considered fully completed only after both processes have been completed.

---

Financial Completion occurs only when:

- All Charges have been generated.
- All Payments have been recorded.
- Payment Allocations have been completed.
- Outstanding obligations have been resolved.
- Security Deposit has been fully settled.
- Unified Stay Ledger has been closed.

Only then is the financial lifecycle of the Stay complete.

---

# Financial Events

Every financial activity represents a Financial Event.

Examples include:

- Charge Created
- Payment Received
- Allocation Completed
- Commercial Amendment
- Charge Waived
- Adjustment Posted
- Deposit Refunded
- Settlement Completed

Financial Events automatically generate corresponding ledger entries and become part of the permanent financial history.

---

# Financial Architecture Summary

The Financial Architecture separates financial obligations, money received, allocation of payments and financial history into distinct business objects.

This separation provides:

- Complete auditability
- Immutable financial history
- Flexible payment allocation
- Accurate settlement
- Explainable financial decisions
- Reliable financial reporting

Every financial decision within RPGMS can therefore be traced through the Unified Stay Ledger from the creation of the Commercial Agreement until the final Settlement of the Stay.

---

# Operational Support Domains

Operational Support Domains provide specialised resident service capabilities that operate alongside the core accommodation lifecycle while maintaining independent ownership of their operational rules and service transactions.

Operational Support Domains integrate with the core model by referencing the active Stay and communicating commercial outcomes to Finance via immutable Domain Events.

---

# Laundry

## Purpose

The Laundry domain manages the complete operational lifecycle of resident laundry services within RPGMS.

It models the entire lifecycle from physical collection through pre-processing inspection, routing (in-house or external vendor), return verification, physical delivery to the resident, exception handling, resolution, and determination of chargeable services.

---

## Domain Ownership

Laundry is an **Operational Support Domain**.

The Laundry domain owns:

- Laundry Item Master
- Laundry Service Master
- Laundry Charge Master
- Laundry Transactions and Garment Lines
- Rate Snapshots captured at Collection Confirmation
- Physical Collection and photographic evidence
- Pre-processing Condition Observations
- Processing Route selection (IN_HOUSE / EXTERNAL_VENDOR) and Processing Release
- Physical Return verification and count reconciliation
- Physical Delivery and Handover Methods (DIRECT_HANDOVER, ROOM_PLACEMENT)
- Resident Verification records
- Laundry Exceptions, Investigations, and Resolutions
- Service Fulfillment tracking
- Operational chargeability determination
- Laundry-owned Business Events (including `LaundryChargeRaised`)

The Laundry domain does **not** own:

- Resident identity (owned by Resident domain)
- Stay ownership and lifecycle (owned by Stay domain)
- Physical accommodation and room/bed allocation (owned by Accommodation domain)
- Financial Charges, Invoices, and Bills (owned by Finance domain)
- Payments and Payment Allocations (owned by Finance domain)
- Financial Adjustments and Credits (owned by Finance domain)
- The resident's financial ledger or account balances (owned by Finance domain)

---

## Laundry Transaction

A Laundry Transaction represents one complete operational laundry relationship for a resident's Stay.

Every Laundry Transaction belongs to exactly one Stay. A resident may have multiple sequential or concurrent Laundry Transactions during an active Stay.

The Laundry Transaction records:

- Garment Lines: physical quantities grouped by requested services
- Physical piece counts (counted once regardless of the number of requested services)
- Applicable Rate Snapshots established at Collection Confirmation
- Operational processing route and status progression

---

## Physical Reconciliation and Invariants

The Laundry domain enforces strict physical quantity reconciliation:

$$\text{Outstanding} = \text{Collected} - \text{Delivered} - \text{Resolved}$$

A Laundry Transaction achieves physical completion only when:

$$\text{Outstanding} = 0$$

Where:

- **Collected**: The physical quantity confirmed at collection.
- **Delivered**: The physical quantity handed over to the resident or placed in their room.
- **Resolved**: The physical quantity conclusively accounted for through formal Exception Resolution where physical delivery will no longer occur (e.g. permanently lost laundry).

`Returned` represents laundry physically received back into RPGMS custody and is distinct from `Delivered`. `Returned ≠ Delivered`.

Physical completion is an operational state only and does not imply financial settlement or closure of unrelated open exceptions.

---

## Chargeability and Finance Boundary

The boundary between Laundry and Finance is governed by the following constitutional principles:

1. **Requested Service ≠ Financial Charge**: A service request does not automatically generate a financial obligation.
2. **Chargeability Rule**: A Laundry Service becomes chargeable only when:
   $$\text{Service Fulfilled} + \text{Affected Physical Quantity Delivered}$$
3. **Rate Preservation**: Charges are calculated using the Rate Snapshot established at Collection Confirmation, never by re-reading future Charge Master rates.
4. **No Double Charging**: The same physical quantity shall never be charged more than once for the same service. Corrective rework does not create duplicate resident charges.
5. **Cross-Domain Trigger**: When services become chargeable upon delivery, Laundry emits `LaundryChargeRaised`.
6. **Finance Sole Ownership of Charges**: Finance receives `LaundryChargeRaised` and creates the authoritative financial Charge within the Unified Stay Ledger. Laundry does not maintain a parallel financial ledger.
7. **Billing Engine Independence**: The Billing Engine discovers unbilled obligations but must never calculate Laundry-specific pricing or commercial rates.
8. **Advance Payments**: Payments collected prior to delivery belong to Finance as unallocated funds. Laundry does not create synthetic charges to absorb advances.

---

# Governance & Cross-Cutting Architecture

The preceding chapters described the core operational and financial business domains.

This chapter defines the architectural capabilities that apply across every business domain within RPGMS.

Unlike Residents, Stays or Charges, these capabilities do not represent individual business objects. Instead, they govern how the entire business operates.

These cross-cutting capabilities ensure that RPGMS remains secure, auditable, explainable and scalable as the organisation grows.

---

# Roles & Permissions

## Purpose

Roles and Permissions define who is authorised to perform business operations within RPGMS.

Permissions are based on business responsibilities rather than software screens.

The objective is to ensure that every operation is performed by an appropriately authorised individual while maintaining accountability.

---

## Business Roles

Version 1.0 defines the following primary business roles:

- Owner
- Manager
- Reception
- Accountant

Future versions may introduce specialised roles such as:

- Maintenance
- Compliance
- Property Manager
- Regional Manager

The architecture supports expansion without altering the permission model.

---

## Permission Model

Permissions are granted for business actions rather than user interface access.

Typical actions include:

- View
- Create
- Update
- Approve
- Configure

Deletion is intentionally minimised.

Where business corrections are required, RPGMS prefers:

- Cancel
- Reverse
- Archive
- Close

rather than permanently deleting historical information.

---

## Authority Levels

Certain business operations require additional authority because they affect financial history, compliance or business integrity.

### Level 1 – Operational

Routine day-to-day activities.

Examples:

- Admit Resident
- Allocate Bed
- Record Payment
- Generate Charges

---

### Level 2 – Controlled Operations

Business actions requiring management approval.

Examples:

- Rent Revision
- Deposit Refund
- Commercial Concession
- Agreement Amendment

---

### Level 3 – Exceptional Operations

Rare activities affecting historical business records.

Examples:

- Payment Reversal
- Historical Correction
- Ledger Adjustment
- Reopen Closed Stay

These operations require:

- Authorised User
- Business Reason
- Timestamp
- Audit Record

---

## Business Principles

- Permissions follow responsibility.
- Sensitive operations require higher authority.
- Every significant action is attributable to an authorised user.
- Business history is never deleted.

---

# Configuration

## Purpose

Configuration allows organisational policies to evolve without changing the underlying business architecture.

Business Rules remain fixed.

Business Policies remain configurable.

---

## Configuration Categories

Business Configuration includes:

- Organisation Details
- Accommodation Policies
- Reservation Policies
- Billing Policies
- Settlement Policies
- Numbering Policies
- User Policies

System Configuration includes:

- Authentication
- Email
- Theme
- Integrations
- Backup
- Time Zone

---

## Business Rules vs Business Policies

Business Rules define immutable truths.

Examples:

- A Stay belongs to one Resident.
- Historical ledger entries are immutable.

Business Policies define organisational choices.

Examples:

- Standard Rent
- Deposit Amount
- Notice Period
- Reservation Validity
- Reminder Schedule

Policies may change over time without affecting historical business records.

---

## Configuration Hierarchy

Configuration is applied using the following precedence:

```
System Defaults
        │
        ▼
Business Configuration
        │
        ▼
Commercial Agreement
        │
        ▼
Stay
```

This hierarchy ensures that organisation-wide defaults may be customised for individual commercial agreements without altering historical data.

---

# Audit & Events

## Purpose

RPGMS records both Domain Events and audit information.

Although closely related, these represent different architectural concepts.

---

## Domain Events

Domain Events describe **what happened**.

Examples include:

- Admission
- Bed Allocation (which may allocate one or more Beds)
- Bed Release
- Accommodation Amendment
- Commercial Amendment
- Notice Submission
- Charge Created
- Payment Received
- Checkout
- Settlement Completed

Domain Events form the operational and financial history of the business.

---

## Audit Records

Audit Records describe **who performed the action, when it occurred and why it happened**.

Typical audit information includes:

- User
- Timestamp
- Previous Value
- New Value
- Business Reason

Audit records support accountability rather than business history.

---

## Object Timelines

Each major business object maintains its own timeline.

Examples include:

- Resident Timeline
- Stay Timeline
- Commercial Agreement Timeline
- Payment Timeline
- Maintenance Timeline

Timelines provide a chronological view of business activity while preserving complete historical context.

---

## Audit Principles

- Historical records are immutable.
- Corrections create new events.
- Every significant operation is traceable.
- Accountability is preserved for the lifetime of the business record.

---

# Architecture Overview

The following diagram illustrates how governance capabilities support every business domain.

```text
                    ┌─────────────────────┐
                    │   Business Objects  │
                    │                     │
                    │ Resident            │
                    │ Stay                │
                    │ Reservation         │
                    │ Commercial Agreement│
                    │ Charges             │
                    │ Payments            │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
  Roles & Permissions     Configuration        Audit & Events
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                               ▼
                    Secure, Consistent,
                  Explainable Operations
```

---

# Governance Summary

Governance capabilities ensure that RPGMS remains trustworthy regardless of future growth.

They provide:

- Controlled access to business operations
- Configurable organisational policies
- Complete accountability
- Immutable business history
- Explainable business decisions

These capabilities apply uniformly across every business domain within RPGMS and form the foundation for long-term scalability.

---

# Document Management

## Purpose

Documents provide supporting evidence for business facts recorded within RPGMS.

They strengthen and validate business records but never replace them.

Business objects remain the authoritative source of information, while documents serve as supporting evidence.

---

## Definition

A Document is any electronic file that supports a business object or business process.

Examples include:

- Identity Documents
- Admission Forms
- Rental Agreements
- Payment Receipts
- Police Verification
- Maintenance Photographs

Documents are always associated with a business object.

---

## Document Ownership

Documents belong to the business object they support.

Typical ownership includes:

| Business Object | Typical Documents |
|-----------------|-------------------|
| Resident | Aadhaar, PAN, Photograph, Address Proof |
| Stay | Admission Form, Check-in Checklist |
| Commercial Agreement | Agreement, Amendments |
| Payment | Receipt, Bank Proof |
| Maintenance | Photographs, Vendor Bills |
| Compliance | Police Verification, Local Authority Records |

This ownership model prevents duplication and preserves business context.

---

## Document Metadata

Every document should maintain metadata describing:

- Document Type
- Owner
- Uploaded By
- Upload Date
- Effective Date
- Expiry Date (where applicable)
- Status
- Version
- Remarks

Metadata enables efficient search, reporting and lifecycle management.

---

## Version Management

Documents are versioned rather than replaced.

When a revised document is uploaded:

- Previous versions remain preserved.
- A new version becomes the current document.
- Historical versions remain available for audit purposes.

Business history must always remain complete.

---

## Business Rules

- Documents support business facts.
- Documents do not replace structured business data.
- Historical document versions are never deleted.
- Every document belongs to exactly one business object.

---

# Notifications

## Purpose

Notifications communicate Domain Events to appropriate recipients.

Notifications improve operational awareness but do not constitute Domain Events themselves.

---

## Definition

A Notification is a communication generated in response to a business event or business policy.

Notifications inform users without altering business data.

---

## Typical Notification Categories

Operational:

- Admission
- Bed Allocation (which may allocate one or more Beds)
- Accommodation Amendment
- Notice Submission
- Checkout

Financial:

- Commercial Amendment
- Rent Due
- Payment Received
- Outstanding Balance
- Deposit Refund

Compliance:

- Document Expiry
- Identity Verification
- Police Verification

Maintenance:

- Complaint Raised
- Complaint Resolved

Administrative:

- User Creation
- Password Reset
- Policy Changes

---

## Recipients

Notifications may be sent to:

- Residents
- Reception
- Managers
- Accountants
- Owners

Future versions may support additional recipient groups.

---

## Delivery Channels

The architecture remains independent of communication technology.

Supported channels may include:

- SMS
- Email
- WhatsApp
- Push Notifications
- In-App Notifications

New channels may be introduced without changing the notification model.

---

## Notification Principles

- Notifications are triggered by Domain Events.
- Delivery channels are independent of business logic.
- Failed delivery does not invalidate the underlying business event.
- Notification history should remain available for audit purposes.

---

# Search

## Purpose

Search enables users to efficiently locate business information across RPGMS.

The objective is to locate authoritative business objects rather than isolated pieces of text.

---

## Search Philosophy

Search should answer questions such as:

- Which Resident?
- Which Stay?
- Which Agreement?
- Which Payment?
- Which Bed?
- Which Document?

Search should always return the relevant business object as the primary result.

---

## Search Scope

Users may search for:

- Residents
- Stays
- Reservations
- Commercial Agreements
- Charges
- Payments
- Documents
- Accommodation
- Maintenance Records

Additional business objects may be introduced in future versions.

---

## Search Behaviour

Search should be:

- Fast
- Permission-aware
- Context-aware
- Incremental
- Consistent

Results should prioritise relevance while respecting user permissions.

---

## Future Enhancements

The architecture supports future capabilities including:

- Saved Searches
- Recent Searches
- OCR-based Document Search
- Voice Search
- AI-assisted Search
- Natural Language Queries

These enhancements extend the search experience without altering the underlying business model.

---

# Architecture Overview

```
                 Domain Events
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Documents      Notifications      Search
        │               │               │
        ▼               ▼               ▼
  Supporting      Communication    Information
   Evidence          Layer          Discovery
```

---

# Cross-Cutting Principles

These capabilities share common architectural principles:

- They support business operations rather than define them.
- They never replace authoritative business objects.
- They preserve historical context.
- They remain independent of implementation technology.
- They are designed for future expansion without architectural redesign.

---

# Business Numbering

## Purpose

Every significant business object within RPGMS possesses two distinct identities:

1. A technical identifier used internally by the software.
2. A business identifier used by people.

This separation ensures that technical implementation details remain independent of business operations.

---

## Technical Identifier

Every business object is assigned a unique internal identifier.

Technical identifiers:

- Are system generated.
- Never change.
- Are never visible during normal business operations.
- Are used internally for relationships and data integrity.

The format of the technical identifier is an implementation detail and is outside the scope of this document.

---

## Business Identifier

Business identifiers are human-readable reference numbers used by staff and residents.

Examples include:

| Business Object | Example |
|-----------------|---------|
| Resident | RES-000001 |
| Stay | STY-000001 |
| Reservation | RSV-000001 |
| Commercial Agreement | AGR-000001 |
| Receipt | REC-000001 |
| Settlement | SET-000001 |

Business identifiers simplify communication, reporting and record keeping.

---

## Number Series

Each business object maintains its own independent numbering sequence.

Examples:

Resident Numbers

```
RES-000001
RES-000002
RES-000003
```

Receipt Numbers

```
REC-000001
REC-000002
REC-000003
```

Settlement Numbers

```
SET-000001
SET-000002
```

Independent numbering prevents unrelated business processes from affecting one another.

---

## Numbering Principles

Business numbers should:

- Be unique.
- Be immutable.
- Never be reused.
- Never be recycled.
- Remain stable throughout the lifetime of the business object.

Business numbers are references, not business data.

---

## Numbering Configuration

The organisation may configure:

- Prefix
- Numeric Length
- Separator
- Initial Sequence

Historical business numbers must never change after assignment.

---

## Business Rules

- Every business object has one business identifier.
- Business identifiers are permanent.
- Deleted or cancelled objects do not release numbers for reuse.
- Business identifiers remain valid for audit and reporting throughout the life of the system.

---

# Business Exception Management

## Purpose

Business Exception Management provides a structured process for handling situations that fall outside normal business operations.

The objective is to protect business integrity while allowing authorised users to resolve exceptional circumstances in a controlled and auditable manner.

Business exceptions are expected in real-world operations and should be managed rather than ignored.

---

## Definition

A Business Exception occurs when a business operation:

- Violates a business rule.
- Requires a management decision.
- Falls outside normal operating policy.
- Cannot proceed without additional action.

Business Exceptions are not software errors.

They represent exceptional business situations.

---

## Exception Categories

### Validation Exceptions

Validation Exceptions occur when supplied information is incomplete or invalid.

Examples include:

- Missing Aadhaar Number
- Invalid Mobile Number
- Duplicate Resident
- Mandatory Information Missing

Resolution:

Correct the supplied information and continue the operation.

---

### Business Rule Exceptions

Business Rule Exceptions occur when an operation violates an immutable business rule.

Examples include:

- Allocating an occupied Bed
- Creating overlapping active Stays
- Deleting historical financial records
- Closing a Stay with unresolved financial obligations

These operations must be prevented.

They cannot be overridden through user permissions or configuration.

---

### Business Policy Exceptions

Business Policy Exceptions occur when an operation falls outside normal organisational policy but may still be permitted through appropriate authorisation.

Examples include:

- Reduced Security Deposit
- Rent Discount
- Extended Reservation Validity
- Admission with deferred payment
- Waiver of standard notice period

Resolution requires approval from an appropriately authorised user.

---

### Operational Exceptions

Operational Exceptions arise from unusual real-world circumstances.

Examples include:

- Lost Door ID
- Emergency Checkout
- Duplicate Payment
- Utility Failure
- Temporary System Unavailability

These situations require recording, resolution and audit rather than rejection.

---

## Exception Lifecycle

Every Business Exception follows a consistent lifecycle.

```
Detected
     │
     ▼
Classified
     │
     ▼
Assigned
     │
     ▼
Resolved
     │
     ▼
Audited
     │
     ▼
Closed
```

This lifecycle ensures that exceptional situations remain visible until fully resolved.

---

## Resolution Principles

Different categories require different responses.

| Exception Category | Typical Resolution |
|--------------------|-------------------|
| Validation | Correct Information |
| Business Rule | Reject Operation |
| Business Policy | Approval Required |
| Operational | Record and Resolve |

This distinction ensures consistent treatment across the system.

---

## Exception Register

RPGMS may maintain an Exception Register containing unresolved business exceptions.

The register serves as an operational work queue for management and provides visibility into outstanding issues requiring attention.

Typical information includes:

- Exception Type
- Severity
- Business Object
- Assigned User
- Date Reported
- Current Status
- Resolution Notes

---

## Severity Levels

Business Exceptions may be categorised by severity.

### Information

No immediate action required.

### Warning

Operation may proceed with caution.

### Action Required

Business process cannot continue until resolved.

### Critical

Immediate intervention required to protect business integrity.

Severity assists users in prioritising operational attention.

---

## Business Rules

- Every Business Exception must be classified.
- Business Rule Exceptions cannot be overridden.
- Policy Exceptions require approval.
- Operational Exceptions require documentation.
- Every resolved exception remains part of the permanent business history.

---

# Architecture Overview

```
                 Business Operation
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Validation      Business Rule   Business Policy
          │              │              │
          ▼              ▼              ▼
     Correct Data     Reject Action   Approval
                         │
                         ▼
               Operational Exception
                         │
                         ▼
               Record → Resolve → Audit
```

---

# Architectural Principles

The Numbering and Exception Management architecture is based on the following principles:

- Human-readable business identifiers improve operational efficiency.
- Technical identifiers remain implementation details.
- Business Rules protect business integrity.
- Business Policies provide controlled flexibility.
- Operational Exceptions acknowledge real-world business conditions.
- Every exceptional business decision should remain explainable and auditable.

---

# Future Vision

The business architecture of RPGMS has been intentionally designed to support long-term evolution without requiring fundamental redesign.

Version 1.0 focuses on the operational and financial management of a single paying guest accommodation business. However, the underlying business model is sufficiently flexible to support future capabilities through extension rather than modification.

Potential future enhancements include:

- Resident Portal
- Mobile Applications
- Multi-property Management
- Vendor Management
- Expense Management
- Asset Management
- Business Intelligence & Analytics
- AI-assisted Operations
- Smart Access Control
- IoT-enabled Accommodation Monitoring
- Online Reservations
- Digital Agreements
- Electronic KYC
- Automated Compliance Workflows

These capabilities are considered architectural extensions. They build upon the business objects and principles defined in this document without changing their fundamental responsibilities.

---

# Architectural Summary

RPGMS is built around a small number of well-defined business objects.

Each object has a clear purpose, defined responsibilities, and a distinct lifecycle.

Business processes operate on these objects while preserving historical integrity and maintaining complete traceability.

The architecture distinguishes between:

- People and occupancy.
- Operations and finance.
- Domain Events and audit records.
- Business rules and business policies.
- Business identifiers and technical identifiers.
- Normal operations and business exceptions.

This separation of responsibilities ensures that the business model remains understandable, maintainable and scalable.

---

# Complete Business Model

The following diagram illustrates the relationship between the major business domains.

```text
                        Resident
                            │
            ┌───────────────┴───────────────┐
            │                               │
      Reservation                      Active Stay
            │                               │
            ▼                               ▼
       Admission ───────────────► Accommodation (Flat/Beds)
                                            │
                                  ┌─────────┴─────────┐
                                  ▼                   ▼
                           Accommodation         Commercial
                             Amendments          Agreement
                                  │                   │
                                  │                   ▼
                                  │              Commercial
                                  │              Amendments
                                  │                   │
                                  │                   ▼
                                  │                Charges
                                  │                   │
                                  │                   ▼
                                  │                Payments
                                  │                   │
                                  │                   ▼
                                  │           Payment Allocation
                                  │                   │
                                  │                   ▼
                                  └─────────► Unified Stay Ledger
                                                      │
                                                      ▼
                                              Optional Notice (Intent)
                                                      │
                                                      ▼
                                             Operational Checkout
                                                      │
                                                      ▼
                                             Financial Settlement
                                                      │
                                                      ▼
                                                 Stay Closed
```

Every major business capability described within this document supports or extends this lifecycle.

---

# Cross-Cutting Capabilities

The following capabilities apply across every business domain.

```text
                     ┌───────────────────────────────┐
                     │       Business Domains        │
                     └───────────────┬───────────────┘
                                     │
      ┌──────────────┬───────────────┼───────────────┬──────────────┐
      ▼              ▼               ▼               ▼              ▼
 Roles &        Configuration     Audit &       Documents     Notifications
 Permissions                     Events
      │
      └──────────────────────────────────────────────────────────────┐
                                                                     ▼
                                                                  Search
                                                                     │
                                                                     ▼
                                                         Numbering & Exceptions
```

These capabilities ensure that business operations remain secure, consistent, explainable and auditable.

---

# Guiding Principles

Every architectural decision within RPGMS should be evaluated against the following principles.

## Business First

Software exists to support the business rather than redefine it.

---

## Single Source of Truth

Every business fact has one authoritative owner.

Information should never be duplicated unnecessarily.

---

## Immutable History

Historical business information is preserved.

Corrections create new events rather than modifying previous records.

---

## Explainability

Every significant business decision should be understandable through business rules, business policies, events, audit records and documented exceptions.

---

## Controlled Flexibility

Business rules remain protected.

Business policies may evolve through configuration and authorised approval.

---

## Simplicity

Architectural simplicity should be preferred wherever it does not compromise business correctness or future scalability.

---

## Future Compatibility

The architecture should accommodate future business growth through extension rather than redesign.

---

# Glossary

| Term | Definition |
|------|------------|
| Resident | The permanent identity of a person who interacts with the organisation. |
| Stay | One continuous period of occupancy by a Resident within a single Flat. |
| Reservation | An intention to occupy accommodation at a future date. |
| Admission | The business process that creates an active Stay. |
| Accommodation | The physical assets available for occupancy. |
| Bed Allocations | The operational event assigning one or more Beds within a Flat to a Stay. |
| Bed Release | The operational event removing occupancy from one or more Beds without ending the Stay. |
| Accommodation Amendment | An immutable business event recording changes to bed occupancy within a Flat during a Stay. |
| Commercial Agreement | The financial contract governing a Stay. |
| Commercial Amendment | An immutable business event modifying financial terms during a Stay without ending the Stay. |
| Lock-in Period | The minimum financial commitment defined by the Commercial Agreement. |
| Notice | A declaration of the Resident's intention to end a Stay at a future date (intent, not execution). |
| Operational Checkout | The operational business event that formally terminates a Stay and releases accommodation. |
| Charge | A financial obligation owed by the Resident. |
| Payment | Money received from the Resident. |
| Payment Allocation | The process of applying Payments against Charges. |
| Unified Stay Ledger | The complete financial history of a Stay. |
| Settlement | The financial closure of a Stay. |
| Business Event | A significant occurrence in the lifecycle of a business object. |
| Audit Record | Information describing who performed an operation, when it occurred and why. |
| Business Rule | An immutable truth that cannot be overridden. |
| Business Policy | A configurable organisational decision. |
| Business Exception | An exceptional business situation requiring structured handling. |
| Business Identifier | A human-readable reference number assigned to a business object. |
| Technical Identifier | A system-generated internal identifier used for data integrity. |

---

# Conclusion

The Business Constitution defines the business architecture of RPGMS independently of any specific technology or implementation.

It provides a stable foundation for software architecture, database design, user interface development, testing, documentation and AI-assisted engineering.

Future enhancements should extend this architecture while preserving its fundamental principles.

Whenever uncertainty arises during implementation, the business intent described in this document should guide the decision.

This document is therefore the authoritative reference for understanding how RPGMS operates as a business system.

---

