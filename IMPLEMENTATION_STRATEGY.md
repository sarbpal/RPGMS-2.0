# RPGMS 2.0

# IMPLEMENTATION_STRATEGY.md

1. Purpose

2. Scope

3. Relationship with Other Documents

4. Guiding Principles

5. Objectives

6. Definition of Success

7. Current Project Assessment

8. Business Capability Assessment

9. MVP Definition

10. Implementation Principles

11. Capability Implementation Order

12. Definition of Done

13. Progress Measurement

14. Success Criteria
    
---

## Document Information

| Item | Value |
|------|-------|
| Document | IMPLEMENTATION_STRATEGY.md |
| Project | RPGMS 2.0 |
| Version | 1.0 |
| Status | Approved |
| Classification | Governance Document |
| Owner | Project Architect |
| Authority | Strategic |
| Last Updated | July 2026 |

---

## Document Status

This document defines the approved implementation strategy for RPGMS 2.0.

It shall remain stable throughout the delivery of the Business MVP.

Revisions should only be made when the overall implementation strategy changes.

---

# 1. Purpose

This document defines the implementation strategy for RPGMS 2.0.

It bridges the gap between the Business Constitution, the Domain Model, the Software Architecture, and the actual implementation.

While the constitutional documents define **what RPGMS is**, this document defines **how RPGMS will be built**.

It provides a structured assessment of the current implementation, identifies the remaining implementation work required to deliver the Business MVP and Production MVP, establishes implementation priorities, and defines the implementation strategy to deliver a production-ready Minimum Viable Product (MVP).

This document serves as the primary reference for implementation planning, sprint sequencing, architecture reviews, and progress assessment.

---

# 2. Scope

This document covers:

- Current implementation assessment
- Business capability assessment
- MVP definition
- Implementation principles
- Capability implementation order
- Definition of Done
- Progress measurement
- Success criteria

It does not redefine business rules or software architecture. Those remain the responsibility of the constitutional documents.

---

# 3. Relationship with Other Documents

The RPGMS documentation is organised into three governance levels.

## Level 1 — Constitutional Documents

These documents define the business and architectural foundations of RPGMS.

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- BUSINESS_MODEL.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md

These documents are considered authoritative.

---

## Level 2 — Strategy Documents

These documents define how RPGMS will be implemented.

- IMPLEMENTATION_STRATEGY.md
- ROADMAP.md
- PROJECT_RULES.md
- AI_GOVERNANCE.md

---

## Level 3 — Operational Documents

These documents support the day-to-day execution of the project.

- CHANGELOG.md
- AI_SESSION_PROTOCOL.md
- DOCUMENTATION_INDEX.md
- INSTALL.md
- DEPLOYMENT.md

---

# 4. Guiding Principles

The implementation of RPGMS shall adhere to the following principles.

## 4.1 Business First

Business workflows take precedence over technical implementation.

Technology exists to support the business model.

---

## 4.2 Documentation First

Implementation follows documentation.

Documentation does not follow implementation.

---

## 4.3 Constitution Before Code

Where documentation and implementation disagree, the constitutional documents are considered the source of truth until formally amended.

---

## 4.4 Workflow Before Feature

RPGMS will be developed around complete business workflows rather than isolated features.

A workflow is considered complete only when all participating domains function together as a cohesive business process.

---

## 4.5 Domain Integrity

Every capability shall belong to exactly one business domain.

Cross-domain collaboration shall occur through well-defined interfaces and application services.

---

## 4.6 Architecture Before Optimisation

Correctness, maintainability, and clarity take precedence over premature optimisation.

---

## 4.7 Incremental Delivery

The MVP shall evolve through successive implementation Capability Releases.

Each Capability Release must produce measurable business value while preserving architectural integrity.

---

# 5. Objectives

The objectives of this document are to:

- Measure implementation progress.
- Define MVP completion.
- Prioritise remaining work.
- Record technical debt.
- Guide sprint planning.
- Align implementation with business objectives.
- Provide a common reference for architectural decisions.
- Establish a repeatable method for assessing project health.

---

# 6. Definition of Success

This document is considered successful when it enables any contributor to answer the following questions without ambiguity:

- What is the current state of RPGMS?
- What remains to be implemented?
- Why is a particular feature being built now?
- What are the implementation priorities?
- What constitutes MVP completion?
- What defines production readiness?

# 7. Current Project Assessment

## 7.1 Overview

RPGMS 2.0 has successfully transitioned from the conceptual and planning stages into active implementation.

