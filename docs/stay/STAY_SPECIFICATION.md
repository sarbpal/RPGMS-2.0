# 1. Purpose

The Stay Specification defines the business architecture governing a Resident's operational and commercial relationship with the organisation.

It establishes:

- The lifecycle of a Stay.
- The business responsibilities owned by the Stay.
- The relationship between Stay and other business domains.
- The operational events that occur during a Stay.
- The commercial agreements governing a Stay.
- The principles that preserve historical accuracy and business integrity.

This document serves as the authoritative business specification for the Stay domain within RPGMS 2.0.

Implementation shall conform to this specification.

# 2. Scope

This specification governs:

- Admission
- Stay Lifecycle
- Bed Allocation
- Commercial Agreements
- Notice Management
- Door ID Assignment
- Operational Checkout
- Historical Stay Preservation

This specification does not define:

- Resident Identity
- Accommodation Structure
- Financial Ledger
- Compliance
- Reporting

These responsibilities belong to their respective business domains.

# 3. Stay Philosophy

The Stay answers the question:

> "What is the complete commercial and operational relationship between a Resident and the organisation for one continuous period of residence?"

A Stay begins with Admission.

A Stay ends only with Operational Checkout.

During its lifetime, a Stay may undergo multiple commercial and operational changes without creating a new Stay.

These changes include:

- Bed Allocation
- Additional Bed Allocation
- Bed Release
- Bed Transfer
- Flat Transfer
- Commercial Agreement Revision
- Notice
- Notice Withdrawal

The Stay preserves complete historical information throughout its lifecycle.

## Continuous Stay

A Stay represents one continuous period of residence.

Only Operational Checkout terminates a Stay.

---

## Historical Preservation

Business history shall never be overwritten.

Significant operational and commercial changes shall be preserved.

---

## Single Active Stay

A Resident may have many historical Stays.

A Resident may have only one Active Stay.

---

## Commercial Agreement History

Commercial terms evolve through Commercial Agreements.

Previous agreements remain historical.

---

## Bed Allocation History

Accommodation changes are preserved through Bed Allocation history.

Transfers create new Bed Allocations rather than modifying previous allocations.

---

## Current Projection

Current operational information is derived from active business objects.

Historical information remains immutable.

# 5. Stay Aggregate

A Stay is the aggregate root representing one continuous period of residence.

The Stay is responsible for all business information required to manage the operational and commercial relationship between a Resident and the organisation throughout that period.

A Stay begins with Admission and ends only with Operational Checkout.

All operational activities performed during this period belong to the same Stay.

---

## Aggregate Structure

A Stay consists of the following business components.

### Identity

The Stay maintains its own operational identity.

Examples include:

- Stay ID
- Resident
- Admission Date
- Checkout Date
- Current Status

---

### Commercial Agreement History

The Stay is responsible for the complete history of Commercial Agreements governing the financial relationship.

A Stay always has exactly one active Commercial Agreement.

Previous Commercial Agreements remain preserved as historical records.

Commercial Agreement history includes:

- Rent
- Security Deposit
- Effective Period
- Commercial Amendments
- Revision Reason

---

### Bed Allocation History

The Stay is responsible for the complete history of Bed Allocations.

Each Bed Allocation records the assignment of a Bed to the Stay for a defined period.

A Stay may contain one or more simultaneously active Bed Allocations, provided they belong to the same Flat.

Bed Allocation history preserves:

- Initial Allocation
- Additional Bed Allocation
- Bed Release
- Bed Transfer
- Flat Transfer

Historical Bed Allocations remain immutable after release.

---

### Business Events

The Stay maintains a timeline of significant operational business events.

Examples include:

- Admission
- Commercial Agreement Revised
- Additional Bed Allocated
- Bed Released
- Bed Transfer
- Flat Transfer
- Notice Given
- Notice Withdrawn
- Operational Checkout

The Business Events records only Stay business events.

Resident Profile changes and Financial Ledger transactions are excluded.

---

### Current Projection

The Stay exposes a current operational projection for day-to-day management.

