# ADMISSION_WORKSPACE_SPECIFICATION

**Document ID:** SPEC-ADM-001

**Version:** 1.0

**Status:** Approved Architecture

**Owner:** Product Architecture

**Last Updated:** 2026-08-06

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | 2026-08-06 | Initial Admission Workspace Specification created during Capability Release 2 Business Discovery. |

---

# 1. Purpose

The Admission Workspace defines the business environment responsible for reviewing, approving and executing the admission of a prospective resident into the organisation.

Unlike Reservation, which manages the organisation's expectation of a future Admission, the Admission Workspace supports the operator in making the business decision to formally accept a prospective resident.

The Admission Workspace enables operators to:

- Review all expected information associated with a prospective Admission.
- Verify identity and supporting documentation.
- Review and revise expected commercial terms.
- Review and revise accommodation selection.
- Assess overall admission readiness.
- Approve or decline the proposed Admission.
- Execute the Admission Transaction.

The Admission Workspace does not itself create operational business information.

Instead, it prepares and authorises the Admission Transaction.

Upon operator approval, RPGMS executes the Admission Transaction atomically, establishing the resident's operational relationship with the organisation.

The Admission Workspace therefore exists to support business judgment rather than data entry.

It is an Approval Workspace whose purpose is to enable confident business decisions before permanent business commitments are created.

# 2. Scope

The Admission Workspace governs the business process through which a prospective resident is formally accepted into the organisation.

It defines the business responsibilities, decision process and transaction boundaries associated with Admission.

The scope of the Admission Workspace includes:

- Reviewing expected information originating from a Reservation or Walk-in Admission.
- Verifying the completeness and readiness of the proposed Admission.
- Reviewing and, where appropriate, revising expected business information.
- Supporting operator approval of the proposed Admission.
- Executing the Admission Transaction upon operator confirmation.
- Recording the resulting Business Events.
- Transferring business ownership to the appropriate operational business objects.

The Admission Workspace supports three admission entry paths:

- Reservation Admission
- Walk-in Admission
- Alumni Readmission

Regardless of the entry path, every Admission follows the same business principles and results in the same operational business outcomes.

---

## Out of Scope

The Admission Workspace intentionally does not own or manage long-lived operational business information.

It does not permanently own:

- Resident Identity
- Stay Information
- Accommodation Allocation
- Financial Records
- Door Access
- Operational Activities

These responsibilities belong to their respective business objects following successful completion of the Admission Transaction.

Similarly, the Admission Workspace does not manage:

- Reservation lifecycle
- Resident administration
- Stay operations
- Finance operations
- Checkout
- Settlement
- Maintenance
- Daily operational activities

The Admission Workspace coordinates these business domains only for the duration of the Admission Transaction.

Upon successful completion, business ownership transfers permanently to the appropriate operational workspaces.

---

## Transaction Boundary

The Admission Workspace exists before the Admission Transaction begins.

During this period, operators prepare for Admission by reviewing and revising expected information.

No permanent business commitments are created during preparation.

The Admission Transaction begins only when the operator explicitly approves the Admission.

The transaction concludes immediately after:

- Business validation succeeds,
- Business ownership is transferred,
- Business Events are recorded,
- Operational business objects are established.

Following successful completion, the Admission Workspace no longer owns any business responsibility associated with the newly admitted resident.

---

## Scope Principles

The scope of the Admission Workspace follows several constitutional principles.

### Principle 1 — Preparation Before Commitment

Preparation supports business decisions but creates no Business Truth.

---

### Principle 2 — Admission Is Transactional

Admission coordinates business change but does not permanently own operational business information.

---

### Principle 3 — Clear Transaction Boundaries

The Admission Workspace and the Admission Transaction are distinct business concepts.

The workspace supports preparation.

The transaction creates Business Truth.

---

### Principle 4 — Ownership Transfers Explicitly

Business ownership transfers only through successful completion of the Admission Transaction.

Ownership never changes during preparation.

---

### Principle 5 — Operational Responsibility Begins After Admission

Following successful Admission, ongoing business responsibility belongs to the operational workspaces rather than the Admission Workspace.

# 3. Business Context

Admission represents the point at which the organisation decides to transform a prospective resident into an active resident.

Prior to Admission, the organisation may have collected information, negotiated commercial terms and identified suitable accommodation.

However, these activities represent preparation rather than commitment.

The organisation has not yet accepted the individual as a resident.

The Admission Workspace exists to support this final business decision.

---

## Business Context

Every prospective resident follows a business journey before becoming an active resident.

This journey may begin through:

- Reservation
- Walk-in Admission
- Alumni Readmission

Although these entry paths differ in how the relationship begins, they all converge at the Admission Workspace.

The Admission Workspace provides a common business environment in which the operator reviews the proposed Admission before deciding whether the organisation should formally accept the individual as a resident.

The Admission Workspace therefore serves as the gateway between business expectation and operational reality.

---

## Transition from Expected Truth

The Reservation Workspace owns Expected Truth.

Expected Truth represents the organisation's current understanding of the proposed Admission.

Examples include:

- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Accommodation Preferences
- Reservation Notes

Expected Truth remains provisional.

It may continue to evolve until the operator approves the Admission.

The Admission Workspace reviews this Expected Truth without assuming ownership of it.

Ownership remains with the Reservation throughout the preparation phase.

---

## Transition to Business Truth

When the operator approves the proposed Admission, RPGMS executes the Admission Transaction.

The Admission Transaction transforms Expected Truth into operational Business Truth.

Business ownership is then transferred to the appropriate operational business objects.

Following successful completion:

- Resident owns Identity Truth.
- Stay owns Operational Truth.
- Accommodation owns Allocation Truth.
- Finance owns Financial Truth.
- Business Events own Historical Truth.

The Admission Workspace itself retains no permanent ownership.

Its responsibility concludes when the Admission Transaction completes successfully.

---

## Business Significance

Admission is one of the most significant business transactions performed by the organisation.

It establishes the formal business relationship between the organisation and the resident.

This relationship enables all subsequent operational activities, including:

- Accommodation
- Financial Management
- Door Access
- Electricity Billing
- Laundry
- Maintenance
- Checkout
- Alumni History

Without a successful Admission, none of these operational activities can legitimately occur.

---

## Organisational Responsibility

Admission is ultimately a business decision made by the organisation.

The system provides information, recommendations and validation.

The operator exercises business judgment.

RPGMS executes the resulting business decision and records the corresponding Business Events.

The organisation—not the software—admits the resident.

The software simply implements and records that organisational decision.

---

## Business Context Principles

The Admission Business Context follows several constitutional principles.

### Principle 1 — Admission Establishes Residency

Admission transforms a prospective resident into an active resident of the organisation.

---

### Principle 2 — Preparation Is Not Commitment

Preparation supports the Admission decision but creates no permanent business commitments.

---

### Principle 3 — Admission Transfers Ownership

Admission coordinates the transfer of Business Truth to the operational business objects.

It does not permanently own that information.

---

### Principle 4 — Operational Business Begins After Admission

Operational work begins only after the Admission Transaction has successfully completed.

---

### Principle 5 — The Organisation Admits Residents

Admission is fundamentally an organisational business decision.

RPGMS assists, validates, executes and records that decision.

# 4. Admission Definition

Admission is the business transaction through which the organisation formally accepts a prospective resident and establishes the operational business relationships required for residency.

Admission represents the transition from business expectation to Business Truth.

It is the point at which the organisation commits to accepting the individual as a resident under agreed commercial terms and allocates the operational resources necessary to support that residency.

Admission is one of the organisation's primary business transactions.

---

## Business Definition

Admission transforms a prospective resident into an active resident of the organisation.

In doing so, it establishes:

- Resident Identity
- Operational Stay
- Accommodation Allocation
- Financial Relationship
- Historical Business Record

These business relationships are created together as a single atomic business transaction.

Admission does not permanently own any of these relationships.

Instead, it establishes them and transfers ownership to the appropriate operational business objects.

---

## Admission Is Not

Admission is intentionally distinguished from several related business concepts.

Admission is **not**:

