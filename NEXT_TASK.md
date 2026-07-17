# NEXT_TASK.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-007
Version         : 2.3
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-18

------------------------------------------------------------------------------
Current Task
------------------------------------------------------------------------------

Task ID

SPR-5.3-001

Title

Sprint 5.3 – Bed Allocation & Occupancy View

------------------------------------------------------------------------------
Objective
------------------------------------------------------------------------------

Develop a view of bed allocations and occupancies, enabling visual representations of resident assignments to specific beds.

------------------------------------------------------------------------------
Scope
------------------------------------------------------------------------------

Included

- Add resident allocation badges to BedCards.
- Develop layout tools to visualize occupied/vacant beds.
- Support assigning/unassigning mock resident data to vacant beds.
- Maintain stats updates in real-time.

Excluded

- Supabase integration (which will follow in subsequent database sprints)
- Finance ledger updates for allocations

------------------------------------------------------------------------------
Acceptance Criteria
------------------------------------------------------------------------------

Sprint 5.3 is complete when:

- BedCards render resident assignments accurately.
- Occupancy metrics are updated immediately.
- Mock allocations can be toggled or created in the UI.
- Build succeeds.
- Lint succeeds.

------------------------------------------------------------------------------
Dependencies
------------------------------------------------------------------------------

Required Documents

- PROJECT_RULES.md
- docs/ARCHITECTURE.md

------------------------------------------------------------------------------
Status
------------------------------------------------------------------------------

Ready

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------