The Current Projection is derived from the active business objects owned by the Stay.

Typical information includes:

- Current Status
- Current Flat
- Current Beds
- Current Commercial Agreement
- Current Door ID
- Current Notice Status

The Current Projection is a derived operational view.

Historical information remains preserved within the corresponding business components.

# 6. Commercial Agreement

## Purpose

A Commercial Agreement defines the complete commercial terms governing a Stay for a specific period.

It represents the financial contract between the Resident and the organisation.

A Commercial Agreement belongs exclusively to one Stay.

A Stay always has exactly one active Commercial Agreement.

Historical Commercial Agreements remain permanently preserved.

---

## Business Philosophy

Commercial terms may evolve throughout the lifetime of a Stay.

Whenever any commercial term changes, a new Commercial Agreement is created.

Commercial Agreements are never modified retrospectively.

This preserves historical accuracy for billing, audit, reporting and settlement.

---

## Commercial Terms

A Commercial Agreement typically defines:

- Monthly Rent
- Security Deposit
- Effective From Date
- Effective Until Date
- Commercial Amendment Reason
- Agreement Status

Future commercial terms may be added without altering the overall business model.

Examples include:

- Discounts
- Promotional Rates
- Special Concessions
- Included Services
- Custom Billing Rules

---

## Commercial Agreement Lifecycle

A Commercial Agreement is created:

- During Admission.
- Whenever commercial terms are revised.

Examples include:

- Rent Revision
- Deposit Revision
- Additional Bed Allocation affecting charges
- Bed Release affecting charges
- Management Approved Commercial Revision

When a new Commercial Agreement becomes active:

- the previous agreement becomes historical,
- its Effective Until Date is recorded,
- the new agreement becomes the active agreement.

At no time may a Stay contain more than one active Commercial Agreement.

---

## Commercial Amendments

Every Commercial Agreement revision should record the reason for change.

Typical amendment reasons include:

- Admission
- Annual Rent Revision
- Additional Bed Allocation
- Bed Release
- Management Decision
- Resident Request
- Error Correction

The amendment reason provides business context for future review and audit.

---

## Relationship with Billing

Billing always operates against the Commercial Agreement active for the billing period.

Historical bills continue to reference the Commercial Agreement that was active when they were generated.

Commercial Agreement revisions never alter previously generated financial records.

---

## Relationship with Stay

The Stay is responsible for the complete Commercial Agreement history.

The Current Projection exposes only the currently active Commercial Agreement.

Historical agreements remain accessible through the Stay history.

---

## Business Rules

The following rules apply:

- A Stay shall always contain exactly one active Commercial Agreement.
- Historical Commercial Agreements shall remain immutable.
- Commercial terms shall never be overwritten.
- Every commercial revision creates a new Commercial Agreement.
- Billing shall always use the Commercial Agreement active during the billing period.

# 7. Bed Allocation

## Purpose

A Bed Allocation represents the assignment of a specific Bed to a Stay for a defined period.

It records the accommodation relationship between a Stay and a Bed.

A Bed Allocation belongs exclusively to one Stay.

A Bed Allocation does not belong to the Resident directly.

---

## Business Philosophy

Accommodation may change during the lifetime of a Stay.

Rather than modifying existing Bed Allocations, new Bed Allocations are created whenever accommodation changes.

Released Bed Allocations remain permanently preserved as historical records.

This provides complete accommodation history throughout the Stay.

---

## Allocation Lifecycle

A Bed Allocation is created when:

- Admission allocates the first Bed.
- An additional Bed is allocated.
- A Bed Transfer occurs.
- A Flat Transfer occurs.

A Bed Allocation ends when:

- The Bed is released.
- The Resident transfers to another Bed.
- The Resident transfers to another Flat.
- The Stay completes Operational Checkout.

Released Bed Allocations become historical and shall never be modified.

---

## Bed Transfers

Transfers are represented by two independent business actions:

1. Release the existing Bed Allocation.
2. Create a new Bed Allocation.

No special "Transfer" business object exists.