- a Reservation,
- a Resident,
- a Stay,
- an Accommodation Allocation,
- a Financial Record,
- a Door Access process,
- a physical move-in,
- a long-lived business object.

Admission exists only to establish these operational business relationships.

Once completed, its responsibility ends.

---

## Admission as a Business Transaction

Admission is a transactional business activity rather than an operational business object.

Its purpose is to coordinate the creation of multiple operational business relationships simultaneously.

The Admission Transaction either:

- completes successfully, or
- fails completely.

Partial Admission is not a valid business outcome.

This guarantees that operational Business Truth remains internally consistent.

---

## Admission as Business Confirmation

Admission confirms the organisation's decision to accept a prospective resident.

It confirms:

- the individual's acceptance as a resident,
- the agreed commercial understanding,
- the commencement of the operational Stay,
- the assignment of accommodation,
- the establishment of the financial relationship.

Admission therefore represents organisational approval rather than administrative data entry.

---

## Admission as Ownership Transfer

Admission transfers Business Truth from preparation into operational ownership.

Following successful completion:

- Resident owns Identity Truth.
- Stay owns Operational Truth.
- Accommodation owns Allocation Truth.
- Finance owns Financial Truth.
- Business Events own Historical Truth.

Admission itself retains no continuing ownership.

---

## Admission and Preparation

Preparation is not part of the Admission Transaction.

Preparation exists to:

- review information,
- revise expected information,
- verify documentation,
- assess readiness,
- support operator judgment.

Preparation creates no Business Truth.

The Admission Transaction begins only after the operator explicitly approves the proposed Admission.

---

## Admission and Physical Occupancy

Admission does not require physical occupancy.

A resident may be admitted today and occupy the allocated accommodation at a later time.

Operational residency begins when Admission completes successfully.

Physical occupancy is an operational aspect of the Stay rather than a defining characteristic of Admission.

---

## Admission Definition Principles

The Admission Definition follows several constitutional principles.

### Principle 1 — Admission Is Transactional

Admission is a business transaction rather than a long-lived business object.

---

### Principle 2 — Admission Creates Residency

Admission establishes an individual as a resident of the organisation.

---

### Principle 3 — Admission Transfers Ownership

Admission establishes Business Truth and transfers ownership to the operational business objects.

---

### Principle 4 — Admission Is Atomic

Admission succeeds completely or fails completely.

Partial Admission is not a valid business state.

---

### Principle 5 — Admission Ends When Ownership Begins

The responsibility of the Admission Transaction concludes immediately after Business Truth has been successfully established.

# 5. Business Responsibilities

The Admission Workspace is responsible for supporting the organisation's decision to admit a prospective resident and for executing the Admission Transaction upon approval.

Its responsibilities are intentionally limited to those required to transform Expected Truth into operational Business Truth.

The Admission Workspace does not permanently own operational business information.

Instead, it coordinates the establishment of operational business relationships before transferring ownership to the appropriate business objects.

---

## Primary Responsibility

The primary responsibility of the Admission Workspace is to support the organisation in making a confident and informed Admission decision.

This includes:

- Reviewing the proposed Admission.
- Supporting operator judgement.
- Assessing Admission readiness.
- Executing the Admission Transaction after approval.

The workspace exists to facilitate business decisions rather than administrative data entry.

---

## Preparation Responsibility

During the preparation phase, the Admission Workspace is responsible for presenting all information required to evaluate the proposed Admission.

Preparation includes:

- Reviewing expected information.
- Reviewing identity information.
- Reviewing commercial expectations.
- Reviewing accommodation selection.
- Reviewing Reservation history.
- Reviewing Business Timeline.
- Assessing overall readiness.

Preparation creates no Business Truth.

All information remains provisional until the Admission Transaction begins.

---

## Revision Responsibility

The Admission Workspace allows operators to revise Expected Truth whenever business circumstances require.

Typical revisions include:

- Expected Joining Date.
- Expected Monthly Rent.
- Expected Security Deposit.
- Accommodation Selection.
- Reservation Notes.

During preparation, all revisions continue to belong to the Reservation.

The Admission Workspace never becomes the owner of Expected Truth.

---

## Approval Responsibility

The Admission Workspace supports the operator in making the organisational decision to admit the prospective resident.

Approval represents the operator's business decision that:

- the resident should be accepted,
- the commercial understanding is satisfactory,
- accommodation is appropriate,
- organisational requirements have been met.

The workspace prepares the decision.

The operator authorises the decision.

---

## Transaction Responsibility

Upon operator approval, the Admission Workspace initiates the Admission Transaction.

The Admission Transaction is responsible for:

- Validating Business Rules.
- Establishing Resident Identity.
- Creating the Stay.
- Allocating Accommodation.
- Establishing the Financial Relationship.
- Recording Business Events.
- Converting the Reservation, where applicable.

These activities occur atomically.

Either every responsibility completes successfully or none of them are committed.

---

## Ownership Transfer Responsibility

The Admission Workspace coordinates the transfer of Business Truth to the operational business objects.

Following successful completion:

- Resident becomes responsible for Identity Truth.
- Stay becomes responsible for Operational Truth.
- Accommodation becomes responsible for Allocation Truth.
- Finance becomes responsible for Financial Truth.
- Business Events become responsible for Historical Truth.

The Admission Workspace retains no ongoing ownership after the transaction completes.

---

## Exceptional Situations

Exceptional situations requiring correction of a completed Admission are outside the scope of this specification.

Such situations shall be handled through dedicated corrective business transactions defined by their respective workspace specifications.

The Admission Workspace is responsible only for the normal Admission business flow.

---

## Responsibilities That Do Not Belong

The Admission Workspace intentionally does not perform ongoing operational management.

Examples include:

- Resident administration.
- Stay management.
- Accommodation management.
- Financial operations.
- Electricity billing.
- Laundry management.
- Maintenance.
- Checkout processing.

These responsibilities belong to the operational workspaces after Admission has completed successfully.

---

## Business Responsibility Principles

The Admission Business Responsibilities follow several constitutional principles.

### Principle 1 — Preparation Supports Decisions

Preparation exists to support business judgement rather than create Business Truth.

---

### Principle 2 — Admission Coordinates, It Does Not Own

Admission establishes business relationships before transferring ownership to the operational business objects.

---

### Principle 3 — Approval Precedes Commitment

Business commitments begin only after explicit organisational approval.

---

### Principle 4 — Ownership Must Transfer Explicitly

Operational ownership changes only through successful completion of the Admission Transaction.

---

### Principle 5 — Transaction Responsibility Ends at Completion

Once Business Truth has been successfully established, the responsibilities of the Admission Workspace conclude.

# 6. Business Ownership

Business ownership defines which business object is responsible for each category of Business Truth throughout the Admission process.

Admission does not permanently own operational business information.

Its responsibility is to coordinate the transition of ownership from Expected Truth to operational Business Truth.

Business ownership remains explicit before, during and after the Admission Transaction.

---

## Ownership Before Admission

Prior to Admission, Expected Truth remains the responsibility of the Reservation.

The Reservation owns:

- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Accommodation Preferences
- Reservation Notes
- Expected Commercial Understanding

The Admission Workspace may review and revise this information during preparation.

However, ownership remains with the Reservation until the Admission Transaction successfully completes.

---

## Ownership During Preparation

During Admission Preparation, no new business ownership is created.

Preparation supports:

- Review
- Verification
- Revision
- Readiness Assessment
- Business Decision

All revisions continue to update the Reservation.

The Admission Workspace acts as a decision environment rather than an owner of business information.

Preparation therefore creates no Business Truth.

---

## Ownership During the Admission Transaction

The Admission Transaction performs the coordinated transfer of Business Truth.

During execution, the transaction establishes the operational business relationships required for Residency.

The Admission Transaction itself retains no permanent ownership.

Instead, it distributes Business Truth to the appropriate operational business objects.

---

## Ownership After Admission

Upon successful completion of the Admission Transaction, business ownership becomes:

### Resident

Owns:

- Identity Truth
- Personal Information
- Resident Status

---

### Stay

Owns:

- Operational Truth
- Joining Date
- Monthly Rent
- Active Residency

