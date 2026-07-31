# RPGMS 2.0 – Software Architecture

---

## Document Information

**Document ID:** ARCHITECTURE.md

**Version:** 3.0

**Status:** Approved Software Architecture

**Architecture Baseline v3.0 — Approved for MVP Implementation

**Owner:** RPGMS Architecture

**Last Updated:** 26 July 2026


## Document Status

This document defines the baseline software architecture for RPGMS 2.0 MVP.

The architectural structure described herein is considered stable.

Changes to this document should occur only when:

- A new business capability is introduced.
- A significant architectural decision changes.
- An implementation experience reveals a genuine architectural improvement.

Editorial improvements do not constitute architectural changes.

---

## How to Use This Document

This document is intended for software developers, AI coding agents and technical reviewers working on RPGMS 2.0.

New readers should begin with:

1. Architectural Principles
2. Layered Architecture
3. Domain Architecture

Implementation work should then focus on the Software Domain relevant to the feature being developed.

Supporting chapters such as Data Architecture, Event Architecture and Security Architecture provide cross-cutting guidance that applies to all Software Domains.

---

# Table of Contents

1. Purpose
2. Scope
3. Relationship to Other Documents
4. Architectural Objectives
5. Architectural Philosophy
6. Architectural Principles
7. Layered Architecture
8. Domain Architecture
9. Data Architecture
10. Domain Interaction Architecture
11. Operational Support Domains
12. Platform Domains
13. Domain Independence
14. Cross-Domain Workflows
15. Cross-Cutting Architectural Services
16. Event Architecture
17. Security Architecture
18. Runtime & Deployment Architecture
19. Technology Stack
20. User Interface Architecture
21. Future Evolution
22. Documentation Architecture
23. Architectural Governance
24. Conclusion
---

# Purpose

This document describes the software architecture of RPGMS 2.0. Business concepts, entities and aggregate boundaries are defined in DOMAIN_MODEL.md.

Its purpose is to describe how the software is organised to implement the business architecture defined by RPGMS while remaining maintainable, scalable and consistent throughout the lifetime of the product.

This document establishes the architectural principles, responsibilities and structural boundaries that guide software development across every module of the application.

---

# Scope

This document defines:

- Software architecture
- Architectural principles
- Architectural layers
- Domain architecture
- Cross-cutting architectural services
- Data architecture
- Event architecture
- Security architecture
- User interface architecture
- Architectural governance

This document intentionally does **not** define:

- Business concepts
- Business policies
- Business rules
- Operational workflows
- Database schema
- API contracts
- User interface implementation
- Product roadmap

These responsibilities belong to their respective governance documents.

---

# Relationship to Other Documents

RPGMS documentation follows a layered governance model.

Each document has a single, clearly defined responsibility and derives its authority from the layer above it.

---

## BUSINESS_CONSTITUTION.md (Business Constitution)

Defines:

> **What the business is.**

This document establishes the constitutional foundation of RPGMS.

It defines:

- Business philosophy & architecture principles (BAP-001 to BAP-006)
- Business principles & domain reconciliation (BCR-001 to BCR-008)
- Business entities, relationships & lifecycles
- Constitutional business rules & operational boundaries

The Business Constitution is the highest authority for business behaviour within RPGMS.

---

## BUSINESS_RULES.md (Business Rules)

Defines:

> **What operational rules the business enforces.**

This document translates the Business Constitution into mandatory operational rules governing every domain.

---

## DOMAIN_MODEL.md (Domain Model)

Defines:

> **What conceptual entities, aggregates, and domain boundaries model the business.**

This document translates the Business Constitution into conceptual domain entities, aggregate boundaries, and invariants.

---

## ARCHITECTURE.md

Defines:

> **How the software realises the business.**

This document translates the Business Constitution, Business Rules, and Domain Model into a modular software architecture.

It defines:

- Architectural principles
- Software domains
- Aggregate boundaries
- Application layers
- Cross-cutting services
- Communication patterns
- Technical responsibilities

Architecture shall remain consistent with the Business Constitution, Business Rules, and Domain Model.

---

## Relationship Between the Documents

The governance hierarchy of RPGMS is:

```text
Business Constitution (BUSINESS_CONSTITUTION.md)
        │
        ▼
Business Rules & Domain Model (BUSINESS_RULES.md / DOMAIN_MODEL.md)
        │
        ▼
Software Architecture (ARCHITECTURE.md)
        │
        ▼
Implementation (Source Code)
```

Every implementation should be traceable to an architectural decision.

Every architectural decision should be traceable to the Business Constitution.

Where conflicts arise, the higher-level document shall take precedence until formally revised.

# Architectural Objectives

The architecture of RPGMS is designed to achieve the following objectives:

- Alignment with the Business Constitution
- Enforcement of Business Rules
- Clear separation of responsibilities
- High maintainability
- Long-term scalability
- Predictable evolution
- Consistent implementation
- Simplicity over unnecessary complexity

Every architectural decision should support one or more of these objectives.

---

# Architectural Philosophy

The software architecture exists to serve the business.

Business architecture determines **what** the software must represent.

Business rules determine **what** the software must enforce.

Software architecture determines **how** those responsibilities are organised into a maintainable and scalable system.

Technology choices may evolve over time.

The architectural principles defined in this document are intended to remain stable throughout the lifetime of RPGMS.

---

# Architectural Principles

The following principles govern every architectural decision made within RPGMS.

These principles are intended to remain stable regardless of programming language, framework or infrastructure.

---

## AP-001 Business Before Technology

### Principle

Software architecture shall always serve the business architecture.

Technology choices shall support business objectives rather than define them.

### Rationale

Business requirements evolve more slowly than technology.

By placing business architecture first, RPGMS remains resilient to changes in implementation technology.

---

## AP-002 Clear Separation of Responsibilities

### Principle

Every architectural layer, domain, service and component shall have one clearly defined responsibility.

Responsibilities shall not overlap unnecessarily.

### Rationale

Clear responsibility simplifies development, testing, maintenance and future evolution.

---

## AP-003 Domain Ownership

### Principle

Every business capability shall have exactly one owning software domain.

The owning domain is responsible for implementing:

- Business behaviour
- Business validation
- Business state
- Domain services

Other domains may reference owned information but shall not duplicate ownership.

### Rationale

Single ownership prevents inconsistent implementations and conflicting business logic.

---

## AP-004 Single Source of Truth

### Principle

Every business fact shall have one authoritative software representation.

Derived information shall originate from its authoritative source rather than independent duplication.

### Rationale

A single source of truth improves consistency and reduces maintenance complexity.

---

## AP-005 Layered Responsibilities

### Principle

Software responsibilities shall be organised into clearly defined architectural layers.

Each layer shall depend only upon responsibilities beneath it.

Higher layers coordinate behaviour.

Lower layers implement specialised responsibilities.

### Rationale

Layered architecture improves maintainability and reduces coupling.

---

## AP-006 Business Logic Belongs to the Domain

### Principle

Business rules and business calculations shall be implemented within the domain responsible for that business capability.

Presentation, orchestration and infrastructure layers shall not duplicate business logic.

### Rationale

Business behaviour should exist in exactly one location.

---

## AP-007 Feature Cohesion

### Principle

Each feature module shall own the complete implementation of its business capability.

Implementation details belonging to one feature shall remain encapsulated within that feature wherever practical.

### Rationale

Feature cohesion improves maintainability and enables independent evolution.

---

## AP-008 Simplicity Over Complexity

### Principle

Architectural solutions shall remain as simple as possible while satisfying demonstrated business requirements.

Additional complexity shall only be introduced when justified by clear architectural benefit.

### Rationale

Simple architectures are easier to understand, maintain and extend.

---

## AP-009 Explicit Dependencies

### Principle

Dependencies between architectural components shall remain explicit and directional.

Circular dependencies shall be avoided.

Implementation details shall never become architectural dependencies.

### Rationale

Explicit dependency management preserves architectural integrity.

---

## AP-010 Event-Driven Accountability

### Principle

Significant business operations shall be represented as Domain Events.

Architectural services such as Audit, Notifications and Reporting shall derive behaviour from those events rather than directly from user interface actions.

### Rationale

An event-driven approach improves traceability, extensibility and consistency across the application.

---

## AP-011 Historical Integrity

### Principle

The architecture shall preserve historical business truth.

Architectural decisions shall support immutable business history rather than permitting historical modification.

### Rationale

Historical integrity is essential for operational trust, financial accuracy and auditability.

---

## AP-012 Evolution Without Disruption

### Principle

The architecture shall support future expansion without requiring fundamental redesign of existing business domains.

New capabilities shall extend the architecture rather than replace established responsibilities.

### Rationale

Long-term stability enables predictable growth while protecting existing functionality.

---

## AP-013 Business Aggregates Reflect Business Ownership

### Principle

Aggregate boundaries shall reflect business ownership rather than database structure, user interface design or implementation convenience.

Each Aggregate shall encapsulate the business entities, lifecycle and invariants required to preserve the integrity of the business capability it represents.

### Rationale

Business ownership remains significantly more stable than implementation technology.

Architectural aggregates that reflect business ownership remain understandable, maintainable and resilient as the software evolves.
---
## AP-014 Independent Business Lifecycles

### Principle

Where the business defines independent lifecycles, the software architecture shall model them independently.

Operational Status, Financial Status and other significant business lifecycles shall remain separate architectural concepts unless the Business Constitution explicitly defines them otherwise.

### Rationale

Independent business lifecycles reduce coupling, improve flexibility and more accurately represent real-world business operations.

The software architecture shall preserve these distinctions rather than merging them for implementation convenience.

---
## AP-015 Timeline as a First-Class Business Concept

### Principle

Where the business requires a historical narrative of significant business activity, the architecture shall model the Timeline as a business concept rather than as a technical logging mechanism.

Business Timelines shall be derived from Domain Events and form part of the business domain.

### Rationale

Treating Timelines as business concepts improves operational traceability, user understanding and future extensibility while clearly separating business history from technical audit information.

---
## AP-016 Separation of Business and Technical Services

### Principle

Business Domains shall own business behaviour.

Architectural Services shall provide reusable technical capabilities.

Architectural Services shall never become owners of business concepts, business rules or business lifecycles.

### Rationale

Separating business ownership from technical capability preserves modularity, simplifies maintenance and prevents business behaviour from gradually migrating into shared infrastructure.

---
## Architectural Principles Summary

The architecture of RPGMS is guided by a stable set of enduring principles:

- Business before technology
- Clear ownership
- Single responsibility
- Single source of truth
- Layered organisation
- Feature cohesion
- Business-driven aggregates
- Independent business lifecycles
- Event-driven accountability
- Timeline as a business concept
- Historical integrity
- Separation of business and technical services
- Evolution through extension

These principles provide the foundation for every architectural decision made within the project and ensure that the software architecture remains aligned with the Business Constitution while supporting long-term maintainability and controlled evolution.
---

# Layered Architecture

RPGMS adopts a layered software architecture to achieve clear separation of responsibilities.

Each layer has a well-defined purpose and communicates only with the layers immediately adjacent to it.

This separation improves maintainability, testability and long-term scalability.

---

## Architectural Layers

The software is organised into five primary layers.

```text
Presentation Layer
        │
        ▼
Application Layer
        │
        ▼
Domain Layer
        │
        ▼
Infrastructure Layer
        │
        ▼
Persistence Layer
```

Each layer performs a distinct architectural responsibility.

---

## Presentation Layer

### Responsibility

The Presentation Layer provides the user interface through which users interact with RPGMS.

It is responsible for:

- Rendering user interface components
- Collecting user input
- Displaying business information
- Presenting workflow state
- Initiating user actions

### The Presentation Layer shall not:

- Implement business rules
- Perform business calculations
- Access persistence directly
- Coordinate multiple business domains

---

## Application Layer

### Responsibility

The Application Layer coordinates business workflows.

It acts as the bridge between the Presentation Layer and the Domain Layer.

Typical responsibilities include:

- Coordinating multiple business domains
- Executing application use cases
- Preparing View Models
- Managing workflow state
- Handling user requests
- Coordinating transactions

