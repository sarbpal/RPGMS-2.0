# RPGMS 2.0 Documentation Index

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-001
Version         : 2.0
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-07-18
Applies To      : RPGMS 2.0 Repository

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document is the master index for all RPGMS 2.0 project documentation.

It provides:

• The recommended documentation reading order
• The documentation hierarchy
• The purpose of every major document
• The current documentation inventory
• Repository navigation
• Document lifecycle information

Every developer and AI assistant should begin here before working on the project.

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

------------------------------------------------------------------------------
Documentation Hierarchy
------------------------------------------------------------------------------

RPGMS documentation is organised into four layers.

Layer 1 — Constitutional Documents

Define the permanent business and architectural foundation of the project.

• BUSINESS_BLUEPRINT.md
• BUSINESS_RULES.md
• DOMAIN_MODEL.md
• ARCHITECTURE.md

Layer 2 — AI Governance

Define how AI assistants should understand and contribute to the project.

• AI_GOVERNANCE.md
• AI_CONTEXT.md
• AI_INSTRUCTIONS.md

Layer 3 — Project Documentation

Describe the current state of the project.

• ROADMAP.md
• CHANGELOG.md
• DECISIONS.md
• TECH_STACK.md

Layer 4 — Operational Documents

Support day-to-day development.

• SESSION.md
• NEXT_TASK.md

Higher-level documents always take precedence over lower-level documents if a conflict exists.

------------------------------------------------------------------------------
Documentation Reading Order
------------------------------------------------------------------------------

For AI Assistants

1. DOCUMENTATION_INDEX.md

Constitutional Documents

2. BUSINESS_BLUEPRINT.md
3. BUSINESS_RULES.md
4. DOMAIN_MODEL.md
5. ARCHITECTURE.md

AI Context

6. AI_GOVERNANCE.md
7. AI_CONTEXT.md
8. AI_INSTRUCTIONS.md

Project Status

9. ROADMAP.md
10. CHANGELOG.md
11. SESSION.md
12. NEXT_TASK.md

For Human Developers

1. README.md
2. DOCUMENTATION_INDEX.md

Project Foundation

3. BUSINESS_BLUEPRINT.md
4. BUSINESS_RULES.md
5. DOMAIN_MODEL.md
6. ARCHITECTURE.md

Developer Guidance

7. AI_CONTEXT.md
8. AI_INSTRUCTIONS.md

Project Status

9. ROADMAP.md
10. CHANGELOG.md

------------------------------------------------------------------------------
Repository Structure
------------------------------------------------------------------------------

Repository Root

README.md                    Project overview
DOCUMENTATION_INDEX.md       Documentation entry point

AI_GOVERNANCE.md             AI operating rules
AI_CONTEXT.md                Business context
AI_INSTRUCTIONS.md           Coding standards

SESSION.md                   Current development session
NEXT_TASK.md                 Immediate implementation task

ROADMAP.md                   Product roadmap
CHANGELOG.md                 Development history

/docs                        Constitutional and technical documentation
/prompts                     AI prompt library
/src                         Application source code
/public                      Static assets

------------------------------------------------------------------------------
Constitutional Documentation
------------------------------------------------------------------------------

Located in /docs

| Document | Purpose | Status | Version |
|----------|---------|--------|---------|
| BUSINESS_BLUEPRINT.md | Business vision, objectives and scope | Active | 1.0 |
| BUSINESS_RULES.md | Operational business policies and rules | Active | 1.0 |
| DOMAIN_MODEL.md | Business domains, entities and relationships | Active | 1.0 |
| ARCHITECTURE.md | Software architecture and implementation principles | Active | 1.0 |

These four documents form the constitutional foundation of RPGMS 2.0.

------------------------------------------------------------------------------
Project Documentation
------------------------------------------------------------------------------

| Document | Purpose | Status |
|----------|---------|--------|
| AI_GOVERNANCE.md | AI operating rules | Active |
| AI_CONTEXT.md | Business context and product vision | Active |
| AI_INSTRUCTIONS.md | Coding standards and implementation rules | Active |
| ROADMAP.md | Product roadmap | Active |
| CHANGELOG.md | Development history | Active |
| SESSION.md | Current development session | Current |
| NEXT_TASK.md | Immediate implementation task | Current |

------------------------------------------------------------------------------
Supporting Technical Documentation
------------------------------------------------------------------------------

Located in /docs

DECISIONS.md
TECH_STACK.md

Additional technical documents may be introduced as the project evolves.

------------------------------------------------------------------------------
AI Prompt Library
------------------------------------------------------------------------------

Located in /prompts

00_START_SESSION.md
01_IMPLEMENT_TASK.md
02_CODE_REVIEW.md
03_PRE_COMMIT.md
04_END_SESSION.md
05_NEW_FEATURE.md
06_BUGFIX.md

Additional prompts may be introduced as AI workflows evolve.

------------------------------------------------------------------------------
Document Lifecycle
------------------------------------------------------------------------------

Draft
    ↓
Review
    ↓
Active
    ↓
Superseded
    ↓
Archived

------------------------------------------------------------------------------
Single Source of Truth
------------------------------------------------------------------------------

Business Vision
    → BUSINESS_BLUEPRINT.md

Business Rules
    → BUSINESS_RULES.md

Business Concepts
    → DOMAIN_MODEL.md

Software Architecture
    → ARCHITECTURE.md

AI Governance
    → AI_GOVERNANCE.md

Coding Standards
    → AI_INSTRUCTIONS.md

Current Session
    → SESSION.md

Next Task
    → NEXT_TASK.md

Roadmap
    → ROADMAP.md

Project History
    → CHANGELOG.md

    ## Constitutional Documents

These documents define the long-term principles of RPGMS 2.0 and should be read before making significant architectural or business changes.

1. BUSINESS_BLUEPRINT.md
2. BUSINESS_RULES.md
3. DOMAIN_MODEL.md
4. ARCHITECTURE.md
5. ENGINEERING_BASELINE.md
6. PROJECT_RULES.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

| Version | Date | Description |
|---------|------------|------------------------------------------------|
| 1.0 | 2026-07-16 | Initial documentation index established. |
| 2.0 | 2026-07-18 | Reorganised documentation architecture, introduced constitutional documentation hierarchy and updated reading order. |

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status          : Active

Approved By     : Project Owner

Approval Date   : 2026-07-18

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------