# Accommodation Specification

**Version:** 1.0  
**Status:** Frozen Draft  
**Last Updated:** July 2026

---

# 1. Purpose

The Accommodation Specification defines the business structure used to represent the physical accommodation managed within RPGMS.

It establishes the hierarchy, ownership, business rules, validation principles, and lifecycle of accommodation entities independently of Residents, Stays, Finance, and Compliance.

This specification serves as the authoritative business reference for all Accommodation functionality implemented within RPGMS.

---

# 2. Scope

This specification defines:

- Accommodation philosophy
- Physical accommodation hierarchy
- Flat management
- Area management
- Bed management
- Bed naming conventions
- Bed status lifecycle
- Capacity calculation principles
- Accommodation validation rules
- Future extensibility

This specification intentionally excludes:

- Resident allocation
- Reservations
- Check-in
- Check-out
- Bed transfers
- Financial information
- Billing
- Ledger
- Police compliance
- Operational workflows

These subjects are defined by their respective business specifications.

---

# 3. Guiding Principles

The Accommodation module has been designed according to the following architectural principles.

## Accommodation Represents Physical Inventory

Accommodation represents only the physical spaces owned or managed by the organization.

Accommodation does not represent Residents, occupancy history, or financial information.

---

## Physical Space is Independent

Physical accommodation exists independently of whether it is occupied.

A Flat, Area, or Bed continues to exist even when vacant.

Accommodation is therefore reusable throughout the lifetime of the system.

---

## Stable Physical Identity

Every Flat, Area, and Bed has a stable identity.

Physical identifiers should not change simply because Residents change.

Stable identifiers improve operational consistency, reporting, and historical traceability.

---

## Bed is the Smallest Allocatable Unit

A Bed is the smallest unit that can be allocated to a Resident.

Residents are never allocated directly to:

- Flats
- Rooms
- Areas

Every Stay is associated with exactly one Bed at any given time.

---

## Capacity is Derived

Accommodation capacity is calculated from the number of Beds.

Capacity shall never be entered manually.

This ensures consistency throughout the system.

---

## Separation of Concerns

Accommodation owns only physical inventory.

It does not own:

- Resident information
- Stay information
- Financial information
- Compliance information

Each business domain remains responsible for maintaining its own data.

---

## Business Before Technology

Business requirements define the Accommodation model.

User interface design, database implementation, and software architecture shall follow the business model rather than determine it.

# 4. Accommodation Philosophy

Accommodation represents the physical inventory managed by the organization.

It defines the spaces available for occupancy but does not record who occupies those spaces, when they are occupied, or how they are billed.

Accommodation is designed to be a stable business domain that changes only when the physical property changes.

Residents, Stays, Finance, and Compliance interact with Accommodation but do not own it.

---

## Business Philosophy

Accommodation answers the question:

> **What physical space is available for allocation?**

It does not answer:

- Who is occupying the space?
- When was the space occupied?
- How much rent is charged?
- What payments have been received?
- What compliance activities have been completed?

These questions belong to their respective business domains.

---

## Accommodation Hierarchy

Accommodation follows a fixed hierarchical structure.

```
Property
    ↓
Flat
    ↓
Area
    ↓
Bed
```

Each level has a clearly defined responsibility.

- A **Property** represents the entire premises managed by the organization.
- A **Flat** represents an individual accommodation unit within the Property.
- An **Area** represents a logical subdivision of a Flat.
- A **Bed** represents the smallest physical unit that can be allocated to a Resident.

Each level owns only its own information and does not duplicate information owned by another level.

---

## Relationship with Stay

Accommodation itself never records occupancy.

Occupancy begins only when a Resident is admitted through a Stay.

A Stay references a Bed, but the Bed does not own the Stay.

This separation allows the same Bed to be reused by multiple Residents over time without changing the Accommodation structure.

---

## Relationship with Resident

Residents are never part of the Accommodation model.

Accommodation exists regardless of whether any Residents are present.

Likewise, a Resident may exist within RPGMS without currently occupying any accommodation.

---

## Relationship with Finance

Accommodation contains no financial information.

The following information does not belong to Accommodation:

- Rent
- Security Deposit
- Billing Cycle
- Charges
- Payments
- Outstanding Dues

Financial information belongs exclusively to the Finance domain.

---

## Relationship with Compliance

Accommodation does not maintain statutory or legal compliance records.

Examples include:

- Police Intimation
- Verification Status
- Government Submission Records

These belong to the Compliance domain.

---

## Reusability

Accommodation is intended to be reused throughout the lifetime of the organization.

Residents may come and go.

Stays begin and end.

Financial transactions are created and settled.

Compliance activities are completed.

Throughout all of these operational changes, the Accommodation structure remains stable unless the physical property itself changes.

# 5. Accommodation Hierarchy

## Purpose

The Accommodation Hierarchy defines how physical accommodation is organized within RPGMS.

It establishes the ownership, responsibility, and relationship between each level of the physical accommodation structure.

The hierarchy provides a consistent and scalable model capable of supporting properties of varying sizes while maintaining a simple and predictable structure.

---

## Hierarchy Structure

Accommodation is organized using the following hierarchy.

```
Property
    ↓
Flat
    ↓
Area
    ↓
Bed
```

Each level owns only its own information and is responsible for a specific aspect of the physical accommodation.

---

## Property

A Property represents the complete premises managed by the organization.

A Property contains one or more Flats.

Examples include:

- A Paying Guest (PG) Property
- A Hostel Building
- A Residential Building
- A Student Accommodation Facility

The Property serves as the top-level physical container for all accommodation.

Future versions of RPGMS may support multiple Properties managed within a single installation.

---

## Flat

A Flat represents an individual accommodation unit within a Property.

A Flat contains one or more Areas.

A Flat is identified by a unique Flat Number.

Examples:

- G01
- 101
- 102
- 201
- 301

A Flat does not directly contain Residents.

Residents occupy Beds through a Stay.

---

## Area

An Area represents a logical subdivision of a Flat.

Areas improve the organization of Beds and reflect the physical layout of the Flat.