This preserves complete accommodation history while keeping the domain model simple.

---

## Multi-Bed Occupancy

A Stay may contain multiple simultaneously active Bed Allocations.

For the MVP:

- All active Bed Allocations shall belong to the same Flat.

This supports business scenarios such as:

- Occupying two Bedroom beds.
- Occupying Bedroom and Hall beds within the same Flat.
- Temporary additional accommodation.

Future versions may extend this rule if required.

---

## Relationship with Accommodation

The Accommodation domain owns:

- Areas
- Flats
- Beds

 The Stay is responsible only for the allocation history linking the Stay to those Beds.

Accommodation remains responsible for the physical resources.

Stay remains responsible for operational occupancy.

---

## Relationship with Stay

The Stay owns the complete Bed Allocation history.

The Current Projection exposes only the active Bed Allocation(s).

Historical Bed Allocations remain accessible through the Stay history.

---

## Business Rules

The following rules apply:

- Every Bed Allocation belongs to exactly one Stay.
- A Bed Allocation references exactly one Bed.
- A released Bed Allocation shall never be modified.
- Accommodation transfers create new Bed Allocations.
- Historical Bed Allocations remain immutable.

---

## Business Invariants

The following invariants shall always hold:

- A Stay may contain one or more active Bed Allocations.
- All active Bed Allocations shall belong to the same Flat (MVP).
- A Bed may be actively allocated to only one Stay at any point in time.
- Historical Bed Allocations shall never become active again.

# 8. Business Events

## Purpose

The Business Events records the significant business events that occur during the lifetime of a Stay.

It provides a chronological narrative of the Stay from Admission through Operational Checkout.

The Business Events serves as the authoritative operational history of the Stay.

---

## Business Philosophy

The Business Events records business events rather than data changes.

Each event represents a meaningful operational decision affecting the Stay.

Business events are permanent.

Business events are never deleted or modified.

If an operational decision is reversed, the reversal is recorded as a new business event.

This preserves complete operational history while maintaining an accurate current state.

---

## Typical Operational Events

Examples include:

- Admission
- Commercial Agreement Revised
- Additional Bed Allocated
- Bed Released
- Bed Transfer
- Flat Transfer
- Door ID Assigned
- Door ID Reassigned
- Notice Given
- Notice Withdrawn
- Operational Checkout

Future operational events may be introduced without changing the overall Stay architecture.

---

## Event Ordering

Business events shall be recorded in chronological order.

The sequence of events forms the complete operational narrative of the Stay.

Historical events remain immutable.

---

## Current Status

The current operational status of the Stay is derived from the latest relevant business event.

For example:

Admission

↓

Status = ACTIVE

Notice Given

↓

Status = ON_NOTICE

Notice Withdrawn

↓

Status = ACTIVE

Operational Checkout

↓

Status = CHECKED_OUT

The Timeline preserves every event.

The Stay exposes only the resulting current status.

---

## Relationship with Other Business Objects

Operational events may reference:

- Commercial Agreements
- Bed Allocations
- Door ID Assignment
- Notice Information

The Business Events records that an event occurred.

The detailed business information remains within the corresponding business object.

---

## Relationship with Finance

The Business Events does not record Financial Ledger transactions.

Examples excluded include:

- Rent Generation
- Payments
- Electricity Charges
- Laundry Charges
- Refunds

Financial activity belongs exclusively to the Finance domain.

---

## Relationship with Resident

Resident Profile changes do not appear within the Business Events.

Examples excluded include:

- Mobile Number updated
- Address changed
- Government ID uploaded
- Emergency Contact modified
- Medical Information updated

These belong to the Resident domain.

---

## Business Rules

The following rules apply:

- Operational events are immutable.
- Events are recorded in chronological order.
- Reversed decisions create new events rather than modifying historical events.
- Every event belongs to exactly one Stay.

---

## Business Invariants

The following invariants shall always hold:

- Every Stay maintains exactly one Business Events.
- Every Business Events belongs to exactly one Stay.
- Historical events shall never be removed.
- Historical events shall never be reordered.

