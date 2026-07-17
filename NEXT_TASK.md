# NEXT_TASK.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-007
Version         : 2.4
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-18

------------------------------------------------------------------------------
Current Task
------------------------------------------------------------------------------

Task ID

SPR-6.2-001

Title

Sprint 6.2 – Residents Checkout & Archival Workflow

------------------------------------------------------------------------------
Objective
------------------------------------------------------------------------------

Implement checkout procedures for residents, including checkout date tracking, formal checkout dialog forms, and automated bed clearance logic upon checkout completion.

------------------------------------------------------------------------------
Scope
------------------------------------------------------------------------------

Included

- Checkout dialog workflow to gather checkout dates.
- Transitioning active residents to Checked Out and Alumni states.
- Automated bed de-allocation upon checkout completion.
- Tracking historical records of checked-out beds.

Excluded

- Supabase integration.
- Refund calculations or deposit settling.

------------------------------------------------------------------------------
Acceptance Criteria
------------------------------------------------------------------------------

Sprint 6.2 is complete when:

- Residents can undergo checkout flow in the UI.
- Beds occupied by checked-out residents are immediately marked vacant.
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