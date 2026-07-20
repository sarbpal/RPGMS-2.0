# ARCHITECTURE DECISIONS

**Version:** 2.0  
**Status:** Active

---

## Purpose

This document records the significant architectural decisions that shape RPGMS.

Architecture Decision Records (ADRs) document long-term decisions that affect the business architecture, system design, engineering practices, or project direction.

The purpose of an ADR is to explain:

- What decision was made.
- Why the decision was made.
- The consequences of the decision.
- Whether the decision remains current.

This document records permanent architectural knowledge and should not be used as a changelog.

---

## Decision Lifecycle

Each Architecture Decision Record (ADR) shall have one of the following statuses:

| Status | Meaning |
|---------|---------|
| Proposed | Under discussion and not yet adopted. |
| Accepted | Approved and part of the current architecture. |
| Superseded | Replaced by a newer architectural decision. |
| Deprecated | Retained for historical reference but no longer recommended. |

Accepted ADRs form part of the permanent architectural history of RPGMS.

---

## ADR Categories

Architecture decisions are grouped into the following categories:

- Business Architecture
- Financial Architecture
- Application Architecture
- Engineering Practices
- Project Governance

---

# Business Architecture

---

## ADR-001 — Resident and Stay are Separate Business Entities

**Status:** Accepted

### Context

A person may stay at the property multiple times over several years.

Each stay has its own:

- Bed allocation
- Financial history
- Compliance
- Door ID
- Dates
- Operational events

Treating a Resident as synonymous with a Stay would mix permanent identity with temporary occupancy.

### Decision

The system separates the concepts of **Resident** and **Stay**.

- **Resident** represents a person.
- **Stay** represents one continuous period of accommodation.

A Resident may therefore have multiple independent Stay records throughout their lifetime.

### Consequences

- Resident history is preserved permanently.
- Returning residents do not require duplicate profiles.
- Each Stay maintains an independent financial and operational history.
- Future analytics become significantly simpler.
- The business model reflects real-world operations.

---

## ADR-002 — Stay is the Operational Center of the System

**Status:** Accepted

### Context

Operational activities such as accommodation, billing, compliance, complaints, and access control all occur during a specific Stay rather than against the Resident directly.

### Decision

The **Stay** entity is the central operational entity within RPGMS.

Business domains including Accommodation, Finance, Billing, Compliance, Door IDs, and Complaints are associated with a Stay rather than directly with a Resident.

### Consequences

- Clear ownership of operational data.
- Simplified business relationships.
- Better lifecycle management.
- Easier future expansion of business modules.
- Strong separation between identity and operations.

---

## ADR-003 — Accommodation Hierarchy is Property → Flat → Area → Bed

**Status:** Accepted

### Context

Beds alone do not adequately represent the physical layout of a hostel.

Areas such as Bedrooms, Halls, and Small Bedrooms provide meaningful structure for residents and administrators.

### Decision

Accommodation shall follow the hierarchy:

**Property → Flat → Area → Bed**

Beds always belong to an Area.

Areas always belong to a Flat.

### Consequences

- Flexible flat layouts.
- Support for different room configurations.
- Consistent bed naming.
- Improved occupancy reporting.
- Scalable accommodation model.

---

## ADR-004 — Ledger is the Single Source of Truth for Financial History

**Status:** Accepted

### Context

Financial information is one of the most critical assets of the system.

Maintaining balances in multiple places creates opportunities for inconsistencies, reconciliation issues, and data corruption.

### Decision

The **Ledger** shall be the single source of truth for all financial transactions.

Every financial event shall result in one or more immutable ledger entries.

Balances, dues, and financial summaries shall always be calculated from the Ledger rather than stored independently.

### Consequences

- Complete financial audit trail.
- Elimination of duplicate financial data.
- Simplified reconciliation.
- Reliable financial reporting.
- Future accounting features become easier to implement.

---

## ADR-005 — Business Rules are Independent of Implementation

**Status:** Accepted

### Context

Business rules should remain valid regardless of the programming language, framework, or database used by the application.

Embedding implementation details into business documentation makes long-term maintenance difficult.

### Decision

Business Rules shall describe **what** the business requires rather than **how** the software implements those requirements.

Implementation details belong within technical documentation and source code.

### Consequences

- Business documentation remains technology independent.
- Easier migration to future technologies.
- Clear separation between business and engineering concerns.
- Improved maintainability of documentation.

---

## ADR-006 — Specifications Define Business Behaviour

**Status:** Accepted

### Context

As the project grows, business logic becomes too large to document solely within Business Rules or Data Model documents.

Each major domain requires a dedicated specification describing its workflows, lifecycle, validations, and user interactions.

