# Resident Architecture

**Document ID:** RPGMS-RA-001  
**Version:** 1.0  
**Status:** Status: Frozen v1.0
**Owner:** RPGMS 2.0 Project  
**Last Updated:** 21 July 2026

---

# Version History

| Version | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | 21 Jul 2026 | Project Team | Initial Resident Architecture |

---

# Purpose

This document defines the architectural model for the Resident domain of RPGMS 2.0.

The Resident domain is the central business domain of the application. Every operational module—including Accommodation, Finance, Laundry, Maintenance, Visitor Management, Security, and Reporting—references the Resident domain.

This document defines:

- Resident lifecycle
- Resident identity
- Resident status model
- Resident vs Stay model
- Stay Events
- Domain relationships
- Architectural principles

This document intentionally avoids UI implementation details, API design, and database schema. Those are documented separately.

---

# Resident Domain Overview

A Resident represents a person who has stayed, is staying, or will stay in the property.

The Resident domain is the authoritative source of resident identity throughout RPGMS.

Other domains reference Residents but never own Resident information.

Examples:

- Accommodation manages where a Resident stays.
- Finance manages the Resident's financial history.
- Laundry manages service usage.
- Security manages access credentials.
- Maintenance manages complaints raised by Residents.

The Resident domain is therefore considered the core operational domain of RPGMS.

---

# Resident Lifecycle

For the current MVP, a Resident progresses through the following lifecycle.

```
Active
    │
    ▼
On Notice
    │
    ▼
Checked Out
    │
    ▼
Alumni
```

Future versions may introduce additional stages before admission.

Example:

```
Prospect
    │
Admission Pending
    │
Active
    │
On Notice
    │
Checked Out
    │
Alumni
```

The architecture has been intentionally designed to support these future states without requiring redesign.

---

# Core Business Principles

## Principle 1 — A Resident Represents a Person

A Resident represents a human being, not a room, bed, booking, invoice, or financial account.

---

## Principle 2 — Resident Identity is Permanent

Each person has exactly one Resident record within RPGMS.

The Resident ID never changes.

If a former resident returns after any period of time, RPGMS reuses the same Resident record.

---

## Principle 3 — A Resident May Have Multiple Stays

A Resident may stay multiple times over several years.

Each admission creates a new Stay while preserving previous Stay history.

---

## Principle 4 — Only One Active Stay

A Resident may have multiple historical stays but only one Active Stay at any given time.

---

## Principle 5 — History is Preserved

Historical records are never overwritten.

Every Stay remains permanently available for reporting, auditing, and financial reconciliation.

---

## Principle 6 — Domain Events Drive Other Domains

Resident lifecycle events may trigger business processes in other domains such as Accommodation, Finance, Security, Laundry, and Reporting.


Examples include:

- Bed allocation
- Billing activation
- Security Deposit creation
- Ledger creation
- Door ID assignment
- Checkout settlement

The Resident domain publishes Stay Events. Other domains consume those events according to their own business rules.

Other domains respond to them.

---

## Principle 7 — Resident Records Are Never Deleted

Resident records are permanent.

Residents who leave become Alumni.

Deleting Resident records would destroy historical accommodation, financial, audit, and reporting information.

---

# Resident vs Stay

One of the most important architectural concepts within RPGMS is the separation between a Resident and a Stay.

A Resident represents the individual.

A Stay represents one admission.

A Resident exists independently of any particular stay.

A Resident may therefore have multiple Stays throughout their lifetime.

Example:

```
Resident

Resident ID : R000145

Name : Rahul Sharma

Stay #1

Jan 2025 – Dec 2025

Stay #2

Jul 2027 – Present
```

The Resident remains the same.

Only the Stay changes.

The relationship between a Resident and their Stays can be visualized as follows:

Resident
│
├── Stay #1 (Jan 2025 – Dec 2025)
│     │
│     ├── Check-in
│     ├── Initial Bed Assignment
│     ├── Bed Transfer
│     ├── Notice Given
│     └── Checkout
│
└── Stay #2 (Jul 2027 – Present)
      │
      ├── Check-in
      └── Initial Bed Assignment

# Stay Definition

A **Stay** represents one continuous period during which a Resident occupies accommodation within the property.

A Stay begins when the Resident successfully completes the Check-in process and is assigned a Bed.

A Stay ends only when the Resident successfully completes the Checkout process.

A Stay represents an admission, not a room assignment.

During a Stay, a Resident may:

- Change Beds
- Change Areas
- Change Flats
- Submit Notice
- Use various services

These activities do not create a new Stay.

Instead, they become part of the operational history of the existing Stay through Stay Events.

A new Stay is created only when a Resident checks in again after completing Checkout from a previous Stay.

---

## Stay Boundaries

A Stay always has:

- One Check-in
- Zero or more Stay Events
- One Checkout

Example:

Check-in
      │
      ▼
Bed Assignment
      │
      ▼
Bed Transfer
      │
      ▼
Rent Revision
      │
      ▼
Notice Given
      │
      ▼
Bed Transfer
      │
      ▼
Checkout

The entire sequence represents one Stay.

---

## Stay Principles

### Principle 1

A Stay belongs to exactly one Resident.

---

### Principle 2

A Resident may have multiple historical Stays.

---

### Principle 3

Only one Stay may be Active for a Resident at any point in time.

---

### Principle 4

A Stay cannot exist without a successful Check-in.

