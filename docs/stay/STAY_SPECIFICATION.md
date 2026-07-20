# 1. Purpose

## Purpose

This document defines the business specification for the **Stay** domain within RPGMS.

A Stay represents the complete business relationship between a Resident and the organization for a specific period of accommodation.

It is the central operational entity that connects a Resident to a Bed while governing occupancy, accommodation, financial, and compliance activities throughout the Resident's stay.

This specification establishes:

- The business definition of a Stay.
- The lifecycle of a Stay.
- The ownership and responsibilities of the Stay domain.
- The business rules governing occupancy.
- The relationship between Stay and other business domains.
- The validation principles required to maintain operational integrity.

---

## Objectives

The objectives of this specification are to:

- Define what constitutes a Stay within RPGMS.
- Establish a consistent occupancy lifecycle.
- Ensure clear ownership of operational activities.
- Prevent duplication of responsibilities across business domains.
- Support accurate financial and compliance processes.
- Provide a stable foundation for future business enhancements.

---

## Business Definition

Within RPGMS, a **Stay** represents the contractual occupancy of a Bed by a Resident for a defined period.

A Stay begins when a Resident is formally admitted into accommodation and ends when the Resident completes the checkout process.

Throughout its lifecycle, the Stay records the operational events associated with occupancy while maintaining references to the Resident and the allocated Bed.

The Stay itself does not own Resident information or Accommodation information.

Instead, it creates the business relationship between them.

---

## Scope of the Stay Domain

The Stay domain is responsible for managing the operational lifecycle of accommodation occupancy.

This includes:

- Reservation
- Check-in
- Bed Allocation
- Bed Transfers
- Notice Period
- Checkout
- Stay Status
- Stay History

The Stay domain coordinates these activities while maintaining clear separation from Resident, Accommodation, Finance, and Compliance.

---

## Architectural Role

Within RPGMS, the Stay domain serves as the central operational hub.

It connects:

- Residents
- Accommodation
- Finance
- Compliance

without assuming ownership of those business domains.

Every operational activity associated with occupancy shall originate from or reference a valid Stay.

---

## Business Principles

This specification is guided by the following principles:

- A Stay represents an occupancy relationship, not a person or a place.
- Every Stay belongs to one Resident.
- Every Stay occupies one Bed at any point in time.
- A Resident may have multiple historical Stays.
- A Resident may have only one Active Stay at a time (MVP).
- Operational events belong to the Stay throughout its lifecycle.

These principles form the foundation upon which the remainder of this specification is built.

# 2. Scope

## Purpose

This section defines the responsibilities and boundaries of the Stay domain.

Clearly defining the scope of Stay ensures that operational responsibilities remain within the correct business domain and prevents duplication of information across RPGMS.

---

## What the Stay Domain Owns

The Stay domain owns the complete operational lifecycle of accommodation occupancy.

Its responsibilities include:

- Reservation
- Check-in
- Bed Allocation
- Bed Transfers
- Notice Period
- Checkout
- Stay Status
- Stay Timeline
- Stay History

The Stay domain records **when**, **where**, and **under what status** a Resident occupies accommodation.

---

## What the Stay Domain Does Not Own

The Stay domain intentionally does not own information belonging to other business domains.

### Resident

Resident owns:

- Personal Information
- Contact Information
- Government Identification
- Medical Information
- Documents

Stay references a Resident but does not duplicate Resident information.

---

### Accommodation

Accommodation owns:

- Property
- Flat
- Area
- Bed
- Bed Status
- Physical Capacity

Stay references the allocated Bed but does not own the physical accommodation.

---

### Finance

Finance owns:

- Rent
- Billing
- Charges
- Payments
- Deposits
- Refunds
- Ledger
- Outstanding Dues

Stay determines when financial activities begin and end but does not own financial records.

---

### Compliance

Compliance owns:

- Police Intimation
- Government Reporting
- Verification Status
- Statutory Documentation

Stay provides the operational context required for compliance but does not own compliance records.

---

## Primary Responsibilities

The Stay domain is responsible for answering operational questions such as:

- Who is occupying this Bed?
- Which Bed is allocated to this Resident?
- When did the Resident check in?
- When did the Resident give notice?
- Has the Resident checked out?
- What is the current Stay Status?
- What is the occupancy history of this Resident?

These questions define the operational responsibilities of Stay.

---

## Operational Events Managed by Stay

During its lifecycle, a Stay records important occupancy events.

Examples include:

- Reservation Created
- Reservation Cancelled
- Check-in Completed
- Bed Allocated
- Bed Changed
- Notice Submitted
- Checkout Completed
- Stay Closed

These events describe the operational history of the Stay.

---

## Relationships

The Stay domain connects the primary business entities within RPGMS.

```
Resident
    │
    ▼
   Stay
  ├───────┐
  ▼       ▼
Bed    Finance
  │
  ▼
Compliance
```

The Stay acts as the operational bridge between these business domains while maintaining clear ownership boundaries.

---

## Business Principles

The Stay domain follows these principles:

- A Stay represents occupancy, not identity.
- A Stay represents occupancy, not physical accommodation.
- Every operational event belongs to a Stay.
- Every Stay has a beginning.
- Every Stay has an end.
- Every Stay maintains a complete operational history.
- Historical Stays are never reused or modified to represent new occupancy.

---

## Business Notes

The Stay domain exists to manage the **operational relationship** between a Resident and Accommodation over time.

It is the business process that transforms a physical Bed into an occupied accommodation and coordinates the activities that occur throughout that occupancy.

All operational workflows within RPGMS should originate from or reference a valid Stay.

# 3. Guiding Principles

## Purpose

The Stay domain governs the operational lifecycle of accommodation occupancy.

The following principles establish the business philosophy that shall guide every implementation, enhancement, and future extension of the Stay domain.

These principles are independent of technology and define the business rules upon which RPGMS is built.

---

## Stay Represents an Occupancy Relationship

A Stay represents the operational relationship between a Resident and a Bed for a defined period.

A Stay is neither:

- the Resident, nor
- the Accommodation.

Instead, it represents the business agreement under which a Resident occupies accommodation.

---

## Operational Ownership

The Stay domain owns all occupancy-related operations.

Examples include:

- Reservation
- Check-in
- Bed Allocation
- Bed Transfer
- Notice
- Checkout

Other business domains may reference these operations but shall not own them.

---

## One Active Stay per Resident

For the MVP, a Resident may have only one Active Stay at any point in time.

This rule prevents conflicting occupancy records and simplifies:

- Bed Allocation
- Billing
- Compliance
- Reporting

Future versions of RPGMS may relax this rule if business requirements evolve.

---

## One Occupant per Bed

At any point in time, a Bed may be associated with only one Active Stay.

This principle ensures that physical occupancy always remains unambiguous.

Historical occupancy is preserved through completed Stays rather than by sharing Beds.

---

## Stay is Time-Bound

Every Stay has:

- a beginning, and
- an end.

The beginning is established through Check-in.

The end is established through Checkout.

Between these events, the Stay records the complete operational history of occupancy.

---

## Historical Integrity

A completed Stay represents historical business information.

Historical Stays shall never be reused, reassigned, or overwritten.

If a Resident returns in the future, a completely new Stay shall be created.

This principle preserves an accurate occupancy history.

---

## Separation of Concerns

The Stay domain owns only occupancy operations.

It does not own:

- Resident identity
- Accommodation structure
- Financial transactions
- Compliance records

Each business domain remains responsible for its own information.

---

## Business Before Technology

The business lifecycle of a Stay shall determine system behavior.

Database design, APIs, user interfaces, and workflows must support these business rules rather than define them.

---

## Single Source of Operational Truth

The Stay domain is the authoritative source for occupancy.

Questions such as:

- Who occupies this Bed?
- Which Bed is allocated to this Resident?
- When did occupancy begin?
- Has notice been given?
- Has checkout occurred?

shall always be answered from the Stay domain.

No other business domain should maintain duplicate occupancy information.

---

## Extensible by Design

The Stay model has been intentionally designed to accommodate future enhancements without changing its fundamental principles.

Examples include:

- Online Reservations
- Waitlists
- Temporary Vacations
- Multiple Concurrent Properties
- Corporate Bookings
- Group Reservations
- Room Upgrades

Future enhancements should extend the Stay model while preserving its core business philosophy.

---

## Business Notes

The Stay domain is the operational heart of RPGMS.

While Resident represents **who** and Accommodation represents **where**, the Stay domain defines **how**, **when**, and **for how long** accommodation is occupied.

Every operational workflow within RPGMS should align with these guiding principles to ensure consistency, maintainability, and long-term architectural stability.

# 4. Stay Philosophy

## Purpose

The Stay domain represents the operational agreement under which a Resident occupies accommodation.

It is the central business transaction within RPGMS, connecting a Resident to a Bed for a defined period while coordinating the operational activities associated with that occupancy.

