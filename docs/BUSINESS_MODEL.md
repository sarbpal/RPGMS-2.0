# RPGMS 2.0 Business Model

# RPGMS Business Constitution

Version: 2.0
Status: Approved
Effective Date: 19 July 2026
Owner: Ritu PG Services
Applies To: RPGMS 2.0 and all future versions unless superseded


## Revision History

| Version | Date | Description |
|----------|------------|-------------|
| 1.0 | 19 Jul 2026 | Initial Business Constitution established. |

---

## How to Read This Document

This document is the constitutional business specification for RPGMS.

It defines how the business operates independently of any software implementation. All architectural, database, API, user interface and implementation decisions should derive from the principles and business rules defined here.

This document should be read in the following order:

### Chapters 1–4: Business Foundation

These chapters establish the philosophy, vision and constitutional principles that govern the entire system.

### Chapters 5–10: Core Business Entities

These chapters define the permanent business entities and their relationships, including Accommodation, Residents, Reservations and Admissions.

### Chapters 11–18: Business Lifecycle

These chapters describe the complete lifecycle of a Resident's Stay, from Admission through Stay Management, Finance, Checkout, Financial Settlement and Alumni.

### Appendices

The appendices provide the official reference material used throughout RPGMS.

- **Appendix A** defines the official business terminology.
- **Appendix B** indexes all constitutional business rules.
- **Appendix C** defines the authoritative state machines for major business entities.

## Scope

This document intentionally focuses on business behaviour rather than technical implementation.

It does not define:

- Database schemas
- API specifications
- User interface design
- Software architecture
- Programming language or framework choices

Those implementation details are documented separately and shall conform to the business principles defined here.

## Authority

This document is the primary business authority for RPGMS.

Where conflicts arise between implementation and this document, the business rules defined herein shall take precedence until formally revised.

All future enhancements should preserve the constitutional principles established by this document unless explicitly superseded through an approved revision.

Vision
   │
   ▼
Business Principles
   │
   ▼
Business Entities
   │
   ▼
Business Operations
   │
   ▼
Business Lifecycle
   │
   ▼
Business Rules & Reference

---


# 1. Purpose

This document defines the business architecture of RPGMS (Ritu PG Management System).

Its purpose is to establish a single, authoritative description of how the business operates, independent of implementation details such as databases, programming languages, user interfaces, or technology choices.

Every module, feature, report, API, automation, and user interface within RPGMS shall conform to the principles and business rules defined in this document.

This document serves as the constitutional reference for future development and shall take precedence over implementation decisions whenever conflicts arise.

---

# 2. Vision

RPGMS is not merely a hostel management application.

It is an intelligent business platform designed to manage the complete lifecycle of residents, accommodation, finance, and operations within a Paying Guest (PG) establishment.

The system is designed to accurately represent the real-world business processes of Ritu PG Services while remaining flexible enough to support future expansion into larger properties, premium accommodation, corporate housing, and multi-property operations.

The objective of RPGMS is to provide operators with complete operational visibility, financial accuracy, historical traceability, and intelligent decision support without increasing operational complexity.

---

# 3. Core Philosophy

The architecture of RPGMS is founded upon the belief that software should model the business rather than force the business to adapt to software limitations.

Business processes shall therefore be represented as naturally as possible, allowing operators to work in a manner that reflects actual day-to-day operations.

The system shall preserve business history rather than overwrite it, maintain clear separation between business concepts, and provide transparency for every significant business action.

RPGMS follows an event-driven business model where important business activities are recorded as immutable events, creating a complete and auditable history of every resident's relationship with the organisation.

---

# 4. Constitutional Principles

The following principles govern every module within RPGMS.

## CP-001 Business Before Technology

Business requirements shall always take precedence over implementation convenience.

Technology exists to support the business model, not define it.

---

## CP-002 Single Source of Truth

Every business concept shall have one authoritative source.

Duplicate ownership of business information shall be avoided.

Examples include:

- Accommodation defines physical accommodation.
- Accommodation Plans define commercial terms.
- Finance records monetary transactions.
- Stay represents the contractual relationship with the resident.

---

## CP-003 Separation of Concerns

Physical accommodation, commercial agreements, operational activities, and financial transactions are separate business concepts and shall remain independently modelled.

Changes within one business area should not require redesign of unrelated business areas.

---

## CP-004 Preserve Business History

Historical business information shall never be overwritten where preserving history provides business value.

Significant business changes shall be represented through events or transactions rather than modification of historical records.

---

## CP-005 Event Driven Business Model

Major business operations generate Business Events.

Business Events provide an immutable chronological history of significant business activities throughout the lifecycle of the relevant business capability.

Business Events support auditability, operational transparency, reporting, and future intelligent decision support.

---

## CP-006 Agreement Versus Execution

Business agreements and operational execution are separate concepts.

Examples include:

- Accommodation Plan defines the default commercial offering.
- Stay records the agreed commercial terms.
- Finance records the actual financial transactions.

Each represents a different aspect of the business relationship.

---

## CP-007 Intelligent Decision Support

RPGMS is an Intelligent Decision Support System.

The responsibility of the system is to:

- Analyse
- Recommend
- Explain

The responsibility of the operator is to:

- Approve
- Reject
- Execute

Business decisions remain under operator control unless explicitly automated by future business policy.

---

## CP-008 Progressive Data Capture

Only information required for the current business process shall be mandatory.

Additional information should be collected progressively as the resident relationship develops.

This reduces admission complexity while maintaining complete resident records over time.

---

## CP-009 Financial Traceability

Financial values shall be derived from financial transactions wherever practical.

Balances should not be manually maintained when they can be calculated from ledger activity.

This principle applies particularly to deposits, payments, adjustments, refunds, and recoveries.

---

## CP-010 Future Extensibility

The architecture shall support future business expansion without requiring fundamental redesign.

Examples include:

- Premium accommodation
- Multiple accommodation plans
- Corporate housing
- Multiple properties
- Additional operational modules

Future extensibility shall not unnecessarily complicate the MVP implementation.

---

# 5. Business Architecture Model

## 5.1 Introduction

RPGMS models the organisation through a structured Business Architecture.

The Business Architecture separates long-lived Business Objects from temporary Business Transactions while maintaining explicit ownership of Business Truth throughout the resident lifecycle.

This separation ensures that organisational responsibilities remain clear, Business Truth has a single authoritative owner, and business processes remain independent of implementation technology.

Every business capability within RPGMS shall conform to this architectural model.

The Business Architecture consists of:

- Business Objects
- Business Transactions
- Business Ownership
- Business Relationships
- Operational Business Domains
- Business Events

Together these components describe how organisational information is created, managed, transferred and preserved throughout the lifecycle of the business.

## 5.2 Business Objects

Business Objects represent the long-lived entities managed by the organisation.

Business Objects own Business Truth and continue to exist beyond individual business transactions.

Typical Business Objects include:

- Reservation
- Resident
- Stay
- Accommodation
- Finance

Business Objects possess the following characteristics:

- They have clearly defined business responsibilities.
- They own Business Truth.
- They have defined business lifecycles.
- They support ongoing operational management.
- They evolve throughout their lifetime while preserving business history.

Business Objects represent the enduring operational state of the organisation.

## 5.3 Business Transactions

Business Transactions establish, modify or conclude Business Truth.

Unlike Business Objects, Business Transactions do not permanently own organisational information.

Their purpose is to coordinate business activities, establish organisational commitments and transfer Business Ownership to the appropriate Business Objects.

Typical Business Transactions include:

- Admission
- Operational Checkout
- Financial Settlement

Additional Business Transactions may be introduced as the organisation evolves.

Business Transactions possess the following characteristics:

- They are temporary.
- They execute atomically.
- They coordinate multiple Business Objects.
- They establish or conclude Business Truth.
- They transfer Business Ownership.
- They generate Business Events.

Business Transactions conclude immediately after their business responsibilities have been completed.

## 5.4 Business Ownership

Business Truth shall always have one authoritative owner.

Ownership changes only through authorised Business Transactions.

Throughout the resident lifecycle, Business Ownership progresses as follows:

Expected Truth

↓

Business Transaction

↓

Business Truth

↓

Operational Ownership

↓

Historical Preservation

At every stage, Business Ownership shall remain explicit and unambiguous.