The project possesses a mature business foundation supported by a comprehensive set of constitutional and architectural documents. These documents clearly define the business model, domain boundaries, implementation principles, and long-term vision of the system.

The current implementation demonstrates a strong architectural direction, with significant progress in establishing the application's core structure and several key business domains.

While substantial functionality has already been implemented, the project has not yet reached the point where the complete business lifecycle can be executed entirely within the system.

The primary objective of the remaining implementation effort is therefore not the addition of isolated features, but the completion and integration of the business workflows defined by the constitutional documents.

---

## 7.2 Current Position

At the time of writing, RPGMS possesses:

### Completed Foundations

✓ Project Governance

✓ Business Constitution

✓ Business Rules

✓ Business Model

✓ Domain Model

✓ Software Architecture

✓ Project Standards

✓ Documentation Standards

✓ Development Workflow

✓ Repository Structure

✓ React Application Shell

✓ Clean Architecture Foundation

✓ Domain Driven Design Foundation

✓ Material UI Design System

✓ AI Development Governance

---

### Implemented Core Domains

The following domains have substantial implementation and represent the strongest parts of the system.

• Accommodation

• Resident

• Stay

• Finance

These domains already demonstrate the architectural principles established by the project and provide a solid foundation for the remaining implementation.

---

### Partially Implemented Domains

The following domains have implementation work in progress.

• Electricity

• Reports

• Settings

• Maintenance

These domains currently provide varying levels of functionality but require further development before they can support the complete business workflows defined in the Business Rules.

---

### Planned Domains

The following domains are recognised by the Business Model but are intentionally deferred until later implementation Capability Releases.

• Internet

• Laundry

• Notifications

• Complaints

• Authentication

• Audit

Their absence does not necessarily prevent completion of the Business MVP unless explicitly identified as a dependency of a core business workflow.

---

## 7.3 Architectural Strengths

The project already exhibits several notable strengths.

### Documentation First

The implementation is guided by formal constitutional documents rather than evolving organically through code.

This significantly reduces architectural drift.

---

### Business Driven Design

The business model has been designed before implementation.

This allows software decisions to remain aligned with operational requirements.

---

### Domain Driven Design

Business concepts have been translated into explicit domains rather than generic CRUD modules.

This provides clear ownership and responsibility throughout the system.

---

### Clean Architecture

The separation between Presentation, Application, Domain, and Infrastructure has been established early in the project.

This provides a scalable and maintainable implementation foundation.

---

### Long-Term Maintainability

Architectural consistency has been prioritised over rapid feature development.

Although this slows initial implementation, it substantially reduces future technical debt.

---

## 7.4 Current Challenges

The project currently faces several implementation challenges.

### Incomplete Business Workflows

Individual domains are progressing well, but several end-to-end business workflows remain incomplete.

The next implementation Capability Releases should prioritise workflow completion rather than isolated functionality.

---

### Infrastructure Readiness

Current persistence mechanisms remain suitable for development but must eventually be replaced by production-grade infrastructure.

---

### Operational Modules

Several operational modules remain intentionally deferred.

Their implementation should be driven by business priority rather than perceived completeness.

---

### Integration

The primary challenge is no longer individual module development.

The primary challenge is integrating domains into cohesive business workflows.

---

## 7.5 Overall Assessment

From a strategic perspective, RPGMS is no longer a prototype.

It has successfully established its business identity, architectural direction, and implementation methodology.

The remaining effort should therefore focus on delivering complete business capabilities rather than expanding the number of implemented modules.

Success should be measured by operational completeness rather than feature count.

Accordingly, future implementation priorities shall be determined by business workflow completion, constitutional compliance, and architectural integrity rather than by the existence of partially implemented modules.

# 8. Business Capability Assessment

## 8.1 Philosophy

The implementation progress of RPGMS shall not be measured by the number of completed modules, screens, or source files.

Instead, progress shall be measured by the successful delivery of complete business capabilities.

A business capability represents a complete operational function that delivers measurable value to the business.

Every capability spans one or more domains and may involve multiple user interfaces, application services, domain entities, repositories, and business rules.

Accordingly, a capability shall only be considered complete when the entire business workflow functions correctly from start to finish.

---

# 8.2 Capability Maturity Model

Each business capability shall be assessed using the following maturity model.

| Level | Status | Description |
|---------|----------|------------------------------------------------|
| Level 0 | Not Started | Capability does not exist. |
| Level 1 | Planned | Business rules defined but implementation not started. |
| Level 2 | Partial | Some components implemented but workflow incomplete. |
| Level 3 | Functional | Workflow operates successfully under normal conditions. |
| Level 4 | Production Ready | Fully integrated, tested, documented and operational. |

