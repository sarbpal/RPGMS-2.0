# NEXT_TASK.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-007
Version         : 2.0
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-17

------------------------------------------------------------------------------
Current Task
------------------------------------------------------------------------------

Task ID

SPR-4.4-001

Title

Sprint 4.4 – Accommodation Persistence & List Integration

------------------------------------------------------------------------------
Objective
------------------------------------------------------------------------------

Complete the integration of the Add Flat workflow with the Accommodation
module.

The Add Flat dialog currently assembles a validated Flat Draft object.
The next objective is to connect this draft to the application state and
prepare the module for future Supabase persistence.

------------------------------------------------------------------------------
Scope
------------------------------------------------------------------------------

Included

- Connect Flat Draft to application state.
- Replace the Developer Preview with the production workflow.
- Refresh the Accommodation list after successful creation.
- Display the newly created Flat immediately.
- Prepare the data model for future Supabase integration.

Excluded

- Database persistence
- Resident allocation
- Edit Flat
- Delete Flat
- Occupancy management

These remain part of future sprints.

------------------------------------------------------------------------------
Acceptance Criteria
------------------------------------------------------------------------------

Sprint 4.4 is complete when:

- Flat creation updates the application state.
- Newly created Flats appear immediately.
- Developer Preview is removed.
- User receives appropriate success feedback.
- Build succeeds.
- Lint succeeds.
- Documentation is updated.
- Product Owner approval obtained.

------------------------------------------------------------------------------
Dependencies
------------------------------------------------------------------------------

Required Documents

- PROJECT_RULES.md
- AI_CONTEXT.md
- AI_INSTRUCTIONS.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- ROADMAP.md

------------------------------------------------------------------------------
Deliverables
------------------------------------------------------------------------------

- Integrated Add Flat workflow
- Updated Accommodation list
- Production-ready create flow
- Clean application state integration

------------------------------------------------------------------------------
After Completion
------------------------------------------------------------------------------

Next Planned Task

Sprint 4.5 – Edit Flat Workflow

Expected objectives:

- Load existing Flat
- Edit Areas
- Regenerate Beds
- Preserve business rules
- Prepare for Resident allocation

------------------------------------------------------------------------------
Status
------------------------------------------------------------------------------

Ready

------------------------------------------------------------------------------
Notes
------------------------------------------------------------------------------

Before implementation:

- Review PROJECT_RULES.md
- Review AI_CONTEXT.md
- Review AI_INSTRUCTIONS.md

Follow the established Accommodation architecture:

Flat
    ↓
Areas
    ↓
generateBeds()
    ↓
Generated Beds

Do not duplicate business logic.

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------