The philosophy of the Stay domain is built upon the principle that **occupancy is a business relationship**, not merely an assignment of a Bed.

---

## Occupancy is a Business Relationship

A Stay represents the formal relationship between:

- the Resident, and
- the organization,

for the purpose of providing accommodation.

While a Bed is allocated as part of the Stay, the Stay itself represents the entire occupancy journey rather than the physical allocation alone.

---

## Stay Connects Business Domains

The Stay domain serves as the operational bridge between the primary business domains within RPGMS.

```
Resident
    │
    ▼
   Stay
 ┌──┼─────────────┐
 ▼  ▼             ▼
Bed Finance   Compliance
```

Each business domain retains ownership of its own information.

The Stay coordinates these domains without duplicating their responsibilities.

---

## A Stay is a Complete Journey

A Stay begins before occupancy and continues until the Resident has completely vacated the accommodation.

Typical lifecycle:

```
Reservation
      ↓
Check-in
      ↓
Bed Allocation
      ↓
Active Stay
      ↓
Notice Period
      ↓
Checkout
      ↓
Closed
```

Every operational event occurring during this journey belongs to the Stay.

---

## A Stay is Independent of the Resident

Residents may stay multiple times over several years.

Each occupancy period represents a new business relationship.

Example:

```
Resident
    │
    ├── Stay 001 (Completed)
    │
    ├── Stay 002 (Completed)
    │
    └── Stay 003 (Active)
```

The Resident remains the same person.

Each Stay represents a separate period of occupancy with its own operational history.

---

## A Stay is Independent of the Bed

During a Stay, operational requirements may require the Resident to move between Beds.

Examples include:

- Maintenance
- Room Upgrade
- Resident Request
- Operational Balancing

Although the allocated Bed may change, the Stay continues uninterrupted.

The Stay owns the occupancy relationship.

Bed allocation is simply one aspect of that relationship.

---

## A Stay Creates Operational Context

Many business activities become possible only after a Stay exists.

Examples include:

- Bed Allocation
- Billing
- Rent Calculation
- Security Deposit
- Police Intimation
- Resident Notices
- Checkout Processing
- Refund Processing

Without a valid Stay, these activities have no operational context.

---

## Every Stay Tells a Complete Story

A Stay should provide a complete operational record of a Resident's occupancy.

Questions such as:

- When did the Resident arrive?
- Which Beds were occupied?
- When was notice submitted?
- When did the Resident leave?
- Why did the Stay end?

should be answerable by reviewing the Stay.

---

## Historical Permanence

Once completed, a Stay becomes part of the permanent operational history of RPGMS.

Completed Stays should remain unchanged except for authorized administrative corrections.

Historical records support:

- Reporting
- Auditing
- Compliance
- Business Analysis
- Resident History

---

## Business Notes

The Stay domain is the operational heart of RPGMS.

Resident defines **who**.

Accommodation defines **where**.

Finance defines **what was charged**.

Compliance defines **what legal obligations were fulfilled**.

The Stay defines **the complete business journey that connects them all**.

Every operational workflow within RPGMS should begin with, or reference, a valid Stay.

# 5. Business Definition of a Stay

## Purpose

A clear business definition of a Stay establishes the foundation for every operational process within RPGMS.

Rather than viewing a Stay as simply a Resident occupying a Bed, RPGMS defines a Stay as the complete business relationship governing accommodation for a specific period.

This definition serves as the authoritative interpretation of a Stay throughout the system.

---

## Definition

A **Stay** is the contractual occupancy of accommodation by a Resident for a defined period.

It records the operational relationship between the Resident and the organization from the moment accommodation is reserved or occupied until the Stay is formally closed.

A Stay is the business entity through which occupancy is managed.

---

## A Stay is NOT

A Stay is **not**:

- a Resident
- a Bed
- a Flat
- a Financial Account
- a Compliance Record
- a Payment
- a Reservation only

Instead, it is the operational agreement that connects these business domains during a period of occupancy.

---

## A Stay Represents

A Stay represents:

- one Resident
- occupying accommodation
- for a defined period
- under defined business rules
- with a complete operational history

It is the central record that governs occupancy throughout its lifecycle.

---

## Core Characteristics

Every Stay possesses the following characteristics.

### One Resident

Every Stay belongs to exactly one Resident.

A Stay cannot exist without an associated Resident.

---

### One Occupancy Lifecycle

Every Stay progresses through a defined operational lifecycle.

Typical stages include:

- Reservation
- Check-in
- Active Occupancy
- Notice
- Checkout
- Closed

The lifecycle records the operational journey of the Stay.

---

### One Current Bed

At any point in time, a Stay is associated with one current Bed.

During the Stay, the allocated Bed may change due to operational requirements.

Historical Bed allocations remain part of the Stay's operational history.

---

### Time-Bound

Every Stay has:

- a start,
- an operational duration,
- and an end.

A Stay cannot exist indefinitely without a business status describing its current state.

---

### Operational History

A Stay maintains the history of significant occupancy events.

Examples include:

- Reservation Created
- Check-in Completed
- Bed Allocated
- Bed Transferred
- Notice Submitted
- Checkout Completed
- Stay Closed

These events collectively describe the Resident's accommodation journey.

---

## Business Relationships

A Stay connects the primary business domains within RPGMS.

```
Resident
    │
    ▼
   Stay
 ┌──┼─────────────┐
 ▼  ▼             ▼
Bed Finance   Compliance
```

Each domain retains ownership of its own information.

The Stay provides the operational context that links them together.

---

## Business Ownership

The Stay domain owns:

- Occupancy
- Operational Status
- Bed Allocation History
- Check-in
- Checkout
- Notice
- Stay Timeline

The Stay domain does **not** own:

- Resident Profile
- Accommodation Structure
- Financial Records
- Compliance Records

These remain the responsibility of their respective business domains.

---

## Historical Identity

Each Stay represents a unique period of occupancy.

Even if the same Resident returns multiple times, each occupancy shall create a new Stay.

Example:

```
Resident

    │

    ├── Stay 001
    │      Completed

    ├── Stay 002
    │      Completed

    └── Stay 003
           Active
```

Historical Stays shall never be reused or merged.

Each Stay preserves its own operational identity.

---

## Business Principles

The business definition of a Stay is governed by the following principles:

- Every Stay represents one occupancy relationship.
- Every Stay belongs to one Resident.
- Every Stay has one current Bed.
- Every Stay has one operational lifecycle.
- Every Stay has a beginning.
- Every Stay has an end.
- Every Stay becomes part of the permanent business history.

---

## Business Notes

Within RPGMS, the Stay is the **central business transaction**.

It is the operational agreement through which accommodation is provided, occupancy is managed, financial activities are initiated, and statutory obligations are fulfilled.

Every operational process related to accommodation should originate from or reference a valid Stay.

For this reason, the Stay serves as the primary operational entity of RPGMS.

# 6. Stay Lifecycle

## Purpose

Every Stay progresses through a well-defined business lifecycle.

The lifecycle describes the operational stages through which a Resident moves from initial reservation to the completion of occupancy.

A standardized lifecycle ensures consistency across accommodation, finance, compliance, reporting, and operational workflows.

---

## Stay Lifecycle

A Stay progresses through the following business stages.

```
Reservation
      │
      ▼
Check-in
      │
      ▼
Active Stay
      │
      ▼
On Notice
      │
      ▼
Checkout
      │
      ▼
Closed
```

Each stage represents a distinct operational state with defined business responsibilities.

---

## Reservation

Reservation represents the intention to occupy accommodation in the future.

Characteristics:

- Resident has not yet checked in.
- Bed may be reserved.
- Billing has not commenced.
- Occupancy has not begun.
- Compliance activities have not started.

A Reservation may later become:

- Check-in
- Cancelled
- Expired

---

## Check-in

Check-in marks the official beginning of occupancy.

During Check-in:

- Resident is admitted.
- Bed allocation becomes effective.
- Stay officially begins.
- Billing becomes eligible to commence.
- Compliance activities may begin.

The Stay now transitions to **Active Stay**.

---

## Active Stay

Active Stay represents the normal operational period of accommodation.

During this stage:

- Resident occupies a Bed.
- Bed transfers may occur.
- Billing is active.
- Charges may be applied.
- Payments may be received.
- Compliance activities remain active.

Most day-to-day hostel operations occur during this stage.

---

## On Notice

On Notice indicates that the Resident has formally informed the organization of the intention to vacate accommodation.

Characteristics:

- Stay remains Active.
- Resident continues occupying the Bed.
- Billing continues according to business policy.
- Checkout date becomes known or expected.
- Operational planning for vacancy may begin.

A Stay may remain On Notice until Checkout is completed.

---

## Checkout

Checkout represents the operational process of ending occupancy.

Typical activities include:

- Resident vacates accommodation.
- Bed becomes available.
- Final inspections are completed.
- Outstanding obligations are reviewed.
- Financial settlement may be finalized.
- Compliance activities conclude.

Checkout marks the end of physical occupancy.

---

## Closed

Closed represents the completed state of a Stay.

Characteristics:

- Occupancy has ended.
- Operational activities are complete.
- Stay becomes historical.
- No further operational changes are expected.

A Closed Stay becomes part of the permanent business history of RPGMS.

---

## Lifecycle Principles

The Stay Lifecycle follows these principles:

- Every Stay begins with Check-in.
- Every Active Stay eventually reaches Checkout.
- Every completed Stay becomes Closed.
- Historical Stays are never reopened for normal operations.
- Operational events occur only within the lifecycle of a valid Stay.

---

## Exceptional Outcomes

Not every Stay follows the standard path.

Examples include:

### Reservation Cancelled

```
Reservation
      │
      ▼
Cancelled
```

No occupancy occurs.

---

### Reservation Expired

```
Reservation
      │
      ▼
Expired
```

The Resident does not check in within the permitted period.

---

### Early Checkout

```
Reservation
      │
      ▼
Check-in
      │
      ▼
Active Stay
      │
      ▼
Checkout
      │
      ▼
Closed
```

Notice may not be given before Checkout.

---

## Business Notes

The Stay Lifecycle represents the **operational progression of occupancy**, not the financial or legal progression of a Resident.

Finance, Compliance, and Reporting consume the lifecycle but do not define it.

By maintaining a single standardized lifecycle, RPGMS ensures that every operational activity occurs within a predictable and auditable business framework.

# 7. Stay Information

## Purpose

The Stay domain maintains the operational information required to manage the occupancy lifecycle of a Resident.

This information identifies the Stay, tracks its operational status, and records the key business attributes necessary to support accommodation, finance, compliance, and reporting.

The Stay stores only information that it owns as part of the occupancy lifecycle.

---

## Stay Information Categories

Stay information is organized into the following categories:

- Stay Identification
- Resident Reference
- Accommodation Reference
- Important Dates
- Operational Status
- Operational Notes

---

# Stay Identification

Every Stay shall have a unique business identity.

## Fields

| Field | Description |
|--------|-------------|
| Stay Number | Unique identifier for the Stay |
| Stay Status | Current operational status |
| Created On | Date the Stay was created |
| Created By | User who created the Stay |

---

## Stay Number

The Stay Number uniquely identifies a Stay throughout RPGMS.

Business Rules:

- Generated by the system.
- Never reused.
- Never modified after creation.
- Used throughout operational workflows.

Example:

```
ST-000001
ST-000002
ST-000003
```

The numbering format is an implementation decision and may evolve without changing the business identity of the Stay.

---

# Resident Reference

A Stay references the Resident occupying accommodation.

The Stay stores only the reference required to establish this relationship.

## Fields

| Field | Description |
|--------|-------------|
| Resident | Resident associated with the Stay |

Business Rules:

- Every Stay belongs to exactly one Resident.
- A Resident may have multiple historical Stays.
- A Resident may have only one Active Stay at a time (MVP).

Resident information remains the responsibility of the Resident domain.

---

# Accommodation Reference

A Stay records the accommodation currently allocated to the Resident.

## Fields

| Field | Description |
|--------|-------------|
| Property | Property occupied (future) |
| Flat | Current Flat |
| Area | Current Area |
| Bed | Current Bed |

Business Rules:

- A Stay references one current Bed.
- Bed allocation may change during the Stay.
- Historical Bed changes form part of the Stay timeline.

The physical accommodation remains owned by the Accommodation domain.

---

# Important Dates

A Stay records the key dates associated with the occupancy lifecycle.

## Fields

| Field | Description |
|--------|-------------|
| Reservation Date | Date reservation was created (optional) |
| Expected Check-in | Planned arrival date |
| Check-in Date | Actual check-in date |
| Notice Date | Date notice was submitted |
| Expected Checkout | Planned departure date |
| Checkout Date | Actual checkout date |
| Closed Date | Date the Stay was formally closed |

Not every Stay will contain every date.

Dates become available as the Stay progresses through its lifecycle.

---

# Operational Status

Every Stay maintains one current operational status.

Typical values include:

- Reserved
- Checked In
- Active
- On Notice
- Checked Out
- Closed
- Cancelled
- Expired

Only one operational status may exist at any point in time.

---

# Operational Notes

The Stay may contain operational notes relevant to occupancy.

Examples include:

- Late Arrival
- Temporary Relocation
- Special Instructions
- Administrative Remarks

Operational Notes should describe occupancy-related information only.

Resident Profile information shall not be duplicated here.

---

## Derived Information

The Stay may expose derived operational information.

Examples include:

- Length of Stay
- Days Since Check-in
- Days Until Checkout
- Notice Period Remaining
- Current Occupancy Duration

These values are calculated dynamically and should not be permanently stored.

---

## Information Ownership

| Information | Owned By |
|-------------|----------|
| Stay Number | Stay |
| Stay Status | Stay |
| Resident | Resident |
| Bed | Accommodation |
| Financial Balance | Finance |
| Police Status | Compliance |

This ownership model prevents duplication of business information.

---

## Business Notes

The Stay contains only the information required to manage the operational lifecycle of occupancy.

It references Resident and Accommodation while allowing Finance and Compliance to perform their respective responsibilities.

By limiting the information owned by the Stay domain, RPGMS maintains clear separation of concerns and preserves a single source of truth for every business entity.

# 8. Reservation

## Purpose

A Reservation represents the intention of a Resident to occupy accommodation at a future date.

It allows the organization to plan occupancy before the Resident physically arrives.

A Reservation does **not** constitute occupancy.

Occupancy begins only after a successful Check-in.

---

## Business Definition

A Reservation is a pre-occupancy stage of a Stay.

It records the organization's commitment to provide accommodation and the Resident's intention to occupy that accommodation in the future.

A Reservation may result in:

- Check-in
- Cancellation
- Expiry

---

## Reservation Lifecycle

```
Reservation
      │
      ├─────────────► Cancelled
      │
      ├─────────────► Expired
      │
      ▼
Check-in
```

Only a Reservation that successfully progresses to Check-in becomes an occupied Stay.

---

## Reservation Information

Typical Reservation information includes:

| Field | Description |
|--------|-------------|
| Reservation Date | Date reservation was created |
| Expected Check-in | Planned arrival date |
| Reserved Bed | Bed reserved for the Resident (optional) |
| Reservation Status | Current reservation status |
| Reservation Notes | Operational remarks |

These fields support occupancy planning prior to arrival.

---

## Reservation Status

A Reservation may have one of the following statuses.

| Status | Description |
|----------|-------------|
| Reserved | Reservation is active |
| Confirmed | Reservation has been confirmed |
| Cancelled | Reservation withdrawn before occupancy |
| Expired | Resident did not arrive within the permitted period |
| Converted | Reservation successfully became a Check-in |

Only one Reservation Status may exist at any point in time.

---

## Bed Reservation

Depending on business policy, a Reservation may:

- reserve a specific Bed,
- reserve accommodation without assigning a Bed,
- reserve only a room category (future enhancement).

For the MVP, RPGMS supports reservation of a specific Bed.

The reserved Bed remains unavailable for normal allocation while the Reservation remains active.

---

## Conversion to Stay

A Reservation becomes an occupied Stay only after Check-in.

During conversion:

- Resident arrives.
- Identity verification is completed.
- Bed allocation becomes effective.
- Occupancy officially begins.
- Stay transitions to Active.

The Reservation itself does not represent occupancy.

---

## Reservation Cancellation

A Reservation may be cancelled before Check-in.

Examples include:

- Resident withdraws.
- Organization declines admission.
- Duplicate Reservation.
- Administrative cancellation.

After cancellation:

- Reserved Bed becomes available.
- No occupancy occurs.
- No Active Stay is created.

Historical Reservation information should remain available for reporting and auditing.

---

## Reservation Expiry

A Reservation may expire if the Resident does not arrive within the organization's permitted period.

Examples include:

- No arrival on the expected date.
- No communication from the Resident.
- Reservation hold period exceeded.

After expiry:

- Reserved Bed becomes available.
- Reservation is closed.
- No occupancy occurs.

---

## Business Rules

The Reservation process follows these principles:

- A Reservation does not create occupancy.
- A Reservation does not start billing.
- A Reservation does not satisfy compliance requirements.
- A Reservation may reserve accommodation.
- A Reservation may be cancelled.
- A Reservation may expire.
- A Reservation may be converted into an occupied Stay.

---

## Relationship with Other Domains

| Business Domain | Relationship During Reservation |
|-----------------|---------------------------------|
| Resident | Resident exists |
| Accommodation | Bed may be reserved |
| Finance | Billing has not commenced |
| Compliance | Compliance activities have not commenced |

Reservation prepares the operational context for future occupancy without initiating downstream business processes.

