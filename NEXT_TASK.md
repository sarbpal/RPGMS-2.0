# NEXT TASK

**Last Updated:** July 2026

---

# Project Status

RPGMS 2.0 has successfully completed its architecture and engineering foundation phase.

The project now follows a stable Business-First Clean Architecture and is transitioning into business capability development.

Core reference modules have been established and should serve as implementation standards for future development.

---

# Completed Milestones

## Business Foundation

- ✅ Business Constitution
- ✅ Business Rules
- ✅ Business Model
- ✅ Resident Specification
- ✅ Stay Specification
- ✅ Accommodation Specification
- ✅ Architecture Documentation
- ✅ Engineering Baseline
- ✅ Governance Documentation

## Engineering Foundation

- ✅ Repository Health Audit
- ✅ Resident Reference Module
- ✅ Stay Reference Module
- ✅ Finance Reference Module
- ✅ Accommodation Reference Module

## Accommodation Engineering

- ✅ ACC-001 – Remove Legacy Coupling
- ✅ ACC-002 – Centralise Accommodation Business Rules

---

# Current Project Phase

**Business Capability Development**

The architectural foundation is considered stable.

Future work should focus on delivering business capabilities while preserving the established architecture.

Architectural refactoring should only occur when justified by new business requirements or significant engineering improvements.

---

# Immediate Next Task

## Status

Discovery Required

The next engineering task has not yet been selected.

Before implementing additional code:

1. Review the repository.
2. Identify the highest-value engineering or business capability.
3. Prioritise based on business impact and architectural consistency.
4. Define the next engineering task (e.g. ELE-001, REP-001, MNT-001, etc.).
5. Implement one engineering task at a time.

---

# Candidate Areas

Potential next areas include:

- Electricity
- Reports
- Maintenance
- Settings
- Cross-module integration
- Additional business capabilities
- Performance and scalability improvements

The next task should be selected based on repository analysis rather than following a fixed sequence.

---

# Engineering Workflow

Every engineering task should follow the same workflow:

1. Review project documentation.
2. Understand the existing implementation.
3. Produce an implementation plan.
4. Implement one focused engineering task.
5. Verify:
   - TypeScript compilation
   - Production build
   - Linting
   - Manual testing
6. Review the implementation.
7. Update documentation.
8. Commit as a single engineering task.
9. Push to GitHub.

---

# Documentation Update Policy

After completing each engineering task:

Always review:

- CHANGELOG.md
- NEXT_TASK.md
- ROADMAP.md

Update constitutional documents only when required:

- BUSINESS_RULES.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md
- ENGINEERING_BASELINE.md
- PROJECT_RULES.md

Documentation should be updated only when the implementation changes business behaviour, architecture, or project status.

---

# Project Readiness

| Area | Status |
|------|--------|
| Business Architecture | ✅ Complete |
| Business Model | ✅ Complete |
| Business Rules | ✅ Complete |
| Engineering Baseline | ✅ Complete |
| Governance | ✅ Complete |
| Resident Module | ✅ Reference Module |
| Stay Module | ✅ Reference Module |
| Accommodation Module | ✅ Reference Module |
| Finance Module | ✅ Reference Module |
| Technical Foundation | ✅ Stable |
| Ready for Business Capability Development | ✅ Yes |

---

# Long-Term Objective

Build RPGMS 2.0 into a maintainable, scalable, business-driven property management platform where:

- business requirements drive implementation,
- business rules remain the single source of truth,
- architecture remains clean and modular,
- documentation stays synchronised with development,
- and every engineering task leaves the repository in a better state than it was found.

---

# Session Handover

Before beginning the next session:

- Review this document.
- Review CHANGELOG.md.
- Review ROADMAP.md.
- Confirm whether any architectural documentation requires updating.
- Identify the next highest-value engineering task.
- Avoid unnecessary architectural refactoring.
- Prioritise business capability development.

---

# Engineering Principles

Continue to follow the established project principles:

- Business before implementation.
- Specifications before development.
- Thin Presentation Layer.
- Application Layer coordinates workflows.
- Domain Layer owns business rules.
- Repository Pattern for persistence.
- Ledger remains the single source of truth.
- One engineering task.
- One review.
- One commit.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 3.0 | July 2026 | Rewritten following completion of the architecture and engineering foundation phases, including ACC-001 and ACC-002. Transitioned the project to Business Capability Development. |
| 2.0 | July 2026 | Rewritten to reflect the project architecture and roadmap. |