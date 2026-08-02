# CR-3 Stay Implementation Plan

**Document Status:** Approved
**Change Request:** CR-3 – Stay Architecture Implementation  
**Project:** RPGMS 2.0  
**Owner:** Architecture Team  
**Related Documents:**

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md
- docs/stay/STAY_SPECIFICATION.md
- docs/stay/STAY_WORKSPACE.md

---

# 1. Purpose

This document defines the implementation plan for Change Request CR-3, which introduces the approved Stay architecture into RPGMS 2.0.

The objective of CR-3 is to transition the existing Stay implementation to the architecture defined by the approved business and software architecture documents while preserving existing business functionality wherever practical.

CR-3 is an implementation roadmap.

It defines how the approved architecture will be realised in code.

It does not redefine business requirements, architectural principles, or domain responsibilities, all of which are governed by the approved architectural documentation.

Implementation performed under CR-3 shall conform to the architectural baseline established by the project.

# 2. Scope

## 2.1 In Scope

CR-3 implements the approved Stay architecture within RPGMS 2.0.

The implementation includes:

- Stay Aggregate refactoring.
- Commercial Agreement implementation.
- Bed Allocation implementation.
- Current Projection implementation.
- Business Operations implementation.
- Operational Timeline implementation.
- Stay Workspace alignment.
- Admission workflow alignment.
- Reservation to Stay conversion alignment.
- Domain service and Coordinator refactoring.
- Repository updates required to support the new Stay architecture.
- Unit and integration test updates.
- Documentation updates required by implementation.

---

## 2.2 Out of Scope

The following items are explicitly excluded from CR-3:

- Finance domain redesign.
- Resident domain redesign.
- Reservation domain redesign.
- Reporting enhancements.
- Dashboard redesign.
- Visitor Management.
- Maintenance Management.
- Inventory Management.
- Performance optimisation.
- Mobile application development.

Where future work depends on the Stay architecture introduced by CR-3, it shall be implemented under separate Change Requests.

---

## 2.3 Architectural Constraints

CR-3 shall implement the approved architecture without introducing new business behaviour.

Implementation shall conform to:

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md
- STAY_SPECIFICATION.md
- STAY_WORKSPACE.md

Business requirements shall not be modified during implementation.

Where implementation reveals a genuine architectural concern, the implementation shall pause and the issue shall be resolved through the project's Architecture Decision Record (ADR) process before proceeding.

# 3. Objectives

The primary objectives of CR-3 are:

- Implement the approved Stay architecture.
- Preserve the business rules defined by the approved specifications.
- Eliminate duplicated Stay-related business logic.
- Introduce Commercial Agreement history.
- Introduce Bed Allocation history.
- Introduce the Current Projection.
- Align the Stay Workspace with the approved operational model.
- Preserve Clean Architecture boundaries.
- Preserve Domain ownership.
- Maintain backward compatibility wherever practical.
- Improve maintainability and extensibility.
- Ensure all automated tests continue to pass throughout implementation.

---

## Success Criteria

CR-3 shall be considered successful when:

- The implemented Stay domain conforms to the approved architecture.
- Existing functionality continues to operate correctly.
- Current Projection is fully operational.
- Commercial Agreement history is fully operational.
- Bed Allocation history is fully operational.
- Stay Workspace reflects the approved operational workflow.
- Automated tests pass.
- TypeScript compilation succeeds.
- Production build succeeds.
- Documentation is updated and consistent with the implementation.

# 4. Architectural Baseline

CR-3 shall implement the approved Stay architecture as defined by the project's constitutional and architectural documents.

The following documents collectively establish the architectural baseline for CR-3:

- BUSINESS_CONSTITUTION.md
- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md
- docs/stay/STAY_SPECIFICATION.md
- docs/stay/STAY_WORKSPACE.md

These documents define the approved business architecture, software architecture, domain responsibilities, business rules, and operational workflows.

---

## Architectural Compliance

Implementation shall conform to the approved architectural baseline.

CR-3 shall not introduce changes to:

- Business terminology
- Domain ownership
- Aggregate boundaries
- Business invariants
- Business workflows
- Operational responsibilities

Where implementation reveals a genuine architectural concern, implementation shall pause until the issue has been reviewed and approved through the project's Architecture Decision Record (ADR) process.

