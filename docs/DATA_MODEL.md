# DATA MODEL

## Purpose

This document defines the logical business data model for RPGMS.

It describes the core business entities, their purpose, relationships, and responsibilities independently of any database technology or implementation.

The data model serves as the bridge between the business specifications and the eventual database design.

---

## Guiding Principles

- The data model represents business entities, not database tables.
- Every entity has a single, well-defined business responsibility.
- Relationships reflect business concepts rather than implementation details.
- Historical information shall be preserved whenever required by business rules.
- The data model shall remain independent of any specific database technology.
- Physical database design decisions are documented separately.

---

## Resident

### Purpose

The Resident entity represents an individual who has interacted with the organization.

A Resident exists independently of accommodation allocation and remains part of the permanent business history regardless of their current operational status.

The Resident entity stores personal, contact, identity, and profile information throughout the Resident lifecycle.

---

### Relationships

A Resident:

- May have multiple historical Stays.
- May have only one Active Stay in the MVP.
- May be assigned a Door ID while occupying accommodation.
- May have multiple Payments.
- May have multiple Ledger Transactions.
- May raise multiple Complaints.
- May possess multiple Compliance records.

The Resident entity does **not** own accommodation allocation. Accommodation is managed through the Stay entity.

---

### Important Notes

- Resident identity is permanent.
- Resident records shall never be duplicated for readmissions.
- Readmission creates a new Stay, not a new Resident.
- Changes to Resident Profile information shall not alter historical Stay records.
- Resident operational status is independent of historical occupancy records.
- The Resident entity represents **who** the organization is managing.

---

## Stay

### Purpose

The Stay entity represents the operational relationship between a Resident and the organization for a defined period of accommodation.

A Stay manages occupancy, bed allocation, transfers, notice periods, and checkout while preserving the complete operational history of the Resident's stay.

The Stay is the central operational entity connecting Residents, Accommodation, Finance, and Compliance.

---

### Relationships

A Stay:

- Belongs to exactly one Resident.
- Is allocated exactly one Bed at any given time.
- May have multiple historical Bed Allocations.
- May have multiple Ledger Transactions.
- May have multiple Payments.
- May have multiple Compliance records.
- May have multiple Complaints.
- May have one or more operational Notes.

A Resident may have multiple historical Stays.

A Bed may be occupied by multiple historical Stays, but only one Active Stay at a time.

---

### Important Notes

- The Stay entity owns accommodation allocation.
- The Stay lifecycle begins with Reservation or Check-in and ends with Checkout.
- Bed transfers occur within a Stay and do not create a new Stay.
- Historical Stay records shall never be modified or deleted.
- Commercial terms established at the beginning of the Stay remain part of its permanent history unless changed according to business policy.
- The Stay entity represents **where and when** a Resident occupies accommodation.

---

## Flat

### Purpose

The Flat entity represents the highest physical accommodation unit within a Property.

A Flat groups Areas and Beds into a manageable operational unit and provides the primary level for occupancy management, reporting, maintenance, and administration.

Flat capacity is derived from the total number of Beds contained within the Flat.

---

### Relationships

A Flat:

- Belongs to exactly one Property.
- Contains one or more Areas.
- Contains one or more Beds through its Areas.
- May accommodate multiple Residents through Active Stays.
- May have multiple maintenance records.
- May have multiple occupancy reports.

Areas cannot exist independently of a Flat.

---

### Important Notes

- Every Flat shall have a unique Flat Number within a Property.
- Flat capacity is automatically calculated from the number of Beds.
- A Flat does not directly own Residents.
- Residents occupy Beds through the Stay entity.
- Operational statistics such as occupancy, vacancy, and utilization are derived from the Beds within the Flat.
- The Flat entity represents the primary physical accommodation unit managed by RPGMS.

---

## Area

### Purpose

The Area entity represents a logical subdivision of a Flat.

Areas provide a structured way to organize Beds within a Flat based on the physical layout, such as Bedroom, Hall, Small Bedroom, or any future configurable space.

