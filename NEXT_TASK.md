# NEXT_TASK.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-007
Version         : 2.6
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-18

------------------------------------------------------------------------------
Current Task
------------------------------------------------------------------------------

Task ID

SPR-6.4-001

Title

Sprint 6.4 – Resident Ledger & Security Deposit Scaffolding

------------------------------------------------------------------------------
Objective
------------------------------------------------------------------------------

Introduce financial ledger entries, rent rules, and security deposit attributes to the Resident domain model and setup read-only summaries on the Resident Profile page.

------------------------------------------------------------------------------
Scope
------------------------------------------------------------------------------

Included

- Add monthly rent and security deposit fields to `Resident` models.
- Display outstanding balance summaries on the Resident Profile page.
- Scaffold basic transactional ledger histories.

Excluded

- Online payment gateway integration.
- Supabase persistence layer.

------------------------------------------------------------------------------
Acceptance Criteria
------------------------------------------------------------------------------

Sprint 6.4 is complete when:

- Profile page shows rent and outstanding dues.
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

Next Session

Sprint 8 – Resident Profile Expansion

- Identity
- Contact
- Address
- Emergency Contact
- References
- Security
- Vehicle
- Contract section (display only)

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------