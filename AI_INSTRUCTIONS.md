# AI_INSTRUCTIONS.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-004
Version         : 1.0
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-07-16
Applies To      : All AI Assistants contributing code to RPGMS 2.0

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document defines the implementation standards that every AI assistant
must follow while writing or modifying code for RPGMS 2.0.

This document explains HOW code should be written.

Business rules belong in AI_CONTEXT.md.

AI behaviour belongs in AI_GOVERNANCE.md.

Before proposing changes to entities, aggregate boundaries, ownership, or business processes, review:

BUSINESS_BLUEPRINT.md
BUSINESS_RULES.md
DOMAIN_MODEL.md
ARCHITECTURE.md

------------------------------------------------------------------------------
Documentation Reading Order
------------------------------------------------------------------------------

Before writing any code, read the following documents in order:

1. DOCUMENTATION_INDEX.md
2. AI_GOVERNANCE.md
3. AI_CONTEXT.md
4. AI_INSTRUCTIONS.md
5. SESSION.md
6. NEXT_TASK.md
7. ROADMAP.md
8. docs/ARCHITECTURE.md

Do not begin implementation until these documents have been reviewed.

------------------------------------------------------------------------------
Repository Rules
------------------------------------------------------------------------------

Treat the currently opened Git repository as the complete project.

Never:

- Search outside the repository.
- Create duplicate projects.
- Create duplicate source files.
- Assume another folder contains newer code.

If required files are missing:

- Report the issue.
- Stop.
- Wait for instructions.

------------------------------------------------------------------------------
General Coding Philosophy
------------------------------------------------------------------------------

Always prefer:

- Simplicity over complexity.
- Working software over perfect software.
- Readability over cleverness.
- Maintainability over shortcuts.
- Small incremental improvements.
- Production-quality code.

Never:

- Over-engineer.
- Invent business rules.
- Introduce unnecessary abstractions.
- Add dependencies without approval.
- Introduce breaking changes without approval.

------------------------------------------------------------------------------
Business Rule Protection
------------------------------------------------------------------------------

Never invent business rules.

If a business rule is unclear:

- Stop.
- Ask the Project Owner.

Business correctness always has higher priority than implementation speed.

The Ledger remains the only financial source of truth.

------------------------------------------------------------------------------
TypeScript Standards
------------------------------------------------------------------------------

- Use strict TypeScript.
- Avoid "any".
- Prefer interfaces for object contracts.
- Use enums only where appropriate.
- Keep types close to their feature.
- Prefer explicit typing over inference when clarity improves readability.
- Remove unused imports and variables.

------------------------------------------------------------------------------
React Standards
------------------------------------------------------------------------------

- Functional components only.
- Use React Hooks.
- Keep components focused on a single responsibility.
- Avoid deeply nested component trees.
- Reuse components whenever practical.
- Keep pages lightweight.
- Keep business logic outside presentation components.

------------------------------------------------------------------------------
Material UI Standards
------------------------------------------------------------------------------

- Use Material UI components whenever possible.
- Follow the existing design system.
- Maintain consistent spacing.
- Avoid unnecessary custom styling.
- Prefer theme values over hard-coded values.

------------------------------------------------------------------------------
Project Structure
------------------------------------------------------------------------------

Follow the existing project structure.

Do not introduce new top-level folders without approval.

Business modules belong under:

src/features/

Shared reusable components belong under:

src/components/

Application infrastructure belongs under:

src/app/

------------------------------------------------------------------------------
Implementation Workflow
------------------------------------------------------------------------------

For every task:

1. Understand the requirement.
2. Review affected files.
3. Implement only the requested scope.
4. Preserve existing behaviour.
5. Review the implementation.
6. Run build.
7. Run lint (when available).
8. Stop.

Do not continue into future sprint work.

------------------------------------------------------------------------------
Modification Rules
------------------------------------------------------------------------------

Modify only the files required for the assigned task.

Avoid:

- Large refactoring.
- File renaming.
- Folder restructuring.
- Public API changes.

Unless explicitly approved.

------------------------------------------------------------------------------
Quality Checklist
------------------------------------------------------------------------------

Before completing any implementation verify:

- Requirements satisfied.
- Architecture preserved.
- TypeScript passes.
- Build passes.
- Lint passes (if configured).
- No dead code introduced.
- No unnecessary dependencies introduced.
- Imports organised.
- Existing functionality preserved.

------------------------------------------------------------------------------
Stop Conditions
------------------------------------------------------------------------------

Stop immediately and ask for guidance if:

- Business rules are unclear.
- Documentation conflicts.
- Repository state is unexpected.
- Architecture changes appear necessary.
- Multiple implementation strategies exist with significant trade-offs.

------------------------------------------------------------------------------
Related Documents
------------------------------------------------------------------------------

- DOCUMENTATION_INDEX.md
- AI_GOVERNANCE.md
- AI_CONTEXT.md
- SESSION.md
- NEXT_TASK.md
- docs/ARCHITECTURE.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

Version    Date         Description
-------    ----------   -----------------------------------------------
1.0        2026-07-16   Initial implementation standards.

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status          : Active

Approved By     : Project Owner

Approval Date   : 2026-07-16

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------