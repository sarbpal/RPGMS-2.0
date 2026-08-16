# Reservation Workspace Specification

**Document ID:** SPEC-RSV-001

**Version:** 1.0

**Status:** Frozen

**Owner:** Product Architecture

**Last Updated:** 2026-08-06

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | 2026-08-06 | Initial Reservation Workspace Specification created during Capability Release 2 Business Discovery. |

# 1. Purpose

The Reservation Workspace defines the operational interface for managing future admissions within RPGMS 2.0.

A Reservation represents the organisation's current expectation of admitting a person into the organisation at a future date.

The Reservation Workspace enables operators to:

- Create Reservations.
- Review Active Reservations.
- Manage Reservation preferences.
- Maintain expected commercial information.
- Track Reservation progress through meaningful Business Events.
- Convert an Active Reservation into an Admission.
- Cancel Reservations that are no longer required.

The Reservation Workspace deliberately separates future intent from operational residency.

A Reservation does not allocate accommodation, create a Resident, create a Stay, or establish a financial relationship.

Those responsibilities belong to the Admission Transaction Workspace.

---

# 2. Scope

The Reservation Workspace manages the complete lifecycle of a Reservation from creation until one of its terminal outcomes.

The Reservation Workspace includes:

- Reservation creation.
- Reservation modification while Active.
- Reservation review.
- Reservation preferences.
- Expected commercial information.
- Business Timeline.
- Reservation conversion.
- Reservation cancellation.

The Reservation Workspace does not perform:

- Resident creation.
- Stay creation.
- Bed allocation.
- Financial account creation.
- Billing.
- Payment processing.

These responsibilities belong to other business domains and are coordinated during Admission.

---

# 3. Business Context

Reservation is the first business commitment within the Resident Lifecycle.

RPGMS does not record casual enquiries, telephone conversations, or informal discussions.

A person becomes part of RPGMS only when one of the following occurs:

- A Reservation is created.
- A Walk-in Admission begins.

The Reservation Workspace therefore represents the first formal business relationship between the organisation and a prospective resident.

Reservation captures the organisation's current expectation regarding a future Admission while recognising that operational and commercial details may change before Admission is confirmed.

The Reservation Workspace therefore manages expected business information rather than confirmed operational information.

# 4. Business Philosophy

The Reservation Workspace is founded on the principle that a Reservation represents an organisational expectation rather than an operational commitment.

A Reservation expresses the intention of both the organisation and the prospective resident to begin a residency relationship in the future.

The Reservation Workspace therefore manages expected business information while recognising that circumstances may change before Admission.

A Reservation does not create a Resident, allocate accommodation, establish a Stay, or initiate financial operations.

Those responsibilities belong to the Admission Transaction Workspace.

The Reservation Workspace exists to manage future intent until the organisation formally decides to admit the person.

---

# 5. Reservation Definition

A Reservation is the organisation's current expectation of admitting a person into the organisation at a future date.

A Reservation represents:

- An expected future Admission.
- Expected commercial terms.
- Expected joining information.
- Accommodation preferences.
- Business understanding between the organisation and the prospective resident.

A Reservation does not represent:

- A confirmed Admission.
- A Resident.
- A Stay.
- A financial account.
- Accommodation allocation.

The Reservation remains an independent business object until it reaches one of its terminal outcomes.

---

# 6. Business Responsibilities

The Reservation Workspace is responsible for:

- Creating Reservations.
- Managing Reservation information.
- Maintaining expected joining information.
- Recording accommodation preferences.
- Recording expected commercial information.
- Maintaining meaningful Business Events.
- Supporting operational follow-up.
- Converting Reservations into Admissions.
- Cancelling Reservations.

The Reservation Workspace is not responsible for:

- Resident identity management.
- Accommodation allocation.
- Stay management.
- Financial account management.
- Billing.
- Payment processing.

Those responsibilities remain within their respective business domains.

---

# 7. Business Ownership

Reservation owns the organisation's expected understanding of a future Admission.

Reservation owns:

- Expected joining date.
- Expected duration of stay.
- Expected commercial terms.
- Accommodation preferences.
- Reservation notes.
- Reservation lifecycle.
- Reservation Business Timeline.

Reservation does not own:

- Resident identity.
- Bed allocation.
- Operational residency.
- Financial ledger.
- Payments.
- Bills.

Business ownership transfers during Admission when expected information becomes confirmed business information.

---

# 8. Expected Truth

Reservation is the owner of Expected Truth within RPGMS.

Expected Truth represents the organisation's current understanding of a future business relationship.

Expected Truth may change throughout the Reservation lifecycle.

Examples include:

- Expected joining date.
- Expected monthly rent.
- Expected security deposit.
- Preferred accommodation.
- Special requests.
- Operational notes.

Whenever Expected Truth changes, the Reservation is updated to reflect the latest business understanding.

Significant business changes are recorded as Business Events within the Reservation Timeline.

The Reservation always represents the current expectation while the Business Timeline preserves the historical evolution of that expectation.

## 9. Reservation Lifecycle

### Purpose

The Reservation Lifecycle describes the business states through which a Reservation progresses from creation until its conclusion.

Unlike operational entities such as Stay, a Reservation represents an expectation rather than an active business commitment. Its lifecycle is therefore intentionally simple and focused on the organization's current expectation regarding a future admission.

The lifecycle exists to answer one business question:

> **What is the organization's current expectation regarding this future admission?**

A Reservation never becomes operational. Instead, it either successfully transitions into an Admission or it is intentionally concluded without admission.

---

### Lifecycle Philosophy

A Reservation exists only while the business expects that an admission may occur.

Once that expectation no longer exists, the Reservation must reach a terminal state.

There are only two possible conclusions:

- The guest joins the PG.
- The expected admission will not occur.

There is intentionally no intermediate or inactive state.

The Reservation should always clearly communicate the organization's current expectation.

---

### Lifecycle States

#### ACTIVE

The Reservation currently represents an expected future admission.

Characteristics:

- Reservation is visible in active reservation lists.
- Expected joining date may be modified.
- Commercial terms may be revised.
- Accommodation preferences may be updated.
- Notes may be added.
- Reminders may be recorded.
- Reservation remains eligible for Admission.