Areas improve operational clarity without affecting the Resident or Stay lifecycle.

---

### Relationships

An Area:

- Belongs to exactly one Flat.
- Contains one or more Beds.
- Cannot exist independently of a Flat.

Beds cannot exist independently of an Area.

---

### Important Notes

- Area names shall be unique within a Flat.
- Area names are configurable by the organization.
- An Area has no occupancy of its own.
- Area capacity is derived from the number of Beds it contains.
- Operational reporting for occupancy is calculated from the Beds within the Area.
- The Area entity exists solely to organize Beds within a Flat and improve accommodation management.

---

## Bed

### Purpose

The Bed entity represents the smallest allocatable accommodation unit within RPGMS.

A Bed is the only physical accommodation resource that can be occupied by a Resident through an Active Stay.

Bed availability forms the basis for occupancy management, reservations, billing eligibility, and operational reporting.

---

### Relationships

A Bed:

- Belongs to exactly one Area.
- Indirectly belongs to one Flat through its Area.
- May be allocated to multiple historical Stays.
- May be allocated to only one Active Stay at any given time.
- May have multiple historical maintenance periods.
- May have multiple historical reservation records.

A Bed cannot exist independently of an Area.

---

### Important Notes

- Bed identity is established by the combination of Flat Number and Bed Name.
- Duplicate Bed Names are permitted across different Flats.
- Every Bed shall always have exactly one operational status.
- Supported statuses are:
  - Vacant
  - Reserved
  - Occupied
  - On Notice
  - Blocked
  - Maintenance
- Bed allocation is managed exclusively through the Stay entity.
- Historical occupancy shall be preserved through Stay records.
- The Bed entity represents the smallest physical accommodation resource managed by RPGMS.

---

## Door ID

### Purpose

The Door ID entity represents the access credential assigned to a Resident for secure entry into the accommodation.

Door IDs provide controlled access to the premises while maintaining a complete history of assignments and releases throughout the Resident's occupancy.

Door IDs are operational resources and are managed independently of the Resident's identity.

---

### Relationships

A Door ID:

- May be assigned to one Active Stay at any given time.
- Is indirectly associated with a Resident through the Active Stay.
- May be reassigned to different Residents over time.
- May have multiple historical assignment records.

A Resident may have only one active Door ID at any given time.

---

### Important Notes

- Door IDs are assigned only after a Resident has an Active Stay.
- Door ID assignment is an operational activity and does not form part of the Resident Profile.
- Door IDs shall be released during the Checkout process.
- Released Door IDs become available for future assignment.
- Historical Door ID assignments shall be permanently preserved.
- The Door ID entity represents a reusable operational resource rather than a permanent Resident attribute.

---

## Ledger

### Purpose

The Ledger entity represents the permanent financial record of all monetary transactions associated with a Stay.

The Ledger serves as the single source of truth for financial activity within RPGMS and records every financial event affecting a Resident's account.

Ledger entries provide a complete and immutable financial history for auditing, reconciliation, reporting, and dispute resolution.

---

### Relationships

A Ledger:

- Belongs to exactly one Stay.
- Is indirectly associated with one Resident through the Stay.
- Contains one or more Ledger Transactions.
- May be referenced by one or more Payments.
- May contain charges, credits, adjustments, refunds, penalties, and other financial events.

Every financial transaction shall be recorded in the Ledger.

---

### Important Notes

- The Ledger is the authoritative source of financial information.
- Ledger entries shall never be physically deleted.
- Historical ledger transactions shall never be modified after posting.
- Corrections shall be recorded using adjustment entries rather than editing historical records.
- Ledger balances are derived from the sum of all posted transactions.
- Billing, Payments, Security Deposits, Refunds, and Adjustments shall all be reflected through Ledger transactions.
- The Ledger represents the complete financial history of a Stay.

---

## Payment

### Purpose

The Payment entity represents a monetary amount received from or refunded to a Resident in settlement of one or more financial obligations.