This maturity model shall be used throughout the project when assessing implementation progress.

---

# 8.3 Core Business Capability Matrix

The following capabilities constitute the Business MVP.

## Capability 1 — Accommodation Management

### Business Objective

Manage the physical inventory of the hostel.

### Participating Domains

Accommodation

### Business Value

Provides the physical foundation upon which all resident operations depend.

### Current Status

Substantially Implemented

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 2 — Reservation Management

### Business Objective

Reserve accommodation for prospective residents prior to admission.

### Participating Domains

Reservation

Accommodation

Resident

### Business Value

Initiates the resident lifecycle.

### Current Status

To be verified against implementation.

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 3 — Resident Admission

### Business Objective

Convert a reservation into an admitted resident occupying an allocated bed.

### Participating Domains

Reservation

Accommodation

Resident

Stay

Commercial

Finance

Deposit

### Business Value

Creates an active customer and begins revenue generation.

### Current Status

Partial

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 4 — Stay Management

### Business Objective

Manage the complete lifecycle of a resident's stay.

### Participating Domains

Stay

Resident

Accommodation

### Business Value

Tracks occupancy throughout the resident lifecycle.

### Current Status

Substantially Implemented

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 5 — Monthly Billing

### Business Objective

Generate recurring financial obligations throughout the resident's stay.

### Participating Domains

Finance

Stay

Commercial

### Business Value

Primary revenue generation.

### Current Status

Partial

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 6 — Payment Management

### Business Objective

Receive, allocate and reconcile resident payments.

### Participating Domains

Finance

### Business Value

Maintains financial integrity.

### Current Status

Substantially Implemented

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 7 — Checkout & Settlement

### Business Objective

Terminate the stay, settle outstanding dues, refund deposits and complete the resident lifecycle.

### Participating Domains

Stay

Finance

Deposit

Resident

Accommodation

### Business Value

Completes the commercial relationship.

### Current Status

Partial

### MVP Priority

Critical

### Target Maturity

Level 4

---

## Capability 8 — Resident History

### Business Objective

Maintain an accurate historical record of previous residents.

### Participating Domains

Resident

Stay

Finance

### Business Value

Supports future admissions and historical reporting.

### Current Status

Partial

### MVP Priority

High

### Target Maturity

Level 4

---

# 8.4 Operational Capabilities

The following capabilities enhance hostel operations but are not required to establish the Business MVP unless explicitly identified as mandatory by the Business Constitution.

These include:

• Electricity Recovery

• Laundry Management

• Internet Management

• Maintenance

• Complaints

• Notifications

• Reporting

• Audit

Their implementation priority shall be determined by operational necessity rather than by their existence as standalone modules.

---

# 8.5 Capability Dependencies

Business capabilities shall always be implemented according to dependency order.

A capability may not be considered complete unless all prerequisite capabilities have reached Functional status.

The primary dependency chain is:

Accommodation

↓

Reservation

↓

Resident Admission

↓

Stay Management

↓

Monthly Billing

↓

Payment Management

↓

Checkout & Settlement

↓

Resident History

This dependency chain forms the backbone of the RPGMS Business MVP.

Future implementation Capability Releases shall preserve this sequence unless a formal architectural decision explicitly approves an alternative.

---

# 8.6 Measuring Progress

Project progress shall be measured by completed business capabilities rather than completed source code.

Sprint planning shall therefore prioritise:

1. Completing workflows.
2. Eliminating workflow gaps.
3. Improving workflow reliability.
4. Increasing workflow automation.

New standalone features shall only be introduced when they strengthen or extend an existing business capability.

# 9. MVP Definition

## 9.1 Overview

The Minimum Viable Product (MVP) defines the minimum implementation required for RPGMS to support the complete operational lifecycle of a Paying Guest accommodation business.

The RPGMS MVP is capability-driven rather than feature-driven. Progress shall be measured by the completion of business capabilities and end-to-end business workflows rather than by the number of screens, modules, or source code files.

The MVP is divided into two distinct milestones:

- Business MVP
- Production MVP

The Business MVP establishes operational completeness, while the Production MVP establishes operational reliability.

---

## 9.2 Business MVP

### Business MVP Capabilities

The Business MVP consists of the following core business capabilities:

1. Accommodation Management
2. Reservation Management
3. Resident Admission
4. Stay Management
5. Monthly Billing
6. Payment Management
7. Checkout & Settlement
8. Resident History