This is the only working state.

---

#### CONVERTED

The Reservation has successfully resulted in an Admission.

Characteristics:

- Reservation becomes read-only.
- Business responsibility transfers to:
  - Resident
  - Stay
  - Finance
  - Accommodation
- Reservation permanently records the historical expectation that led to the Admission.
- Reservation remains available for historical reference.

A Converted Reservation can never return to Active.

---

#### CANCELLED

The expected admission will no longer occur.

Characteristics:

- Reservation becomes read-only.
- Cancellation reason is recorded.
- Business Timeline records the cancellation.
- Reservation remains available for historical reporting.

A Cancelled Reservation can never become Active again.

If the individual wishes to join again in the future, a new Reservation is created.

---

### State Transition Model

```
ACTIVE
   │
   ├────────────► CONVERTED
   │
   └────────────► CANCELLED
```

No other transitions are permitted.

The lifecycle intentionally remains minimal to preserve business clarity.

---

### Lifecycle Principles

The Reservation Lifecycle follows several constitutional business principles.

#### Principle 1 — A Reservation always reflects current business expectation.

There should never be uncertainty regarding whether the organization still expects the admission.

---

#### Principle 2 — Terminal states are permanent.

Once a Reservation has concluded, its historical record must remain unchanged.

---

#### Principle 3 — Expectations are historical.

After conversion or cancellation, the Reservation serves as a permanent record of what the organization expected at that point in time.

Subsequent business activities belong to other business objects.

---

#### Principle 4 — One Reservation represents one expected admission.

Multiple future admissions require multiple Reservations.

Reservations are never reused.

---

#### Principle 5 — Lifecycle simplicity improves operational clarity.

Operators should never need to interpret ambiguous states.

The Reservation should always communicate one clear business meaning.

## 10. Business Timeline Philosophy

### Purpose

Every Reservation maintains a Business Timeline that records the significant business events that occurred during its lifetime.

The timeline explains the business story of the Reservation from creation until its conclusion.

It allows any operator to understand:

- What happened
- When it happened
- Who performed it
- Why it happened

without needing to inspect multiple business objects or technical logs.

The Business Timeline is a business communication tool, not a technical auditing mechanism.

---

### Business Philosophy

A Reservation evolves through business decisions.

Expected joining dates may change.

Commercial terms may be negotiated.

Preferences may be revised.

Reminders may be sent.

Eventually the Reservation is either converted into an Admission or cancelled.

Each of these decisions forms part of the Reservation's business history.

The Business Timeline preserves that history in chronological order.

---

### Timeline Objectives

The Business Timeline exists to achieve four primary objectives.

#### Explain the Reservation Story

An operator should be able to understand the complete history of the Reservation simply by reading the timeline.

The timeline should answer questions such as:

- When was the Reservation created?
- Was the joining date changed?
- Were commercial terms revised?
- Were reminders sent?
- Why was the Reservation cancelled?
- When was it converted into an Admission?

---

#### Preserve Business Decisions

The timeline records meaningful business decisions rather than every field modification.

It documents what changed from a business perspective, not every technical database update.

---

#### Improve Operational Continuity

Reservations are often handled by multiple operators over time.

The timeline allows each operator to immediately understand the current situation without requiring verbal handover.

---

#### Support Historical Understanding

After a Reservation has been converted or cancelled, the timeline provides the historical context behind that outcome.

It explains how the Reservation reached its final state.

---

### What Belongs in the Timeline

Only business-significant events should appear.

Typical events include:

- Reservation Created
- Expected Joining Date Changed
- Expected Monthly Rent Revised
- Expected Security Deposit Revised
- Accommodation Preferences Updated
- Reservation Notes Added
- Reminder Sent
- Reservation Converted
- Reservation Cancelled

These events describe meaningful business activity.

---

### What Does Not Belong

The timeline intentionally excludes technical or insignificant changes.

Examples include:

- Opening the Reservation
- Closing the workspace
- Viewing details
- Refreshing data
- UI navigation
- Internal calculations
- System rendering events
- Database synchronization

These are implementation concerns rather than business events.

---

### Timeline Characteristics

The Business Timeline should always be:

- Chronological
- Immutable
- Human-readable
- Business-oriented
- Easy to understand

Each entry should clearly communicate:

- What happened
- When it happened
- Who performed the action
- Any relevant business context

The timeline should read naturally as the history of the Reservation.

---

### Relationship to Business Events

The Business Timeline is a presentation of significant Business Events associated with the Reservation.

Not every Business Event must necessarily be displayed, but every timeline entry represents a meaningful business event.

This maintains a clear separation between:

- the underlying Business Event model, which serves as the organization's historical record, and
- the Business Timeline, which presents those events in a form that operators can easily understand.

---

### Constitutional Principles

The Reservation Business Timeline follows several constitutional principles.

#### Principle 1 — Business Before Technology

The timeline records business events, not technical events.

---

#### Principle 2 — History Must Explain Decisions

Every entry should help an operator understand why the Reservation reached its current state.

---

#### Principle 3 — History Is Permanent

Business history forms part of the organization's permanent record and must not be rewritten.

Corrections are represented by new business events rather than altering previous history.

---

#### Principle 4 — Read the Story, Not the Database

An operator should understand the complete business journey of a Reservation by reading the timeline, without needing to inspect individual database records or system logs.

## 11. Workspace Philosophy

### Purpose

The Reservation Workspace provides a dedicated environment for managing the organization's expectation of a future Admission.

Its purpose is not merely to capture information, but to support the business process of preparing for a possible future resident while acknowledging that all information remains provisional until Admission is confirmed.

The workspace should help operators understand the current expectation, make informed business decisions, and prepare for a smooth Admission when the resident arrives.

---

### Business Philosophy

A Reservation represents an expectation rather than a commitment.

The workspace should therefore encourage preparation instead of execution.

Operators should feel confident making changes as discussions evolve with the prospective resident.

Expected joining dates may change.

Commercial terms may be negotiated.

Accommodation preferences may evolve.

Additional notes may be recorded.

All such changes are natural parts of the reservation process and should be accommodated without creating unnecessary complexity.

Only when an Admission is confirmed does the business move from expectation to commitment.