Common examples include:

- Bedroom
- Hall
- Small Bedroom
- Study
- Loft

An Area contains one or more Beds.

The number and type of Areas are determined entirely by the physical layout of the Flat.

RPGMS does not impose any fixed limit on the number of Areas within a Flat.

---

## Bed

A Bed represents the smallest physical accommodation unit managed by RPGMS.

Every Bed belongs to exactly one Area.

Every Area belongs to exactly one Flat.

A Bed is the only unit that can be allocated to a Resident.

No allocation is ever made directly to a Flat or an Area.

---

## Ownership

Each level owns only its own information.

| Level | Owns |
|--------|------|
| Property | Property information |
| Flat | Flat information |
| Area | Area information |
| Bed | Bed information and physical availability |

Higher levels do not duplicate information owned by lower levels.

Likewise, lower levels do not duplicate information owned by higher levels.

---

## Business Rules

The Accommodation Hierarchy follows these business rules:

- A Property contains one or more Flats.
- A Flat belongs to exactly one Property.
- A Flat contains one or more Areas.
- An Area belongs to exactly one Flat.
- An Area contains one or more Beds.
- A Bed belongs to exactly one Area.
- A Bed is the smallest allocatable accommodation unit.
- Capacity is derived from the total number of Beds.
- Empty Areas are not permitted.
- Empty Flats are permitted only during creation and configuration.

---

## Design Principles

The Accommodation Hierarchy has been intentionally designed to satisfy the following principles:

- Simple to understand.
- Independent of occupancy.
- Independent of financial information.
- Independent of Resident information.
- Easily expandable.
- Stable throughout the lifetime of the property.
- Suitable for both small and large accommodation facilities.

These principles ensure that future business requirements can be accommodated without changing the fundamental structure of the Accommodation model.

# 6. Flat

## Purpose

A Flat represents an individual accommodation unit within a Property.

A Flat is the primary operational unit managed by RPGMS and serves as the physical container for one or more Areas.

A Flat exists independently of Residents, Stays, and financial information.

---

## Business Rules

- Every Flat belongs to exactly one Property.
- Every Flat shall have a unique Flat Number within the Property.
- A Flat shall contain one or more Areas.
- A Flat shall contain one or more Beds through its Areas.
- Flat capacity is automatically derived from the number of Beds.
- A Flat may exist without Residents.
- A Flat may be temporarily unavailable for occupancy without being removed from the system.
- Deleting a Flat shall only be permitted when business rules allow it.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:----------:|:----------:|:--------------:|---------|
| Flat Number | Yes | No* | Yes | Yes | Yes | Yes | No | Primary business identifier |
| Floor | Yes | Yes | No | No | Yes | Yes | No | Physical floor location |
| Description | No | Yes | No | No | Yes | Yes | No | Optional description |
| Capacity | Yes | No | No | Yes | Yes | Yes | Yes | Derived from Beds |
| Status | Yes | Yes | No | Yes | Yes | Yes | Yes | Operational status |

\*Flat Number should normally remain permanent after creation. Changing a Flat Number is considered an exceptional administrative activity.

---

## Flat Status

Each Flat has an operational status indicating whether it is available for accommodation.

Suggested status values are:

- Active
- Inactive
- Under Maintenance

The Flat Status represents the operational availability of the Flat and does not indicate occupancy.

For example:

- An **Active** Flat may be fully occupied, partially occupied, or completely vacant.
- An **Inactive** Flat cannot normally be allocated for new Stays.
- A **Under Maintenance** Flat is temporarily unavailable due to repairs or other operational reasons.

---

## Capacity

Flat Capacity is calculated automatically.

```
Flat Capacity
=
Sum of Beds across all Areas
```

Example:

| Area | Beds |
|------|------:|
| Bedroom | 2 |
| Hall | 3 |
| Small Bedroom | 2 |

Flat Capacity = **7 Beds**

Capacity shall never be entered manually.

---

## Business Notes

### Flat Number

The Flat Number is the primary business identifier used throughout RPGMS.

Examples include:

- G01
- G02
- 101
- 102
- 201
- 301

The organization may adopt any numbering convention, provided each Flat Number remains unique within the Property.

---

### Floor

The Floor identifies the physical location of the Flat.

Examples:

- Ground
- First
- Second
- Third
- Fourth

The Floor assists with navigation, reporting, and operational management.

---

### Description

Description provides optional administrative information about the Flat.

Examples:

- Corner Flat
- Newly Renovated
- Near Entrance
- Reserved for Staff

Description has no operational impact.

---

### Independence

A Flat does not own:

- Residents
- Stays
- Rent
- Deposits
- Payments
- Compliance Records

The Flat owns only physical accommodation information.

---

### Derived Information

The following information is always derived and shall not be manually maintained:

- Capacity
- Occupied Beds
- Vacant Beds
- Reserved Beds
- On Notice Beds
- Blocked Beds

These values are calculated from the Beds belonging to the Flat.

# 7. Area

## Purpose

An Area represents a logical subdivision of a Flat.

Areas organize the physical layout of a Flat into meaningful sections, making accommodation easier to manage, visualize, and maintain.

Areas exist solely to organize Beds and do not directly participate in Resident allocation.

---

## Business Rules

- Every Area belongs to exactly one Flat.
- Every Area shall have a descriptive name.
- Every Area shall contain one or more Beds.
- Every Area shall have a Bed Prefix used for automatic Bed naming.
- An Area may contain any number of Beds.
- Area capacity is derived from the number of Beds.
- Areas exist independently of Residents and Stays.
- An Area cannot exist without a Flat.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:----------:|:----------:|:--------------:|---------|
| Area Name | Yes | Yes | No | No | Yes | Yes | No | User-friendly name |
| Bed Prefix | Yes | Yes* | No | No | Yes | Yes | No | Used for Bed naming |
| Display Order | Yes | Yes | No | No | No | No | Yes | Determines UI ordering |
| Capacity | Yes | No | No | Yes | Yes | Yes | Yes | Derived from Beds |