These capabilities collectively support the complete resident lifecycle while enabling the day-to-day operation of the business without dependence on external spreadsheets or manual systems.

Supporting operational capabilities such as Electricity Recovery, Laundry Management, Internet Management, Maintenance, Complaints, Notifications, Reporting, and Audit shall be implemented according to business priority and operational requirements following completion of the Business MVP unless required earlier by a core business workflow.

---

## 9.3 Production MVP

### Objective

The Production MVP extends the Business MVP by adding the technical capabilities required for reliable day-to-day operation in a production environment.

### Production MVP Requirements

The Production MVP includes:

- Persistent data storage
- User authentication
- Role-based authorization
- Audit logging
- Backup and recovery
- Error handling
- Deployment automation
- Monitoring and diagnostics
- Security controls
- Performance suitable for normal hostel operations

### Production MVP Success Criteria

The Production MVP shall be considered complete when:

- All Business MVP capabilities are production ready.
- Business data is securely stored and recoverable.
- Users are authenticated and authorized appropriately.
- Critical business operations are auditable.
- The application can be deployed and operated reliably.
- The system is suitable for day-to-day use in a live Paying Guest accommodation business.

---

## 9.4 MVP Philosophy

RPGMS shall be implemented one complete business capability at a time.

A capability shall only be considered complete when:

- Business rules have been implemented.
- Business workflows execute successfully.
- User interfaces are complete.
- Testing has been successfully completed.
- Documentation has been updated.
- The capability satisfies the Definition of Done.

This capability-driven approach promotes incremental business value, reduces technical debt, and preserves architectural integrity throughout the implementation lifecycle.

# 10. Implementation Principles

## 10.1 Overview

The implementation of RPGMS shall be guided by a consistent set of engineering principles that ensure the system remains aligned with its business objectives, constitutional documents, and software architecture.

These principles govern implementation decisions throughout the project and take precedence over individual coding preferences or implementation shortcuts.

---

## Resident Module MVP Implementation Strategy

The Resident Module shall be implemented in accordance with the Resident Workspace V2 Specification.

The specification serves as the authoritative implementation reference for all Resident-related functionality.

Implementation shall prioritise delivery of the Minimum Viable Product (MVP) while preserving the constitutional architecture established for RPGMS 2.0.

### MVP Implementation Scope

The Resident Module MVP includes:

- Residents List Workspace
- Standard Admission Workspace
- Resident Workspace
- Universal Search
- Current Stay Summary
- Operational Readiness
- Profile Completion
- Documents Management
- Compliance Summary
- Timeline
- Resident Quick Actions

### Implementation Principles

Implementation shall follow these principles:

- Follow the approved Resident Workspace V2 Specification.
- Do not introduce new business rules during implementation.
- Preserve established Domain Ownership.
- Preserve Clean Architecture.
- Implement the agreed UI before adding enhancements.
- Defer non-essential features to future versions.
- Update documentation only where implementation changes constitutional behaviour.

The objective is to deliver a complete, stable and architecturally correct Resident Module MVP.

---

## 10.2 Specification-Driven Development

Implementation shall always begin with the governing documentation.

Business rules, domain models, architectural decisions, and capability specifications shall be understood before implementation begins.

Source code is an implementation of the specifications and shall not become the primary source of truth.

---

## 10.3 Business Capability First

Implementation shall focus on completing business capabilities rather than isolated technical features.

Each capability shall deliver measurable business value and support one or more complete business workflows.

Capabilities shall be implemented vertically across all architectural layers until operationally complete.

---

## 10.4 Workflow Before Features

Business workflows take precedence over individual screens, forms, or technical components.

A workflow is considered complete only when the participating domains interact correctly to achieve the intended business outcome.

The objective is to deliver complete operational processes rather than collections of unrelated features.

---

## 10.5 Constitution Before Code

The constitutional documents define the authoritative behaviour of RPGMS.

Where implementation differs from the constitutional documents, the implementation shall be corrected unless the constitutional documents are formally amended.

Business rules shall never be inferred solely from existing source code.

---

## 10.6 Architecture Compliance

All implementation shall conform to the approved software architecture.

Business logic shall remain within the Domain and Application layers.

Presentation components shall remain focused on user interaction and presentation.

Infrastructure concerns shall remain isolated from business rules.

---

## 10.7 Incremental Delivery

Implementation shall proceed through successive Capability Releases.

Each Capability Release shall produce measurable business value while preserving architectural integrity.

Incomplete work shall not compromise previously completed capabilities.

---

## 10.8 Documentation Integrity

Documentation and implementation shall evolve together.

