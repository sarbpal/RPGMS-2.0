# RPGMS 2.0
# Business Rules

**Document ID:** RPGMS-BR-001

**Version:** 1.0

**Status:** Architecture Draft

**Document Owner:** RPGMS Architecture

**Last Updated:** July 2026

---

# Purpose

The Business Rules document defines the mandatory rules that govern the operation of RPGMS.

Business Rules describe what the system must always enforce in order to preserve business correctness, operational consistency and historical integrity.

These rules are independent of software implementation and remain valid regardless of programming language, database technology or user interface.

Where the Business Blueprint explains the business architecture, this document specifies the mandatory rules that every implementation must enforce.

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

The Business Rules document should be read together with the Business Blueprint.

The relationship between the two documents is:

| Document | Purpose |
|----------|---------|
| BUSINESS_BLUEPRINT.md | Defines the business architecture and business concepts. |
| BUSINESS_RULES.md | Defines the mandatory rules governing those business concepts. |

The Business Blueprint explains **what the business is**.

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

Corrections shall create new business events rather than altering historical records.

---

## BRP-007 Clear Responsibility

Each rule shall clearly identify:

- What must be true.
- Which business object owns the responsibility.
- When the rule applies.

Rules should avoid unnecessary explanation.

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

Multiple historical Stay allocations may exist for the same Bed.

### Reason

A Bed cannot be simultaneously occupied by more than one Resident.

Historical occupancy must remain preserved.

### Applies To

- Admission
- Bed Allocation
- Bed Transfer

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

A Vacant Bed shall have no Active Stay.

A Reserved Bed shall not yet have active occupancy.

### Reason

Bed status must accurately represent real-world occupancy.

### Applies To

- Admission
- Checkout
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

Personal information may evolve over time while historical business events remain unchanged.

### Applies To

- Resident Management
- Profile Updates

---

## BR-104 Resident Status

### Rule

Every Resident shall have exactly one operational status.

Supported statuses are:

- Active
- On Notice
- Checked Out
- Alumni

Additional statuses may be introduced through future architectural revisions.

### Reason

Resident status reflects the current operational relationship between the Resident and the organisation.

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

Every Active Stay shall have one or more allocated Beds.

Every allocated Bed shall belong exclusively to that Active Stay.

Bed allocations shall be recorded as part of the permanent Stay history.

### Reason

Accommodation forms part of the operational history of a Stay.

### Applies To

- Admission
- Bed Allocation
- Bed Transfer

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

Commercial terms shall be established before occupancy begins.

Historical Commercial Agreements shall remain immutable.

### Reason

Commercial obligations belong to the Stay rather than the Resident.

### Applies To

- Admission
- Commercial Management
- Billing

---

## BR-207 Stay Amendments

### Rule

Operational and commercial changes may occur during an Active Stay.

Examples include:

- Bed Transfers
- Rent Revisions
- Billing Cycle Changes
- Deposit Revisions

Historical business records shall not be modified.

Amendments shall apply prospectively unless otherwise defined by business policy.

### Reason

Business conditions may change during occupancy while preserving historical accuracy.

### Applies To

- Stay Management
- Billing

---

## BR-208 Operational Timeline

### Rule

Every significant operational event affecting a Stay shall become part of the permanent Stay history.

Examples include:

- Admission
- Bed Allocation
- Bed Transfer
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

Operational Checkout concludes an Active Stay.

Checkout shall:

- Release operational resources.
- Release allocated Beds.
- Release assigned Door IDs.
- Preserve the complete Stay history.

Operational Checkout shall not perform Financial Settlement.

### Reason

Operational departure and financial completion are independent business processes.

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

Corrections shall be represented through new business events.

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

# Stay Summary

The Stay represents the complete operational relationship between a Resident and the organisation during one uninterrupted period of occupancy.

It owns operational resources, commercial obligations and occupancy history while remaining permanently linked to the Resident.

Historical Stay information shall remain immutable and continue to serve as the authoritative operational record of occupancy.

---

# Reservation

The Reservation domain governs the process of reserving future accommodation for a prospective Resident.

A Reservation represents an intention to occupy accommodation in the future.

A Reservation is not a Stay and does not establish occupancy.

---

## BR-300 Reservation Creation

### Rule

Every Reservation shall have a unique Reservation ID.

A Reservation shall identify the intended Resident and the proposed accommodation requirements.

### Reason

Reservations uniquely identify future occupancy requests.

### Applies To

- Reservation Management

---

## BR-301 Reservation Independence

### Rule

A Reservation shall exist independently of a Stay.

Creating a Reservation shall not create a Stay.

Occupancy shall begin only after Admission.

### Reason

Reservation represents intent, whereas Stay represents actual occupancy.

### Applies To

- Reservation Management
- Admission

---

## BR-302 Reservation Status

### Rule

Every Reservation shall have exactly one operational status.

Supported statuses are:

- Pending
- Confirmed
- Cancelled
- Expired
- Converted

### Reason

Reservation status reflects the current stage of the reservation lifecycle.

### Applies To

- Reservation Management
- Reporting

---

## BR-303 Reservation Validity

### Rule

A Reservation shall remain valid only until one of the following occurs:

- Admission is completed.
- The Reservation is cancelled.
- The Reservation expires.
- The Reservation is withdrawn.

