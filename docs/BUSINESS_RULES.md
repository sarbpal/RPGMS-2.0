# RPGMS 2.0
# Business Rules

**Document ID:** RPGMS-BR-001

**Version:** 2.0

**Status:** Approved

**Document Owner:** RPGMS Architecture

**Last Updated:** July 2026

---

# Purpose

The Business Rules document defines the mandatory rules that govern the operation of RPGMS.

Business Rules describe what the system must always enforce in order to preserve business correctness, operational consistency and historical integrity.

These rules are independent of software implementation and remain valid regardless of programming language, database technology or user interface.

Where the Business Constitution explains the business architecture, this document specifies the mandatory rules that every implementation must enforce.

---

# Scope

This document applies to every business domain within RPGMS.

These include:

- Accommodation
- Resident
- Stay
- Reservation
- Admission
- Financial Management
- Laundry
- Billing
- Compliance
- Roles & Permissions
- Configuration
- Audit
- Documents
- Notifications
- Search
- Business Numbering
- Business Exceptions

Future business domains shall extend this document without changing the numbering or intent of existing rules.

---

# Relationship to Other Documents

The Business Rules document should be read together with the Business Constitution.

The relationship between the two documents is:

| Document | Purpose |
|----------|---------|
| BUSINESS_CONSTITUTION.md | Defines the business architecture and business concepts. |
| BUSINESS_RULES.md | Defines the mandatory rules governing those business concepts. |

The Business Constitution explains **what the business is**.

The Business Rules document defines **what the business must always enforce**.

---

# Guiding Principles

Every Business Rule shall follow these principles.

## BRP-001 Technology Independent

Business Rules describe business behaviour rather than software implementation.

They shall not reference:

- Database design
- Programming languages
- APIs
- User interface behaviour
- Technical implementation details

---

## BRP-002 Single Ownership

Every Business Rule belongs to one primary business domain.

Where multiple domains are affected, one domain shall remain the authoritative owner.

---

## BRP-003 Permanent Identifiers

Business Rule identifiers are permanent.

Once assigned:

- Rule numbers shall never change.
- Rule numbers shall never be reused.
- Retired rules remain reserved.

This ensures stable references across documentation, testing and software implementation.

---

## BRP-004 Business First

Business Rules describe business obligations rather than software features.

Rules should remain valid even if the software implementation changes completely.

---

## BRP-005 Single Source of Truth

Every business fact shall have exactly one authoritative owner.

Business information shall not exist in multiple conflicting locations.

Derived information shall always originate from its authoritative source.

---

## BRP-006 Immutable History

Historical business records shall never be modified in a manner that changes historical truth.

Corrections shall create new Business Events rather than altering historical records.

---

## BRP-007 Clear Responsibility

Each rule shall clearly identify:

- What must be true.
- Which business object owns the responsibility.
- When the rule applies.

Rules should avoid unnecessary explanation.

---

---

## BRP-008 Business Truth

Business Truth shall only be established through an authorised Business Transaction.

Business Rules shall never establish Business Truth through preparation activities, configuration changes or operational planning.

---

## BRP-009 Expected Truth

Expected Truth shall remain the responsibility of the Reservation domain until Business Truth is established through an authorised Business Transaction.

Business Rules shall preserve the distinction between Expected Truth and Business Truth.

---

## BRP-010 Atomic Business Transactions

Business Transactions shall execute atomically.

Where a Business Transaction establishes Business Truth, it shall either:

- complete successfully in its entirety, or
- produce no Business Truth.

Partial completion shall not be considered a valid business state.

---

# Rule Structure

Business Rules are organised into domain-specific sections.

Each domain owns a dedicated range of rule identifiers.

| Domain | Rule Range |
|---------|-----------:|
| Accommodation | BR-001 – BR-099 |
| Resident | BR-100 – BR-199 |
| Stay | BR-200 – BR-299 |
| Reservation | BR-300 – BR-349 |
| Admission | BR-350 – BR-399 |
| Financial Architecture | BR-400 – BR-599 |
| Laundry | BR-L-001 – BR-L-099 |
| Roles & Permissions | BR-600 – BR-649 |
| Configuration | BR-650 – BR-699 |
| Audit & Events | BR-700 – BR-749 |
| Documents | BR-750 – BR-799 |
| Notifications | BR-800 – BR-829 |
| Search | BR-830 – BR-849 |
| Business Numbering | BR-850 – BR-874 |
| Business Exceptions | BR-875 – BR-899 |
| General Rules | BR-900 – BR-999 |

Additional rules shall always be added within the appropriate domain.

Existing rule identifiers shall remain unchanged.

---

# Rule Format

Every Business Rule follows a consistent structure.

Example:

**BR-201 Stay Creation**

**Rule**

Every occupancy shall be represented by exactly one Stay.

**Reason**

The Stay is the authoritative operational record of occupancy.

**Applies To**

- Admission
- Readmission
- Stay Management

This structure provides a consistent format for documentation, implementation and testing.

---

# Document Status

This document is the authoritative specification of the business rules governing RPGMS.

All software implementation, testing and future business enhancements shall conform to these rules unless an approved architectural revision explicitly changes them.

---

# Accommodation

Accommodation defines the physical assets managed by the organisation.

The Accommodation domain governs the structure, identity, allocation and operational status of all physical accommodation units.

---

## BR-001 Property Structure

### Rule

A Property shall be the highest physical accommodation unit managed by RPGMS.

A Property may contain one or more Flats.

### Reason

Properties provide the top-level organisational structure for accommodation and support future multi-property expansion.

### Applies To

- Accommodation Management
- Property Administration

---

## BR-002 Flat Structure

### Rule

Every Flat shall belong to exactly one Property.

Every Flat shall have a unique Flat Number within its Property.

A Flat shall contain one or more Areas.

Flat capacity shall be derived from the total number of Beds it contains.

### Reason

A Flat is the primary accommodation unit allocated for resident occupancy.

### Applies To

- Accommodation Setup
- Property Configuration

---

## BR-003 Area Structure

### Rule

Every Area shall belong to exactly one Flat.

Area names shall be unique within a Flat.

An Area shall contain one or more Beds.

### Reason

Areas provide logical subdivision of accommodation without affecting business ownership.

### Applies To

- Accommodation Setup

---

## BR-004 Bed Structure

### Rule

A Bed shall be the smallest allocatable accommodation unit.

Every Bed shall belong to exactly one Area.

Bed identity shall be established by the combination of Flat Number and Bed Name.

Duplicate Bed Names are permitted across different Flats.

### Reason

Occupancy is always assigned at Bed level.

### Applies To

- Accommodation Setup
- Bed Management

---

## BR-005 Bed Occupancy

### Rule

A Bed shall have at most one Active Stay at any point in time.

A single Active Stay belongs to exactly one Flat, but may occupy one or more Beds within that Flat simultaneously.

Multiple historical Stay allocations may exist for the same Bed.

### Reason

A Bed cannot be simultaneously occupied by more than one Resident. However, a Stay may occupy multiple beds within a single Flat.

### Applies To

- Admission
- Bed Allocation
- Bed Transfer
- Accommodation Operations

---

## BR-006 Bed Status

### Rule

Every Bed shall have exactly one operational status.

Supported statuses are:

- Vacant
- Reserved
- Occupied
- On Notice
- Maintenance
- Blocked

Additional statuses may be introduced through future architectural revisions.

### Reason

Operational status represents the current availability of the Bed.

### Applies To

- Accommodation Operations

---

## BR-007 Bed Status Consistency

### Rule

Bed status shall always be consistent with the operational state of the associated Stay.

An Occupied Bed shall have an Active Stay.

A Vacant Bed shall have no active bed allocation for an Active Stay.

Releasing a single bed (partial bed release) transitions that bed's status to Vacant while the Stay remains active in the Flat.

A Reserved Bed shall not yet have active occupancy.

### Reason

Bed status must accurately represent real-world occupancy and availability.

### Applies To

- Admission
- Checkout
- Bed Release
- Reservation
- Bed Management

---

## BR-008 Bed Allocation History

### Rule

Every Bed allocation shall become part of the permanent Stay history.

Historical Bed allocations shall never be deleted or overwritten.

### Reason

Accommodation history forms part of the operational history of a Stay.

### Applies To

- Bed Allocation
- Bed Transfer
- Reporting

---

## BR-009 Bed Transfer

### Rule

A Resident may change Beds during an Active Stay.

Every Bed transfer shall:

- Preserve previous Bed allocation history.
- Record the effective transfer date.
- Allocate exactly one new active Bed.

### Reason

Residents may legitimately relocate without creating a new Stay.

### Applies To

- Stay Management
- Accommodation Operations

---

## BR-010 Accommodation Capacity

### Rule

Accommodation capacity shall be derived from configured Bed inventory.

Capacity shall never be entered manually.

### Reason

Bed inventory is the authoritative source of accommodation capacity.

### Applies To

- Dashboard
- Occupancy Reports
- Capacity Planning

---

## BR-011 Accommodation Availability

### Rule

Only Beds with an operational status permitting occupancy may be allocated.

Blocked or Maintenance Beds shall not be allocated to a Stay.

### Reason

Unavailable accommodation must not participate in occupancy planning.

### Applies To

- Admission
- Reservation
- Bed Allocation

---

## BR-012 Accommodation History

### Rule

Accommodation structure shall preserve historical integrity.

Flats, Areas or Beds that have historical occupancy shall not be permanently deleted.

Where accommodation is retired, it shall be archived according to business policy.

### Reason

Historical occupancy records depend upon historical accommodation records remaining available.

### Applies To

- Accommodation Administration
- Reporting
- Audit

---

## BR-013 Stable Flat Identifiers

### Rule

Flat Numbers shall become immutable once a Flat contains occupied or on-notice beds.

Renaming a Flat that contains active occupants shall be prohibited.

### Reason

Flat Numbers serve as physical identifiers. Renaming an occupied Flat invalidates referential integrity across active Stays, Resident ledgers, and billing records.

### Applies To

- Flat Management
- Accommodation Setup

---

## BR-014 Stable Bed Identifiers & Prefixes

### Rule

Area Bed Prefixes shall become immutable once an Area contains occupied or on-notice beds.

Modifying a Bed Prefix in an Area containing active occupants shall be prohibited.

### Reason

Bed Prefixes form part of permanent Bed identities (`{flatNumber}-{prefix}{index}`). Altering a Bed Prefix changes generated bed identifiers, breaking references in active Stay records.

### Applies To

- Area Management
- Accommodation Setup

---

## BR-015 Area Name Uniqueness

### Rule