Implementation convenience shall never justify architectural changes.

---

## Architectural Principles

Throughout CR-3, the following principles shall be preserved:

- Business Architecture before Software Implementation.
- Clean Architecture boundaries.
- Single Responsibility Principle.
- Domain ownership.
- Progressive Data Capture.
- Immutable business history.
- Current Projection as the operational view.
- Business Operations instead of generic CRUD operations.
- Incremental implementation with continuous verification.

---

## Implementation Philosophy

CR-3 shall focus on implementing the approved architecture rather than redesigning it.

Where existing code already satisfies the approved architecture, it should be preserved and refactored rather than unnecessarily replaced.

Every implementation decision should improve architectural consistency, readability, maintainability, and long-term extensibility.

# 5. Current Implementation Assessment

## 5.1 Overview

The existing Stay implementation provides a functional operational workflow supporting Resident Admission, Stay management, Reservation conversion, and operational activities.

The current implementation has evolved incrementally throughout the development of RPGMS 2.0 and predates the approved Stay architecture documented in the architectural baseline.

Consequently, several business concepts are already implemented, while others require refactoring to align with the approved architectural model.

The objective of CR-3 is to evolve the existing implementation into the approved architecture rather than replacing it.

---

## 5.2 Existing Capabilities

The current implementation already includes:

- Stay Workspace.
- Admission Workspace.
- Reservation Workspace.
- Reservation to Admission conversion.
- Resident onboarding.
- Stay lifecycle management.
- Notice management.
- Operational Checkout workflow.
- Door ID assignment.
- Coordinator layer.
- Repository layer.
- Domain entities.
- Comprehensive automated test suite.

These capabilities shall be preserved wherever they remain consistent with the approved architecture.

---

## 5.3 Areas Requiring Refactoring

The following architectural improvements are required:

### Stay Aggregate

Refactor the Stay Aggregate to align with the approved domain model.

---

### Commercial Agreement

Introduce explicit Commercial Agreement history while preserving historical commercial terms.

---

### Bed Allocation

Introduce explicit Bed Allocation history supporting accommodation changes throughout the Stay.

---

### Current Projection

Implement the derived Current Projection representing the operational state of the active Stay.

---

### Business Operations

Align operational workflows with the approved Business Operations defined in the Stay Specification.

---

### Stay Workspace

Refactor the Stay Workspace to consume the Current Projection while preserving existing operational functionality.

---

### Repository Layer

Update repository contracts and persistence models where necessary to support the approved Stay architecture.

---

### Coordinators

Refactor Coordinators to orchestrate Business Operations while preserving Clean Architecture boundaries.

---

## 5.4 Existing Assets to Preserve

CR-3 shall maximise reuse of existing implementation wherever practical.

Examples include:

- Workspace layouts.
- Coordinator structure.
- Repository abstractions.
- Test infrastructure.
- Shared UI components.
- Progressive Data Capture implementation.
- Existing validation mechanisms.

Implementation shall favour incremental refactoring over wholesale replacement.

---

## 5.5 Architectural Alignment Strategy

CR-3 is an evolutionary refactoring initiative.

Implementation shall proceed incrementally, validating each architectural improvement before progressing to the next phase.

No implementation phase shall leave the application in a partially functional state.

Each phase shall conclude with:

- Successful automated tests.
- Successful TypeScript compilation.
- Successful production build.
- Documentation updates where applicable.

# 6. Target Architecture

## 6.1 Overview

Upon completion of CR-3, the Stay domain shall fully conform to the approved business and software architecture defined by the project's architectural baseline.

The implementation shall preserve complete operational history while providing a simplified operational view through the Current Projection.

The Stay Workspace shall operate exclusively on the Current Projection and invoke approved Business Operations to modify the operational state of a Stay.

---

## 6.2 Target Stay Architecture

The target Stay architecture is illustrated below.

```text
Resident
    │
    ▼
Current Stay
    │
    ├── Commercial Agreement History
    │
    ├── Bed Allocation History
    │
    ├── Business Events
    │
    ├── Notice Lifecycle
    │
    └── Operational Checkout
            │
            ▼
     Current Projection
            │
            ▼
      Stay Workspace
            │
            ▼
     Business Operations
```

The Stay Aggregate remains the authoritative source of operational history.

