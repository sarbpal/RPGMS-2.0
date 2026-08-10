# RPGMS 2.0 Documentation Index

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-001
Version         : 3.0
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-08-05
Applies To      : RPGMS 2.0 Repository

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document serves as the master index for all RPGMS 2.0 project documentation.

It provides:

• The recommended documentation reading order
• The documentation hierarchy
• The purpose of every major document
• The current documentation inventory
• Repository navigation
• Document ownership and lifecycle

This document is the primary entry point into the RPGMS documentation ecosystem.

Every developer and AI assistant should begin here before contributing to the project.

------------------------------------------------------------------------------
Documentation Principles
------------------------------------------------------------------------------

1. Every document has a single responsibility.

2. Every topic has one authoritative source
   (Single Source of Truth).

3. Documentation is treated as part of the product.

4. Documentation evolves under version control.

5. Constitutional documents define the business and architecture.
   Supporting documents implement and operate within that foundation.

6. Governance documents should be rewritten rather than incrementally patched
   when significant structural changes are required.

7. Documentation should reflect the current architecture and product state,
   not historical implementation details.

------------------------------------------------------------------------------
Documentation Hierarchy
------------------------------------------------------------------------------

RPGMS documentation is organised into five layers.

------------------------------------------------------------------------------
Layer 1 - Constitutional Documentation
------------------------------------------------------------------------------

Located in /docs

| Document | Purpose | Status | Version |
|----------|---------|--------|---------|
| BUSINESS_BLUEPRINT.md | Business vision, objectives and scope | Active | Current |
| BUSINESS_RULES.md | Operational business policies and rules | Active | Current |
| DOMAIN_MODEL.md | Business domains, entities and relationships | Active | Current |
| ARCHITECTURE.md | Software architecture and implementation principles | Active | Current |
| BILLING_ENGINE_ARCHITECTURE.md | Authoritative target architecture for Billing Engine lifecycle, claims, concurrency, recovery and retry | Active | 1.1 |
| PROJECT_RULES.md | Constitutional engineering and implementation rules | Active | Current |
| ENGINEERING_BASELINE.md | Established engineering practices and implementation baseline | Active | Current |

These documents collectively define the constitutional foundation of RPGMS 2.0.

All architectural, business, and implementation decisions must remain consistent with these documents.

------------------------------------------------------------------------------
Layer 2 — Engineering Standards
------------------------------------------------------------------------------

Define engineering practices, implementation standards and reusable design patterns.

• PROJECT_ENGINEERING_STANDARD.md

------------------------------------------------------------------------------
Layer 3 — AI Governance
------------------------------------------------------------------------------

Define how AI assistants understand, contribute to and maintain the project.

• AI_GOVERNANCE.md
• AI_CONTEXT.md
• AI_INSTRUCTIONS.md

------------------------------------------------------------------------------
Layer 4 - Project Documentation
------------------------------------------------------------------------------

| Document | Purpose | Status |
|----------|---------|--------|
| MODULE_STATUS.md | Current implementation maturity of all business modules | Active |
| ROADMAP.md | Product roadmap and capability releases | Active |
| CHANGELOG.md | Project implementation history | Active |
| SESSION.md | Current development session summary | Current |
| NEXT_TASK.md | Immediate implementation objective | Current |

These documents describe the current state of the project and evolve continuously throughout development.

------------------------------------------------------------------------------
Layer 5 — Module Specifications
------------------------------------------------------------------------------

Provide detailed functional and implementation specifications for individual business modules.

Example:

• RESIDENT_WORKSPACE_V2_SPECIFICATION.md

Additional module specifications will be introduced as new business capabilities are implemented.

Higher-level documents always take precedence over lower-level documents when conflicts exist.

------------------------------------------------------------------------------
Documentation Reading Order
------------------------------------------------------------------------------

The documentation should be read in the following order to ensure a complete understanding of the project.

------------------------------------------------------------------------------
For AI Assistants
------------------------------------------------------------------------------

### Phase 1 – Project Foundation

1. DOCUMENTATION_INDEX.md

Understand the complete documentation ecosystem.

2. PROJECT_RULES.md

Learn the constitutional engineering rules governing the project.

3. ARCHITECTURE.md

Understand the software architecture, layering, dependency rules, and architectural service boundaries.

4. BILLING_ENGINE_ARCHITECTURE.md