Area names within a single Flat must be unique.

No two Areas within the same Flat shall share the same normalized name.

### Reason

Unique Area names prevent ambiguity during bed allocation, inspection, and maintenance routing.

### Applies To

- Area Management
- Accommodation Setup

---

## BR-016 Bed Prefix Uniqueness

### Rule

Bed Prefixes across all Areas within a single Flat must be unique.

No two Areas within the same Flat shall share the same Bed Prefix.

### Reason

Unique Bed Prefixes guarantee unique Bed identifiers (`{flatNumber}-{prefix}{index}`) across the entire Flat.

### Applies To

- Area Management
- Accommodation Setup

---

## BR-017 Minimum Area Bed Inventory

### Rule

Every Area within a Flat must contain at least one allocatable Bed (`bedCount >= 1`).

Creating or saving an Area with zero beds shall be prohibited.

### Reason

Areas define physical room spaces; empty areas without beds violate physical capacity modeling.

### Applies To

- Area Management
- Accommodation Setup

---

## BR-018 Occupied Bed Truncation Guard

### Rule

An Area's configured Bed capacity shall not be reduced below the highest index of any currently occupied or on-notice Bed in that Area.

### Reason

Truncating bed inventory that contains active occupants destroys resident stay assignments and historical occupancy tracking.

### Applies To

- Flat Management
- Area Management

---

## BR-019 Operational Bed Status Transitions

### Rule

Operational status transitions for Beds (`VACANT` ↔ `BLOCKED` ↔ `MAINTENANCE`) are managed exclusively within the Accommodation Domain.

Supported operational transitions:
- `VACANT` → `BLOCKED` / `MAINTENANCE`
- `BLOCKED` → `VACANT` / `MAINTENANCE`
- `MAINTENANCE` → `VACANT` / `BLOCKED`

### Reason

Administrative locks and physical repair holds represent operational availability states owned by the Accommodation Domain.

### Applies To

- Bed Management
- Operational Setup

---

## BR-020 Occupancy Protection Guard

### Rule

Beds with status `OCCUPIED` or `ON_NOTICE` shall not be manually transitioned to `BLOCKED`, `MAINTENANCE`, or `VACANT` through Bed Management operations.

Status changes for occupied beds must originate exclusively from Stay lifecycle operations (Bed Allocation, Bed Release, Accommodation Amendment, Operational Checkout).

### Reason

Bypass of Stay lifecycle operations severs active resident assignments, corrupts ledger billing, and destroys audit history. Notice submission does not mutate bed status.

### Applies To

- Bed Management
- Stay Management

---

## BR-021 Maintenance Hold Lifecycle

### Rule

Placing a Bed into `MAINTENANCE` requires the bed to be currently `VACANT` or `BLOCKED`.

Completing maintenance releases the bed back to `VACANT` status.

### Reason

Beds under maintenance must be excluded from vacant capacity planning until repairs are confirmed complete.

### Applies To

- Bed Management
- Maintenance Operations

---

## BR-022 Administrative Block Lifecycle

### Rule

Placing a Bed into `BLOCKED` requires the bed to be currently `VACANT` or `MAINTENANCE`.

Unblocking a bed releases the bed back to `VACANT` status.

### Reason

Administrative blocks protect physical assets (owner holds, structural locks) while preventing invalid resident allocation.

### Applies To

- Bed Management
- Asset Administration

---

## BR-023 Domain Ownership Boundary for Bed Status

### Rule

Bed status ownership is split cleanly across domain boundaries:
- **Accommodation Domain owns:** `VACANT`, `BLOCKED`, `MAINTENANCE`
- **Stay Management Domain owns:** `OCCUPIED`, `ON_NOTICE`
- **Reservation Domain owns:** `RESERVED`

No domain shall directly mutate a status owned by another domain.

### Reason

Strict domain ownership preserves bounded contexts and prevents cross-domain state corruption.

### Applies To

- Accommodation
- Stay Management
- Reservation

---

## BR-024 Multi-Bed Occupancy within Flat

### Rule

A single Active Stay shall belong to exactly one Flat, but may occupy one or more Beds within that Flat simultaneously.

All Beds allocated to a single Stay must belong to the same Flat.

### Reason

Reflects actual hostel operations where a resident or family unit reserves multiple beds within the same physical flat under a single Stay (BCR-002).

### Applies To

- Admission
- Bed Allocation
- Stay Management
- Accommodation Operations

---

## BR-025 Bed Release Operational Event

### Rule

Releasing a Bed from an Active Stay shall remove occupancy from that Bed without terminating the Stay, provided at least one Bed remains allocated to the Stay.

The final allocated Bed cannot be released independently through Bed Release; the last Bed is released exclusively through Operational Checkout.

### Reason

Bed Release is an operational resource adjustment for partial accommodation changes. Terminating the entire Stay requires Operational Checkout (BCR-003).

### Applies To

- Bed Release
- Accommodation Operations
- Stay Management

---

## BR-026 Accommodation Amendments

### Rule

Operational changes to bed occupancy within a Flat during an Active Stay (adding a bed, releasing a bed, or transferring beds within the Flat) shall be recorded as immutable Accommodation Amendments.

Accommodation Amendments modify physical bed occupancy without creating a new Stay or terminating the existing Stay.

### Reason

Preserves a complete, auditable operational timeline of bed occupancy changes over time (BCR-004).

### Applies To

- Accommodation Operations
- Stay Management
- Audit

---

# Accommodation Summary

The Accommodation domain establishes the physical framework within which Residents occupy Beds during a Stay.

Accommodation owns physical structure and operational availability.

Occupancy remains the responsibility of the Stay.

Historical accommodation information shall remain permanently available to preserve complete operational history.

---

# Resident

The Resident domain governs the identity, lifecycle and permanent profile of every individual managed by RPGMS.

A Resident represents a person and exists independently of accommodation, occupancy or financial activity.

A Resident may have multiple historical Stays throughout their relationship with the organisation.

---

## BR-101 Resident Identity

### Rule

Every Resident shall have exactly one unique Resident ID.

A Resident shall represent a single individual throughout their lifetime within RPGMS.

Resident identity shall remain permanent.

### Reason

The Resident is the authoritative representation of a person and must remain uniquely identifiable across all business activities.

### Applies To

- Resident Registration
- Admission
- Readmission
- Search

---

## BR-102 Resident Independence

### Rule

A Resident shall exist independently of any Stay.

Creating, modifying or closing a Stay shall not create, modify or delete the Resident.

### Reason

Resident identity is independent of occupancy.

### Applies To

- Admission
- Checkout
- Stay Management

---

## BR-103 Resident Profile

### Rule

Every Resident shall maintain a single permanent profile.

The Resident Profile shall contain personal information relating to the individual.

Profile updates shall affect only current Resident information and shall not alter historical Stay records.

### Reason

Personal information may evolve over time while historical Business Events remain unchanged.

### Applies To

- Resident Management
- Profile Updates

---

## BR-104 Resident Status

### Rule

Every Resident shall have exactly one operational status.

Supported statuses are:

- Active
- Checked Out
- Alumni
- Inactive

Additional statuses may be introduced through future architectural revisions.

### Reason

Resident status reflects the current operational relationship between the Resident and the organisation. Notice is a Stay-level event and does not alter Resident identity status.

### Applies To

- Resident Management
- Reporting
- Search

---

## BR-105 Active Stay Limitation

### Rule

A Resident shall have at most one Active Stay within the MVP.

Historical Stays shall not affect eligibility for future admissions.

Future architectural revisions may permit multiple concurrent Active Stays where supported by business policy.

### Reason

The MVP supports one continuous occupancy per Resident while preserving future scalability.

### Applies To

- Admission
- Readmission
- Stay Management

---

## BR-106 Readmission

### Rule

A former Resident may be admitted again.

Readmission shall create a new Stay.

Existing Resident identity shall be retained.

Historical Stays shall remain unchanged.

### Reason

Each uninterrupted occupancy represents an independent Stay while preserving the Resident's long-term history.

### Applies To

- Admission
- Resident Management

---

## BR-107 Historical Preservation

### Rule

Historical Resident information shall never be deleted in a manner that compromises business history.

Where business policy permits retirement of a Resident, the record shall be archived rather than permanently removed.

### Reason

Historical Resident information forms part of the permanent operational history of the organisation.

### Applies To

- Resident Administration
- Audit
- Reporting

---

## BR-108 Resident Relationships

### Rule

A Resident may establish relationships with multiple business objects throughout their lifecycle.

These may include:

- Stays
- Reservations
- Commercial Agreements
- Financial Transactions
- Complaints
- Documents
- Notifications

The Resident shall remain the authoritative owner of personal identity across these relationships.

### Reason

The Resident serves as the central business entity linking multiple operational and financial activities.

### Applies To

- Business Operations
- Reporting
- Search

---

## BR-109 Resident Searchability

### Rule

Every Resident shall remain searchable according to business policy regardless of operational status.

Historical Residents shall remain discoverable for operational, financial and audit purposes.

Search visibility shall be governed by user permissions.

### Reason

Historical information remains valuable even after operational activity has concluded.

### Applies To

- Search
- Reporting
- Audit

---

## BR-110 Resident History

### Rule

The complete lifecycle of a Resident shall remain permanently available.

Historical records shall accurately represent the Resident's relationship with the organisation across all Stays.

Historical information shall be immutable.

### Reason

The Resident represents a permanent business entity whose history forms part of the organisation's long-term records.

### Applies To

- Audit
- Reporting
- Resident Management

---

# Resident Summary

The Resident domain represents the permanent identity of an individual.

A Resident is independent of accommodation, occupancy and financial activity.

While operational activities may begin and end over time, the Resident remains the authoritative business identity linking all historical relationships.

Resident information shall preserve historical integrity while supporting future operational activity.

---

# Stay

The Stay domain governs the complete operational lifecycle of a Resident's occupancy.

A Stay represents one uninterrupted period of occupancy beginning with Admission and concluding only after Operational Checkout.

Every operational, commercial and financial activity associated with an occupancy belongs to a Stay.

A Stay forms part of the permanent historical record of the Resident.

---

## BR-201 Stay Creation

### Rule

Every occupancy shall be represented by exactly one Stay.

A Stay shall be created before a Resident occupies a Bed.

Every Stay shall have a unique Stay ID.

### Reason

The Stay is the authoritative operational record of occupancy.

### Applies To

- Admission
- Readmission

---

## BR-202 Stay Ownership

### Rule

Every Stay shall belong to exactly one Resident.

A Resident may own multiple historical Stays.

No Stay shall belong to more than one Resident.

