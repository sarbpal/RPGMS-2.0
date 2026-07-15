# RPGMS 2.0 Documentation Index

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-001
Version         : 1.0
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-07-16
Applies To      : RPGMS 2.0 Repository

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document is the master index for all RPGMS 2.0 project documentation.

It provides:

• The recommended documentation reading order
• The purpose of every major document
• The current documentation inventory
• Repository navigation
• Document lifecycle information

Every developer and AI assistant should begin here before working on the
project.

------------------------------------------------------------------------------
Documentation Principles
------------------------------------------------------------------------------

1. Every document has a single responsibility.

2. Every topic has one authoritative source
   (Single Source of Truth).

3. Documentation is treated as part of the product.

4. Documentation evolves under version control.

------------------------------------------------------------------------------
Documentation Reading Order
------------------------------------------------------------------------------

For AI Assistants

1. DOCUMENTATION_INDEX.md
2. AI_GOVERNANCE.md
3. AI_CONTEXT.md
4. AI_INSTRUCTIONS.md
5. SESSION.md
6. NEXT_TASK.md
7. ROADMAP.md
8. CHANGELOG.md
9. docs/ARCHITECTURE.md

For Human Developers

1. README.md
2. DOCUMENTATION_INDEX.md
3. AI_CONTEXT.md
4. docs/ARCHITECTURE.md
5. AI_INSTRUCTIONS.md

------------------------------------------------------------------------------
Repository Structure
------------------------------------------------------------------------------

Repository Root

README.md                    Project overview
DOCUMENTATION_INDEX.md       Documentation entry point

AI_GOVERNANCE.md            AI operating rules
AI_CONTEXT.md               Business context
AI_INSTRUCTIONS.md          Coding standards

SESSION.md                  Current development session
NEXT_TASK.md                Immediate implementation task
ROADMAP.md                  Product roadmap
CHANGELOG.md                Development history

/docs                        Technical documentation
/prompts                     AI prompt library
/src                         Application source code
/public                      Static assets

------------------------------------------------------------------------------
Core Documentation
------------------------------------------------------------------------------

| Document | Purpose | Status | Version |
|----------|---------|--------|---------|
| DOCUMENTATION_INDEX.md | Documentation entry point | Active | 1.0 |
| AI_GOVERNANCE.md | AI operating rules | Draft | 1.0 |
| AI_CONTEXT.md | Business context and product vision | Draft | 1.0 |
| AI_INSTRUCTIONS.md | Coding standards and implementation rules | Draft | 1.0 |
| SESSION.md | Current development session | Active | Current |
| NEXT_TASK.md | Immediate implementation task | Active | Current |
| ROADMAP.md | Product roadmap | Active | Current |
| CHANGELOG.md | Development history | Active | Current |

------------------------------------------------------------------------------
Technical Documentation
------------------------------------------------------------------------------

Located in /docs

ARCHITECTURE.md
BUSINESS_RULES.md
DECISIONS.md
TECH_STACK.md

Additional technical documents may be introduced as the project evolves.

------------------------------------------------------------------------------
AI Prompt Library
------------------------------------------------------------------------------

Located in /prompts

Planned prompts

00_START_SESSION.md
01_IMPLEMENT_TASK.md
02_CODE_REVIEW.md
03_PRE_COMMIT.md
04_END_SESSION.md
05_NEW_FEATURE.md
06_BUGFIX.md

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

Architecture       → docs/ARCHITECTURE.md

Business Rules     → docs/BUSINESS_RULES.md

Coding Standards   → AI_INSTRUCTIONS.md

Current Session    → SESSION.md

Next Task          → NEXT_TASK.md

Roadmap            → ROADMAP.md

Governance         → AI_GOVERNANCE.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

| Version | Date | Description |
|---------|------------|-------------------------------------------|
| 1.0 | 2026-07-16 | Initial documentation index established. |

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status          : Active

Approved By     : Project Owner

Approval Date   : 2026-07-16

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------