No Business Truth shall have multiple owners simultaneously.

## 5.5 Business Relationships

Business Objects operate independently while participating in clearly defined business relationships.

Business Transactions establish, modify or conclude these relationships without becoming their long-term owner.

This separation enables the organisation to evolve individual business capabilities without compromising the integrity of the overall business architecture.

Business relationships shall remain explicit, traceable and historically preserved throughout their lifecycle.

## 5.6 Operational Business Domains

Operational Business Domains organise related Business Objects according to their operational responsibilities.

Examples include:

- Accommodation
- Resident
- Stay
- Finance
- Business Events

Operational Business Domains provide organisational structure while preserving the independence of each Business Object.

Business Transactions coordinate activities across these domains without altering their individual responsibilities.

This separation enables independent evolution of business capabilities while maintaining a consistent constitutional architecture.




---

# 6. Physical Accommodation Model

## 6.1 Purpose

The Accommodation domain represents the physical infrastructure of the PG.

It defines **where** residents stay.

It does not define commercial terms, financial rules or resident agreements.

---

## 6.2 Hierarchy

The physical accommodation hierarchy is:

Area

↓

Flat

↓

Bed

Areas exist to logically group flats.

Flats represent individual residential units.

Beds represent the smallest allocatable accommodation unit.

---

## DM-002 Physical Independence

Accommodation shall describe only the physical structure of the property.

Commercial rules such as rent, deposit, lock-in period and notice period shall not be stored within the physical accommodation hierarchy.

---

## 6.3 Areas

Areas provide logical grouping of flats.

Examples include:

- Ground Floor
- First Floor
- Premium Wing
- Block A

Areas may be used for navigation, reporting and operational management.

Deleting an Area shall only be permitted when doing so does not violate accommodation integrity.

---

## 6.4 Flats

A Flat represents an independent residential unit.

A Flat contains one or more Beds.

Each Flat references one Accommodation Plan which defines its default commercial offering.

Typical Flat information includes:

- Flat Number
- Area
- Capacity
- Accommodation Plan
- Status

The Flat itself does not determine rent or deposit.

---

## DM-003 Accommodation Plan Assignment

Every Flat shall reference one active Accommodation Plan.

Changing the Accommodation Plan affects future admissions only.

Existing Stays retain the commercial terms agreed at the time of admission unless explicitly revised.

---

## 6.5 Beds

Beds are the smallest allocatable accommodation unit.

Residents occupy Beds through a Stay.

A Bed has an operational status independent of the Resident.

Typical statuses include:

- Vacant
- Occupied
- Reserved
- Maintenance
- Blocked

---

## DM-004 Bed Ownership

Beds belong to Flats.

Residents never own Beds.

Residents receive occupancy rights through an active Stay.

---

# 7. Commercial Model

## 7.1 Accommodation Plans

Accommodation Plans define the default commercial offering associated with one or more Flats.

Accommodation Plans separate business policy from physical accommodation.

This allows multiple Flats to share identical commercial rules while remaining physically independent.

---

## 7.2 Accommodation Plan Responsibilities

Accommodation Plans may define:

Commercial Terms

- Monthly Rent
- Security Deposit
- Lock-in Period
- Notice Period

Included Services

- Electricity Policy
- Laundry Policy
- Internet Entitlement
- Parking Entitlement
- Meal Plan (future)

Additional Benefits

- Premium Services
- Special Facilities
- Future Commercial Features

---

## DM-005 Commercial Independence

Commercial policies shall belong to Accommodation Plans rather than Flats.

This enables business policy changes without modifying physical accommodation records.

---

## 7.3 Admission

During Admission, the selected Accommodation Plan provides the default commercial terms for the Stay.

The operator may modify these values where business policy permits.

The agreed values become part of the Stay and are independent of future Accommodation Plan changes.

---

## DM-006 Agreement Preservation

Accommodation Plans represent default commercial offerings.

A Stay records the agreed commercial terms accepted by the resident.

Historical agreements shall remain unchanged even if Accommodation Plans are modified later.

---

# 8. Resident Model

## 8.1 Purpose

A Resident represents a person who has, currently has, or may in the future have a relationship with the organisation.

The Resident is a permanent business entity and represents the individual rather than a particular stay or reservation.

A Resident may reserve accommodation multiple times and may have multiple Stays throughout their lifetime.

---

## 8.2 Resident Responsibilities

The Resident domain is responsible for maintaining permanent personal information including:

- Personal Details
- Contact Information
- Government Identification
- Emergency Contacts
- Family Information
- Vehicle Information
- Resident Notes
- Resident History

Resident information shall evolve over time through progressive data capture.

---

## RM-001 Permanent Identity

A Resident shall exist independently of Reservations and Stays.

Deleting a Resident shall not be permitted.

---

## RM-002 One Resident, Many Relationships

A Resident may have:

- Multiple Reservations
- Multiple Stays

However, a Resident may have only one Active Stay at any point in time.

---

## RM-003 Progressive Data Capture

Only information required for the current business process shall be mandatory.

Additional information may be collected during the Resident's relationship with the organisation.

---

# 9. Reservation Model

## 9.1 Purpose

A Reservation records the organisation's current expectation of a future business relationship.

It enables the organisation to plan future occupancy while preserving the distinction between expected information and confirmed Business Truth.

A Reservation creates no operational commitment, no accommodation allocation and no financial relationship.

---

## 9.2 Definition

A Reservation represents the organisation's current Expected Truth.

It is neither:

- a Resident,
- a Stay,
- an operational commitment,
- nor an accommodation allocation.

A Reservation records provisional business information that may ultimately lead to a future business transaction.

---

## 9.3 Business Responsibility

The Reservation domain is responsible for managing Expected Truth.

Its responsibilities include:

- Expected joining information
- Expected commercial terms
- Accommodation preferences
- Reservation notes
- Other provisional business information

Reservation supports business planning without creating operational Business Truth.

---

## 9.4 Business Ownership

Reservation is the sole owner of Expected Truth.

Expected Truth remains provisional until an authorised business transaction establishes Business Truth.

Reservation does not own:

- Resident
- Stay
- Accommodation Allocation
- Financial Relationship

---

## 9.5 Reservation Lifecycle

Every Reservation follows one of the following lifecycle states:

- Active
- Converted
- Cancelled

A Reservation remains Active until it is either:

- successfully converted through an authorised business transaction, or
- cancelled.

Reservations do not expire.

---

## RS-001 Expected Truth

Reservation shall always represent Expected Truth.

---

## RS-002 Ownership

Reservation shall be the sole owner of Expected Truth.

---

## RS-003 Operational Independence

Reservation shall not establish operational Business Truth.

---

## RS-004 Resource Independence

Reservation shall not allocate operational resources.

---

## RS-005 Lifecycle Integrity

Every Reservation shall follow the defined Reservation lifecycle.

---

## RS-006 Historical Preservation

Reservation history shall be preserved through Business Events.

---

# 10. Admission Model

## 10.1 Purpose

Admission establishes operational business relationships through an authorised Business Transaction.

It represents the organisational commitment that transforms Expected Truth into confirmed Business Truth and establishes the operational foundation required for Residency.

Admission itself owns no continuing operational state.

---

## 10.2 Definition

Admission is an atomic Business Transaction.

It is not a long-lived Business Object.

Its purpose is to establish Business Truth, create operational business relationships and transfer Business Ownership to the appropriate Business Objects.

Admission concludes immediately after its business responsibilities have been completed.

---

## 10.3 Business Responsibility

The Admission Transaction is responsible for:

- Establishing Business Truth.
- Creating operational business relationships.
- Transferring Business Ownership.
- Initialising operational residency.
- Generating Business Events.

Admission coordinates these activities but retains no continuing operational responsibility after completion.

---

## 10.4 Business Ownership

Admission temporarily coordinates the establishment of Business Truth.

Upon successful completion of the transaction, Business Ownership transfers to the appropriate Business Objects.

Admission retains no permanent ownership.

---

## 10.5 Business Relationships

Admission establishes operational relationships between the organisation and the resident.

These relationships include:

- Resident
- Stay
- Accommodation
- Finance

Admission coordinates the creation of these relationships without becoming their long-term owner.

---

## 10.6 Business Transaction

Admission is an atomic Business Transaction.