---

## Business Notes

Reservations improve occupancy planning and operational efficiency.

They allow accommodation to be held for future Residents while ensuring that occupancy, billing, and compliance begin only after physical Check-in.

This distinction maintains a clear separation between **planned occupancy** and **actual occupancy**, ensuring that all operational activities within RPGMS are based on the Resident's confirmed arrival.

# 9. Check-in

## Purpose

Check-in is the business process through which a Reservation (if any) becomes an occupied Stay.

It marks the official commencement of accommodation occupancy and establishes the operational relationship between the Resident and the organization.

From this point onward, the Resident is considered an active occupant.

---

## Business Definition

Check-in represents the formal admission of a Resident into accommodation.

During Check-in:

- Occupancy begins.
- Bed allocation becomes effective.
- The Stay officially starts.
- Operational responsibilities commence.
- Downstream business processes become eligible to begin.

Check-in is the first operational event of an occupied Stay.

---

## Preconditions

Before a Resident can Check-in, the following conditions should normally be satisfied.

- Resident Profile exists.
- Accommodation is available.
- A valid Bed can be allocated.
- Required documentation has been collected according to organizational policy.
- The Resident is eligible for admission.

Organizations may enforce additional admission policies.

---

## Check-in Process

A typical Check-in consists of the following activities.

```
Resident Arrives
        │
        ▼
Identity Verification
        │
        ▼
Bed Allocation
        │
        ▼
Stay Created / Activated
        │
        ▼
Resident Occupies Bed
```

The exact operational workflow may vary according to organizational requirements.

---

## Information Recorded

Typical Check-in information includes:

| Field | Description |
|--------|-------------|
| Check-in Date | Actual date of arrival |
| Check-in Time | Actual time of arrival |
| Allocated Bed | Bed occupied by the Resident |
| Admitted By | User completing the Check-in |
| Remarks | Operational observations |

These details establish the official beginning of the Stay.

---

## Bed Allocation

During Check-in, the Resident is allocated a Bed.

Business Rules:

- The Bed must be available.
- The Bed becomes Occupied upon successful Check-in.
- Only one Active Stay may occupy a Bed.
- The allocation becomes part of the Stay history.

Bed ownership remains within the Accommodation domain.

---

## Stay Activation

Successful Check-in activates the Stay.

The Stay now becomes the operational reference for:

- Occupancy
- Bed Transfers
- Notice
- Checkout
- Reporting

The Stay remains Active until Checkout is completed.

---

## Downstream Business Activities

A successful Check-in enables downstream business domains.

Examples include:

### Finance

Finance may now:

- Start Billing
- Apply Recurring Charges
- Record Security Deposit
- Generate Ledger Entries

---

### Compliance

Compliance may now:

- Initiate Police Intimation
- Verify Documents
- Track Statutory Deadlines

---

### Reporting

Operational reports may now include:

- Current Occupancy
- Bed Utilization
- Resident Count
- Flat Occupancy

---

## Failed Check-in

A planned Check-in may fail or be abandoned.

Examples include:

- Resident does not arrive.
- Documentation is incomplete.
- Admission is declined.
- Bed becomes unavailable.
- Reservation is cancelled.

In such cases:

- Occupancy does not begin.
- No Active Stay exists.
- Billing does not commence.
- Compliance activities do not begin.

---

## Business Rules

The Check-in process follows these principles:

- Check-in marks the official beginning of occupancy.
- Occupancy begins only after successful Check-in.
- Every Check-in creates or activates exactly one Stay.
- Every successful Check-in allocates one Bed.
- Billing becomes eligible only after Check-in.
- Compliance activities begin only after Check-in.

---

## Relationship with Other Domains

| Business Domain | Relationship During Check-in |
|-----------------|------------------------------|
| Resident | Resident is admitted |
| Accommodation | Bed becomes occupied |
| Finance | Billing becomes eligible |
| Compliance | Compliance process may begin |

The Check-in process creates the operational context required by all downstream business domains.

---

## Business Notes

Check-in is one of the most significant operational events within RPGMS.

It transforms a planned accommodation into an actual occupancy and establishes the Stay that governs every subsequent operational activity.

From the moment Check-in is completed until Checkout, the Stay becomes the authoritative operational record for the Resident's accommodation journey.

# 10. Bed Allocation

## Purpose

Bed Allocation is the operational process through which a Bed is assigned to a Stay.

It establishes the physical accommodation occupied by the Resident during the Stay while preserving the independence of both the Stay and Accommodation domains.

Bed Allocation answers one fundamental operational question:

> **Which Bed is currently occupied by this Stay?**

---

## Business Definition

Bed Allocation is the assignment of a specific Bed to an Active Stay.

The allocation becomes effective only after successful Check-in.

A Bed Allocation remains valid until:

- the Resident transfers to another Bed,
- the Resident checks out, or
- the Stay is otherwise concluded.

The allocation forms part of the permanent operational history of the Stay.

---

## Ownership

Bed Allocation is owned by the Stay domain.

Accommodation owns:

- Property
- Flat
- Area
- Bed
- Bed Status

Stay owns:

- Which Bed is allocated
- When allocation began
- When allocation ended
- Allocation history

This separation preserves clear ownership between physical inventory and occupancy.

---

## Allocation Rules

Every Bed Allocation shall follow these business rules.

### One Active Bed

A Stay may have only one current Bed at any point in time.

---

### One Active Occupant

A Bed may belong to only one Active Stay at any point in time.

---

### Available Bed

Only an available Bed may be allocated.

Beds marked as:

- Occupied
- Reserved
- Blocked
- Maintenance

shall not be allocated unless organizational policy explicitly permits.

---

### Allocation Begins with Check-in

The initial Bed Allocation becomes effective during Check-in.

No Active Stay may exist without an allocated Bed.

---

## Allocation Information

Typical Bed Allocation information includes:

| Field | Description |
|--------|-------------|
| Allocated Bed | Current Bed |
| Allocation Date | Date allocation became effective |
| Allocation Time | Time allocation became effective |
| Allocation Reason | Initial Allocation or Transfer |
| Allocated By | User performing the allocation |

These details support operational history and auditing.

---

## Bed Status Changes

Successful Bed Allocation affects both the Stay and Accommodation domains.

### Stay

The Stay now references the allocated Bed.

---

### Accommodation

The Bed Status changes from:

```
Vacant
    │
    ▼
Occupied
```

The Accommodation domain continues to own the Bed and its physical status.

---

## Allocation History

Every Bed Allocation becomes part of the Stay Timeline.

Example:

```
Check-in
     │
     ▼
Bed B2 Allocated
     │
     ▼
Transferred to H1
     │
     ▼
Transferred to SB1
     │
     ▼
Checkout
```

Historical allocations shall never be deleted.

This preserves a complete occupancy history.

---

## Operational Impact

Bed Allocation provides operational information used by multiple business domains.

### Accommodation

Determines:

- Current Occupancy
- Bed Availability
- Capacity Utilization

---

### Finance

Determines:

- Applicable accommodation charges
- Billing context
- Occupancy duration

---

### Compliance

Determines:

- Current place of residence
- Accommodation details for statutory reporting

---

### Reporting

Supports:

- Occupancy Reports
- Bed History
- Resident Movement
- Utilization Analysis

---

## Business Rules

Bed Allocation follows these principles:

- Every Active Stay has one current Bed.
- Every allocated Bed belongs to one Active Stay.
- Bed Allocation begins during Check-in.
- Bed Allocation may change through Bed Transfer.
- Historical allocations remain permanently associated with the Stay.

---

## Business Notes

Bed Allocation is an operational activity rather than a physical property.

The Bed remains part of the Accommodation domain.

The allocation belongs to the Stay.

This distinction allows Residents to move between Beds without creating new Stays while preserving an accurate operational history of occupancy.

# 11. Bed Transfer

## Purpose

A Bed Transfer is the operational process of moving an Active Stay from one Bed to another without ending the Stay.

It allows accommodation changes while preserving the continuity of the Resident's occupancy, financial records, compliance obligations, and operational history.

A Bed Transfer changes the physical location of the Resident.

It does **not** create a new Stay.

---

## Business Definition

A Bed Transfer is the reassignment of an Active Stay from one Bed to another.

The Stay remains unchanged.

Only the allocated Bed changes.

The transfer becomes effective on the date and time specified by the organization.

---

## Why Bed Transfers Occur

Organizations may transfer Residents for various operational reasons.

Examples include:

- Resident Request
- Room Upgrade
- Room Downgrade
- Maintenance
- Renovation
- Bed Blocking
- Operational Balancing
- Resident Compatibility
- Emergency Relocation

The reason should become part of the Stay history.

---

## Transfer Lifecycle

```
Current Bed
      │
      ▼
Transfer Initiated
      │
      ▼
New Bed Allocated
      │
      ▼
Previous Bed Released
      │
      ▼
Stay Continues
```