### Reason

Reservations represent temporary business commitments.

### Applies To

- Reservation Management

---

## BR-304 Reservation Conversion

### Rule

Admission shall convert a Reservation into a Stay.

The Reservation shall remain part of the permanent business history.

Reservation history shall not be deleted.

### Reason

The Reservation documents the origin of the occupancy.

### Applies To

- Admission
- Audit

---

## BR-305 Reservation Cancellation

### Rule

Cancelled Reservations shall remain permanently recorded.

Cancellation shall not remove historical Reservation information.

### Reason

Reservation history forms part of the organisation's operational records.

### Applies To

- Reservation Management
- Audit

---

# Admission

Admission governs the commencement of occupancy.

Admission is a business process that establishes a new Stay.

Admission does not itself become a permanent business object.

---

## BR-350 Admission Eligibility

### Rule

Admission shall be permitted only when all mandatory business requirements have been satisfied.

Mandatory requirements shall be governed by business policy.

### Reason

Admission shall comply with organisational operating policies.

### Applies To

- Admission

---

## BR-351 Stay Establishment

### Rule

Successful Admission shall create exactly one new Stay.

The Stay shall become the authoritative operational record of occupancy.

### Reason

Occupancy begins only through creation of a Stay.

### Applies To

- Admission

---

## BR-352 Resident Association

### Rule

Admission shall associate the Stay with exactly one Resident.

Resident identity shall remain unchanged throughout the Stay.

### Reason

Occupancy belongs to the Resident while preserving permanent identity.

### Applies To

- Admission

---

## BR-353 Accommodation Allocation

### Rule

Admission shall allocate one or more eligible Beds to the newly created Stay.

Only available Beds may be allocated.

### Reason

Occupancy requires accommodation assignment.

### Applies To

- Admission
- Bed Allocation

---

## BR-354 Operational Resource Allocation

### Rule

Admission shall allocate all required operational resources according to business policy.

Operational resources may include:

- Door ID
- Parking Allocation
- Locker Allocation

### Reason

Operational resources are required to support occupancy.

### Applies To

- Admission

---

## BR-355 Commercial Agreement Establishment

### Rule

Admission shall establish the initial Commercial Agreement for the Stay.

Commercial terms shall become effective upon commencement of occupancy.

### Reason

Financial obligations begin with occupancy.

### Applies To

- Admission
- Billing

---

## BR-356 Admission Completion

### Rule

Admission shall be considered complete only after:

- Resident association has been established.
- Stay has been created.
- Accommodation has been allocated.
- Commercial Agreement has been established.
- Mandatory operational resources have been assigned.

### Reason

Admission is complete only when occupancy is fully established.

### Applies To

- Admission

---

## BR-357 Admission History

### Rule

Admission shall become part of the permanent operational history of the Stay.

Historical Admission information shall be immutable.

### Reason

Admission represents the commencement of occupancy.

### Applies To

- Audit
- Reporting

---

# Reservation & Admission Summary

Reservation and Admission govern the transition from intended occupancy to actual occupancy.

Reservation represents a future business commitment.

Admission is the business process that creates a Stay and establishes occupancy.

Neither Reservation nor Admission replaces the Stay.

The Stay remains the authoritative operational record throughout the Resident's period of occupancy.

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

The Commercial Agreement shall define the financial obligations applicable to the Stay.

### Reason

Commercial obligations belong to the Stay rather than the Resident.

### Applies To

- Admission
- Commercial Management

---

## BR-401 Commercial Agreement History

### Rule

Commercial Agreements shall remain immutable after they become effective.

Changes to commercial terms shall create a new Commercial Amendment rather than modifying historical agreements.

### Reason

Historical commercial obligations must remain auditable.

### Applies To

- Commercial Management
- Audit

---

## BR-402 Commercial Amendments

### Rule

Commercial terms may be amended during an Active Stay where permitted by business policy.

Amendments shall apply prospectively unless explicitly defined otherwise.

Historical agreements shall remain unchanged.

### Reason

Commercial conditions may change without compromising historical integrity.

### Applies To

- Commercial Management
- Billing

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

Configuration establishes future behaviour rather than rewriting historical business events.

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

- Creation
- Amendment
- Allocation
- Transfer
- Approval
- Reversal
- Closure

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

The Notifications domain governs communication generated by business events.

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

Notifications communicate business events.

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

Corrections shall be represented through new business events rather than alteration of historical records.

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

- BUSINESS_BLUEPRINT.md
- BUSINESS_RULES.md

where applicable.

---

# Document Status

**Status:** Approved Business Architecture

This document forms the authoritative specification of the mandatory business rules governing RPGMS.

All software implementation, testing, documentation and future enhancements shall conform to these rules unless an approved architectural revision explicitly changes the business architecture.

---

# Conclusion

The Business Rules document defines the mandatory principles that govern every operational and financial activity within RPGMS.

Together with the Business Blueprint, it establishes a complete business architecture consisting of:

- Business Concepts
- Business Relationships
- Business Lifecycles
- Business Rules
- Business Governance

These documents are intentionally independent of software implementation.

They define the business architecture that every implementation of RPGMS must faithfully preserve.

As RPGMS evolves, new capabilities shall extend this architecture while maintaining historical integrity, business consistency and long-term maintainability.

---