The Application Layer orchestrates business operations but does not own business behaviour.

---

## Coordinators

Where a workflow spans multiple business domains, the Application Layer may define a Coordinator.

Examples include:

- Stay Workspace Coordinator
- Admission Coordinator
- Checkout Coordinator
- Reservation Coordinator

A Coordinator is responsible for orchestrating a single business workflow.

A Coordinator shall not:

- Contain business rules
- Perform business calculations
- Access infrastructure directly
- Render user interface components

---

## Domain Layer

### Responsibility

The Domain Layer implements the business architecture.

Every software domain corresponds to an owning business domain defined in the Business Constitution.

The Domain Layer owns:

- Business entities
- Business services
- Domain validation
- Business calculations
- Domain events
- Aggregate consistency

Business behaviour shall exist only within the Domain Layer.

---

## Infrastructure Layer

### Responsibility

The Infrastructure Layer provides technical capabilities required by the application.

Examples include:

- Database access
- External services
- Authentication providers
- Notification providers
- File storage
- Logging
- Repository implementations

Infrastructure implements technical concerns while remaining independent of business behaviour.

---

## Persistence Layer

### Responsibility

The Persistence Layer implements repository abstractions and persistence mechanisms defined by the Domain Layer.

It provides durable data storage and mapping without owning repository contracts conceptually.

Persistence technologies may evolve without requiring changes to business architecture or domain boundaries.

The Persistence Layer shall not contain business rules or domain validation logic.

---

## Dependency Direction

Dependencies always flow downward through the architecture.

```text
Presentation
        │
        ▼
Application
        │
        ▼
Domain
        │
        ▼
Infrastructure
        │
        ▼
Persistence
```

Lower layers shall never depend upon higher layers.

---

## Layer Communication Rules

## Presentation → Application

Presentation components invoke application workflows.

Presentation never bypasses the Application Layer.

---

## Application → Domain

Application coordinates domain behaviour.

Application never duplicates business rules.

---

## Domain → Infrastructure

The Domain Layer communicates through defined abstractions.

The Domain Layer remains independent of implementation technologies.

---

## Infrastructure → Persistence

Infrastructure manages storage and integration concerns.

Persistence details remain encapsulated within Infrastructure.

---

## Layer Responsibilities Summary

| Layer | Primary Responsibility |
|--------|------------------------|
| Presentation | User interaction |
| Application | Workflow orchestration |
| Domain | Business behaviour |
| Infrastructure | Technical services |
| Persistence | Durable storage |

Together these layers provide a stable architectural framework that separates business concerns from technical implementation while preserving alignment with the Business Constitution and Business Rules.

---

# Domain Architecture

The Domain Architecture defines how the software implements the business domains described in the Business Constitution.

Each Software Domain owns one clearly defined Business Capability.

A Software Domain is responsible for the complete implementation of that capability, including its business entities, business behaviour, business rules, business lifecycle, aggregate consistency and Domain Events.

No Business Capability shall be owned by more than one Software Domain.

Software Domains own business behaviour.

Cross-domain workflows are coordinated by the Application Layer.

Software Domains communicate through well-defined interfaces and Domain Events rather than implementation details.

---

## Domain Responsibilities

Every Software Domain shall:

- Implement one Business Domain
- Own its business behaviour
- Enforce Business Rules
- Maintain domain consistency
- Publish Domain Events
- Expose well-defined public services

Software Domains shall not duplicate responsibilities owned by another domain.

---

## Domain Classification

Software Domains within RPGMS are organised according to the business capabilities they own.

Each Software Domain has exclusive ownership of a clearly defined business capability, including its business entities, behaviour, lifecycle, business rules and Domain Events.

This ownership model establishes clear architectural boundaries, prevents duplication of business logic and enables independent evolution of each domain.

Software Domains are classified into the following categories.

---

## Core Business Domains

Core Business Domains implement the primary capabilities that define the business of RPGMS.

These domains own the fundamental business concepts and collectively represent the core operational model of the organisation.

Core Business Domains include:

- Accommodation
- Commercial
- Resident
- Reservation
- Stay
- Finance
- Deposit

---

## Operational Support Domains

Operational Support Domains provide specialised capabilities that support the day-to-day operation of the business.

These domains extend the core operational model while maintaining independent ownership of their own business rules and lifecycle.

Operational Support Domains include:

- Laundry
- Internet
- Maintenance
- Complaints

---

## Information Domains

Information Domains provide information and business insight derived from the Core Business Domains and Operational Support Domains.

They do not own operational business capabilities or modify business data.

Information Domains consume data published by other Software Domains and present it for decision-making, monitoring and analysis.

Information Domains transform business information into operational insight.

They own reporting, analytics and business intelligence but do not own operational business state.

Information Domains include:

- Reporting
- Dashboard

---

## Platform Domains

Platform Domains provide the technical capabilities required to support the operation of the software platform.

They do not own business capabilities or operational workflows.

Platform Domains provide shared technical services used by the Core Business Domains, Operational Support Domains and Information Domains while remaining independent of business rules wherever possible.

Platform Domains provide configuration and administrative capabilities required for operating the software platform.

They own system configuration, administration and application-level policies but do not own business behaviour.

Platform Domains include:

- User Administration
- Security Administration
- Authentication & Authorization
- Notification
- Audit
- Configuration / System Settings

---

## Cross-Cutting Architectural Services

Cross-Cutting Architectural Services provide reusable technical capabilities shared across multiple Software Domains.

They are part of the software architecture rather than the business model.

Architectural Services never own business entities, business rules or business lifecycles.

Examples include:

- Authentication
- Authorisation
- Audit
- Notifications
- Search
- File Storage
- Integration
- Scheduling

Each Cross-Cutting Architectural Service is implemented and governed by the corresponding Platform Domain where one exists. The service describes the reusable technical capability, while the Platform Domain owns its lifecycle, policies and implementation.

---

# Data Architecture

The RPGMS Data Architecture is organised around Software Domain ownership.

Every business entity has a single authoritative owner responsible for its lifecycle, integrity and business rules.

Software Domains collaborate by referencing information owned by other domains rather than sharing ownership of business data.

This architecture ensures clear ownership, maintains data consistency and reduces coupling between Software Domains.

---

## Data Ownership Principles

The RPGMS platform follows these principles:

- Every business entity has exactly one owning Software Domain.
- The owning Software Domain is the only domain permitted to modify that entity.
- Other Software Domains may reference the entity but must not modify it.
- Business rules are enforced by the owning Software Domain.
- Cross-domain communication occurs through Domain Events and well-defined service interfaces.

---

## Cross-Domain References

Software Domains frequently reference information owned by other Software Domains.

A reference does not imply ownership.

For example:

- Stay references Resident.
- Stay references Accommodation.
- Finance references Stay.
- Deposit references Resident.
- Laundry references Stay.

The owning Software Domain remains solely responsible for maintaining the referenced information.

---

## Data Consistency

Each Software Domain is responsible for maintaining consistency of its own data.

Cross-domain consistency is achieved through Domain Events and coordinated business processes rather than distributed transactions wherever practical.

This approach supports modularity, scalability and independent evolution of Software Domains.

---

## Historical Data

Historical business data is preserved as an immutable record of completed business activities.

Software Domains may archive completed records according to business policies but historical information must remain available for reporting, auditing and business analysis.

Historical records continue to belong to their original owning Software Domain.

---

## Architectural Principle

Data ownership defines software ownership.

Every business entity has one authoritative owner.

All other Software Domains collaborate through references, Domain Events and well-defined interfaces rather than shared ownership of business data.

---

## Core Software Domains

The following domains form the core architecture of RPGMS.

---

## Dashboard Domain

### Purpose

The Dashboard Domain provides operational visibility into the current state of the business.

It aggregates information from multiple Software Domains to present key operational indicators, business metrics and alerts for monitoring and decision-making.

The Dashboard Domain is an Information Domain and does not own operational business data.

---

### Responsibilities

The Dashboard Domain is responsible for:

- Business metrics
- Operational summaries
- Occupancy indicators
- Financial indicators
- Operational alerts
- Key Performance Indicators (KPIs)

---

### Owns

The Dashboard Domain owns:

- Dashboard Views
- Dashboard Widgets
- Dashboard Configuration
- Dashboard Domain Events

---

### Does Not Own

The Dashboard Domain does **not** own:

- Resident data
- Accommodation data
- Financial records
- Operational workflows
- Business transactions

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Dashboard Domain publishes Domain Events including:

- DashboardRefreshed
- DashboardConfigurationChanged

---

### Dependencies

The Dashboard Domain consumes information from:

- Accommodation Domain
- Commercial Domain
- Resident Domain
- Reservation Domain
- Stay Domain
- Finance Domain
- Deposit Domain
- Operational Support Domains

---

### Architectural Principle

The Dashboard Domain presents business information without owning the underlying business data.

Operational decisions remain the responsibility of the domains that own the corresponding business capabilities.

---

## Accommodation Domain

### Purpose

The Accommodation Domain owns the physical accommodation inventory of RPGMS.

It is responsible for defining, organising and maintaining the physical accommodation infrastructure that can be occupied by residents.

The Accommodation Domain is concerned exclusively with physical accommodation assets and their structural relationships. It has no knowledge of commercial agreements, reservations, occupancy or financial transactions.

---

### Responsibilities

The Accommodation Domain is responsible for:

- Areas
- Buildings (Future)
- Floors (Future)
- Flats
- Rooms (where applicable)
- Beds
- Physical accommodation hierarchy
- Physical bed characteristics
- Physical capacity
- Physical availability
- Blocking and unblocking of physical accommodation

---

### Owns

The Accommodation Domain owns:

- Accommodation entities
- Physical identifiers
- Structural relationships
- Capacity constraints
- Physical availability status
- Physical accommodation validation rules
- Accommodation Domain Events

---

### Domain Rule Module Separation

To enforce Clean Architecture and preserve strict separation of concerns within the Accommodation Domain, domain rules are partitioned into distinct, focused modules:

* **`flatRules.ts`**: Owns structural configuration validation rules for Flats and Areas (Area name uniqueness, Bed prefix uniqueness, minimum bed counts, stable physical identifier guards, and occupied bed truncation guards).
* **`occupancyRules.ts`**: Owns temporal occupancy rules, bed status synchronization against active/on-notice Stays, and deletion safety checks against active occupants.
* **`bedRules.ts`**: Owns operational Bed lifecycle transition rules (`canBlockBed`, `canUnblockBed`, `canStartMaintenance`, `canCompleteMaintenance`) and execution helpers.

This architectural decision prevents rule pollution and ensures that structural configuration, operational transitions, and temporal occupancy synchronization remain cleanly decoupled.

---

### Application Layer Business Operations Over State Mutations

The Application layer (`AccommodationWorkspaceCoordinator`) strictly exposes explicit **Business Operations** representing domain intent (`blockBed()`, `unblockBed()`, `startBedMaintenance()`, `completeBedMaintenance()`) rather than generic state mutations (`updateStatus()`, `setStatus()`).

Each business operation executes its own domain validation guard (`bedRules.ts`) before mutating state, simplifying future integration with Audit Logging, Permission Checks, and Notifications.

---

### Does Not Own

The Accommodation Domain does **not** own:

- Accommodation Plans
- Pricing
- Rent
- Reservations
- Resident allocation
- Bed occupancy
- Stay lifecycle
- Occupancy history
- Financial transactions
- Deposit Accounts

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Accommodation Domain publishes Domain Events including:

- AreaCreated
- AreaUpdated
- AreaBlocked
- AreaUnblocked

- FlatCreated
- FlatUpdated
- FlatBlocked
- FlatUnblocked

- BedCreated
- BedUpdated
- BedBlocked
- BedUnblocked

- PhysicalCapacityChanged

---

### Dependencies

The Accommodation Domain has no mandatory dependency on any other Core Business Domain.

Other Software Domains consume Accommodation information, but the Accommodation Domain remains independently responsible for maintaining the physical accommodation inventory.

---

### Architectural Principle

The Accommodation Domain represents physical infrastructure.

It owns the physical accommodation inventory and nothing more.

Commercial agreements belong to the Commercial Domain.

