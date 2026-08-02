# Stay Workspace

**Version:** 1.0 (Draft)

---

# Purpose

The Stay Workspace is the operational hub of RPGMS 2.0.

It represents the active business relationship between a resident and the hostel.

While Stay, Accommodation, Residents and Finance each own their respective business domains, day-to-day hostel operations require information and actions from all four domains simultaneously. The Stay Workspace brings these modules together into a single operational experience without duplicating their responsibilities.

The workspace is designed around how hostel staff naturally perform their work rather than around the internal module structure of the software.

Its objective is simple:

> **Every operational activity related to an active resident should be possible from a single workspace.**

The Stay Workspace does not replace the Stay, Accommodation, Residents or Finance modules. Instead, it orchestrates them into a unified operational workflow.

---

# Problem Statement

Traditional hostel management systems are typically organized into functional modules such as Accommodation, Residents and Finance.

Although this structure is appropriate for system administration, it does not accurately reflect the daily workflow of hostel operations.

When a resident approaches the office, staff rarely think in terms of software modules.

Instead, they naturally think:

> **"Let's look at the resident's current stay."**

From that single context, staff may perform any combination of operational activities, including:

- Recording rent payments
- Generating monthly rent
- Posting laundry charges
- Posting electricity charges
- Viewing outstanding dues
- Changing bed allocation
- Giving notice
- Processing checkout
- Viewing recent activity
- Reviewing supporting documents

Without a unified operational workspace, users are forced to navigate repeatedly between multiple modules to complete a single business process.

The Stay Workspace eliminates this fragmentation by providing one operational view of the resident's active stay.

---

# Vision

RPGMS 2.0 adopts a domain-driven operational architecture.

Each major module owns a specific business responsibility:

- **Stay** manages the operational residency and lifecycle.
- **Accommodation** manages physical assets.
- **Residents** manages resident identity and permanent information.
- **Finance** manages accounting records and financial transactions.
- **Dashboard** provides business monitoring and analytics.

The Stay Workspace does not own these domains.

Instead, it acts as the orchestration layer that combines operational information from the Stay, Accommodation, Residents and Finance domains into a single operational workspace.

This approach keeps business responsibilities clearly separated while allowing staff to perform daily operations efficiently from one place.

The guiding principle of RPGMS 2.0 is therefore:

> **The Current Stay is the operational unit of the system.**

The Stay Workspace operates primarily on the Current Projection of the active Stay.

The Current Projection provides the operational state required for day-to-day hostel management while historical information remains preserved within the Stay's business components.

Every operational activity performed by hostel staff is executed against an active Stay.

This architectural decision provides a scalable foundation for future modules while ensuring that daily workflows remain simple, intuitive and consistent.

---

# Domain Model

The Stay Workspace is based on a simple domain model that separates business entities according to their responsibilities.

Each entity owns its own data and business rules.

The Stay Workspace does not replace these entities. Instead, it brings them together to support day-to-day hostel operations.

Resident
│
├── Historical Stay
│
├── Historical Stay
│
└── Current Stay
      │
      ├── Current Projection
      │
      ├── Commercial Agreement
      │
      ├── Bed Allocation
      │
      ├── Business Events
      │
      └── Operational Resources
             └── Door ID

The Stay Workspace presents the Current Projection while allowing operators to access the underlying Commercial Agreement, Bed Allocation and Business Events that together define the Current Stay.

A Resident may have multiple stays over time.

Each Stay represents an independent business relationship with the hostel.

Financial history, accommodation history and operational history belong to the Stay in which they occurred.

Historical Stays remain immutable after settlement and checkout.

---
# Terminology

For consistency throughout RPGMS 2.0, the following terminology is used.

| Term | Meaning |
|------|---------|
| Resident | A person registered with the hostel. |
| Stay | One complete commercial relationship between a Resident and the hostel. |
| Current Stay | The resident's active Stay and the operational unit of the system. |
| Historical Stay | Any completed Stay that has been checked out and preserved for audit and reporting purposes. |
| Stay Workspace | The operational workspace used to manage the Current Stay. It is an orchestration layer and does not own business data. |
| Current Projection | The derived operational view of the Current Stay presented to operators. |
| Business Event | A significant operational event recorded during the lifetime of a Stay. |

