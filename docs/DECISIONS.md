# RPGMS 2.0 – Architecture Decisions

**Version:** 1.1  
**Status:** Active  
**Last Updated:** 17 July 2026

---

# Purpose

This document records significant architectural decisions made during the development of RPGMS 2.0.

Only long-term decisions affecting the project's architecture, engineering direction, or business model should be documented here.

Each decision records:

- What was decided
- Why it was decided
- Its impact on future development

---

# Decision 001

**Date:** 13 July 2026

## Title

Ledger is the Single Source of Truth

### Decision

All financial information shall be derived from ledger entries.

Balances will never be stored.

Reports, dashboards, outstanding amounts, and statements are calculated directly from the ledger.

### Status

Accepted

---

# Decision 002

**Date:** 13 July 2026

## Title

Separate Deposit Ledger

### Decision

Security Deposit transactions are maintained in a dedicated ledger.

Resident Ledger and Deposit Ledger will never be combined.

### Status

Accepted

---

# Decision 003

**Date:** 13 July 2026

## Title

Single PG Architecture

### Decision

Version 1 supports only one PG.

Multi-property support is intentionally excluded from the MVP.

### Status

Accepted

---

# Decision 004

**Date:** 13 July 2026

## Title

Accommodation First

### Decision

Accommodation forms the foundation of the business.

Business hierarchy:

```text
Flat
    ↓
Area
    ↓
Bed
    ↓
Resident
    ↓
Ledger
```

Residents cannot exist without an allocated bed.

### Status

Accepted

---

# Decision 005

**Date:** 13 July 2026

## Title

MVP First

### Decision

Every sprint must produce deployable software.

Features not required for day-to-day PG operations are deferred to the backlog.

### Status

Accepted

---

# Decision 006

**Date:** 14 July 2026

## Title

Repository Flattening

### Decision

The React/Vite application resides at the repository root.

There is a single application root and a single `package.json`.

### Rationale

The repository contains one application.

Maintaining a nested `/app` folder duplicated configuration without providing architectural benefits.

Flattening simplifies:

- Development
- Dependency management
- Build configuration
- Deployment
- Project onboarding

### Consequences

- Repository has one application root.
- Single `package.json`.
- Feature-first architecture retained.
- Documentation remains under `/docs`.

### Status

Accepted

---

# Decision 007

**Date:** 17 July 2026

## Title

Generated Beds are the Single Source of Truth

### Decision

Beds are generated from Area definitions.

Manual creation of bed identifiers is not permitted.

All Accommodation features requiring bed generation must reuse the `generateBeds()` utility.

### Rationale

A single business utility eliminates duplicate logic and guarantees consistent bed numbering throughout the application.

### Consequences

The following features must reuse `generateBeds()`:

- Live Layout Preview
- Flat Draft generation
- Edit Flat
- Future persistence workflow

### Status

Accepted

---

# Decision 008

**Date:** 17 July 2026

## Title

Derived Capacity

### Decision

Flat Capacity is calculated from generated beds.

Capacity is never manually entered or stored.

### Rationale

Capacity is derived information.

Storing derived values increases the risk of inconsistent data.

### Consequences

Changing Area definitions automatically changes Capacity.

No synchronization logic is required.

### Status

Accepted

---

# Decision 009

**Date:** 17 July 2026

## Title

Accommodation Domain Model

### Decision

The Accommodation module adopts the following canonical hierarchy:

```text
Flat
    ↓
Areas
    ↓
Generated Beds
```

Areas describe the accommodation.

The system generates the beds.

### Rationale

Users should describe the physical accommodation rather than manually creating individual beds.

This reduces manual work while preserving flexibility.

### Consequences

Future modules—including:

- Edit Flat
- Resident Allocation
- Occupancy
- Accommodation Reports

will build upon this hierarchy without changing the underlying model.

### Status

Accepted

---

# Decision 010

**Date:** 17 July 2026

## Title

Business Logic Outside the UI

### Decision

Business calculations belong in reusable utilities.

UI components are responsible only for:

- Collecting user input
- Validation
- Presentation
- Orchestration

### Rationale

Separating business logic from presentation improves maintainability, testability, and reuse.

### Consequences

Business calculations must not be duplicated across React components.

Reusable business utilities become the authoritative implementation.

### Status

Accepted