Reservations belong to the Reservation Domain.

Occupancy belongs to the Stay Domain.

Financial responsibility belongs to the Finance and Deposit Domains.

This strict separation of ownership preserves clear architectural boundaries, prevents business rule duplication and enables independent evolution of each domain.

---

## Commercial Domain

### Purpose

The Commercial Domain owns the commercial offering of RPGMS.

It is responsible for defining the accommodation plans, pricing structures and commercial terms under which physical accommodation is offered to residents.

The Commercial Domain is concerned exclusively with commercial agreements. It has no knowledge of physical accommodation inventory, occupancy or financial transactions.

---

### Responsibilities

The Commercial Domain is responsible for:

- Accommodation Plans
- Plan pricing
- Rent structures
- Plan features
- Plan availability
- Commercial terms
- Plan lifecycle management
- Versioning of commercial offerings

---

### Owns

The Commercial Domain owns:

- Accommodation Plan entities
- Pricing structures
- Commercial rules
- Plan validation
- Commercial Domain Events

---

### Does Not Own

The Commercial Domain does **not** own:

- Areas
- Flats
- Rooms
- Beds
- Resident allocation
- Reservations
- Stay lifecycle
- Financial ledger
- Payments
- Deposit Accounts

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Commercial Domain publishes Domain Events including:

- AccommodationPlanCreated
- AccommodationPlanUpdated
- AccommodationPlanActivated
- AccommodationPlanSuspended
- AccommodationPlanRetired
- PlanPricingChanged

---

### Dependencies

The Commercial Domain depends on no operational domain.

Other Software Domains consume Accommodation Plan information when creating Reservations, Stays and Financial Charges.

---

### Architectural Principle

The Commercial Domain represents the business offering rather than the physical infrastructure.

Physical accommodation belongs to the Accommodation Domain.

Commercial agreements belong to the Commercial Domain.

Separating physical accommodation from commercial offerings allows pricing strategies, accommodation plans and commercial policies to evolve independently of the physical accommodation inventory.

---

## Resident Domain

### Purpose

The Resident Domain owns the permanent identity of every person who interacts with RPGMS as a resident.

It is responsible for maintaining resident identity, personal information, contact details, documentation and resident-specific information throughout the resident's lifetime within the organisation.

The Resident Domain is concerned exclusively with the identity of the resident. It has no knowledge of accommodation allocation, reservations, occupancy or financial obligations.

---

### Responsibilities

The Resident Domain is responsible for:

- Resident identity
- Personal information
- Contact information
- Emergency contacts
- Government identification
- Resident documents
- Profile information
- Resident preferences
- Resident lifecycle management
- Resident status

---

### Owns

The Resident Domain owns:

- Resident entities
- Resident identifiers
- Personal information
- Identity validation
- Resident Domain Events

---

### Does Not Own

The Resident Domain does **not** own:

- Accommodation allocation
- Reservations
- Bed occupancy
- Stay lifecycle
- Financial obligations
- Payments
- Deposit Accounts
- Accommodation Plans

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Resident Domain publishes Domain Events including:

- ResidentRegistered
- ResidentUpdated
- ResidentDocumentAdded
- ResidentDocumentUpdated
- ResidentStatusChanged
- ResidentArchived

---

### Dependencies

The Resident Domain has no mandatory dependency on any other Core Business Domain.

Other Software Domains reference the Resident Domain when establishing Reservations, Stays, Financial Accounts and Deposit Accounts.

---

### Architectural Principle

The Resident Domain represents a person rather than their accommodation or financial relationship with the organisation.

A Resident may exist without an active Reservation, Stay, Financial Account or Deposit Account.

The Resident Domain provides the permanent identity upon which all other resident-related business capabilities are built.

---

## Reservation Domain

### Purpose

The Reservation Domain owns the future intent to occupy accommodation.

It is responsible for managing reservation requests, reservation commitments, reservation lifecycle and the allocation of future accommodation prior to the commencement of a Stay.

The Reservation Domain is concerned exclusively with future occupancy. It has no knowledge of current occupancy, resident lifecycle or financial settlement.

---

### Responsibilities

The Reservation Domain is responsible for:

- Reservation creation
- Reservation modification
- Reservation confirmation
- Reservation cancellation
- Reservation expiry
- Future accommodation allocation
- Reservation lifecycle management
- Reservation validation

---

### Owns

The Reservation Domain owns:

- Reservation entities
- Reservation status
- Reservation validation rules
- Reservation Domain Events

---

### Does Not Own

The Reservation Domain does **not** own:

- Physical accommodation inventory
- Accommodation Plans
- Resident identity
- Current occupancy
- Stay lifecycle
- Financial charges
- Payments
- Deposit Accounts

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Reservation Domain publishes Domain Events including:

- ReservationCreated
- ReservationUpdated
- ReservationConfirmed
- ReservationCancelled
- ReservationExpired
- ReservationConvertedToStay

---

### Dependencies

The Reservation Domain references:

- Accommodation Domain for physical accommodation.
- Commercial Domain for Accommodation Plans.
- Resident Domain for resident identity.

A confirmed Reservation may subsequently create a Stay.

---

### Architectural Principle

The Reservation Domain represents future intent rather than current occupancy.

A Reservation reserves the opportunity to occupy accommodation.

A Reservation never represents an active Stay.

When a resident physically checks in, operational responsibility transfers from the Reservation Domain to the Stay Domain.

This separation allows Reservations and Stays to evolve independently while preserving a complete business history.

---
## Stay Domain

### Purpose

The Stay Domain owns the operational occupancy lifecycle of a resident within a designated Flat.

It is responsible for managing the complete operational relationship between a resident and the organisation from physical check-in until operational checkout.

The Stay Domain coordinates occupancy while referencing Accommodation, Commercial and Resident information. It is bounded by Flat (1 Stay = 1 Flat boundary) and is concerned exclusively with operational occupancy.

---

### Responsibilities

The Stay Domain is responsible for:

- Check-in & Stay commencement
- Flat assignment and multi-bed allocation within Flat
- Bed allocation, Bed release, and Bed transfer
- Accommodation Amendments recording
- Notice processing (intent to vacate)
- Operational occupancy & operational status management
- Operational checkout (sole terminal operational event)
- Stay operational timeline derived from Business Events
- Occupancy validation

---

### Owns

The Stay Domain owns:

- Stay entities
- Stay identifiers
- Operational occupancy state bounded by Flat
- Bed allocations within assigned Flat
- Accommodation Amendments history
- Notice processing state
- Operational lifecycle
- Stay Domain Events

---

### Does Not Own

The Stay Domain does **not** own:

- Resident identity (owned by Resident Domain)
- Physical accommodation inventory (owned by Accommodation Domain)
- Commercial terms & Lock-in Period (owned by Commercial/Finance Domain)
- Reservation lifecycle (owned by Reservation Domain)
- Financial charges & Ledger (owned by Finance Domain)
- Payments (owned by Finance Domain)
- Financial settlement (owned by Finance Domain)
- Security Deposit Accounts (owned by Deposit Domain)

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Stay Domain publishes Domain Events including:

- StayStarted
- BedAllocated
- BedReleased
- BedTransferred
- AccommodationAmendmentRecorded
- NoticeSubmitted
- NoticeRevised
- NoticeWithdrawn
- OperationalCheckoutInitiated
- OperationalCheckoutCompleted
- StayCompleted

---

### Dependencies

The Stay Domain references:

- Resident Domain for resident identity profile.
- Accommodation Domain for Flat and Bed physical accommodation.
- Commercial Domain for Commercial Agreements.
- Reservation Domain when a Reservation is converted into a Stay.

The Finance and Deposit Domains consume Stay Domain Events to initiate financial processing where required.

---

### Architectural Principle

The Stay Domain represents the operational occupancy relationship between a resident and the organisation.

A Stay is bounded by exactly one Flat and may occupy one or more Beds within that Flat simultaneously (BCR-002).

A Stay begins when a resident physically checks in and ends when operational checkout is completed.

The Stay Domain owns operational occupancy only. Commercial agreements belong to the Commercial Domain, resident identity belongs to the Resident Domain, and financial obligations belong to the Finance Domain.

### Stay Primary Domain Aggregate

The Stay Primary Domain Aggregate is the central operational boundary of RPGMS.

It encapsulates all information required to manage the operational occupancy lifecycle while referencing business information owned by other domains.

The Stay Primary Domain Aggregate consists of:

- Stay
- Flat assignment reference (1 Stay = 1 Flat)
- Bed Allocation(s) within Flat
- Operational Status
- Accommodation Amendments history
- Notice processing state
- Stay Timeline
- Check-in & Operational Checkout Information

The Stay Primary Domain Aggregate references, but does not own:

- Resident Profile
- Accommodation Physical Structure
- Commercial Agreement
- Reservation
- Financial Account
- Deposit Account

### Lifecycle Independence

The completion of a Stay does not imply completion of the associated financial obligations.

Operational Checkout and Financial Settlement are independent business processes owned by different Software Domains (BR-209, BR-460).

The Stay Domain concludes with Operational Checkout.

Any remaining financial obligations continue to be managed by the Finance Domain until financial settlement is complete.
  
---
## Finance Domain

### Purpose

The Finance Domain owns the financial obligations arising from a resident's relationship with the organisation.

It is responsible for recording charges, payments, outstanding balances and financial settlement while maintaining a complete financial history.

The Finance Domain is concerned exclusively with financial accounting. It has no ownership of resident identity, accommodation inventory, occupancy or security deposits.

---

### Responsibilities

The Finance Domain is responsible for:

- Financial charges
- Payment recording
- Outstanding balance calculation
- Financial adjustments
- Financial settlement
- Financial account management
- Financial validation
- Financial history

---

### Owns

The Finance Domain owns:

- Financial Accounts
- Charges
- Payments
- Outstanding balances
- Financial statements
- Financial Domain Events

---

### Does Not Own

The Finance Domain does **not** own:

- Resident identity
- Physical accommodation
- Accommodation Plans
- Reservations
- Stay lifecycle
- Bed occupancy
- Security Deposit Accounts

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Finance Domain publishes Domain Events including:

- ChargeRaised
- ChargeAdjusted
- PaymentRecorded
- PaymentReversed
- FinancialSettlementStarted
- FinancialSettlementCompleted
- AccountClosed

---

### Dependencies

The Finance Domain references:

- Resident Domain for resident identity.
- Stay Domain for occupancy events.
- Commercial Domain for applicable Accommodation Plans.

The Finance Domain operates independently of the Deposit Domain, although both may participate in the overall checkout process.

---

### Architectural Principle

The Finance Domain represents the financial relationship between the resident and the organisation.

It owns financial obligations arising from business activities but does not own the business activities themselves.

Business activities generate financial consequences.

The Finance Domain records and manages those consequences while remaining independent of operational occupancy and security deposit management.

---

## Deposit Domain

### Purpose

The Deposit Domain owns the complete lifecycle of Security Deposits held by the organisation.

It is responsible for receiving, safeguarding, adjusting, reconciling and refunding Security Deposits while maintaining a complete history of all deposit-related activities.

The Deposit Domain is concerned exclusively with Security Deposit management. It has no ownership of accommodation, occupancy or general financial accounting.

---

### Responsibilities

The Deposit Domain is responsible for:

- Security Deposit Accounts
- Deposit collection
- Deposit adjustments
- Deposit deductions
- Deposit refunds
- Deposit reconciliation
- Deposit balance management
- Deposit lifecycle management

---

### Owns

The Deposit Domain owns:

- Deposit Accounts
- Deposit transactions
- Deposit balances
- Deposit adjustments
- Deposit reconciliation
- Deposit Domain Events

---

### Does Not Own

The Deposit Domain does **not** own:

- Resident identity
- Physical accommodation
- Accommodation Plans
- Reservations
- Stay lifecycle
- Financial charges
- Rent payments
- General financial accounting

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Deposit Domain publishes Domain Events including:

- DepositAccountOpened
- DepositCollected
- DepositAdjusted
- DepositDeductionApplied
- DepositRefundInitiated
- DepositRefundCompleted
- DepositAccountClosed

---

### Dependencies

