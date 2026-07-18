# RPGMS 2.0 – Architecture

**Version:** 1.1  
**Status:** Active  
**Last Updated:** 17 July 2026

---

# 1. Purpose

This document defines the software architecture of RPGMS 2.0.

Its purpose is to ensure the application remains simple, consistent, maintainable, and scalable throughout its lifetime.

This document describes **how the application is organized**. It does **not** describe business rules, implementation details, or future roadmap items.

---

# 2. Architecture Principles

The following principles guide every architectural decision.

## 2.1 Business First

The application is organized around business capabilities rather than technical layers.

Examples:

- Dashboard
- Residents
- Accommodation
- Finance
- Electricity
- Settings

Business modules own their own implementation and encapsulate their business logic.

---

## 2.2 Keep It Simple

Architecture should remain as simple as possible.

Avoid unnecessary abstractions.

Avoid creating folders or services "just in case."

Introduce complexity only when there is a demonstrated need.

---

## 2.3 Feature First

Business functionality belongs inside Feature modules.

Reusable functionality belongs inside Shared modules.

---

## 2.4 Single Responsibility

Every folder should have one clearly defined purpose.

If the responsibility cannot be described in one sentence, the folder structure should be reconsidered.

---

## 2.5 Shared Before Duplicate

If functionality is reused by multiple business modules, move it into a shared location.

Do not duplicate code across features.

---

## 2.6 Derive Before Store

Whenever information can be calculated from existing data, it should be derived instead of stored.

Examples:

- Flat Capacity
- Bed IDs
- Outstanding Balance
- Running Totals

Derived data reduces inconsistency and simplifies maintenance.

---

# 3. Repository Structure

```text
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

```text
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

- App
- Router
- Providers

---

## assets

Static assets.

- Images
- Icons
- Fonts

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

```text
features/

dashboard/
accommodation/
residents/
finance/
electricity/
```

As features grow, they may contain:

- components
- hooks
- services
- types
- utils
- validation

Everything related to a business capability should remain together.

---

## services

Application-wide services.

Examples:

- Supabase client
- Authentication
- Storage

Business-specific services belong inside their respective feature.

---

## theme

Material UI theme configuration.

Global styling.

Design tokens.

---

## types

Shared application types.

Business-specific types belong inside their feature.

---

## utils

Pure helper functions.

Utilities should:

- be deterministic
- have no side effects
- remain framework independent

Business-specific utilities belong inside their owning feature.

---

# 6. Dependency Rules

Dependencies should always flow inward.

```text
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

Rules:

- Lower layers must never depend on higher layers.
- Features should not depend on implementation details of other features.
- Shared modules must never depend on business modules.

---

# 7. Naming Conventions

## Folders

- lowercase

## Files

- PascalCase → React Components
- camelCase → utilities
- camelCase → hooks
- camelCase → services

Examples:

```text
ResidentCard.tsx
MainLayout.tsx

generateBeds.ts
currency.ts

supabase.ts

useResidents.ts
```

---

# 8. Architectural Decisions

Major architectural decisions must be documented in:

`docs/DECISIONS.md`

Architecture should never evolve without recording **why** the change was made.

---

# 9. Documentation Hierarchy

| Document | Responsibility |
|-----------|----------------|
| README.md | Project overview |
| PROJECT_RULES.md | Engineering rules |
| AI_CONTEXT.md | Project context |
| AI_INSTRUCTIONS.md | AI implementation guidance |
| ARCHITECTURE.md | Software architecture |
| DECISIONS.md | Architectural decisions |
| ROADMAP.md | Product roadmap |
| BACKLOG.md | Deferred work |
| CHANGELOG.md | Project history |
| SESSION.md | Current sprint |
| NEXT_TASK.md | Immediate implementation task |

Each document has a single responsibility.

---

# 10. Guiding Principle

The objective of this architecture is **clarity over cleverness**.

The best architecture is the one that allows future development to remain predictable, maintainable, and understandable.

No new top-level folders may be added to `src` without an Architecture Decision.

The top-level `src` structure is considered stable.

Feature modules may evolve internally without affecting the overall architecture.

---

# 11. Architecture Stability

The following require architectural review:

- Top-level folders
- Dependency direction
- Feature organisation
- Shared infrastructure

Any approved change must be documented in:

`docs/DECISIONS.md`

---

# 12. Development Assets

The `prompts/` folder contains reusable AI implementation prompts, sprint specifications, and development templates.

It is part of the development workflow but is **not** part of the application runtime.

---

# 13. Accommodation Module Architecture (Sprint 4.3)

## Domain Model

```text
Flat
│
├── Flat Details
│
├── Areas
│     ├── Area Name
│     ├── Bed Prefix
│     ├── Bed Count
│     ├── Default Rent
│     └── Default Deposit
│
└── Generated Beds
      ├── Bed Code / Name
      ├── Status
      ├── Resident Name
      ├── Default Rent
      └── Default Deposit
```

---

## Business Flow

```text
Flat
    ↓
Areas
    ↓
generateBeds()
    ↓
Generated Beds
    ↓
Capacity
```

Capacity is always derived from generated beds.

---

## Design Principles

- A Flat is composed of one or more Areas.
- Areas define the accommodation layout.
- Beds are generated by the system.
- Bed IDs are never manually entered.
- Capacity is calculated automatically.
- Business logic remains independent of the UI.

---

## Single Source of Truth

`generateBeds()` is the authoritative business utility responsible for:

- Bed generation
- Bed numbering
- Capacity calculation

It is consumed by:

- Live Layout Preview
- Flat Draft generation
- Future Edit Flat workflow
- Future persistence layer

Any future feature requiring bed generation must reuse this utility.

---

## UI Responsibilities

The Add Flat dialog is responsible only for:

- Collecting user input
- Performing validation
- Normalizing display values
- Invoking `generateBeds()`
- Assembling the Flat Draft object

Business calculations remain outside the UI.

---

## Architectural Outcome

Sprint 4.3 established the canonical Accommodation architecture:

```text
Flat
    ↓