The transaction shall either:

- complete successfully in its entirety, or
- complete no business changes.

Partial completion is not a valid business state.

Business Truth is established only upon successful completion of the Admission Transaction.

---

## ADM-001 Business Transaction

Admission shall always be modelled as a Business Transaction.

---

## ADM-002 Business Truth

Admission shall establish Business Truth.

---

## ADM-003 Ownership Transfer

Admission shall transfer Business Ownership to the appropriate Business Objects.

---

## ADM-004 Atomic Execution

Admission shall execute atomically.

---

## ADM-005 Operational Relationships

Admission shall establish the operational business relationships required for Residency.

---

## ADM-006 Historical Preservation

Admission shall preserve complete business history through Business Events.

---

# 11. Stay Model

## 11.1 Purpose

A Stay represents the contractual and operational relationship between a Resident and the organisation.

A Stay owns the Operational Truth established through an authorised Business Transaction.

Once established, the Stay becomes the authoritative operational record of a resident's occupancy until the residency concludes.

A Stay begins at Admission and concludes only after both operational checkout and financial settlement have been completed.

A Resident may have multiple Stays throughout their lifetime, but only one Active Stay at any point in time.

---

## ST-001 Stay Lifecycle

A Stay progresses through the following business lifecycle:

Reservation (Optional)

↓

Admission

↓

Active Stay

↓

Stay Management

↓

Operational Checkout

↓

Financial Settlement

↓

Completed Stay

↓

Resident becomes Alumni

---

## 11.2 Stay Responsibilities

A Stay is the central business entity that connects all operational and financial activities performed during the Resident's occupancy.

The Stay owns:

- Agreed Commercial Terms
- Occupancy
- Deposit Account
- Financial Relationship
- Door ID Assignment
- Business Events
- Operational Status
- Financial Status

The Stay acts as the central hub linking multiple business domains.

The Stay is the authoritative owner of Operational Truth throughout the resident lifecycle.

Operational Truth includes occupancy, accommodation assignment, residency status and other operational information required to manage an active or completed residency.
---

## ST-002 Central Business Entity

All operational and financial activities performed during a Resident's occupancy shall be linked to a Stay.

The Stay provides the single point of reference for the Resident's relationship with the organisation.

---

# 11.3 Occupancy

Occupancy represents the Resident's right to use one or more Beds during a Stay.

Occupancy is independent of the Resident and independent of the Bed.

Occupancy begins through Admission and may change during the Stay.

Examples include:

- Additional Bed Allocation
- Bed Release
- Bed Transfer
- Flat Transfer

Each occupancy change generates a Business Event.

---

## ST-003 Multiple Bed Support

A Stay may occupy one or more Beds simultaneously.

Multiple Bed occupancy supports business scenarios including:

- Exclusive room occupancy
- Additional bed rental
- Future commercial expansion

---

# 11.4 Commercial Agreement

The Stay records the commercial agreement accepted during Admission.

Typical commercial information includes:

- Agreed Monthly Rent
- Agreed Security Deposit
- Agreed Lock-in Period
- Agreed Notice Period
- Applied Accommodation Plan

These values represent the contractual agreement with the Resident.

Future Accommodation Plan changes do not modify existing agreements.

---

## ST-004 Agreement Preservation

Commercial agreements recorded within a Stay represent the agreed terms between the organisation and the Resident.

These agreements remain historically preserved throughout the lifetime of the Stay.

---

# 11.5 Operational Status

Operational Status reflects the physical state of the Stay.

Typical statuses include:

- Active
- On Notice
- Checked Out

Operational Status determines accommodation occupancy.

---

# 11.6 Financial Status

Financial Status reflects the financial relationship between the organisation and the Resident.

Typical statuses include:

- Open
- Settlement Pending
- Closed

Financial Status determines whether financial obligations remain outstanding.

---

## ST-005 Operational and Financial Independence

Operational Status and Financial Status are independent.

A Resident may complete Operational Checkout while Financial Settlement remains pending.

The Stay is considered fully complete only after both Operational Status and Financial Status have been closed.

---

# 11.7 Deposit Account

Every Stay owns one Deposit Account.

The Deposit Account records:

- Required Deposit
- Current Deposit Balance
- Deposit Transactions

The Deposit Account supports:

- Partial Deposit Collection
- Additional Deposit Payments
- Deposit Advances
- Deposit Advance Returns
- Deposit Adjustments
- Final Refunds

The Deposit Account remains active until Financial Settlement is completed.

---

## ST-006 Deposit Ownership

Deposit Accounts belong to the Stay.

Deposits shall never exist independently of a Stay.

---

### ST-007 Operational Truth

The Stay shall remain the sole owner of Operational Truth throughout the residency lifecycle.

---

# 11.8 Connected Business Domains

A Stay acts as the central connection point for multiple business domains.

These include:

Accommodation

- Occupancy
- Bed Allocation

Finance

- Ledger
- Payments
- Billing
- Deposit Account

Operations

- Door ID
- Laundry
- Electricity
- Internet
- Maintenance
- Housekeeping

Resident

- Personal Information
- Vehicle Information
- Notes

Every connected domain contributes to the overall lifecycle of the Stay.

---

## ST-008 Business Hub

The Stay functions as the operational hub of RPGMS.

Business modules remain independent while interacting through the Stay.

---

# 11.9 Business Events

Every significant business operation performed during a Stay generates one or more Business Events.

Examples include:

- Stay Created
- Bed Allocated
- Additional Bed Allocated
- Bed Released
- Flat Transferred
- Deposit Received
- Deposit Advance
- Deposit Returned
- Rent Revised
- Accommodation Plan Changed
- Door ID Assigned
- Door ID Returned
- Notice Given
- Notice Cancelled
- Operational Checkout
- Financial Settlement Started
- Deposit Refunded
- Stay Closed

Business Events provide a complete chronological history of the Stay.

---

## ST-009 Event Driven History

Business history shall be preserved through immutable Business Events.

Significant business activities shall not overwrite historical information where event recording provides business value.

---

# 12. Stay Management

## 12.1 Purpose

Stay Management represents all business operations performed after Admission and before Operational Checkout.

During this period, the Resident is actively occupying accommodation and interacting with multiple operational and financial services provided by the organisation.

Stay Management ensures that every significant business activity is properly recorded, financially accounted for, and historically preserved.

---

## SM-001 Operational Scope

Stay Management begins immediately after Admission and concludes when Operational Checkout is completed.

All business operations performed during this period shall be associated with the active Stay.

---

# 12.2 Business Operations

Business operations modify different aspects of a Stay without altering its identity.

Operations are grouped according to their business purpose.

---

## 12.3 Accommodation Operations

Accommodation Operations affect the Resident's physical occupancy.

Typical operations include:

- Allocate Additional Bed
- Release Bed
- Transfer Bed
- Transfer Flat
- Change Accommodation Plan
- Temporary Bed Blocking (Future)

Every Accommodation Operation generates one or more Business Events.

---

## 12.4 Financial Operations

Financial Operations affect the commercial or financial relationship between the organisation and the Resident.

Typical operations include:

- Receive Deposit
- Receive Additional Deposit
- Deposit Advance
- Deposit Advance Return
- Rent Revision
- Deposit Revision
- Manual Financial Adjustment
- Approved Discount

Financial Operations create financial transactions and corresponding Business Events.

Financial balances shall be derived from recorded transactions rather than manual updates.

---

## 12.5 Access Operations

Access Operations manage physical access to the property.

Typical operations include:

- Assign Door ID
- Replace Door ID
- Recover Lost Door ID
- Return Door ID

Access Operations do not directly affect financial records unless business policy specifies otherwise.

---

## 12.6 Resident Operations

Resident Operations update permanent Resident information.

Typical operations include:

- Update Contact Information
- Update Government Identification
- Update Emergency Contact
- Update Photograph
- Update Vehicle Information

Resident Operations modify the Resident Profile without changing the commercial agreement.

---

## 12.7 Administrative Operations

Administrative Operations record operational events that influence management decisions.

Typical operations include:

- Notice Given
- Notice Cancelled
- Warning Issued
- Rule Violation Recorded
- Appreciation Note
- Internal Remarks

Administrative Operations may contribute to future Resident Intelligence analysis.

---