The Deposit Domain references:

- Resident Domain for resident identity.
- Stay Domain for operational occupancy.
- Finance Domain during financial settlement.

The Deposit Domain operates independently throughout the resident's Stay and participates in the final financial settlement process where applicable.

---

### Architectural Principle

The Deposit Domain represents Security Deposits held in trust by the organisation.

Security Deposits are independent business assets with their own lifecycle, transactions and reconciliation requirements.

They are neither revenue nor ordinary payments.

Separating Security Deposit management from general financial accounting preserves clear business ownership, improves auditability and allows the Deposit lifecycle to evolve independently of the Finance Domain.

### Deposit Lifecycle

A Security Deposit follows an independent business lifecycle:

Deposit Account Opened

↓

Deposit Collected

↓

Deposit Held

↓

Adjustments (Optional)

↓

Financial Settlement

↓

Deposit Refunded

↓

Deposit Account Closed

The Deposit lifecycle is independent of both the Stay lifecycle and the Financial Account lifecycle.

Operational Checkout does not automatically close the Deposit Account.

The Deposit Account remains active until all authorised deductions and refunds have been completed.

---

# Domain Interaction Architecture

The Core Business Domains of RPGMS operate as independent business capabilities while collaborating through well-defined business relationships and Domain Events.

Each Software Domain owns a single business capability and remains solely responsible for its entities, business rules, lifecycle and Domain Events.

Interaction between domains shall preserve clear ownership boundaries while enabling the coordinated execution of business processes.

---

## Core Business Domain Summary

The Core Business Domains represent the primary business capabilities of RPGMS. Each domain owns a single business capability and is solely responsible for its entities, business rules, lifecycle and Domain Events.

| Domain | Primary Responsibility |
|---------|------------------------|
| Accommodation | Physical accommodation inventory |
| Commercial | Commercial offerings and pricing |
| Resident | Resident identity |
| Reservation | Future occupancy intent |
| Stay | Operational occupancy lifecycle |
| Finance | Financial obligations and accounting |
| Deposit | Security Deposit lifecycle |

Each Core Business Domain has a single, clearly defined owner.

Business capabilities are never shared between domains. Domains collaborate through Domain Events while preserving independent ownership of their own entities, business rules and lifecycles.

---

## Core Business Domain Dependencies

```text
                    Resident
                        │
                        │
                        ▼
                  Reservation
                        │
                        ▼
                      Stay
                 ╱      │      ╲
                ╱       │       ╲
Accommodation   │   Commercial   │
                ╲       │       ╱
                 ╲      ▼      ╱
                  ─── Finance ───
                        │
                        ▼
                     Deposit
```

### Dependency Principles

- Accommodation provides the physical accommodation inventory.
- Commercial provides the commercial offering.
- Resident provides resident identity.
- Reservation represents future occupancy.
- Stay owns operational occupancy.
- Finance records financial obligations arising from business activities.
- Deposit manages the Security Deposit lifecycle.

Dependencies always point towards the domain providing the required business capability.

Software Domains may reference information owned by another domain but never assume ownership of that information.

---

## Business Lifecycle Overview

```text
Resident
    │
    ▼
Reservation (Optional)
    │
    ▼
Stay
    │
    ├──────────────► Finance
    │
    └──────────────► Deposit
    │
    ▼
Operational Checkout
    │
    ▼
Historical Stay

Finance continues independently until
Financial Settlement is complete.

Deposit continues independently until
Deposit Account is closed.
```

The operational lifecycle, financial lifecycle and Security Deposit lifecycle are independent business processes coordinated through Domain Events.

Completion of one lifecycle does not imply completion of another.

---

## Domain Event Flow

Domain Events communicate significant changes in business state between Software Domains while preserving clear ownership boundaries.

Typical Domain Event flow:

```text
ReservationCreated
        │
        ▼
ReservationConfirmed
        │
        ▼
ReservationConvertedToStay
        │
        ▼
StayStarted
        │
        ▼
ChargeRaised
        │
        ▼
PaymentRecorded
        │
        ▼
OperationalCheckoutCompleted
        │
        ▼
FinancialSettlementCompleted
        │
        ▼
DepositRefundCompleted
```

Each Domain Event is published by exactly one Software Domain.

Other Software Domains may consume the event but never assume ownership of the originating business capability.

---

## Ownership Principles

The interaction between Software Domains is governed by the following architectural principles:

- Each Business Capability has exactly one owner.
- Each Software Domain owns its own entities, business rules, lifecycle and Domain Events.
- Software Domains collaborate through published Domain Events and well-defined interfaces.
- Software Domains may reference information owned by another domain but shall never modify it directly.
- Aggregate consistency is maintained exclusively within the owning domain.
- Business ownership shall never be duplicated across Software Domains.
- Operational, Financial and Deposit lifecycles remain independent while collaborating through Domain Events.
- Architectural Services provide technical capabilities but never own business concepts.

These principles preserve clear business ownership, minimise coupling between Software Domains and allow the architecture to evolve through extension rather than modification.

---

## Laundry Domain

### Purpose

The Laundry Domain owns the complete lifecycle of laundry services provided to residents.

It is responsible for recording laundry items, tracking service requests, calculating service charges and maintaining a history of laundry transactions.

The Laundry Domain provides an operational support service and does not own resident occupancy or financial accounting.

---

### Responsibilities

The Laundry Domain is responsible for:

- Laundry service requests
- Laundry item recording
- Laundry service tracking
- Laundry charge calculation
- Laundry transaction history
- Laundry validation

---

### Owns

The Laundry Domain owns:

- Laundry Transactions
- Laundry Service Records
- Laundry Domain Events

---

### Does Not Own

The Laundry Domain does **not** own:

- Resident identity
- Stay lifecycle
- Financial Accounts
- Accommodation
- Security Deposits

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Laundry Domain publishes Domain Events including:

- LaundryRecorded
- LaundryChargeCalculated
- LaundryChargeRaised
- LaundryTransactionCorrected

---

### Dependencies

The Laundry Domain references:

- Resident Domain for resident identity.
- Stay Domain for operational occupancy.
- Finance Domain for financial charge processing.

---

### Architectural Principle

The Laundry Domain owns the laundry service lifecycle.

Financial responsibility for laundry charges belongs to the Finance Domain.

Operational responsibility for resident occupancy belongs to the Stay Domain.

---

## Internet Domain

### Purpose

The Internet Domain owns the provisioning and management of internet access services provided to residents.

It is responsible for assigning, maintaining and revoking internet access while maintaining a complete history of internet service activities.

The Internet Domain provides an operational support service and does not own resident occupancy or authentication.

---

### Responsibilities

The Internet Domain is responsible for:

- Internet account provisioning
- Internet credential assignment
- Internet service activation
- Internet service suspension
- Internet service termination
- Internet access history

---

### Owns

The Internet Domain owns:

- Internet Service Accounts
- Internet Credentials
- Internet Service Records
- Internet Domain Events

---

### Does Not Own

The Internet Domain does **not** own:

- Resident identity
- Stay lifecycle
- Authentication
- User accounts
- Financial Accounts
- Accommodation

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Internet Domain publishes Domain Events including:

- InternetServiceProvisioned
- InternetServiceActivated
- InternetServiceSuspended
- InternetServiceTerminated
- InternetCredentialsChanged

---

### Dependencies

The Internet Domain references:

- Resident Domain for resident identity.
- Stay Domain for operational occupancy.
- Platform Services where external internet systems require technical integration.

---

### Architectural Principle

The Internet Domain owns internet service provisioning.

Authentication and system security remain the responsibility of the Platform Domains and Cross-Cutting Architectural Services.

Internet services are operational support services provided to residents during an active Stay.

---
## Maintenance Domain

### Purpose

The Maintenance Domain owns the complete lifecycle of maintenance activities performed on the organisation's physical accommodation and facilities.

It is responsible for recording maintenance requests, planning maintenance work, tracking progress, managing completion and maintaining a history of maintenance activities.

The Maintenance Domain provides an operational support service and does not own accommodation inventory or resident occupancy.

---

### Responsibilities

The Maintenance Domain is responsible for:

- Maintenance requests
- Preventive maintenance
- Corrective maintenance
- Maintenance scheduling
- Maintenance status tracking
- Maintenance completion
- Maintenance history

---

### Owns

The Maintenance Domain owns:

- Maintenance Requests
- Maintenance Work Orders
- Maintenance Records
- Maintenance Domain Events

---

### Does Not Own

The Maintenance Domain does **not** own:

- Accommodation inventory
- Resident identity
- Stay lifecycle
- Financial Accounts
- Complaints

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Maintenance Domain publishes Domain Events including:

- MaintenanceRequested
- MaintenanceScheduled
- MaintenanceStarted
- MaintenanceCompleted
- MaintenanceCancelled

---

### Dependencies

The Maintenance Domain references:

- Accommodation Domain for physical assets requiring maintenance.
- Resident Domain where a maintenance request originates from a resident.
- Stay Domain where maintenance affects occupied accommodation.

---

### Architectural Principle

The Maintenance Domain owns maintenance activities.

The Accommodation Domain continues to own the physical accommodation throughout the maintenance lifecycle.

Maintenance activities support and preserve physical assets without assuming ownership of those assets.

---

## Complaints Domain

### Purpose

The Complaints Domain owns the complete lifecycle of complaints raised by residents.

It is responsible for recording complaints, tracking their progress, coordinating resolution activities and maintaining a complete history of complaint management.

The Complaints Domain provides an operational support service and does not own maintenance activities or operational occupancy.

---

### Responsibilities

The Complaints Domain is responsible for:

- Complaint registration
- Complaint categorisation
- Complaint prioritisation
- Complaint assignment
- Complaint status tracking
- Complaint resolution tracking
- Complaint history

---

### Owns

The Complaints Domain owns:

- Complaint Records
- Complaint Workflow
- Complaint History
- Complaint Domain Events

---

### Does Not Own

The Complaints Domain does **not** own:

- Resident identity
- Stay lifecycle
- Maintenance activities
- Financial Accounts
- Accommodation inventory

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Complaints Domain publishes Domain Events including:

- ComplaintRegistered
- ComplaintAssigned
- ComplaintEscalated
- ComplaintResolved
- ComplaintClosed

---

### Dependencies

The Complaints Domain references:

- Resident Domain for resident identity.
- Stay Domain for operational occupancy.
- Maintenance Domain where a complaint requires maintenance work.
- Other Software Domains where complaint resolution requires their business capabilities.

---

### Architectural Principle

The Complaints Domain owns the complaint management lifecycle.

Resolution activities remain the responsibility of the Software Domain that owns the underlying business capability.

A complaint may result in maintenance, operational action, administrative action or no corrective action depending on investigation and business rules.

---

Information Domains provide information and business insight derived from the Core Business Domains and Operational Support Domains.

They do not own operational business capabilities or modify business data.

Information Domains consume data published by other Software Domains and present it for decision-making, monitoring and analysis.

---

## Authentication & Authorization Domain

### Purpose

The Authentication & Authorization Domain provides identity verification and access control for users of the RPGMS platform.

It is responsible for authenticating users, authorising access to system resources and enforcing security policies.

The Authentication & Authorization Domain is a Platform Domain and does not own business capabilities or operational data.

---

### Responsibilities

The Authentication & Authorization Domain is responsible for:

- User authentication
- Role-based access control
- Permission management
- Session management
- Access policy enforcement
- Authentication auditing

---

### Owns

The Authentication & Authorization Domain owns:

- Authentication Sessions
- Roles
- Permissions
- Access Policies
- Authentication Domain Events

---

### Does Not Own

The Authentication & Authorization Domain does **not** own:

- Resident identity
- Staff information
- Business workflows
- Financial data
- Accommodation data

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Authentication & Authorization Domain publishes Domain Events including:

- UserAuthenticated
- UserSignedOut
- PermissionGranted
- PermissionRevoked
- AccessDenied

---

### Dependencies

The Authentication & Authorization Domain may reference:

- User Administration Domain for user accounts.
- Platform infrastructure for identity providers where applicable.

It remains independent of business domains.

---

### Architectural Principle