### Reason

Each Stay represents one uninterrupted occupancy by one Resident.

### Applies To

- Admission
- Stay Management

---

## BR-203 Active Stay

### Rule

A Stay shall have exactly one operational status.

Supported statuses are:

- Reserved
- Active
- On Notice
- Checked Out
- Closed

Only one Active Stay may exist for a Resident within the MVP.

### Reason

Stay status represents the operational state of occupancy.

### Applies To

- Stay Management
- Reporting

---

## BR-204 Bed Allocation

### Rule

Every Active Stay belongs to exactly one Flat and shall have one or more allocated Beds within that Flat.

Every allocated Bed shall belong exclusively to that Active Stay.

Bed allocations shall be recorded as part of the permanent Stay history.

### Reason

Accommodation forms part of the operational history of a Stay, bounded by Flat (BCR-002).

### Applies To

- Admission
- Bed Allocation
- Bed Transfer
- Accommodation Operations

---

## BR-205 Operational Resources

### Rule

Operational resources allocated during occupancy shall belong to the Stay.

Operational resources may include:

- Bed Allocation
- Door ID
- Parking Allocation
- Locker Allocation
- Other operational assets defined by business policy

### Reason

Operational resources are temporary allocations associated with occupancy rather than permanent Resident attributes.

### Applies To

- Stay Management
- Checkout

---

## BR-206 Commercial Terms

### Rule

Every Stay shall operate under one active Commercial Agreement.

Commercial terms (rent, deposit, lock-in period, concessions) belong to the Commercial Agreement rather than the Stay directly.

Historical Commercial Agreements shall remain immutable.

### Reason

Commercial obligations belong to the Commercial Agreement associated with the Stay (BCR-005, BCR-007).

### Applies To

- Admission
- Commercial Management
- Billing

---

## BR-207 Stay Amendments

### Rule

Operational changes (recorded as Accommodation Amendments) and commercial changes (recorded as Commercial Amendments) may occur during an Active Stay without ending the Stay.

Historical business records shall not be modified.

### Reason

Business conditions may change during occupancy while preserving historical accuracy and Stay continuity (BCR-004, BCR-005).

### Applies To

- Stay Management
- Accommodation Operations
- Billing

---

## BR-208 Operational Timeline

### Rule

Every significant operational event affecting a Stay shall become part of the permanent Stay history.

Examples include:

- Admission
- Bed Allocation
- Bed Release
- Accommodation Amendment
- Commercial Amendment
- Door ID Assignment
- Notice Submission
- Checkout

### Reason

The Stay provides the complete operational timeline of occupancy.

### Applies To

- Audit
- Reporting
- Stay Management

---

## BR-209 Checkout

### Rule

Operational Checkout is the sole operational Business Event that concludes an Active Stay.

Checkout shall:

- Release all allocated Beds.
- Release assigned operational resources and Door IDs.
- Preserve the complete Stay history.

Operational Checkout shall not perform Financial Settlement.

### Reason

Operational departure and financial completion are independent business processes. Checkout is the sole terminal operational event (BCR-003, BCR-006).

### Applies To

- Checkout
- Stay Management

---

## BR-210 Financial Independence

### Rule

Closing operational occupancy shall not imply completion of financial obligations.

Outstanding Charges, Payments, Deposits and Settlements shall continue independently until financial closure.

### Reason

Operational completion and financial completion occur independently.

### Applies To

- Checkout
- Billing
- Settlement

---

## BR-211 Stay Closure

### Rule

A Stay shall be considered fully Closed only after:

- Operational Checkout has been completed.
- Financial Settlement has been completed.
- Outstanding business obligations have been resolved according to business policy.

### Reason

A Stay concludes only when both operational and financial responsibilities have been completed.

### Applies To

- Settlement
- Reporting

---

## BR-212 Stay History

### Rule

Historical Stay records shall be immutable.

Historical information shall never be modified in a manner that changes historical truth.

Corrections shall be represented through new Business Events.

### Reason

The Stay forms part of the permanent operational history of the organisation.

### Applies To

- Audit
- Reporting
- Stay Management

---

## BR-213 Readmission

### Rule

Readmission shall create a new Stay.

The new Stay shall establish its own:

- Operational Timeline
- Commercial Agreement
- Bed Allocation
- Door ID Assignment
- Billing Cycle

Historical Stays shall remain unchanged.

### Reason

Each uninterrupted occupancy represents an independent business relationship.

### Applies To

- Admission
- Readmission

---

## BR-214 Stay Relationships

### Rule

A Stay may establish relationships with multiple business objects during its lifecycle.

These may include:

- Bed Allocations
- Commercial Agreements
- Charges
- Payments
- Deposit Accounts
- Complaints
- Documents
- Notifications
- Audit Events

The Stay shall remain the authoritative owner of these operational relationships.

### Reason

The Stay serves as the central operational entity connecting occupancy-related business activities.

### Applies To

- Business Operations
- Reporting

---

## BR-215 Notice as Intent

### Rule

Notice of Intent to Vacate shall record the Resident's declared intention to end a Stay at a future date.

Submission of Notice shall not release allocated Beds, stop recurring billing, or terminate the Stay.

### Reason

Notice communicates intent, not execution. The Stay remains active until Operational Checkout is completed (BCR-006).

### Applies To

- Stay Management
- Notice Processing

---

## BR-216 Notice Revision and Withdrawal

### Rule

A submitted Notice may be revised to a new departure date or withdrawn entirely prior to Operational Checkout.

Notice Withdrawal may have commercial implications governed by the active Commercial Agreement and organizational business policies.

### Reason

Preserves operational flexibility for residents changing departure plans while acknowledging that commercial commitments or notice period policies may apply under the active Commercial Agreement (BCR-006, BAP-001, BAP-005).

### Applies To

- Stay Management
- Notice Processing
- Commercial Management

---

### BR-217 — Admission Creates the Active Stay

An ACTIVE Stay shall be created exclusively through a successful Admission business operation.

A Stay shall not become ACTIVE through direct creation, Reservation processing, Accommodation allocation, or any other business workflow.

This rule establishes Admission as the controlled business operation responsible for initiating operational occupancy.

**Rationale**

Maintains a single authoritative business workflow for transitioning a Prospect into an operational Resident while preserving business consistency and auditability.

---

### BR-218 — Atomic Admission

Admission shall execute as a single atomic business operation.

Where Admission coordinates multiple business domains, either:

- all participating business entities are successfully created or updated, or
- no business state shall be changed.

Partial Admissions are prohibited.

**Rationale**

Maintains business consistency by preventing orphan Residents, incomplete Stays, inconsistent Accommodation allocations, or partially created Commercial Agreements.

---

# Stay Summary

The Stay represents the complete operational relationship between a Resident and the organisation during one uninterrupted period of occupancy.

It owns operational resources, commercial obligations and occupancy history while remaining permanently linked to the Resident.

Historical Stay information shall remain immutable and continue to serve as the authoritative operational record of occupancy.

---

# Reservation

The Reservation domain governs the process of reserving future accommodation for a prospective Resident.

A Reservation represents the organisation's current Expected Truth regarding a future business relationship.

A Reservation is not a Stay and does not establish operational Business Truth, accommodation allocation or financial relationships.

---

# Reservation Rules

## BR-300 Reservation Represents Expected Truth

A Reservation shall always represent Expected Truth.

Reservation records the organisation's current expectation of a future business relationship and shall not establish operational Business Truth.

---

## BR-301 Reservation Ownership

Reservation shall be the sole owner of Expected Truth.

Expected Truth shall remain under Reservation ownership until an authorised Business Transaction establishes Business Truth.

---

## BR-302 Reservation Creates No Operational Relationships

A Reservation shall not create:

- Resident
- Stay
- Accommodation Allocation
- Financial Relationship

These operational relationships shall only be established through an authorised Business Transaction.

---

## BR-303 Reservation Lifecycle

A Reservation shall exist in one of the following lifecycle states:

- Active
- Converted
- Cancelled

Reservations shall not expire automatically.

---

## BR-304 Reservation Does Not Allocate Resources

A Reservation shall not allocate operational resources.

Accommodation preferences may be recorded for planning purposes but shall not constitute operational allocation.

---

## BR-305 Reservation Conversion

A Reservation may only transition to Converted through the successful completion of an authorised Business Transaction.

Preparation activities shall not change Reservation ownership or establish Business Truth.

---

## BR-306 Reservation Cancellation

A cancelled Reservation shall preserve complete business history.

Cancellation shall not remove historical Reservation records.

A cancellation requires a mandatory cancellation reason.

When cancelling an Active Reservation with an advance Reservation Token (`tokenAmount > 0`), the operator must explicitly choose a Token Disposition:
- `REFUND`: Full original token amount is designated for refund.
- `FORFEIT`: Full original token amount is designated for forfeiture.

MVP does not support partial or editable refund amounts (deferred to V2).

The Reservation domain owns and preserves the structured Token Disposition and dedicated cancellation timestamp (`cancelledAt`). Monetary posting remains the responsibility of Finance.


---

## BR-307 Reservation Business Events

Every significant Reservation activity shall generate immutable Business Events.

Business Events shall preserve the complete historical lifecycle of the Reservation.

---

# Admission

# Admission Rules

Admission is an atomic Business Transaction.

Its purpose is to establish Business Truth, create operational business relationships and transfer Business Ownership to the appropriate Business Objects.

Admission itself owns no continuing operational state.

---

## BR-350 Admission is a Business Transaction

Admission shall always be modelled as a Business Transaction.

Admission shall not be modelled as a long-lived Business Object.

---

## BR-351 Business Truth

Admission shall establish Business Truth.

Business Truth shall not be established through preparation activities, operator workflow or configuration changes.

---

## BR-352 Atomic Execution

Admission shall execute atomically.

The transaction shall either:

- complete successfully in its entirety, or
- produce no Business Truth.

Partial completion shall not be considered a valid business state.

---

## BR-353 Business Ownership

Upon successful completion of Admission, Business Ownership shall transfer to the appropriate Business Objects.

Admission shall retain no permanent ownership.

---

## BR-354 Operational Business Relationships

Admission shall establish the operational business relationships required for Residency.

These include:

- Resident
- Stay
- Accommodation
- Finance

---

## BR-355 Preparation

Preparation activities shall not establish Business Truth.

Preparation may collect, validate and organise information required for Admission but shall not create operational business relationships.

---

## BR-356 Business Confirmation

Business Truth shall only be established following explicit operator confirmation.

Preparation alone shall not constitute organisational commitment.

---

## BR-357 Door ID