\*The system automatically suggests a Bed Prefix. Users may modify the suggested value where business rules permit.

---

## Area Capacity

Area Capacity is calculated automatically.

```
Area Capacity
=
Number of Beds belonging to the Area
```

Capacity shall never be entered manually.

---

## Area Naming

Area Names should describe the physical space within the Flat.

Typical examples include:

- Bedroom
- Hall
- Small Bedroom
- Study
- Loft
- Guest Room
- Store Room

The system does not enforce a fixed list of Area Names.

Organizations may define names that accurately reflect the physical layout of their accommodation.

---

## Bed Prefix

Each Area has an associated Bed Prefix.

The Bed Prefix is used when automatically generating Bed Names.

Examples:

| Area Name | Prefix |
|-----------|--------|
| Bedroom | B |
| Hall | H |
| Small Bedroom | SB |
| Study | ST |
| Loft | L |

The automatically suggested prefix may be modified where permitted by organizational policy.

The prefix should remain stable after Beds have been created.

---

## Display Order

Display Order determines how Areas appear within a Flat.

Display Order affects presentation only.

It has no effect on:

- Capacity
- Occupancy
- Bed Allocation
- Reporting
- Financial Operations

---

## Business Notes

### Organizational Purpose

Areas exist to represent the physical layout of a Flat.

They improve usability by grouping related Beds together.

Without Areas, large Flats become difficult to understand and manage.

---

### Independence

Areas do not own:

- Residents
- Stays
- Rent
- Billing
- Compliance

Areas own only physical organization within a Flat.

---

### Flexibility

RPGMS intentionally allows organizations to create any Area structure that matches their property.

Examples:

**5-Bed Flat**

- Bedroom
- Hall

**6-Bed Flat**

- Bedroom
- Hall
- Small Bedroom

**10-Bed Dormitory**

- East Wing
- West Wing

The Accommodation model remains valid regardless of the Area configuration.

---

### Derived Information

The following values are always derived from the Beds belonging to the Area:

- Capacity
- Occupied Beds
- Vacant Beds
- Reserved Beds
- On Notice Beds
- Blocked Beds

These values shall never be manually maintained.

# 8. Bed

## Purpose

A Bed represents the smallest physical accommodation unit within RPGMS.

A Bed is the only accommodation unit that can be allocated to a Resident.

All occupancy, reservations, transfers, notices, and availability are managed at the Bed level.

---

## Business Rules

- Every Bed belongs to exactly one Area.
- Every Bed belongs indirectly to exactly one Flat.
- Every Bed shall have a unique Bed Name within the Property.
- Every Bed has one operational status.
- A Bed may exist without a Resident.
- A Bed may be allocated to only one Active Stay at any given time.
- A Bed shall remain part of the Accommodation inventory throughout its lifetime unless permanently removed according to organizational policy.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:----------:|:----------:|:--------------:|---------|
| Bed Name | Yes | Limited* | Yes | Yes | Yes | Yes | No | Primary business identifier |
| Status | Yes | Yes | No | Yes | Yes | Yes | Yes | Operational status |
| Area | Yes | No | No | Yes | Yes | Yes | Yes | Parent Area |
| Flat | Yes | No | No | Yes | Yes | Yes | Yes | Derived from Area |

\*Bed Name should normally remain permanent after creation. Renaming a Bed is considered an exceptional administrative activity.

---

## Bed Identity

A Bed is identified by its Bed Name.

Examples:

- B1
- B2
- H1
- H2
- H3
- SB1
- SB2

The Bed Name represents the physical location within the Flat and should remain stable throughout the lifetime of the Bed.

Changing the Resident occupying the Bed does not change the Bed Name.

---

## Bed Status

Every Bed has one operational status.

The supported statuses are:

- Vacant
- Occupied
- Reserved
- On Notice
- Blocked
- Maintenance

The meaning and lifecycle of these statuses are defined separately in the **Bed Status Lifecycle** section.

---

## Operational Responsibility

The Bed is responsible only for its physical availability.

It does not own:

- Resident information
- Stay history
- Rent
- Payments
- Security Deposit
- Compliance records

These belong to their respective business domains.

---

## Business Notes

### Smallest Allocatable Unit

The Bed is the smallest unit that may be assigned to a Resident.

Residents are never allocated directly to:

- Properties
- Flats
- Areas

Every allocation is always made to a Bed.

---

### Physical Identity

A Bed represents a fixed physical space.

Examples include:

- Lower Bed
- Upper Bed
- Single Bed
- Bunk Bed Position

Regardless of how many Residents occupy the Bed over time, the Bed itself remains the same physical asset.

---

### Availability

A Bed may be:

- Available for allocation
- Occupied by a Resident
- Reserved for a future Stay
- Temporarily unavailable due to maintenance
- Blocked from operational use

Availability is determined entirely by the Bed Status.

---

### Independence

Beds are independent of operational activities.

Residents may check in, transfer, or check out.

Financial transactions may be created or settled.

Compliance activities may be completed.

Throughout these operational changes, the Bed remains part of the Accommodation inventory unless its physical configuration changes.

---

### Derived Information

The following information is derived from operational business domains and is not owned by the Bed itself:

- Current Resident (`Bed.residentName`)
- Current Stay (`Bed.stayId`)
- Date of Occupancy
- Date of Vacancy
- Financial Balance
- Police Compliance Status

**Authoritative Ownership and Synchronization Architecture:**
- Accommodation owns the physical Bed and its operational availability.
- Stay owns the authoritative occupancy and `BedAllocation` relationship.
- `Bed.residentName` and `Bed.stayId` are derived operational projection and reference values maintained for UI presentation and operational querying.
- `loadAndSynchronizeFlats()` and synchronization mechanisms reconstruct these values from active and on-notice Stay allocations.
- Stale `residentName` and `stayId` values are cleared (and Bed status restored to `VACANT`) when the Bed is no longer associated with an active or on-notice Stay.

The Bed owns only its physical identity and operational availability.

# 9. Bed Naming Rules

## Purpose

