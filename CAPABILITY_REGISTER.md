# RPGMS 2.0

# CAPABILITY_REGISTER.md

1. Purpose

2. Scope

3. Capability Lifecycle

4. Capability Status Definitions

5. Capability Register

6. Capability Completion Matrix

7. Capability Release Tracker

8. Current Focus

9. Next Priorities

10. Change Log

---

## Document Information

| Item | Value |
|------|-------|
| Document | CAPABILITY_REGISTER.md |
| Project | RPGMS 2.0 |
| Version | 1.0 |
| Status | Active |
| Classification | Operational Governance Document |
| Owner | Project Architect |
| Authority | Operational |
| Last Updated | July 2026 |

---

## Document Status

This document records the implementation status of every business capability within RPGMS 2.0.

Unlike the strategic governance documents, this document is expected to evolve throughout the implementation of the project.

It shall be updated whenever a business capability changes implementation status, maturity, or release readiness.

---

# 1. Purpose

The Capability Register provides a single operational view of the implementation status of RPGMS 2.0.

It records the maturity, implementation progress, release status, and operational readiness of every business capability defined by the Business Constitution and the Implementation Strategy.

This document serves as the primary operational reference for sprint planning, implementation tracking, release management, and project progress assessment.

---

# 2. Scope

This document records:

- Business capabilities
- Capability Releases
- Capability maturity
- Implementation status
- Release readiness
- Current implementation focus
- Immediate implementation priorities
- Significant capability status changes

This document does not define business rules, software architecture, or implementation strategy.

Those responsibilities remain with the constitutional and strategic governance documents.

---

# 3. Capability Lifecycle

Every business capability shall progress through a common implementation lifecycle.

Planned

↓

In Progress

↓

Functional

↓

Production Ready

A capability shall only progress to the next stage when it satisfies the requirements defined by the project's Definition of Done.

The objective is to ensure that every capability reaches Production Ready through measurable, well-governed implementation rather than incremental feature accumulation.

# 4. Capability Status Definitions

Every business capability shall be assigned both an implementation status and a maturity level.

The implementation status reflects the current stage of development, while the maturity level indicates the operational readiness of the capability.

---

## 4.1 Implementation Status

| Status | Description |
|----------|-------------|
| Planned | The capability has been defined but implementation has not yet started. |
| In Progress | Active implementation is underway. Business workflows are incomplete. |
| Functional | The complete business workflow operates successfully under normal conditions. Further hardening, testing, and documentation may still be required. |
| Production Ready | The capability satisfies the Definition of Done and is suitable for day-to-day production use. |

---

## 4.2 Capability Maturity

The project adopts the Capability Maturity Model defined in the Implementation Strategy.

| Level | Description |
|---------|-------------|
| Level 0 | Not Started |
| Level 1 | Planned |
| Level 2 | Partial Implementation |
| Level 3 | Functional |
| Level 4 | Production Ready |

---

## 4.3 Progress Principles

Capability status shall always reflect the overall business workflow rather than the completion of individual technical tasks.

A capability shall not be considered Functional unless the complete business workflow executes successfully.

A capability shall not be considered Production Ready unless it satisfies the project's Definition of Done, including implementation, testing, documentation, and operational readiness.

Progress shall always be measured by completed business capabilities rather than by completed source code, user interface screens, or technical components.

# 5. Capability Register

The following register records the current implementation status of every Business MVP capability.

This register serves as the authoritative operational view of implementation progress throughout the project.

| Capability | Release | Priority | Status | Maturity | Current State | Target State |
|------------|---------|----------|--------|----------|---------------|--------------|
| Accommodation Management | CR-1 | Critical | Functional | Level 3 | Substantially Implemented | Production Ready |
| Reservation & Admission Management | CR-2 | Critical | Functional | Level 3 | Completed & Tested | Production Ready |
| Financial Operations | CR-3 | Critical | In Progress | Level 2 | Active Development | Production Ready |
| Operational Services | CR-4 | High | Planned | Level 1 | Not Started | Production Ready |
| Reporting & Analytics | CR-5 | Medium | Planned | Level 1 | Not Started | Production Ready |
| Platform Enhancements | CR-6 | Low | Planned | Level 1 | Not Started | Production Ready |

---

## Register Maintenance

The Capability Register shall be updated whenever:

- A Capability Release begins.
- A capability changes implementation status.
- A capability reaches a new maturity level.
- A capability achieves Production Ready status.
- Significant implementation or architectural decisions affect capability readiness.

This register represents the current operational state of the project and shall remain aligned with the Implementation Strategy.

# 6. Capability Completion Matrix

The Capability Completion Matrix records the implementation completeness of each Business MVP capability across the major implementation areas.

A capability shall only be considered **Production Ready** when all applicable implementation areas have been completed.

| Capability | Business Rules | Domain Model | Application Services | Infrastructure | User Interface | Validation | Testing | Documentation | Production Ready |
|------------|:--------------:|:------------:|:--------------------:|:--------------:|:--------------:|:----------:|:--------:|:-------------:|:----------------:|
| Accommodation Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ☐ | ✓ | ☐ |
| Reservation Management | ✓ | ✓ | ☐ | ☐ | ☐ | ☐ | ☐ | ✓ | ☐ |
| Resident Admission | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ☐ | ✓ | ☐ |
| Stay Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ☐ | ✓ | ☐ |
| Monthly Billing | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ☐ | ✓ | ☐ |
| Payment Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ☐ | ✓ | ☐ |
| Checkout & Settlement | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ☐ | ✓ | ☐ |
| Resident History | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ☐ | ✓ | ☐ |