---

### Expected Truth Workspace

The Reservation Workspace is the home of **Expected Truth**.

Every piece of information within the workspace represents what the organization currently expects to happen.

Examples include:

- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Accommodation Preferences
- Special Requests
- Reservation Notes

These values guide future business decisions but do not create operational commitments.

The workspace intentionally avoids representing confirmed operational data.

---

### Decision-Oriented Workspace

The Reservation Workspace supports business decisions rather than administrative data entry.

Operators should be able to quickly answer questions such as:

- Is this Reservation still expected to convert?
- Are the commercial terms agreed?
- Has the joining date changed?
- Have reminders been sent?
- Are accommodation preferences understood?
- Is the Reservation ready for Admission?

The workspace exists to support these decisions efficiently.

---

### Flexible by Design

Reservations often evolve over several conversations.

The workspace therefore assumes that information will change.

Operators should be able to revise expected information whenever business circumstances require.

Updating expectations should be considered normal business activity rather than an exception.

Each significant revision contributes to the business story recorded in the Business Timeline.

---

### Separation of Business Responsibilities

The Reservation Workspace intentionally limits its responsibilities.

It owns only the information required to describe an expected future Admission.

It does not:

- Allocate accommodation.
- Create Residents.
- Create Stays.
- Generate financial obligations.
- Initiate occupancy.
- Commit operational changes.

Those responsibilities belong to the Admission transaction.

Maintaining this separation keeps business ownership clear and prevents premature commitments.

---

### Operator-Centric Design

The workspace is designed to support the operator's judgment.

The system may provide recommendations based on business rules.

However, the operator remains responsible for making business decisions.

Examples include:

- Revising expected rent.
- Updating the joining date.
- Recording accommodation preferences.
- Cancelling a Reservation.
- Initiating Admission.

The system assists.

The operator decides.

The organization records the outcome.

---

### Single Source of Expected Truth

Throughout the lifecycle of a Reservation, the Reservation Workspace serves as the authoritative source of all expected information.

Other workspaces may reference this information during preparation, but ownership remains with the Reservation until Admission is confirmed.

When an Admission occurs, confirmed information is transferred to the appropriate business objects, and the Reservation becomes a historical record of the expectations that existed before commitment.

---

### Constitutional Principles

The Reservation Workspace follows several constitutional principles.

#### Principle 1 — Expectation Before Commitment

The workspace exists to manage expectations, not operational commitments.

---

#### Principle 2 — Preparation Before Execution

Operators should be able to prepare every aspect of a future Admission without causing permanent business changes.

---

#### Principle 3 — One Business Responsibility

The Reservation Workspace owns Expected Truth and nothing more.

Operational Truth belongs elsewhere.

---

#### Principle 4 — Business Decisions Drive the Workspace

The workspace is organized around business decisions and business understanding rather than database structure or technical implementation.

---

#### Principle 5 — Operator Judgment Is Central

The system provides guidance and validation.

The operator remains responsible for business decisions.

Their confirmed decision becomes the organization's Business Truth.

## 12. Workspace Layout

### Purpose

The Reservation Workspace should present all information required to understand, manage and conclude a Reservation throughout its lifecycle.

The layout should follow the natural flow of business thinking rather than the underlying database structure.

An operator should be able to understand the complete state of a Reservation without navigating across multiple workspaces.

---

### Workspace Philosophy

The Reservation Workspace is organized around one central business question:

> **What is the organization's current expectation regarding this future Admission?**

Every section of the workspace contributes towards answering that question.

The workspace should present information in a logical progression from business identity through expected terms, preferences, history and business actions.

---

### Layout Principles

The Reservation Workspace follows several layout principles.

#### Principle 1 — Business Before Data

Information should be grouped according to business meaning rather than technical ownership.

Operators should think in terms of Reservations, not database tables.

---

#### Principle 2 — Most Important Information First

The operator should immediately understand:

- Who the Reservation is for.
- Whether it is still Active.
- Expected Joining Date.
- Current commercial expectations.
- Overall readiness for Admission.

Supporting information should appear afterwards.

---

#### Principle 3 — Read Before Edit

The workspace should encourage understanding before modification.

Operators should first understand the current Reservation before making business decisions.

---

#### Principle 4 — Related Information Together

Business information that contributes to the same decision should be presented together.

For example:

- Commercial expectations belong together.
- Accommodation preferences belong together.
- Reservation history belongs together.

This reduces unnecessary navigation and improves business clarity.

---

#### Principle 5 — Progressive Detail

The workspace should first present the overall business picture.

Additional details should naturally expand from that overview.

An experienced operator should quickly understand the Reservation without reading every field.

---

### Business Sections

The Reservation Workspace is organized into the following business sections.

---

#### Reservation Summary

Provides an immediate understanding of the Reservation.

Typical information includes:

- Reservation Reference
- Current Status
- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Reservation Age
- Reservation Readiness

This section answers:

> "What is the current state of this Reservation?"

---

#### Personal Information

Contains the identifying information required to recognise the prospective resident.

Examples include:

- Name
- Mobile Number
- Emergency Contact
- Identity Information
- Basic Personal Details

This section answers:

> "Who is expected to join?"

---

#### Commercial Expectations

Contains all expected commercial information agreed with the prospective resident.

Examples include:

- Expected Monthly Rent
- Expected Security Deposit
- Commercial Notes
- Special Commercial Agreements

This section answers:

> "What commercial terms are currently expected?"

---

#### Accommodation Preferences

Captures preferences rather than commitments.

Examples include:

- Preferred Area
- Preferred Flat
- Preferred Floor
- Preferred Bed Position
- Other Accommodation Requests

No accommodation is allocated within this section.

This section answers:

> "What accommodation does the resident prefer?"

---

#### Reservation Notes

Contains additional business information that may assist future operators.

Examples include:

- Family requests
- Joining discussions
- Special instructions
- Follow-up notes

The purpose is to preserve business context rather than operational data.

---

#### Business Timeline

Displays the chronological business history of the Reservation.

Typical events include:

- Reservation Created
- Joining Date Revised
- Commercial Terms Updated
- Preferences Updated
- Reminder Sent
- Reservation Converted
- Reservation Cancelled