---

### Accommodation

Owns:

- Bed Allocation
- Accommodation Assignment
- Occupancy Relationship

---

### Finance

Owns:

- Financial Truth
- Security Deposit
- Financial Obligations
- Billing Relationship

---

### Business Events

Own:

- Historical Truth
- Permanent Business History
- Transaction History

Each business object becomes the authoritative owner of its own Business Truth.

---

## What Admission Owns

Admission owns no long-term operational information.

Its responsibilities exist only while the Admission Transaction is executing.

Admission temporarily coordinates:

- Validation
- Ownership Transfer
- Business Confirmation
- Business Event Generation

Once these responsibilities have completed, the Admission Transaction ends.

Admission retains no continuing ownership.

---

## Ownership Integrity

Business ownership shall always remain explicit.

At no point shall two business objects simultaneously own the same Business Truth.

During Admission Preparation:

Reservation owns Expected Truth.

Following Admission:

Operational business objects own confirmed Business Truth.

Ownership changes exactly once through the Admission Transaction.

---

## Ownership Principles

The Admission Ownership Model follows several constitutional principles.

### Principle 1 — One Business Truth, One Owner

Every category of Business Truth shall have exactly one authoritative owner.

---

### Principle 2 — Preparation Does Not Change Ownership

Preparation may review and revise information.

It never transfers ownership.

---

### Principle 3 — Admission Transfers Ownership

Admission coordinates ownership transfer without permanently owning operational information.

---

### Principle 4 — Operational Objects Own Operational Truth

Following Admission, operational business objects become responsible for managing their own Business Truth.

---

### Principle 5 — Explicit Ownership Eliminates Ambiguity

Clear ownership improves business understanding, implementation consistency and long-term maintainability throughout RPGMS.

# 7. Business Confirmation

Business Confirmation represents the organisational decision to formally accept a prospective resident.

It is the defining business event of the Admission process.

Business Confirmation transforms Expected Truth into operational Business Truth.

No Business Truth exists prior to Business Confirmation.

---

## Purpose

The purpose of Business Confirmation is to establish the organisation's commitment to the proposed Admission.

Until Business Confirmation occurs:

- the individual is not a resident,
- no Stay exists,
- no accommodation is allocated,
- no financial relationship exists,
- no operational business relationship has been established.

Business Confirmation therefore represents the precise moment at which the organisation accepts the prospective resident.

---

## Organisational Decision

Business Confirmation is an organisational decision rather than a technical operation.

The operator reviews the proposed Admission.

The operator exercises business judgement.

The operator decides whether the organisation should accept the proposed resident.

RPGMS then executes that decision.

The software does not admit residents.

The organisation admits residents.

RPGMS validates, executes and records that organisational decision.

---

## Confirmation Before Transaction

Business Confirmation precedes the Admission Transaction.

The sequence is:

Preparation

↓

Readiness Assessment

↓

Operator Approval

↓

Business Confirmation

↓

Admission Transaction

↓

Business Truth Established

This sequence clearly separates business decision-making from transaction execution.

---

## What Is Confirmed

Business Confirmation confirms:

- acceptance of the individual as a resident,
- acceptance of the agreed commercial understanding,
- commencement of the operational Stay,
- allocation of accommodation,
- establishment of the financial relationship.

These confirmations occur together as one business decision.

---

## What Is Not Confirmed

Business Confirmation does not confirm:

- physical occupancy,
- door access,
- operational activities,
- future payments,
- future accommodation changes.

These activities belong to the operational workspaces following Admission.

---

## Confirmation Outcomes

Business Confirmation has only two possible outcomes.

### Approved

The organisation decides to admit the prospective resident.

The Admission Transaction begins.

Business ownership transfers to the operational business objects.

---

### Declined

The organisation decides not to admit the prospective resident.

The Admission Transaction never begins.

Where appropriate:

- the Reservation may be cancelled,
- Business Events record the organisational decision.

No operational Business Truth is created.

---

## Confirmation Integrity

Business Confirmation shall always occur before any operational business objects are created.

The Admission Transaction shall never begin without explicit organisational approval.

This guarantees that every admitted resident represents an intentional organisational decision.

---

## Business Confirmation Principles

The Business Confirmation model follows several constitutional principles.

### Principle 1 — Admission Requires Approval

No Admission shall occur without explicit organisational approval.

---

### Principle 2 — Approval Creates Authority

Operator approval authorises the Admission Transaction.

It does not itself create Business Truth.

---

### Principle 3 — Confirmation Precedes Execution

Business decisions occur before transaction execution.

Execution implements approved business decisions.

---

### Principle 4 — Declining Is Not Failure

Declining a proposed Admission is a legitimate business outcome.

It represents an organisational decision rather than a transaction failure.

---

### Principle 5 — Every Resident Exists Because of an Organisational Decision

Every active resident shall be traceable to an explicit Business Confirmation performed by the organisation.

# 8. Transaction Philosophy

Admission is a Business Transaction.

Its purpose is to transform Expected Truth into operational Business Truth through a single atomic business operation.

Unlike operational workspaces, Admission exists only for the duration of the business transaction.

Its responsibility begins with organisational approval and concludes immediately after Business Truth has been successfully established.

---

## Purpose

The Admission Transaction exists to establish all operational business relationships required for Residency.

It coordinates multiple business domains while maintaining complete business consistency.

The transaction guarantees that every admitted resident begins their relationship with the organisation in a valid and consistent business state.

---

## Transaction Philosophy

Business transactions exist to create Business Truth.

Preparation, review and discussion support the transaction.

They are not the transaction itself.

The Admission Transaction begins only after:

- preparation has completed,
- readiness has been assessed,
- the operator has approved the proposed Admission.

The transaction ends immediately after Business Truth has been successfully established.

---

## Atomic Commitment

The Admission Transaction is atomic.

Every operational business relationship must be established together.

Examples include:

- Resident created.
- Stay created.
- Accommodation allocated.
- Financial relationship established.
- Business Events recorded.
- Reservation converted, where applicable.

These activities represent one business commitment.

They shall never exist independently.

---

## Success or Failure

The Admission Transaction has only two valid outcomes.

### Success

Every business responsibility completes successfully.

Business ownership transfers to the operational business objects.

The resident becomes an active resident of the organisation.

---

### Failure

No Business Truth is created.

No ownership changes occur.

Preparation resumes.

The operator may revise information before attempting the transaction again.

Partial completion is never permitted.

---

## Transaction Integrity

The Admission Transaction protects the integrity of Business Truth.

Business validation occurs immediately before commitment.

Validation confirms that:

- business rules remain satisfied,
- operational resources remain available,
- organisational requirements remain fulfilled.

Only after successful validation may Business Truth be established.

---

## Business Events

Every successful Admission Transaction generates Business Events.

These events permanently record:

- organisational approval,
- establishment of Residency,
- ownership transfer,
- operational commencement.

Business Events preserve the historical record of the transaction without extending the lifetime of the Admission itself.

---

## Transaction Lifetime

The Admission Transaction has no ongoing operational existence.

It exists only while Business Truth is being established.

Once completed:

- the transaction ends,
- ownership transfers,
- operational workspaces assume responsibility.

Admission therefore acts as a coordinator rather than a long-lived business object.

---

## Transaction Philosophy Principles

The Admission Transaction Philosophy follows several constitutional principles.

### Principle 1 — Transactions Create Business Truth

Preparation supports Business Truth.

Transactions establish Business Truth.

---

### Principle 2 — Atomicity Protects Business Integrity

Business commitments succeed completely or fail completely.

Partial commitment is not a valid business state.

---

### Principle 3 — Transactions Coordinate Ownership

Transactions establish operational business relationships without permanently owning them.

---

### Principle 4 — Validation Protects Commitment

Business validation occurs immediately before commitment to ensure organisational consistency.

---

### Principle 5 — Transactions Are Temporary

Business transactions exist only while establishing Business Truth.

Operational business objects continue after the transaction has completed.

# 9. Preparation Philosophy

Preparation is the business activity through which the organisation gathers, reviews, verifies and refines the information required for a proposed Admission.