---

## Completion Indicators

| Symbol | Meaning |
|:------:|---------|
| ✓ | Complete |
| ◐ | Partially Complete |
| ☐ | Not Complete |

---

## Completion Rules

A capability may only be marked **Production Ready** when:

- All applicable implementation areas are complete.
- The capability satisfies the Definition of Done.
- The complete business workflow operates successfully.
- Documentation accurately reflects the implementation.
- Testing has been successfully completed.

The Capability Completion Matrix shall be reviewed before closing every Capability Release.

# 7. Capability Release Tracker

The Capability Release Tracker records the implementation progress of each Capability Release.

A Capability Release shall only be considered complete when all planned deliverables satisfy the Definition of Done and the corresponding business capability reaches Production Ready status.

---

## CR-1 — Accommodation Management

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ✓ |
| Infrastructure | ✓ |
| User Interface | ✓ |
| Business Rules | ✓ |
| Integration | ◐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-2 — Reservation & Admission Management

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ✓ |
| Infrastructure | ✓ |
| User Interface | ✓ |
| Business Rules | ✓ |
| Integration | ✓ |
| Testing | ✓ |
| Documentation | ✓ |
| Production Ready | ◐ |

---

## CR-3 — Financial Operations

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ◐ |
| Infrastructure | ◐ |
| User Interface | ◐ |
| Business Rules | ✓ |
| Integration | ◐ |
| Testing | ◐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-4 — Stay Management

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ✓ |
| Infrastructure | ✓ |
| User Interface | ✓ |
| Business Rules | ✓ |
| Integration | ◐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-5 — Monthly Billing

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ◐ |
| Infrastructure | ◐ |
| User Interface | ◐ |
| Business Rules | ✓ |
| Integration | ☐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-6 — Payment Management

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ✓ |
| Infrastructure | ✓ |
| User Interface | ✓ |
| Business Rules | ✓ |
| Integration | ◐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-7 — Checkout & Settlement

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ◐ |
| Infrastructure | ◐ |
| User Interface | ◐ |
| Business Rules | ✓ |
| Integration | ☐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## CR-8 — Resident History

| Activity | Status |
|----------|:------:|
| Planning | ✓ |
| Domain Model | ✓ |
| Application Services | ◐ |
| Infrastructure | ◐ |
| User Interface | ◐ |
| Business Rules | ✓ |
| Integration | ☐ |
| Testing | ☐ |
| Documentation | ✓ |
| Production Ready | ☐ |

---

## Status Indicators

| Symbol | Meaning |
|:------:|---------|
| ✓ | Complete |
| ◐ | In Progress |
| ☐ | Not Started |

---

## Release Closure Criteria

A Capability Release may only be closed when:

- All planned implementation activities are complete.
- The corresponding business capability satisfies the Definition of Done.
- Documentation has been updated.
- Testing has been completed successfully.
- The capability has been designated **Production Ready**.

# 8. Active Capability Release

This section records the active Capability Release and the immediate implementation objectives.

Only one Capability Release should normally be designated as the current focus.

Upon completion of a Capability Release, this section shall be updated to reflect the next implementation priority.

---

## Active Capability Release

**Capability Release:** CR-3 — Financial Operations

**Implementation Status:** In Progress

**Current Objective**

Establish core financial architecture, double-entry ledger stabilization, dependency injection refactoring, unit test suites, and event integration for Financial Operations.

---

## Current Sprint Objectives

- Complete all remaining business workflows.
- Resolve outstanding implementation gaps.
- Complete integration across participating domains.
- Perform functional testing.
- Update all affected governance and technical documentation.
- Achieve Production Ready status.

---

## Completion Criteria

The current Capability Release shall be considered complete when:

- The business workflow is fully operational.
- All implementation areas satisfy the Capability Completion Matrix.
- The Definition of Done has been satisfied.
- Documentation has been updated.
- Testing has been completed successfully.
- The capability has been designated Production Ready.

---

## Current Risks

No significant implementation risks have been identified.

Any newly identified risks shall be recorded here until resolved.

---

## Notes

This section is expected to change frequently throughout the implementation lifecycle and should always reflect the current operational focus of the project.

# 9. Next Priorities

Following completion of the current Capability Release, implementation shall proceed according to the approved Capability Release sequence.

| Priority | Capability Release | Business Capability | Status |
|----------|--------------------|---------------------|--------|
| 1 | CR-2 | Reservation & Admission Management | Functional |
| 2 | CR-3 | Financial Operations | Active Development |
| 3 | CR-4 | Operational Services | Planned |
| 4 | CR-5 | Reporting & Analytics | Planned |
| 5 | CR-6 | Platform Enhancements | Planned |

Implementation priorities may only change following a significant architectural or business decision.

# 10. Change Log

This log records significant changes to the implementation status of business capabilities.

Routine implementation activities shall not be recorded here.

| Date | Capability | Change | Updated By |
|------|------------|--------|------------|
| August 2026 | Financial Operations (FR-3) | FR-1 & FR-2 completed; Sprint FR-3 (Payment & Billing Core) active. | Project Architect |
| July 2026 | Initial Register | Capability Register established. | Project Architect |


---

## Maintenance Rules

The Capability Register shall be reviewed and updated:

- At the start of each Capability Release.
- Upon completion of a Capability Release.
- When a capability changes implementation status.
- When a capability reaches a new maturity level.
- Before each production release.

The Capability Register shall always reflect the current operational state of the project.