This section answers:

> "How did this Reservation reach its current state?"

---

#### Business Actions

Contains the business actions that may currently be performed.

Examples include:

- Edit Reservation
- Revise Joining Date
- Update Commercial Terms
- Update Preferences
- Send Reminder
- Cancel Reservation
- Begin Admission

Only actions permitted by the Reservation's current lifecycle state should be available.

---

### Information Hierarchy

The Reservation Workspace should present information in the following order of business importance:

1. Reservation Summary
2. Personal Information
3. Commercial Expectations
4. Accommodation Preferences
5. Reservation Notes
6. Business Timeline
7. Business Actions

This hierarchy reflects the natural sequence in which operators evaluate a Reservation.

---

### Navigation Philosophy

The Reservation Workspace should allow operators to complete the entire Reservation lifecycle without unnecessary movement between different workspaces.

Whenever possible, business decisions should be made within the Reservation Workspace itself.

Navigation to another workspace should occur only when business responsibility transfers to another business object, such as beginning an Admission.

---

### Constitutional Principles

The Reservation Workspace Layout follows several constitutional principles.

#### Principle 1 — One Workspace, One Business Story

An operator should understand the complete Reservation by remaining within the Reservation Workspace.

---

#### Principle 2 — Organize by Business Thinking

Sections exist because they support business decisions, not because they correspond to database entities.

---

#### Principle 3 — Expectations Are Grouped Together

All expected information should remain together within the Reservation Workspace until Admission confirms the Business Truth.

---

#### Principle 4 — History Explains the Present

The Business Timeline provides the context needed to understand why the Reservation appears as it does today.

---

#### Principle 5 — Actions Follow Understanding

Business actions should be performed only after the operator has sufficient context to make an informed decision.

## 13. Dashboard

### Purpose

The Reservation Dashboard provides an immediate business overview of all Reservations currently managed by the organization.

Its purpose is to help operators understand the current reservation pipeline, identify items requiring attention, and prioritize business activities.

The dashboard is intended for operational awareness rather than detailed reservation management.

---

### Business Philosophy

The Reservation Dashboard answers one primary business question:

> **What is the current state of our future admissions?**

It should enable an operator to understand the overall reservation workload before examining individual Reservations.

Rather than displaying extensive details for every Reservation, the dashboard presents meaningful business summaries that support day-to-day operational decision making.

---

### Dashboard Objectives

The Reservation Dashboard exists to:

- Provide visibility into the current reservation pipeline.
- Highlight Reservations requiring immediate attention.
- Support admission planning.
- Assist daily operational prioritization.
- Present meaningful business metrics rather than technical statistics.

The dashboard should communicate business health at a glance.

---

### Business Summary

The dashboard should present a concise summary of the Reservation portfolio.

Typical business indicators include:

- Active Reservations
- Reservations Joining Today
- Upcoming Joining This Week
- Converted Reservations
- Cancelled Reservations

These summaries help operators understand current business activity without reviewing individual records.

---

### Operational Priorities

The dashboard should surface Reservations that require operator attention.

Examples include:

- Joining scheduled for today.
- Joining scheduled within the next few days.
- Reservations requiring follow-up.
- Reservations awaiting commercial confirmation.
- Reservations approaching their expected joining date without further activity.

The purpose is to direct operator attention toward business priorities rather than routine administration.

---

### Reservation Pipeline

The dashboard should provide a high-level view of the organization's future admissions pipeline.

The pipeline reflects the current flow of Reservations through their lifecycle.

It enables operators to understand:

- Expected admissions.
- Completed admissions.
- Reservations that did not proceed.

This provides management with a clear picture of expected business activity.

---

### Admission Readiness

The dashboard should help operators identify Reservations that are ready to progress into Admission.

Typical readiness considerations include:

- Expected joining date approaching.
- Commercial expectations agreed.
- Accommodation preferences recorded.
- Reservation remains Active.

The dashboard supports operational preparation without making business commitments.

---

### Recent Business Activity

The dashboard should highlight significant recent Reservation activity.

Examples include:

- Newly created Reservations.
- Recent commercial revisions.
- Joining date changes.
- Recently converted Reservations.
- Recently cancelled Reservations.

This allows operators beginning their workday to quickly understand recent developments.

---

### Business Insights

The dashboard may present broader business observations that support planning and operational awareness.

Examples include:

- Expected admissions over the coming days.
- Reservation conversion trends.
- Cancellation patterns.
- Distribution of preferred joining dates.
- Commercial expectation trends.

These insights assist business planning without influencing individual business decisions.

---

### Scope

The Reservation Dashboard is intentionally limited to Reservation information.

It does not present operational details belonging to:

- Residents
- Stays
- Accommodation occupancy
- Financial balances
- Maintenance activities

Those belong to their respective workspaces.

The dashboard remains focused on the organization's future admissions.

---

### Constitutional Principles

The Reservation Dashboard follows several constitutional principles.

#### Principle 1 — Business Awareness Before Action

Operators should understand the current reservation landscape before working on individual Reservations.

---

#### Principle 2 — Surface What Requires Attention

The dashboard should emphasize Reservations that require business decisions rather than those that are progressing normally.

---

#### Principle 3 — Summarize, Do Not Replace

The dashboard provides an overview of Reservation activity.

Detailed business decisions remain within the Reservation Workspace.

---

#### Principle 4 — Future-Oriented View

The Reservation Dashboard reflects expected future business activity rather than current operational occupancy.

---

#### Principle 5 — Support Daily Operations

Every element of the dashboard should help operators prioritize, prepare, and manage future Admissions more effectively.
less of business domain.

---

## 14. Business Sections

### Purpose

The Reservation Workspace is divided into business-focused sections that collectively describe the organization's current expectation of a future Admission.

Each section has a single business responsibility.

Together, these sections present a complete business view of the Reservation while maintaining clear separation of concerns.

The sections are intentionally organized according to the operator's business thought process rather than the underlying technical implementation.

---

### Reservation Summary

The Reservation Summary provides the operator with an immediate understanding of the Reservation.

It presents the most important information required to assess the Reservation before reviewing additional details.

Typical business information includes:

- Reservation Reference
- Current Lifecycle State
- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Reservation Age
- Admission Readiness