Preparation exists to support business judgement.

It does not create Business Truth.

---

## Purpose

The purpose of Preparation is to enable the operator to make an informed Admission decision.

Preparation allows the operator to:

- review expected information,
- verify identity,
- review commercial understanding,
- review accommodation selection,
- revise expected information where necessary,
- assess Admission readiness.

Preparation concludes only when the operator is satisfied that the proposed Admission is ready for organisational approval.

---

## Preparation Is Not Admission

Preparation is intentionally separated from the Admission Transaction.

During Preparation:

- no Resident is created,
- no Stay is created,
- no accommodation is allocated,
- no financial relationship is established,
- no Business Truth exists.

Preparation supports the Admission decision.

It is not the Admission itself.

---

## Preparation Uses Expected Truth

Preparation operates entirely upon Expected Truth.

Expected Truth continues to belong to the Reservation throughout the preparation phase.

Where business revisions are required, the Admission Workspace updates the Reservation.

Preparation never creates an independent copy of Expected Truth.

The Reservation remains the single authoritative source of expected information.

---

## Preparation Supports Revision

Business discussions often continue during Admission Preparation.

Examples include:

- revising monthly rent,
- adjusting the security deposit,
- changing the joining date,
- selecting a different bed,
- updating accommodation preferences,
- recording additional business notes.

Such revisions represent normal business activity.

They do not constitute operational commitment.

---

## Preparation Creates No Business Truth

Preparation creates:

- understanding,
- confidence,
- readiness.

It does not create:

- Residents,
- Stays,
- Accommodation Allocation,
- Financial Relationships,
- Business Truth.

Business Truth is established only through the Admission Transaction.

---

## Preparation May End Without Admission

Preparation does not guarantee Admission.

Following review, the operator may determine that the proposed Admission should not proceed.

In such cases:

- the Admission Transaction never begins,
- no Business Truth is created,
- the Reservation may remain Active or be Cancelled according to the business decision.

Preparation therefore supports organisational judgement without requiring organisational commitment.

---

## Preparation and Business Ownership

Preparation creates no new business ownership.

Throughout Preparation:

Reservation remains responsible for Expected Truth.

The Admission Workspace provides a decision environment through which Expected Truth may be reviewed and revised.

Business ownership transfers only after successful completion of the Admission Transaction.

---

## Preparation Principles

The Preparation Philosophy follows several constitutional principles.

### Principle 1 — Preparation Exists to Support Judgement

Preparation provides the information required for informed organisational decisions.

---

### Principle 2 — Preparation Creates No Business Truth

Business Truth begins only when the Admission Transaction successfully commits.

---

### Principle 3 — Reservation Remains the Source of Expected Truth

Preparation never creates an alternative source of expected information.

---

### Principle 4 — Revision Is Normal

Business revisions during Preparation represent healthy organisational decision-making rather than exceptional activity.

---

### Principle 5 — Preparation May Conclude Without Commitment

Preparation may end with approval or with a decision not to admit.

Neither outcome diminishes the value of the Preparation process.

# 10. Readiness Philosophy

Admission Readiness represents the organisation's current level of preparedness to proceed with the Admission Transaction.

Readiness exists to support operator judgement by identifying whether the proposed Admission appears complete, consistent and suitable for organisational approval.

Readiness does not create Business Truth.

Readiness does not replace operator authority.

---

## Purpose

The purpose of Admission Readiness is to assist the operator in making an informed business decision.

The Admission Workspace continuously evaluates the current state of the proposed Admission and provides an overall assessment of its readiness.

This assessment helps the operator understand whether additional review or revision may be beneficial before approving the Admission.

Readiness supports confidence.

It does not create commitment.

---

## Readiness Before Approval

Admission Readiness exists only during the Preparation phase.

The sequence is:

Preparation

↓

Readiness Assessment

↓

Operator Approval

↓

Business Confirmation

↓

Admission Transaction

Readiness therefore precedes organisational approval.

It never replaces it.

---

## Readiness Assessment

The Admission Workspace may assess areas such as:

- Identity Review
- Commercial Understanding
- Accommodation Selection
- Reservation Status
- Required Documentation
- Overall Business Completeness

The objective is to assist the operator in evaluating the proposed Admission rather than enforcing business rules.

---

## Readiness Is Advisory

Readiness represents a business recommendation.

It is advisory rather than authoritative.

Examples include:

- Commercial terms recently revised.
- Joining date recently changed.
- Security deposit differs from the recommended amount.
- Accommodation preference differs from the allocated accommodation.

Such observations assist operator judgement.

They do not necessarily prevent Admission.

---

## Operator Authority

The operator remains responsible for the final business decision.

The system may indicate that additional review is advisable.

The operator may nevertheless approve the Admission where organisational policy permits.

This reflects the constitutional principle:

System recommends.

Operator decides.

RPGMS executes and records.

---

## Readiness and Validation

Readiness and Validation serve different business responsibilities.

Readiness assists decision-making.

Validation protects Business Truth.

Readiness occurs before organisational approval.

Validation occurs immediately before the Admission Transaction commits.

Readiness asks:

> "Does this proposed Admission appear ready?"

Validation asks:

> "Can this Admission legally and operationally commit?"

These questions are intentionally different.

---

## Soft Readiness

Readiness may identify conditions that deserve operator attention without preventing Admission.

Examples include:

- Commercial recommendations overridden.
- Accommodation preference not satisfied.
- Additional notes recorded.
- Manual business decisions taken.

These observations improve business awareness.

They do not invalidate the proposed Admission.

---

## Hard Validation

Certain business rules cannot be overridden.

Examples include:

- Reservation no longer Active.
- Selected Bed no longer available.
- Required business information missing.
- Operational resources unavailable.

These conditions are evaluated during Validation immediately before commitment.

If Validation fails:

- the Admission Transaction does not begin,
- no Business Truth is created,
- Preparation resumes.

---

## Readiness Principles

The Admission Readiness Philosophy follows several constitutional principles.

### Principle 1 — Readiness Supports Judgement

Readiness exists to assist organisational decision-making rather than replace it.

---

### Principle 2 — Recommendations Are Not Decisions

The system may recommend.

The operator remains responsible for business approval.

---

### Principle 3 — Validation Protects Business Truth

Validation exists to preserve organisational integrity immediately before commitment.

---

### Principle 4 — Readiness Never Creates Business Truth

Business Truth begins only when the Admission Transaction successfully commits.

---

### Principle 5 — Business Authority Remains Human

The organisation—not the software—decides whether a resident should be admitted.

The system assists by providing meaningful business insight throughout the Preparation phase.

# 11. Workspace Philosophy

The Admission Workspace exists to support one of the organisation's most significant business decisions:

> **Should this prospective resident be admitted into the organisation?**

Unlike operational workspaces that manage long-lived business objects, the Admission Workspace exists to prepare, evaluate and approve a single business transaction.

Its purpose is to support organisational judgement before permanent Business Truth is created.

---

## Purpose

The Admission Workspace provides a dedicated business environment in which operators review all relevant information before approving a proposed Admission.

The workspace exists to:

- understand the proposed Admission,
- evaluate organisational readiness,
- exercise business judgement,
- approve or decline the proposed Admission,
- initiate the Admission Transaction.

The workspace is intentionally designed around business decisions rather than administrative data entry.

---

## Decision-Oriented Workspace

The Admission Workspace is fundamentally a decision workspace.

Every section contributes toward answering one business question:

> **Should the organisation admit this person?**

Identity information,

commercial understanding,

accommodation,

Reservation history,

and readiness assessment

all exist to support this single organisational decision.

---

## Approval Before Commitment

The Admission Workspace deliberately separates approval from commitment.

Preparation allows the operator to review and revise information without creating Business Truth.

Only after the operator explicitly approves the proposed Admission does the Admission Transaction begin.

This separation protects business integrity while supporting thoughtful organisational decision-making.

---

## One Source of Expected Truth

The Admission Workspace never creates an independent copy of business information.

Throughout Preparation:

Reservation remains the owner of Expected Truth.

Where revisions are necessary, the Admission Workspace updates the Reservation directly.

