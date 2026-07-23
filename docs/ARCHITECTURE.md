# RPGMS 2.0 – Architecture

**Version:** 2.0  
**Status:** Active  
**Last Updated:** 21 July 2026

---

# Purpose

This document defines the software architecture of RPGMS 2.0.

Its purpose is to ensure that the application remains simple, consistent, maintainable, scalable, and aligned with the business architecture throughout its lifetime.

This document describes **how the system is organized** and **how its major components relate to one another**.

Major architectural decisions are formally recorded in `DECISIONS.md`.

This document describes the current architecture, while `DECISIONS.md` records the rationale behind significant architectural changes over time.

It intentionally does **not** define:

- Business rules
- Business workflows
- Domain specifications
- Implementation details
- Product roadmap

Those responsibilities belong to their respective governance documents.

---

# Architectural Principles

The following principles guide every architectural decision made within RPGMS.

## 1. Business First

The application is organized around business capabilities rather than technical layers.

Examples include:

- Dashboard
- Accommodation
- Residents
- Stay
- Finance
- Billing
- Compliance
- Reporting
- Settings

Each business capability owns its own implementation.

---

## 2. Keep It Simple

Architecture should remain as simple as possible.

Avoid unnecessary abstractions.

Avoid introducing complexity for hypothetical future requirements.

New architectural patterns should only be introduced when they solve a demonstrated business problem.

---

## 3. Feature First

Business functionality belongs inside Feature modules.

Reusable functionality belongs inside Shared modules.

Features should remain cohesive and self-contained.

---

## 4. Single Responsibility

Every folder, module, and document should have one clearly defined responsibility.

If a responsibility cannot be described in a single sentence, it should be reconsidered.

---

## 5. Derive Before Store

Whenever information can be calculated from existing data, it should be derived rather than stored.

Examples include:

- Flat Capacity
- Bed IDs
- Outstanding Balances
- Running Totals
- Occupancy Counts

Derived data reduces duplication and improves consistency.

---

## 6. Explicit Domain Ownership

Every business entity has exactly one owning domain.

Other domains may reference that entity but must not duplicate its business logic or ownership.

---

## 7. Single Source of Truth

Every business fact has exactly one authoritative source.

Examples include:

- Resident identity belongs to the Resident domain.
- Operational residency belongs to the Stay domain.
- Accommodation hierarchy belongs to the Accommodation domain.
- Financial history belongs to the Finance domain.
- Ledger entries are the single source of truth for all financial reporting.

Information may be derived or referenced by other domains but must never be duplicated as an independent source of truth.

# Business Architecture

The business architecture defines the fundamental structure of RPGMS.

Business architecture changes very rarely and provides the foundation upon which every feature is built.

---

## Business Domains

The application is organised into independent business domains.

Current domains include:

- Dashboard
- Accommodation
- Residents
- Stay
- Finance
- Billing
- Compliance
- Door IDs
- Complaints
- Reporting
- Settings

The Stay Workspace does not own business entities. It orchestrates interactions between the owning domains.

Each domain owns its own business rules, data model, services, components, and user interface.

---
## Operational Architecture

The operational workflows of RPGMS 2.0 are documented separately in:

- docs/STAY_WORKSPACE.md

This document defines the Current Stay as the operational unit of the system and describes how Accommodation, Residents, Finance and the Stay Workspace interact to support day-to-day hostel operations.

## Application Layer

RPGMS 2.0 separates Presentation from Domain logic through an Application Layer.

The Application Layer is responsible for coordinating multiple business domains required to fulfill a user workflow. It contains orchestration logic but does not own business rules.

Responsibilities include:

- Coordinating multiple domain services.
- Loading data required by a workspace.
- Preparing ViewModels for presentation components.
- Invoking domain operations.
- Managing workflow state for a page.

The Application Layer does NOT:

- Implement business rules.
- Perform financial calculations.
- Manage persistence.
- Replace domain services.

Presentation components communicate only with the Application Layer and never directly with domain services or repositories.

### Coordinator Responsibilities

Each workspace may define a **Coordinator** as part of its Application Layer.