This section answers the question:

> **"What is the current state of this Reservation?"**

---

### Personal Information

This section contains the identifying information of the prospective resident.

Its purpose is to clearly establish who the Reservation represents.

Typical information includes:

- Full Name
- Contact Information
- Emergency Contact
- Government Identity Details
- Basic Personal Information

This section answers:

> **"Who is expected to join?"**

---

### Commercial Expectations

This section records the organization's current commercial understanding with the prospective resident.

All information remains expected until Admission confirms the Business Truth.

Typical information includes:

- Expected Monthly Rent
- Expected Security Deposit
- Commercial Notes
- Special Commercial Agreements
- Any negotiated expectations

This section answers:

> **"What commercial terms are currently expected?"**

---

### Accommodation Preferences

This section records accommodation preferences expressed by the prospective resident.

Preferences guide future Admission decisions but do not reserve or allocate accommodation.

Typical preferences include:

- Preferred Area
- Preferred Floor
- Preferred Flat
- Preferred Bed Position
- Other accommodation requests

This section answers:

> **"What accommodation does the resident prefer?"**

---

### Reservation Notes

Reservation Notes capture business context that may assist future operators.

These notes preserve conversations, observations and business considerations that are relevant to the Reservation.

Examples include:

- Special requests
- Family discussions
- Joining considerations
- Follow-up commitments
- Additional remarks

The objective is to preserve business context rather than operational information.

---

### Business Timeline

The Business Timeline presents the chronological history of significant business events throughout the Reservation lifecycle.

It explains how the Reservation reached its current state.

Typical events include:

- Reservation Created
- Expected Joining Date Revised
- Commercial Terms Updated
- Preferences Updated
- Reminder Sent
- Reservation Converted
- Reservation Cancelled

This section answers:

> **"How did this Reservation evolve?"**

---

### Business Actions

This section presents the business actions that are currently available for the Reservation.

Available actions depend upon the Reservation's lifecycle state.

Typical actions include:

- Edit Reservation
- Revise Expected Joining Date
- Update Commercial Expectations
- Update Accommodation Preferences
- Send Reminder
- Cancel Reservation
- Begin Admission

The workspace should present only those actions that are valid for the current business state.

---

### Section Independence

Each business section has a clearly defined responsibility.

A section should neither duplicate nor assume the responsibilities of another section.

For example:

- Commercial Expectations should not contain accommodation information.
- Accommodation Preferences should not contain financial obligations.
- Reservation Notes should not replace structured business information.
- Business Timeline should record business events rather than technical activity.

This separation promotes clarity, consistency and future maintainability.

---

### Constitutional Principles

The Business Sections follow several constitutional principles.

#### Principle 1 — One Section, One Responsibility

Every section owns a single business responsibility.

---

#### Principle 2 — Structured Before Unstructured

Business information should be captured in structured sections wherever possible.

Reservation Notes supplement structured information but do not replace it.

---

#### Principle 3 — Context Before Action

Operators should have sufficient business context before performing business actions.

---

#### Principle 4 — Business Story Over Technical Structure

The sections are organized according to how operators understand Reservations, not according to how data is stored.

---

#### Principle 5 — Every Section Adds Business Value

A section should exist only if it contributes meaningfully to understanding, preparing or concluding a Reservation.

## 15. Business Actions

### Purpose

Business Actions represent the meaningful business decisions that may be performed during the lifecycle of a Reservation.

Each action exists to support the progression of a Reservation from its creation through its eventual conclusion.

Business Actions should reflect business intent rather than technical operations.

The operator performs a business action because a business decision has been made.

The system executes that decision and records the resulting Business Events.

---

### Business Philosophy

A Reservation evolves through deliberate business decisions.

Examples include:

- Revising the expected joining date.
- Negotiating commercial terms.
- Updating accommodation preferences.
- Recording additional information.
- Cancelling the Reservation.
- Beginning the Admission process.

Each action represents a change in the organization's current expectation.

Business Actions should therefore be meaningful, intentional and easy to understand.

---

### Action Availability

Business Actions depend upon the Reservation's current lifecycle state.

The workspace should present only those actions that are valid for the Reservation's current business state.

This reduces operational confusion and prevents invalid business operations.

For example:

- An Active Reservation may be edited.
- A Converted Reservation cannot be modified.
- A Cancelled Reservation cannot begin Admission.

The operator should never be presented with actions that cannot legitimately be performed.

---

### Core Business Actions

The Reservation Workspace supports the following business actions.

---

#### Create Reservation

Creates a new Reservation representing the organization's expectation of a future Admission.

The Reservation becomes the authoritative owner of Expected Truth.

---

#### Update Reservation

Allows the operator to revise expected information as business discussions evolve.

Examples include:

- Expected Joining Date
- Commercial Expectations
- Accommodation Preferences
- Reservation Notes

Updating a Reservation reflects changing business expectations rather than operational commitments.

---

#### Record Business Notes

Allows operators to record additional business context that may assist future decision making.

Business Notes supplement structured information but do not replace it.

---

#### Send Reminder

Records that the organization has contacted the prospective resident regarding the Reservation.

Examples include:

- Joining reminder
- Confirmation reminder
- Follow-up communication

Sending a reminder becomes part of the Reservation's Business Timeline.

---

#### Cancel Reservation

Concludes the Reservation when the expected Admission will no longer occur.

Cancellation records the business outcome together with an appropriate cancellation reason.

**MVP Business Rule — Token Disposition on Cancellation:**
- Active Reservation with token (`tokenAmount > 0`): The operator must explicitly select exactly one token disposition:
  1. `REFUND` (Full token amount)
  2. `FORFEIT` (Full token amount)
- Partial or editable refunds are not supported in MVP and are explicitly deferred to V2.
- Active Reservation without token: Cancellation requires only a mandatory cancellation reason; token disposition controls are omitted.
- The Reservation domain authoritatively owns and persists the structured token disposition (`outcome`, `amount`, `decidedOn`) and dedicated cancellation timestamp (`cancelledAt`).
- Actual financial postings remain the responsibility of Finance; the Reservation records the business disposition decision.

The Reservation becomes a permanent immutable historical record.


---

#### Begin Admission