Door ID assignment is not mandatory for successful Admission.

Door ID may be assigned after Admission in accordance with operational requirements.

---

## BR-358 Business Events

Successful Admission shall generate immutable Business Events representing the establishment of Business Truth and operational business relationships.

---

## BR-359 Historical Preservation

Admission history shall be permanently preserved through Business Events.

Admission records shall never be physically deleted.


---

# Reservation & Admission Summary

Reservation and Admission govern the transition from intended occupancy to actual occupancy.

Reservation represents the organisation's Expected Truth regarding a future business relationship.

Admission is an atomic Business Transaction that establishes Business Truth and transfers Business Ownership to the appropriate Business Objects.

The Stay remains the authoritative owner of Operational Truth throughout the resident's occupancy.

---

# Financial Architecture

The Financial Architecture domain governs all commercial and financial activities associated with a Stay.

Financial information represents the complete monetary relationship between the organisation and the Resident.

Operational occupancy and financial obligations are independent business concepts.

---

# Commercial Agreement

The Commercial Agreement defines the financial terms governing a Stay.

---

## BR-400 Commercial Agreement

### Rule

Every Stay shall operate under exactly one active Commercial Agreement.

The Commercial Agreement shall define the financial terms governing the Stay, including Monthly Rent, Security Deposit, Billing Anniversary, Lock-in Period, Notice Period, Commercial Concessions, and Refund Policies.

### Reason

Commercial obligations belong to the Commercial Agreement associated with the Stay rather than the Resident or Bed (BCR-005, BCR-007).

### Applies To

- Admission
- Commercial Management
- Billing

---

## BR-401 Commercial Agreement History

### Rule

Commercial Agreements shall remain immutable after they become effective.

Changes to commercial terms shall create a new Commercial Amendment rather than modifying historical agreements.

### Reason

Historical commercial obligations must remain auditable and traceable.

### Applies To

- Commercial Management
- Audit

---

## BR-402 Commercial Amendments

### Rule

Commercial terms may be amended during an Active Stay through recorded Commercial Amendments where permitted by business policy.

Historical agreement versions shall remain unchanged.

### Reason

Commercial conditions may change without compromising historical integrity (BCR-005).

### Applies To

- Commercial Management
- Billing

---

## BR-403 Lock-in Period Ownership

### Rule

The Lock-in Period shall belong to the active Commercial Agreement as a financial commitment.

Lock-in terms shall be evaluated by the Commercial domain during departure, early checkout, or settlement calculations.

### Reason

Lock-in represents a negotiated financial commitment rather than an operational attribute of residence (BCR-007).

### Applies To

- Commercial Management
- Billing
- Settlement

---

## BR-404 Commercial Amendment Event

### Rule

Revisions to financial terms (Commercial Amendments modify the commercial terms of an active Commercial Agreement) during an Active Stay shall be recorded as immutable Commercial Amendments.

Commercial Amendments modify commercial terms without creating a new Stay or altering physical accommodation directly.

### Reason

Separates commercial financial terms from operational accommodation state while preserving auditability (BCR-005, BAP-005).

### Applies To

- Commercial Management
- Billing
- Audit

---

## BR-405 Operator Approval for Recommendations (Decision Support)

### Rule

Wherever RPGMS generates recommendations with operational or commercial consequences (such as rent recalculations, deposit refunds, payment allocations, or fee adjustments), final approval shall rest with an authorised operator.

System calculations, warnings, and recommendations shall assist the operator but shall not automatically alter operational state or financial terms without an explicit, approved operator decision.

### Reason

Enforces BAP-001 (Decision Support) and BAP-006 (Separation of Operational and Commercial Concerns).

### Applies To

- Commercial Management
- Accommodation Operations
- Billing
- Finance

---

# Charges

Charges represent amounts owed by the Resident.

---

## BR-410 Charge Ownership

### Rule

Every Charge shall belong to exactly one Stay.

### Reason

Financial obligations arise from occupancy.

### Applies To

- Billing
- Finance

---

## BR-411 Charge Types

### Rule

Charges shall be classified according to their business purpose.

Charge types may include:

- Rent
- Electricity
- Laundry
- Security Deposit
- Maintenance
- Penalties
- Other approved charges

### Reason

Classification supports reporting and financial analysis.

### Applies To

- Billing
- Reporting

---

## BR-412 Charge History

### Rule

Historical Charges shall be immutable.

Corrections shall be performed through adjustment transactions rather than modifying historical Charges.

### Reason

Financial history must remain accurate and auditable.

### Applies To

- Finance
- Audit

---

## BR-413 Billing Engine Orchestration Boundary

### Rule

The Billing Engine shall orchestrate the discovery, claim locking, batching, and execution of billable obligations without creating, calculating, allocating, or altering the underlying business obligations.

Underlying pricing, commercial terms, and allocation rules belong to their respective business domains (Stay, Electricity, Operations).

### Reason

Separates execution orchestration from business pricing rules and financial truth (BCR-005, BCR-007).

### Applies To

- Billing
- Finance
- Commercial Management
- Electricity

---

## BR-414 Domain-Posted Invoice Independence

### Rule

Financial invoices generated and posted directly by owning business domains (such as Electricity supplier bill allocations confirmed under BR-E-45) shall remain independent Finance Bill entities and shall not be mutated, duplicated, or subsumed into subsequent Billing Runs.

Billing Run batch consolidation shall apply exclusively to unbilled obligations claimed and billed simultaneously within that specific Billing Run.

### Reason

Preserves the immutability of domain-confirmed financial transactions and prevents duplicate billing (BR-412, BR-442, BR-E-46).

### Applies To

- Billing
- Electricity
- Finance

---

## BR-415 Historical Stay Financial Attribution

### Rule

Financial obligations shall be attributed to the authoritative historical Stay regardless of current operational status, permitting valid utility, damage, and adjustment charges against Checked-out, Closed, or Alumni-associated Stays.

Billing discovery shall query historical Stay occupancy overlap and shall not enforce a generic active-status filter across utility or adjustment charge types.

### Reason

Residency obligations survive operational departure until financial settlement is complete (BR-460, BR-E-42, BR-E-43).

### Applies To

- Billing
- Electricity
- Finance
- Stay

---

## BR-416 Financial Obligation Uniqueness Boundary

### Rule

The Finance domain shall enforce the authoritative financial uniqueness boundary for all financial charge realizations (Bills), whether initiated via automated Billing Runs, domain-posted events, Admission workflows, or authorized manual desk operations.

Every financial charge realization shall correlate with a stable source-domain obligation identity (`obligationKey`). Finance shall prevent duplicate bill creation and duplicate ledger postings for the same underlying obligation identity according to applicable source-domain invariants.

Orchestration claims (Billing Claims) and double-entry accounting records (Ledger Entries) do not own business obligation uniqueness; Finance owns financial deduplication prior to ledger posting (ADR-032).

### Reason

Establishes and implements (FI-01, EI-02, FC-01) the architectural invariant that manual and automated financial realization paths—including initial rent billed upon Admission—converge on the same Finance uniqueness boundary, eliminating asymmetric financial realization and ensuring that the same underlying commercial obligation cannot create duplicate financial bills or duplicate ledger postings (BCR-005, BCR-007, BR-412, BR-414, ADR-032).

### Applies To

- Finance
- Billing
- Stay / Commercial Management
- Electricity
- Laundry
- Operations

---

## BR-417 Net Collections Cash Flow Calculation

### Rule

Property-wide and aggregate collection metrics (`totalCollected`) derived from the Unified Stay Ledger shall represent net liquid funds received and retained across Cash and Bank asset accounts ($\sum \text{Debit}_{\text{Cash/Bank}} - \sum \text{Credit}_{\text{Cash/Bank}}$), explicitly deducting disbursements, deposit refunds, return payouts, and payment reversals.

### Reason

Prevents overstatement of collected property revenue when deposit refund payouts, checkout returns, or payment reversals take place, maintaining double-entry financial integrity (FC-01, DEF-FIN-003).

### Applies To

- Finance
- Ledger
- Reporting / Workspace Metrics

---

## BR-418 Advance Credit Auto-Consumption Invariant

### Rule

When a new financial obligation (Bill) is realized or when Advance Credit exists for a Stay, the available Advance Credit liability (`AccountType.ADVANCE_CREDIT`) shall be automatically allocated to open unpaid bills in chronological order of due date (`dueDate` ascending, tiebreaker: `createdAt` ascending). The application shall post balanced double-entry ledger transactions (Debit `ADVANCE_CREDIT`, Credit `ACCOUNTS_RECEIVABLE` with reference `ADV-APP:${billId}`) and immediately update the Bill's financial settlement state (`paidAmount`, `balanceAmount`, `status`).

### Reason

Prevents stranded advance funds and ensures that realized operational dues are settled automatically against prepaid credits without manual staff intervention or ledger desynchronization (FC-03A, DEF-FIN-002, ADR-034).

### Applies To

- Finance
- Billing
- Payment Processing
- General Ledger

---

## BR-419 Payment Idempotency & Duplicate Prevention Invariant

### Rule

Every payment intake request submitted to the Finance domain shall enforce deterministic idempotency and duplicate prevention:

1. **Idempotency Key (`idempotencyKey`)**: If a payment submission supplies an `idempotencyKey` that matches an existing payment recorded for the same Stay with identical financial attributes (`amount`, `paymentMethod`, and `referenceNumber`), the system shall perform an **Exact Idempotent Replay**, returning the existing payment record without creating duplicate ledger entries, double-crediting cash/advance, or re-allocating open bills.
2. **Idempotency Conflict**: If the `idempotencyKey` matches an existing payment but financial attributes conflict (e.g. different amount), the operation shall be rejected as an idempotency conflict.
3. **External Reference Duplicate & Conflict (`referenceNumber`)**: If a payment method uses an external transaction identifier (`referenceNumber`), duplicate submissions matching the same `(stayId, paymentMethod, referenceNumber)` and amount shall be safely replayed, while conflicting amounts shall be rejected.
4. **Current-Process Execution Serialization**: Payment recording shall execute under a per-stay concurrency lock ensuring all phases (idempotency evaluation, balance derivation, bill allocation, double-entry ledger posting, and entity persistence) occur as a protected critical section.

### Reason

Prevents duplicate cash/bank debit postings, duplicate bill allocations, and phantom advance liabilities arising from network timeouts, client retries, or rapid double-submissions (FC-03B, DEF-FIN-004, ADR-035).

### Applies To

- Finance
- Payment Processing
- General Ledger
- Workspace Coordination

---

# Payments

Payments represent money received from the Resident.

---