---

### Principle 5

A Stay cannot remain Active after Checkout.

---

### Principle 6

Changes to accommodation during a Stay do not create a new Stay.

They are recorded as Stay Events.

---

### Principle 7

A completed Stay is permanent.

Historical Stays are never deleted or modified.

---

## Relationship to Other Domains

A Stay provides the operational context for other business domains.

Accommodation determines where the Resident stays.

Finance records all financial transactions associated with the Stay.

Security manages access during the Stay.

Laundry records services consumed during the Stay.

Reporting aggregates historical information across all Stays.

The Stay itself remains the authoritative record of one continuous admission.

# Resident Status Model

Current statuses:

| Status | Description |
|----------|-------------|
| Active | Currently residing in the property |
| On Notice | Notice period initiated |
| Checked Out | Resident has vacated the property |
| Alumni | Historical Resident retained for reference |

Future statuses:

- Prospect
- Admission Pending

These have intentionally been excluded from the MVP but remain supported by the architecture.

---

# Resident Identity

Resident identity consists of permanent personal information.

Examples include:

- Resident ID
- Full Name
- Date of Birth
- Government Identity Numbers
- Photograph

Contact information may change over time without changing Resident identity.

Examples:

- Mobile Number
- Email
- Employer
- College
- Permanent Address
- Emergency Contact

The Resident record always represents the current identity of the individual while preserving historical Stay information.

---

# Relationship with Other Domains

The Resident domain interacts with multiple business domains.

## Accommodation

Assigns:

- Flat
- Area
- Bed

Accommodation never owns Resident identity.

---

## Finance

Creates:

- Ledger
- Security Deposit
- Charges
- Payments

Finance references the Resident.

Finance never owns Resident information.

---

## Laundry

Records laundry usage against the Resident.

---

## Maintenance

Records complaints raised by Residents.

---

## Security

Assigns access credentials and Door IDs.

---

## Reporting

Aggregates operational and historical information across all Resident stays.

---
# Stay Events

A Stay is represented by a chronological sequence of Stay Events that collectively describe the Resident's journey from Check-in to Checkout.

Stay Events originate within the Resident domain and represent significant milestones during a Resident's stay.

Other business domains such as Finance, Accommodation, Security, and Laundry may react to these events according to their own business rules.

Stay Events are permanent and form part of the Resident's historical record.

---

## Admission Events

### Check-in

Marks the official beginning of a Stay.

Typical outcomes:

- Creates a new Stay.
- Changes Resident status to Active.
- Triggers downstream processes in other domains.

---

### Initial Bed Assignment

Assigns the Resident to a Flat, Area, and Bed.

The first bed assignment forms part of the admission process.

---

## Operational Events

### Bed Transfer

Records movement between Beds, Areas, or Flats without ending the Stay.

Each transfer records:

- Date & Time
- Previous Flat
- Previous Area
- Previous Bed
- New Flat
- New Area
- New Bed
- Reason
- Approved By
- Remarks (Optional)

---

### Notice Given

Records the Resident's intention to vacate.

Changes the Resident status to On Notice.

---

## Completion Events

### Checkout

Marks the official completion of the Stay.

Triggers downstream processes in Accommodation, Finance, Security, and other related domains.

---

### Alumni Conversion

Archives the completed Stay while preserving all historical information.

The Resident remains permanently available within RPGMS.

---

# Stay Event Principles

1. Stay Events are recorded chronologically.

2. Stay Events are permanent.

3. Stay Events are never deleted.

4. Historical Stay Events are never modified.

5. Every Stay Event records its date and time.

6. Significant Stay Events record the user performing the action.

7. Stay Events may trigger business processes in other domains.

8. Together, Stay Events represent the complete operational history of a Stay.
   
# Future Extensions

The architecture has been intentionally designed to support future capabilities including:

- Prospect Management
- Online Admissions
- Waiting Lists
- Room Reservation
- Digital Document Verification
- Visitor Management
- Resident Portal
- Mobile Application
- Multi-Property Residence
- Organization / Corporate Accommodation

---

# Architectural Decisions

## AD-001 — Resident Identity is Permanent

Each person has one permanent Resident record.

Multiple admissions create multiple Stays rather than multiple Residents.

---

## AD-002 — One Active Stay Per Resident

A Resident may have only one Active Stay at any point in time.

---

## AD-003 — Resident Records Are Never Deleted

Resident records are retained permanently.

Historical information is preserved through the Alumni lifecycle stage.

---

## AD-004 — Resident Domain Owns Resident Lifecycle

Resident lifecycle events originate within the Resident domain.

Other domains consume these events.

---

# Related Documents

- RESIDENT_PROFILE_SPECIFICATION.md
- CHECKIN_SCENARIOS.md
- CHECKOUT_SCENARIOS.md
- ../accommodation/ACCOMMODATION_ARCHITECTURE.md *(future)*
- ../finance/FINANCE_ARCHITECTURE.md
- ../finance/FINANCIAL_POLICIES.md
- ../finance/FINANCE_SCENARIOS.md

---

# Closing Statement

The Resident domain forms the operational heart of RPGMS 2.0.

Accommodation determines where Residents stay.

Finance records their financial activity.

Other operational modules provide services throughout their stay.

The Resident domain remains the authoritative source of resident identity, lifecycle, and Domain Events, ensuring consistency, traceability, and long-term historical integrity across the entire application.