# 9. Current Projection

## Purpose

The Current Projection represents the current operational state of a Stay.

It provides a simplified operational view for day-to-day hostel management.

The Current Projection is intended for operators.

It is not the authoritative source of historical information.

---

## Business Philosophy

The Current Projection is derived from the current business state of the Stay.

It presents only the information required to operate the Stay today.

Historical business information remains preserved within the corresponding business objects.

---

## Current Projection Information

Typical information includes:

### Stay Status

Examples:

- Active
- On Notice
- Checked Out

---

### Accommodation

Current accommodation information includes:

- Flat
- Active Bed Allocation(s)
- Area (derived)

Historical accommodation changes are available through Bed Allocation history.

---

### Commercial Information

Current commercial information includes:

- Active Commercial Agreement
- Monthly Rent
- Security Deposit

Commercial history remains available through Commercial Agreement history.

---

### Operational Resources

Current operational resources include:

- Assigned Door ID

Historical assignment information is maintained through the Audit Trail where required.

---

### Notice Information

Current notice information includes:

- Notice Status
- Notice Date
- Expected Checkout Date

Historical notice events remain within the Business Events.

---

## Relationship with Stay Workspace

The Stay Workspace consumes the Current Projection.

Operators perform day-to-day activities using the Current Projection while retaining access to historical information through dedicated business components.

---

## Relationship with Historical Information

The Current Projection does not replace historical information.

Historical business records remain the authoritative source for:

- Commercial Agreements
- Bed Allocations
- Operational Events

The Current Projection simply presents the current operational state derived from those records.

---

## Business Rules

The following rules apply:

- The Current Projection is derived from the Stay.
- The Current Projection shall not overwrite historical records.
- Historical information remains authoritative.
- The Current Projection always reflects the latest business state.

# 10. Business Operations

## Purpose

Business Operations are the authorised business actions that modify a Stay.

Every command represents a meaningful business operation.

Commands operate against the Current Stay.

---

## Admission

Creates a new Stay.

Creates:

- Initial Commercial Agreement
- Initial Bed Allocation
- Initial Business Events

---

## Revise Commercial Agreement

Creates a new Commercial Agreement.

Previous agreements remain historical.

---

## Allocate Additional Bed

Creates a new Bed Allocation.

The existing Stay remains unchanged.

---

## Release Bed

Releases an active Bed Allocation.

Historical allocations remain preserved.

---

## Transfer Bed

Transfers accommodation by:

- Releasing the existing Bed Allocation.
- Creating a new Bed Allocation.

---

## Transfer Flat

Transfers accommodation to another Flat by:

- Releasing active Bed Allocation(s).
- Creating new Bed Allocation(s).

The Stay remains unchanged.

---

## Assign Door ID

Assigns or replaces the current Door ID.

The Door ID Pool is updated accordingly.

---

## Give Notice

Changes the operational status to:

ON_NOTICE

Records a Notice Given event.

---

## Withdraw Notice

Returns the operational status to:

ACTIVE

Records a Notice Withdrawn event.

---

## Operational Checkout

Completes the Stay.

Operational Checkout:

- Releases all active Bed Allocations.
- Releases the assigned Door ID.
- Records Operational Checkout.
- Changes Stay Status to CHECKED_OUT.

A completed Stay cannot become Active again.

# 11. Stay Status

## Purpose

Stay Status represents the current operational state of a Stay.

It communicates the present condition of the Stay to operators.

Stay Status is derived from business events recorded in the Business Events.

Historical status transitions remain preserved through the Business Events.

---

## ACTIVE

The Stay is currently operational.

Characteristics include:

- Resident currently occupies one or more active Bed Allocations.
- One active Commercial Agreement exists.
- The Stay has not entered the Notice period.
- Day-to-day operations continue normally.

---

## ON_NOTICE

The Resident has formally given Notice.

Characteristics include:

- The Stay remains operational.
- Bed Allocation(s) remain active.
- Commercial Agreement remains active.
- Billing continues according to business rules.
- Operational Checkout has not yet occurred.