# Core Business Entities

## Resident

A Resident represents a person.

Resident information is permanent and independent of any individual stay.

Typical Resident information includes:

- Personal details
- Contact information
- Family information
- Identity documents
- Medical information
- Educational information
- Historical stays

A Resident may have zero, one or many Stays during their lifetime.

The Resident module does **not** own operational or financial transactions.

---

## Stay

A Stay represents the active commercial relationship between a Resident and the hostel.

The Stay is created when a resident checks in and ends when checkout and financial settlement are completed.

Every operational activity performed by hostel staff is associated with a Stay.

Typical Stay information includes:

- Admission Date
- Operational Checkout Date
- Current Status
- Commercial Agreement
- Bed Allocation
- Business Events
- Current Projection

A Resident may have multiple historical Stays, but only one active Stay at any given time.

The active Stay is the operational unit of RPGMS 2.0.

---

## Accommodation

Accommodation represents the physical assets of the hostel.

Examples include:

- Buildings
- Floors
- Flats
- Rooms
- Beds

Accommodation owns the physical accommodation resources:

- Buildings
- Floors
- Flats
- Beds

The Stay is responsible for the Bed Allocation relationship linking a Stay to those resources.

It does not own resident identity or financial information.

When an occupied bed is selected, the system should navigate to the Current Stay associated with that bed.

---

## Finance

Finance manages all accounting records generated during a Stay.

Typical financial information includes:

- Rent bills
- Electricity charges
- Laundry charges
- Other charges
- Payments
- Security deposit
- Ledger entries
- Settlement records

Finance owns accounting rules and calculations.

Operational workflows invoke Finance services through the Stay Workspace rather than interacting directly with accounting components.

---

# Relationship Between Entities

The relationship between the primary business entities can be represented as follows.

The Stay Workspace consumes the Current Projection of the active Stay while preserving the ownership boundaries of the participating domains.

```
Accommodation
        │
        │ provides
        ▼
     Current Stay
        ▲
        │ belongs to
Resident │
        │
        ▼
     Finance
```

The Stay domain owns the operational lifecycle of a resident, while the Stay Workspace provides the user interface through which that lifecycle is managed.

Accommodation provides the physical location.

Residents provide identity.

Finance provides financial records.

The Stay Workspace combines these responsibilities into a single operational experience.

---

# Operational Unit

One of the fundamental architectural decisions of RPGMS 2.0 is that operational activities are performed against the active Stay rather than directly against the Resident.

For example:

- Record Payment
- Generate Monthly Rent
- Add Laundry Charges
- Add Electricity Charges
- Transfer Bed
- Give Notice
- Checkout
- Settlement

Each of these actions affects the Current Stay.

This approach preserves complete historical records while allowing a Resident to return in the future and begin a new Stay without affecting previous financial or operational history.

This separation between Resident and Stay is a core design principle of RPGMS 2.0.

---

# Entry Points

The Stay Workspace is the central operational destination within RPGMS 2.0.

Users should not be required to manually navigate between multiple modules to perform routine operational tasks.

Instead, every module that references an active resident should provide a direct path to the resident's Current Stay.

The Stay Workspace therefore becomes a shared operational destination across the application.

---

## Entry Point – Accommodation

Accommodation manages physical assets such as flats and beds.

When a user selects an occupied bed, the application should navigate directly to the Current Stay associated with that bed.

```
Accommodation

Building
   │
Floor
   │
Flat
   │
Occupied Bed
   │
   ▼
Current Stay Workspace
```

Vacant beds should continue to open bed management functions and should not attempt to open a Stay Workspace.

---

## Entry Point – Residents

The Residents module manages permanent resident information.

The Resident Profile should display a summary of the active Stay and provide a clear action to open the Stay Workspace.

```
Residents

Resident List
      │
      ▼
Resident Profile
      │
      ▼
Manage Current Stay
      │
      ▼
Stay Workspace
```

The Resident Profile remains the master record of the individual.

Operational actions are performed from the Stay Workspace.

---

## Entry Point – Dashboard

The Dashboard provides operational visibility and business monitoring.

Wherever the Dashboard presents information relating to an active resident, users should be able to navigate directly to the associated Stay.

Examples include:

- Residents with outstanding dues
- Residents checking in today
- Residents checking out today
- Residents currently on notice
- Pending settlements

```
Dashboard

Business Widget
      │
      ▼
Resident
      │
      ▼
Current Stay Workspace
```

The Dashboard surfaces operational signals.

The Stay Workspace is where operational actions are performed.

---

## Entry Point – Finance Dashboard

The Finance Dashboard presents accounting information at a business level.

Examples include:

- Outstanding balances
- Recent collections
- Settlement queue
- Monthly billing
- Payment reports

Selecting an individual resident or financial record should navigate to the associated Current Stay.

```
Finance Dashboard

Outstanding Resident
         │
         ▼
Current Stay Workspace
```

This allows financial analysis and operational action to remain connected while preserving clear ownership of financial calculations within the Finance module.

---

# Navigation Philosophy

The Stay Workspace is intentionally designed as a destination rather than another top-level module.

It is reached through context.

Users naturally begin with a question such as:

- Who occupies this bed?
- I need to collect rent from this resident.
- This resident is checking out today.
- This resident has outstanding dues.

Each of these questions originates from a different module but converges on the same operational workspace.

This reduces unnecessary navigation and provides a consistent workflow across the application.

---

# User Journey

The following diagram illustrates the typical navigation flow.

```
                   Dashboard
                        │
                        │
Accommodation ──────────┼────────── Residents
                        │
                        │
                 Finance Dashboard
                        │
                        ▼
              Current Stay Workspace
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Billing         Payments       Operations
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
                 Ledger & Timeline
```

The Current Stay Workspace presents the Current Projection of the active Stay and provides access to all Business Operations associated with that Stay.

---

# Operational Workflow

Once inside the Stay Workspace, users should be able to complete the entire lifecycle of an active Stay without returning to another module.

A typical operational workflow is illustrated below.

Admission

↓

Commercial Agreement

↓

Bed Allocation

↓

Monthly Billing

↓

Payments

↓

Notice

↓

Settlement

↓

Operational Checkout

↓

Stay Closed

This lifecycle represents the complete operational journey of a Stay and forms the foundation for future workflow enhancements within RPGMS 2.0.

---

# Stay Workspace Layout

The Stay Workspace is designed to present the most important operational information immediately while allowing users to perform common tasks with minimal navigation.

Information is arranged according to operational priority rather than database structure.

The layout should support both quick operational tasks and detailed review of the current Stay.

The recommended layout is illustrated below.

```
+--------------------------------------------------------------+
| Resident & Stay Header                                       |
+--------------------------------------------------------------+
| Quick Actions                                                 |
+--------------------------------------------------------------+
| Stay Summary              | Financial Summary                |
+---------------------------+----------------------------------+
| Recent Business Events                                              |
+--------------------------------------------------------------+
| Supporting Information / Documents                           |
+--------------------------------------------------------------+
```

This layout ensures that users can identify the resident, understand the current status and perform common actions without unnecessary navigation.

---

# Resident & Stay Header

The header provides immediate context about the active Stay.

It should remain visible while navigating within the workspace.

The header should include:

- Resident name
- Resident photograph (optional)
- Resident ID
- Stay ID
- Current Door ID
- Current status
- Admission Date
- Expected Operational Checkout Date (if applicable)
- Flat and bed allocation

Example:

```
---------------------------------------------------------------
Rajesh Kumar

Resident ID : RES-00124
Stay ID     : STAY-2026-00041

Status       : Active
Admission     : 12-Mar-2026
Flat / Bed   : Flat 103 / Bed H2
---------------------------------------------------------------
```

The objective of the header is to answer one question immediately:

> **Who is this resident and where is he currently staying?**

---

# Quick Actions

Quick Actions provide immediate access to the most frequently performed operational tasks.

These actions should always operate on the Current Stay.

Quick Actions represent the primary Business Operations performed against the Current Stay.

Recommended actions include:

Generate Monthly Rent

Record Payment

Revise Commercial Agreement

Allocate Additional Bed

Transfer Bed

Transfer Flat

Assign Door ID

Give Notice

Withdraw Notice

Begin Operational Checkout

These actions should remain concise and represent the core daily operations of the hostel.

As additional modules are introduced, new actions may be added without altering the overall workspace structure.