The Current Projection provides the derived operational state required for day-to-day hostel operations.

---

## 6.3 Architectural Characteristics

The target architecture shall provide:

- Complete historical preservation.
- Immutable business history.
- Derived operational state through the Current Projection.
- Explicit Commercial Agreement history.
- Explicit Bed Allocation history.
- Business Operations replacing generic CRUD operations.
- Clear separation of domain ownership.
- Full compliance with Clean Architecture.

---

## 6.4 Domain Responsibilities

### Resident Domain

Responsible for Resident identity and profile information.

---

### Stay Domain

Responsible for the operational relationship between the Resident and the organisation.

Maintains:

- Stay lifecycle.
- Commercial Agreement history.
- Bed Allocation history.
- Business Events.
- Current Projection.

---

### Accommodation Domain

Responsible for physical accommodation resources.

Maintains:

- Buildings.
- Floors.
- Flats.
- Rooms.
- Beds.
- Bed availability.

---

### Finance Domain

Responsible for all financial transactions and financial history.

Maintains:

- Rent generation.
- Payments.
- Charges.
- Refunds.
- Financial Ledger.

---

### Stay Workspace

Responsible for orchestrating Business Operations using the Current Projection.

The Workspace does not own business data.

---

## 6.5 Architectural Goals

The completed implementation shall achieve:

- Clear separation between historical business information and operational state.
- Elimination of duplicated Stay logic.
- Consistent domain ownership.
- Simplified operational workflows.
- Improved maintainability.
- Improved extensibility.
- Reduced coupling between domains.

# 7. Implementation Methodology

## 7.1 Guiding Principles

CR-3 shall be implemented as a controlled, incremental refactoring initiative.

The implementation shall preserve application stability while progressively introducing the approved Stay architecture.

Every implementation decision shall prioritise:

- Architectural consistency.
- Business correctness.
- Maintainability.
- Readability.
- Incremental delivery.
- Comprehensive verification.

Implementation convenience shall never take precedence over approved business architecture.

---

## 7.2 Incremental Delivery

CR-3 shall be executed through a sequence of small, independently verifiable implementation phases.

Each phase shall:

- Deliver a clearly defined objective.
- Leave the application in a fully functional state.
- Preserve existing functionality wherever practical.
- Introduce only the approved architectural improvements for that phase.

Large-scale rewrites shall be avoided.

Incremental refactoring shall be preferred wherever practical.

---

## 7.3 Phase Independence

Each implementation phase shall be independently:

- Implemented.
- Tested.
- Reviewed.
- Documented.
- Accepted.

No subsequent phase shall depend upon partially completed work from an earlier phase.

---

## 7.4 Verification Gates

Every implementation phase shall successfully complete the following verification gates before the next phase begins.

### Functional Verification

- Business behaviour verified.
- Acceptance criteria satisfied.

### Automated Testing

- Unit tests pass.
- Integration tests pass.

### Technical Verification

- TypeScript compilation succeeds.
- Production build succeeds.

### Documentation Verification

Documentation shall be reviewed and updated where required.

Examples include:

- CHANGELOG.md
- ARCHITECTURE.md
- PROJECT_RULES.md
- Relevant specification documents.

---

## 7.5 Rollback Strategy

Each implementation phase shall conclude with an independent Git commit.

Where appropriate, implementation milestones shall also be identified using Git tags.

This approach ensures that every accepted phase can be reverted independently without affecting previously completed work.

---

## 7.6 AI Implementation Protocol

Implementation performed using AI assistants shall follow the project's standard AI workflow.

Before implementing any phase, the AI shall:

1. Read the approved architectural baseline.
2. Review the relevant source code.
3. Understand the scope of the current implementation phase.
4. Preserve Clean Architecture boundaries.
5. Implement only the approved scope.
6. Avoid introducing unrelated changes.

Upon completion of each phase, the AI shall:

- Execute automated tests.
- Execute TypeScript compilation.
- Execute production build.
- Produce an implementation completion report.
- Identify any documentation requiring updates.

---

## 7.7 Phase Completion

An implementation phase shall be considered complete only when:

- All acceptance criteria have been satisfied.
- All verification gates have passed.
- Documentation has been updated where required.
- Changes have been reviewed and accepted.
- The phase has been committed to source control.

