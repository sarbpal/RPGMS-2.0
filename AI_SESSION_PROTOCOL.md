# AI_SESSION_PROTOCOL.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-005
Version         : 1.0
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-07-16
Applies To      : All AI-assisted development sessions

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document defines the standard workflow that every AI assistant must
follow during a development session.

Its purpose is to ensure that all coding sessions are consistent, repeatable,
safe, and aligned with the project's engineering standards.

This document defines the development workflow.

It does not define business rules or coding standards.

------------------------------------------------------------------------------
Session Lifecycle
------------------------------------------------------------------------------

Every development session follows the same lifecycle.

    Start Session
          ↓
    Verify Repository
          ↓
    Read Documentation
          ↓
    Summarize Understanding
          ↓
    Wait for User Approval
          ↓
    Implementation
          ↓
    Review
          ↓
    Build
          ↓
    Lint (if configured)
          ↓
    Update Documentation (if required)
          ↓
    Commit
          ↓
    End Session

------------------------------------------------------------------------------
Phase 1 – Repository Verification
------------------------------------------------------------------------------

Verify that the current workspace is the correct Git repository.

Confirm that the repository contains the expected project structure.

Do not search outside the repository.

If the repository appears incorrect:

- Stop.
- Report the issue.
- Wait for instructions.

------------------------------------------------------------------------------
Phase 2 – Documentation Review
------------------------------------------------------------------------------

Read the following documents in order:

1. DOCUMENTATION_INDEX.md
2. AI_GOVERNANCE.md
3. AI_CONTEXT.md
4. AI_INSTRUCTIONS.md
5. SESSION.md
6. NEXT_TASK.md
7. ROADMAP.md
8. docs/ARCHITECTURE.md

If any required document is missing:

- Report the missing document.
- Stop.
- Wait.

------------------------------------------------------------------------------
Phase 3 – Project Understanding
------------------------------------------------------------------------------

Before writing code, summarize:

- Current project status.
- Current milestone.
- Current sprint.
- Current task.
- Repository status.
- Any identified risks.

Wait for user confirmation before implementing code.

------------------------------------------------------------------------------
Phase 4 – Implementation
------------------------------------------------------------------------------

Implement only the approved task.

Do not:

- Implement future sprint work.
- Add extra features.
- Refactor unrelated code.
- Change architecture.
- Modify business rules.

Keep changes focused and minimal.

------------------------------------------------------------------------------
Phase 5 – Review
------------------------------------------------------------------------------

Review the implementation for:

- Correctness.
- Simplicity.
- Maintainability.
- Architecture compliance.
- TypeScript quality.
- React best practices.
- Material UI consistency.

------------------------------------------------------------------------------
Phase 6 – Quality Verification
------------------------------------------------------------------------------

Before completing implementation:

Run:

    npm run build

If available:

    npm run lint

Verify:

- Build succeeds.
- TypeScript compilation succeeds.
- No obvious code quality issues.
- Acceptance criteria satisfied.

------------------------------------------------------------------------------
Phase 7 – Documentation Review
------------------------------------------------------------------------------

Determine whether the implementation requires updates to:

- SESSION.md
- NEXT_TASK.md
- CHANGELOG.md

If no documentation updates are required, explicitly state that.

------------------------------------------------------------------------------
Phase 8 – Git Readiness
------------------------------------------------------------------------------

Before recommending a commit:

Confirm:

- Working tree status.
- Files modified.
- Build succeeded.
- Documentation reviewed.

The AI assistant shall never:

- Commit automatically.
- Push automatically.
- Force push.
- Rewrite Git history.

Git operations remain under the control of the Project Owner.

------------------------------------------------------------------------------
Phase 9 – Session Closure
------------------------------------------------------------------------------

At the end of the session provide:

Completed Work

Outstanding Work

Risks

Suggested Next Task

Await further instructions.

------------------------------------------------------------------------------
Special Rules
------------------------------------------------------------------------------

Always:

- Follow AI_GOVERNANCE.md.
- Follow AI_CONTEXT.md.
- Follow AI_INSTRUCTIONS.md.
- Respect the Architecture Freeze Register.
- Preserve MVP scope.
- Preserve repository stability.

------------------------------------------------------------------------------
Related Documents
------------------------------------------------------------------------------

- DOCUMENTATION_INDEX.md
- AI_GOVERNANCE.md
- AI_CONTEXT.md
- AI_INSTRUCTIONS.md
- SESSION.md
- NEXT_TASK.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

Version    Date         Description
-------    ----------   --------------------------------------------
1.0        2026-07-16   Initial AI session workflow.

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status          : Active

Approved By     : Project Owner

Approval Date   : 2026-07-16

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------