The Coordinator is responsible for orchestrating the workflow of a single workspace. It coordinates interactions between multiple business domains and prepares data for presentation, while remaining independent of UI implementation details.

#### Responsibilities

A Coordinator is responsible for:

- Coordinating interactions between multiple domain services.
- Loading and aggregating data required by the workspace.
- Preparing a ViewModel for presentation components.
- Invoking domain operations in response to user actions.
- Managing page-level workflow and state.
- Handling loading, success, and error states for the workspace.

#### Non-Responsibilities

A Coordinator must **not**:

- Contain business rules.
- Perform financial or billing calculations.
- Duplicate logic owned by domain services.
- Access the database or Supabase directly.
- Know about Material UI, page layout, or presentation details.
- Render UI components.
- Replace domain services or repositories.

The Coordinator serves as an orchestration layer between the Presentation Layer and the Domain Layer, ensuring that presentation components remain simple, reusable, and focused solely on rendering data.

Presentation Layer
        │
        ▼
Application Layer
(Coordinator + ViewModel)
        │
        ▼
Domain Layer
        │
        ▼
Infrastructure Layer

StayWorkspacePage
        │
        ▼
StayWorkspaceCoordinator
        │
        ├── Load Stay
        ├── Load Resident
        ├── Load Accommodation
        ├── Load Financial Summary
        ├── Load Timeline
        └── Prepare ViewModel
        │
        ▼
StayWorkspaceViewModel
        │
        ▼
StayHeader
QuickActions
StaySummaryCard
FinancialSummaryCard
TimelinePanel
SupportingInformationPanel

Note: The Coordinator orchestrates workflows across multiple business domains but does not own business rules. Business rules remain within their respective domain services.

## Domain Ownership

Each business entity has one and only one owning domain.

| Business Entity | Owning Domain |
|-----------------|---------------|
| Resident | Resident |
| Stay | Stay |
| Flat | Accommodation |
| Area | Accommodation |
| Bed | Accommodation |
| Ledger | Finance |
| Payment | Finance |
| Billing Cycle | Billing |
| Door ID | Door IDs |
| Complaint | Complaints |

Business entities may be referenced by other domains, but ownership always remains with the originating domain.

---

## Resident and Stay Architecture

Resident and Stay represent two distinct business concepts.

A **Resident** represents a person.

A **Stay** represents one continuous period of accommodation.

A Resident may have multiple Stays throughout their lifetime.

Each Stay owns its own:

- Accommodation
- Commercial Terms
- Contract
- Billing
- Ledger
- Compliance
- Door ID
- Lifecycle

Resident identity remains permanent regardless of the number of Stays.

---

## Accommodation Architecture

Accommodation follows the physical hierarchy of the property.

```text
Property
    ↓
Flat
    ↓
Area
    ↓
Bed
```

Areas describe the internal layout of a Flat.

Beds belong to an Area.

Capacity is always derived from the generated beds.

Accommodation is the foundation for occupancy management throughout RPGMS.

---

# Software Architecture

The software architecture defines how the application is organised internally while supporting the business architecture.

Business architecture determines **what** the system does.

Software architecture determines **how** the system is organised to deliver those capabilities.

---

## Repository Structure

The repository contains a single React application.

```text
RPGMS-2.0/

src/
public/
docs/
prompts/

README.md
PROJECT_RULES.md
AI_CONTEXT.md
AI_INSTRUCTIONS.md
ROADMAP.md
CHANGELOG.md
SESSION.md
NEXT_TASK.md
```

There is only one project root.

Documentation, prompts, and application source are maintained separately.

---

## Source Structure

```text
src/

app/
assets/
components/
constants/
features/
services/
theme/
types/
utils/

main.tsx
```

The top-level structure is intentionally small and stable.

New top-level folders should only be introduced when they solve a genuine architectural problem.

---

## Layer Responsibilities

| Layer | Responsibility |
|--------|----------------|
| app | Application bootstrap, routing, providers |
| assets | Images, fonts, icons, and other static assets |
| components | Shared reusable UI components |
| constants | Application-wide constants |
| features | Business domains and feature modules |
| services | Shared infrastructure services |
| theme | Material UI theme and design tokens |
| types | Shared application types |
| utils | Pure reusable utility functions |