The Stay remains uninterrupted throughout the transfer.

---

## Information Recorded

Typical Bed Transfer information includes:

| Field | Description |
|--------|-------------|
| Previous Bed | Bed being vacated |
| New Bed | Bed being allocated |
| Transfer Date | Date transfer became effective |
| Transfer Time | Time transfer became effective |
| Transfer Reason | Reason for transfer |
| Authorized By | User approving the transfer |
| Remarks | Operational notes |

These details become part of the permanent Stay history.

---

## Business Rules

Every Bed Transfer shall comply with the following rules.

### Active Stay Required

Only an Active Stay may be transferred.

Completed or Closed Stays cannot be transferred.

---

### Available Bed Required

The destination Bed must be available according to Accommodation rules.

Beds that are:

- Occupied
- Reserved
- Blocked
- Under Maintenance

shall not normally be used as transfer destinations.

---

### One Current Bed

Immediately after transfer:

- Previous Bed becomes available.
- New Bed becomes occupied.
- Stay references the new Bed.

There shall never be two active Bed allocations for the same Stay.

---

### Stay Continuity

A Bed Transfer does **not**:

- create a new Stay,
- restart the Stay,
- reset occupancy,
- affect Resident identity.

The Stay continues uninterrupted.

---

## Operational Effects

### Accommodation

Accommodation updates:

- Previous Bed → Vacant
- New Bed → Occupied

Physical ownership remains unchanged.

---

### Stay

The Stay records:

- Previous Bed
- New Bed
- Transfer Date
- Transfer Reason

The current Bed reference is updated.

---

### Finance

Finance may evaluate whether the transfer affects:

- Rent
- Charges
- Billing Rules

The financial treatment depends on organizational policy.

---

### Compliance

Where required, Compliance may update statutory records to reflect the Resident's new accommodation.

The Compliance domain determines whether such updates are necessary.

---

## Transfer History

Every Bed Transfer becomes part of the Stay Timeline.

Example:

```
Check-in
      │
      ▼
Bed B2
      │
      ▼
Transferred to H1
      │
      ▼
Transferred to SB1
      │
      ▼
Checkout
```

Historical transfers shall never be deleted.

This preserves a complete occupancy record.

---

## Invalid Transfers

The following situations are not permitted.

- Transfer to the same Bed.
- Transfer to an unavailable Bed.
- Transfer after Checkout.
- Transfer of a Closed Stay.
- Multiple simultaneous active Bed allocations.

The system should prevent these situations before completing the transfer.

---

## Business Principles

Bed Transfer follows these principles:

- A Stay continues through Bed Transfers.
- Bed Transfers preserve occupancy continuity.
- Every transfer becomes part of Stay history.
- Physical inventory remains owned by Accommodation.
- Occupancy remains owned by the Stay.

---

## Business Notes

Bed Transfer provides operational flexibility without disrupting the Resident's accommodation journey.

By separating Bed Allocation from the Stay itself, RPGMS allows Residents to move between Beds whenever necessary while preserving a single continuous Stay.

This approach maintains accurate occupancy history, supports operational efficiency, and avoids unnecessary fragmentation of Resident records.

# 12. Notice Period

## Purpose

The Notice Period represents the stage of a Stay during which the Resident has formally communicated the intention to vacate the accommodation.

It provides the organization with sufficient time to plan occupancy, manage finances, prepare for vacancy, and complete the checkout process.

The Notice Period is an operational stage of an Active Stay.

It does **not** end the Stay.

---

## Business Definition

A Notice Period begins when the Resident formally submits notice of the intention to vacate accommodation.

The Stay remains Active throughout the Notice Period.

Occupancy continues until Checkout is completed.

---

## Notice Lifecycle

```
Active Stay
      │
      ▼
Notice Submitted
      │
      ▼
On Notice
      │
      ▼
Checkout
      │
      ▼
Closed
```

The Stay remains valid and operational during the entire Notice Period.

---

## Information Recorded

Typical Notice information includes:

| Field | Description |
|--------|-------------|
| Notice Date | Date notice was submitted |
| Expected Checkout Date | Planned departure date |
| Notice Period | Number of notice days |
| Notice Reason | Reason for vacating |
| Accepted By | User recording the notice |
| Remarks | Operational notes |

These details become part of the permanent Stay history.

---

## Notice Reasons

Organizations may record the reason for the Resident's departure.

Examples include:

- Course Completed
- Job Transfer
- Returning Home
- Change of Accommodation
- Personal Reasons
- Rule Violation
- Non-Payment
- Administrative Decision
- Other

These values are intended for operational reporting and future analysis.

---

## Operational Effects

Submitting notice does not end occupancy.

The Resident:

- continues occupying the allocated Bed,
- continues using hostel facilities,
- remains subject to hostel rules,
- continues under the current Stay.

Only the operational status changes to **On Notice**.

---

## Accommodation Impact

During the Notice Period:

- Bed remains Occupied.
- Bed is not considered Vacant.
- Bed cannot normally be allocated to another Resident.

The organization may use the expected Checkout Date for future occupancy planning.

---

## Finance Impact

The Notice Period may affect financial processing according to organizational policy.

Examples include:

- Final Rent Calculation
- Outstanding Charges
- Deposit Review
- Final Billing
- Refund Preparation

The Finance domain determines how these activities are performed.

---

## Compliance Impact

Compliance activities continue throughout the Notice Period.

Where required, statutory records remain active until Checkout is completed.

---

## Withdrawal of Notice

A Resident may withdraw notice if organizational policy permits.

Example lifecycle:

```
Active Stay
      │
      ▼
On Notice
      │
      ▼
Notice Withdrawn
      │
      ▼
Active Stay
```

Withdrawal of notice does not create a new Stay.

The existing Stay simply returns to Active status.

Whether notice withdrawal is permitted is a business policy decision.

---

## Business Rules

The Notice Period follows these principles:

- Notice does not end occupancy.
- The Stay remains Active until Checkout.
- The Bed remains Occupied during Notice.
- Billing continues according to organizational policy.
- Notice becomes part of the permanent Stay history.
- Checkout may occur only after or independent of Notice, depending on organizational policy.

---

## Exceptional Situations

Some Stays may conclude without a formal Notice.

Examples include:

- Immediate Checkout
- Emergency Departure
- Administrative Eviction
- Abandoned Accommodation

These situations should still preserve an accurate operational history within the Stay.

---

## Business Notes

The Notice Period exists to support the orderly conclusion of a Stay.

It provides operational visibility into upcoming vacancies while allowing the Resident to continue occupying accommodation until Checkout.

By treating Notice as a stage within the Stay rather than a separate business process, RPGMS maintains a continuous and accurate record of the Resident's occupancy journey.

# 13. Checkout

## Purpose

Checkout is the operational process through which a Resident formally concludes a Stay and relinquishes possession of the allocated accommodation.

It marks the end of physical occupancy while initiating the final operational, financial, and compliance activities associated with the Stay.

Checkout represents the official completion of occupancy.

---

## Business Definition

Checkout is the formal termination of an Active Stay.

During Checkout:

- The Resident vacates the allocated Bed.
- Physical occupancy ends.
- The Bed becomes available for future allocation.
- Operational responsibilities conclude.
- The Stay transitions towards closure.

Checkout ends occupancy but does not erase the operational history of the Stay.

---

## Checkout Lifecycle

```
Active Stay
      │
      ▼
On Notice (Optional)
      │
      ▼
Checkout Initiated
      │
      ▼
Resident Vacates
      │
      ▼
Bed Released
      │
      ▼
Stay Closed
```

Notice is optional depending on organizational policy.

Every occupied Stay ultimately concludes with Checkout.

---

## Information Recorded

Typical Checkout information includes:

| Field | Description |
|--------|-------------|
| Checkout Date | Actual departure date |
| Checkout Time | Actual departure time |
| Vacated Bed | Bed released by the Resident |
| Checkout Reason | Reason for concluding the Stay |
| Processed By | User completing the Checkout |
| Remarks | Operational observations |

These details become part of the permanent Stay history.

---

## Checkout Reasons

Organizations may record why the Stay concluded.

Examples include:

- Course Completed
- Employment Transfer
- Personal Reasons
- Change of Accommodation
- End of Contract
- Administrative Checkout
- Eviction
- Other

These values support future reporting and operational analysis.

---

## Operational Activities

Typical Checkout activities may include:

- Confirm Resident departure.
- Verify Bed has been vacated.
- Inspect accommodation.
- Collect keys or access devices.
- Update occupancy records.
- Release the allocated Bed.

Organizations may include additional operational procedures according to policy.

---

## Accommodation Impact

Successful Checkout affects the Accommodation domain.

The allocated Bed transitions from:

```
Occupied
     │
     ▼
Vacant
```

The Bed becomes available for future allocation.

Accommodation ownership remains unchanged.

---