The Authentication & Authorization Domain determines who may access the system and what actions they are permitted to perform.

Business decisions remain the responsibility of the domains that own the corresponding business capabilities.

---

## User Administration Domain

### Purpose

The User Administration Domain owns the lifecycle of system users who operate the RPGMS platform.

It is responsible for managing user accounts, user profiles, organisational assignments and user status throughout their relationship with the system.

The User Administration Domain is a Platform Domain and does not own authentication or business capabilities.

---

### Responsibilities

The User Administration Domain is responsible for:

- User account management
- User profile management
- User activation and deactivation
- Organisational assignments
- User preferences
- User lifecycle management

---

### Owns

The User Administration Domain owns:

- User Accounts
- User Profiles
- User Preferences
- User Status
- User Administration Events

---

### Does Not Own

The User Administration Domain does **not** own:

- Authentication sessions
- Roles and permissions
- Resident records
- Staff business information
- Business workflows

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The User Administration Domain publishes Domain Events including:

- UserCreated
- UserUpdated
- UserActivated
- UserDeactivated
- UserArchived

---

### Dependencies

The User Administration Domain collaborates with:

- Authentication & Authorization Domain for access control.
- Other Software Domains that associate business activities with users.

---

### Architectural Principle

The User Administration Domain owns user identity within the RPGMS platform.

Authentication and access control remain the responsibility of the Authentication & Authorization Domain.

---

## Reporting Domain

### Purpose

The Reporting Domain provides historical analysis, operational reporting and business insight derived from information owned by other Software Domains.

It is responsible for generating reports, supporting business analysis and maintaining reusable reporting definitions.

The Reporting Domain is an Information Domain and does not own operational business data.

---

### Responsibilities

The Reporting Domain is responsible for:

- Operational reports
- Financial reports
- Occupancy reports
- Historical analysis
- Report generation
- Report definitions

---

### Owns

The Reporting Domain owns:

- Report Definitions
- Report Templates
- Report Configuration
- Reporting Domain Events

---

### Does Not Own

The Reporting Domain does **not** own:

- Business transactions
- Resident records
- Financial Accounts
- Accommodation inventory
- Operational workflows

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Reporting Domain publishes Domain Events including:

- ReportGenerated
- ReportScheduled
- ReportDefinitionUpdated

---

### Dependencies

The Reporting Domain consumes information from:

- Accommodation Domain
- Commercial Domain
- Resident Domain
- Reservation Domain
- Stay Domain
- Finance Domain
- Deposit Domain
- Operational Support Domains

---

### Architectural Principle

The Reporting Domain transforms business information into operational, financial and analytical reports.

Reports provide business insight without assuming ownership of the underlying business data.

---

## Notification Domain

### Purpose

The Notification Domain provides message delivery services for the RPGMS platform.

It is responsible for preparing, scheduling and delivering notifications through supported communication channels while maintaining a history of notification activities.

The Notification Domain is a Platform Domain and does not own business workflows or business decisions.

---

### Responsibilities

The Notification Domain is responsible for:

- Notification generation
- Message template management
- Multi-channel message delivery
- Delivery scheduling
- Delivery status tracking
- Notification history

---

### Owns

The Notification Domain owns:

- Notification Requests
- Message Templates
- Delivery Records
- Notification History
- Notification Domain Events

---

### Does Not Own

The Notification Domain does **not** own:

- Business workflows
- Business rules
- Resident data
- Financial transactions
- Operational decisions

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Notification Domain publishes Domain Events including:

- NotificationQueued
- NotificationSent
- NotificationDelivered
- NotificationFailed
- NotificationCancelled

---

### Dependencies

The Notification Domain receives notification requests from:

- Core Business Domains
- Operational Support Domains
- Information Domains
- Platform Domains

It may integrate with external communication providers including email, SMS, messaging platforms and push notification services.

---

### Architectural Principle

The Notification Domain delivers messages requested by other Software Domains.

The responsibility for deciding when and why a notification should be sent always remains with the originating Software Domain.

---

## Audit Domain

### Purpose

The Audit Domain provides immutable recording of significant activities performed within the RPGMS platform.

It is responsible for maintaining a complete audit trail of system actions, Domain Events and security-related activities to support accountability, investigation and compliance.

The Audit Domain is a Platform Domain and does not own business capabilities or modify business data.

---

### Responsibilities

The Audit Domain is responsible for:

- Audit trail recording
- Activity logging
- Security event logging
- Business event recording
- Audit history
- Audit search and retrieval

---

### Owns

The Audit Domain owns:

- Audit Records
- Audit History
- Audit Metadata
- Audit Domain Events

---

### Does Not Own

The Audit Domain does **not** own:

- Business transactions
- Business rules
- Resident records
- Financial records
- Operational workflows

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Audit Domain publishes Domain Events including:

- AuditRecordCreated
- AuditArchiveCompleted
- AuditRetentionPolicyApplied

---

### Dependencies

The Audit Domain receives audit information from:

- Core Business Domains
- Operational Support Domains
- Information Domains
- Platform Domains

It remains independent of the business logic that generated the audited activity.

---

### Architectural Principle

The Audit Domain provides an immutable historical record of significant platform activities.

It observes and records business and technical events without influencing their execution or outcome.

---

## Configuration Domain

### Purpose

The Configuration Domain manages configurable behaviour of the RPGMS platform.

It is responsible for storing, validating and maintaining system-wide configuration settings that influence platform behaviour without owning business capabilities or operational workflows.

The Configuration Domain is a Platform Domain and provides shared configuration services to other Software Domains.

---

### Responsibilities

The Configuration Domain is responsible for:

- System configuration management
- Business parameter configuration
- Feature configuration
- Configuration validation
- Configuration versioning
- Configuration history

---

### Owns

The Configuration Domain owns:

- System Configuration
- Business Parameters
- Feature Flags
- Configuration History
- Configuration Domain Events

---

### Does Not Own

The Configuration Domain does **not** own:

- Business transactions
- Business workflows
- Resident data
- Financial data
- Operational decisions

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Configuration Domain publishes Domain Events including:

- ConfigurationCreated
- ConfigurationUpdated
- ConfigurationActivated
- ConfigurationArchived

---

### Dependencies

The Configuration Domain provides configuration services to:

- Core Business Domains
- Operational Support Domains
- Information Domains
- Platform Domains

Configuration consumers remain responsible for interpreting and applying configuration according to their own business rules.

---

### Architectural Principle

The Configuration Domain owns configurable platform behaviour.

Business decisions remain the responsibility of the Software Domain that consumes the configuration.

Configuration changes influence future behaviour but do not modify historical business data.

---

# Domain Independence

Software Domains remain independently maintainable.

Domains communicate through:

- Public services
- Domain Events
- Shared contracts

Domains shall never depend upon another domain's internal implementation.

---

## Integration Domain

### Purpose

The Integration Domain manages communication between the RPGMS platform and external systems and services.

It is responsible for orchestrating external integrations, transforming data where required, handling integration failures and maintaining the lifecycle of external system interactions.

The Integration Domain is a Platform Domain and does not own business capabilities or business rules.

---

### Responsibilities

The Integration Domain is responsible for:

- External system integration
- API communication
- Data transformation
- Integration orchestration
- Integration monitoring
- Integration error handling

---

### Owns

The Integration Domain owns:

- Integration Configurations
- External Service Connectors
- Integration Requests
- Integration Responses
- Integration Domain Events

---

### Does Not Own

The Integration Domain does **not** own:

- Business workflows
- Business rules
- Resident data
- Financial data
- Operational decisions

These responsibilities belong to their respective Software Domains.

---

### Domain Events

The Integration Domain publishes Domain Events including:

- IntegrationRequested
- IntegrationSucceeded
- IntegrationFailed
- ExternalServiceUnavailable
- IntegrationRetried

---

### Dependencies

The Integration Domain provides integration services to:

- Core Business Domains
- Operational Support Domains
- Information Domains
- Platform Domains

It communicates with external platforms including communication providers, payment services, identity providers, cloud services and future third-party integrations.

---

### Architectural Principle

The Integration Domain isolates the RPGMS platform from external systems.

Business Domains request integration services without depending on the implementation details of external providers.

---

# Cross-Domain Workflows

Business workflows frequently involve multiple domains.

Examples include:

Admission

```text
Reservation
        │
        ▼
Resident
        │
        ▼
Stay
        │
        ▼
Accommodation
        │
        ▼
Finance
```

Checkout

```text
Stay
        │
        ▼
Finance
        │
        ▼
Settlement
        │
        ▼
Notification
```

The Application Layer coordinates these workflows.

Individual domains remain responsible only for their own business behaviour.

---

## Domain Architecture Summary

Software Domains provide the primary organisational structure of RPGMS.

Each domain owns one business capability.

Each domain enforces its own Business Rules.

Cross-domain workflows are coordinated rather than shared.

This architecture enables independent evolution while preserving business consistency across the application.

---

# Cross-Cutting Architectural Services

Cross-Cutting Architectural Services provide shared technical and application capabilities that support multiple Software Domains.

Unlike Software Domains, Architectural Services do not own business concepts or business behaviour.

Their purpose is to provide reusable capabilities while preserving the independence of each Software Domain.

---

## Architectural Service Principles

Every Architectural Service shall:

- Support multiple Software Domains
- Remain independent of business ownership
- Expose well-defined interfaces
- Avoid storing duplicated business information
- Derive behaviour from Domain Events where appropriate

Architectural Services shall never become owners of business concepts.

---

## Authentication Service

## Purpose

Authenticates users accessing RPGMS.

## Responsibilities

- User authentication
- Session establishment
- Identity verification
- Authentication providers

Authentication determines identity only.

It does not determine authorisation.

---

##  Authorisation Service

## Purpose

Determines whether an authenticated user is permitted to perform a requested business operation.

## Responsibilities

- Role evaluation
- Permission evaluation
- Access decisions
- Administrative authority

Business Domains rely upon Authorisation rather than implementing permission logic independently.

---

## Audit Service

## Purpose

Provides permanent accountability for significant business activity.

## Responsibilities

- Audit recording
- Audit retrieval
- Timeline generation
- Historical traceability

The Audit Service derives information from Domain Events.

It does not create business behaviour.

---

## Notification Service

## Purpose

Coordinates business communication.

## Responsibilities

- Notification generation
- Delivery scheduling
- Channel selection
- Delivery history

Notifications are generated from completed Domain Events.

Notifications never modify business state.

---

## Search Service

## Purpose

Provides unified discovery of business information.

## Responsibilities

- Search indexing
- Query execution
- Result aggregation
- Permission-aware filtering

Search does not own business information.

Search provides discovery only.

---

## Reporting Service

## Purpose

Provides operational and analytical reporting across RPGMS.

## Responsibilities

- Report generation
- Business analytics
- Trend analysis
- Operational summaries

Reporting derives information from authoritative business domains.

Reporting never becomes an independent source of business truth.

---

## Billing Engine

## Purpose

Coordinates recurring billing operations.

## Responsibilities

- Billing execution
- Billing schedules
- Charge generation
- Billing orchestration

Business pricing rules remain within the owning domains.

The Billing Engine coordinates execution.

---

## Ledger Engine

## Purpose

Maintains the authoritative financial history of RPGMS.

## Responsibilities

- Ledger posting
- Balance calculation
- Financial reconciliation
- Financial history

The Ledger Engine provides financial consistency across the application.

---

## Configuration Service

## Purpose

Provides configurable operational behaviour.

## Responsibilities

- Business defaults
- Operational configuration
- Feature configuration
- Organisational settings

Configuration influences future operations.

Configuration never rewrites historical business information.

---

## File Storage Service

## Purpose

Manages business documents and other stored files.

## Responsibilities

- Document storage
- Retrieval
- Version management
- Secure access

Business ownership of documents remains with the owning Software Domain.

---

## Integration Service

## Purpose

Coordinates communication with external systems.

## Responsibilities

- Payment providers
- Email providers
- SMS providers
- Government services
- Future third-party integrations

External integrations remain isolated from core business behaviour.

---

## Service Independence

Architectural Services remain independent of one another wherever practical.

Services communicate through:

- Public interfaces
- Domain Events
- Shared contracts