The Stay returns to ACTIVE if Notice is withdrawn.

---

## CHECKED_OUT

Operational Checkout has been completed.

Characteristics include:

- No active Bed Allocations remain.
- No assigned Door ID remains.
- The Stay becomes historical.
- No further operational activities are permitted.

A CHECKED_OUT Stay cannot become ACTIVE again.

A returning Resident creates a new Stay.

---

## Status Transitions

The following transitions are permitted:

ACTIVE

↓

ON_NOTICE

↓

ACTIVE

↓

CHECKED_OUT

No other transitions are permitted during the MVP.

---

## Business Rules

- Every Stay shall always have exactly one current Status.
- Status changes are triggered by Business Operations.
- Status history is preserved through the Business Events.
- Status shall never be edited directly.

# 12. Business Invariants

The following business invariants shall always hold.

## Stay Identity

- A Stay belongs to exactly one Resident.
- A Stay begins with Admission.
- A Stay ends only with Operational Checkout.

---

## Active Stay

- A Resident may have many historical Stays.
- A Resident may have only one ACTIVE Stay at any point in time.

---

## Commercial Agreement

- A Stay shall always contain exactly one active Commercial Agreement.
- Historical Commercial Agreements shall never be modified.

---

## Bed Allocation

- A Stay shall contain one or more active Bed Allocations while ACTIVE or ON_NOTICE.
- All active Bed Allocations shall belong to the same Flat (MVP).
- Historical Bed Allocations shall never become active again.

---

## Door ID

- A Stay may have at most one assigned Door ID.
- A CHECKED_OUT Stay shall have no assigned Door ID.

---

## Status

- Every Stay shall always have exactly one current Status.
- Status changes occur only through Business Operations.

---

## Checkout

Upon Operational Checkout:

- All active Bed Allocations shall be released.
- The assigned Door ID shall be released.
- The Stay Status becomes CHECKED_OUT.

Operational Checkout is irreversible.

A Resident returning after Checkout creates a new Stay.

# 13. Domain Relationships

The Stay domain collaborates with multiple business domains while maintaining clear ownership boundaries.

## Resident Domain

The Resident domain is responsible for identity.

The Stay references the Resident but does not own Resident Profile information.

Examples:

- Name
- Mobile Number
- Government Identification
- Address
- Emergency Contacts
- Medical Information

---

## Accommodation Domain

The Accommodation domain owns physical resources.

Examples:

- Areas
- Flats
- Beds

The Stay is responsible only for Bed Allocations.

---

## Reservation Domain

Reservations represent the intention to occupy accommodation.

Admission converts an ACTIVE Reservation into a new Stay.

After Admission, Reservation history remains independent.

---

## Finance Domain

Finance owns all financial transactions.

Examples include:

- Rent Generation
- Payments
- Electricity Charges
- Laundry Charges
- Refunds

The Stay provides the operational context for these transactions but does not own the Financial Ledger.

---

## Stay Workspace

The Stay Workspace is the operational interface for managing the Current Stay.

It consumes the Current Projection and orchestrates Business Operations across multiple domains.

The Stay Workspace does not own business data.

---

## Audit

The Audit domain records system-level activity.

Examples include:

- User actions
- Timestamps
- Before/After values

Audit supports traceability but does not replace business history maintained by the Stay.

# 14. Future Extensions

The Stay architecture has been designed to support future enhancements without altering the core business model.

Potential extensions include:

- Cross-flat multi-bed occupancy.
- Temporary accommodation assignments.
- Locker and key management.
- Visitor access management.
- Digital access credentials.
- Housekeeping operations.
- Maintenance-related temporary relocations.
- Resident self-service features.
- Automated workflow orchestration.

Future capabilities shall preserve the principles defined in this specification.

# 15. Document Status

Status: Draft 2 (Business Architecture Frozen)

This specification represents the approved business architecture for the Stay domain within RPGMS 2.0.

Future implementation shall conform to the principles, business rules, and invariants defined herein.

Changes to this specification require architectural review before implementation.