## BR-420 Payment Ownership

### Rule

Every Payment shall belong to exactly one Stay.

### Reason

Payments settle obligations arising from occupancy.

### Applies To

- Finance

---

## BR-421 Payment Recording

### Rule

Every Payment shall be permanently recorded.

Payments shall never be physically deleted.

### Reason

Financial receipts form part of the permanent accounting history.

### Applies To

- Finance
- Audit

---

## BR-422 Payment Corrections

### Rule

Incorrect Payments shall be corrected through adjustment or reversal transactions.

Historical Payment records shall remain unchanged.

### Reason

Financial integrity depends upon preserving original transactions.

### Applies To

- Finance
- Audit

---

## BR-423 Payment Intake UI Allocation Preview and Intent Lifecycle

### Rule

The payment intake user interface (`ReceivePaymentModal`) operates as a presentation, validation, and payment intent initiation boundary consuming authoritative Finance services:

1. **No Artificial Payment Ceilings**: The user interface shall accept any positive payment amount ($> 0$), regardless of whether the resident's outstanding receivable balance is greater than, equal to, or zero. Any payment exceeding open dues shall be processed by Finance as an Advance Credit liability (`AccountType.ADVANCE_CREDIT`).
2. **Estimated Allocation Preview**: Real-time allocation displays rendered prior to submission are presentation-only estimates (subject to final authoritative realization and double-entry ledger posting by `PaymentApplicationService`).
3. **Payment Intent & Idempotency Key Lifecycle**: Each payment entry session generates a unique client-side `idempotencyKey` representing the specific payment intent. Ordinary pre-submission field editing (amount, payment method, reference number, remarks) does not regenerate the key; the key remains stable for the entire session. The identical key shall be retained across retries of the same intent, while a new payment session or reopening the modal establishes a new intent with a fresh `idempotencyKey`.

### Reason

Aligns user interaction with FC-03A/B Advance Credit and idempotency contracts without duplicating financial realization logic in the presentation layer (FC-03C, ADR-036).

### Applies To

- Finance
- UI Components / Modals
- Payment Processing
- Workspace Coordination

---

# Payment Allocation

Payment Allocation governs how Payments settle Charges.

---

## BR-430 Payment Allocation

### Rule

Payments and Charges shall maintain an explicit allocation relationship.

A Payment may settle one or more Charges.

A Charge may be settled by one or more Payments.

### Reason

Financial settlement requires accurate allocation of receipts to obligations.

### Applies To

- Billing
- Finance

---

## BR-431 Outstanding Balance

### Rule

Outstanding balances shall be derived from Charges and their allocated Payments.

Outstanding balances shall not be maintained independently.

### Reason

Derived balances eliminate inconsistencies.

### Applies To

- Billing
- Reporting

---

# Unified Stay Ledger

The Unified Stay Ledger is the authoritative financial history of a Stay.

---

## BR-440 Ledger Authority

### Rule

The Unified Stay Ledger shall be the single source of truth for all financial events associated with a Stay.

### Reason

A single financial history prevents conflicting records.

### Applies To

- Finance
- Audit
- Reporting

---

## BR-441 Ledger Entries

### Rule

Every financial event shall generate a corresponding Ledger entry.

Financial events include:

- Charges
- Payments
- Adjustments
- Refunds
- Deposits
- Settlement

### Reason

The Ledger provides the complete chronological financial history.

### Applies To

- Finance

---

## BR-442 Ledger Immutability

### Rule

Ledger entries shall be immutable.

Corrections shall be represented through new Ledger entries.

### Reason

Financial history must remain permanently auditable.

### Applies To

- Audit
- Finance

---

# Security Deposit

Security Deposit represents a separate financial account.

---

## BR-450 Deposit Account

### Rule

Security Deposit shall be maintained independently from recurring Charges.

### Reason

Deposits represent refundable financial obligations rather than operating revenue.

### Applies To

- Finance
- Billing

---

## BR-451 Deposit Transactions

### Rule

Security Deposit may include:

- Deposit Receipts
- Deposit Adjustments
- Deposit Refunds
- Deposit Forfeitures

Every transaction shall become part of the permanent financial history.

### Reason

Deposit activity requires independent accounting.

### Applies To

- Finance

---

## BR-452 Security Deposit Adjustments and Refunds

### Rule

Security Deposit adjustments and refunds shall be evaluated based on outstanding financial obligations, damage recoveries, or stage refunds.

RPGMS shall calculate and recommend deposit adjustment or refund amounts based on policy, but final approval and posting of deposit transactions rests with an authorised operator.

### Reason

Security Deposits represent financial liabilities requiring explicit operator decisions and transparent accounting (BCR-005, BAP-001).

### Applies To

- Finance
- Security Deposit Management
- Settlement

---

# Financial Settlement

Financial Settlement concludes the monetary obligations of a Stay.

---

## BR-460 Settlement

### Rule

Financial Settlement shall occur independently of Operational Checkout.

Settlement shall resolve all outstanding financial obligations according to business policy.

### Reason

Operational completion does not imply financial completion.

### Applies To

- Settlement

---

## BR-461 Financial Completion

### Rule

A Stay shall be financially complete only after:

- Outstanding Charges have been resolved.
- Payment allocations have been completed.
- Deposit settlement has been completed.
- Required adjustments have been recorded.

### Reason

Financial completion represents the conclusion of the monetary relationship.

### Applies To

- Settlement
- Reporting

---

## BR-462 Settlement ↔ Bill Obligation Synchronization

### Rule

When a Financial Settlement is confirmed for a Stay:

1. Accounts receivable resolved by Settlement shall be applied across open, non-cancelled Bills (`UNPAID` or `PARTIALLY_PAID`) for the Stay in chronological `dueDate` order using canonical FIFO obligation allocation (`calculatePaymentAllocations`).
2. For obligations fully resolved by the settlement amount, `paidAmount` is updated by the allocated amount, `balanceAmount` becomes 0, and `status` transitions to `PAID`.
3. Already-paid Bills, cancelled Bills, and future/unrelated obligations exceeding the resolved settlement amount shall remain untouched in historical state.
4. Upon settlement confirmation, the post-settlement parity invariant must strictly hold:
   $$\text{Ledger AR Balance} = 0 \land \sum_{\text{resolved Bills}} \text{balanceAmount} = 0$$
5. When security deposit liability is cleared in settlement, a corresponding `DepositTransaction` with `transactionType = SETTLEMENT_CLEARANCE` shall be persisted in the deposit ledger.

### Reason

Guarantees exact parity between the double-entry Ledger accounts receivable and domain Bill obligation entities without creating a competing accounting engine (ADR-037, DEF-FIN-007).

### Applies To

- Settlement
- Billing
- Finance

---

## BR-463 Live T2 Settlement Revalidation, Idempotency & Rollback Safety

### Rule

Settlement confirmation shall never rely exclusively on a client-provided pre-calculated snapshot:

1. At confirmation time ($T_2$), the Settlement Application Service shall re-derive live balances from the Unified Stay Ledger.
2. If live balances (receivables, advance credits, deposit held, net settlement amount, outcome) diverge from the submitted preview snapshot ($T_1$), the confirmation shall be rejected with a stale-preview error requiring client refresh.
3. Settlement confirmation shall support session-scoped `idempotencyKey` semantics:
   - Identical key + identical request: Return existing finalized `Settlement` record without duplicate ledger entries.
   - Identical key + conflicting financial parameters: Reject with idempotency conflict error.
4. Settlement confirmation shall serialize concurrent executions per stay using in-memory concurrency locks (`activeStayLocks`).
5. Multi-step execution across Ledger, Deposit, Bill, Settlement, and Resident repositories shall be guarded by a pre-operation snapshot and compensating rollback boundary. If any post-Ledger persistence step fails, state is rolled back cleanly to pre-operation snapshot, preventing partial or duplicate realizations on retry.

### Reason

Prevents race conditions, double-crediting of accounts receivable, negative liabilities, and duplicate financial realizations during checkout settlement (ADR-037, DEF-FIN-008, DEF-FIN-009).

### Applies To

- Settlement
- Finance


---

# Financial Architecture Summary

The Financial Architecture governs the complete monetary relationship between a Stay and the organisation.

Commercial Agreements define financial obligations.

Charges establish amounts owed.

Payments record money received.

Payment Allocation links receipts to obligations.

The Unified Stay Ledger preserves the complete financial history.

Security Deposits are maintained independently.

Financial Settlement concludes the financial lifecycle of the Stay.

Historical financial information shall remain immutable and permanently auditable.

---

# Laundry

The Laundry domain governs the complete operational lifecycle of resident laundry services, from collection through processing, return, physical delivery, exception handling, and operational chargeability determination.

---

## BR-L-001 Laundry Domain Ownership

### Rule

The Laundry domain shall own the operational lifecycle of resident laundry services, including item and service masters, charge master rates, rate snapshots, garment lines, physical collections, pre-processing inspections, condition observations, processing routing, returns verification, physical deliveries, exception management, service fulfillment tracking, and operational chargeability determination.

The Laundry domain shall not own resident identity, stay occupancy, physical accommodation, financial Charges, Payments, Payment Allocations, Adjustments, or the resident financial ledger.

### Reason

Enforces strict domain ownership separation between operational service execution and authoritative financial accounting (AP-003, BAP-006, LAUNDRY_SPECIFICATION §3).

### Applies To

- Laundry Management
- Stay Management
- Finance

---

## BR-L-002 Laundry Transaction and Stay Association

### Rule

Every Laundry Transaction shall belong to exactly one Stay.

A resident may have multiple sequential or concurrent Laundry Transactions during an active Stay.

### Reason

Laundry services are operational services provided within the context of an active resident Stay (LAUNDRY_SPECIFICATION §4.1, §10.2).

### Applies To

- Laundry Management
- Stay Management

---

## BR-L-003 Physical Quantity Counting

### Rule

Physical laundry shall be counted by actual garments (pieces). Each physical piece shall be counted exactly once regardless of the number of requested services applied to it.

Multiple requested services on the same piece of laundry shall not increase the physical garment count.

### Reason

Prevents distortion of physical inventory and ensures reconciliation integrity (LAUNDRY_SPECIFICATION §6.1, §7.8, §11.2).

### Applies To

- Laundry Collection
- Laundry Inspection
- Laundry Processing

---

## BR-L-004 Collection Confirmation Baseline

### Rule

Collection Confirmation shall establish an immutable historical baseline for collected physical quantities, garment lines, requested services, applicable rate snapshots, and collection evidence.

After Collection Confirmation, original collection facts shall not be silently overwritten or modified without a controlled amendment record.

