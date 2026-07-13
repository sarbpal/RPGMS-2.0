# RPGMS 2.0 - Architecture Decisions

This document records all major architectural and business decisions.

Only decisions affecting the long-term direction of the project should be recorded here.

---

# Decision 001

**Date:** 13-Jul-2026

## Title

Ledger is the only source of truth.

## Decision

All financial information shall be derived from ledger entries.

Balances will never be stored.

Reports, dashboards, outstanding amounts and statements shall always be calculated from the ledger.

## Status

Accepted

---

# Decision 002

**Date:** 13-Jul-2026

## Title

Separate Deposit Ledger

## Decision

Security Deposit transactions shall be maintained in a separate ledger.

Resident Ledger and Deposit Ledger will never be combined.

## Status

Accepted

---

# Decision 003

**Date:** 13-Jul-2026

## Title

Single PG Architecture

## Decision

Version 1 supports only one PG.

Multi-property support is outside the MVP scope.

## Status

Accepted

---

# Decision 004

**Date:** 13-Jul-2026

## Title

Accommodation First

## Decision

The business flow is:

Flat
↓

Bed
↓

Rent
↓

Resident

Residents cannot exist without a bed.

## Status

Accepted

---

# Decision 005

**Date:** 13-Jul-2026

## Title

MVP First

## Decision

Every sprint must produce deployable software.

Features not required for daily PG operations are postponed.

## Status

Accepted

Decision 006 — Flatten Repository Structure

The React application is the primary application in RPGMS 2.0. The repository is flattened so that the Vite project resides at the repository root. Project documentation is organized under docs/. This reduces duplicate configuration, simplifies development, and matches the current single-application architecture.

## Decision 006 — Repository Flattening

**Status:** Accepted

### Decision

The React/Vite application has been moved from the `/app` directory to the repository root.

### Rationale

The repository contains a single application with Supabase as the backend. Maintaining two project roots created duplicate configuration files (`package.json`, `package-lock.json`, and `.gitignore`) without providing architectural benefits.

Flattening the repository simplifies:

* Development
* Dependency management
* Build configuration
* Deployment
* Project onboarding

### Consequences

* The repository now has a single application root.
* There is only one `package.json`.
* Future modules will be developed from this unified structure.
Repository flattened.
Feature-first architecture adopted.
Shared layout components under components/layout.
No core module at this stage.
Desktop-first application.