Services shall not become tightly coupled.

---

## Service Architecture Summary

Architectural Services provide reusable capabilities shared across multiple Software Domains.

They support the business without owning business behaviour.

Business knowledge remains within Software Domains.

Shared technical capabilities remain within Architectural Services.

This separation preserves modularity, maintainability and long-term scalability.

---

# Data Architecture

The Data Architecture defines how business information is represented, owned and managed within RPGMS.

It provides the architectural principles governing business entities, relationships, identity and consistency.

This chapter defines software architecture rather than database implementation.

Database technologies may evolve without changing these principles.

---

# Data Architecture Principles

Business information shall be organised according to the following principles:

- Clear ownership
- Single source of truth
- Stable identity
- Historical integrity
- Derived information where practical
- Explicit relationships
- Consistent lifecycle management

These principles apply across every Software Domain.

---

# Business Entity Ownership

Every Business Entity shall belong to exactly one Software Domain.

The owning domain is responsible for:

- Creating the entity
- Validating the entity
- Maintaining the entity
- Preserving historical integrity
- Publishing Domain Events affecting the entity

Other domains may reference the entity but shall not assume ownership.

---

# Aggregate Boundaries

Business Entities shall be organised into Aggregates.

An Aggregate represents a consistency boundary within a Software Domain.

Each Aggregate shall have one Aggregate Root responsible for maintaining the integrity of the Aggregate.

Examples include:

- Resident
- Stay
- Reservation
- Commercial Agreement

Aggregates communicate through public interfaces rather than direct internal access.

---

# Entity Identity

Every Business Entity shall possess a stable and permanent identity.

Identity shall remain unchanged throughout the lifecycle of the entity.

Identity shall never depend upon mutable business information.

Business identity supports:

- Operational references
- Reporting
- Audit
- Historical traceability

---

# Value Objects

Value Objects represent descriptive business information without independent identity.

Examples include:

- Address
- Contact Information
- Monetary Amount
- Date Range

Value Objects exist only as part of an owning Business Entity.

They shall not possess independent lifecycle or ownership.

---

# Business Relationships

Relationships between Business Entities shall remain explicit.

Relationships shall preserve:

- Referential integrity
- Historical integrity
- Business ownership

Business relationships shall remain understandable independently of implementation technology.

---

# Derived Information

Information that can be reliably calculated from authoritative business data should normally be derived rather than stored.

Examples include:

- Outstanding Balance
- Occupancy Percentage
- Available Beds
- Monthly Totals
- Dashboard Metrics

Derived information shall never become an independent source of business truth.

---

# Historical Preservation

Historical business information shall remain permanently understandable.

Changes to current business data shall not invalidate historical records.

Historical relationships shall remain intact even after operational activities have concluded.

Examples include:

- Completed Stays
- Settled Charges
- Archived Reservations
- Historical Payments

---

# Data Consistency

Consistency shall be maintained within each Aggregate.

Cross-domain consistency shall be achieved through coordinated business workflows and Domain Events.

Architectural consistency shall take precedence over implementation convenience.

---

# Data Validation

Validation responsibilities shall remain close to business ownership.

Business Domains validate business information.

Application workflows coordinate validation across multiple domains.

Presentation validates only user interaction.

Infrastructure validates only technical requirements.

---

# Data Evolution

The architecture shall support future expansion of the business model without requiring redesign of existing Business Entities.

New entities, relationships and attributes shall extend the model while preserving existing identity and historical integrity.

---

# Data Architecture Summary

The Data Architecture provides a stable representation of business information across RPGMS.

Business Entities own business knowledge.

Aggregates preserve consistency.

Value Objects describe business information.

Relationships remain explicit.

Historical truth remains permanent.

Together these principles ensure that business information remains accurate, maintainable and aligned with the Business Constitution throughout the lifetime of the application.

---
# Event Architecture

## Introduction

The RPGMS platform uses Domain Events and a cross-domain **Business Event Conceptual Model** (`BCR-008`, `BAP-002`) to communicate significant business and platform activities between Software Domains.

Each Software Domain publishes Domain Events describing changes to information that it owns.

Other Software Domains may consume these Domain Events to perform their own responsibilities while remaining independent of the publishing domain.

This event-driven architecture reduces coupling, promotes modularity, preserves historical truth, and enables Software Domains to evolve independently.

---

## Objectives

The Event Architecture is designed to:

- Reduce coupling between Software Domains.
- Provide an immutable audit trail of business history (`BCR-008`).
- Enable independent evolution of Software Domains.
- Support the Decision Support pattern (`BAP-001`) where system recommendations require operator approval.
- Maintain clear ownership of business capabilities.
- Support reliable communication across the platform.

---

## Domain Event Principles

The RPGMS platform follows these architectural principles:

- Every Domain Event has exactly one publishing Software Domain.
- A Domain Event represents something that has already happened.
- Only the owning Software Domain may publish events describing changes to its business entities.
- Software Domains consume events without assuming ownership of the originating data.
- Events communicate facts rather than commands.
- Event consumers remain responsible for their own business decisions.
- Current operational and financial state across all domains is derived from the sequence of approved Business Events (`BCR-008`).

---

## Decision Support Pattern (BAP-001)

The Event Architecture supports the **Decision Support** architectural pattern:

- Event-driven calculations and recommendations (such as rent recalculations, deposit refunds, payment allocations, or fee adjustments) are published as system recommendations.
- Final approval and posting of operational or commercial decisions rests with an authorised human operator.
- Automated events generate recommendations; operator decision events execute state changes.

---

---

## Event Ownership

Each Domain Event has a single authoritative publisher.

Only the Software Domain that owns a business capability may publish Domain Events describing changes to that capability.

Examples include:

| Software Domain | Example Domain Events |
|-----------------|----------------------|
| Reservation | ReservationCreated, ReservationConfirmed, ReservationCancelled |
| Stay | StayStarted, StayExtended, StayCompleted |
| Finance | ChargeRaised, PaymentRecorded, FinancialSettlementCompleted |
| Deposit | DepositCollected, DepositAdjusted, DepositRefundCompleted |
| Laundry | LaundryRecorded, LaundryChargeRaised |
| Internet | InternetServiceProvisioned, InternetServiceTerminated |
| Maintenance | MaintenanceRequested, MaintenanceCompleted |
| Complaints | ComplaintRegistered, ComplaintResolved |
| Notification | NotificationSent, NotificationDelivered |
| Audit | AuditRecordCreated |
| Configuration | ConfigurationUpdated |
| Integration | IntegrationSucceeded, IntegrationFailed |

No Domain Event should have multiple publishers.

---

## Event Consumers

Software Domains consume Domain Events to perform responsibilities that they own.

Receiving a Domain Event does not transfer ownership of the originating data.

Each Software Domain continues to own and manage only its own business capabilities.

Examples include:

- Finance consumes StayStarted to create financial obligations.
- Notification consumes PaymentRecorded to deliver payment confirmations.
- Audit consumes significant Domain Events to maintain an immutable audit trail.
- Reporting consumes Domain Events to update analytical information.

---

## Event Flow

A typical business lifecycle may produce the following Domain Events:

```text
Resident
        │
        ▼
ReservationCreated
        │
        ▼
ReservationConfirmed
        │
        ▼
StayStarted
        │
        ├────────────► DepositCollected
        │
        ├────────────► ChargeRaised
        │
        ├────────────► LaundryRecorded
        │
        ├────────────► MaintenanceRequested
        │
        └────────────► ComplaintRegistered
                          │
                          ▼
                 NotificationSent
                          │
                          ▼
                  AuditRecordCreated
```

Each Software Domain publishes only the Domain Events corresponding to the business capabilities that it owns.

---

## Event Processing

Software Domains process Domain Events independently.

Processing a Domain Event should:

- Respect Software Domain ownership.
- Avoid direct modification of another Software Domain's data.
- Execute only responsibilities owned by the consuming Software Domain.
- Remain independent of the internal implementation of the publishing Software Domain.

---

## Event Reliability

The RPGMS platform should provide reliable delivery of Domain Events.

Where immediate delivery is not possible:

- Events should be retained until successful processing.
- Consumers should tolerate duplicate event delivery.
- Event processing should be designed to be idempotent wherever practical.
- Temporary communication failures should not result in data loss.

---

## Event Versioning

Domain Events should evolve in a backward-compatible manner wherever practical.

Changes that are incompatible with existing consumers should result in a new event version rather than modification of existing event contracts.

This approach supports long-term platform evolution while protecting existing integrations.

---

## Event Naming

Domain Events should describe completed facts.

Examples:

- ResidentCreated
- ReservationConfirmed
- StayStarted
- ChargeRaised
- PaymentRecorded
- DepositCollected
- ComplaintResolved

Domain Events should never be named as commands.

Avoid names such as:

- CreateReservation
- UpdateResident
- GenerateBill
- SendNotification

Commands request work.

Domain Events describe completed work.

---

## Architectural Principle

Software Domains collaborate through Domain Events while maintaining independent ownership of their business capabilities.

Every Domain Event has one publisher, may have many consumers and communicates a completed fact rather than an instruction.

This architecture enables modularity, scalability and long-term maintainability of the RPGMS platform.

---

## Audit Integration

The Audit Service records significant Domain Events.

Audit information includes:

- Business Event
- Responsible User
- Date and Time
- Business Object
- Authority

Audit does not create business behaviour.

Audit records completed business behaviour.

---

## Notification Integration

Notifications derive from Domain Events.

Examples include:

- Admission Confirmation
- Payment Receipt
- Checkout Confirmation
- Complaint Status Update

Notification delivery shall not influence the success or failure of the originating business operation.

---

## Reporting Integration

Reporting derives operational and analytical information from Domain Events and authoritative business data.

Reporting shall never become an independent owner of business information.

---

## Search Integration

Search indexes business information based on completed Domain Events.

Search remains a discovery mechanism rather than a source of business truth.

---

## Event Evolution

New Domain Events may be introduced as the business architecture evolves.

Existing Domain Events should remain stable wherever practical.

Architectural evolution shall preserve compatibility with existing consuming services.

---

## Event Architecture Summary

The Event Architecture provides the communication backbone of RPGMS.

Business Domains publish Domain Events.

Architectural Services consume Domain Events.

Audit records accountability.

Notifications communicate completed activity.

Reporting derives business insight.

Search enables discovery.

This event-driven approach enables Software Domains to remain independent while supporting rich cross-domain functionality.

---

# Security Architecture

The Security Architecture defines how RPGMS protects business information, enforces authorised access and maintains accountability across the application.

Security is implemented as a cross-cutting architectural concern.

Every Software Domain relies upon the Security Architecture rather than implementing independent security mechanisms.

---

## Security Principles

The Security Architecture is governed by the following principles:

- Authenticate every user
- Authorise every business operation
- Apply least privilege
- Preserve accountability
- Protect business information
- Maintain complete auditability

Security shall remain consistent across every Software Domain.

Software Domains remain responsible for protecting the business information that they own while relying upon shared security services for authentication, authorisation and auditing.

---

## Authentication

## Purpose

Authentication establishes the identity of a user interacting with RPGMS.

Authentication answers the question:

> "Who is the user?"

### Responsibilities

The Authentication Service is responsible for:

- Identity verification
- Session establishment
- Session termination
- Authentication providers
- Session validation

Authentication establishes identity only.

It does not determine permissions.

---

## Authorisation

## Purpose

Authorisation determines whether an authenticated user may perform a requested business operation.

Authorisation answers the question:

> "Is this user permitted to perform this action?"

### Responsibilities

The Authorisation Service is responsible for:

- Role evaluation
- Permission evaluation
- Access decisions
- Business operation authorisation
- Administrative authority

Business Domains rely upon Authorisation rather than implementing permission logic independently.

---

## Role-Based Access Control

RPGMS implements security using Role-Based Access Control (RBAC).

Users are assigned one or more Roles.

Roles define the business responsibilities a user may perform.

Permissions are granted through Roles rather than directly to individual users wherever practical.

This approach simplifies administration and promotes consistent access control.

---

## Permission Evaluation

Every protected business operation shall undergo permission evaluation before execution.