The Admission Workspace therefore functions as a decision environment rather than an owner of business information.

---

## Confidence Before Commitment

The Admission Workspace should help the operator feel confident before approving the Admission.

The workspace should answer questions such as:

- Is the resident correctly identified?
- Are the commercial terms appropriate?
- Is the selected accommodation suitable?
- Is the Reservation complete?
- Is the proposed Admission ready?

When these questions have been satisfactorily answered, the operator may confidently approve the Admission.

---

## Readiness Supports Judgement

The Admission Workspace continuously supports organisational judgement through Readiness Assessment.

Readiness exists to inform.

It does not decide.

The operator remains responsible for the final business decision.

This preserves the constitutional principle:

System recommends.

Operator decides.

RPGMS executes and records.

---

## Transaction Focus

The Admission Workspace remains focused upon the proposed Admission until the transaction has either:

- completed successfully, or
- been abandoned.

Once the Admission Transaction completes successfully, responsibility transfers permanently to the operational workspaces.

The Admission Workspace itself has no continuing operational responsibility.

---

## Exceptional Business Decisions

The Admission Workspace recognises that organisational judgement occasionally requires exceptional decisions.

Examples include:

- approving unusual commercial terms,
- accepting partial Security Deposit,
- overriding business recommendations,
- declining a proposed Admission.

Such decisions remain organisational decisions.

The system records them without replacing operator authority.

---

## Workspace Philosophy Principles

The Admission Workspace follows several constitutional principles.

### Principle 1 — Decisions Before Transactions

The organisation decides before the system commits.

---

### Principle 2 — Preparation Builds Confidence

Preparation exists to improve the quality of organisational decisions.

---

### Principle 3 — One Source of Expected Truth

The Admission Workspace never creates competing ownership of business information.

---

### Principle 4 — Approval Is Organisational

The organisation admits residents.

The system implements that decision.

---

### Principle 5 — The Workspace Exists to Support Judgement

Every element of the Admission Workspace should help the operator make better business decisions before permanent Business Truth is created.

# 12. Workspace Layout

The Admission Workspace presents all information required for the organisation to make an informed Admission decision.

The layout is intentionally organised around the operator's decision-making process rather than the underlying technical implementation.

Every section exists to support one business question:

> **Should this prospective resident be admitted?**

The workspace should minimise unnecessary navigation and present information in the sequence in which the operator naturally evaluates the proposed Admission.

---

## Layout Philosophy

The Admission Workspace is designed around progressive business understanding.

The operator should first understand the proposed Admission before being asked to approve it.

Information should therefore flow naturally from:

- identity,
- commercial understanding,
- accommodation,
- readiness,
- business decision.

The workspace should encourage understanding before commitment.

---

## Layout Principles

The Admission Workspace follows several layout principles.

### Principle 1 — Business Before Technology

Information should be organised according to business meaning rather than database structure.

Operators should evaluate a proposed Admission as a business decision rather than a collection of individual records.

---

### Principle 2 — Decision Before Action

The workspace should encourage operators to review and understand the proposed Admission before approving it.

Business decisions should follow understanding.

---

### Principle 3 — One Business Story

The operator should understand the complete proposed Admission without unnecessary navigation between multiple workspaces.

The workspace should present a single, coherent business story.

---

### Principle 4 — Progressive Detail

The most significant business information should appear first.

Supporting information should naturally follow.

The operator should be able to understand the overall proposal before reviewing detailed information.

---

### Principle 5 — Preparation Before Commitment

The layout should clearly distinguish:

- Preparation,
- Readiness,
- Approval,
- Commitment.

Operators should never confuse reviewing information with committing Business Truth.

---

## Business Sections

The Admission Workspace is organised into the following business sections.

---

### Admission Summary

Provides an immediate understanding of the proposed Admission.

Typical information includes:

- Admission Source
- Proposed Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Selected Accommodation
- Overall Readiness
- Current Reservation Status

This section answers:

> **"What Admission am I reviewing?"**

---

### Identity Review

Presents the proposed resident's identity information.

Typical information includes:

- Personal Details
- Contact Information
- Government Identity
- Supporting Documents
- Emergency Contact

This section answers:

> **"Do we know who we are admitting?"**

---

### Commercial Review

Presents the proposed commercial understanding.

Typical information includes:

- Monthly Rent
- Security Deposit
- Commercial Notes
- Special Agreements

This section answers:

> **"Are the commercial terms acceptable?"**

---

### Accommodation Review

Presents the proposed operational accommodation.

Typical information includes:

- Area
- Flat
- Bed
- Accommodation Preferences
- Operational suitability

This section answers:

> **"Can we accommodate this resident appropriately?"**

---

### Reservation Review

Provides the business history leading to the proposed Admission.

Typical information includes:

- Reservation Summary
- Reservation Notes
- Business Timeline
- Significant Business Events

This section answers:

> **"How did this proposed Admission reach this point?"**

---

### Readiness Assessment

Presents the system's assessment of the proposed Admission.

Readiness highlights observations that may assist organisational judgement.

Readiness supports the operator.

It does not replace operator authority.

This section answers:

> **"Does this Admission appear ready for approval?"**

---

### Business Decision

The final section supports the organisational decision.

Typical business outcomes include:

- Approve Admission
- Continue Preparation
- Decline Admission

Only after organisational approval does the Admission Transaction begin.

---

## Information Hierarchy

The Admission Workspace should present information in the following order of business importance:

1. Admission Summary
2. Identity Review
3. Commercial Review
4. Accommodation Review
5. Reservation Review
6. Readiness Assessment
7. Business Decision

This hierarchy mirrors the natural sequence in which operators evaluate a proposed Admission.

---

## Navigation Philosophy

The Admission Workspace should allow operators to complete the entire preparation process without unnecessary movement between workspaces.

Where revisions are required, the workspace should update the Reservation directly while preserving Reservation ownership of Expected Truth.

Navigation to operational workspaces occurs only after successful completion of the Admission Transaction.

---

## Workspace Layout Principles

The Admission Workspace Layout follows several constitutional principles.

### Principle 1 — The Layout Supports Decisions

Every section exists to improve organisational judgement.

---

### Principle 2 — Information Precedes Commitment

Operators should understand the proposed Admission before approving it.

---

### Principle 3 — Readiness Before Approval

The workspace should clearly distinguish organisational preparation from organisational commitment.

---

### Principle 4 — One Business Narrative

The workspace should tell one coherent business story from Reservation through Admission.

---

### Principle 5 — Approval Is the Destination

The workspace should naturally guide the operator toward an informed organisational decision rather than encourage rapid transaction execution.

# 13. Dashboard

The Admission Dashboard provides an operational overview of all proposed Admissions currently awaiting organisational review and approval.

Its purpose is to help operators identify Admissions requiring attention, understand organisational workload and prioritise business decisions.

The dashboard exists to support decision-making rather than transaction execution.

---

## Purpose

The Admission Dashboard provides an immediate understanding of the organisation's current Admission workload.

It helps operators answer one question:

> **Which proposed Admissions require my attention today?**

The dashboard enables operators to prioritise review activities before opening individual Admission Workspaces.

---

## Business Philosophy

The Admission Dashboard is a decision-support dashboard.

Unlike operational dashboards that monitor ongoing business activities, the Admission Dashboard focuses upon proposed business commitments.

It presents organisational readiness rather than operational performance.

Its purpose is to identify where business judgement is required.

---

## Dashboard Objectives

The Admission Dashboard exists to:

- provide visibility into pending Admissions,
- highlight Admissions requiring review,
- support organisational planning,
- identify proposed Admissions approaching their joining date,
- assist operator prioritisation.

The dashboard should encourage informed decision-making before business commitments are created.

---

## Business Summary

The dashboard presents a high-level summary of current Admission activity.

Typical indicators include:

- Admissions Awaiting Review
- Admissions Ready for Approval
- Admissions Requiring Additional Information
- Admissions Scheduled for Today
- Recently Completed Admissions

These summaries provide immediate operational awareness without requiring review of individual Admissions.

---

## Decision Priorities

