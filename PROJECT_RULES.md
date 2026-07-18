# RPGMS 2.0 – Project Rules

**Version:** 1.1  
**Status:** Active  
**Last Updated:** 17 July 2026

---

# Vision

Build a modern, fast, reliable PG Management System that replaces the existing Google Sheets + Apps Script solution.

Deliver a usable application as quickly as possible while maintaining clean architecture, high code quality, and long-term maintainability.

---

# Guiding Principle

> Build for today's business requirements, not tomorrow's possibilities.

Solve real operational problems first.

Future enhancements will be added incrementally.

---

# Project Objectives

- Replace Google Sheets with a modern web application.
- Preserve existing business workflows.
- Improve usability.
- Reduce manual work.
- Build a strong foundation for future growth.

---

# Technology Stack (Locked)

## Frontend

- React
- TypeScript
- Vite
- Material UI

## Backend

- Supabase
- PostgreSQL

## Deployment

- GitHub
- Vercel

Technology changes require explicit Product Owner approval.

---

# Business Scope

## Current Scope

- Single PG
- Single Administrator
- Desktop First
- Responsive Design

Multi-property support is intentionally excluded from Version 1.

---

# Core Business Principles

## Rule 1 – Ledger is the Single Source of Truth

Outstanding balances, collections, and reports are always calculated from ledger entries.

Running balances are never stored.

---

## Rule 2 – Separate Deposit Ledger

Security Deposit has its own independent ledger.

Deposit transactions are never mixed with the resident ledger.

---

## Rule 3 – Every Financial Event Creates a Ledger Entry

Examples:

- Monthly Rent
- Electricity
- Payment
- Deposit
- Refund
- Discount

---

## Rule 4 – Ledger Entries are Immutable

Corrections are made using reversing entries.

Existing ledger entries are never edited.

---

## Rule 5 – Accommodation Drives the Business

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

Accommodation is the foundation for occupancy, billing, and reporting.

---

## Rule 6 – Resident Lifecycle

Residents progress through four operational states:

- ACTIVE
- ON_NOTICE
- CHECKED_OUT
- ALUMNI

Notice Date automatically suggests:

Checkout Date = Notice Date + 30 days

Checkout Date remains editable.

---

## Rule 7 – Electricity Workflow

```text
Enter Bill
      ↓
Split Bill
      ↓
Automatic Ledger Entries
```

Manual ledger posting is not permitted.

---

# Development Principles

## Ship Working Software

Every sprint must produce working software.

---

## MVP First

Only build features required to operate the PG.

Everything else belongs in the backlog.

---

## No Over Engineering

Do not build for hypothetical future requirements.

Prefer the simplest maintainable solution.

---

## One Feature at a Time

Complete one feature before starting another.

---

## Two-Day Rule

If implementation exceeds approximately two days, split it into smaller deliverables.

---

## Deploy Frequently

Every completed feature should be:

- Committed
- Pushed to GitHub
- Deployed to Vercel
- Tested

---

## Zero Training

The application should be intuitive enough that a new user can operate it without documentation.

---

# MVP Scope

## Dashboard

- Occupancy
- Vacant Beds
- Rent Due
- Collections

---

## Accommodation

- Flats
- Areas
- Beds
- Bed Rent
- Bed Deposit

---

## Residents

- Add Resident
- Edit Resident
- On Notice
- Checkout

---

## Finance

- Resident Ledger
- Deposit Ledger
- Record Payments
- Outstanding

---

## Electricity

- Monthly Bill Entry
- Automatic Bill Split
- Automatic Ledger Posting

---

## Settings

- Basic Configuration

---

# Backlog

The following features are intentionally postponed.

- Laundry
- Complaints
- Visitor Register
- Notifications
- AI Assistant
- Advanced Reports
- Inventory
- Vendor Management
- Multi-PG Support
- Analytics

---

# Coding Standards

- TypeScript only
- No duplicated business logic
- Reusable components
- Clear naming
- Small focused functions
- No dead code

---

# Build Integrity

Every milestone must end with:

- `npm run build` succeeds
- `npm run lint` succeeds (when applicable)
- Application runs without runtime errors

A milestone is not complete until the project is runnable.

---

# Minimal Dependencies

Every dependency must have a clear purpose.

Before adding a package, ask:

1. Can React already do this?
2. Can we implement it ourselves simply?
3. Does this dependency save significant development time?

If the answer is **No**, do not install it.

---

# Definition of Done

A task is complete only when:

- ✓ Code compiles
- ✓ No TypeScript errors
- ✓ Build succeeds
- ✓ Tested locally
- ✓ Documentation updated (when applicable)
- ✓ Pushed to GitHub
- ✓ Deployed to Vercel
- ✓ Accepted by the Product Owner

---

# Data Standards

- Codes and identifiers are stored in **UPPERCASE**.
- Display names are normalized to **Title Case**.
- Descriptions preserve user formatting.
- Leading and trailing whitespace is removed automatically.

---

# Business Standards

Never ask the user to enter information that the system can derive.

Examples:

- Flat Capacity
- Bed IDs
- Running Totals
- Outstanding Balances

Users describe the business.

The system derives the operational data.

---

# Architecture Standards

Business logic belongs in reusable utilities.

UI components are responsible only for:

- User interaction
- Presentation
- Validation
- Orchestration

Business calculations must never be duplicated across UI components.

---

# UX Standards

Optimize keyboard navigation for the primary business workflow.

Destructive actions should not interrupt normal data entry.

Prefer:

- Smart defaults
- Inline validation
- Live feedback
- Automatic normalization

over manual user effort.

---

# Decision Rule

Whenever a design decision is required, ask:

> "Does this help us deliver a usable application faster without creating major future problems?"

If **Yes**, implement it.

If **No**, postpone it.

---

# Non-Negotiables

The following principles require explicit Product Owner approval before they can be changed:

- Technology Stack
- Ledger is the Single Source of Truth
- Separate Deposit Ledger
- Single PG Architecture
- MVP First Strategy
- No Over Engineering

---

# Important

Every developer and every AI assistant working on RPGMS 2.0 must read this document before implementing any feature.

These rules take precedence over implementation convenience.

If implementation conflicts with these rules, the rules must be followed unless explicitly changed by the Product Owner.

Never duplicate a resident for readmission.
Admissions are historical records and are never rewritten.
Billing and Ledger always belong to an Admission.
Checkout never deletes history.
Deposit decisions are recommendations based on contract evaluation, not automatic irreversible actions.