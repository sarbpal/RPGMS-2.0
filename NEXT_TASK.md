# NEXT_TASK.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-007
Version         : 2.1
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-18

------------------------------------------------------------------------------
Current Task
------------------------------------------------------------------------------

Task ID

SPR-4.5-001

Title

Sprint 4.5 – Edit Flat Workflow

------------------------------------------------------------------------------
Objective
------------------------------------------------------------------------------

Begin implementation of editing flat details, updating areas, and regenerating bed layouts.

------------------------------------------------------------------------------
Scope
------------------------------------------------------------------------------

Included

- Add Edit button on Flat Cards.
- Create Edit Flat Dialog (pre-populated with existing Flat state).
- Allow updating flat description, adding/deleting areas, and updating bed prefix/counts.
- Recalculate capacity and regenerate bed lists on confirmation.
- Save modified Flat object back to the local React state.

Excluded

- Supabase database integration
- Resident relocation/allocation handling during edit

------------------------------------------------------------------------------
Acceptance Criteria
------------------------------------------------------------------------------

Sprint 4.5 is complete when:

- Existing flat details load correctly into the Edit Dialog.
- Modified data updates the parent state immediately.
- Beds are regenerated successfully conforming to generateBeds().
- Build succeeds.
- Lint succeeds.

------------------------------------------------------------------------------
Dependencies
------------------------------------------------------------------------------

Required Documents

- PROJECT_RULES.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md

------------------------------------------------------------------------------
Status
------------------------------------------------------------------------------

Ready

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------