Transfers business responsibility from the Reservation Workspace to the Admission transaction.

Beginning Admission does not immediately commit any operational changes.

Instead, it opens the Admission preparation process where:

- Information is reviewed.
- Commercial terms may be confirmed.
- Accommodation is selected.
- Documents are verified.

Permanent business changes occur only when Admission is confirmed.

---

### Business Responsibility

Each Business Action has a clearly defined business responsibility.

| Business Action | Business Responsibility |
|-----------------|-------------------------|
| Create Reservation | Establish Expected Truth |
| Update Reservation | Revise Expected Truth |
| Record Business Notes | Preserve Business Context |
| Send Reminder | Record Business Communication |
| Cancel Reservation | Conclude Business Expectation |
| Begin Admission | Initiate Business Transition |

This separation ensures that every action has a clear and understandable business purpose.

---

### Actions That Do Not Belong

The Reservation Workspace intentionally excludes actions belonging to other business objects.

Examples include:

- Allocate Bed
- Create Resident
- Create Stay
- Generate Financial Ledger
- Record Security Deposit Collection
- Check-in Resident
- Checkout Resident

These actions belong to the Admission, Stay or Finance domains.

Maintaining this separation preserves clear business ownership.

---

### Constitutional Principles

The Reservation Business Actions follow several constitutional principles.

#### Principle 1 — Actions Represent Business Decisions

Every action should correspond to a meaningful business decision rather than a technical operation.

---

#### Principle 2 — Expected Truth May Evolve

Operators should be free to revise expectations while the Reservation remains Active.

Such revisions represent normal business activity.

---

#### Principle 3 — Commitments Require Admission

No Business Action within the Reservation Workspace should create operational commitments.

Operational commitments are created only through a confirmed Admission.

---

#### Principle 4 — Business Responsibility Must Be Clear

Every Business Action should have a single business responsibility.

Responsibilities should not overlap between Reservation and other workspaces.

---

#### Principle 5 — Actions Follow Business Authority

The system validates and executes Business Actions.

The operator authorizes them.

The resulting Business Events become part of the organization's permanent business history.

## 16. Navigation

### Purpose

Navigation defines how operators move between business workspaces while maintaining clear ownership of business responsibilities.

Navigation should follow the natural progression of business activities rather than the physical organization of the application.

Every navigation represents movement between business contexts.

Whenever possible, operators should remain within the current workspace until business responsibility transfers to another business object.

---

### Business Philosophy

Navigation is driven by business ownership.

Operators should navigate because the business responsibility has changed, not because information is stored elsewhere.

Each workspace owns a distinct business responsibility.

Navigation occurs only when that responsibility passes from one business object to another.

This principle minimizes unnecessary movement while preserving clear separation of business concerns.

---

### Reservation as a Transaction Workspace

The Reservation Workspace is a Transaction Workspace.

Its responsibility is to manage the organization's expectation of a future Admission.

While a Reservation remains Active, operators should be able to complete all Reservation-related activities without leaving the workspace.

Examples include:

- Reviewing Reservation details.
- Revising commercial expectations.
- Updating accommodation preferences.
- Recording notes.
- Sending reminders.
- Cancelling the Reservation.

The workspace should support the complete Reservation lifecycle.

---

### Transition to Admission

The most significant navigation from the Reservation Workspace occurs when the organization decides to admit the prospective resident.

This transition transfers business responsibility from:

**Expected Truth**

to

**Confirmed Truth**

The Reservation Workspace hands responsibility to the Admission transaction.

The Admission transaction then coordinates:

- Resident
- Stay
- Accommodation
- Finance
- Business Events

until the Admission is successfully completed.

---

### Navigation to Operational Workspaces

After Admission has been successfully confirmed, business ownership transfers permanently to operational business objects.

Subsequent navigation may occur to workspaces such as:

- Resident Workspace
- Stay Workspace
- Accommodation Workspace
- Finance Workspace

These workspaces manage the operational consequences of the completed Admission.

The Reservation itself remains a historical record of the organization's original expectation.

---

### Historical Navigation

Converted and Cancelled Reservations remain available for historical understanding.

Operators may revisit completed Reservations to:

- Understand previous commercial expectations.
- Review accommodation preferences.
- Read historical notes.
- Examine the Business Timeline.
- Understand why a Reservation concluded.

Historical navigation exists to improve business understanding rather than support further business activity.

---

### Navigation Principles

Navigation should always preserve business clarity.

Operators should never lose context when moving between related workspaces.

Each transition should have a clear business purpose.

Navigation should never imply that business ownership has changed unless such a transfer has actually occurred.

---

### Navigation Boundaries

The Reservation Workspace intentionally does not navigate directly into business activities that belong to other domains.

Examples include:

- Bed Allocation
- Resident Management
- Stay Operations
- Financial Transactions
- Checkout Processing

Those activities begin only after the appropriate business transaction has established their ownership.

---

### Constitutional Principles

The Reservation Navigation model follows several constitutional principles.

#### Principle 1 — Navigation Follows Business Responsibility

Operators move between workspaces because business ownership changes, not because data resides elsewhere.

---

#### Principle 2 — Complete Work Before Moving

A workspace should support completion of its own business responsibility before requiring navigation to another workspace.

---

#### Principle 3 — Context Must Be Preserved

Operators should retain a clear understanding of the business journey when navigating between related workspaces.

---

#### Principle 4 — Ownership Changes Only Through Business Transactions

Movement from one business domain to another should occur only when a business transaction transfers responsibility.

---

#### Principle 5 — Navigation Reflects the Business Lifecycle

The navigation model should mirror the lifecycle of the business rather than the structure of the software.

## 17. Business Rules

### Purpose

The Business Rules define the non-negotiable business constraints governing the Reservation Workspace.

These rules ensure that every Reservation behaves consistently regardless of implementation, user interface or future technological changes.

Business Rules describe what the organization considers to be Business Truth.

They are implementation-independent and shall remain valid across all versions of RPGMS.

---

## Reservation Ownership

### BR-RES-001

A Reservation represents the organization's current expectation of a future Admission.

It does not represent:

- a Resident,
- a Stay,
- a Contract,
- an Accommodation Allocation,
- or an operational commitment.