When the task involves billing execution, Billing Runs, claims, retry, recovery, or financial processing orchestration, read the authoritative Billing Engine target architecture. It specializes ARCHITECTURE.md and does not override BUSINESS_RULES.md or DOMAIN_MODEL.md.

5. ENGINEERING_BASELINE.md

Understand the established engineering patterns and implementation principles.

6. BUSINESS_BLUEPRINT.md

Understand the overall business vision and objectives.

7. BUSINESS_RULES.md

Learn the operational rules of the hostel business.

8. DOMAIN_MODEL.md

Understand the business entities, aggregates, and domain relationships.

------------------------------------------------------------------------------
Phase 2 – AI Context
------------------------------------------------------------------------------

9. AI_GOVERNANCE.md

Understand AI operating principles.

10. AI_CONTEXT.md

Understand business context, terminology, and project conventions.

11. AI_INSTRUCTIONS.md

Understand coding standards and implementation workflow.

------------------------------------------------------------------------------
Phase 3 – Project Status
------------------------------------------------------------------------------

12. MODULE_STATUS.md

Understand current implementation maturity.

13. ROADMAP.md

Understand future business capabilities and product direction.

14. CHANGELOG.md

Review recent implementation history.

15. SESSION.md

Review the current development session.

16. NEXT_TASK.md

Understand the immediate implementation objective.

------------------------------------------------------------------------------
Phase 4 – Module Specifications
------------------------------------------------------------------------------

Read only the specification relevant to the current implementation task.

Examples:

- RESIDENT_WORKSPACE_V2_SPECIFICATION.md

Future module specifications will be added as additional business capabilities are implemented.

------------------------------------------------------------------------------
For Human Developers
------------------------------------------------------------------------------

### Phase 1 – Project Orientation

1. README.md

2. DOCUMENTATION_INDEX.md

------------------------------------------------------------------------------
Phase 2 – Project Foundation
------------------------------------------------------------------------------

3. PROJECT_RULES.md

4. ARCHITECTURE.md

5. ENGINEERING_BASELINE.md

6. BUSINESS_BLUEPRINT.md

7. BUSINESS_RULES.md

8. DOMAIN_MODEL.md

------------------------------------------------------------------------------
Phase 3 – Development Guidance
------------------------------------------------------------------------------

9. AI_CONTEXT.md

10. AI_INSTRUCTIONS.md

------------------------------------------------------------------------------
Phase 4 – Project Status
------------------------------------------------------------------------------

11. MODULE_STATUS.md

12. ROADMAP.md

13. CHANGELOG.md

14. SESSION.md

15. NEXT_TASK.md

------------------------------------------------------------------------------
Phase 5 – Module Specifications
------------------------------------------------------------------------------

Read only the specification relevant to the feature being implemented.

------------------------------------------------------------------------------
Repository Structure
------------------------------------------------------------------------------

Repository Root

README.md                           Project overview

DOCUMENTATION_INDEX.md              Documentation entry point

------------------------------------------------------------------------------
Governance Documents
------------------------------------------------------------------------------

PROJECT_RULES.md                    Constitutional engineering rules

AI_GOVERNANCE.md                    AI operating principles

AI_CONTEXT.md                       Business context and AI knowledge

AI_INSTRUCTIONS.md                  AI implementation standards

MODULE_STATUS.md                    Current module maturity

ROADMAP.md                          Product roadmap

CHANGELOG.md                        Project history

SESSION.md                          Current development session

NEXT_TASK.md                        Immediate implementation objective

------------------------------------------------------------------------------
Documentation
------------------------------------------------------------------------------

/docs                              Constitutional and technical documentation

------------------------------------------------------------------------------
Engineering Assets
------------------------------------------------------------------------------

/prompts                           AI prompt library

------------------------------------------------------------------------------
Application
------------------------------------------------------------------------------

/src                               Application source code

/public                            Static assets

------------------------------------------------------------------------------
Future Repository Growth
------------------------------------------------------------------------------

As RPGMS evolves, additional top-level folders may be introduced for:

/scripts                           Development utilities

/tests                             Integration and end-to-end testing

/docs/specifications               Business module specifications

These additions should preserve the existing repository organisation and maintain a clear separation between governance, implementation, and supporting assets.