# 8. Implementation Phases

## Overview

CR-3 shall be implemented through a sequence of business capability phases.

Each phase delivers a complete operational capability while progressively implementing the approved Stay architecture.

Every phase shall satisfy the Verification Gates defined in Section 7 before the next phase begins.

No phase shall leave the application in a partially functional state.

The implementation sequence reflects business workflows rather than technical components.

---

## Phase CR-3.1 — Stay Foundation

### Objective

Establish the architectural foundation of the Stay domain.

### Scope

- Refactor the Stay Aggregate.
- Align domain boundaries.
- Introduce architectural extension points.
- Prepare the domain for subsequent business capabilities.

### Deliverables

- Refactored Stay Aggregate.
- Updated domain entities.
- Repository alignment.
- Updated tests.

### Acceptance Criteria

- Stay Aggregate conforms to the approved architecture.
- Existing functionality remains operational.
- All Verification Gates pass.

---

## Phase CR-3.2 — Admission Workflow

### Objective

Implement the complete Admission workflow using the approved Stay architecture.

### Scope

- Admission creates a new Stay.
- Initial Commercial Agreement.
- Initial Bed Allocation.
- Initial Business Events.
- Initial Current Projection.

### Deliverables

- Fully compliant Admission workflow.
- Updated Coordinators.
- Updated repositories.
- Updated tests.

### Acceptance Criteria

- Admission workflow complies with STAY_SPECIFICATION.md.
- Current Projection correctly reflects the newly admitted Stay.
- Existing Admission functionality remains operational.

---

## Phase CR-3.3 — Accommodation Operations

### Objective

Implement accommodation-related business operations.

### Scope

- Additional Bed Allocation.
- Bed Release.
- Bed Transfer.
- Flat Transfer.
- Bed Allocation history.
- Current Projection updates.

### Deliverables

- Accommodation operations.
- Bed Allocation history.
- Updated tests.

### Acceptance Criteria

- Accommodation history is preserved.
- Current Projection accurately reflects accommodation changes.
- Existing accommodation workflows remain operational.

---

## Phase CR-3.4 — Commercial Operations

### Objective

Implement commercial lifecycle management.

### Scope

- Commercial Agreement revisions.
- Rent revisions.
- Deposit revisions.
- Commercial Agreement history.
- Current Projection updates.

### Deliverables

- Commercial lifecycle implementation.
- Commercial history.
- Updated tests.

### Acceptance Criteria

- Historical Commercial Agreements remain immutable.
- Active Commercial Agreement correctly exposed.
- Current Projection accurately reflects commercial changes.

---

## Phase CR-3.5 — Notice Lifecycle

### Objective

Implement the operational Notice lifecycle.

### Scope

- Give Notice.
- Withdraw Notice.
- Notice status transitions.
- Expected Operational Checkout.
- Business Events.
- Current Projection updates.

### Deliverables

- Notice workflow.
- Updated Coordinators.
- Updated tests.

### Acceptance Criteria

- Notice lifecycle conforms to approved business rules.
- Current Projection correctly reflects Notice status.

---

## Phase CR-3.6 — Operational Checkout

### Objective

Implement the approved Operational Checkout workflow.

### Scope

- Release active Bed Allocations.
- Release Door ID.
- Record Operational Checkout.
- Close the Stay.
- Final Business Events.
- Final Current Projection.

### Deliverables

- Operational Checkout workflow.
- Updated repositories.
- Updated tests.

### Acceptance Criteria

- Stay transitions to CHECKED_OUT.
- Operational resources released.
- Historical information preserved.

---

## Phase CR-3.7 — Stay Workspace

### Objective

Align the Stay Workspace with the completed Stay architecture.

### Scope

- Current Projection integration.
- Commercial section.
- Accommodation section.
- Business Events timeline.
- Quick Actions.
- Workspace refinements.

### Deliverables

- Updated Stay Workspace.
- Updated UI tests.

### Acceptance Criteria

- Workspace operates exclusively on the Current Projection.
- Business Operations are correctly invoked.
- User interface complies with project standards.

---

## Phase CR-3.8 — Integration & Stabilisation

### Objective

Complete CR-3 through final verification and documentation.

### Scope

- Regression testing.
- Integration testing.
- Documentation review.
- Code cleanup.
- Technical debt review.