Bed Naming Rules establish a consistent, predictable, and stable method of identifying Beds within RPGMS.

A well-defined naming convention improves operational efficiency, communication, reporting, searching, and long-term maintainability.

Bed Names represent physical locations and are intended to remain stable throughout the lifetime of the Bed.

---

## Business Principles

Bed Names shall:

- Be unique within the Property.
- Represent physical locations rather than Residents.
- Be easy for staff to understand.
- Be easy to communicate verbally.
- Be easy to search.
- Remain stable throughout the lifetime of the Bed.

Changing the Resident assigned to a Bed shall never change its Bed Name.

---

## Naming Structure

A Bed Name consists of two components.

```
Bed Prefix
+
Sequential Number
```

Examples:

```
B1
B2

H1
H2
H3

SB1
SB2
```

---

## Bed Prefix

The Bed Prefix identifies the Area to which the Bed belongs.

Examples:

| Area | Prefix |
|------|--------|
| Bedroom | B |
| Hall | H |
| Small Bedroom | SB |
| Study | ST |
| Loft | L |

The system automatically suggests an appropriate prefix when a new Area is created.

Organizations may modify the suggested prefix where business rules permit.

---

## Sequential Number

Within an Area, Beds are numbered sequentially beginning from **1**.

Examples:

Bedroom

- B1
- B2

Hall

- H1
- H2
- H3

Small Bedroom

- SB1
- SB2

Sequential numbering shall not contain gaps unless Beds have been permanently removed.

---

## Automatic Bed Generation

When a user creates an Area and specifies the number of Beds, RPGMS automatically generates the Bed Names.

Example:

Area

```
Bedroom
```

Prefix

```
B
```

Beds

```
2
```

Generated Beds

```
B1
B2
```

Example:

Area

```
Hall
```

Prefix

```
H
```

Beds

```
3
```

Generated Beds

```
H1
H2
H3
```

Automatic generation minimizes manual data entry and ensures naming consistency.

---

## User Customization

The system provides intelligent defaults while allowing controlled customization.

Business rules include:

- Area Name may be changed.
- Suggested Bed Prefix may be changed where permitted.
- Bed Count may be changed before saving.
- Generated Bed Names are recalculated automatically before creation.

Once Beds have been created and become operational, Bed Names should normally remain unchanged.

---

## Uniqueness

Every Bed Name shall be unique within the Property.

Examples:

Valid

```
Flat 101

B1
B2
H1
H2
```

Flat 102

```
B1
B2
H1
H2
```

Since the complete identity of a Bed includes its Flat, duplicate Bed Names across different Flats are acceptable.

The unique business identity is effectively:

```
Flat Number + Bed Name
```

Examples:

- 101 – B1
- 101 – H2
- 102 – B1
- G01 – SB2

---

## Normalization

To maintain consistency, RPGMS should normalize Bed Names during creation.

Recommended normalization includes:

- Remove leading and trailing spaces.
- Convert prefixes to uppercase.
- Remove duplicate spaces.
- Prevent invalid characters.
- Prevent empty prefixes.

Examples:

```
b1
```

becomes

```
B1
```

```
sb2
```

becomes

```
SB2
```

---

## Validation Rules

The system should validate that:

- Prefix is not empty.
- Bed number is greater than zero.
- Generated Bed Names are unique within the Flat.
- Invalid characters are rejected.
- Duplicate Bed Names are not permitted within the same Flat.

---

## Business Notes

### Stable Physical Identity

A Bed Name represents a physical location rather than a Resident.

For example:

```
Flat 101

Bedroom

B1
```

may accommodate many different Residents over several years.

Despite these changes, the Bed remains identified as **B1**.

---

### Operational Simplicity

Short, meaningful Bed Names simplify:

- Resident allocation
- Bed transfers
- Reporting
- Maintenance
- Daily operations

They also reduce the likelihood of data entry errors.

---

### Future Extensibility

The naming convention has been intentionally designed to support future accommodation layouts without modification.

Examples include:

- Triple-sharing rooms
- Dormitories
- Suites
- Studio apartments
- Multi-building campuses

The same Prefix + Sequential Number convention remains applicable regardless of accommodation size.

# 10. Bed Status Lifecycle

## Purpose

The Bed Status Lifecycle defines the operational availability of a Bed throughout its lifetime.

A Bed Status represents the current operational state of the Bed and determines whether it can be allocated for a new Stay.

The Bed Status does not represent the Resident's lifecycle or financial status.

---

## Supported Bed Statuses

RPGMS supports the following Bed statuses.

| Status | Description |
|---------|-------------|
| Vacant | Bed is available for immediate allocation. |
| Reserved | Bed has been reserved for a future Stay but is not yet occupied. |
| Occupied | Bed is currently allocated to an Active Stay. |
| On Notice | The Resident occupying the Bed has submitted notice but continues to occupy the Bed until checkout. |
| Blocked | Bed is intentionally unavailable for operational reasons. |
| Maintenance | Bed is temporarily unavailable due to repair, renovation, cleaning, or maintenance activities. |

---

## Status Definitions

### Vacant

A Vacant Bed is available for immediate allocation.

Business Rules:

- No Active Stay exists.
- No future reservation exists.
- The Bed is operational.
- The Bed may be allocated immediately.

---

### Reserved

A Reserved Bed has been allocated to a future Stay.

Business Rules:

- No Resident has checked in.
- A reservation exists.
- The Bed cannot be allocated to another Resident.
- The Bed automatically becomes Occupied after successful check-in.

---

### Occupied

An Occupied Bed has an Active Stay.

Business Rules:

- Exactly one Active Stay exists.
- The Bed cannot be allocated again.
- Financial and operational activities occur through the Stay.

---

### On Notice

An On Notice Bed is currently occupied by a Resident who has submitted notice to vacate.

Business Rules:

- The Resident continues to occupy the Bed.
- The Bed remains unavailable for allocation.
- Checkout has not yet occurred.
- After successful checkout, the Bed normally becomes Vacant.

---

### Blocked

A Blocked Bed has been intentionally removed from operational use.

Examples include:

- Furniture removed
- Bed permanently unusable
- Administrative restriction
- Safety concerns

Business Rules:

- No allocation permitted.
- No reservation permitted.
- Block remains until removed by an authorized user.

---

### Maintenance

A Maintenance Bed is temporarily unavailable due to operational work.

Examples include:

- Repairs
- Painting
- Deep cleaning
- Renovation
- Pest control

Business Rules:

- No allocation permitted.
- No reservation permitted.
- Bed returns to Vacant after maintenance is completed.

---

## Lifecycle

The normal operational lifecycle is illustrated below.

```
Vacant
    ↓
Reserved
    ↓
Occupied
    ↓
On Notice
    ↓
Vacant
```

Certain transitions may bypass intermediate states.

For example:

```
Vacant
    ↓
Occupied
```

where no reservation process exists.

---

## Independent Operational States

The following statuses are independent operational states.

```
Blocked

Maintenance
```

These statuses temporarily remove a Bed from normal allocation.

When the operational condition is resolved, the Bed normally returns to **Vacant**.

---

## Allowed Status Transitions

| Current Status | Allowed Transition |
|----------------|-------------------|
| Vacant | Reserved, Occupied, Blocked, Maintenance |
| Reserved | Occupied, Vacant |
| Occupied | On Notice |
| On Notice | Vacant |
| Blocked | Vacant |
| Maintenance | Vacant |

Any transition outside these rules should require explicit administrative intervention.

---

## Business Rules

The Bed Status Lifecycle follows these principles:

- A Bed has exactly one Status at any given time.
- Bed Status represents operational availability only.
- Resident information does not determine Bed Status directly.
- Financial information does not determine Bed Status.
- Compliance information does not determine Bed Status.
- Status changes occur through authorized business operations.
- Status transitions should be recorded for auditing purposes.

---

## Business Notes

### Operational Availability

Bed Status exists to answer one simple operational question:

> **Can this Bed be allocated right now?**

It does not answer:

- Who occupies the Bed?
- How much rent is charged?
- Has payment been received?
- Has Police Intimation been completed?

Those questions belong to other business domains.

---

### Separation from Stay

Although a Stay influences Bed Status, the Bed does not own the Stay.

For example:

- Check-in changes a Bed from **Vacant** to **Occupied**.
- Notice changes a Bed from **Occupied** to **On Notice**.
- Checkout changes a Bed from **On Notice** to **Vacant**.

The Stay owns the operational event.

The Bed owns only its resulting operational availability.

---

### Future Extensibility

The lifecycle has been intentionally designed to support future operational requirements such as:

- Temporary Holds
- Housekeeping
- Cleaning in Progress
- Inspection
- Quarantine
- Reserved for VIP
- Reserved for Corporate

These future statuses can be introduced without changing the fundamental lifecycle principles.

# 11. Capacity Rules

## Purpose

Capacity Rules define how accommodation capacity is calculated and interpreted within RPGMS.

Capacity is always derived from the physical accommodation structure and never entered manually.

These rules ensure consistency across occupancy, reporting, dashboards, and operational workflows.

---

## Business Principles

Accommodation Capacity is based entirely on the number of Beds available within the Accommodation hierarchy.

Capacity is independent of:

- Residents
- Stays
- Financial information
- Compliance activities

Only physical changes to the Accommodation structure affect Capacity.

---

## Capacity Hierarchy

Capacity is calculated at multiple levels.

```
Bed Capacity
        ↓
Area Capacity
        ↓
Flat Capacity
        ↓
Property Capacity
```

Each level derives its Capacity from the level immediately below it.

---

## Bed Capacity

Every Bed contributes one unit of Capacity.

```
Bed Capacity = 1
```

A Bed does not have fractional or variable Capacity.

Regardless of Bed type, each Bed represents one allocatable accommodation unit.

---

## Area Capacity

Area Capacity is calculated as the total number of Beds belonging to the Area.

```
Area Capacity
=
Total Beds in the Area
```

Example:

| Area | Beds | Capacity |
|------|-----:|---------:|
| Bedroom | 2 | 2 |
| Hall | 3 | 3 |
| Small Bedroom | 2 | 2 |

---

## Flat Capacity

Flat Capacity is calculated as the sum of the Capacity of all Areas within the Flat.

```
Flat Capacity
=
Sum of Area Capacities
```

Example:

| Area | Capacity |
|------|----------:|
| Bedroom | 2 |
| Hall | 3 |
| Small Bedroom | 2 |

Flat Capacity = **7 Beds**

---

## Property Capacity

Property Capacity is calculated as the sum of the Capacity of all Flats within the Property.

```
Property Capacity
=
Sum of Flat Capacities
```

Example:

| Flat | Capacity |
|------|----------:|
| G01 | 6 |
| 101 | 5 |
| 102 | 7 |
| 103 | 7 |

Property Capacity = **25 Beds**

---

## Operational Capacity

While Physical Capacity remains constant until the accommodation structure changes, Operational Capacity varies according to Bed Status.

Operational Capacity may be summarized as:

- Total Beds
- Occupied Beds
- Vacant Beds
- Reserved Beds
- On Notice Beds
- Blocked Beds
- Maintenance Beds

These values are derived dynamically from the current Bed Statuses.

---

## Occupancy

Occupancy represents the number of Beds currently allocated through Active Stays.

```
Occupied Beds
=
Beds with Status = Occupied
```

Occupancy is an operational metric.

It is not stored manually.

---

## Vacancy

Vacancy represents Beds immediately available for allocation.

```
Vacant Beds
=
Beds with Status = Vacant
```

Beds in the following states are **not** considered Vacant:

- Reserved
- Occupied
- On Notice
- Blocked
- Maintenance

---

## Available Capacity

Available Capacity represents Beds that can be allocated immediately.

For the MVP:

```
Available Capacity
=
Vacant Beds
```

Future versions of RPGMS may introduce additional business rules affecting availability.

---

## Derived Information

The following values are always derived and shall never be manually maintained:

- Area Capacity
- Flat Capacity
- Property Capacity
- Occupied Beds
- Vacant Beds
- Reserved Beds
- On Notice Beds
- Blocked Beds
- Maintenance Beds
- Available Capacity

These values are calculated automatically from the Accommodation hierarchy and Bed Status Lifecycle.

---

## Business Rules

Capacity follows the following principles:

- Capacity is always derived.
- Capacity is never entered manually.
- Every Bed contributes exactly one unit of Capacity.
- Physical changes affect Capacity.
- Resident changes do not affect Capacity.
- Financial transactions do not affect Capacity.
- Compliance activities do not affect Capacity.

---

## Business Notes

### Physical vs Operational Capacity

Accommodation distinguishes between **Physical Capacity** and **Operational Capacity**.

**Physical Capacity** represents the number of Beds physically available within the Property.

**Operational Capacity** represents how those Beds are currently being used.

For example:

A Property with 72 Beds always has a Physical Capacity of **72**.

However, on a particular day its Operational Capacity may be:

- 64 Occupied
- 4 Vacant
- 2 Reserved
- 1 Maintenance
- 1 Blocked

The Physical Capacity remains unchanged.

Only the Operational Capacity changes over time.

---

### Reporting

All occupancy reports, dashboards, and statistics shall derive their values from these Capacity Rules.

No occupancy totals or capacity values shall be maintained independently, ensuring a single source of truth throughout RPGMS.

# 12. Validation Principles

## Purpose

Validation Principles define the business rules that ensure Accommodation information remains accurate, consistent, and operationally reliable throughout its lifecycle.

These principles are independent of the user interface, database implementation, or software architecture.

---

## Business Principles

### Business-Driven Validation

Validation rules shall always be based on business requirements.

Technical implementation shall enforce these business rules rather than define them.

---

### Stable Physical Identity

Accommodation represents physical assets.

Once operational, the identity of physical assets should remain stable.

Examples include:

- Flat Number
- Area
- Bed Name

Renaming these entities should be an exceptional administrative activity.

---

### Uniqueness

Business identifiers shall be unique where required.

The following uniqueness rules apply.

| Entity | Uniqueness Rule |
|---------|-----------------|
| Flat Number | Unique within a Property |
| Area Name | Unique within a Flat (recommended) |
| Bed Name | Unique within a Flat |

These rules prevent ambiguity during allocation and reporting.

---

## Flat Validation

The system shall validate that:

- Flat Number is provided.
- Flat Number is unique.
- Floor is specified.
- At least one Area exists before the Flat is activated.
- Capacity is greater than zero.
- Capacity is derived automatically.

A Flat shall not become operational without at least one Bed.

---

## Area Validation

The system shall validate that:

- Area Name is provided.
- Bed Prefix is provided.
- Area contains at least one Bed.
- Duplicate Area Names within the same Flat should be avoided.
- Display Order is automatically assigned.

Area Capacity shall always equal the number of Beds belonging to that Area.

---

## Bed Validation

The system shall validate that:

- Bed Name is provided.
- Bed Name is unique within the Flat.
- Bed Prefix is valid.
- Sequential numbering begins from 1.
- Invalid characters are rejected.
- Duplicate Bed Names are not permitted.
- Every Bed belongs to exactly one Area.

---

## Capacity Validation

Capacity shall always be derived.

The system shall never permit manual editing of:

- Area Capacity
- Flat Capacity
- Property Capacity

Capacity shall always equal the number of Beds represented by the Accommodation hierarchy.

---

## Status Validation

Every Bed shall have exactly one Status.

Invalid or conflicting statuses shall not be permitted.

Examples of invalid situations include:

- Occupied and Vacant simultaneously.
- Reserved and Maintenance simultaneously.
- Blocked and Occupied simultaneously.

Status transitions shall follow the Bed Status Lifecycle defined in this specification.

---

## Deletion Rules

Accommodation represents physical inventory and therefore requires careful handling.

### Bed

A Bed may be deleted only when:

- It has no Active Stay.
- It has no active Reservation.
- Organizational policy permits deletion.

Historical references should remain intact.

---

### Area

An Area may be deleted only when:

- It contains no Beds.

If Beds exist, they must first be removed or reassigned according to organizational policy.

---

### Flat

A Flat may be deleted only when:

- It contains no Areas.
- It contains no Beds.
- No Active Stay references the Flat.
- Organizational policy permits deletion.

Deletion should be considered an exceptional administrative activity.

---

## Normalization

To maintain consistency, RPGMS should normalize Accommodation information during creation.

Recommended normalization includes:

- Trim leading and trailing spaces.
- Convert Bed Prefixes to uppercase.
- Convert Area Names to Title Case.
- Remove duplicate spaces.
- Reject unsupported characters.
- Standardize Flat Number formatting according to organizational policy.

Normalization improves:

- Searching
- Reporting
- User experience
- Data quality

---

## Business Notes

### Data Integrity

Accommodation information forms the foundation for Resident allocation.

Incorrect Accommodation data may affect:

- Check-in
- Bed Allocation
- Reporting
- Occupancy
- Billing
- Compliance

Strong validation is therefore essential.

---

### Single Source of Truth

Accommodation owns only physical inventory.

Derived information such as:

- Occupied Beds
- Vacant Beds
- Capacity
- Availability

shall always be calculated from the Accommodation structure and Bed Status.

No duplicate operational totals shall be maintained elsewhere within RPGMS.

---

### Future Compatibility

These Validation Principles have been intentionally designed to accommodate future enhancements, including:

- Multiple Properties
- Buildings
- Wings
- Floors
- Rooms
- Smart Allocation Rules
- Automated Maintenance Scheduling

Future enhancements should extend these validation rules rather than replace them.

# 13. Future Extensions

The Accommodation model has been intentionally designed to support future business requirements without requiring fundamental structural changes.

Future enhancements shall extend the existing Accommodation hierarchy while preserving the core architectural principles defined in this specification.

---

## Multiple Properties

The MVP assumes a single Property.

Future versions of RPGMS may support multiple Properties managed within the same installation.

Example:

```
Property A
    ├── Flat 101
    ├── Flat 102

Property B
    ├── Flat A1
    ├── Flat A2
```

Each Property shall maintain its own independent Accommodation hierarchy.

---

## Buildings

Large organizations may manage multiple Buildings within a Property.

Future hierarchy:

```
Property
    ↓
Building
    ↓
Flat
    ↓
Area
    ↓
Bed
```

This enhancement should not require changes to the existing Flat, Area, or Bed concepts.

---

## Wings

Some hostels divide accommodation into Wings.

Examples:

- East Wing
- West Wing
- North Wing
- South Wing

Future hierarchy:

```
Property
    ↓
Building
    ↓
Wing
    ↓
Flat
    ↓
Area
    ↓
Bed
```

Wing is intended purely as an organizational level.

---

## Rooms

The current MVP models Areas within a Flat.

Future versions may introduce a formal Room entity if business requirements demand greater granularity.

Possible hierarchy:

```
Flat
    ↓
Room
    ↓
Bed
```

Introducing Rooms should not affect Resident, Stay, or Finance domains.

---

## Parking Allocation

Future versions may manage physical parking spaces.

Examples:

- Two-Wheeler Parking
- Four-Wheeler Parking
- Bicycle Parking

Parking should become a separate Accommodation resource rather than being attached directly to Beds.

---

## Storage and Lockers

Some organizations provide individual storage spaces.

Examples:

- Locker
- Cupboard
- Storage Cabinet

These may become allocatable resources associated with a Stay.

---

## Housekeeping

Future versions may track housekeeping activities.

Examples:

- Daily Cleaning
- Deep Cleaning
- Linen Replacement
- Sanitization

These operational activities should remain separate from Accommodation ownership.

---

## Maintenance Scheduling

Future maintenance management may include:

- Preventive Maintenance
- Repair Requests
- Inspection Schedule
- Asset Replacement
- Maintenance History

Accommodation should continue to own only the physical inventory.

Maintenance activities should become part of a dedicated Maintenance module.

---

## Smart Bed Allocation

Future allocation engines may automatically recommend Beds based on business rules such as:

- Occupancy balancing
- Floor preference
- Area preference
- Resident preferences
- Maintenance availability
- Reserved inventory

These allocation algorithms should consume Accommodation information without changing its ownership.

---

## Accessibility

Future versions may classify Beds or Flats according to accessibility requirements.

Examples:

- Ground Floor
- Wheelchair Accessible
- Elder-Friendly
- Lift Access

Accessibility attributes should enhance Accommodation without changing the Accommodation hierarchy.

---

## Amenities

Future versions may associate Amenities with Accommodation.

Examples:

- Air Conditioner
- Balcony
- Attached Bathroom
- Wi-Fi
- Refrigerator
- Study Table

Amenities describe physical facilities and should remain independent of Resident allocation.

---

## IoT Integration

Future versions may integrate smart devices.

Examples:

- Smart Door Locks
- Occupancy Sensors
- Electricity Monitoring
- Water Consumption
- Smart Lighting

IoT integrations should augment Accommodation rather than redefine it.

---

## Business Notes

### Backward Compatibility

Future enhancements shall preserve the existing Accommodation hierarchy wherever practical.

Existing Flats, Areas, and Beds should continue to function without migration whenever new features are introduced.

---

### Extensibility

The Accommodation model has been intentionally designed around simple hierarchical principles.

This allows future capabilities to be added through extension rather than redesign, ensuring long-term stability of the business model.

# 14. Related Business Domains

## Purpose

The Accommodation domain does not operate in isolation.

It provides the physical inventory used by other business domains while remaining the sole owner of the accommodation structure.

Each business domain has clearly defined responsibilities to ensure separation of concerns and maintainability.

---

## Resident

The Resident domain represents **who** occupies accommodation.

Accommodation does not own Resident information.

The Resident domain owns:

- Resident Identity
- Personal Information
- Contact Information
- Government Identification
- Resident Documents
- Medical Information

Accommodation simply provides the physical Bed that may be allocated to a Resident.

---

## Stay

The Stay domain represents **when** and **where** a Resident occupies accommodation.

Stay acts as the bridge between Resident and Accommodation.

The Stay domain owns:

- Reservation
- Check-in
- Bed Allocation
- Bed Transfer
- Notice
- Checkout
- Stay History

Accommodation owns only the physical Bed.

Stay owns the occupancy of that Bed.

---

## Finance

The Finance domain manages all monetary transactions associated with a Stay.

Accommodation contains no financial information.

Finance owns:

- Rent
- Security Deposit
- Charges
- Billing
- Payments
- Refunds
- Outstanding Dues
- Ledger

Accommodation provides only the physical inventory used for billing.

---

## Compliance

The Compliance domain manages statutory and organizational obligations associated with a Stay.

Examples include:

- Police Intimation
- Tenant Verification
- Statutory Documentation
- Government Acknowledgements

Accommodation owns none of this information.

Compliance simply references the Stay occupying a Bed.

---

## Reporting

Reports consume Accommodation information but do not own it.

Examples include:

- Occupancy Reports
- Flat Summary
- Bed Availability
- Capacity Reports
- Vacancy Reports

Reports are generated dynamically from Accommodation and related business domains.

---

## Dashboard

The Dashboard summarizes Accommodation information for operational visibility.

Typical Accommodation metrics include:

- Total Flats
- Total Beds
- Occupied Beds
- Vacant Beds
- Reserved Beds
- On Notice Beds
- Maintenance Beds
- Blocked Beds

The Dashboard displays derived information and does not maintain independent data.

---

## Relationship Summary

| Business Domain | Owns | Uses Accommodation |
|-----------------|------|--------------------|
| Resident | Resident identity and profile | Yes |
| Stay | Occupancy lifecycle | Yes |
| Finance | Financial transactions | Yes |
| Compliance | Statutory obligations | Yes |
| Reporting | Business reporting | Yes |
| Dashboard | Operational summaries | Yes |

---

## Business Principles

The relationship between Accommodation and other business domains follows these principles:

- Accommodation owns only physical inventory.
- Other business domains may reference Accommodation.
- Other business domains shall not modify Accommodation ownership.
- Accommodation remains independent of operational activities.
- Changes in one business domain should not require structural changes to Accommodation.

---

## Business Notes

Accommodation serves as a foundational business domain within RPGMS.

Nearly every operational module interacts with Accommodation in some manner.

However, Accommodation remains deliberately focused on one responsibility:

> **Managing the physical accommodation inventory of the organization.**

This clear separation ensures that the Accommodation model remains simple, stable, reusable, and independent of changing operational workflows.

# 15. Out of Scope

## Purpose

This specification intentionally limits the responsibilities of the Accommodation domain.

Clearly defining what does **not** belong to Accommodation prevents duplication of information, simplifies implementation, and preserves the architectural principle of **Single Business Ownership**.

---

## Resident Information

Accommodation does not own Resident information.

Examples include:

- Resident Name
- Contact Information
- Government Identification
- Medical Information
- Emergency Contact
- Parent / Guardian Information
- Resident Documents

These belong exclusively to the **Resident** domain.

---

## Stay Information

Accommodation does not own Stay information.

Examples include:

- Reservation
- Check-in
- Check-out
- Bed Transfers
- Stay Status
- Notice Period
- Stay History

These belong exclusively to the **Stay** domain.

Accommodation only provides the physical Bed referenced by a Stay.

---

## Financial Information

Accommodation contains no financial information.

Examples include:

- Rent
- Security Deposit
- Electricity Charges
- Laundry Charges
- One-Time Charges
- Billing Cycle
- Invoices
- Payments
- Refunds
- Outstanding Dues
- Ledger

These belong exclusively to the **Finance** domain.

---

## Compliance Information

Accommodation does not own statutory or legal compliance information.

Examples include:

- Police Intimation
- Police Acknowledgement
- Tenant Verification
- Visa Documentation
- Government Compliance Records
- Organization Approvals

These belong exclusively to the **Compliance** domain.

---

## Operational History

Accommodation represents the current physical structure only.

It does not maintain operational history.

Examples include:

- Previous Occupants
- Previous Reservations
- Previous Bed Transfers
- Historical Occupancy
- Historical Availability

Historical operational information belongs to the domains responsible for creating those events.

---

## Reporting Data

Accommodation does not store reports or summary information.

Examples include:

- Occupancy Percentage
- Daily Vacancy
- Monthly Occupancy
- Revenue Reports
- Trend Analysis

Reports are generated dynamically from business data.

---

## Derived Statistics

Accommodation does not permanently store calculated values.

Examples include:

- Occupied Beds
- Vacant Beds
- Reserved Beds
- Available Capacity
- Occupancy Percentage

These values are derived whenever required.

---

## User Interface Behaviour

This specification does not define:

- Screen layouts
- Dialog design
- Navigation
- Button placement
- Icons
- Themes
- User experience decisions

These belong to the application design and implementation.

---

## Database Design

This specification intentionally does not define:

- Database tables
- Primary Keys
- Foreign Keys
- SQL schema
- Supabase implementation
- Indexes
- APIs

These belong to the technical implementation.

---

## Business Notes

Accommodation has one responsibility:

> **To represent and manage the physical accommodation inventory of the organization.**

Anything that describes:

- A Person,
- An Event,
- A Financial Transaction,
- A Compliance Activity,
- Or a Historical Record,

belongs to another business domain.

Maintaining these clear boundaries keeps the Accommodation model simple, predictable, and maintainable.

# 16. Change Log

| Version | Date | Description | Author |
|----------|------|-------------|--------|
| 1.0 | July 2026 | Initial Accommodation Specification | RPGMS Architecture |

---

# Document Status

**Status:** Frozen v1.0

This document defines the business specification for the Accommodation domain within RPGMS.

It establishes the ownership, hierarchy, business rules, validation principles, and operational boundaries of Accommodation.

Future revisions shall preserve the architectural principles established by this specification unless superseded by an approved architectural decision.

---

# Summary

The Accommodation domain has been designed around a small number of fundamental business principles.

These principles shall guide all future development.

## Accommodation Represents Physical Inventory

Accommodation represents the physical spaces managed by the organization.

It does not represent:

- Residents
- Financial information
- Operational events
- Compliance activities

---

## Stable Physical Structure

Accommodation changes only when the physical property changes.

Operational activities such as:

- Check-in
- Checkout
- Bed Transfers
- Billing
- Payments

do not alter the Accommodation structure.

---

## Bed is the Smallest Allocatable Unit

Residents are always allocated to a Bed.

Allocation never occurs directly to:

- Property
- Flat
- Area

This principle simplifies occupancy management and maintains consistency across the system.

---

## Capacity is Derived

Capacity is never entered manually.

Every capacity-related value is calculated automatically from the Accommodation hierarchy.

This ensures that all reports and operational dashboards share a single source of truth.

---

## Single Business Ownership

Accommodation owns only physical inventory.

Other business domains reference Accommodation but do not own or duplicate its information.

| Business Domain | Primary Responsibility |
|----------------|------------------------|
| Accommodation | Physical inventory |
| Resident | Resident identity |
| Stay | Occupancy lifecycle |
| Finance | Financial transactions |
| Compliance | Statutory obligations |

---

## Future-Ready Design

The Accommodation model has been intentionally designed to support future enhancements without requiring structural redesign.

Potential future enhancements include:

- Multiple Properties
- Buildings
- Wings
- Rooms
- Lockers
- Parking
- Amenities
- Housekeeping
- Smart Allocation
- IoT Integration

These enhancements extend the Accommodation model while preserving its core business principles.

---

## Closing Statement

The Accommodation Specification forms one of the foundational business specifications of RPGMS.

Together with the Resident Profile Specification, it establishes the two primary business entities upon which the Stay, Finance, Billing, and Compliance domains are built.

The Accommodation model is intentionally simple, stable, and independent, ensuring that future business requirements can be accommodated through extension rather than redesign.