## Stay Impact

Upon successful Checkout:

- Occupancy ends.
- Stay Status changes to Checked Out.
- No further Bed Transfers are permitted.
- No further occupancy operations are allowed.
- The Stay proceeds toward closure.

The Stay remains part of the permanent operational history.

---

## Finance Impact

Checkout may trigger financial activities.

Examples include:

- Final Rent Calculation
- Outstanding Balance Review
- Security Deposit Settlement
- Final Charges
- Refund Processing
- Ledger Completion

The Finance domain owns these activities.

Checkout merely provides the operational event that enables them.

---

## Compliance Impact

Checkout may conclude compliance obligations.

Examples include:

- Closing Police Records
- Updating Occupancy Registers
- Completing Statutory Documentation

The Compliance domain determines the required actions.

---

## Business Rules

Checkout follows these principles:

- Every Active Stay ends with Checkout.
- Checkout ends physical occupancy.
- Checkout releases the allocated Bed.
- Checkout does not delete historical information.
- Checkout permanently concludes occupancy operations.
- Checkout does not create a new Stay.

---

## Exceptional Situations

Some Checkouts may occur under exceptional circumstances.

Examples include:

- Immediate Departure
- Emergency Evacuation
- Administrative Eviction
- Resident Absconding
- Death of Resident

These situations should still be recorded as Checkout events while preserving a complete operational history.

---

## Business Notes

Checkout represents the formal conclusion of the Resident's accommodation journey.

Although occupancy ends, the Stay remains an important historical business record.

By clearly separating Checkout from the final closure of operational and financial activities, RPGMS ensures that historical occupancy, auditing, reporting, and statutory obligations remain complete and accurate.

# 14. Stay Status Lifecycle

## Purpose

The Stay Status Lifecycle defines the valid operational states through which a Stay progresses during its existence.

While the **Stay Lifecycle** describes the business journey, the **Stay Status Lifecycle** defines the operational state of the Stay at any given point in time.

Only one Stay Status may exist at any point in time.

---

## Stay Statuses

A Stay may exist in one of the following operational statuses.

| Status | Description |
|----------|-------------|
| Reserved | Accommodation reserved but occupancy has not begun |
| Active | Resident is currently occupying accommodation |
| On Notice | Resident has submitted notice but continues occupancy |
| Checked Out | Resident has vacated accommodation |
| Closed | Stay has been fully completed and archived |
| Cancelled | Reservation cancelled before Check-in |
| Expired | Reservation expired before Check-in |

These statuses collectively describe the operational state of every Stay.

---

## Standard Lifecycle

The normal operational progression is:

```
Reserved
     │
     ▼
Active
     │
     ▼
On Notice
     │
     ▼
Checked Out
     │
     ▼
Closed
```

This represents the typical occupancy journey.

---

## Alternative Lifecycles

### Reservation Cancelled

```
Reserved
     │
     ▼
Cancelled
```

No occupancy occurs.

---

### Reservation Expired

```
Reserved
     │
     ▼
Expired
```

The Resident never checks in.

---

### Immediate Checkout

```
Reserved
     │
     ▼
Active
     │
     ▼
Checked Out
     │
     ▼
Closed
```

Notice is not mandatory.

---

### Notice Withdrawn

If organizational policy permits:

```
Active
     │
     ▼
On Notice
     │
     ▼
Active
```

The Stay continues uninterrupted.

---

## Status Descriptions

### Reserved

The organization has accepted a future occupancy.

Characteristics:

- No occupancy.
- No billing.
- No compliance.
- Bed may be reserved.

---

### Active

The Resident is occupying accommodation.

Characteristics:

- Bed allocated.
- Occupancy active.
- Billing eligible.
- Compliance active.
- Bed transfers permitted.

---

### On Notice

The Resident intends to vacate.

Characteristics:

- Occupancy continues.
- Billing continues.
- Checkout planned.
- Bed remains occupied.

---

### Checked Out

Physical occupancy has ended.

Characteristics:

- Resident has left.
- Bed released.
- Operational occupancy completed.
- Financial and compliance closure may still continue.

---

### Closed

The Stay has been fully concluded.

Characteristics:

- Operational activities complete.
- Historical record preserved.
- No further occupancy changes permitted.

---

### Cancelled

Reservation withdrawn before occupancy.

Characteristics:

- No Stay activation.
- No Bed occupancy.
- Historical Reservation retained.

---

### Expired

Reservation not utilized.

Characteristics:

- No Check-in.
- Reservation period exceeded.
- Bed released for future allocation.

---

## Valid Status Transitions

The following transitions are permitted.

| Current Status | Allowed Next Status |
|----------------|---------------------|
| Reserved | Active, Cancelled, Expired |
| Active | On Notice, Checked Out |
| On Notice | Active (optional), Checked Out |
| Checked Out | Closed |
| Closed | None |
| Cancelled | None |
| Expired | None |

Transitions outside these rules should not normally be permitted.

---

## Invalid Transitions

Examples of invalid transitions include:

- Closed → Active
- Checked Out → Active
- Expired → Active
- Cancelled → Active
- Closed → Reserved
- Active → Reserved

Such transitions would compromise the integrity of the Stay history.

---

## Relationship with Other Domains

Stay Status influences several business domains.

| Business Domain | Uses Stay Status For |
|-----------------|----------------------|
| Accommodation | Bed occupancy |
| Finance | Billing eligibility |
| Compliance | Active statutory obligations |
| Reporting | Occupancy reporting |
| Dashboard | Operational summaries |

These domains consume Stay Status but do not control it.

---

## Business Principles

The Stay Status Lifecycle follows these principles:

- Every Stay has exactly one current Status.
- Status reflects the current operational state.
- Status changes become part of Stay history.
- Historical statuses are never deleted.
- Status transitions follow defined business rules.
- Completed Stays shall not be reactivated.

---

## Business Notes

The Stay Status Lifecycle provides a consistent operational framework for every Stay within RPGMS.

By standardizing status definitions and permitted transitions, the system ensures that occupancy, finance, compliance, and reporting all operate from the same business truth.

This makes the Stay Status the authoritative indicator of a Resident's current operational position within the accommodation lifecycle.

# 15. Validation Principles

## Purpose

Validation Principles define the business rules that ensure every Stay remains accurate, consistent, and operationally reliable throughout its lifecycle.

These principles preserve the integrity of occupancy records and establish a single source of operational truth within RPGMS.

The principles described here are business rules and are independent of database design, user interface, or technical implementation.

---

## Business Principles

### Business-Driven Validation

Validation shall always enforce business rules.

Technology shall implement these rules but shall not define them.

---

### One Active Stay per Resident

For the MVP, a Resident may have only one Active Stay at any point in time.

The system shall prevent creation of multiple concurrent Active Stays for the same Resident.

Historical Stays are not affected by this rule.

---

### One Active Occupant per Bed

A Bed may be allocated to only one Active Stay at any point in time.

The system shall prevent double allocation of Beds.

---

### Mandatory Resident

Every Stay shall reference exactly one Resident.

A Stay cannot exist without a valid Resident.

---

### Mandatory Bed

Every Active Stay shall reference exactly one current Bed.

A Stay cannot become Active until a valid Bed has been allocated.

---

## Reservation Validation

The system shall validate that:

- A Resident exists.
- The Reservation Date is valid.
- The Expected Check-in Date is valid.
- The reserved Bed, if specified, is available.
- Duplicate active Reservations for the same Resident are not permitted according to organizational policy.

A Reservation does not create occupancy.

---

## Check-in Validation

Before Check-in can be completed, the system shall validate that:

- Resident exists.
- Stay is eligible for Check-in.
- Bed is available.
- Resident has no other Active Stay.
- Required admission requirements have been satisfied according to organizational policy.

Successful validation creates Active occupancy.

---

## Bed Allocation Validation

The system shall validate that:

- Bed exists.
- Bed belongs to the Accommodation hierarchy.
- Bed is available.
- Bed is not already occupied.
- Bed is not blocked.
- Bed is not under maintenance unless organizational policy explicitly permits.

---

## Bed Transfer Validation

Before a transfer is completed, the system shall validate that:

- Stay is Active.
- Destination Bed exists.
- Destination Bed is available.
- Destination Bed differs from the current Bed.
- Transfer Date is valid.

Successful validation updates the current Bed while preserving Stay continuity.

---

## Notice Validation

The system shall validate that:

- Stay is Active.
- Notice Date is valid.
- Expected Checkout Date is not earlier than the Notice Date.
- Notice may be withdrawn only if organizational policy permits.

Submitting Notice shall not terminate occupancy.

---

## Checkout Validation

Before Checkout is completed, the system shall validate that:

- Stay is Active or On Notice.
- Resident currently occupies the allocated Bed.
- Checkout Date is valid.
- Bed can be released.

Organizations may additionally require completion of operational procedures before Checkout.

---

