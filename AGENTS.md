# AGENTS.md — RPGMS 2.0 (OpenCode Execution Adapter)

Thin execution adapter. It does not define RPGMS policy; RPGMS
documentation remains authoritative.

    RPGMS governance/documentation
            ↓
        AGENTS.md
            ↓
         OpenCode
            ↓
         Model

## 1. Authority
- RPGMS documentation governs all work; AGENTS.md only operationalizes it.
- Follow the authority hierarchy in AI_GOVERNANCE.md; when instructions
  conflict, the higher-authority document wins. Ask rather than assume.
- Never invent business rules; they live in the authoritative docs.

## 2. Repository orientation
- Feature-first Clean Architecture; business modules under src/features/<domain>/.
- Layered: Presentation → Application → Domain → Infrastructure → Persistence.
- Each business capability has exactly one owning domain; never duplicate ownership.
- See AI_CONTEXT.md for full context — this file is not a substitute.

## 3. Mandatory startup behaviour (before modifying anything)
- Verify repository identity before modifying anything; run `git rev-parse
  --show-toplevel`, `git status` and `git log --oneline -5`, and confirm the
  resolved repository root is the expected RPGMS checkout. Multiple physical
  clones can share the same branch and HEAD, so verify the path, not just the
  branch.
- Read the required RPGMS AI governance/instruction documents and relevant
  current-state documents according to the task and established RPGMS session
  protocol. Use DOCUMENTATION_INDEX.md and the existing authority hierarchy
  to determine what is relevant.
- Read the task's relevant architecture/domain/business docs and the existing
  implementation before changing it.
- Identify the owning domain and canonical source of truth for the change.
- Preserve all pre-existing uncommitted work; do not disturb it.

## 4. Architecture protection
- Respect domain ownership and layer boundaries (docs/ARCHITECTURE.md).
- Respect the Architecture Freeze Register (AI_GOVERNANCE.md §26).
- Follow established RPGMS patterns; extend rather than redesign.
- If repository evidence contradicts a requested implementation location,
  stop and challenge the premise before implementing.

## 5. Scope discipline
- Implement only the approved scope; no unrelated refactoring or speculative
  cleanup; no new dependencies; no frozen-architecture changes.
- Do not modify unrelated domains or pre-existing user changes.

## 6. Verification (after implementation)
- Run focused tests, then the broader suite (`npm run test`).
- Run `npm run build` and `npm run lint`.
- Inspect the final diff; distinguish pre-existing failures from introduced ones.
- Review documentation impact; report final `git status`.

## 7. Documentation synchronization
- If a change affects business behaviour, architecture, domain boundaries,
  persistence, workflow, or significant project structure, review the relevant
  RPGMS documentation for accuracy. No speculative doc changes.

## 8. Git safety
- Never commit, push, merge, rebase, reset, force checkout, rewrite history,
  force push, or discard unrelated changes unless explicitly authorized.
- Never run an unsolicited `git pull`; keep repository state stable unless the
  task explicitly requires a repository operation.

## 9. Authoritative references (point, don't duplicate)
- DOCUMENTATION_INDEX.md · AI_GOVERNANCE.md · AI_CONTEXT.md · AI_INSTRUCTIONS.md
- AI_SESSION_PROTOCOL.md · SESSION.md · NEXT_TASK.md · PROJECT_RULES.md
- docs/ARCHITECTURE.md · docs/DOMAIN_MODEL.md · docs/BUSINESS_RULES.md
- docs/BUSINESS_CONSTITUTION.md
- Relevant module specs under docs/ and existing code under src/features/