### Deliverables

- Final regression report.
- Updated documentation.
- CR-3 completion report.

### Acceptance Criteria

- All Verification Gates pass.
- Documentation fully aligned.
- Architecture compliance confirmed.
- CR-3 formally accepted.

# 9. Phase Dependencies

CR-3.1
Stay Foundation
        │
        ▼
CR-3.2
Admission Workflow
        │
        ▼
CR-3.3
Accommodation Operations
        │
        ▼
CR-3.4
Commercial Operations
        │
        ▼
CR-3.5
Notice Lifecycle
        │
        ▼
CR-3.6
Operational Checkout
        │
        ▼
CR-3.7
Stay Workspace
        │
        ▼
CR-3.8
Integration & Stabilisation

The implementation phases shall be completed in the following dependency order:

- CR-3.1 establishes the architectural foundation.
- CR-3.2 depends upon CR-3.1.
- CR-3.3 depends upon CR-3.2.
- CR-3.4 depends upon CR-3.2.
- CR-3.5 depends upon CR-3.3 and CR-3.4.
- CR-3.6 depends upon CR-3.5.
- CR-3.7 depends upon completion of the operational business capabilities.
- CR-3.8 completes integration, verification and project closure.

# 10. Phase Deliverables

Each implementation phase shall produce a clearly defined set of deliverables.

The minimum deliverables for every phase are:

## Implementation

- Completed source code.
- Refactored components where applicable.
- Updated domain services.
- Updated Coordinators.
- Updated repositories where required.

---

## Testing

- Updated unit tests.
- Updated integration tests.
- Successful test execution.

---

## Verification

- Successful TypeScript compilation.
- Successful production build.
- Verification Gates completed.

---

## Documentation

Where applicable, documentation shall be updated before the phase is considered complete.

Documentation may include:

- CHANGELOG.md
- ARCHITECTURE.md
- PROJECT_RULES.md
- Relevant specification documents.

---

## Completion Report

Every implementation phase shall conclude with a Completion Report summarising:

- Objective achieved.
- Files created.
- Files modified.
- Architectural decisions.
- Business rules affected.
- Verification results.
- Documentation updates.
- Outstanding observations (if any).

# 11. Testing Strategy

CR-3 shall maintain production quality throughout implementation.

Testing shall be performed continuously rather than deferred until the end of the project.

---

## Unit Testing

Unit tests shall validate:

- Domain entities.
- Domain services.
- Coordinators.
- Repository behaviour.
- Business rules.

---

## Integration Testing

Integration tests shall verify:

- Admission workflow.
- Stay lifecycle.
- Accommodation operations.
- Commercial operations.
- Notice lifecycle.
- Operational Checkout.
- Stay Workspace interactions.

---

## Build Verification

Every implementation phase shall successfully complete:

- TypeScript compilation.
- Production build.

---

## Regression Testing

Previously implemented functionality shall continue to operate correctly throughout CR-3.

Regression testing shall be performed after every implementation phase.

---

## Acceptance Testing

Each business capability shall be verified against the approved business specifications before the phase is accepted.

# 12. Documentation Requirements

Documentation forms part of the implementation deliverables.

Implementation is not considered complete until relevant documentation has been reviewed and updated.

---

## Mandatory Documentation Review

Following each implementation phase, review the following documents where applicable:

- CHANGELOG.md
- ARCHITECTURE.md
- PROJECT_RULES.md
- Relevant specification documents.

---

## Documentation Principles

Documentation shall:

- Reflect the implemented solution.
- Remain consistent with the approved architecture.
- Avoid implementation-specific detail unless appropriate.
- Preserve the distinction between business architecture and software implementation.

---

## Architectural Documentation

Changes affecting architectural decisions shall be documented through the project's Architecture Decision Record (ADR) process before implementation proceeds.

### Architectural Knowledge Capture

Before closing any implementation phase, significant architectural or design decisions discovered during implementation shall be documented in:

- ARCHITECTURE.md
- PROJECT_RULES.md

as appropriate.

This ensures that architectural knowledge gained during implementation is preserved for future development.

# 13. Completion Criteria

CR-3 shall be considered complete only when all implementation phases have been successfully delivered, verified, documented, and formally accepted.