Significant architectural decisions, business rule changes, or implementation strategies shall be reflected in the appropriate governance documents before a Capability Release is considered complete.

Documentation shall remain an accurate representation of the implemented system.

---

## 10.9 Quality Before Optimisation

Correctness, maintainability, readability, and reliability shall take precedence over premature optimisation.

Performance improvements shall be introduced only after correctness has been established and measured.

---

## 10.10 Simplicity

Implementation should favour the simplest solution that satisfies the business requirements and architectural principles.

Unnecessary abstraction, speculative functionality, and premature generalisation should be avoided.

Engineering effort shall remain focused on delivering the Business MVP.

---

## 10.11 Controlled Evolution

The implementation strategy is intended to remain stable throughout the delivery of the MVP.

Architectural changes, structural refactoring, or significant design revisions shall only be introduced when they provide clear and measurable benefits to the project.

Changes that do not directly contribute to the successful delivery of the MVP should be deferred until after the Production MVP has been achieved.

# 11. Capability Implementation Order

## 11.1 Overview

Business capabilities shall be implemented in an order that reflects the operational lifecycle of a resident and the natural dependencies between business domains.

The implementation sequence prioritises complete business workflows over individual features or technical components.

Each Capability Release shall produce measurable business value while establishing the foundation for subsequent capabilities.

---

## 11.2 Capability Release Sequence

The Business MVP shall be delivered through the following Capability Releases.

| Capability Release | Business Capability | Priority |
|--------------------|---------------------|----------|
| CR-1 | Accommodation Management | Critical |
| CR-2 | Reservation Management | Critical |
| CR-3 | Resident Admission | Critical |
| CR-4 | Stay Management | Critical |
| CR-5 | Monthly Billing | Critical |
| CR-6 | Payment Management | Critical |
| CR-7 | Checkout & Settlement | Critical |
| CR-8 | Resident History | High |

Operational capabilities such as Electricity, Laundry, Internet, Maintenance, Complaints, Notifications, Reporting, and Audit shall be implemented according to business priority and dependency after the completion of the Business MVP unless required earlier by a core business workflow.

---

## 11.3 Dependency Principle

Capability Releases shall respect business dependencies.

A capability shall not be considered complete unless all prerequisite capabilities are operational.

The primary dependency chain is:

Accommodation Management

↓

Reservation Management

↓

Resident Admission

↓

Stay Management

↓

Monthly Billing

↓

Payment Management

↓

Checkout & Settlement

↓

Resident History

---

## 11.4 Vertical Completion

Each Capability Release shall be implemented as a complete vertical slice of the system.

Completion includes:

- Domain Model
- Application Services
- Infrastructure
- User Interface
- Validation
- Testing
- Documentation

A Capability Release shall only be considered complete when all implementation layers operate together as a cohesive business workflow.

---

## 11.5 Release Philosophy

The objective of each Capability Release is to produce a complete, usable increment of the system.

New work should strengthen existing business workflows before introducing additional functionality.

Implementation effort shall remain focused on delivering the Business MVP with the highest possible quality while preserving architectural integrity.

# 12. Definition of Done

## 12.1 Overview

A business capability shall only be considered complete when it satisfies the agreed Definition of Done.

Completion is determined by operational readiness rather than by the existence of source code, user interface components, or isolated technical features.

Every Capability Release shall satisfy all of the following criteria before it is considered complete.

---

## 12.2 Business Completion

The capability shall:

- Implement all applicable business rules.
- Support the complete business workflow from start to finish.
- Produce the expected business outcomes.
- Maintain data integrity throughout the workflow.

---

## 12.3 Technical Completion

The capability shall:

- Conform to the approved software architecture.
- Integrate correctly with dependent domains.
- Handle validation and error conditions appropriately.
- Meet the project's coding and quality standards.

---

## 12.4 User Experience Completion

The capability shall:

- Provide a complete and consistent user interface.
- Support all required user interactions.
- Display appropriate feedback and error messages.
- Maintain consistency with the project's design guidelines.

---

## 12.5 Testing Completion

The capability shall:

- Successfully complete all planned testing.
- Demonstrate correct behaviour under normal operating conditions.
- Demonstrate correct handling of expected error conditions.
- Be considered operationally reliable.

---

## 12.6 Documentation Completion

The implementation shall:

- Update all affected governance documents where necessary.
- Record significant architectural or business decisions.
- Maintain consistency between documentation and implementation.

---

## 12.7 Capability Acceptance

A Capability Release shall only be considered complete when all sections of this Definition of Done have been satisfied.

Partial completion shall not constitute completion.

