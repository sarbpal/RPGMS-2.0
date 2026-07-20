# BUSINESS RULES

## Purpose

This document serves as the master index of business rules governing RPGMS.

Each business rule is assigned a unique identifier (BR-XXX) and is owned by a specific business domain.

This document defines **what** the system must enforce. Detailed business definitions, workflows, and operational behavior are maintained within the corresponding domain specifications.

Business rule identifiers are permanent and must never be reused, even if a rule is retired or replaced.

---

## Guiding Principles

- Business rules are independent of technology and implementation.
- Every business rule has a single owning business domain.
- Business rules describe **what** the system must enforce, not **how** it is implemented.
- Detailed explanations belong in the corresponding domain specification.
- Rule identifiers are permanent and must never be reused.
- Business rules should avoid duplication across documents.
- The business specifications are the authoritative source for detailed business behavior.

---

# Accommodation

BR-001 Flat Structure

- A Property consists of one or more Flats.
- Every Flat shall have a unique Flat Number within the Property.
- A Flat is the highest physical accommodation unit managed by RPGMS.
- A Flat contains one or more Areas.
- Flat capacity is derived from the total number of Beds it contains.

---

BR-002 Area Structure

- Every Area belongs to exactly one Flat.
- An Area represents a logical subdivision of a Flat (e.g., Bedroom, Hall, Small Bedroom).
- Area names shall be unique within a Flat.
- An Area contains one or more Beds.

---

BR-003 Bed Structure

- A Bed is the smallest allocatable accommodation unit.
- Every Bed belongs to exactly one Area.
- Bed identity is established by the combination of Flat Number and Bed Name.
- Duplicate Bed Names are permitted across different Flats.
- A Bed may be allocated to only one active Stay at any given time.

---

BR-004 Bed Status

A Bed shall always have exactly one operational status.

Supported statuses are:

- Vacant
- Reserved
- Occupied
- On Notice
- Blocked
- Maintenance

Status transitions shall follow the rules defined in the Accommodation Specification.

---

# Resident

BR-101 Resident Identity

- Every Resident shall have a unique Resident ID.
- A Resident represents a person and exists independently of any Stay.
- A Resident may have multiple historical Stays.
- A Resident may have only one Active Stay in the MVP.
- Resident records shall be preserved as part of the permanent business history.

---

BR-102 Resident Status

A Resident shall always have exactly one operational status.

Supported statuses are:

- Active
- On Notice
- Checked Out
- Alumni

Resident status transitions shall follow the rules defined in the Resident Profile Specification.

---

BR-103 Readmission

- A former Resident may be readmitted.
- Readmission shall create a new Stay.
- Historical Stays shall never be modified.
- Resident identity shall be retained across all admissions.

---

BR-104 Resident Profile

- Resident profile information shall remain independent of accommodation allocation.
- Changes to a Resident Profile shall not modify historical Stay records.
- Resident identity shall remain consistent throughout the Resident lifecycle.

---
# Stay

BR-201 Stay Creation

- Every occupancy shall be represented by a Stay.
- A Stay establishes the operational relationship between a Resident and the accommodation.
- A Stay shall be created before a Resident occupies a Bed.
- A Resident may have only one Active Stay in the MVP.
- Every Stay shall have a unique Stay ID.

---

BR-202 Bed Allocation

- Every Active Stay shall be allocated exactly one Bed.
- A Bed may be allocated to only one Active Stay at any given time.
- Bed allocation shall be recorded as part of the Stay history.
- Bed transfers shall preserve historical allocation records.

---

BR-203 Commercial Defaults

- Commercial terms shall be established when a Stay is created.
- Default commercial values may be derived from system configuration.
- Authorized users may override default commercial values when permitted by business policy.
- Commercial terms shall be preserved as part of the Stay history.

---

BR-204 Manual Overrides

- Authorized users may override selected operational defaults where permitted by business policy.
- All manual overrides shall be recorded in the audit trail.
- Manual overrides shall not compromise historical integrity.

---

BR-205 Checkout Process

- Checkout shall terminate the Active Stay.
- Checkout shall release the allocated Bed.
- Checkout shall preserve the complete Stay history.
- A checked-out Stay shall never become Active again.