---

# Stay Summary

The Stay Summary provides an operational overview of the Current Stay.

Typical information includes:

- Current Stay Status
- Occupancy Duration
- Current Commercial Agreement
- Current Bed Allocation(s)
- Current Door ID
- Current Occupants
- Notice Status
- Expected Operational Checkout
- Outstanding Operational Actions

The objective is to provide operational information at a glance without requiring users to navigate into individual modules.

---

# Financial Summary

The Financial Summary presents the current financial position of the Stay.

This section should provide a concise overview rather than a complete accounting ledger.

Typical information includes:

- Current Outstanding Balance
- Current Month Rent
- Pending Electricity Charges
- Pending Laundry Charges
- Security Deposit Held
- Last Payment Received
- Next Billing Date

The detailed ledger remains part of the Finance module.

The Stay Workspace displays only the information required to support operational decision making.

---

# Design Philosophy

The Stay Workspace should answer the following questions within a few seconds.

1. Who is this resident?
2. Where is the resident staying?
3. What is the resident's current status?
4. What is the resident's financial position?
5. What action do I need to perform next?

If these questions can be answered without navigating elsewhere, the workspace has achieved its objective.

---

# Data Ownership

The Stay Workspace is an orchestration layer.

It does not own business data.

Instead, it presents information from multiple business domains in a unified operational view.

Each business module continues to own its own data, validation rules and business logic.

This separation ensures that responsibilities remain clear while avoiding unnecessary duplication.

---

# Module Responsibilities

## Accommodation Module

Accommodation owns all physical assets within the hostel.

Examples include:

• Buildings
• Floors
• Flats
• Rooms
• Beds
• Bed Status
• Bed Availability

The Stay domain owns the Bed Allocation relationship linking a Stay to those physical resources.

Accommodation determines where a resident is staying.

It does not own resident identity or financial information.

---

## Residents Module

Residents owns the permanent identity of every resident.

Typical responsibilities include:

Personal Identity

Contact Information

Government Identification

Permanent Address

Professional Information

Medical Information

Emergency Contacts

Historical Stays

Residents does not own accommodation allocation or financial transactions.

---

## Finance Module

Finance owns every financial transaction generated during a Stay.

Examples include:

- Rent Bills
- Electricity Bills
- Laundry Charges
- Other Charges
- Payments
- Security Deposits
- Ledger Entries
- Settlements
- Financial Reports

Finance is responsible for all accounting calculations, validations and audit history.

The Stay Workspace must never implement financial calculations independently.

Billing remains responsible for billing generation, billing cycles and billing rules.

The Stay Workspace invokes Billing services as part of operational workflows but does not implement billing logic itself.

---

## Stay Workspace

The Stay Workspace owns operational workflows.

It coordinates activities across the Stay, Accommodation, Residents and Finance domains without becoming the source of truth for their data.

Examples include:

- Managing the Current Stay
- Presenting operational summaries
- Coordinating business actions
- Displaying cross-module information
- Providing operational shortcuts
- Presenting recent activity

The Stay Workspace should contain as little business logic as possible.

Whenever possible, business rules should remain within the owning module.

---

# Integration Principles

The Stay Workspace communicates with multiple business modules.


                 Stay Workspace
                        │
   ┌────────────┬─────────────┬─────────────┬────────────┐
   │            │             │             │
Stay     Accommodation    Residents    Finance
   │            │             │             │
   └────────────┴─────────────┴─────────────┘
                Operational View


Each module continues to evolve independently.

The Stay Workspace consumes information from these modules to create a unified operational experience.

---

# Design Principles

The following principles guide the design of the Stay Workspace.

## Single Source of Truth

Every piece of business information has exactly one owning module.

The Stay Workspace displays information but does not duplicate ownership.

---

## Separation of Responsibilities

Each module is responsible for a specific business domain.

This keeps the application modular, maintainable and scalable.

---

## Operational First

The Stay Workspace is designed around the daily activities of hostel staff rather than around database entities or technical implementation details.

---

## Minimal Navigation

Users should be able to complete common operational workflows without moving repeatedly between multiple modules.

---

## Future Extensibility

Future modules should integrate into the Stay Workspace without requiring architectural redesign.