Completion of CR-3 requires successful satisfaction of all of the following criteria.

---

## Architectural Completion

- The Stay implementation fully conforms to the approved architectural baseline.
- Clean Architecture boundaries are preserved.
- Domain ownership is correctly implemented.
- No architectural inconsistencies remain.

---

## Functional Completion

The following business capabilities are fully operational:

- Stay Foundation
- Admission Workflow
- Accommodation Operations
- Commercial Operations
- Notice Lifecycle
- Operational Checkout
- Stay Workspace

---

## Technical Completion

- All automated tests pass.
- Integration tests pass.
- TypeScript compilation succeeds.
- Production build succeeds.
- No critical implementation defects remain.

---

## Documentation Completion

The following documentation has been reviewed and updated where required:

- CHANGELOG.md
- ARCHITECTURE.md
- PROJECT_RULES.md
- STAY_SPECIFICATION.md
- STAY_WORKSPACE.md

---

## Project Completion

CR-3 shall be formally closed only after:

- All implementation phases have been accepted.
- Verification Gates have been satisfied.
- Documentation has been completed.
- Source code has been committed.
- Appropriate Git tag has been created.
- Final Completion Report has been approved.

# 14. Risks & Mitigation

The following implementation risks have been identified together with the project's mitigation strategy.

| Risk | Mitigation |
|------|------------|
| Architectural drift during implementation | Strict adherence to the approved architectural baseline. |
| Regression of existing functionality | Incremental implementation with comprehensive automated testing. |
| Scope creep | Limit each phase to its approved business capability. |
| Inconsistent documentation | Documentation review before closing every implementation phase. |
| Breaking Clean Architecture boundaries | Continuous architectural review during implementation. |
| AI introducing unrelated changes | AI Implementation Protocol and clearly scoped implementation prompts. |
| Large, difficult-to-review changes | Small incremental implementation phases with independent verification. |

---

## Risk Management Principles

CR-3 shall minimise implementation risk through:

- Incremental delivery.
- Frequent verification.
- Continuous testing.
- Small reviewable commits.
- Documentation updates.
- Architectural compliance reviews.

# 15. Implementation Checklist

The following checklist shall be completed for every implementation phase.

## Planning

- ☐ Phase scope reviewed.
- ☐ Relevant architectural documents reviewed.
- ☐ Current implementation understood.
- ☐ Acceptance criteria confirmed.

---

## Implementation

- ☐ Business capability implemented.
- ☐ Existing functionality preserved.
- ☐ Clean Architecture maintained.
- ☐ No unrelated changes introduced.

---

## Verification

- ☐ Unit tests pass.
- ☐ Integration tests pass.
- ☐ TypeScript compilation succeeds.
- ☐ Production build succeeds.

---

## Documentation

- ☐ Completion Report prepared.
- ☐ CHANGELOG.md updated (where applicable).
- ☐ ARCHITECTURE.md reviewed (where applicable).
- ☐ PROJECT_RULES.md reviewed (where applicable).
- ☐ Relevant specification documents reviewed (where applicable).

---

## Source Control

- ☐ Changes committed.
- ☐ Git tag created (where applicable).

---

## Phase Closure

- ☐ Acceptance criteria satisfied.
- ☐ Verification Gates passed.
- ☐ Phase formally accepted.

# 16. Change Log

| Version | Date | Description | Author |
|----------|------|-------------|--------|
| 1.0 | YYYY-MM-DD | Initial implementation plan for CR-3 Stay Architecture. | Architecture Team |

---

## Document Status

**Status:** Draft 1

This document defines the approved implementation strategy for Change Request CR-3.

Implementation shall proceed in accordance with the architectural baseline established by the approved project documentation.

Changes to this implementation plan shall not modify approved business architecture without prior architectural review and approval.

---

# Closing Statement

CR-3 represents the transition from architectural design to implementation.

The business architecture, software architecture, and operational workflows governing the Stay domain have been approved and frozen prior to implementation.

The objective of CR-3 is therefore not to redesign the Stay domain, but to faithfully realise the approved architecture through disciplined, incremental implementation.

Successful completion of CR-3 will establish the Stay domain as the operational foundation for subsequent enhancements to Finance, Reporting, Maintenance, Visitor Management, and future RPGMS 2.0 capabilities.