The dashboard should identify proposed Admissions that require immediate operator attention.

Examples include:

- Joining scheduled for today.
- Joining scheduled tomorrow.
- Admission awaiting approval.
- Readiness assessment incomplete.
- Commercial review pending.
- Documentation requiring attention.

The dashboard should guide organisational priorities rather than administrative activity.

---

## Readiness Overview

The dashboard should summarise the current readiness of proposed Admissions.

Typical readiness categories may include:

- Ready for Approval
- Requires Review
- Awaiting Information
- Pending Operator Decision

Readiness assists operators in planning their work.

It does not replace organisational judgement.

---

## Recent Business Activity

The dashboard should highlight significant recent Admission activity.

Examples include:

- Admissions approved.
- Admissions declined.
- Exceptional corrective transactions recorded.
- Significant commercial revisions.
- Joining date revisions affecting Admissions.

This allows operators to understand recent organisational decisions before beginning new Admission work.

---

## Scope

The Admission Dashboard focuses exclusively on proposed Admissions.

It intentionally excludes operational information belonging to:

- Resident Management
- Stay Operations
- Accommodation Management
- Financial Operations
- Maintenance
- Checkout

Those responsibilities belong to their respective operational dashboards.

---

## Dashboard Principles

The Admission Dashboard follows several constitutional principles.

### Principle 1 — Decisions Before Transactions

The dashboard exists to identify where organisational decisions are required.

---

### Principle 2 — Business Awareness Before Approval

Operators should understand the current Admission workload before reviewing individual proposed Admissions.

---

### Principle 3 — Readiness Supports Prioritisation

Readiness assists operators in deciding which Admissions require attention first.

---

### Principle 4 — Operational Management Begins After Admission

The Admission Dashboard focuses upon proposed business commitments rather than operational business management.

---

### Principle 5 — Every Dashboard Supports Business Decisions

The Admission Dashboard exists to improve organisational judgement rather than accelerate transaction execution.

# 14. Business Sections

The Admission Workspace is organised into business-focused sections that collectively support the organisation's decision to admit a prospective resident.

Each section has a single business responsibility.

Together, these sections present a complete understanding of the proposed Admission while maintaining clear separation of responsibilities.

The sections are organised according to the operator's decision-making process rather than the underlying technical implementation.

Every section contributes toward one organisational question:

> **Should this prospective resident be admitted?**

---

## Admission Summary

The Admission Summary provides an immediate overview of the proposed Admission.

It presents the most significant information required before reviewing additional details.

Typical business information includes:

- Admission Source
- Proposed Joining Date
- Selected Accommodation
- Expected Monthly Rent
- Expected Security Deposit
- Current Readiness
- Reservation Status

This section answers:

> **"What Admission am I reviewing?"**

---

## Identity Review

The Identity Review section presents the proposed resident's identity information.

Its purpose is to establish confidence regarding the individual being admitted.

Typical information includes:

- Personal Information
- Contact Details
- Government Identity
- Supporting Documentation
- Emergency Contact Information

This section answers:

> **"Are we satisfied with the resident's identity?"**

---

## Commercial Review

The Commercial Review section presents the proposed commercial understanding.

The operator reviews and, where necessary, revises the expected commercial terms before Admission.

Typical information includes:

- Monthly Rent
- Security Deposit
- Commercial Agreements
- Special Commercial Conditions
- Commercial Notes

This section answers:

> **"Are the commercial terms acceptable?"**

---

## Accommodation Review

The Accommodation Review section presents the proposed accommodation.

The operator confirms that the selected accommodation is suitable before organisational approval.

Typical information includes:

- Area
- Flat
- Bed
- Accommodation Preferences
- Accommodation Notes

Accommodation remains provisional until the Admission Transaction commits.

This section answers:

> **"Can we appropriately accommodate this resident?"**

---

## Reservation Review

The Reservation Review section provides the business history leading to the proposed Admission.

Typical information includes:

- Reservation Summary
- Reservation Notes
- Reservation Business Timeline
- Significant Business Events

This section provides business context for the proposed Admission.

It answers:

> **"How did this Admission reach this stage?"**

---

## Readiness Assessment

The Readiness Assessment section provides the system's evaluation of the proposed Admission.

Readiness assists the operator by highlighting observations that may deserve additional review.

Readiness does not replace organisational judgement.

Typical observations may include:

- Identity Review Complete
- Commercial Review Complete
- Accommodation Review Complete
- Business Recommendations
- Outstanding Observations

This section answers:

> **"Does the proposed Admission appear ready?"**

---

## Business Decision

The Business Decision section concludes the Admission Workspace.

It presents the available organisational decisions.

Typical decisions include:

- Continue Preparation
- Approve Admission
- Decline Proposed Admission

Business commitment occurs only after organisational approval.

This section answers:

> **"What decision should the organisation make?"**

---

## Section Relationships

Each section supports a different aspect of organisational decision-making.

No section duplicates the responsibility of another.

For example:

- Identity Review establishes confidence in the proposed resident.
- Commercial Review establishes confidence in the business agreement.
- Accommodation Review establishes confidence in operational suitability.
- Reservation Review provides historical context.
- Readiness Assessment provides business guidance.
- Business Decision records organisational intent.

Together these sections enable confident organisational approval.

---

## Business Section Principles

The Admission Business Sections follow several constitutional principles.

### Principle 1 — One Section, One Responsibility

Each section owns one clearly defined business responsibility.

---

### Principle 2 — Review Before Approval

Every section contributes to organisational understanding before Business Truth is created.

---

### Principle 3 — Decision-Oriented Organisation

Sections are organised according to business judgement rather than database structure.

---

### Principle 4 — Business Context Improves Decisions

Historical context should be available before organisational approval.

---

### Principle 5 — Every Section Supports Organisational Judgement

Each section exists to improve the quality of the Admission decision before the Admission Transaction begins.

# 15. Business Actions

Business Actions represent the meaningful organisational decisions that may be performed within the Admission Workspace.

Unlike operational workspaces, the Admission Workspace contains very few business actions.

Its purpose is not ongoing business management.

Its purpose is to support one significant organisational decision:

> **Should this prospective resident be admitted?**

Every Business Action therefore contributes to preparation, review or organisational approval.

---

## Business Philosophy

Business Actions exist to support organisational judgement.

Actions should never encourage premature commitment.

Instead, they should assist operators in:

- reviewing information,
- refining expected information,
- improving readiness,
- making informed organisational decisions.

Business commitment occurs only through the Admission Transaction.

---

## Action Availability

Business Actions depend upon the current stage of Preparation.

Actions should remain available only while the proposed Admission has not yet been committed.

Following successful completion of the Admission Transaction, the Admission Workspace concludes.

Ongoing operational activities belong to the operational workspaces.

---

## Continue Preparation

Continue Preparation allows the operator to postpone organisational approval while additional review or revision is required.

Typical reasons include:

- additional discussions,
- document verification,
- commercial negotiation,
- accommodation review,
- organisational consultation.

Continuing Preparation creates no Business Truth.

Expected Truth continues to belong to the Reservation.

---

## Revise Expected Information

The operator may revise Expected Truth whenever business circumstances require.

Examples include:

- Expected Monthly Rent.
- Expected Security Deposit.
- Proposed Joining Date.
- Selected Accommodation.
- Reservation Notes.

These revisions update the Reservation directly.

The Admission Workspace never creates an independent copy of Expected Truth.

---

## Approve Admission

Approve Admission represents the operator's organisational decision to accept the proposed resident.

Approval authorises the Admission Transaction.

Approval itself does not create Business Truth.

Following approval:

- Business Validation occurs.
- The Admission Transaction executes.
- Business ownership transfers.
- Operational business relationships are established.

---

## Decline Proposed Admission

The operator may decide not to admit the prospective resident.

In such cases:

- the Admission Transaction never begins,
- no Business Truth is created,
- the Reservation may remain Active or be Cancelled according to the organisational decision.

Declining a proposed Admission represents a legitimate business outcome.

It is not considered transaction failure.

---

## Exceptional Situations

Exceptional corrective transactions do not form part of the normal Admission business flow.