### Reason

Preserves historical truth and provides an auditable baseline for subsequent reconciliation (BP-001, LAUNDRY_SPECIFICATION §13, §16).

### Applies To

- Laundry Collection
- Audit

---

## BR-L-005 Rate Snapshot Capture

### Rule

Applicable Laundry Charge Master rates shall be captured as immutable Rate Snapshots at the time of Collection Confirmation.

Subsequent modifications or deactivations of rates in the Laundry Charge Master shall not alter the Rate Snapshots of existing or historical Laundry Transactions.

Laundry rates shall never be hard-coded in application logic.

### Reason

Protects historical commercial terms from future master data price revisions (LAUNDRY_SPECIFICATION §7.5, §8.4, §8.5, §13.2).

### Applies To

- Laundry Master Data
- Laundry Collection
- Billing

---

## BR-L-006 Processing Route Independence

### Rule

The Processing Route (IN_HOUSE or EXTERNAL_VENDOR) shall be an operational decision selected by the operator and shall not alter the resident's commercial laundry rates or Rate Snapshots.

Once laundry has been released for processing, the selected Processing Route shall become immutable for that processing cycle and shall not be silently modified.

### Reason

Separates operational processing mechanisms from commercial resident pricing (BAP-006, LAUNDRY_SPECIFICATION §6.3, §18.3, §24).

### Applies To

- Laundry Operations
- Vendor Management

---

## BR-L-007 Verified Physical Return

### Rule

Returned laundry quantities shall be recorded strictly based on physical pieces actually received and verified by RPGMS staff.

The system shall never assume that an external vendor or in-house facility returned the full collected quantity.

Cumulative physically returned quantities cannot exceed the collected physical piece count for any garment line; any attempt to return excess pieces shall be rejected atomically prior to reconciliation.

### Reason

Guarantees that missing items are accurately identified, over-return states are rejected, and unreturned items are prevented from premature delivery or billing (LAUNDRY_SPECIFICATION §20.3, §33.1, §33.3).

### Applies To

- Laundry Operations
- Exception Management

---

## BR-L-008 Physical Delivery and Handover Methods

### Rule

Laundry Delivery shall record the physical handover of returned laundry via DIRECT_HANDOVER (to resident) or ROOM_PLACEMENT (under prior resident instruction).

Deliverable quantity shall never exceed the physically verified returned and available quantity.

Physical Delivery and Resident Verification shall remain independent business facts; delivery via ROOM_PLACEMENT shall be valid without requiring immediate resident verification.

### Reason

Reflects physical operations while maintaining strict deliverable quantity bounds (LAUNDRY_SPECIFICATION §34, §35, §36).

### Applies To

- Laundry Delivery
- Accommodation Management

---

## BR-L-009 Physical Reconciliation Invariant

### Rule

Every Laundry Transaction shall maintain the physical quantity reconciliation invariant:

$$\text{Outstanding} = \text{Collected} - \text{Delivered} - \text{Resolved}$$

A Laundry Transaction shall achieve physical completion only when $\text{Outstanding} = 0$.

Resolved quantity shall represent physical pieces conclusively accounted for through Exception Resolution where physical delivery will no longer occur (such as permanently lost laundry).

### Reason

Ensures 100% accounting of all collected items without conflating physical delivery with exception resolution (LAUNDRY_SPECIFICATION §41, §45, §100.6).

### Applies To

- Laundry Operations
- Exception Management
- Audit

---

## BR-L-010 Operational Chargeability Determination

### Rule

A requested Laundry Service shall become operationally chargeable only when both conditions are satisfied:

1. The service has been fulfilled for the affected quantity; and
2. The affected physical quantity has been delivered.

Chargeability shall be evaluated deterministically for each requested ServiceAllocation using the reconciliation formula:

$$\text{Newly Chargeable Quantity} = \max(0, \min(\text{Fulfilled Quantity}, \text{Delivered Quantity}) - \text{Previously Charged Quantity})$$

Chargeability is an independent reconciliation outcome regardless of whether fulfillment precedes delivery or delivery precedes fulfillment.

### Reason

Prevents charging residents for unfulfilled services or undelivered items and ensures chargeability evaluates correctly under any chronological event ordering (LAUNDRY_SPECIFICATION §69, §70, §71, §74).

### Applies To

- Laundry Operations
- Finance
- Billing

---

## BR-L-011 No Double Charging

### Rule

The same physical quantity shall never be charged more than once for the same Laundry Service.

Corrective rework (e.g. re-cleaning or re-ironing an unsatisfactory item) and replacement items shall not create duplicate or additional resident charges.

### Reason

Preserves commercial integrity and prevents double-billing for service corrections (LAUNDRY_SPECIFICATION §77, §95, §96).

### Applies To

- Laundry Operations
- Finance
- Billing

---

## BR-L-012 Cross-Domain Charge Event (LaundryChargeRaised)

### Rule

The Laundry domain shall create an immutable `LaundryChargeRecord` (status: `PENDING_POSTING`) and publish a `LaundryChargeRaised` domain event when an eligible fulfilled Laundry Service quantity and delivered physical quantity become chargeable, carrying the applicable Rate Snapshot and sufficient pricing context for Finance.

The charge tranche receives a deterministic business charge identity:

$$\text{businessChargeId} = \text{transactionId}:\text{garmentLineId}:\text{serviceId}:\text{BRK-XX}$$

The event shall contain the Stay reference, Laundry Transaction ID, Garment Line, Item, Service, chargeable quantity, Rate Snapshot, calculated amount, and delivery reference.

The event shall be uniquely identifiable and Finance shall process it idempotently to prevent duplicate charges upon retries.

### Reason

Maintains clean event-driven integration across domain boundaries without coupling Finance to Laundry pricing internals (BAP-002, LAUNDRY_SPECIFICATION §74, §114, §114.1).

### Applies To

- Laundry Operations
- Finance
- Integration

---

## BR-L-013 Authoritative Financial Charge Creation

### Rule

Finance shall receive the `LaundryChargeRaised` domain event and create the authoritative financial Charge within the Unified Stay Ledger.

The Laundry domain shall not directly create Finance Charges, alter ledger balances, or maintain a parallel financial ledger.

### Reason

Preserves Finance as the single source of financial truth (AP-003, BRP-005, LAUNDRY_SPECIFICATION §4.3, §75).

### Applies To

- Finance
- Unified Stay Ledger

---

## BR-L-014 Billing Engine Pricing Boundary

### Rule

The Billing Engine may discover and batch unbilled laundry obligations via domain discovery adapters, but it shall never calculate Laundry-specific commercial rates or alter Laundry pricing rules.

### Reason

Enforces architectural separation between batch orchestration and domain-owned pricing calculations (BR-413, LAUNDRY_SPECIFICATION §4.4, §90).

### Applies To

- Billing
- Finance
- Laundry Operations

---

## BR-L-015 Exceptions and Historical Integrity

### Rule

Laundry Exceptions shall record operational problems (missing, damaged, disputes, service failures) and follow an independent lifecycle (OPEN → UNDER_INVESTIGATION → RESOLVED).

Exceptions and Exception Resolutions shall not overwrite historical collection, return, or delivery records.

Operational determination of a responsible party shall not automatically create a financial liability.

### Reason

Preserves immutable history while supporting independent problem investigation and resolution (BP-001, LAUNDRY_SPECIFICATION §6.5, §47.2, §53.2, §60).

### Applies To

- Exception Management
- Audit
- Finance

---

## BR-L-016 Collection Cancellation Boundary

### Rule

A confirmed Laundry Transaction may be cancelled only before Processing Release and only when the physical laundry is returned to the resident.

Cancelled transactions shall remain permanently in the historical record with state CANCELLED.

Cancellation shall not automatically alter or refund any prior payment recorded by Finance; financial adjustments shall be handled exclusively by Finance.

### Reason

Maintains an auditable cancellation boundary before external/internal processing commitment (LAUNDRY_SPECIFICATION §15, §101.7).

### Applies To

- Laundry Operations
- Finance
- Audit

---

# Laundry Summary

The Laundry domain governs the operational management of resident laundry services while Finance owns authoritative financial charges.

Laundry Transactions belong to Stays and progress through controlled lifecycles.

Rate Snapshots protect historical pricing.

Physical reconciliation enforces $\text{Outstanding} = \text{Collected} - \text{Delivered} - \text{Resolved} = 0$.

Chargeability requires fulfilled service plus delivered quantity, communicating via `LaundryChargeRaised`.

---

# Roles & Permissions

The Roles & Permissions domain governs the authority under which business operations are performed.

Roles define business responsibilities.

Permissions define the business operations that each role is authorised to perform.

Authentication determines who a user is.

Authorisation determines what a user is permitted to do.

---

## BR-600 Role Assignment

### Rule

Every system user shall be assigned one or more business roles.

Every role assignment shall be governed by business policy.

### Reason

Business authority is determined through assigned roles.

### Applies To

- User Administration
- Security

---

## BR-601 Role Definition

### Rule

Every business role shall define a specific set of business responsibilities.

Roles shall represent organisational functions rather than individual users.

Examples include:

- Owner
- Manager
- Reception
- Accountant

Additional roles may be introduced through future architectural revisions.

### Reason

Roles represent organisational responsibilities that remain independent of personnel changes.

### Applies To

- User Administration
- Business Operations

---

## BR-602 Permission Assignment

### Rule

Permissions shall be assigned to Roles rather than individual users wherever practical.

Users derive their business authority through assigned Roles.

### Reason

Role-based authorisation improves consistency and simplifies administration.

### Applies To

- User Administration
- Security

---

## BR-603 Authorisation

### Rule

Business operations shall only be performed by users authorised to perform those operations.

Unauthorised business operations shall be rejected.

### Reason

Business integrity depends upon controlled authority.

### Applies To

- All Business Operations

---

## BR-604 Approval Authority

### Rule

Business operations requiring approval shall only be completed by authorised approvers.

Approval authority shall be defined by business policy.

Examples include:

- Commercial Amendments
- Billing Cycle Changes
- Deposit Refunds
- Financial Adjustments

### Reason

Certain business decisions require elevated authority.

### Applies To

- Finance
- Billing
- Administration

---

## BR-605 Segregation of Duties

### Rule

Business policy may require separation of responsibilities between different roles.

Where segregation of duties is required, no single user shall perform all restricted activities.

### Reason

Segregation of duties reduces operational and financial risk.

### Applies To

- Finance
- Audit
- Administration

---

## BR-606 Role Changes

### Rule

Changes to a user's assigned Roles shall affect only future business operations.