## SM-002 Business Operations

Business operations shall modify a Stay through defined business processes rather than direct modification of stored values.

Significant operations shall generate Business Events.

---

# 12.8 Business Operation Categories

Business operations are classified into four categories.

### Informational Operations

Examples:

- Contact Update
- Photograph Update
- Vehicle Update

These operations have no commercial or financial impact.

---

### Operational Operations

Examples:

- Bed Transfer
- Flat Transfer
- Door ID Replacement
- Notice
- Operational Checkout

These operations affect day-to-day business activities.

---

### Commercial Operations

Examples:

- Rent Revision
- Deposit Revision
- Accommodation Plan Change
- Discount Approval

These operations modify the commercial agreement between the organisation and the Resident.

---

### Financial Operations

Examples:

- Deposit Collection
- Deposit Advance
- Deposit Refund
- Financial Adjustment

These operations create financial transactions within the Finance domain.

---

## SM-003 Operation Classification

Business operations shall be classified according to their business impact.

This classification may be used for permissions, approvals, reporting and future workflow enhancements.

---

# 12.9 Timeline

Every significant Stay operation contributes to the Stay Timeline.

The Timeline provides a complete chronological history of operational and financial activities.

The Timeline is intended to support:

- Operational Visibility
- Auditability
- Customer Dispute Resolution
- Historical Analysis
- Future AI-assisted Decision Support

---

## SM-004 Timeline Integrity

Timeline entries are immutable records of business activity.

Timeline entries shall not be deleted or modified except through authorised administrative correction procedures.

---

# 12.10 Business Philosophy

A Stay is not modified by editing individual fields.

A Stay evolves through Business Operations.

Each Business Operation produces one or more Business Events which collectively describe the complete history of the Stay.

This event-driven approach preserves accountability, transparency and historical traceability throughout the Resident lifecycle.

---

## SM-005 Event-Driven Stay Management

The state of a Stay shall evolve through Business Operations.

Business history shall be preserved through Business Events rather than direct replacement of historical information.

---

# 13. Deposit Account Model

## 13.1 Purpose

The Deposit Account represents the Security Deposit held by the organisation on behalf of a Resident during an active Stay.

Unlike ordinary financial transactions, the Deposit Account is a dedicated financial account that records the complete lifecycle of the Resident's Security Deposit.

The Deposit Account supports partial collections, temporary withdrawals, adjustments, recoveries and final settlement.

---

## DP-001 Deposit Ownership

Every Stay shall own exactly one Deposit Account.

A Deposit Account cannot exist independently of a Stay.

A Resident does not own a Deposit Account directly.

---

## 13.2 Security Deposit

The agreed Security Deposit is established during Admission.

The default value is obtained from the selected Accommodation Plan.

The operator may modify the agreed amount where business policy permits.

The agreed Security Deposit represents the target deposit to be maintained throughout the Stay.

---

## DP-002 Agreed Security Deposit

The agreed Security Deposit forms part of the commercial agreement recorded within the Stay.

Future Accommodation Plan changes shall not modify the agreed Security Deposit.

---

# 13.3 Deposit Account

Each Deposit Account maintains three independent concepts.

### Agreed Security Deposit

The amount agreed between the organisation and the Resident.

---

### Current Deposit Balance

The amount currently held by the organisation.

The Current Deposit Balance is always derived from Deposit Transactions.

It shall not be manually maintained.

---

### Deposit Transactions

Every movement affecting the Deposit Account shall be recorded as an individual Deposit Transaction.

---

## DP-003 Financial Traceability

The Current Deposit Balance shall always be calculated from Deposit Transactions.

Manual balance maintenance is prohibited.

---

# 13.4 Deposit Transactions

Every Deposit Transaction records a financial event affecting the Deposit Account.

Typical transaction information includes:

- Transaction Date
- Transaction Type
- Amount
- Description
- Operator
- Reference
- Notes

Each transaction becomes part of the permanent financial history of the Stay.

---

## 13.5 Deposit Transaction Types

Typical Credit Transactions include:

- Initial Deposit Received
- Additional Deposit Received
- Deposit Top-up
- Deposit Advance Returned
- Positive Manual Adjustment

Typical Debit Transactions include:

- Deposit Advance
- Electricity Recovery
- Laundry Recovery
- Damage Recovery
- Rent Recovery (where permitted)
- Final Refund
- Negative Manual Adjustment

Additional transaction types may be introduced as business requirements evolve.

---

## DP-004 Deposit Transaction Integrity

Deposit Transactions are immutable financial records.

Corrections shall be performed through compensating transactions rather than modification of historical records.

---

# 13.6 Partial Collections

Residents may pay the Security Deposit in multiple instalments.

Each instalment creates an independent Deposit Transaction.

The Deposit Account remains active until the agreed Security Deposit has been collected or otherwise adjusted.

---

## DP-005 Partial Deposit Collection

The system shall support multiple Deposit Transactions contributing towards the agreed Security Deposit.

---

# 13.7 Deposit Advances

The organisation may temporarily return a portion of the Resident's Security Deposit during an active Stay.

This represents a temporary reduction in the Deposit Account balance.

Residents may subsequently replenish the Deposit Account by returning the advanced amount.

Deposit Advances are business decisions made by the operator and remain fully traceable through Deposit Transactions.

---

## DP-006 Deposit Advance

Deposit Advances shall be recorded as Deposit Transactions.

Repayment of a Deposit Advance shall create a new Deposit Transaction.

Historical Deposit Transactions shall never be modified.

---

# 13.8 Deposit Settlement

The Deposit Account remains active after Operational Checkout until Financial Settlement has been completed.

Typical settlement activities include:

- Electricity Recovery
- Laundry Recovery
- Damage Recovery
- Outstanding Financial Recoveries
- Final Refund

Only after all settlement activities have been completed shall the Deposit Account be closed.

---

## DP-007 Deposit Closure

A Deposit Account shall be closed only after Financial Settlement has been completed and the Current Deposit Balance becomes zero.

---

# 13.9 Business Events

Every Deposit Transaction generates one or more Business Events.

Examples include:

- Deposit Received
- Additional Deposit Received
- Deposit Advance
- Deposit Advance Returned
- Deposit Adjusted
- Deposit Refunded
- Deposit Account Closed

These events contribute to the complete business history of the Stay.

---

## DP-008 Event-Driven Deposit Management

The Deposit Account shall evolve exclusively through Deposit Transactions.

The complete financial history of the Deposit Account shall remain permanently auditable.

## DP-009 Standard Business Terminology

RPGMS shall use consistent business terminology throughout the application, documentation, reports and database.

The temporary withdrawal of funds from a Resident's Deposit Account shall be referred to as a **Deposit Advance**.

The informal operational term "Hand Loan" shall not be used within the system.

---

# 14. Finance Model

## 14.1 Purpose

The Finance domain records, manages and reports all monetary transactions arising from the organisation's business operations.

The Finance domain provides complete financial traceability throughout the lifecycle of a Stay.

All financial records shall be accurate, auditable and historically preserved.

---

## FI-001 Financial Responsibility

The Finance domain is responsible for recording financial obligations and financial settlements.

Business operations may initiate financial activities, but the Finance domain remains the authoritative source of financial information.

---

# 14.2 Financial Principles

The Finance domain is built upon the following principles.

- Every financial movement shall be recorded.
- Financial history shall never be lost.
- Financial balances shall be derived from recorded transactions.
- Financial corrections shall preserve audit history.
- Business operations shall not directly modify financial balances.

---

## FI-002 Financial Integrity

Financial balances shall always be calculated from recorded financial transactions.

Stored balances may be maintained for performance purposes but shall always be reconcilable with the underlying transaction history.

---

# 14.3 Financial Components

The Finance domain consists of several independent components.

### Billing

Creates financial charges.

Examples:

- Monthly Rent
- Electricity
- Laundry
- Internet
- Maintenance Charges
- Miscellaneous Charges

---

### Payments

Records money received from Residents.

Examples:

- Rent Payment
- Deposit Payment
- Electricity Payment
- Laundry Payment
- Advance Payment

---

### Adjustments

Records approved increases or reductions.

Examples:

- Discount
- Penalty
- Credit Adjustment
- Debit Adjustment
- Write-off

---

### Deposit Account