Permission evaluation occurs before Business Rules are applied.

Where permission is denied:

- The business operation shall not proceed.
- No Business Event shall be published.
- No Audit Record of business activity shall be created.

Security-related audit information may still be recorded according to organisational policy.

---

## Administrative Overrides

Certain exceptional business operations may require Administrative Override.

Administrative Overrides shall:

- Require appropriate authority
- Be explicitly authorised
- Generate Domain Events
- Generate Audit Records
- Preserve historical traceability

Administrative Override does not bypass accountability.

---

## Security Boundaries

Every Software Domain shall expose only its authorised public interfaces.

Internal implementation details remain inaccessible outside the owning domain.

Security boundaries shall protect:

- Business data
- Business services
- Administrative operations
- Configuration
- Audit information

---

## Principle of Least Privilege

Users shall receive only the permissions required to perform their assigned business responsibilities.

Additional permissions shall be granted only where justified by organisational policy.

Least Privilege reduces operational risk while supporting efficient business operations.

---

## Sensitive Information

Sensitive business information shall be protected according to organisational policy.

Examples include:

- Personal identity information
- Contact information
- Financial information
- Authentication credentials
- Audit records
- Administrative configuration

Access to sensitive information shall always require appropriate authority.

Sensitive information shall be protected during storage, transmission and access according to organisational policy.

---

## Audit and Security

Security-related business operations shall remain fully auditable.

Examples include:

- User authentication
- Administrative Override
- Permission changes
- Role assignments
- Configuration changes

The Audit Domain shall preserve:

- Responsible User
- Date and Time
- Business Operation
- Authority
- Outcome

---

## External Integrations

Communication with external systems shall occur exclusively through the Integration Domain.

External integrations shall:

- authenticate securely
- protect confidential information
- validate external responses
- handle failures safely

Business Domains remain independent of external service implementations.

---

## Security Evolution

The Security Architecture shall support future enhancement without requiring redesign of existing Software Domains.

Future enhancements may include:

- Multi-factor authentication
- Single Sign-On
- External identity providers
- Advanced permission models
- Federated authentication

Security evolution shall preserve compatibility with the Business Architecture.

---

## Security Architecture Summary

The Security Architecture provides consistent protection across RPGMS.

Authentication establishes identity.

Authorisation evaluates business authority.

Roles define responsibilities.

Permissions govern operations.

Administrative Overrides remain accountable.

Audit preserves security history.

Together these principles provide a secure, maintainable and scalable security model aligned with the Business Constitution and Business Rules.

---

# Runtime & Deployment Architecture

The Deployment Architecture defines how the RPGMS platform is deployed, hosted and operated in production.

It establishes the separation between application components, infrastructure services and external platforms while supporting scalability, reliability and maintainability.

---

## Deployment Principles

The Deployment Architecture is governed by the following principles:

- Separate application logic from infrastructure.
- Keep Software Domains independent of deployment technology.
- Deploy components using managed platform services where practical.
- Support secure, reliable and repeatable deployments.
- Minimise operational complexity.
- Allow the platform to evolve without major architectural changes.

Deployment decisions shall not influence Business Architecture or Software Domain responsibilities.

---

## Deployment Model

The RPGMS platform follows a modern web application deployment model consisting of:

- Client Application
- Backend Services
- Database Platform
- External Integration Services

Each component has clearly defined responsibilities and communicates through well-defined interfaces.

---

## Client Application

The Client Application provides the user interface for the RPGMS platform.

Responsibilities include:

- User interaction
- Presentation logic
- Client-side navigation
- User experience
- Communication with backend services

The Client Application contains no authoritative business data.

Business decisions remain within the appropriate Software Domains.

---

## Backend Services

Backend Services implement the Software Domains defined by the Architecture.

Responsibilities include:

- Business logic
- Domain validation
- Business Rules
- Domain Events
- Data persistence
- Integration orchestration

Backend Services remain independent of presentation technology.

---

## Database Platform

The Database Platform provides persistent storage for the RPGMS platform.

The database:

- Stores business information.
- Preserves data integrity.
- Supports transactional consistency.
- Maintains historical information.
- Enforces data reliability.

Business ownership remains with the respective Software Domains rather than the database itself.

---

## External Services

External services extend platform capabilities without becoming part of the core business architecture.

Examples include:

- Authentication providers
- Email services
- SMS gateways
- WhatsApp services
- Payment gateways
- Cloud storage
- Monitoring platforms

All communication with external services shall occur through the Integration Domain.

---

## Deployment Environments

The RPGMS platform supports multiple deployment environments.

Typical environments include:

- Development
- Testing
- Staging
- Production

Each environment shall remain logically isolated while following the same architectural principles.

---

## Configuration Management

Deployment-specific configuration shall remain separate from application code.

Configuration includes:

- Environment variables
- Service endpoints
- Secrets
- Feature configuration
- Infrastructure settings

Configuration changes shall not require modification of Business Architecture.

---

## Scalability

The Deployment Architecture shall support future growth by allowing platform components to scale independently where practical.

Scalability may include:

- Application scaling
- Database optimisation
- Background processing
- Integration scaling
- Storage expansion

Scalability decisions shall preserve Software Domain boundaries.

---

## Reliability

The platform should support reliable operation through:

- Managed infrastructure
- Data backup
- Failure recovery
- Monitoring
- Health checking
- Error handling

Operational failures should minimise impact on business operations.

---

## Deployment Architecture Summary

The Deployment Architecture separates business capabilities from infrastructure concerns.

Software Domains remain independent of deployment technology while infrastructure services provide reliable hosting, persistence and operational support.

This separation enables the RPGMS platform to evolve without compromising its Business Architecture or Software Domain responsibilities.

---

# Technology Stack

The Technology Stack defines the primary technologies used to implement the RPGMS platform.

Technology selection is guided by the architectural principles of simplicity, maintainability, scalability and long-term sustainability.

Individual technologies may evolve over time without changing the underlying Business Architecture or Software Domain responsibilities.

---

## Technology Selection Principles

Technology decisions are guided by the following principles:

- Prefer mature and widely adopted technologies.
- Minimise operational complexity.
- Use managed platform services where appropriate.
- Separate business architecture from implementation technology.
- Prefer maintainability over unnecessary technical complexity.
- Enable future evolution with minimal architectural impact.

Technology choices support the architecture rather than define it.

---

## Application Layer

The Client Application is implemented using modern web technologies that provide a responsive, maintainable and component-based user interface.

Current technologies include:

| Technology | Responsibility |
|------------|----------------|
| React | User Interface Framework |
| TypeScript | Type Safety |
| Vite | Build System |
| Material UI | User Interface Components |
| React Router | Client-side Navigation |

These technologies implement the presentation layer only.

Business rules remain within the appropriate Software Domains.

---

## Backend Platform

The backend platform provides business logic, data persistence and integration capabilities.

Current technologies include:

| Technology | Responsibility |
|------------|----------------|
| Supabase | Backend Platform |
| PostgreSQL | Relational Database |
| Supabase Authentication | Identity Management |
| Supabase Storage | File Storage |

The backend platform implements the Software Domains defined by the Architecture.

---

## Database Technology

RPGMS uses PostgreSQL as its primary relational database.

PostgreSQL provides:

- Transactional consistency
- Relational integrity
- Structured business data
- Reliable persistence
- Long-term maintainability

The database stores business information but does not own business behaviour.

Business ownership remains within the appropriate Software Domains.

---

## User Interface Framework

The user interface follows a component-based architecture.

The UI is responsible for:

- Presentation
- Navigation
- User interaction
- Responsive layouts
- Accessibility

Business rules remain independent of the presentation layer.

---

## Development Tooling

Development tooling supports consistent engineering practices.

Current tooling includes:

| Technology | Responsibility |
|------------|----------------|
| Git | Version Control |
| GitHub | Source Code Hosting |
| Vercel | Application Deployment |
| npm | Package Management |
| ESLint | Code Quality |
| Prettier | Code Formatting |

These tools support development but are not part of the runtime architecture.

---

## AI-Assisted Development

RPGMS adopts AI-assisted software engineering as part of its development workflow.

AI tools assist with:

- Code generation
- Refactoring
- Documentation
- Architecture review
- Test generation
- Development productivity

All AI-generated changes remain subject to human review and architectural governance as defined by the project documentation.

---

## External Services

The platform integrates with selected external services where appropriate.

Examples include:

- WhatsApp messaging
- SMS providers
- Email services
- Payment gateways
- Cloud storage services

External technologies remain isolated behind the Integration Domain.

Business Domains remain independent of external implementations.

---

## Technology Evolution

The Technology Stack is expected to evolve over time.

Individual technologies may be replaced provided that:

- Business Architecture remains unchanged.
- Software Domain responsibilities remain unchanged.
- Public interfaces remain compatible where practical.
- Business Rules remain unaffected.

Technology evolution should minimise disruption to business capabilities.

---

## Technology Stack Summary

The Technology Stack provides the implementation foundation for the RPGMS platform.

Technology choices support the Business Architecture, Software Domains and Architectural Principles while remaining replaceable as the platform evolves.

The architecture defines the system.

The technology implements it.

---

# User Interface Architecture

The User Interface Architecture defines how users interact with RPGMS.

It establishes a consistent approach for organising screens, navigation, user workflows and presentation components.

The User Interface presents business information without containing business logic.

Business behaviour remains within the Domain Layer.

---

## User Interface Principles

The User Interface shall:

- Present business information clearly
- Support efficient business workflows
- Remain consistent across all modules
- Delegate business operations to the Application Layer
- Avoid implementing business rules
- Remain responsive and accessible

The User Interface is responsible for presentation, not business decision-making.

---

## Application Layout

RPGMS provides a consistent application shell.

The application layout consists of:

- Application Header
- Navigation Sidebar
- Main Workspace
- Contextual Actions
- Notifications
- Dialogs

Every module shall operate within the same application layout.

---

## Navigation Architecture

Navigation provides access to the major Software Domains.

Primary navigation includes:

- Dashboard
- Accommodation
- Residents
- Reservations
- Finance
- Maintenance
- Complaints
- Reports
- Settings

Navigation reflects business capabilities rather than technical implementation.

---

## Page Architecture

Every major feature is represented by a dedicated page.

A page is responsible for:

- Loading business information
- Coordinating user interactions
- Displaying appropriate workspaces
- Delegating business operations

Pages do not implement business rules.

---

## Workspace Architecture

Complex business activities are implemented using Workspaces.

Examples include:

- Admission Workspace
- Stay Workspace
- Checkout Workspace
- Reservation Workspace

A Workspace may combine information from multiple Software Domains while presenting a unified business workflow.

Business coordination occurs through the Application Layer.

---

## Component Architecture

User Interface components shall be organised according to responsibility.

Component categories include:

- Layout Components
- Navigation Components
- Presentation Components
- Form Components
- Dialog Components
- Shared Components

Components remain reusable wherever practical.

---

## View Models

The User Interface presents business information through View Models.

View Models adapt domain information into forms suitable for presentation.

View Models:

- Simplify rendering
- Combine related information
- Avoid exposing internal domain structures

View Models do not own business behaviour.

---

## State Management

User Interface state shall remain local wherever practical.

Examples include:

- Selected tabs
- Dialog visibility
- Form progress
- User preferences
- Temporary filters

Business state remains within the Application and Domain Layers.

The User Interface shall not become the authoritative source of business information.

---

## Forms

Forms provide controlled interaction with business information.

Forms are responsible for:

- Data entry
- Input validation
- User guidance
- Error presentation

Business validation remains the responsibility of the Domain Layer.

---

## Shared Design System

All User Interface elements shall follow the shared Design System.

The Design System provides consistency for:

- Typography
- Colours
- Icons
- Spacing
- Layout
- Buttons
- Forms
- Tables
- Cards
- Dialogs

Shared design standards promote usability and maintainability.

---

## Responsive Design

The User Interface shall adapt appropriately to supported screen sizes.

Responsive behaviour shall preserve:

- Business workflow
- Readability
- Accessibility
- Operational efficiency

Responsive design shall not change business behaviour.

---

## Accessibility