Historical business records shall preserve the identity and authority under which they were originally performed.

### Reason

Business history must accurately reflect the authority that existed at the time of each operation.

### Applies To

- User Administration
- Audit

---

## BR-607 Temporary Authority

### Rule

Temporary business authority may be granted according to business policy.

Temporary authority shall be time-bound and fully auditable.

### Reason

Business continuity may require temporary delegation of responsibility.

### Applies To

- User Administration
- Audit

---

## BR-608 Administrative Override

### Rule

Authorised users may perform administrative overrides where permitted by business policy.

Every override shall:

- Record the responsible user.
- Record the reason for the override.
- Become part of the permanent audit history.

Administrative overrides shall not modify historical business truth.

### Reason

Exceptional business situations require controlled flexibility while preserving accountability.

### Applies To

- Administration
- Audit
- Finance

---

## BR-609 Permission Review

### Rule

User Roles and Permissions shall remain subject to periodic review according to business policy.

### Reason

Business responsibilities change over time and access should remain appropriate.

### Applies To

- User Administration
- Security

---

# Roles & Permissions Summary

Roles define business responsibilities.

Permissions define authorised business operations.

Business authority is assigned through Roles rather than individual users.

Every business operation shall be performed under appropriate authority and remain permanently attributable to the responsible user.

Historical authority shall remain preserved as part of the permanent audit history.

---

# Configuration

The Configuration domain governs the business defaults used by RPGMS.

Configuration defines how the organisation normally operates.

Configuration does not represent historical business data.

Changes to Configuration affect future business operations unless explicitly defined otherwise by business policy.

---

## BR-650 Configuration Ownership

### Rule

Every configuration item shall have a clearly identified business owner.

Each configuration item shall belong to exactly one business domain.

### Reason

Clear ownership ensures consistent governance and prevents conflicting definitions.

### Applies To

- System Administration
- Business Administration

---

## BR-651 Configuration Categories

### Rule

Configuration shall be classified according to its business purpose.

Configuration categories may include:

- Accommodation
- Billing
- Finance
- Compliance
- Notifications
- Security
- Operational Policies

Additional categories may be introduced through future architectural revisions.

### Reason

Configuration should be organised according to the business domains it supports.

### Applies To

- System Configuration

---

## BR-652 Business Defaults

### Rule

Business configuration shall define the default values applied to new business operations.

Default values may be overridden where permitted by business policy.

### Reason

Configuration provides operational consistency while allowing controlled flexibility.

### Applies To

- Admission
- Billing
- Finance

---

## BR-653 Future Effect

### Rule

Configuration changes shall apply only to future business operations unless explicitly defined otherwise by business policy.

Historical business records shall remain unchanged.

### Reason

Configuration establishes future behaviour rather than rewriting historical Business Events.

### Applies To

- All Business Domains

---

## BR-654 Historical Integrity

### Rule

Business records shall preserve the configuration values that were effective at the time they were created.

Subsequent configuration changes shall not alter historical business records.

### Reason

Historical records must accurately reflect the business conditions that existed when the event occurred.

### Applies To

- Audit
- Reporting
- All Business Domains

---

## BR-655 Configuration Validation

### Rule

Configuration values shall comply with business policy before becoming effective.

Invalid configuration values shall not be accepted.

### Reason

Configuration directly influences business operations and must remain valid.

### Applies To

- System Administration

---

## BR-656 Configuration Versioning

### Rule

Configuration changes shall preserve sufficient history to determine when each configuration became effective.

Historical configuration versions shall remain available for audit purposes.

### Reason

Business decisions should be traceable to the configuration that existed at the time.

### Applies To

- Audit
- Reporting

---

## BR-657 Controlled Overrides

### Rule

Authorised users may override configured defaults where permitted by business policy.

Overrides shall become part of the permanent business history.

The original configured default shall remain identifiable.

### Reason

Business operations occasionally require exceptions while preserving accountability.

### Applies To

- Admission
- Billing
- Finance
- Administration

---

## BR-658 Configuration Scope

### Rule

Configuration may be defined at different organisational levels.

Configuration hierarchy may include:

- System
- Property
- Business Domain
- Business Process

More specific configuration shall take precedence over more general configuration unless defined otherwise by business policy.

### Reason

Different organisational units may require different operating policies while maintaining overall consistency.

### Applies To

- System Administration
- Business Administration

---

## BR-659 Configuration Review

### Rule

Configuration shall remain subject to periodic business review.

Obsolete configuration shall be retired according to business policy.

Retired configuration shall remain historically identifiable.

### Reason

Business practices evolve over time and configuration should reflect current organisational policy.

### Applies To

- Business Administration
- Audit

---

# Configuration Summary

Configuration defines how RPGMS normally operates.

Configuration provides business defaults rather than business history.

Changes to Configuration affect future operations while preserving historical business truth.

Configuration supports consistency, controlled flexibility and future business evolution without compromising historical integrity.

---

# Audit & Events

The Audit & Events domain governs the recording of significant business activities throughout RPGMS.

Business Events describe what occurred.

Audit Records describe who performed the operation, when it occurred and under what authority.

Together they provide accountability, traceability and historical integrity across the organisation.

---

## BR-700 Business Event

### Rule

Every significant business operation shall generate a Business Event.

Business Events represent completed business activities.

### Reason

Business Events provide the authoritative history of organisational activity.

### Applies To

- All Business Domains

---

## BR-701 Event Ownership

### Rule

Every Business Event shall belong to exactly one owning business object.

Examples include:

- Resident
- Stay
- Reservation
- Commercial Agreement
- Charge
- Payment
- Complaint

### Reason

Every business activity shall have a clearly identifiable owner.

### Applies To

- All Business Domains

---

## BR-702 Audit Record

### Rule

Every significant Business Event shall generate a corresponding Audit Record.

The Audit Record shall identify:

- Responsible User
- Date and Time
- Business Operation
- Business Object

Additional audit information may be recorded according to business policy.

### Reason

Audit Records provide accountability for business operations.

### Applies To

- Audit
- Administration

---

## BR-703 Audit Immutability

### Rule

Audit Records shall be immutable.

Audit Records shall never be modified or deleted in a manner that changes historical truth.

Corrections shall be represented through new Business Events.

### Reason

Audit history shall remain permanently trustworthy.

### Applies To

- Audit
- Compliance

---

## BR-704 Business Timeline

### Rule

Every major business object shall maintain its own chronological Business Timeline.

Business objects may include:

- Resident
- Stay
- Reservation
- Complaint
- Commercial Agreement

### Reason

Each business object should provide a complete history of significant events throughout its lifecycle.

### Applies To

- Audit
- Reporting

---

## BR-705 Event Classification

### Rule

Business Events shall be classified according to their business purpose.

Examples include:

- Creation (Admission, Reservation)
- Bed Allocation & Bed Release
- Accommodation Amendment
- Commercial Amendment
- Notice Submission
- Approval & Reversal
- Checkout & Closure

Additional classifications may be introduced through future architectural revisions.

### Reason

Classification improves reporting, searching and operational analysis.

### Applies To

- Audit
- Reporting

---

## BR-706 Historical Traceability

### Rule

Business history shall remain fully traceable.

The sequence of Business Events shall accurately represent the order in which business activities occurred.

### Reason

Business decisions should be understandable through their historical sequence.

### Applies To

- Audit
- Reporting

---

## BR-707 Administrative Overrides

### Rule

Administrative Overrides shall generate Business Events and corresponding Audit Records.

The reason for the override shall become part of the permanent audit history.

### Reason

Exceptional authority shall remain fully accountable.

### Applies To

- Administration
- Audit

---

## BR-708 Event Visibility

### Rule

Visibility of Business Events and Audit Records shall be governed by user permissions and business policy.

Restricted audit information shall be available only to authorised users.

### Reason

Audit transparency shall be balanced with information security.

### Applies To

- Audit
- Security

---

## BR-709 Audit Retention

### Rule

Audit Records and Business Events shall be retained according to organisational retention policy.

Where retention periods are defined, disposal shall comply with applicable legal and regulatory requirements.

### Reason

Audit information supports accountability, compliance and historical reference.

### Applies To

- Audit
- Compliance

---

# Audit & Events Summary

Business Events record what occurred.

Audit Records establish who performed the operation, when it occurred and under what authority.

Every significant business operation shall become part of the permanent organisational history.

Audit information shall remain trustworthy, traceable and historically accurate throughout the lifecycle of the business.

---

# Documents

The Documents domain governs the business documents associated with RPGMS.

Documents provide evidence supporting business operations.

Documents belong to business objects and do not exist independently.

---

## BR-750 Document Ownership

### Rule

Every Document shall belong to exactly one primary business object.

Business objects may include:

- Resident
- Stay
- Reservation
- Commercial Agreement
- Complaint

### Reason

Documents provide evidence supporting specific business activities.

### Applies To

- Document Management

---

## BR-751 Document Classification

### Rule

Every Document shall be classified according to its business purpose.

Document classifications may include:

- Identity Documents
- Agreements
- Compliance Documents
- Financial Documents
- Supporting Evidence
- Correspondence

Additional classifications may be introduced through future architectural revisions.

### Reason

Classification supports organisation, retrieval and compliance.

### Applies To

- Document Management

---

## BR-752 Document Integrity

### Rule

Documents accepted as business records shall preserve their historical integrity.

Replacement Documents shall create a new business record rather than altering historical evidence.

### Reason

Business evidence shall remain trustworthy.

### Applies To

- Document Management
- Audit

---

## BR-753 Document Availability

### Rule

Documents shall remain available throughout the lifecycle of their owning business object according to business policy.

Historical Documents shall remain accessible for authorised operational, financial and audit purposes.

### Reason

Business documents support ongoing operations and historical reference.

### Applies To

- Document Management
- Audit

---

## BR-754 Document Retention

### Rule

Documents shall be retained according to organisational retention policy and applicable legal requirements.

Expired retention periods shall be managed in accordance with approved business policy.

### Reason

Retention ensures compliance while supporting efficient document management.

### Applies To

- Document Management
- Compliance

---

# Notifications

The Notifications domain governs communication generated by Business Events.

Notifications communicate information.

Notifications do not themselves modify business data.

---

## BR-800 Notification Trigger

### Rule

Notifications shall be generated only in response to defined Business Events or approved business processes.

### Reason

Business communication shall be driven by meaningful organisational activity.

### Applies To

- Notification Management

---

## BR-801 Notification Ownership

### Rule

Every Notification shall be associated with at least one business object.

Notifications shall remain traceable to the event that generated them.

### Reason