---

### BR-RES-002

A Reservation is the authoritative owner of **Expected Truth**.

Expected Truth includes, but is not limited to:

- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Accommodation Preferences
- Reservation Notes
- Other expected business information

No other business object may own these expectations while the Reservation remains Active.

---

### BR-RES-003

Expected information may change any number of times while the Reservation remains Active.

Such revisions represent normal business activity.

---

## Lifecycle

### BR-RES-004

Every Reservation shall exist in exactly one lifecycle state.

Valid lifecycle states are:

- ACTIVE
- CONVERTED
- CANCELLED

No additional lifecycle states shall exist without constitutional revision.

---

### BR-RES-005

A Reservation may transition only as follows:

ACTIVE

↓

CONVERTED

or

↓

CANCELLED

No other state transitions are permitted.

---

### BR-RES-006

Once Converted or Cancelled, a Reservation becomes read-only.

Its business history shall remain permanently available.

---

## Admission

### BR-RES-007

A Reservation does not admit a resident.

Admission is performed exclusively through the Admission transaction.

---

### BR-RES-008

Beginning Admission does not create permanent business changes.

Permanent business changes occur only when Admission is successfully confirmed.

---

### BR-RES-009

A Reservation never creates:

- Resident
- Stay
- Bed Allocation
- Financial Ledger
- Occupancy

Those business objects are created by the Admission transaction.

---

## Accommodation

### BR-RES-010

A Reservation records accommodation preferences only.

Preferences never reserve operational resources.

---

### BR-RES-011

A Reservation shall never reserve:

- Area
- Flat
- Bed

Operational accommodation is assigned only during Admission.

---

## Commercial Expectations

### BR-RES-012

Commercial information stored within a Reservation represents expected commercial terms.

These expectations may be revised until Admission confirms the Business Truth.

---

### BR-RES-013

Expected commercial information does not create financial obligations.

Financial obligations begin only after Admission commits.

---

## Business Timeline

### BR-RES-014

Every significant business decision shall be recorded through Business Events and presented within the Business Timeline.

---

### BR-RES-015

The Business Timeline records business history rather than technical activity.

Technical events shall not appear within the Business Timeline.

---

## Business Authority

### BR-RES-016

The system may recommend business decisions.

The operator remains responsible for approving business decisions.

Confirmed operator decisions become the organization's Business Truth.

---

### BR-RES-017

The system shall validate every business action before execution.

Validation prevents inconsistent or invalid business operations.

Validation supports the operator but does not replace business authority.

---

## Historical Integrity

### BR-RES-018

Converted and Cancelled Reservations remain permanent historical records.

They shall never be deleted as part of normal business operations.

---

### BR-RES-019

Historical Reservations explain the business expectation that existed before Admission or Cancellation.

Operational workspaces own all subsequent business activity.

---

## Separation of Responsibilities

### BR-RES-020

Reservation owns Expected Truth.

Admission owns Confirmed Truth.

Resident owns Identity Truth.

Stay owns Operational Truth.

Finance owns Financial Truth.

Business Events own Historical Truth.

Business ownership shall remain explicit and non-overlapping throughout RPGMS.

---

## Constitutional Principles

The Reservation Business Rules follow several constitutional principles.

### Principle 1 — Business Rules Are Technology Independent

Business Rules define organizational behaviour rather than software behaviour.

---

### Principle 2 — Every Business Object Has One Owner

Ownership shall remain explicit throughout the Reservation lifecycle.

---

### Principle 3 — Expectations Are Not Commitments

Expected information shall never create operational commitments.

Commitments require Admission.

---

### Principle 4 — Business History Is Permanent

Business history shall be preserved as an organizational asset.

Corrections shall be represented by new Business Events rather than altering historical truth.

---

### Principle 5 — Clear Ownership Produces Clear Systems

Every Business Rule reinforces explicit ownership of business responsibilities.

Clear ownership minimizes ambiguity, simplifies implementation and improves long-term maintainability.

## 18. Engineering Notes

### Purpose

This section captures architectural guidance for engineers implementing the Reservation Workspace.

These notes do not prescribe technical implementation.

Instead, they preserve the business intent behind the Reservation Workspace so that future implementations remain faithful to the constitutional principles of RPGMS.

Engineering decisions should always support the business architecture rather than redefine it.

---

## Reservation Is a Business Object

The Reservation is a first-class business object.

It is not:

- a temporary form,
- a staging record,
- a draft Admission,
- or a partially created Resident.

Its lifetime is independent of the Admission transaction.

The Reservation remains a complete business object whether it ultimately converts into an Admission or is cancelled.

---

## Reservation Owns Expected Truth

The Reservation is the sole owner of Expected Truth.

Other business objects may reference expected information during business processes, but ownership remains with the Reservation until Admission commits.

Implementations should avoid duplicating ownership of expected information across multiple business objects.

---

## Admission Performs the Transition

Admission is responsible for transforming Expected Truth into Confirmed Truth.

The Reservation itself never performs this transition.

Instead, Admission coordinates:

- Resident
- Stay
- Accommodation
- Finance
- Business Events

while preserving the Reservation as the historical record of pre-admission expectations.

---

## Preserve Separation of Responsibilities

Engineering decisions should never blur business ownership.

In particular:

- Reservation should not perform operational work.
- Admission should not permanently own expected information.
- Resident should not own reservation history.
- Stay should not own commercial expectations.
- Finance should not determine accommodation.

Clear ownership simplifies both business understanding and software maintenance.

---

## Business Timeline Is Business-Focused

The Business Timeline exists to explain business decisions.

Implementations should avoid exposing technical events within the timeline.

Examples of information that should remain outside the Business Timeline include:

- database updates,
- synchronization events,
- UI interactions,
- background processing,
- system diagnostics.

The timeline should always tell the business story.

---

## Read-Only Historical Records

Converted and Cancelled Reservations should remain historically accurate.

Engineering solutions should preserve historical integrity.

Historical records should explain what the organization expected at that point in time rather than reflecting later operational changes.

---

## Operator Authority

Engineering should reinforce the constitutional principle:

> System recommends.
>
> Operator decides.
>
> RPGMS executes and records.

Automation should assist operators without replacing business authority.

