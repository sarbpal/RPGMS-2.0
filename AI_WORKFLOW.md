# AI_WORKFLOW.md

# RPGMS Version 2.0
## AI Development Workflow

Version: 1.0
Status: Active
Last Updated: July 2026

---

# Purpose

This document defines the standard development workflow for all AI assistants contributing to RPGMS Version 2.0.

This workflow applies equally to:

- ChatGPT
- Gemini Antigravity
- Codex
- Claude
- Human Developers

Every contributor must follow the same engineering process.

---

# Core Philosophy

Understand first.

Implement second.

Review third.

Never generate code before understanding the project.

---

# Development Lifecycle

Every task follows the lifecycle below.

```
Understand
    ↓
Plan
    ↓
Implement
    ↓
Verify
    ↓
Report
    ↓
Review
    ↓
Approve
    ↓
Commit
```

No step should be skipped.

---

# Phase 1 – Understand

Before writing code, review the current project state.

Read the following documents:

1. SESSION.md
2. CHANGELOG.md

Then read additional documents if required:

- AI_CONTEXT.md
- AI_INSTRUCTIONS.md
- PROJECT_RULES.md
- UI_BLUEPRINT.md
- ARCHITECTURE.md
- BUSINESS_RULES.md

Understand:

- Current sprint
- Current objective
- Completed work
- Pending work
- Project architecture
- Business context

Do not begin implementation until the task is fully understood.

---

# Phase 2 – Plan

Before coding:

Summarize:

- Scope
- Files to create
- Files to modify
- Architectural decisions
- Risks
- Questions

If any business rule is unclear:

Stop.

Ask for clarification.

Never assume business logic.

---

# Phase 3 – Implement

Implement only the approved scope.

Do not:

- Add extra features
- Expand the sprint
- Refactor unrelated modules
- Introduce unnecessary dependencies

Follow:

- PROJECT_RULES.md
- UI_BLUEPRINT.md
- ARCHITECTURE.md

Prefer:

- Small commits
- Reusable components
- Simple solutions

---

# Scope Discipline

Stay within the approved sprint.

Do not implement future sprint functionality.

Example:

Sprint 4

✔ Accommodation Foundation

✘ Resident Allocation

✘ Billing

✘ Supabase Integration

Future work belongs to future sprints.

---

# Phase 4 – Verify

Implementation is not complete until verification succeeds.

Run:

```
npm run build
```

Run:

```
npm run lint
```

If either command fails:

1. Identify the issue.
2. Explain the root cause.
3. Fix the issue.
4. Re-run verification.
5. Report successful results.

Never leave the repository in a broken state.

---

# Phase 5 – Report

After implementation provide:

## Files Created

List all newly created files.

---

## Files Modified

List every modified file.

---

## Architectural Decisions

Explain important design decisions.

Explain why they were made.

---

## SESSION.md Update

Suggest updates.

Do not modify unless requested.

---

## CHANGELOG.md Update

Suggest changelog entries.

---

## Git Commit Message

Provide a meaningful commit message following Conventional Commits.

Example:

```
feat(accommodation): implement Sprint 4.1 page shell
```

---

# Phase 6 – Product Owner Review

Wait for review.

Do not continue implementation.

Do not start the next sprint.

Respond to review comments.

Apply refinements if requested.

---

# Phase 7 – Approval

Implementation is considered approved only after explicit Product Owner confirmation.

Approval should include:

- Functional review
- UI review
- Architecture review

---

# Phase 8 – Commit

After approval:

Update documentation.

Commit changes.

Push only when requested.

---

# Definition of Done

A task is complete only when:

✓ Implementation finished

✓ Scope respected

✓ Build succeeds

✓ Lint succeeds

✓ Documentation updated

✓ Product Owner review completed

✓ Approval received

✓ Commit completed

---

# AI Responsibilities

Every AI assistant must:

- Read documentation before coding.
- Understand the business workflow.
- Respect project architecture.
- Follow UI principles.
- Stay within sprint scope.
- Explain architectural decisions.
- Verify build and lint.
- Ask questions when requirements are unclear.

Never assume business rules.

---

# Business First Principle

All implementation decisions follow this order:

1. Business Requirements
2. User Workflow
3. Architecture
4. Code
5. Visual Design

Technology exists to support the business.

---

# Communication Guidelines

When responding after implementation:

Always provide:

- Summary
- Files created
- Files modified
- Decisions
- Risks
- Suggestions

Avoid unnecessary explanations.

Be concise and structured.

---

# Error Handling

If an issue occurs:

- Stop implementation.
- Explain the issue.
- Provide the root cause.
- Suggest solutions.
- Wait if approval is required.

Never hide build or lint failures.

---

# Documentation Discipline

Code changes should be reflected in documentation.

When appropriate, suggest updates to:

- SESSION.md
- CHANGELOG.md
- ROADMAP.md
- UI_BLUEPRINT.md
- ARCHITECTURE.md

Documentation is part of the deliverable.

---

# Continuous Improvement

Each completed sprint should improve:

- Code quality
- Documentation quality
- Development workflow
- AI collaboration

The workflow itself should evolve as the project matures.

---

# Final Principle

RPGMS Version 2.0 is built through disciplined, incremental development.

Small, verified improvements are preferred over large, unreviewed changes.

Every implementation should leave the project in a better state than before.

---

End of Document