Where organisational policy permits correction of a completed Admission, such corrections shall be performed through a dedicated corrective transaction defined in its own workspace specification.

The Admission Workspace is intentionally limited to supporting the normal Admission process.

---

## Actions That Do Not Belong

The Admission Workspace intentionally excludes ongoing operational actions.

Examples include:

- Resident Management.
- Stay Management.
- Accommodation Management.
- Financial Operations.
- Door Access Administration.
- Electricity Billing.
- Laundry Operations.
- Maintenance.
- Checkout.

These responsibilities begin only after successful Admission.

---

## Business Action Principles

The Admission Business Actions follow several constitutional principles.

### Principle 1 — Actions Support Decisions

Every Business Action should contribute toward organisational decision-making.

---

### Principle 2 — Approval Creates Authority

Operator approval authorises the Admission Transaction.

It does not itself create Business Truth.

---

### Principle 3 — Revision Preserves Ownership

Business revisions continue to update the Reservation throughout Preparation.

---

### Principle 4 — Declining Is a Valid Business Decision

Choosing not to admit a prospective resident represents an organisational outcome rather than transaction failure.

---

### Principle 5 — Exceptional Corrections Preserve History

Business corrections should occur through explicit corrective transactions rather than deletion of historical Business Truth.

# 16. Navigation

The Admission Workspace forms part of the resident lifecycle and exists as the business transition between Reservation and the operational workspaces.

Its navigation model reflects this responsibility.

Navigation should always preserve the operator's understanding of the business process while maintaining clear transaction boundaries.

---

## Navigation Philosophy

The Admission Workspace is not an isolated screen.

It exists within the broader resident journey.

Navigation should therefore reflect the progression from:

Expectation

↓

Preparation

↓

Business Decision

↓

Business Commitment

↓

Operational Management

The operator should always understand where the proposed Admission currently sits within this journey.

---

## Entry Points

The Admission Workspace may be entered through several business pathways.

Typical entry points include:

- Reservation Workspace
- Reservation Dashboard
- Walk-in Admission
- Alumni Readmission
- Business Notifications

Regardless of the entry path, every Admission follows the same business principles and transaction model.

---

## During Preparation

While the Admission is in Preparation:

- operators may review information,
- revise Expected Truth,
- navigate between business sections,
- return to the Reservation when appropriate.

Preparation creates no Business Truth.

Navigation during Preparation therefore carries no transactional consequence.

---

## After Successful Admission

Following successful completion of the Admission Transaction, responsibility transfers to the operational workspaces.

Navigation should naturally continue to:

- Resident Workspace
- Stay Workspace
- Finance Workspace
- Accommodation Workspace

The Admission Workspace itself has completed its responsibility.

---

## Declined Admission

Where the organisation decides not to proceed with Admission:

- the Admission Transaction never begins,
- navigation returns to the appropriate Reservation context or business dashboard,
- no operational workspace is entered.

---

## Failed Validation

If Validation fails immediately before commitment:

- no Business Truth is created,
- Preparation resumes,
- the operator remains within the Admission Workspace,
- navigation does not leave the transaction.

This allows business review to continue without losing context.

---

## Navigation Principles

The Admission Navigation model follows several constitutional principles.

### Principle 1 — Navigation Follows the Business Journey

Navigation should reflect the resident lifecycle rather than technical implementation.

---

### Principle 2 — Preparation Preserves Context

Operators should remain within the Admission Workspace until a business decision has been reached.

---

### Principle 3 — Operational Navigation Begins After Admission

Navigation to operational workspaces occurs only after Business Truth has been established.

---

### Principle 4 — Failed Transactions Preserve Preparation

Validation failure returns the operator to Preparation without creating Business Truth.

---

### Principle 5 — Navigation Supports Business Understanding

Every navigation path should reinforce the operator's understanding of the resident lifecycle and organisational decision-making process.

# 17. Business Rules

The Admission Workspace operates according to the constitutional business rules defined by RPGMS.

These rules preserve business integrity, ensure consistent organisational behaviour and establish clear transaction boundaries.

Business Rules define *what must always be true* regardless of implementation.

---

# Admission Rules

### Rule ADM-001 — Admission Is a Business Transaction

Admission shall always be treated as a Business Transaction.

It shall never be treated as a long-lived operational business object.

---

### Rule ADM-002 — Admission Requires Organisational Approval

Every Admission shall require explicit organisational approval before the Admission Transaction begins.

No resident may be admitted automatically.

---

### Rule ADM-003 — Preparation Creates No Business Truth

Preparation shall never create:

- Resident
- Stay
- Accommodation Allocation
- Financial Relationship
- Business Events

Business Truth begins only after successful completion of the Admission Transaction.

---

### Rule ADM-004 — Reservation Owns Expected Truth

Throughout Preparation, Expected Truth shall remain the responsibility of the Reservation.

The Admission Workspace shall never create an independent copy of Expected Truth.

---

### Rule ADM-005 — One Source of Expected Truth

At every point during Preparation there shall be exactly one authoritative source of Expected Truth.

That source shall always be the Reservation.

---

### Rule ADM-006 — Admission Creates Residency

Successful Admission establishes the individual as an active Resident of the organisation.

Residency begins only after successful completion of the Admission Transaction.

---

### Rule ADM-007 — Physical Occupancy Is Not Admission

Physical occupancy shall not determine whether Admission has occurred.

A resident may occupy the allocated accommodation before or after Admission.

Admission establishes organisational acceptance rather than physical presence.

---

### Rule ADM-008 — Admission Is Atomic

The Admission Transaction shall either:

- complete successfully,

or

- fail completely.

Partial Admission shall never be considered a valid business state.

---

### Rule ADM-009 — Validation Precedes Commitment

Business Validation shall occur immediately before Business Truth is created.

Validation shall protect organisational integrity.

---

### Rule ADM-010 — Failed Validation Creates No Business Truth

Where Validation fails:

- the Admission Transaction shall not commit,
- Business Truth shall not be created,
- Preparation shall resume.

---

### Rule ADM-011 — Readiness Is Advisory

Readiness shall assist operator judgement.

Readiness shall never replace organisational authority.

---

### Rule ADM-012 — Operator Authority Prevails

Where organisational policy permits, the operator may override business recommendations.

The operator's approved decision becomes Business Truth.

---

### Rule ADM-013 — Operational Ownership Begins After Admission

Following successful Admission:

- Resident owns Identity Truth.
- Stay owns Operational Truth.
- Accommodation owns Allocation Truth.
- Finance owns Financial Truth.
- Business Events own Historical Truth.

Admission retains no ongoing ownership.

---

### Rule ADM-014 — One Business Truth Has One Owner

Each category of Business Truth shall have one and only one authoritative business owner.

Ownership shall transfer exactly once through the Admission Transaction.

---

### Rule ADM-015 — Declining Is Not Failure

Choosing not to admit a prospective resident represents an organisational business decision.

It shall not be considered transaction failure.

---

### Rule ADM-016 — Business History Is Immutable

Admission shall never be deleted.

Business history shall always remain complete.

Where correction is required, an authorised corrective business transaction shall be performed.

---

### Rule ADM-017 — Corrective Transactions Are Separate

Exceptional corrective transactions shall be defined independently from the normal Admission process.

The Admission Workspace shall not implement corrective transaction behaviour.

---

### Rule ADM-018 — Operational Activities Begin After Admission

Operational activities including:

- Door Access
- Electricity
- Laundry
- Maintenance
- Complaints

shall begin only after successful Admission.

They are not responsibilities of the Admission Workspace.

---

### Rule ADM-019 — Every Resident Has One Admission

Every active Stay shall originate from exactly one successful Admission Transaction.

---

### Rule ADM-020 — Every Admission Produces Business Events

Every successful Admission shall generate Business Events sufficient to explain:

- organisational approval,
- ownership transfer,
- operational commencement,
- historical business context.

---

# Business Rule Principles

The Admission Business Rules follow the constitutional principles of RPGMS.

### Principle 1 — Business Truth Is Intentional

Business Truth shall exist only through explicit organisational approval.

---

### Principle 2 — Transactions Preserve Integrity