------------------------------------------------------------------------------
Supporting Technical Documentation
------------------------------------------------------------------------------

Located in /docs

Examples include:

- DECISIONS.md
- TECH_STACK.md
- DEPLOYMENT.md
- INSTALL.md
- ENVIRONMENT.md

Additional technical documentation may be introduced as the project evolves.

These documents support implementation but do not supersede constitutional documents.


------------------------------------------------------------------------------
AI Prompt Library
------------------------------------------------------------------------------

Located in /prompts

The prompt library contains reusable implementation workflows that promote consistent collaboration between developers and AI assistants.

Typical prompts include:

- Session Startup
- Feature Implementation
- Code Review
- Documentation Review
- Bug Fixes
- Pre-Commit Review
- End-of-Session Review

The prompt library evolves alongside the project's engineering workflow.

------------------------------------------------------------------------------
Document Lifecycle
------------------------------------------------------------------------------

Every RPGMS document progresses through a defined lifecycle to ensure quality, consistency, and controlled evolution.

Draft
    ↓
Review
    ↓
Active
    ↓
Frozen
    ↓
Superseded
    ↓
Archived

Lifecycle Definitions

**Draft**

Initial working version under active development.

**Review**

Content is complete and undergoing technical, architectural, or business review.

**Active**

Approved for normal project use and maintained as part of the current documentation baseline.

**Frozen**

Approved as the authoritative reference for a completed capability or project milestone. Changes are limited to defect corrections or formally approved revisions.

**Superseded**

Replaced by a newer version but retained for historical reference.

**Archived**

No longer maintained and preserved only for project history.

...
Supporting Technical Documentation

↓

AI Prompt Library

↓

Document Lifecycle

↓

Single Source of Truth

↓

Module Specifications

↓

Version History


------------------------------------------------------------------------------
Single Source of Truth
------------------------------------------------------------------------------

Every major aspect of RPGMS 2.0 has one authoritative document.

Contributors should always consult the designated document before introducing changes.

| Topic | Authoritative Document |
|-------|-------------------------|
| Business Vision | BUSINESS_BLUEPRINT.md |
| Business Rules | BUSINESS_RULES.md |
| Business Domain Model | DOMAIN_MODEL.md |
| Software Architecture | ARCHITECTURE.md |
| Billing Engine Architecture | BILLING_ENGINE_ARCHITECTURE.md |
| Engineering Rules | PROJECT_RULES.md |
| Engineering Standards | PROJECT_ENGINEERING_STANDARD.md |
| AI Governance | AI_GOVERNANCE.md |
| AI Context | AI_CONTEXT.md |
| AI Implementation Standards | AI_INSTRUCTIONS.md |
| Product Roadmap | ROADMAP.md |
| Module Implementation Status | MODULE_STATUS.md |
| Project History | CHANGELOG.md |
| Current Development Session | SESSION.md |
| Immediate Development Objective | NEXT_TASK.md |
| Module Specifications | Individual Module Specification Documents |

If information appears in multiple documents, the designated Single Source of Truth always takes precedence.

------------------------------------------------------------------------------
Module Specifications
------------------------------------------------------------------------------

Business module specifications provide the detailed functional, operational, and implementation guidance for individual RPGMS capabilities.

Each specification serves as the authoritative reference for its respective module and must remain consistent with the constitutional documents.

Current Module Specifications

| Specification | Status |
|--------------|--------|
| RESIDENT_WORKSPACE_V2_SPECIFICATION.md | MVP Complete – Pending Final Freeze |

Additional module specifications will be added as future business capabilities are designed and implemented.

Examples include:

- RESERVATION_WORKSPACE_SPECIFICATION.md
- ADMISSION_WORKSPACE_SPECIFICATION.md
- FINANCE_WORKSPACE_SPECIFICATION.md
- ELECTRICITY_WORKSPACE_SPECIFICATION.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

| Version | Date | Description |
|---------|------------|------------------------------------------------|
| 3.0 | 2026-08-05 | Documentation Consolidation Sprint (DCS-1): Updated documentation hierarchy, reading order, project governance, repository structure, module specifications, document lifecycle and Single Source of Truth. |
| 2.0 | 2026-07-18 | Reorganised documentation architecture, introduced constitutional documentation hierarchy and updated reading order. |
| 1.0 | 2026-07-16 | Initial documentation index established. |

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------