Business-specific components, types, services, hooks, and utilities belong within their owning feature.

---

## Feature Module Structure

Each feature module owns its complete implementation.

A typical feature may contain:

```text
feature/

components/
hooks/
pages/
services/
types/
utils/
validation/
```

Not every feature requires every folder.

Only introduce folders when they provide clear organisational value.

---

# Dependency Rules

Dependencies should always flow inward toward the business domains.

Business modules must remain independent of one another wherever practical.

```text
main.tsx
    ↓
app
    ↓
features
    ↓
shared components / shared services
    ↓
shared utilities
```

Lower layers must never depend on higher layers.

Shared infrastructure must never depend upon business features.

Business features should communicate through well-defined interfaces rather than implementation details.

---

## Dependency Principles

The following rules govern all dependencies within the application.

### Features are Independent

Business features should not directly depend on implementation details belonging to another feature.

Cross-feature communication should occur only through shared models, public interfaces, or shared services.

---

### Shared Modules are Generic

Shared modules must remain business agnostic.

They may be used by any feature but must never contain feature-specific logic.

Examples include:

- Generic UI components
- Formatting utilities
- Validation helpers
- Common TypeScript types
- Infrastructure services

---

### Business Logic Stays with the Domain

Business logic always belongs to the feature that owns the business capability.

For example:

- Accommodation calculations belong to Accommodation.
- Billing calculations belong to Billing.
- Financial posting belongs to Finance.
- Resident validation belongs to Resident.
- Stay lifecycle management belongs to Stay.

Business logic must never be duplicated across features.

---

### UI Never Owns Business Logic

User interface components are responsible only for:

- Presentation
- User interaction
- Validation
- Orchestration
- Invoking business services

UI components must never contain duplicated business calculations.

Business rules should always execute within reusable utilities or domain services.

---

# Architectural Boundaries

Architectural boundaries protect the separation of responsibilities across the application.

The following boundaries are considered mandatory.

## Resident Boundary

The Resident domain owns permanent identity information.

Examples include:

- Resident Code
- Personal Details
- Contact Information
- Identity Documents

Resident data persists throughout the lifetime of the person.

---

## Stay Boundary

The Stay domain owns operational residency.

Each Stay owns:

- Accommodation
- Contract
- Commercial Terms
- Billing
- Ledger Association
- Notice
- Checkout
- Lifecycle

Readmission creates a new Stay.

Existing Stay records are never rewritten.

---

## Finance Boundary

The Finance domain owns all financial transactions.

Finance is responsible for:

- Ledger Entries
- Payments
- Deposits
- Refunds
- Outstanding Balances

Balances are always derived from ledger entries.

---

## Accommodation Boundary

Accommodation owns the physical layout of the property.

It is responsible for:

- Flats
- Areas
- Beds
- Occupancy

Accommodation does not own residents, contracts, or finance.

---

# Documentation Architecture

Project documentation is organised so that every document has a single, clearly defined responsibility.

Together, the documentation provides complete governance for the application without unnecessary duplication.

---

## Documentation Hierarchy

| Document | Responsibility |
|----------|----------------|
| README.md | Project overview and setup |
| PROJECT_RULES.md | Engineering and project rules |
| AI_CONTEXT.md | Project context for AI assistants |
| AI_INSTRUCTIONS.md | AI implementation guidelines |
| ARCHITECTURE.md | Overall software architecture |
| BUSINESS_RULES.md | Business policies and operational rules |
| DATA_MODEL.md | Logical business data model |
| DECISIONS.md | Architecture Decision Records (ADRs) |
| MODULE_STATUS.md | Module implementation status |
| ROADMAP.md | Product roadmap |
| BACKLOG.md | Deferred features |
| CHANGELOG.md | Project history |
| SESSION.md | Current development session |
| NEXT_TASK.md | Immediate implementation plan |

Each document owns its subject area.

Responsibilities should never overlap unnecessarily.

---

## Specification Documents

Major business domains are documented independently.

Examples include:

- Accommodation Specification
- Resident Specification
- Stay Specification
- Finance Specification
- Billing Specification
- Electricity Specification