## Status Validation

Every Stay shall have exactly one operational Status.

Only valid status transitions shall be permitted.

Invalid transitions include:

- Closed → Active
- Checked Out → Active
- Cancelled → Active
- Expired → Active

The system should prevent invalid lifecycle transitions.

---

## Date Validation

Dates recorded within a Stay should follow logical chronological order.

Typical sequence:

```
Reservation Date
        ↓
Expected Check-in
        ↓
Check-in Date
        ↓
Notice Date
        ↓
Expected Checkout
        ↓
Checkout Date
        ↓
Closed Date
```

Not every Stay will contain every date.

Dates become applicable only as the Stay progresses.

---

## Historical Integrity

Historical Stay information shall be preserved.

The following information should never be removed through normal operations:

- Check-in
- Bed Allocation History
- Bed Transfers
- Notice History
- Checkout
- Status History

Administrative corrections should be recorded through appropriate audit mechanisms.

---

## Deletion Rules

Stay records represent permanent operational history.

Therefore:

- Active Stays shall never be deleted.
- Checked Out Stays shall never be deleted.
- Closed Stays shall never be deleted.

If organizational policy permits removal of erroneous Reservations, the removal should preserve an audit trail.

As a general principle, RPGMS should favor **closing** a Stay rather than deleting it.

---

## Normalization

To maintain consistency, RPGMS should normalize Stay information where appropriate.

Recommended normalization includes:

- Trim leading and trailing spaces.
- Remove duplicate spaces.
- Standardize date formats.
- Validate chronological order of dates.
- Normalize operational remarks according to organizational policy.

Normalization improves reporting, searching, auditing, and operational consistency.

---

## Business Notes

The Stay is the authoritative operational record of occupancy within RPGMS.

Incorrect Stay information may affect:

- Bed Allocation
- Occupancy Reporting
- Billing
- Compliance
- Dashboard Metrics
- Resident History

Strong validation is therefore essential.

---

## Single Source of Operational Truth

The Stay domain is the single source of truth for occupancy.

Questions such as:

- Who currently occupies this Bed?
- Which Bed is occupied by this Resident?
- When did occupancy begin?
- Has notice been submitted?
- Has the Resident checked out?

shall always be answered from the Stay domain.

No other business domain shall maintain independent occupancy records.

---

## Future Compatibility

These Validation Principles have been intentionally designed to accommodate future enhancements, including:

- Multiple Properties
- Online Reservations
- Waitlists
- Group Bookings
- Corporate Accommodation
- Temporary Vacations
- Automated Check-in
- Self-Service Portals

Future enhancements should extend these validation rules rather than replace them.

# 16. Future Extensions

The Stay domain has been intentionally designed to support future business requirements without requiring fundamental architectural changes.

Future enhancements should extend the existing Stay model while preserving its core business principles, lifecycle, and ownership boundaries.

---

## Multiple Properties

The MVP assumes that a Resident may have only one Active Stay.

Future versions may support Residents occupying accommodation across multiple Properties managed by the same organization.

Example:

```
Resident

    │

    ├── Stay
    │      Property A

    └── Stay
           Property B
```

Business rules governing simultaneous occupancy may evolve according to organizational requirements.

---

## Online Reservations

Future versions may allow Residents to create Reservations through online portals.

Possible capabilities include:

- Online Reservation Requests
- Reservation Confirmation
- Digital Admission Forms
- Online Document Upload
- Arrival Scheduling

These enhancements extend the Reservation stage without altering the Stay lifecycle.

---

## Waitlist Management

When accommodation is unavailable, RPGMS may support Waitlists.

Example lifecycle:

```
Waitlist
      │
      ▼
Reservation
      │
      ▼
Check-in
```

The Waitlist should remain a separate business process preceding Reservation.

---

## Self-Service Check-in

Future versions may support self-service admission.

Examples include:

- Mobile Check-in
- QR Code Check-in
- Facial Recognition
- Digital Identity Verification
- Automated Admission

Successful self-service admission should still create a standard Stay.

---

## Temporary Vacations

Residents may temporarily leave accommodation while retaining their Stay.

Example:

```
Active
     │
     ▼
Temporary Leave
     │
     ▼
Returned
     │
     ▼
Active
```

Temporary absence should not terminate the Stay.

---

## Room Upgrade and Downgrade

Future business rules may support structured accommodation changes.

Examples:

- Premium Room Upgrade
- Larger Room
- Smaller Room
- Temporary Upgrade

These remain Bed Transfer operations within the same Stay.

---

## Group Bookings

Organizations may accommodate groups.

Examples:

- Student Groups
- Corporate Trainees
- Sports Teams
- Educational Tours

Each Resident should continue to receive an individual Stay while sharing a common Booking or Reservation.

---

## Corporate Accommodation

Organizations may sponsor accommodation for employees or trainees.

Possible additions include:

- Employer Reference
- Sponsoring Organization
- Corporate Contract
- Cost Centre
- Project Assignment

These attributes supplement the Stay without changing its ownership.

---

## Digital Agreements

Future versions may support electronically signed accommodation agreements.

Examples:

- Digital Terms Acceptance
- Electronic Signature
- Online Consent
- Digital Check-in Forms

The agreement becomes part of the Stay's operational record.

---

## Smart Occupancy

Future integrations may automate occupancy management.

Examples include:

- Facial Recognition Entry
- Smart Door Access
- Occupancy Sensors
- Automated Attendance
- Access Logs

These integrations consume Stay information while leaving occupancy ownership within the Stay domain.

---

## Visitor Management

Future versions may support temporary visitor permissions associated with a Stay.

Examples:

- Guest Passes
- Parent Visits
- Maintenance Access
- Contractor Visits

Visitor records should remain separate from the Stay while referencing it where necessary.

---

## Temporary Bed Blocking

Future enhancements may allow Beds to be temporarily reserved during operational activities such as:

- Cleaning
- Deep Maintenance
- Pest Control
- Renovation

The Stay model remains unchanged while Accommodation manages Bed availability.

---

## Automated Workflow Integration

Future workflow automation may include:

- Automatic Reminder Messages
- Notice Expiry Alerts
- Checkout Reminders
- Pending Documentation Alerts
- Billing Notifications

These workflows should react to Stay events without altering the Stay lifecycle.

---

## Analytics and Business Intelligence

Future reporting capabilities may analyze Stay information.

Examples include:

- Average Length of Stay
- Resident Retention
- Seasonal Occupancy
- Bed Utilization Trends
- Notice Period Analysis
- Resident Turnover

These analytical features consume Stay history without modifying it.

---

## Business Notes

### Backward Compatibility

Future enhancements shall preserve the existing Stay lifecycle and operational principles wherever practical.

Existing Stay records should continue to function without migration whenever new features are introduced.

---

### Extensibility

The Stay domain has been intentionally designed around a simple operational lifecycle.

This allows future business capabilities to be introduced through extension rather than redesign, ensuring long-term architectural stability and protecting historical occupancy records.

---

### Architectural Principle

Future enhancements should continue to treat the Stay as the central operational business entity of RPGMS.

Regardless of new features or integrations, the following principle shall remain unchanged:

**A Stay represents the complete operational relationship between a Resident and the organization for a defined period of accommodation.**

# 17. Related Business Domains

## Purpose

The Stay domain serves as the central operational hub within RPGMS.

It connects multiple business domains while maintaining clear ownership boundaries.

Each business domain owns its own information and responsibilities.

The Stay domain coordinates occupancy but does not duplicate information owned elsewhere.

---

## Resident

The Resident domain represents **who** is occupying accommodation.

Resident owns:

- Personal Identity
- Contact Information
- Government Identification
- Medical Information
- Emergency Contact
- Resident Documents

Stay references the Resident but never duplicates Resident Profile information.

---

## Accommodation

The Accommodation domain represents **where** the Resident is accommodated.

Accommodation owns:

- Property
- Flat
- Area
- Bed
- Bed Status
- Physical Capacity

Stay references the allocated Bed and records its allocation history but does not own the physical accommodation.

---

## Finance

The Finance domain manages all financial activities arising from a Stay.

Finance owns:

- Security Deposit
- Rent
- Recurring Charges
- One-Time Charges
- Billing
- Payments
- Refunds
- Outstanding Dues
- Ledger

A Stay determines **when** financial activities begin and end.

Finance determines **how** they are calculated and recorded.

---

## Compliance

The Compliance domain manages statutory and organizational obligations associated with occupancy.

Examples include:

- Police Intimation
- Police Acknowledgements
- Tenant Verification
- Statutory Documentation
- Government Reporting

Compliance references the Stay to determine the period and location of occupancy.

---

## Reporting

Reporting consumes Stay information to produce operational and management reports.

Examples include:

- Current Occupancy
- Resident History
- Bed History
- Stay Duration
- Checkout Trends
- Vacancy Forecasts

Reporting derives information from Stay records but does not own or modify them.