Payments record the movement of money and provide the operational evidence required for receipts, reconciliation, and financial reporting.

A Payment records **how** a financial obligation is settled, while the Ledger records **what** financial activity has occurred.

---

### Relationships

A Payment:

- Belongs to exactly one Stay.
- Is indirectly associated with one Resident through the Stay.
- Shall allocate value to one or more Ledger Transactions.
- May generate one Receipt.
- May represent a full payment, partial payment, advance payment, or refund.

Multiple Payments may be applied to the same Ledger.

---

### Important Notes

- A Payment shall never exist independently of a Stay.
- Every Payment shall result in one or more Ledger allocations.
- Payments shall never modify historical Ledger Transactions.
- Payment allocation shall preserve complete financial history.
- Refunds shall be recorded as independent financial transactions.
- Payment methods, reference numbers, banking details, and receipt information form part of the Payment record.
- The Payment entity represents the movement of money, while the Ledger represents the financial history.

---

## Complaint

### Purpose

The Complaint entity represents an issue, concern, request, or grievance raised during a Resident's Stay.

Complaints provide a structured mechanism for tracking operational issues from reporting through resolution while preserving a complete history of actions taken.

The Complaint entity supports service quality, accountability, and operational improvement.

---

### Relationships

A Complaint:

- Belongs to exactly one Stay.
- Is indirectly associated with one Resident through the Stay.
- May reference one Flat, Area, or Bed where applicable.
- May have multiple status updates.
- May have multiple notes, actions, or attachments.
- May be assigned to one or more staff members during its lifecycle.

A Stay may have multiple Complaints.

---

### Important Notes

- Every Complaint shall have a unique Complaint ID.
- Complaint history shall be permanently preserved.
- Complaints shall follow a defined operational lifecycle.
- Closing a Complaint shall not remove its historical record.
- Complaints shall remain associated with the Stay under which they were raised, even after Checkout.
- Complaint resolution metrics may be used for operational reporting and service improvement.
- The Complaint entity represents operational service management rather than Resident conduct or disciplinary action.

---

## Relationship Summary

The core business relationships within RPGMS are summarized below.

```text
Property
│
└── Flat
    │
    └── Area
        │
        └── Bed
             ▲
             │
          allocated to
             │
Resident ─── Stay ─── Ledger ─── Payment
    │          │
    │          ├── Complaint
    │          ├── Door ID
    │          └── Compliance (Future)
    │
    └── Resident Profile
```

### Core Relationships

- A Property contains one or more Flats.
- A Flat contains one or more Areas.
- An Area contains one or more Beds.
- A Resident may have multiple historical Stays.
- A Stay belongs to exactly one Resident.
- A Stay is allocated exactly one Bed at any point in time.
- A Bed may have multiple historical Stays but only one Active Stay.
- Every Ledger belongs to one Stay.
- Every Payment belongs to one Stay and allocates value to Ledger Transactions.
- Every Complaint belongs to one Stay.
- Every Door ID assignment belongs to one Active Stay.

The Stay entity serves as the central operational entity connecting the Resident, Accommodation, Finance, and Compliance domains.

---

## Design Principles

- The data model represents business entities rather than database tables.
- Every entity has a single business responsibility.
- Relationships are defined by business ownership rather than implementation.
- Historical business information shall be preserved wherever required.
- The Stay entity is the operational center of the system.
- The Ledger is the single source of truth for all financial activity.
- Business entities shall remain independent of specific database technologies.
- Physical database design, indexing, constraints, and optimization are documented separately.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | July 2026 | Initial logical data model aligned with the Resident, Accommodation, Stay, and Business Rules specifications. |

---

## Document Status

**Status:** Active

This document defines the logical business data model for RPGMS.

It complements the business specifications by describing the purpose, relationships, and responsibilities of each business entity while remaining independent of any database technology or implementation.

The physical database schema, table definitions, indexes, constraints, and performance considerations are maintained separately.

---