Examples include:

- Maintenance
- Visitors
- Inventory
- Staff
- Housekeeping
- Notifications

These modules should contribute operational information while continuing to own their respective business domains.

---

# Architectural Heuristic

One of the guiding principles of RPGMS 2.0 is that each major module answers a specific business question.

| Module         | Primary Business Question                                        |
| -------------- | ---------------------------------------------------------------- |
| Residents      | **Who is the resident?**                                         |
| Stay           | **What is the resident's current relationship with the hostel?** |
| Accommodation  | **What physical resources are available and occupied?**          |
| Finance        | **What financial obligations and transactions exist?**           |
| Stay Workspace | **What operational action should be performed now?**             |
| -------------- | ---------------------------------------------------------------- |

This simple heuristic helps determine where new features belong within the system.

When introducing new functionality, developers should first identify the primary business question being answered and then implement the feature within the module that owns that responsibility.

The Stay Workspace does not replace the owning modules. Instead, it orchestrates them into a unified operational experience.

# Architectural Benefits

This architecture provides several long-term advantages.

- Clear ownership of business logic.
- Reduced duplication across modules.
- Easier testing and maintenance.
- Consistent operational workflows.
- Simplified future expansion.
- Better support for historical audit data.
- Improved scalability as new modules are introduced.

The Stay Workspace therefore acts as the operational center of RPGMS 2.0 while preserving the independence of each business domain.

---

# Architecture Decision Records (ADRs)

This section documents the key architectural decisions that define the Stay Workspace and its role within RPGMS 2.0.

These decisions are considered foundational to the application architecture and should not be changed without careful evaluation of their impact on existing workflows and future development.

---

# ADR-001: Four-Pillar Architecture

## Status

Accepted

## Context

Hostel operations involve four distinct business domains:

- Physical accommodation
- Resident identity
- Financial accounting
- Daily operational workflows

Combining these responsibilities into a single module would result in a tightly coupled system that is difficult to maintain and extend.

## Decision

RPGMS 2.0 is organized around four primary business pillars.

| Pillar | Responsibility |
|---------|----------------|
| Accommodation | Physical assets and occupancy |
| Residents | Resident identity and permanent information |
| Finance | Financial transactions and accounting |
| Stay Workspace | Operational workflows and coordination |

Each pillar owns its own business rules, data and validation.

The Stay Workspace coordinates these pillars but does not replace them.

## Consequences

Benefits include:

- Clear separation of responsibilities.
- Reduced duplication of business logic.
- Easier maintenance.
- Improved scalability.
- Simpler onboarding for new developers.
- Better support for future modules.

---

# ADR-002: Current Stay as the Operational Unit

## Status

Accepted

## Context

Hostel staff do not perform day-to-day work against a Resident record.

Instead, they perform operational activities against the resident's current stay.

Examples include:

- Recording payments.
- Posting charges.
- Changing bed allocation.
- Giving notice.
- Processing checkout.

These activities belong to a specific stay rather than to the resident as a permanent entity.

## Decision

The Current Stay is defined as the operational unit of RPGMS 2.0.

Every operational activity is executed against the active Stay.

Historical stays remain preserved for reporting and audit purposes.

## Consequences

This decision allows:

- Multiple historical stays for a resident.
- Complete financial history.
- Accurate accommodation history.
- Independent audit records.
- Re-admission of previous residents without affecting historical data.

---

# ADR-003: Stay Workspace as an Orchestration Layer

## Status

Accepted

## Context

Operational workflows require information from multiple business modules.

Creating duplicate business logic inside the Stay Workspace would increase complexity and introduce inconsistencies.

## Decision

The Stay Workspace acts as an orchestration layer.

It coordinates business operations while delegating domain-specific responsibilities to the owning modules.

Business logic remains within:

- Accommodation
- Residents
- Finance

The Stay Workspace consumes their services rather than reimplementing them.

## Consequences

This approach ensures:

- Single source of truth.
- Reduced duplication.
- Independent module evolution.
- Cleaner service boundaries.
- Improved testability.

---

# ADR-004: Context-Driven Navigation

## Status

Accepted

## Context

Operational users begin their work from different parts of the application.

Examples include:

- Occupied beds.
- Resident profiles.
- Outstanding dues.
- Today's checkouts.
- Dashboard alerts.

## Decision

The Stay Workspace is not a standalone business module.

Instead, it is reached through context from other modules.

Users naturally arrive at the workspace while performing operational tasks.

## Consequences

This navigation model:

- Reduces unnecessary clicks.
- Creates consistent workflows.
- Improves operational efficiency.
- Keeps navigation aligned with business processes.

---

# Architectural Principles

The following principles should guide future development.

- Every business entity has a single owner.
- Every operational action occurs within the Current Stay.
- Every module owns exactly one primary business responsibility.
- Historical information is preserved and never overwritten.
- Business logic belongs to the owning module.
- The Stay Workspace coordinates workflows rather than replacing modules.
- New modules should integrate into the existing architecture instead of changing it.

---

# ADR-005 — Current Projection

## Status: Accepted

## Context

The Stay domain preserves complete historical business information, including Commercial Agreements, Bed Allocations and Business Events.

However, day-to-day hostel operations require only the current operational state of an active Stay rather than its complete history.

Presenting historical business objects directly to users would increase complexity and duplicate operational logic across the application.

A derived Current Projection provides a simplified, real-time operational view while allowing historical information to remain immutable within the Stay domain.

## Decision

The Stay Workspace shall present a Current Projection derived from the active Stay.

The Current Projection is composed from:

Active Commercial Agreement
Active Bed Allocation(s)
Current Stay Status
Current Door ID

It is an operational view and shall not become the authoritative source of historical information.

## Consequences

Clear separation between history and operational state.
Faster operator workflows.
Preservation of immutable business history.
Consistent architecture across future workspaces.

---

# Architectural Heuristic

One of the guiding principles of RPGMS 2.0 is that every major module answers a specific business question.

| Module | Primary Question |
|---------|------------------|
| Accommodation | **Where is the resident staying?** |
| Residents | **Who is the resident?** |
| Finance | **How much is owed or paid?** |
| Stay Workspace | **What operational action happens next?** |

Whenever a new feature is introduced, developers should first identify which business question is being answered.

That question determines which module owns the feature.

This heuristic helps maintain a clean separation of responsibilities while allowing the Stay Workspace to coordinate day-to-day hostel operations.

---

# Future Roadmap

The Stay Workspace is designed to evolve alongside RPGMS 2.0.

Its architecture intentionally supports the integration of future business modules without requiring major redesign.

Potential future integrations include:

- Maintenance Requests
- Visitor Management
- Inventory
- Housekeeping
- Staff Management
- Notifications
- Digital Documents
- Communication History

Each future module should continue to own its own business logic while exposing operational information through the Stay Workspace.

This approach preserves modularity while maintaining a unified operational experience.

---

# Implementation Strategy

The Stay Workspace will be implemented incrementally to minimise risk and allow continuous validation of the architecture.

The recommended implementation sequence is:

## Phase 1

- Stay Workspace foundation
- Routing
- Header
- Basic layout

## Phase 2

- Resident integration
- Accommodation integration

## Phase 3

- Finance integration
- Financial summary
- Quick actions

## Phase 4

- Business Events Timeline
- Activity history
- Operational workflow

## Phase 5

- Future module integration
- Maintenance
- Visitors
- Notifications

Each phase should be independently testable and deployable.

---

# Related Documentation

The Stay Workspace architecture should be read together with the following project documentation:

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/UI_GUIDELINES.md`
- `docs/PROJECT_RULES.md`
- `docs/DECISIONS.md`

These documents together define the architectural, technical and user experience principles of RPGMS 2.0.

---

# Conclusion

The Stay Workspace is the operational heart of RPGMS 2.0.

Rather than introducing another business module, it provides a unified operational experience by orchestrating the Stay, Accommodation, Residents and Finance domains around the Current Stay.

This architecture reflects the natural workflow of hostel operations while preserving clear ownership of business responsibilities.

The guiding principle remains:

> **The Current Stay is the operational unit of RPGMS 2.0.**

Every operational action begins with the Current Stay, is executed through the Stay Workspace and is delegated to the appropriate business domain.

This architecture provides a scalable foundation for the continued evolution of RPGMS 2.0 while maintaining clarity, consistency and separation of responsibilities.