### Decision

Every major business domain shall have its own Specification document.

Specifications define:

- Business workflows
- Lifecycle states
- Validation rules
- User interactions
- Operational behaviour
- Future extensibility

Business Rules define principles, while Specifications define behaviour.

### Consequences

- Better organised documentation.
- Clear ownership of business domains.
- Easier onboarding for future developers.
- Scalable documentation structure for long-term development.

---

# Application Architecture

---

## ADR-007 — Feature-First Project Structure

**Status:** Accepted

### Context

As RPGMS grows, organizing code by technical layers (components, pages, hooks, services) makes related business functionality difficult to locate and maintain.

### Decision

The application shall use a **feature-first** project structure.

Each business domain owns its:

- Components
- Pages
- Hooks
- Services
- Utilities
- Types
- Tests

Shared functionality shall be placed only in dedicated shared modules.

### Consequences

- Better scalability.
- Clear ownership of code.
- Reduced coupling between business domains.
- Easier onboarding of new developers.
- Simpler long-term maintenance.

---

## ADR-008 — Domain Ownership is Explicit

**Status:** Accepted

### Context

Business entities often appear to belong to multiple modules, creating ambiguity and duplication.

For example, a Bed is referenced by Accommodation, Stay, Billing, and Reporting.

### Decision

Every business entity shall have exactly **one owning domain**.

Other domains may reference an entity but shall not own or duplicate its business logic.

### Consequences

- Clear architectural boundaries.
- Reduced duplication.
- Simplified maintenance.
- Predictable ownership of business rules.
- Improved consistency across the application.

---

## ADR-009 — Shared Components Must Be Business-Agnostic

**Status:** Accepted

### Context

Reusable UI components often become tightly coupled to a specific business domain, reducing their usefulness elsewhere.

### Decision

Components placed in shared modules shall remain business-agnostic.

Business-specific logic belongs within the owning feature module.

Shared components may provide generic functionality but shall not contain domain-specific rules.

### Consequences

- Higher component reusability.
- Better separation of concerns.
- Cleaner feature modules.
- Easier testing and maintenance.

---

# Engineering Practices

---

## ADR-010 — Documentation is a First-Class Deliverable

**Status:** Accepted

### Context

Long-lived software projects often accumulate undocumented architectural decisions, making future maintenance and onboarding difficult.

### Decision

Documentation shall be treated as a deliverable alongside source code.

Significant architectural or business decisions shall be documented before a sprint is considered complete.

Core governance documents include:

- ARCHITECTURE.md
- PROJECT_RULES.md
- BUSINESS_RULES.md
- DATA_MODEL.md
- Specifications
- DECISIONS.md

### Consequences

- Architectural knowledge is preserved.
- Faster onboarding for future developers.
- Better consistency across the project.
- Reduced dependency on individual contributors.

---

## ADR-011 — Build, Lint, and Documentation are Sprint Exit Criteria

**Status:** Accepted

### Context

A feature is not complete simply because the code works. Long-term project quality depends on maintaining technical standards and keeping documentation synchronized with implementation.

### Decision

A sprint shall not be considered complete until:

- The project builds successfully.
- Linting passes without errors.
- Significant architectural changes are documented.
- Relevant project documentation has been updated.

### Consequences

- Higher code quality.
- Consistent project governance.
- Reduced technical debt.
- Documentation remains aligned with implementation.

---

# Project Governance

---

## ADR-012 — Business Architecture Drives Implementation

**Status:** Accepted

### Context

Implementing features before establishing a clear business architecture often leads to rework, inconsistent models, and unnecessary complexity.

### Decision

Business architecture shall be defined before implementation.

The preferred order of work is:

1. Business Architecture
2. Business Rules
3. Data Model
4. Domain Specification
5. Implementation
6. Testing
7. Documentation updates

### Consequences

- More stable architecture.
- Reduced redesign effort.
- Clear implementation roadmap.
- Consistent business behaviour across modules.

---

## ADR-013 — Architecture Decisions are Permanent Records

**Status:** Accepted

### Context

Architectural decisions explain *why* the system is built a particular way. They should remain available even if later decisions replace them.

### Decision

Architecture Decision Records shall never be deleted.

If a decision changes:

- The existing ADR shall be marked **Superseded** or **Deprecated**.
- A new ADR shall record the replacement decision.
- Historical context shall be preserved.

### Consequences

- Complete architectural history.
- Easier understanding of past design choices.
- Improved governance for future contributors.
- Long-term maintainability of the project.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 2.0 | July 2026 | Rewritten using a structured ADR format aligned with the RPGMS business architecture. |

---