The User Interface shall support accessible interaction wherever practical.

Accessibility considerations include:

- Keyboard navigation
- Screen reader compatibility
- Colour contrast
- Focus management
- Consistent navigation
- Clear visual hierarchy

Accessibility supports efficient operation for all authorised users.

---

## Error Presentation

Errors shall be communicated clearly and consistently.

The User Interface shall distinguish between:

- Validation errors
- Business rule violations
- Permission failures
- System failures

Users shall receive sufficient information to understand the outcome without exposing internal implementation details.

---

## User Interface Evolution

The User Interface shall support future enhancement without requiring redesign of the underlying Software Domains.

Future improvements may include:

- Additional workflows
- Alternative layouts
- Mobile optimisation
- Advanced dashboards
- Personalised workspaces

Presentation may evolve independently while preserving business consistency.

---

## User Interface Architecture Summary

The User Interface provides a consistent presentation layer for RPGMS.

Pages organise business capabilities.

Workspaces support complex workflows.

Components remain reusable.

View Models adapt business information for presentation.

Business logic remains outside the User Interface.

This architecture promotes clarity, consistency and long-term maintainability while supporting efficient day-to-day hostel operations.

---

# Future Evolution

The architecture of RPGMS is designed to support continuous business and technical evolution while preserving architectural consistency.

Future enhancements shall extend the existing architecture rather than replace it.

Architectural evolution shall remain guided by the Business Constitution and Business Rules.

---

## Evolution Principles

Future development shall adhere to the following principles:

- Preserve business architecture
- Extend rather than replace
- Maintain backward compatibility where practical
- Protect historical integrity
- Minimise architectural disruption
- Encourage modular growth

Business requirements drive architectural evolution.

Technology choices support architectural objectives.

---

## Business Expansion

The architecture supports the addition of new business capabilities through new Software Domains.

Examples include:

- Visitor Management
- Inventory Management
- Housekeeping
- Vendor Management
- Staff Management
- Asset Management
- Coworking Management
- Multi-Property Management

Each new capability shall follow the established Domain Architecture.

---

## Workflow Expansion

Business workflows may become more sophisticated over time.

Future workflows may include:

- Digital admissions
- Online reservations
- Automated renewals
- Digital agreements
- Self-service checkout
- Maintenance scheduling
- Approval workflows

Workflow expansion shall preserve existing domain responsibilities.

---

## Technology Independence

The architecture is intentionally independent of specific implementation technologies.

Examples of replaceable technologies include:

- Front-end framework
- Database platform
- Authentication provider
- Notification provider
- Storage provider
- Reporting tools

Technology may evolve without requiring changes to the Business Constitution or Business Rules.

---

## Integration Readiness

RPGMS shall support integration with external systems through well-defined interfaces.

Potential integrations include:

- Payment gateways
- Government identity services
- Messaging platforms
- Accounting software
- Access control systems
- IoT devices
- Business intelligence platforms

Integrations shall remain isolated from core business logic.

---

## Scalability

The architecture supports growth in:

- Number of residents
- Number of properties
- Number of users
- Business transactions
- Reporting requirements
- Operational complexity

Scalability shall be achieved through modular architecture rather than architectural redesign.

---

## Multi-Property Readiness

The architecture supports future expansion from a single property to multiple properties.

Examples include:

- Shared resident management
- Property-specific accommodation
- Centralised reporting
- Property-level configuration
- Cross-property administration

Business ownership shall remain clearly defined regardless of organisational scale.

---

## Automation Readiness

The architecture supports increasing levels of business automation.

Examples include:

- Scheduled billing
- Automated reminders
- Recurring maintenance
- Occupancy monitoring
- Financial reconciliation
- Business notifications

Automation coordinates business operations but does not replace Business Rules.

---

## Artificial Intelligence Readiness

The architecture is designed to support responsible use of Artificial Intelligence.

Potential AI capabilities include:

- Operational insights
- Predictive occupancy analysis
- Revenue forecasting
- Complaint categorisation
- Maintenance prioritisation
- Document assistance
- Administrative recommendations

AI shall assist business operations.

AI shall not become the authoritative source of business decisions or business data.

All AI-generated outputs remain subject to human review where business judgement is required.

---

## Documentation Evolution

Architectural documentation shall evolve together with the software.

Changes to the Business Constitution or Business Rules shall be reflected in the corresponding architectural documentation.

Documentation shall remain synchronised with implementation throughout the lifetime of the project.

---

## Future Evolution Summary

The architecture of RPGMS is designed for long-term sustainability.

Business growth, technological change and organisational expansion are expected.

The architecture provides stable foundations while enabling controlled evolution.

Business principles remain constant.

Technology remains adaptable.

This approach ensures that RPGMS can continue to evolve without compromising architectural integrity.

---

# Documentation Architecture

The Documentation Architecture defines how architectural knowledge is organised, maintained and governed within RPGMS.

Documentation is treated as a first-class architectural asset.

Every significant architectural and business decision shall be represented within the appropriate project documentation.

---

## Documentation Principles

Project documentation shall:

- Be authoritative
- Be consistent
- Be traceable
- Be maintainable
- Evolve with the software
- Avoid duplication

Documentation shall describe architecture rather than duplicate implementation.

---

## Documentation Hierarchy

Project documentation follows a hierarchical structure.

```text
Business Constitution
        │
        ▼
Business Rules
        │
        ▼
Software Architecture
        │
        ▼
Domain Documentation
        │
        ▼
Implementation Documentation
        │
        ▼
Source Code
```

Each layer derives guidance from the layer above.

Lower layers shall not contradict higher layers.

---

# Documentation Responsibilities

Each document has a clearly defined responsibility.

| Document | Primary Responsibility |
|----------|------------------------|
| BUSINESS_CONSTITUTION.md| Business concepts, terminology and organisational model |
| BUSINESS_RULES.md | Business policies, constraints and operational rules |
| ARCHITECTURE.md | Software architecture and architectural principles |
| DOMAIN_MODEL.md  | Business entities and relationships |
| UI_GUIDELINES.md | User interface standards and design principles |
| ROADMAP.md | Planned business and technical evolution |
| CHANGELOG.md | Historical record of significant changes |
| PROJECT_RULES.md | Project governance and engineering standards |
| AI_* documents | AI governance, workflow and collaboration guidance |

Each document owns its subject area.

Responsibilities shall not overlap unnecessarily.

---

## Traceability

Architectural decisions shall be traceable through the documentation hierarchy.

For example:

```text
Business Constitution
        │
Defines:
Resident

        ▼

Business Rules
        │
Defines:
Resident lifecycle

        ▼

Architecture
        │
Defines:
Resident Domain

        ▼

Implementation
        │
Implements:
Resident Module

        ▼

Source Code
```

Every implementation decision should be traceable to an architectural decision.

Every architectural decision should be traceable to a business decision.

---

## Documentation Consistency

When significant business or architectural changes occur:

- The relevant documentation shall be updated.
- Related documents shall be reviewed for consistency.
- Contradictory information shall be resolved before implementation is considered complete.

Documentation and implementation shall evolve together.

---

## Domain Documentation

As the application grows, individual Software Domains may maintain their own supporting documentation.

Examples include:

- Resident Domain
- Stay Domain
- Finance Domain
- Reservation Domain

Domain documentation shall remain subordinate to this Architecture document.

---

## Decision Records

Significant architectural decisions shall be recorded in a permanent decision log.

Decision records should include:

- Context
- Decision
- Rationale
- Consequences

Decision records preserve architectural history and support future maintenance.

---

## Documentation Ownership

Business documentation is owned by the business architecture.

Architectural documentation is owned by the software architecture.

Implementation documentation is owned by the engineering process.

Ownership ensures accountability for maintaining each document.

---

## Documentation Review

Documentation shall be reviewed whenever:

- New Software Domains are introduced
- Business Rules change
- Architectural principles evolve
- Significant workflows are redesigned
- Major implementation milestones are completed

Documentation review is an integral part of architectural governance.

---

## Documentation Evolution

Documentation shall evolve incrementally.

Existing documentation should be extended wherever practical rather than replaced.

Historical versions provide an important record of architectural evolution.

---

## Documentation Architecture Summary

Documentation forms the architectural memory of RPGMS.

Each document has a defined purpose.

Each document supports the layer above and below it.

Traceability connects business concepts, architectural decisions and implementation.

This structured approach ensures that knowledge remains organised, consistent and maintainable throughout the lifetime of the project.

---

# Architectural Governance

Architectural Governance defines how the software architecture of RPGMS is maintained, evolved and protected throughout the lifetime of the project.

The purpose of governance is not to restrict development, but to ensure that architectural consistency is preserved as the application grows.

Every significant architectural decision shall remain aligned with the Business Constitution and Business Rules.

---

## Governance Principles

Architectural governance is guided by the following principles:

- Business before implementation
- Consistency over convenience
- Simplicity over unnecessary complexity
- Evolution rather than replacement
- Clear ownership
- Long-term maintainability

Architectural decisions shall support sustainable software development.

---

## Architectural Compliance

All implementation shall comply with the architectural principles defined in this document.

Compliance includes:

- Respecting Software Domain boundaries
- Preserving Layered Architecture
- Maintaining clear ownership
- Following documented Business Rules
- Supporting historical integrity
- Using Architectural Services appropriately

Architectural compliance is considered part of the Definition of Done for significant development work.

---

## Architectural Decision-Making

Significant architectural decisions shall be evaluated against the following questions:

1. Does the change support the Business Constitution?

2. Does the change comply with Business Rules?

3. Does the change preserve Domain ownership?

4. Does the change maintain Layered Architecture?

5. Does the change simplify or unnecessarily complicate the architecture?

6. Does the change preserve future extensibility?

Only decisions that satisfy these principles should become part of the permanent architecture.

---

## Architectural Exceptions

Occasionally, implementation constraints may require deviations from the preferred architecture.

Architectural exceptions shall:

- Be explicitly documented
- Include a clear justification
- Identify associated risks
- Describe any temporary measures
- Include a plan for future resolution where appropriate

Architectural exceptions shall remain rare.

Temporary implementation shortcuts shall not become permanent architecture without formal review.

---

## Change Management

Architecture evolves through controlled change.

When significant architectural changes are introduced:

- The relevant documentation shall be updated.
- Related documentation shall be reviewed.
- Business impact shall be evaluated.
- Existing implementations shall remain consistent wherever practical.

Architectural change shall be deliberate rather than incidental.

---

## Architectural Reviews

Major development milestones should include an architectural review.

Reviews should confirm:

- Continued compliance with Business Constitution
- Continued compliance with Business Rules
- Correct Domain ownership
- Appropriate use of Architectural Services
- Documentation consistency
- Long-term maintainability

Architectural review supports continuous improvement rather than fault-finding.

---

## Documentation Authority

The documentation hierarchy defines the authoritative source for architectural decisions.

The order of authority is:

1. BUSINESS_CONSTITUTION.md
2. BUSINESS_RULES.md
3. DOMAIN_MODEL.md
4. ARCHITECTURE.md
5. Domain Documentation
6. Implementation Documentation
7. Source Code

Where inconsistencies exist, the higher-level document takes precedence.

Implementation shall be corrected to align with the governing documentation.

---

## Continuous Improvement

Architecture is expected to evolve throughout the lifetime of RPGMS.

Continuous improvement shall:

- Preserve architectural consistency
- Improve maintainability
- Simplify implementation where possible
- Support future business growth

Architectural evolution is encouraged when guided by documented principles.

---

## Architectural Vision

The long-term vision of RPGMS is to provide a software platform that faithfully represents the business it serves.

The software architecture exists to support business operations rather than dictate them.

Business concepts remain stable.

Technology remains adaptable.

Architecture provides the bridge between the two.

---

# Conclusion

The architecture of RPGMS is founded upon three complementary layers of governance:

Business Constitution defines the business.

Business Rules define business behaviour.

Software Architecture defines how the software implements the business.

Together they establish a coherent, maintainable and extensible foundation for the continued evolution of RPGMS.

This document serves as the governing architectural reference for the software implementation of RPGMS and shall guide future development, architectural decisions and long-term maintenance.

---