---

BR-206 Bed Release

- Bed release shall occur only after successful completion of the Checkout process.
- A released Bed shall become available for future allocation unless explicitly Blocked or placed under Maintenance.

---

BR-207 Resident Assessment

- Operational assessments may be recorded during Checkout.
- Assessments shall become part of the permanent Stay history.
- Historical assessments shall not be deleted.

---

# Finance

Reserved for future specification.

Business rules in this domain will govern:

- Financial Accounts
- Ledger Management
- Transactions
- Receipts
- Adjustments
- Refunds
- Financial Reconciliation

---

# Billing

BR-301 Anniversary Billing

- Resident billing shall follow the configured billing cycle.
- The default billing model shall be anniversary-based.
- Billing cycles shall be preserved throughout the Stay unless explicitly changed according to business policy.

---

BR-302 Rent Calculation

- Rent shall be calculated according to the commercial terms of the Stay.
- Rent calculations shall be deterministic and reproducible.
- Historical rent calculations shall never change after finalization.

---

BR-303 Security Deposit

- Security Deposits shall be tracked independently from Rent.
- Security Deposit transactions shall be recorded in the financial ledger.
- Refunds and adjustments shall preserve complete financial history.

---

BR-304 Ledger

- The financial ledger is the single source of truth for all monetary transactions.
- Financial transactions shall never be physically deleted.
- Corrections shall be performed through adjustment entries rather than modification of historical records.

---

# Compliance

Reserved for future specification.

Business rules in this domain will govern:

- Resident Verification
- Police Verification
- Identity Documents
- Agreement Management
- Regulatory Compliance
- Mandatory Documentation
- Compliance Status Tracking

---

# Door IDs

BR-401 Door ID Assignment

- A Door ID may be assigned only to a Resident with an Active Stay.
- A Door ID shall be unique while active.
- A Resident may have only one active Door ID at any given time.
- Door ID assignment shall be recorded in the audit trail.

---

BR-402 Door ID Release

- A Door ID shall be released during the Checkout process.
- A released Door ID shall become available for future assignment.
- Historical Door ID assignments shall be preserved.

---

# Complaints

BR-601 Complaint Lifecycle

- Every Complaint shall have a defined lifecycle.
- A Complaint shall remain associated with the Resident and Stay under which it was raised.
- Complaint history shall be preserved permanently.
- Complaint resolution shall be recorded as part of the audit history.

---

# Reporting

Reserved for future specification.

Business rules in this domain will govern:

- Operational Reports
- Financial Reports
- Occupancy Reports
- Compliance Reports
- Management Dashboards
- Analytics

---

# General Rules

BR-901 Soft Delete

- Business records shall not be physically deleted unless explicitly permitted by business policy.
- Operational deletion shall be performed using status changes or archival mechanisms where appropriate.
- Historical integrity shall always be preserved.

---

BR-902 Audit Trail

- All significant business operations shall be recorded in the audit trail.
- Audit records shall include the operation performed, timestamp, and responsible user.
- Audit history shall be immutable and permanently preserved.

---

BR-903 Source of Truth

- Each business domain shall define a single authoritative source of truth for its data.
- Business data shall not be duplicated across multiple authoritative sources.
- Derived data shall always originate from its designated source of truth.

---

BR-904 Unified Resident Search

RPGMS shall provide a unified search allowing operators to locate residents using one or more of the following identifiers:

- Resident ID
- Name
- Phone Number
- Aadhaar Number
- Door ID
- Flat Number
- Bed Number
- Vehicle Number
- Email Address
- Registered MAC Address

The unified search shall return matching residents regardless of their operational status, subject to user permissions.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | July 2026 | Initial Business Rules document created and aligned with the Resident, Accommodation, and Stay business architecture. |

---

## Document Status

**Status:** Active

This document is the master index of business rules for RPGMS.

Detailed business definitions, workflows, validation rules, and lifecycle behavior are maintained within the corresponding domain specifications.

Current business domains covered:

- Resident
- Accommodation
- Stay
- Billing
- Door IDs
- Complaints

Future business domains:

- Finance
- Compliance
- Reporting

Business rule identifiers (BR-XXX) are permanent and must never be reused.

---