---

## Dashboard

The Dashboard provides real-time operational visibility.

Typical Stay-related metrics include:

- Active Stays
- Reservations
- Residents On Notice
- Today's Check-ins
- Today's Checkouts
- Upcoming Vacancies
- Average Occupancy Duration

Dashboard information is derived dynamically from the Stay domain.

---

## Notifications (Future)

Future notification services may consume Stay events.

Examples include:

- Check-in Reminders
- Notice Acknowledgements
- Checkout Reminders
- Expiring Reservations
- Administrative Alerts

The Notification service reacts to Stay events but does not own Stay information.

---

## Workflow Automation (Future)

Workflow engines may automate operational processes triggered by Stay events.

Examples include:

- Create Initial Bill after Check-in
- Trigger Police Intimation
- Notify Housekeeping after Checkout
- Schedule Room Inspection
- Generate Final Settlement

Automation consumes Stay events without modifying Stay ownership.

---

## Relationship Summary

| Business Domain | Owns | Uses Stay |
|-----------------|------|-----------|
| Resident | Resident identity | Yes |
| Accommodation | Physical inventory | Yes |
| Finance | Financial transactions | Yes |
| Compliance | Statutory obligations | Yes |
| Reporting | Reports and analytics | Yes |
| Dashboard | Operational summaries | Yes |
| Notifications (Future) | Communication workflows | Yes |
| Workflow Automation (Future) | Business automation | Yes |

---

## Business Principles

The relationship between Stay and other business domains follows these principles:

- Stay owns occupancy.
- Resident owns identity.
- Accommodation owns physical inventory.
- Finance owns monetary transactions.
- Compliance owns statutory obligations.
- Reporting consumes information but owns none.
- Dashboard displays derived operational information.

Each business domain remains independently responsible for its own data.

---

## Business Notes

The Stay domain is the **operational center** of RPGMS.

Every significant operational activity associated with accommodation either:

- creates a Stay,
- updates a Stay,
- references a Stay, or
- concludes a Stay.

For this reason, the Stay domain acts as the primary business process that connects all major domains while preserving clear separation of responsibilities and a single source of truth for occupancy.

# 18. Out of Scope

## Purpose

This specification intentionally limits the responsibilities of the Stay domain.

Clearly defining what does **not** belong to Stay preserves the architectural principle of **Single Business Ownership**, prevents duplication of information, and ensures that each business domain remains responsible for its own data.

---

## Resident Information

The Stay domain does not own Resident information.

Examples include:

- Resident Name
- Date of Birth
- Gender
- Contact Information
- Government Identification
- Medical Information
- Emergency Contacts
- Parent / Guardian Details
- Resident Documents

These belong exclusively to the **Resident** domain.

---

## Accommodation Structure

The Stay domain does not own the physical accommodation.

Examples include:

- Property
- Building (future)
- Wing (future)
- Flat
- Area
- Bed
- Bed Status
- Capacity

These belong exclusively to the **Accommodation** domain.

Stay only references the currently allocated Bed and its allocation history.

---

## Financial Information

The Stay domain contains no financial information.

Examples include:

- Security Deposit
- Rent
- Billing
- Charges
- Payments
- Refunds
- Outstanding Dues
- Ledger
- Invoices

These belong exclusively to the **Finance** domain.

Stay merely provides the operational event that initiates or concludes financial activities.

---

## Compliance Information

The Stay domain does not own statutory or legal compliance information.

Examples include:

- Police Intimation
- Police Acknowledgement
- Tenant Verification
- Government Reporting
- Compliance Documents
- Statutory Approvals

These belong exclusively to the **Compliance** domain.

The Stay provides the occupancy context required for compliance processing.

---

## Physical Asset Management

The Stay domain does not manage physical assets.

Examples include:

- Furniture
- Appliances
- Lockers
- Parking
- Utility Meters
- Smart Devices

These belong to the Accommodation or future Asset Management domains.

---

## Business Policies

The Stay domain does not define organizational policies.

Examples include:

- Notice Period Duration
- Refund Policy
- Admission Policy
- Visitor Policy
- Billing Rules
- Deposit Rules
- Room Upgrade Policy

These are configurable business policies implemented elsewhere within RPGMS.

---

## User Interface Behaviour

This specification intentionally does not define:

- Screen Layouts
- Navigation
- Dialog Design
- Button Placement
- Icons
- Themes
- User Experience

These belong to application design and implementation.

---

## Database Design

This specification intentionally does not define:

- Database Tables
- SQL Schema
- Primary Keys
- Foreign Keys
- APIs
- Supabase Structure
- Indexes
- Technical Architecture

These belong to the implementation layer.

---

## Reporting Logic

The Stay domain does not permanently store reporting information.

Examples include:

- Occupancy Percentage
- Average Stay Duration
- Daily Occupancy
- Monthly Check-ins
- Resident Turnover
- Dashboard Statistics

These values are derived dynamically from operational data.

---

## Workflow Automation

The Stay domain records operational events.

It does not define automated actions such as:

- Sending Emails
- WhatsApp Messages
- SMS Notifications
- Reminder Schedules
- Background Jobs
- Workflow Engines

Automation services consume Stay events but remain independent of the Stay domain.

---

## Business Notes

The Stay domain has one primary responsibility:

> **To manage the operational lifecycle of accommodation occupancy.**

Anything that primarily describes:

- A Person,
- A Physical Asset,
- A Financial Transaction,
- A Legal Obligation,
- A Business Policy,
- A User Interface,
- Or Technical Implementation,

belongs to another business domain or architectural layer.

Maintaining these boundaries keeps the Stay domain focused, stable, extensible, and aligned with the overall architecture of RPGMS.

# 19. Change Log

| Version | Date | Description | Author |
|----------|------|-------------|--------|
| 1.0 | July 2026 | Initial Stay Specification | RPGMS Architecture |

---

# Document Status

**Status:** Frozen v1.0

This document defines the business specification for the Stay domain within RPGMS.

It establishes the operational lifecycle of accommodation occupancy, the ownership of occupancy-related information, the relationships with other business domains, and the business rules governing a Resident's Stay.

Future revisions shall preserve the architectural principles established by this specification unless superseded by an approved architectural decision.

---

# Summary

The Stay domain has been designed around a small number of fundamental business principles.

These principles shall guide all future development.

---

## Stay Represents an Operational Relationship

A Stay represents the operational relationship between a Resident and the organization for a defined period of accommodation.

It is neither the Resident nor the Accommodation.

Instead, it is the business entity that connects them.

---

## Stay is the Operational Heart of RPGMS

Every operational activity associated with accommodation revolves around a Stay.

Examples include:

- Reservation
- Check-in
- Bed Allocation
- Bed Transfer
- Notice
- Checkout

Other business domains consume Stay information but do not own it.

---

## Occupancy is Time-Bound

Every Stay has:

- a beginning,
- a period of occupancy,
- and an end.

A completed Stay becomes a permanent historical record.

Historical Stays are never reused.

---

## One Active Stay per Resident

For the MVP:

- A Resident may have multiple historical Stays.
- A Resident may have only one Active Stay at any point in time.

This principle maintains operational clarity and simplifies occupancy management.

---

## One Current Bed per Stay

A Stay references one current Bed.

The allocated Bed may change during the Stay through Bed Transfers.

These transfers preserve a continuous Stay while maintaining a complete history of occupancy movements.

---

## Stay Owns Occupancy

The Stay domain owns:

- Occupancy
- Operational Status
- Bed Allocation History
- Reservation
- Check-in
- Notice
- Checkout

The Stay does **not** own:

- Resident Identity
- Physical Accommodation
- Financial Transactions
- Compliance Records

Each business domain remains responsible for its own information.

---

## Single Source of Operational Truth

The Stay domain is the authoritative source for occupancy.

Questions such as:

- Who currently occupies this Bed?
- Which Bed is allocated to this Resident?
- When did occupancy begin?
- Is the Resident On Notice?
- Has Checkout occurred?

shall always be answered from the Stay domain.

No other business domain shall maintain independent occupancy records.

---

## Future-Ready Design

The Stay model has been intentionally designed to support future enhancements without requiring architectural redesign.

Potential future capabilities include:

- Online Reservations
- Waitlists
- Self-Service Check-in
- Temporary Leave
- Corporate Accommodation
- Group Bookings
- Smart Occupancy
- Visitor Management
- Workflow Automation
- Advanced Analytics

These capabilities extend the Stay model while preserving its fundamental business principles.

---

## Closing Statement

The Stay Specification forms the operational foundation of RPGMS.

Together with the Resident Specification and Accommodation Specification, it completes the three core business domains upon which Finance, Billing, Compliance, Reporting, and future operational modules are built.

The Stay model has been intentionally designed to be simple, stable, auditable, and extensible, ensuring that RPGMS can evolve over time without compromising the integrity of its occupancy records.