The Deposit Account is a specialised financial component governed by Chapter 13.

Although financially related, it follows its own business rules and lifecycle.

---

## FI-003 Separation of Financial Components

Billing, Payments, Adjustments and Deposit Accounts are independent financial components.

Each component shall maintain its own business rules while contributing to the overall financial position of the Stay.

---

# 14.4 Financial Obligations

Financial obligations arise from business activities performed during a Stay.

Examples include:

- Monthly Rent
- Electricity Consumption
- Laundry Services
- Internet Upgrades
- Maintenance Recoveries
- Damage Recoveries

Financial obligations may be recurring or one-time.

---

## 14.5 Billing

Billing converts financial obligations into billable charges.

Billing may occur:

- Automatically
- On Schedule
- On Demand
- Through approved manual processes

Each billing operation generates financial transactions and Business Events.

---

## FI-004 Billing Independence

The Billing Engine determines when charges are created.

Payment collection is independent of Billing.

Creating a bill does not imply payment has been received.

---

# 14.6 Payments

Payments reduce outstanding financial obligations.

Each payment records:

- Payment Date
- Amount
- Payment Method
- Reference
- Received By
- Notes

Payments are immutable financial records.

---

## FI-005 Payment Traceability

Payments shall be permanently preserved.

Corrections shall be performed using reversing or compensating transactions rather than editing payment history.

---

# 14.7 Financial Ledger

The Financial Ledger provides the complete chronological history of all financial activity during a Stay.

Typical ledger entries include:

- Bill Generated
- Payment Received
- Adjustment Applied
- Deposit Transaction Reference
- Refund Issued

The Financial Ledger represents the authoritative financial history of the Stay.

---

## FI-006 Ledger Integrity

The Financial Ledger shall maintain a complete, chronological and auditable record of financial activity.

Ledger entries shall not be deleted.

---

# 14.8 Outstanding Balance

The outstanding balance represents the amount currently owed by or to the Resident.

The outstanding balance is derived from:

- Bills
- Payments
- Adjustments
- Refunds

Deposit Account balances are managed separately and shall not be merged into ordinary outstanding balances.

---

## FI-007 Balance Calculation

Outstanding balances shall always be derived from recorded financial transactions.

Manual modification of outstanding balances is prohibited.

---

# 14.9 Business Events

Financial activities generate Business Events.

Examples include:

- Bill Generated
- Payment Received
- Bill Adjusted
- Discount Approved
- Refund Issued
- Write-off Approved

These events contribute to the complete operational history of the Stay.

---

## FI-008 Event-Driven Finance

The Finance domain shall preserve financial history through immutable financial records and Business Events.

Financial transparency shall take precedence over convenience.

---

# 15. Business Events & Timeline

## 15.1 Purpose

Business Events record significant activities performed during the lifecycle of a Stay.

Each Business Event represents a completed business operation and contributes to the permanent operational history of the Stay.

Collectively, these events form the Stay Timeline, providing a complete chronological record of the Resident's relationship with the organisation.

---

## BE-001 Event-Driven Business Model

RPGMS shall preserve business history through immutable Business Events.

Significant business activities shall generate Business Events rather than replacing or deleting historical information.

---

# 15.2 Business Event Principles

Business Events are based on the following principles.

- Events represent completed business activities.
- Events are immutable.
- Events are recorded chronologically.
- Events contribute to the Stay Timeline.
- Events provide operational transparency and auditability.
- Events may trigger business processes in other domains.

---

## BE-002 Event Integrity

Business Events shall not be modified or deleted through normal business operations.

Where corrections are necessary, compensating Business Events shall be created to preserve historical accuracy.

---

# 15.3 Stay Timeline

The Stay Timeline is the chronological record of all significant Business Events associated with a Stay.

The Timeline provides a single operational view of the Resident's journey from Admission through Financial Settlement.

The Timeline is intended to support:

- Daily Operations
- Management Review
- Customer Dispute Resolution
- Audit
- Historical Analysis
- Future AI-assisted Decision Support

---

## BE-003 Timeline Ownership

Each Stay owns one Timeline.

Business Events from all operational domains contribute to that Timeline.

---

# 15.4 Typical Business Events

Examples of Business Events include:

### Admission

- Resident Admitted
- Accommodation Plan Applied
- Stay Created
- Deposit Account Created

---

### Accommodation

- Bed Allocated
- Additional Bed Allocated
- Bed Released
- Bed Transfer
- Flat Transfer

---

### Commercial

- Rent Revised
- Deposit Revised
- Accommodation Plan Changed
- Discount Approved

---

### Finance

- Bill Generated
- Payment Received
- Adjustment Applied
- Refund Issued

---

### Deposit Account

- Deposit Received
- Deposit Advance
- Deposit Advance Return
- Deposit Refunded
- Deposit Account Closed

---

### Services

- Laundry Collected
- Laundry Returned
- Internet Plan Changed
- Vehicle Registered
- Door ID Assigned
- Door ID Returned

---

### Administration

- Notice Given
- Notice Cancelled
- Warning Issued
- Rule Violation Recorded
- Internal Note Added

---

### Checkout

- Operational Checkout Started
- Accommodation Released
- Financial Settlement Started
- Financial Settlement Completed
- Stay Closed
- Resident Became Alumni

---

## BE-004 Cross-Domain Visibility

Business Events may originate from different business domains while contributing to a unified Stay Timeline.

The Timeline shall present these events in chronological order regardless of their originating domain.

---

# 15.5 Event Information

Each Business Event should record sufficient information to explain what occurred.

Typical information includes:

- Event Date and Time
- Event Type
- Related Stay
- Related Resident
- Related Business Domain
- Operator
- Reference Number
- Description
- Supporting Notes

Additional attributes may be recorded where required by the originating business domain.

---

## BE-005 Event Context

Each Business Event shall contain sufficient contextual information to support operational understanding and historical review.

---

# 15.6 Timeline Presentation

The Timeline is an operational view intended for people rather than accounting systems.

Timeline entries should be presented in chronological order using clear business terminology.

Examples include:

- Resident admitted.
- Bed transferred from G01-B3 to G02-B1.
- Deposit Advance of ₹2,000 issued.
- Laundry batch collected.
- Monthly rent billed.
- Payment of ₹6,500 received.
- Operational Checkout completed.
- Final Deposit Refund issued.
- Stay closed.

The Timeline should describe business activity in language that is meaningful to operators.

---

## BE-006 Human-Centred Timeline

Timeline entries shall prioritise operational clarity over technical implementation details.

Descriptions should use the standard business terminology defined by RPGMS.

---

# 15.7 Future Event Usage

Business Events provide the foundation for future capabilities including:

- Resident Intelligence
- Operational Analytics
- Predictive Alerts
- AI-assisted Recommendations
- Audit Reporting
- Process Automation

These capabilities rely on the complete and accurate recording of Business Events.

---

## BE-007 Future Extensibility

The Business Event framework shall support future business capabilities without requiring changes to previously recorded events.

---

## BE-008 Significant Business Activities

Business Events shall be generated only for significant business activities that have operational, commercial, financial or administrative significance.

Routine maintenance of master data does not normally constitute a Business Event unless required by business policy.

---

# 16. Operational Checkout

## 16.1 Purpose

Operational Checkout represents the completion of the Resident's physical occupancy of the accommodation.

Operational Checkout releases accommodation resources and concludes the operational phase of the Stay.

Operational Checkout does not complete the financial relationship between the organisation and the Resident.

---

## CO-001 Separation of Checkout and Settlement

Operational Checkout and Financial Settlement are independent business processes.

Completing Operational Checkout does not imply that all financial obligations have been settled.

---

# 16.2 Operational Checkout Lifecycle

The Operational Checkout process generally follows the sequence below.

Notice Given

↓

Checkout Preparation

↓

Accommodation Inspection

↓

Resident Vacates

↓

Accommodation Released

↓

Operational Checkout Completed

↓

Financial Settlement Pending

---

## CO-002 Operational Completion

Operational Checkout is complete when the Resident has vacated the accommodation and all allocated accommodation resources have been released.

---

# 16.3 Operational Responsibilities

Operational Checkout is responsible for concluding operational activities associated with the Stay.

Typical responsibilities include:

- Release all occupied Beds
- Release Flat occupancy
- Recover Door ID (where applicable)
- Record final accommodation condition
- Record checkout date and time
- Close operational access
- Generate Business Events

Operational Checkout shall not perform financial settlement activities.

---

## CO-003 Accommodation Release

All accommodation allocated to the Stay shall be released during Operational Checkout.

Released accommodation becomes available for future allocation.

---

# 16.4 Financial Independence

Following Operational Checkout, financial obligations may still remain outstanding.

Examples include:

- Pending Electricity Charges
- Laundry Charges
- Damage Recovery
- Outstanding Rent
- Deposit Adjustment
- Final Deposit Refund

These obligations shall be managed during Financial Settlement.

---

## CO-004 Financial Continuity

The Stay remains financially active after Operational Checkout until Financial Settlement has been completed.

---

# 16.5 Operational Status

Operational Status progresses as follows.

Active

↓

On Notice

↓

Checked Out

Once Operational Checkout has been completed, the Resident no longer occupies accommodation.

The Stay may nevertheless remain financially active.

---

## CO-005 Operational Status Management

Operational Status reflects physical occupancy only.

Financial obligations shall not affect Operational Status.

---

# 16.6 Business Events

Operational Checkout generates Business Events including:

- Notice Given
- Notice Cancelled
- Checkout Initiated
- Bed Released
- Flat Released
- Door ID Returned
- Operational Checkout Completed

These events become part of the Stay Timeline.

---

## CO-006 Operational Traceability

Operational Checkout shall preserve a complete operational history through Business Events.

---

# 16.7 Business Philosophy

Operational Checkout concludes occupancy.

It does not conclude the Stay.

A Stay is considered operationally complete only after accommodation has been released.

The Stay itself concludes only after Financial Settlement has also been completed.

---

## CO-007 Dual Lifecycle Principle

RPGMS recognises two independent business lifecycles:

- Operational Lifecycle
- Financial Lifecycle

A Stay is completed only when both lifecycles have concluded.

---

# 17. Financial Settlement

## 17.1 Purpose

Financial Settlement represents the final reconciliation of all financial obligations arising from a Stay.

The objective of Financial Settlement is to ensure that every financial obligation has been identified, accounted for and resolved before the Stay is permanently closed.

Financial Settlement begins after Operational Checkout and concludes only when all financial matters have been settled.

---

## FS-001 Financial Closure

A Stay shall not be financially closed until all outstanding financial obligations have been resolved.

---

# 17.2 Settlement Lifecycle

The Financial Settlement process generally follows the sequence below.

Operational Checkout Completed

↓

Outstanding Obligations Identified

↓

Final Charges Calculated

↓

Deposit Adjustments Applied

↓

Outstanding Payments Collected (if any)

↓

Final Deposit Refund Processed (if applicable)

↓

Financial Settlement Completed

↓

Stay Financially Closed

---

## FS-002 Settlement Sequence

Financial Settlement shall commence only after Operational Checkout has been completed.

---

# 17.3 Settlement Responsibilities

Financial Settlement is responsible for completing all remaining financial activities associated with the Stay.

Typical responsibilities include:

- Final Rent Verification
- Electricity Recovery
- Laundry Recovery
- Damage Recovery
- Miscellaneous Recoveries
- Deposit Account Reconciliation
- Outstanding Payment Collection
- Final Deposit Refund
- Financial Closure

---

## FS-003 Financial Reconciliation

Financial Settlement shall reconcile all financial obligations before closing the Stay.

No outstanding financial balance shall remain after Financial Settlement has been completed.

---

# 17.4 Outstanding Financial Obligations

Outstanding obligations may include, but are not limited to:

- Unpaid Rent
- Electricity Charges
- Laundry Charges
- Internet Charges
- Damage Recovery
- Maintenance Recovery
- Approved Adjustments
- Other Miscellaneous Charges

Each obligation shall be individually reviewed during Financial Settlement.

---

## FS-004 Complete Review

Financial Settlement shall consider all financial components associated with the Stay before determining the final balance.

---

# 17.5 Deposit Reconciliation

The Deposit Account shall be reconciled as part of Financial Settlement.

Typical activities include:

- Verify Current Deposit Balance
- Apply Approved Recoveries
- Apply Final Adjustments
- Calculate Refundable Balance
- Process Final Deposit Refund
- Close Deposit Account

Deposit reconciliation concludes only after the Deposit Account balance becomes zero.

---

## FS-005 Deposit Reconciliation

The Deposit Account shall be fully reconciled before Financial Settlement can be completed.

---

# 17.6 Financial Outcomes

Financial Settlement concludes with one of the following outcomes.

### Refund Due

The organisation returns the remaining Deposit Account balance to the Resident.

---

### Amount Recoverable

The Resident owes additional money after the Deposit Account has been exhausted.

---

### Fully Settled

No money is payable by either party.

---

## FS-006 Settlement Outcome

Financial Settlement shall clearly identify the final financial position between the organisation and the Resident.

---

# 17.7 Financial Status

Financial Status progresses through the following lifecycle.

Open

↓

Settlement Pending

↓

Closed

Financial Status reflects only the financial relationship between the organisation and the Resident.

---

## FS-007 Financial Status Management

Financial Status shall remain independent of Operational Status.

---

# 17.8 Business Events

Financial Settlement generates Business Events including:

- Settlement Started
- Final Charges Applied
- Deposit Reconciled
- Final Deposit Refund Issued
- Additional Recovery Recorded
- Financial Settlement Completed
- Deposit Account Closed

These events become part of the Stay Timeline.

---

## FS-008 Financial Traceability

Financial Settlement shall preserve a complete audit trail through immutable financial records and Business Events.

---

# 17.9 Business Philosophy

Financial Settlement represents the conclusion of the financial relationship between the organisation and the Resident.

Only after Financial Settlement has been completed may the Stay be considered financially complete.

A Stay reaches its final state only after both Operational Checkout and Financial Settlement have been successfully completed.

---

## FS-009 Dual Completion Principle

A Stay is fully completed only when:

- Operational Checkout has been completed; and
- Financial Settlement has been completed.

Only then may the Resident transition to Alumni status.

---

## FS-010 Settlement Flexibility

Financial Settlement may span multiple business interactions until all financial obligations have been resolved.

The settlement process shall remain open until Financial Status becomes Closed.

---

# 18. Alumni Model

## 18.1 Purpose

The Alumni Model preserves the long-term relationship between the organisation and former Residents.

An Alumni represents a Resident whose Stay has been fully completed following both Operational Checkout and Financial Settlement.

The Alumni Model ensures that historical information remains permanently available for operational reference, reporting and future business relationships.

---

## AL-001 Permanent Resident History

Residents shall never be deleted after completing a Stay.

Upon completion of all operational and financial activities, the Resident transitions to Alumni status.

---

# 18.2 Transition to Alumni

A Resident becomes Alumni only after all of the following conditions have been satisfied:

- Operational Checkout Completed
- Financial Settlement Completed
- Deposit Account Closed
- Financial Status Closed
- Stay Closed

Only after these conditions have been met shall the Resident's current Stay be considered complete.

---

## AL-002 Alumni Eligibility

A Resident shall transition to Alumni status only after the associated Stay has reached full operational and financial completion.

---

# 18.3 Alumni Responsibilities

The Alumni Model preserves the complete historical record of the Resident's relationship with the organisation.

This includes:

- Resident Profile
- Reservation History
- Stay History
- Accommodation History
- Deposit History
- Financial History
- Business Timeline
- Administrative History

The historical record remains available for authorised operational and management purposes.

---

## AL-003 Historical Preservation

Historical information associated with completed Stays shall remain permanently available unless removed in accordance with applicable legal or regulatory requirements.

---

# 18.4 Future Admissions

An Alumni may return to the organisation in the future.

When this occurs:

- The existing Resident record shall be reused.
- A new Reservation may be created.
- A new Stay shall be created.
- A new Deposit Account shall be created.
- Previous Stays shall remain unchanged.

Each Stay represents an independent contractual relationship.

---

## AL-004 Resident Reuse

Future admissions shall reuse the existing Resident record.

Historical Stays shall remain immutable and independent of future Stays.

---

# 18.5 Historical Analysis

The Alumni Model supports long-term business analysis including:

- Repeat Residency
- Resident Retention
- Occupancy Trends
- Revenue Analysis
- Resident Behaviour Patterns
- Operational Performance
- Future AI-assisted Insights

Historical information shall remain available for reporting and analytical purposes.

---

## AL-005 Analytical Value

Completed Stays shall remain available for operational reporting, business intelligence and future analytical capabilities.

---

# 18.6 Business Events

The completion of a Stay generates final Business Events including:

- Stay Closed
- Resident Transitioned to Alumni
- Deposit Account Closed
- Financial Settlement Completed

These events conclude the Stay Timeline.

---

## AL-006 Lifecycle Completion

The Stay Timeline concludes only after the Resident has transitioned to Alumni status.

---

# 18.7 Business Philosophy

A Stay concludes.

A Resident does not.

Residents remain part of the organisation's history throughout the lifetime of RPGMS.

Future relationships build upon existing Resident records rather than creating duplicate identities.

---

## AL-007 Lifetime Relationship

RPGMS recognises the Resident as a long-term business relationship rather than a temporary occupant.

The Alumni Model preserves that relationship while maintaining the historical integrity of each completed Stay.

----

## AL-008 Historical Continuity

The completion of a Stay marks the end of a contractual relationship, not the end of the Resident's relationship with the organisation.

RPGMS shall preserve complete historical continuity across multiple Reservations and Stays throughout the Resident's lifetime.

---

# Appendix A – Business Glossary

This glossary defines the official business terminology used throughout RPGMS.

These definitions are authoritative and shall be used consistently in documentation, software development, reports, user interfaces and future AI-assisted features.

---

## Accommodation

The physical facilities provided by the organisation for Resident occupancy, including Areas, Flats and Beds.

---

## Accommodation Plan

A commercial offering that defines the standard terms and services associated with accommodation.

An Accommodation Plan may include:

- Monthly Rent
- Security Deposit
- Lock-in Period
- Notice Period
- Internet Plan
- Electricity Policy
- Laundry Policy
- Parking
- Other Included Services

Accommodation Plans define default commercial terms and are independent of physical accommodation.

---

## Admission

An atomic Business Transaction that establishes Business Truth.

Admission creates the operational business relationships required for Residency, transfers Business Ownership to the appropriate Business Objects and concludes immediately after the transaction has been successfully completed.

---

## Alumni

A Resident whose Stay has been fully completed following both Operational Checkout and Financial Settlement.

An Alumni remains a permanent part of the organisation's historical records.

---

## Area

The highest level of the physical accommodation hierarchy.

An Area contains one or more Flats.

---

## Bed

The smallest physical accommodation unit that may be allocated to a Stay.

A Stay may occupy one or more Beds.

---
## Business Event

An immutable record representing a significant business activity.

Business Events preserve historical Business Truth and collectively form the Business Timeline of the relevant business capability.

---

## Commercial Agreement

The agreed commercial terms established during Admission.

Typical terms include:

- Monthly Rent
- Security Deposit
- Lock-in Period
- Notice Period
- Accommodation Plan

The Commercial Agreement belongs to the Stay and remains historically preserved.

---

## Deposit Account

A specialised financial account associated with a Stay.

The Deposit Account records the complete lifecycle of the Security Deposit through Deposit Transactions.

---

## Deposit Advance

A temporary withdrawal of funds from the Resident's Deposit Account during an active Stay.

A Deposit Advance reduces the Current Deposit Balance and may later be replenished through a Deposit Advance Return.

---

## Deposit Advance Return

A payment made by the Resident to replenish funds previously withdrawn through a Deposit Advance.

---

## Deposit Transaction

An immutable financial transaction that affects the Deposit Account.

Examples include:

- Deposit Received
- Deposit Advance
- Deposit Advance Return
- Deposit Adjustment
- Deposit Refund

---

## Financial Ledger

The complete chronological record of all financial transactions associated with a Stay.

The Financial Ledger is independent of the Stay Timeline.

---

## Financial Settlement

The business process that reconciles all financial obligations after Operational Checkout.

Financial Settlement concludes only when all outstanding obligations have been resolved.

---

## Financial Status

The current financial state of a Stay.

Typical statuses include:

- Open
- Settlement Pending
- Closed

---

## Flat

A physical accommodation unit within an Area containing one or more Beds.

---

## Operational Checkout

The business process that concludes physical occupancy and releases accommodation resources.

Operational Checkout does not conclude the financial relationship.

---

## Operational Status

The current operational state of a Stay.

Typical statuses include:

- Active
- On Notice
- Checked Out

---

## Reservation

The organisation's current Expected Truth regarding a future business relationship.

A Reservation records provisional business information required for future planning. It does not establish operational Business Truth, accommodation allocation or financial relationships.

---

## Resident

A person who has, currently has, or may in the future have a relationship with the organisation.

Residents remain permanent business entities regardless of the number of Reservations or Stays.

---

## Security Deposit

The agreed deposit amount forming part of the Commercial Agreement.

The Security Deposit is managed through the Deposit Account.

---

## Stay

The contractual and operational relationship between a Resident and the organisation.

A Stay begins with Admission and concludes only after both Operational Checkout and Financial Settlement have been completed.

---

## Stay Timeline

The complete chronological history of Business Events associated with a Stay.

The Timeline provides an operational view of the Resident's journey.

---

## Timeline

The operational history of significant Business Events associated with a Stay.

The Timeline is distinct from the Financial Ledger.

## Business Truth

Business information that has been established through an authorised Business Transaction and is owned by the appropriate Business Object.

Business Truth represents the organisation's confirmed understanding of its business state.

## Expected Truth

Provisional business information that represents the organisation's current expectation before operational commitment has been established.

Expected Truth is owned by Reservation until an authorised Business Transaction establishes Business Truth.

---

# Appendix B – Business Rule Index

This appendix provides a consolidated index of the constitutional business rules defined throughout RPGMS.

Each rule identifier is unique and may be referenced by developers, documentation, reports, AI systems and future implementation guides.

---

# Constitutional Principles

| Rule | Description |
|------|-------------|
| CP-001 | Business Before Technology |
| CP-002 | Single Source of Truth |
| CP-003 | Separation of Concerns |
| CP-004 | Preserve Business History |
| CP-005 | Event-Driven Business Model |
| CP-006 | Agreement vs Execution |
| CP-007 | Intelligent Decision Support |
| CP-008 | Progressive Data Capture |
| CP-009 | Financial Traceability |
| CP-010 | Future Extensibility |

---

# Domain Model

| Rule | Description |
|------|-------------|
| DM-001 | Domain Ownership |
| DM-002 | Physical Independence |
| DM-003 | Accommodation Plan Assignment |
| DM-004 | Bed Ownership |
| DM-005 | Commercial Independence |
| DM-006 | Agreement Preservation |

---

# Resident Model

| Rule | Description |
|------|-------------|
| RM-001 | Permanent Identity |
| RM-002 | One Resident, Many Relationships |
| RM-003 | Progressive Data Capture |

---

# Reservation Model

| Rule | Description |
|------|-------------|
| RS-001 | Resident Reuse |
| RS-002 | Reservation Independence |

---

# Admission Model

| Rule | Description |
|------|-------------|
| AD-001 | Progressive Admission |
| AD-002 | Commercial Agreement |

---

# Stay Model

| Rule | Description |
|------|-------------|
| ST-001 | Stay Lifecycle |
| ST-002 | Central Business Entity |
| ST-003 | Multiple Bed Support |
| ST-004 | Agreement Preservation |
| ST-005 | Operational and Financial Independence |
| ST-006 | Deposit Ownership |
| ST-007 | Operational Truth |
| ST-008 | Business Hub |
| ST-009 | Event-Driven History |

---

# Stay Management

| Rule | Description |
|------|-------------|
| SM-001 | Operational Scope |
| SM-002 | Business Operations |
| SM-003 | Operation Classification |
| SM-004 | Timeline Integrity |
| SM-005 | Event-Driven Stay Management |

---

# Deposit Account Model

| Rule | Description |
|------|-------------|
| DP-001 | Deposit Ownership |
| DP-002 | Agreed Security Deposit |
| DP-003 | Financial Traceability |
| DP-004 | Deposit Transaction Integrity |
| DP-005 | Partial Deposit Collection |
| DP-006 | Deposit Advance |
| DP-007 | Deposit Closure |
| DP-008 | Event-Driven Deposit Management |
| DP-009 | Standard Business Terminology |