Areas
    ↓
Generated Beds
```

Future Accommodation features—including Edit Flat, Occupancy Management, and Resident Allocation—will build upon this model without changing the core hierarchy.

---

# 14. Resident Module Architecture (Sprint 6.1 - 6.5)

## Domain Model

```text
Resident
├── id (string)
├── residentCode (string)
├── fullName (string)
├── mobileNumber (string)
├── documentType (DocumentType)
├── documentNumber (string)
├── joiningDate (string)
├── flatId (string)
├── allocatedBedIds (string[])
├── agreedRent (number)
├── agreedDeposit (number)
├── status (ResidentStatus)
├── createdAt (string)
└── updatedAt (string)
```

## System Managed Fields

The system manages the following fields internally:
* `residentCode`: Automatically generated code.
* `status`: Set automatically to `ACTIVE` upon creation.
* `createdAt` / `updatedAt`: Timestamps of creation/modification.

## Resident Draft Model

The onboarding flow uses a subset of the fields represented as `ResidentDraft`:
* `fullName`, `mobileNumber`, `documentType`, `documentNumber`, `joiningDate`, `flatId`, `allocatedBedIds`, `agreedRent`, `agreedDeposit`.

---

## Resident Onboarding Wizard (Sprint 6.2 - 6.4)

A three-step horizontal Stepper workflow is introduced to handle resident onboarding:
1. **Resident Details**: Collects user identification (Full Name, Mobile Number, Document Type, and Document Number) with required-field validation.
2. **Accommodation Details**: Handles flat selection (filtering for vacant beds), bed allocation (grouped by Area), joining date inputs, and pricing rules.
3. **Confirmation Summary**: Displays a clean three-column summary dividing Resident Identity, Accommodation allocation, and Commercial terms before final submission.

All wizard state is driven by React local state tracking a `ResidentDraft` instance as the single source of truth, ensuring input values are preserved during backward/forward navigation.

### Pricing Summation and Override Rules (Sprint 6.3)

* **Auto-pricing**: Rent and Deposit sums are calculated automatically by accumulating the default Rent and Deposit properties of all selected beds.
* **Manual Overrides**: Operators can override either Rent or Deposit with custom values. These overrides are locked to prevent recalculation from overwriting them.
* **Recalculation Resets**: Recalculation triggers resume if the Flat selection changes, or if the operator explicitly clicks the "Reset to default pricing" action.

### Onboarding Persistence and Bed Status Synchronization (Sprint 6.4)

* **Transactional Consistency**: Saving the onboarded resident and updating the allocated beds' occupancy status are executed as a single atomic transaction using `localStorage` updates.
* **Bed Synchronization**: Selected beds are marked as `OCCUPIED`, and the resident's title-case name is associated with the bed records. Unrelated beds are left untouched.
* **Commercial Separability**: Resident `agreedRent` and `agreedDeposit` are persisted directly to the resident object, preventing them from overwriting default bed configurations.
* **Code Generation**: A sequence code generator yields keys (in `Rxxxxxx` format) by finding the highest integer of the active sequence and incrementing it.

---

## Navigation and Routing Architecture (Sprint 6.5 - 7)

The Residents module follows a standard master-detail navigation workflow:
* `/residents`: Default registry table view supporting inline search query filters, status selectors, and a layout action button routing to `/residents/new`. In Sprint 7, it displays operational summary cards (Total, Active, On Notice, Checked Out) and allows search queries to match allocated beds.
* `/residents/new`: Hosts the onboarding wizard. Upon successful creation, the wizard triggers a post-submit navigation callback redirecting the operator back to the landing table.
* `/residents/:residentId`: Hosts the editable resident profile details workspace.

### Profile Workspace and Read/Edit Modes (Sprint 7)

* **Redesigned Workspace Header**: Aggregates the resident's name, unique resident code, active status badge, current flat allocation, bed allocations, and joining date (e.g. `Joined 17 Jul 2026`).
* **Editable Inputs Mapping**: Restricts editing access strictly to Identity (Full Name, Mobile Number, Document Type, Document Number) and Commercial Agreements (Agreed Rent, Agreed Deposit) using local state edit forms.
* **Locked Field Boundaries**: Prevents editing of structural parameters (Resident Code, ID, Status, Joining Date, Flat, Bed Allocations, and Creation timestamps).
* **Validation Hardening**: Enforces input validation (non-empty fields, correct number entry bounds, and title casing normalization on save) while updating local database records in `localStorage`.

Add a new section (or ADR if you're maintaining architecture decisions) covering:

Resident Person vs Admission (Stay) model.
A resident can have multiple admissions over their lifetime.
Resident Code and Resident ID remain permanent.
Each admission has its own:
Accommodation
Commercial terms
Contract terms
Billing
Ledger
Lifecycle
Readmission creates a new Admission, not a new Resident.

Also document the locked business rules:

Joining Date is immutable.
Billing Day is independent of Joining Date.
Default Lock-in Period = 3 months (configurable).
Default Notice Period = 30 days (configurable).
Deposit recommendation is based on contract rules.
Operator overrides require a reason.
Cancelling a notice creates a new Admission/Contract with a fresh lock-in period.
Only one active notice is permitted at any time.