---
name: rpgms-implementation-verification
description: Verify a completed RPGMS implementation using the repository's required tests, build, lint, diff, failure-triage, and final Git-state checks before the agent claims implementation success.
---

# RPGMS Implementation Verification

## Authority
This Skill operationalizes the implementation-verification requirement established by
AGENTS.md §6 and AI_GOVERNANCE.md §27. RPGMS governance documentation and AGENTS.md
remain authoritative. Where this Skill conflicts with higher-authority RPGMS
documentation, the higher-authority document wins.

## When to use
Use after a completed RPGMS implementation task that modified code, before claiming
that tests, build, or lint passed, or that the repository is clean.

## Boundary
This Skill verifies only. It does NOT:
- define business rules or architecture;
- override AGENTS.md or AI_GOVERNANCE.md;
- authorize commits or pushes;
- modify governance documentation;
- perform speculative cleanup;
- act as an architectural-review or general Git-safety procedure.

## Procedure
1. Establish repository state (AGENTS.md §3): confirm repository identity/path
   (`git rev-parse --show-toplevel`), run `git status --short` and `git diff --stat`;
   identify intended changed files; do not disturb pre-existing user changes.
2. Determine the appropriate focused tests for the implementation: use the actual
   repository test structure; prefer the smallest relevant test scope first; do not
   invent test commands.
3. Run the focused tests.
4. Run the broader test suite: `npm run test`.
5. Run: `npm run build`.
6. Run: `npm run lint`.
7. If any command fails: capture the actual failure; determine whether it is related
   to the current implementation; distinguish pre-existing failures from introduced
   ones; never silently label a failure as pre-existing without evidence.
8. Inspect `git diff --stat`, the final relevant diff, and `git status --short`.
9. Verify that only intended implementation changes are present and that pre-existing
   work has not been disturbed.
10. Produce a concise verification report containing actual command results.

## Evidence rule
Never claim tests passed, build passed, lint passed, repository clean, or that only
intended files changed, unless the corresponding state was actually observed and
verified. If verification is incomplete, say so explicitly.

## Report format
Return:

### Implementation Verification

**Repository**
- path:
- branch:
- HEAD:

**Changed files**
- intended:
- observed:

**Focused tests**
- command:
- result:

**Full test suite**
- command:
- result:

**Build**
- command:
- result:

**Lint**
- command:
- result:

**Failure triage**
- pre-existing:
- introduced:
- unresolved:

**Final Git state**
- status:
- diff summary:

**Verification verdict**
- PASS
- PASS WITH PRE-EXISTING FAILURES
- FAIL
- INCOMPLETE

Do not report PASS when required verification has not actually completed.