Where business rules allow operator discretion, implementations should preserve that discretion.

---

## Workspace Independence

The Reservation Workspace should remain independently understandable.

Future enhancements should strengthen the Reservation Workspace without creating unnecessary dependencies on unrelated workspaces.

Cross-workspace interactions should occur only where business responsibility genuinely transfers.

---

## Future Extensibility

The Reservation model should accommodate future business capabilities without requiring fundamental architectural changes.

Examples may include:

- communication history,
- document management,
- waiting lists,
- referral tracking,
- digital agreements,
- online reservation channels.

Such enhancements should extend the Reservation Workspace while preserving its core responsibility as the owner of Expected Truth.

---

## Constitutional Principles

The Engineering Notes follow several constitutional principles.

### Principle 1 — Preserve Business Architecture

Engineering exists to implement the business architecture, not redesign it.

---

### Principle 2 — One Responsibility Per Business Object

Engineering decisions should reinforce explicit business ownership.

---

### Principle 3 — History Must Remain Trustworthy

Historical business records are organizational assets and should remain reliable throughout the lifetime of the system.

---

### Principle 4 — Technology Is Replaceable

Implementation technologies may evolve.

Business architecture should remain stable.

---

### Principle 5 — Design for Longevity

Engineering decisions should favour long-term maintainability, clarity and business consistency over short-term implementation convenience.

## 19. AI Implementation Checklist

### Purpose

This checklist provides implementation guidance for AI-assisted software development.

Its purpose is to ensure that every implementation of the Reservation Workspace faithfully reflects the business architecture defined in this specification.

The checklist is implementation-independent and applies regardless of the programming language, framework or development tools used.

Before implementing any Reservation-related functionality, the AI assistant should review this entire specification together with the governing constitutional documents.

---

## Business Understanding

Before writing any code, verify the following:

- Reservation is a first-class business object.
- Reservation represents the organization's expectation of a future Admission.
- Reservation owns Expected Truth.
- Reservation does not own operational commitments.
- Reservation is independent of Admission.

Do not begin implementation until these concepts are fully understood.

---

## Business Ownership

Confirm that ownership remains explicit.

Reservation owns:

- Expected Joining Date
- Expected Monthly Rent
- Expected Security Deposit
- Accommodation Preferences
- Reservation Notes
- Expected commercial information

Reservation does **not** own:

- Resident
- Stay
- Bed Allocation
- Financial Ledger
- Occupancy

Ownership shall remain clear throughout implementation.

---

## Lifecycle

Verify that implementation supports only the approved lifecycle.

```
ACTIVE

↓

CONVERTED

or

↓

CANCELLED
```

No additional lifecycle states should be introduced.

Lifecycle transitions should follow the business rules defined in this specification.

---

## Expected Truth

Ensure that all expected information remains editable while the Reservation is Active.

Once Converted or Cancelled:

- Reservation becomes read-only.
- Historical information remains unchanged.
- Ownership transfers according to the business architecture.

Expected information should never become operational information without Admission.

---

## Admission Integration

Confirm that Reservation integrates correctly with the Admission transaction.

Beginning Admission:

- does not create Residents,
- does not create Stays,
- does not allocate Beds,
- does not create Finance records.

Only successful Admission confirmation creates operational business objects.

---

## Accommodation

Verify that Reservation records preferences only.

Reservation shall never:

- reserve Beds,
- reserve Flats,
- reserve Areas,
- guarantee accommodation.

Operational accommodation belongs exclusively to Admission.

---

## Business Timeline

Confirm that the Business Timeline records meaningful business events only.

Examples include:

- Reservation Created
- Joining Date Revised
- Commercial Terms Revised
- Preferences Updated
- Reminder Sent
- Reservation Converted
- Reservation Cancelled

Do not include technical or infrastructure events.

---

## Workspace Behaviour

Confirm that the Reservation Workspace:

- manages Expected Truth,
- supports business preparation,
- allows business revisions,
- presents meaningful business context,
- transfers responsibility through Admission,
- preserves historical integrity.

The workspace should remain focused on Reservations throughout their lifecycle.

---

## Business Rules

Before implementation, verify compliance with every Business Rule defined in this specification.

Business Rules take precedence over implementation convenience.

Where uncertainty exists, preserve the business architecture rather than introducing new behaviour.

---

## Architectural Consistency

Ensure implementation remains consistent with:

- BUSINESS_CONSTITUTION.md
- BUSINESS_MODEL.md
- BUSINESS_RULES.md
- BUSINESS_EVENTS_SPECIFICATION.md
- Reservation Workspace Specification

If conflicts are discovered:

- stop implementation,
- identify the conflict,
- resolve the business architecture first,
- implement only after business consistency has been restored.

---

## AI Development Principles

During implementation the AI assistant should always:

- implement business architecture rather than invent behaviour,
- preserve explicit ownership,
- respect business boundaries,
- avoid introducing duplicate responsibilities,
- favour clarity over cleverness,
- keep Reservation independent from operational business objects.

Whenever implementation decisions are required, they should reinforce—not weaken—the constitutional principles of RPGMS.

---

## Pre-Implementation Verification

Before writing production code, confirm:

✓ Reservation represents Expected Truth.

✓ Admission represents Confirmed Truth.

✓ Reservation never allocates accommodation.

✓ Reservation never creates operational business objects.

✓ Business Timeline records business events.

✓ Lifecycle complies with the approved model.

✓ Business ownership remains explicit.

✓ Historical integrity is preserved.

✓ Operator authority remains intact.

✓ Business architecture remains unchanged.

Implementation should begin only after every verification item has been satisfied.

---

## Constitutional Principles

The AI Implementation Checklist follows several constitutional principles.

### Principle 1 — Business Before Code

AI should understand the business before generating implementation.

---

### Principle 2 — Architecture Before Features

Implementation should strengthen the architecture rather than bypass it.

---

### Principle 3 — Preserve Ownership

Business ownership must remain explicit throughout implementation.

---

### Principle 4 — Consistency Over Convenience

Implementation convenience must never compromise business correctness.

---

### Principle 5 — Implement, Don't Invent

AI assistants exist to implement the approved business architecture.

They do not redefine business behaviour.


