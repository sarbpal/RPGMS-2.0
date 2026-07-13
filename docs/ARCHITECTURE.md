# RPGMS 2.0 – Architecture

**Version:** 1.0
**Status:** Active
**Last Updated:** 13 July 2026

---

# 1. Purpose

This document defines the software architecture of RPGMS 2.0.

Its purpose is to ensure the application remains simple, consistent, maintainable and scalable throughout its lifetime.

This document describes **how the application is organized**. It does **not** describe business rules, implementation details or future roadmap items.

---

# 2. Architecture Principles

The following principles guide every architectural decision.

## 2.1 Business First

The application is organized around business capabilities rather than technical layers.

Examples:

* Dashboard
* Residents
* Accommodation
* Finance
* Electricity
* Settings

Business modules should own their own implementation.

---

## 2.2 Keep It Simple

Architecture should remain as simple as possible.

Avoid unnecessary abstractions.

Avoid creating folders or services "just in case."

Introduce complexity only when there is a demonstrated need.

---

## 2.3 Feature First

Business functionality belongs inside Feature modules.

Reusable functionality belongs in Shared modules.

---

## 2.4 Single Responsibility

Every folder should have one clearly defined purpose.

If the responsibility cannot be described in one sentence, the folder structure should be reconsidered.

---

## 2.5 Shared Before Duplicate

If functionality is reused by multiple business modules, move it into a shared location.

Do not duplicate code across features.

---

# 3. Repository Structure

```
RPGMS-2.0/

src/
public/
prompts/

README.md
PROJECT_RULES.md
AI_CONTEXT.md
AI_INSTRUCTIONS.md
ROADMAP.md
CHANGELOG.md

docs/
```

The repository contains a single React application.

There is only one project root.

---

# 4. Source Structure

```
src/

app/
assets/
components/
constants/
features/
services/
theme/
types/
utils/

main.tsx
```

The source structure should remain small and understandable.

New top-level folders should only be introduced when they solve a real architectural problem.

---

# 5. Folder Responsibilities

## app

Application bootstrap.

Examples:

* App
* Router
* Providers

---

## assets

Static assets.

Images.

Icons.

Fonts.

---

## components

Reusable UI components shared across multiple business features.

Components should not contain business logic.

---

## constants

Application-wide constants.

No business data.

---

## features

Business modules.

Each feature owns its own implementation.

Example:

```
features/

dashboard/
residents/
finance/
electricity/
```

As features grow, they may contain:

* components
* hooks
* services
* types
* validation

Everything related to a business capability should remain together.

---

## services

Application-wide services.

Examples:

* Supabase client
* Authentication
* Storage

Business-specific services belong inside their respective Feature.

---

## theme

Material UI theme configuration.

Global styling.

Design tokens.

---

## types

Shared application types.

Business-specific types belong inside their Feature.

---

## utils

Pure helper functions.

No business logic.

No side effects.

---

# 6. Dependency Rules

Dependencies should always flow inward.

```
main.tsx

↓

app

↓

features

↓

components

↓

utils
```

Lower layers must never depend on higher layers.

Business features should never import implementation details from other business features.

---

# 7. Naming Conventions

Folders

* lowercase

Files

* PascalCase for React components
* camelCase for utilities
* camelCase for services
* camelCase for hooks

Examples:

```
ResidentCard.tsx
MainLayout.tsx

currency.ts
date.ts

supabase.ts

useResidents.ts
```

---

# 8. Architectural Decisions

Major architectural changes must be recorded in `docs/DECISIONS.md`.

Architecture should not change without documenting the reason.

---

# 9. Documentation Hierarchy

Each document has a single responsibility.

| Document           | Purpose                       |
| ------------------ | ----------------------------- |
| README.md          | Project overview              |
| PROJECT_RULES.md   | Non-negotiable project rules  |
| AI_CONTEXT.md      | AI development context        |
| AI_INSTRUCTIONS.md | AI operating instructions     |
| ARCHITECTURE.md    | Software architecture         |
| DECISIONS.md       | Architecture decision records |
| ROADMAP.md         | Development roadmap           |
| BACKLOG.md         | Deferred work                 |
| CHANGELOG.md       | Change history                |

---

# 10. Guiding Principle

The objective of this architecture is **clarity over cleverness**.

The best architecture is the one that allows future development to remain predictable, maintainable and understandable.
No new top-level folders may be added to src without an Architecture Decision.
The top-level src folder structure is considered stable.

New top-level folders require an architectural review and, if accepted, an entry in docs/DECISIONS.md.

Feature modules may evolve internally without changing the overall architecture.