---

# Finance Model

| Rule | Description |
|------|-------------|
| FI-001 | Financial Responsibility |
| FI-002 | Financial Integrity |
| FI-003 | Separation of Financial Components |
| FI-004 | Billing Independence |
| FI-005 | Payment Traceability |
| FI-006 | Ledger Integrity |
| FI-007 | Balance Calculation |
| FI-008 | Event-Driven Finance |

---

# Business Events & Timeline

| Rule | Description |
|------|-------------|
| BE-001 | Event-Driven Business Model |
| BE-002 | Event Integrity |
| BE-003 | Timeline Ownership |
| BE-004 | Cross-Domain Visibility |
| BE-005 | Event Context |
| BE-006 | Human-Centred Timeline |
| BE-007 | Future Extensibility |
| BE-008 | Significant Business Activities |

---

# Operational Checkout

| Rule | Description |
|------|-------------|
| CO-001 | Separation of Checkout and Settlement |
| CO-002 | Operational Completion |
| CO-003 | Accommodation Release |
| CO-004 | Financial Continuity |
| CO-005 | Operational Status Management |
| CO-006 | Operational Traceability |
| CO-007 | Dual Lifecycle Principle |

---

# Financial Settlement

| Rule | Description |
|------|-------------|
| FS-001 | Financial Closure |
| FS-002 | Settlement Sequence |
| FS-003 | Financial Reconciliation |
| FS-004 | Complete Review |
| FS-005 | Deposit Reconciliation |
| FS-006 | Settlement Outcome |
| FS-007 | Financial Status Management |
| FS-008 | Financial Traceability |
| FS-009 | Dual Completion Principle |
| FS-010 | Settlement Flexibility |

---

# Alumni Model

| Rule | Description |
|------|-------------|
| AL-001 | Permanent Resident History |
| AL-002 | Alumni Eligibility |
| AL-003 | Historical Preservation |
| AL-004 | Resident Reuse |
| AL-005 | Analytical Value |
| AL-006 | Lifecycle Completion |
| AL-007 | Lifetime Relationship |
| AL-008 | Historical Continuity |

---

# Appendix C – State Machines

This appendix defines the official business state machines used throughout RPGMS.

State machines define the valid lifecycle of each major business entity and the permitted transitions between states.

All implementations of RPGMS shall comply with these state definitions unless superseded by future constitutional revisions.

---

# C.1 Resident Lifecycle

A Resident is a permanent business entity.

Residents are never deleted.

```text
Prospective Resident
        │
        ▼
Resident Created
        │
        ▼
Reservation (Optional)
        │
        ▼
Admission
        │
        ▼
Active Stay
        │
        ▼
Operational Checkout
        │
        ▼
Financial Settlement
        │
        ▼
Alumni
```

Business Rules

- A Resident may have multiple Reservations.
- A Resident may have multiple Stays.
- Only one Active Stay is permitted at a time.
- Alumni may begin new Reservations and new Stays.

---

# C.2 Reservation Lifecycle

```text
Created
   │
   ├────────────► Cancelled
   │
   ├────────────► Expired
   │
   ▼
Admitted
```

Business Rules

- A Reservation never becomes Active.
- Admission creates a Stay.
- Cancelled and Expired Reservations remain historical records.

---

# C.3 Stay Lifecycle

```text
Reservation (Optional)
        │
        ▼
Admission
        │
        ▼
Active Stay
        │
        ▼
Stay Management
        │
        ▼
Operational Checkout
        │
        ▼
Financial Settlement
        │
        ▼
Completed Stay
```

Business Rules

- Every Stay belongs to exactly one Resident.
- Every Stay owns exactly one Deposit Account.
- A Stay concludes only after Financial Settlement.

---

# C.4 Operational Status Lifecycle

```text
Active
   │
   ▼
On Notice
   │
   ├────────► Active
   │
   ▼
Checked Out
```

Business Rules

- Operational Status reflects accommodation occupancy only.
- Checked Out Residents no longer occupy accommodation.
- Operational Status is independent of Financial Status.

---

# C.5 Financial Status Lifecycle

```text
Open
   │
   ▼
Settlement Pending
   │
   ▼
Closed
```

Business Rules

- Financial Status reflects only the financial relationship.
- Financial Status may remain open after Operational Checkout.
- Financial Status must be Closed before the Stay completes.

---

# C.6 Deposit Account Lifecycle

```text
Created
    │
    ▼
Receiving Deposits
    │
    ▼
Active
    │
    ├────────────► Deposit Advance
    │                   │
    │                   ▼
    │            Deposit Advance Return
    │
    ▼
Settlement
    │
    ▼
Closed
```

Business Rules

- Every Stay owns one Deposit Account.
- Deposit Balance is derived from Deposit Transactions.
- Deposit Account closes only after Financial Settlement.

---

# C.7 Bed Occupancy Lifecycle

```text
Vacant
   │
   ▼
Reserved (Optional)
   │
   ▼
Occupied
   │
   ├────────► Maintenance
   │              │
   │              ▼
   │            Vacant
   │
   ├────────► Blocked
   │              │
   │              ▼
   │            Vacant
   │
   ▼
Vacant
```

Business Rules

- Beds belong to Flats.
- Beds may be transferred between Stays.
- A Bed cannot be occupied by more than one Stay simultaneously.

---

# C.8 Laundry Lifecycle

```text
Collected
    │
    ▼
Sent
    │
    ▼
Returned
    │
    ▼
Delivered
    │
    ▼
Closed
```

Business Rules

- Laundry remains operational until Delivered.
- Charges are generated independently by the Finance domain.
- Laundry photographs may be retained according to organisational policy.

---

# C.9 Internet Service Lifecycle

```text
Not Assigned
      │
      ▼
Assigned
      │
      ▼
Upgraded
      │
      ▼
Downgraded
      │
      ▼
Disconnected
```

Business Rules

- Internet assignment belongs to a Stay.
- Service changes generate Business Events.
- Internet charges are managed by the Finance domain.

---

# C.10 Door ID Lifecycle

```text
Available
     │
     ▼
Assigned
     │
     ▼
Returned
     │
     ▼
Available
```

Business Rules

- Door IDs are reusable organisational assets.
- Door IDs belong to the organisation, not the Resident.
- Every assignment generates Business Events.

---

# C.11 Billing Lifecycle

```text
Charge Created
       │
       ▼
Bill Generated
       │
       ▼
Payment Received
       │
       ▼
Settled
```

Alternative Path

```text
Bill Generated
       │
       ▼
Partially Paid
       │
       ▼
Fully Paid
```

Business Rules

- Billing and Payment are independent.
- Bills remain part of financial history.
- Payments never overwrite Bills.

---

# C.12 Maintenance Request Lifecycle

```text
Reported
     │
     ▼
Assigned
     │
     ▼
In Progress
     │
     ▼
Completed
     │
     ▼
Closed
```

Business Rules

- Maintenance history remains permanent.
- Every state transition generates Business Events.

---

# C.13 Complaint Lifecycle

```text
Reported
     │
     ▼
Under Review
     │
     ▼
Resolved
     │
     ▼
Closed
```

Business Rules

- Complaints remain historically preserved.
- Complaints contribute to Resident history.

---

# C.14 Business Event Lifecycle

```text
Business Operation
        │
        ▼
Business Event Created
        │
        ▼
Timeline Updated
        │
        ▼
Historical Record
```

Business Rules

- Business Events are immutable.
- Business Events are never deleted.
- Corrections are made through compensating Business Events.

---

# C.15 Timeline Lifecycle

```text
Stay Created
      │
      ▼
Business Events Recorded
      │
      ▼
Operational Checkout
      │
      ▼
Financial Settlement
      │
      ▼
Timeline Completed
```

Business Rules

- Every Stay owns exactly one Timeline.
- Timeline entries are chronological.
- Timeline entries use standard RPGMS business terminology.

---

# Constitutional Principle

The State Machines defined in this appendix constitute the authoritative lifecycle definitions for RPGMS.

No implementation shall introduce additional business states or state transitions that conflict with these definitions without an approved constitutional revision to the Business Model.