Communication should always have identifiable business context.

### Applies To

- Notification Management

---

## BR-802 Notification Delivery

### Rule

A Notification may be delivered through one or more approved communication channels.

Supported channels shall be governed by business policy.

### Reason

Different recipients may require different communication methods.

### Applies To

- Notification Management

---

## BR-803 Notification Failure

### Rule

Failure to deliver a Notification shall not invalidate the underlying business operation.

Delivery failures shall be handled according to business policy.

### Reason

Communication and business operations are independent concerns.

### Applies To

- Notification Management

---

## BR-804 Notification History

### Rule

Notification history shall remain available for operational and audit purposes according to business policy.

### Reason

Communication history supports accountability and operational transparency.

### Applies To

- Notification Management
- Audit

---

# Search

The Search domain governs discovery of business information throughout RPGMS.

Search provides access to information.

Search does not own business data.

---

## BR-830 Unified Search

### Rule

RPGMS shall provide a unified business search across authorised business domains.

Search shall support discovery of business information using one or more approved search criteria.

### Reason

Users should be able to locate business information efficiently without knowing its physical storage location.

### Applies To

- Search

---

## BR-831 Search Authority

### Rule

Search results shall be limited according to the requesting user's permissions.

Users shall only discover information they are authorised to access.

### Reason

Search shall respect business authority and information security.

### Applies To

- Search
- Security

---

## BR-832 Search Scope

### Rule

Search may include both current and historical business information according to business policy.

Historical information shall remain searchable where authorised.

### Reason

Historical business information continues to provide operational value.

### Applies To

- Search
- Reporting
- Audit

---

## BR-833 Search Accuracy

### Rule

Search results shall originate from the authoritative business source.

Search shall not create conflicting business information.

### Reason

Search provides discovery rather than ownership of business data.

### Applies To

- Search

---

## BR-834 Search Performance

### Rule

Search behaviour shall prioritise accurate business results.

Performance optimisation shall not compromise business correctness.

### Reason

Correct business information is more important than incomplete or misleading results.

### Applies To

- Search

---

# Documents, Notifications & Search Summary

Documents preserve business evidence.

Notifications communicate Business Events.

Search enables discovery of authorised business information.

These domains support every major business object while remaining independent of the operational and financial processes they serve.

Historical integrity, traceability and business ownership shall be preserved across all three domains.

---

# Business Numbering

The Business Numbering domain governs the identification of business objects throughout RPGMS.

Business Identifiers uniquely identify business objects and remain permanent throughout their lifecycle.

Business Identifiers support operational communication, reporting and audit.

---

## BR-850 Business Identifier

### Rule

Every primary business object shall have a unique Business Identifier.

Business objects requiring Business Identifiers include:

- Resident
- Stay
- Reservation
- Commercial Agreement
- Charge
- Payment
- Complaint

Additional business objects may receive Business Identifiers through future architectural revisions.

### Reason

Business Identifiers provide stable references throughout the organisation.

### Applies To

- All Business Domains

---

## BR-851 Identifier Permanence

### Rule

Business Identifiers shall remain permanent.

Once assigned, a Business Identifier shall never be changed, reassigned or reused.

### Reason

Permanent identifiers preserve historical integrity and ensure stable references.

### Applies To

- All Business Domains

---

## BR-852 Independent Number Series

### Rule

Each business domain shall maintain its own independent Business Identifier series.

Examples include:

- Resident
- Stay
- Reservation
- Commercial Agreement
- Charge
- Payment

### Reason

Independent numbering improves clarity, scalability and administration.

### Applies To

- System Administration
- Business Administration

---

## BR-853 Business Meaning

### Rule

Business Identifiers shall uniquely identify business objects.

Business Identifiers shall not be relied upon to communicate business information beyond identity.

### Reason

Business meaning should originate from the business object itself rather than its identifier.

### Applies To

- All Business Domains

---

## BR-854 Historical Reference

### Rule

Historical business records shall continue to reference their original Business Identifiers throughout their lifecycle.

Business Identifiers shall remain valid even after the associated business object becomes inactive or archived.

### Reason

Historical references must remain stable and understandable.

### Applies To

- Audit
- Reporting

---

# Business Exceptions

The Business Exceptions domain governs situations where normal business rules cannot be completed successfully.

Business Exceptions represent exceptional business conditions requiring attention.

Business Exceptions are part of normal business operation and shall be managed rather than ignored.

---

## BR-875 Exception Identification

### Rule

Business Exceptions shall be identified whenever a business operation cannot proceed according to established Business Rules.

### Reason

Early identification supports timely resolution and operational continuity.

### Applies To

- All Business Domains

---

## BR-876 Exception Classification

### Rule

Every Business Exception shall be classified according to its business purpose.

Exception classifications may include:

- Validation
- Business Rule
- Business Policy
- Operational
- Financial
- Compliance

Additional classifications may be introduced through future architectural revisions.

### Reason

Classification supports prioritisation and resolution.

### Applies To

- Exception Management

---

## BR-877 Exception Ownership

### Rule

Every Business Exception shall belong to exactly one owning business object.

The owning business object shall remain responsible for resolution.

### Reason

Every exception requires clear ownership and accountability.

### Applies To

- Exception Management

---

## BR-878 Exception Resolution

### Rule

Business Exceptions shall be resolved according to approved business policy.

Resolution shall preserve historical business integrity.

### Reason

Exceptions should be resolved without compromising business truth.

### Applies To

- All Business Domains

---

## BR-879 Exception History

### Rule

Business Exceptions shall remain part of the permanent business history.

Resolved Exceptions shall remain available for operational review, reporting and audit.

### Reason

Historical exceptions provide valuable operational insight and support accountability.

### Applies To

- Audit
- Reporting

---

## BR-880 Administrative Resolution

### Rule

Authorised users may resolve Business Exceptions where permitted by business policy.

Administrative resolution shall generate appropriate Business Events and Audit Records.

### Reason

Exceptional authority must remain accountable and traceable.

### Applies To

- Administration
- Audit

---

# Business Numbering & Business Exceptions Summary

Business Numbering provides permanent and unique identification for every major business object.

Business Exceptions provide a structured approach for managing situations that fall outside normal business operations.

Both domains strengthen consistency, traceability and governance across RPGMS while preserving historical integrity.

---

# General Rules

The General Rules domain defines the fundamental principles that apply across every business domain within RPGMS.

Unless explicitly stated otherwise, these rules apply to all business objects, business processes and business operations.

---

## BR-900 Historical Integrity

### Rule

Historical business records shall preserve historical truth.

Historical records shall not be modified in a manner that changes the facts that existed at the time they were created.

Corrections shall be represented through new Business Events rather than alteration of historical records.

### Reason

Historical information provides the permanent record of organisational activity.

### Applies To

- All Business Domains

---

## BR-901 Business Record Retention

### Rule

Business records shall be retained according to organisational policy and applicable legal or regulatory requirements.

Where retention periods expire, disposal shall follow approved business procedures.

### Reason

Business information must remain available for operational, financial and regulatory purposes.

### Applies To

- All Business Domains

---

## BR-902 Logical Deletion

### Rule

Business objects forming part of organisational history shall not be permanently deleted during normal business operations.

Where removal is permitted by business policy, the business object shall be retired, archived or otherwise made inactive while preserving historical references.

### Reason

Historical relationships depend upon continued availability of business records.

### Applies To

- All Business Domains

---

## BR-903 Single Source of Truth

### Rule

Every business fact shall have exactly one authoritative owner.

Business information shall not be maintained as multiple independent authoritative copies.

Derived information shall always originate from its designated authoritative source.

### Reason

A single source of truth prevents inconsistency and conflicting business information.

### Applies To

- All Business Domains

---

## BR-904 Business Ownership

### Rule

Every business object shall have one clearly defined owning business domain.

Ownership determines responsibility for lifecycle management, business rules and historical integrity.

### Reason

Clear ownership prevents ambiguity and supports consistent governance.

### Applies To

- All Business Domains

---

## BR-905 Lifecycle Consistency

### Rule

Every business object shall progress through a clearly defined lifecycle.

Lifecycle transitions shall comply with the Business Rules governing that business object.

### Reason

Consistent lifecycle management supports predictable business behaviour.

### Applies To

- All Business Domains

---

## BR-906 Business Relationships

### Rule

Relationships between business objects shall preserve referential and historical integrity throughout their lifecycle.

Changes to one business object shall not invalidate the historical relationships of another.

### Reason

Business history depends upon stable relationships between business objects.

### Applies To

- All Business Domains

---

## BR-907 Business Rule Compliance

### Rule

Every business operation shall comply with the Business Rules defined in this document.

Business policy may determine how a rule is applied but shall not contradict the rule itself.

### Reason

Business Rules establish the mandatory behaviour required for organisational consistency.

### Applies To

- All Business Domains

---

## BR-908 Future Compatibility

### Rule

Future business enhancements shall extend the business architecture without compromising historical integrity or existing Business Rules.

Where architectural change is required, it shall occur through approved architectural revision.

### Reason

The business architecture is intended to evolve while preserving long-term stability.

### Applies To

- All Business Domains

---

## BR-909 Documentation Authority

### Rule

The Business Rules document shall remain the authoritative specification of mandatory business behaviour within RPGMS.

Where uncertainty exists regarding business enforcement, this document shall take precedence unless superseded by an approved architectural revision.

### Reason

A single authoritative specification promotes consistency across implementation, testing and future development.

### Applies To

- All Business Domains

---

# Change Management

Business Rules shall evolve through controlled architectural change.

Existing rule identifiers shall remain permanent.

Business Rules may be:

- Added
- Extended
- Retired

Existing rule identifiers shall never be renumbered or reused.

Changes affecting business behaviour shall be reflected in both:

BUSINESS_CONSTITUTION.md
BUSINESS_RULES.md

where applicable.

---

# Document Status

**Status:** Approved Business Architecture

This document forms the authoritative specification of the mandatory business rules governing RPGMS.

All software implementation, testing, documentation and future enhancements shall conform to these rules unless an approved architectural revision explicitly changes the business architecture.

---

# Conclusion

The Business Rules document defines the mandatory principles that govern every operational and financial activity within RPGMS.

Together with the Business Constitution, it establishes a complete business architecture consisting of:

- Business Concepts
- Business Relationships
- Business Lifecycles
- Business Rules
- Business Governance

These documents are intentionally independent of software implementation.

They define the business architecture that every implementation of RPGMS must faithfully preserve.

As RPGMS evolves, new capabilities shall extend this architecture while maintaining historical integrity, business consistency and long-term maintainability.

---