These specifications describe business workflows and implementation details for their respective domains.

Architecture documentation should reference these specifications rather than duplicate them.

---

## Architecture Decision Records

Major architectural decisions must be recorded in:

```text
docs/DECISIONS.md
```

Every Architecture Decision Record (ADR) must capture:

- The problem being solved
- The available options
- The selected approach
- The rationale
- The consequences

Architectural changes must always be accompanied by a corresponding ADR.

---

# Architectural Governance

The architecture exists to maintain long-term consistency across the project.

Architectural decisions should prioritise:

- Simplicity
- Maintainability
- Predictability
- Business alignment
- Ease of onboarding
- Low operational complexity

---

## Stability Rules

The following elements are considered architecturally stable and should not change without an approved ADR.

- Repository structure
- Top-level `src` folders
- Domain ownership
- Dependency direction
- Business architecture
- Resident–Stay separation
- Accommodation hierarchy
- Ledger architecture

Changes affecting these areas require explicit architectural review.

---

## Evolution Rules

Business features are expected to evolve over time.

Individual feature modules may:

- Add new components
- Introduce additional services
- Create new utilities
- Expand validation
- Improve user experience

These internal improvements must not violate the architectural principles defined in this document.

---

# Guiding Principle

The primary objective of the architecture is clarity over cleverness.

Every architectural decision should make the system easier to understand, easier to maintain, and easier to extend.

When multiple solutions are possible, prefer the one that is:

- Simpler
- More explicit
- Easier to maintain
- Better aligned with the business domain

Architecture should enable rapid development without compromising long-term quality.

---
## Architectural Mindset

Architecture exists to make future development easier, not harder.

When implementing new features, developers should prefer extending the existing architecture over introducing new architectural patterns.

Consistency is generally more valuable than novelty.

# Important

Every developer and every AI assistant working on RPGMS 2.0 must read this document before making architectural or structural changes.

Implementation should always follow the established business architecture.

If an implementation requires changes to the architecture, the change must first be documented in `DECISIONS.md` before development proceeds.

---

# Finance Module Architecture

The Finance module follows a layered architecture based on Domain-Driven Design (DDD) principles.

```
UI
 │
 ▼
Application Services
 │
 ▼
Domain
 │
 ▼
Repository Interface
 ▲
 │
Infrastructure
```

## Domain Layer

Location:

```
src/features/finance/domain/
```

Contains:

- Entities
- Value Objects
- Domain Rules
- Repository Interfaces

The Domain contains all business knowledge and is completely independent of:

- React
- UI
- localStorage
- Supabase
- Infrastructure
- Application Services

## Application Layer

Location:

```
src/features/finance/services/
```

Application Services coordinate use cases.

Responsibilities include:

- validating requests
- orchestrating workflows
- invoking Domain Rules
- interacting with the FinanceRepository
- coordinating Timeline and Reporting

Application Services must not implement accounting rules or business calculations.

## Infrastructure Layer

Location:

```
src/features/finance/infrastructure/
```

Current implementation:

- InMemoryFinanceRepository

The Infrastructure layer implements the FinanceRepository interface and encapsulates persistence details.

This design allows future migration to Supabase by replacing the repository implementation without affecting the Domain or Application layers.

## Dependency Direction

Dependencies always flow inward.

```
UI
    ↓
Application
    ↓
Domain
    ↑
Repository Interface
    ↑
Infrastructure
```

The Domain must never depend on the Application, Infrastructure, UI, or storage technologies.

## Resident Financial Workspace

The **Resident Financial Workspace** is the primary operational interface for all resident-specific financial activities.

It provides a single resident-centric workspace from which all financial workflows originate, including:

* Generate Monthly Rent
* Add Laundry Charges
* Add Electricity Charges
* Receive Payments
* View Resident Ledger
* Checkout & Settlement

The workspace contains no business logic.

All financial data, balances, and calculations are delegated to the Finance Application Layer through the existing `useStayFinance` hook, preserving the separation between Presentation, Application, Domain, and Infrastructure layers.

This architecture ensures that future workflow implementations can be added without changing the overall application structure, while maintaining the Resident Financial Workspace as the single source of interaction for resident financial operations.
