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