Business Transactions shall maintain complete organisational consistency.

---

### Principle 3 — History Is Never Erased

Business history shall be corrected through reversing transactions rather than deletion.

---

### Principle 4 — Ownership Shall Always Be Explicit

Business ownership shall remain clear throughout the resident lifecycle.

---

### Principle 5 — Operator Authority Is Fundamental

The organisation makes business decisions.

RPGMS validates, executes and records those decisions.

# 18. Engineering Notes

This section provides implementation guidance for engineers implementing the Admission Workspace.

These notes do not define business behaviour.

Business behaviour is defined exclusively by the preceding sections of this specification.

Engineering decisions shall always preserve the constitutional business principles described throughout this document.

---

## Separation of Responsibilities

Engineers shall clearly separate:

- Admission Workspace
- Admission Preparation
- Readiness Assessment
- Business Validation
- Admission Transaction

These responsibilities shall not be combined into a single implementation component.

Each represents a distinct business responsibility.

---

## Preparation

Preparation is a business state.

It is not a transaction.

Implementation shall ensure that:

- no operational objects are created,
- no Business Truth exists,
- Reservation remains the owner of Expected Truth.

Preparation should remain fully recoverable.

---

## Expected Truth

Expected Truth shall continue to be stored and managed by the Reservation.

The Admission Workspace shall never maintain an independent copy of Expected Truth.

All revisions performed during Preparation shall update the Reservation directly.

---

## Readiness

Readiness represents business guidance.

Implementation shall ensure that Readiness:

- evaluates the current proposal,
- produces meaningful business observations,
- never creates Business Truth,
- never replaces operator authority.

Readiness is advisory.

It is not validation.

---

## Validation

Validation occurs immediately before commitment.

Implementation shall validate all constitutional business rules before beginning the Admission Transaction.

Where Validation fails:

- no Business Truth shall be created,
- Preparation shall continue,
- operators shall retain the opportunity to revise the proposed Admission.

---

## Atomic Transaction

The Admission Transaction shall execute atomically.

Implementation shall ensure that the following either all succeed or all fail together:

- Resident creation or reuse
- Stay creation
- Accommodation allocation
- Finance initialization
- Reservation conversion
- Business Event generation

Partial completion shall never occur.

---

## Business Events

Implementation shall generate Business Events describing the business significance of the Admission.

Events should explain:

- organisational approval,
- ownership transfer,
- establishment of Residency,
- commencement of operational responsibility.

Business Events should describe business activity rather than technical implementation.

---

## Operational Handover

Following successful Admission:

- operational ownership transfers,
- the Admission Workspace concludes,
- operational workspaces assume responsibility.

Implementation should avoid retaining unnecessary Admission state after successful completion.

---

## Future Extensibility

The Admission implementation should remain sufficiently modular to support future business transactions including:

- Admission Reversal
- Checkout
- Settlement
- Resident Transfers
- Future transactional workflows

Future work should inherit the same transaction architecture established by this specification.

---

## Engineering Principles

Implementation shall preserve the following constitutional principles:

- Business before technology.
- One Business Truth, one owner.
- Preparation creates no Business Truth.
- Transactions are atomic.
- History is preserved.
- Operator authority is respected.
- System recommendations never replace organisational judgement.

# 19. AI Implementation Checklist

The following checklist shall be completed before implementing any Admission-related functionality.

Its purpose is to ensure that implementation remains faithful to the constitutional business architecture defined throughout this specification.

Implementation shall preserve business principles before considering technical design.

---

## Business Understanding

Before writing code, confirm that the implementation correctly understands:

- Admission is a Business Transaction.
- Admission is not a long-lived Business Object.
- Admission establishes Residency.
- Admission creates no permanent business ownership.
- Reservation owns Expected Truth until Admission commits.
- Admission transfers Business Truth to the operational business objects.

---

## Workspace Behaviour

Confirm that the Admission Workspace:

- supports Preparation,
- supports organisational review,
- supports Readiness Assessment,
- supports organisational approval,
- never creates Business Truth during Preparation.

The workspace exists to support business judgement.

It is not a data-entry form.

---

## Preparation

Confirm that:

- Preparation creates no Business Truth.
- Expected Truth remains owned by the Reservation.
- Revisions update the Reservation directly.
- No duplicate source of Expected Truth exists.

---

## Readiness

Confirm that Readiness:

- provides recommendations,
- assists organisational judgement,
- never replaces operator authority,
- remains separate from Validation.

---

## Validation

Confirm that Validation:

- occurs immediately before commitment,
- validates constitutional business rules,
- prevents invalid business commitments,
- creates no Business Truth when validation fails.

Where Validation fails:

- the Admission Transaction shall not execute,
- Preparation shall continue.

---

## Admission Transaction

Confirm that the Admission Transaction:

- executes atomically,
- succeeds completely or fails completely,
- creates no partial operational state.

Successful completion shall establish:

- Resident,
- Stay,
- Accommodation Allocation,
- Financial Relationship,
- Business Events.

---

## Business Ownership

Confirm that implementation preserves explicit ownership.

Following successful Admission:

- Resident owns Identity Truth.
- Stay owns Operational Truth.
- Accommodation owns Allocation Truth.
- Finance owns Financial Truth.
- Business Events own Historical Truth.

Admission shall retain no continuing ownership.

---

## Operator Authority

Confirm that implementation preserves the constitutional principle:

> System recommends.
>
> Operator decides.
>
> RPGMS executes and records.

Business recommendations shall never become automatic business decisions.

---

## Business History

Confirm that implementation:

- records Business Events,
- preserves historical integrity,
- never deletes completed Admissions,
- supports future corrective transactions defined in their own workspace specifications.
  
---

## Architectural Integrity

Before implementation is considered complete, verify that:

- Business architecture remains unchanged.
- Constitutional principles are preserved.
- One Business Truth has one owner.
- Preparation remains separate from the Admission Transaction.
- Readiness remains separate from Validation.
- Approval remains separate from Commitment.
- Operational responsibility begins only after successful Admission.

---

## Final Verification

Implementation shall be considered complete only when all of the following are true:

✓ Business architecture has been preserved.

✓ Transaction boundaries remain explicit.

✓ Ownership transfer remains explicit.

✓ Atomic transaction behaviour is maintained.

✓ Historical integrity is preserved.

✓ Operator authority remains intact.

✓ Business Events explain the transaction.

✓ Operational workspaces receive ownership correctly.

✓ The implementation reflects the business philosophy rather than merely satisfying technical requirements.

---

## Implementation Principle

Business architecture shall always take precedence over implementation convenience.

Where implementation and business architecture appear to conflict, implementation shall be revised to preserve the business model rather than altering the business model to simplify implementation.

# Appendix A — Business Vocabulary

This appendix defines the business vocabulary used throughout the Admission Workspace Specification.

## Preparation

The business activity through which the organisation reviews, verifies and refines Expected Truth before making an Admission decision.

Preparation creates no Business Truth.

---

## Readiness

The system's advisory assessment of the proposed Admission.

Readiness supports organisational judgement.

It does not replace operator authority.

---

## Operator Approval

The operator's decision that the proposed Admission should proceed.

Approval authorises the Admission Transaction.

Approval itself creates no Business Truth.

---

## Business Confirmation

The organisational decision to formally accept the prospective resident.

Business Confirmation precedes execution of the Admission Transaction.

---

## Validation

The final mandatory verification performed immediately before commitment.

Validation protects Business Truth.

Validation cannot be overridden.

---

## Admission Transaction

The atomic business transaction that establishes Residency and transfers Business Truth to the operational business objects.

---

## Expected Truth

Business information owned by the Reservation.

Expected Truth remains provisional until Admission commits.

---

## Business Truth

Confirmed business information established through successful completion of the Admission Transaction.

Business Truth is owned by the operational business objects.

# Appendix B — Admission Business Flow

Reservation

↓

Preparation

↓

Readiness Assessment

↓

Operator Approval

↓

Business Confirmation

↓

Business Validation

↓

Admission Transaction

↓

Resident
Stay
Accommodation
Finance
Business Events

