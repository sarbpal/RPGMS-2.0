# RPGMS 2.0 - Project Rules

**Version:** 1.0
**Status:** Locked
**Last Updated:** July 2026

---

# Vision

Build a modern, fast, reliable PG Management System that replaces the existing Google Sheets + Apps Script solution.

The objective is to deliver a usable application as quickly as possible while maintaining clean architecture and high code quality.

---

# Guiding Principle

> Build for today's business requirements, not tomorrow's possibilities.

The application should solve real operational problems first.
Future enhancements will be added incrementally.

---

# Project Objectives

- Replace Google Sheets with a web application.
- Maintain existing business workflows.
- Improve usability.
- Reduce manual work.
- Provide a strong foundation for future growth.

---

# Technology Stack (Locked)

Frontend
- React
- TypeScript
- Vite
- Material UI

Backend
- Supabase
- PostgreSQL

Deployment
- GitHub
- Vercel

No technology changes unless there is a compelling business reason.

---

# Business Scope

## Current Scope

- Single PG
- Single Admin
- Desktop First
- Responsive Design

Multi-property support is intentionally excluded from Version 1.

---

# Core Architectural Principles

## Rule 1

### Ledger is the only source of truth.

No balances shall be stored.

Outstanding amounts, collections and reports are always calculated from ledger entries.

---

## Rule 2

Security Deposit has its own ledger.

Deposit transactions are never mixed with the resident ledger.

---

## Rule 3

Every financial event creates a ledger entry.

Examples

- Monthly Rent
- Electricity
- Payment
- Deposit
- Refund
- Discount

---

## Rule 4

Ledger entries are immutable.

Corrections are made through reversing entries.

Existing ledger entries are never edited.

---

## Rule 5

Accommodation drives everything.

Business flow:

Flat
↓

Bed
↓

Rent
↓

Resident
↓

Ledger

---

## Rule 6

Residents have three lifecycle states.

- Active
- On Notice
- Checked Out

Notice Date defaults Checkout Date to Notice Date + 30 days.

Checkout Date remains editable.

---

## Rule 7

Electricity workflow

Enter Bill

↓

Split Bill

↓

Automatic Ledger Entries

No manual posting.

---

# Development Rules

## Ship Working Software

Every sprint must produce working software.

---

## MVP First

Only build features required to run the PG.

Everything else belongs in the backlog.

---

## No Over Engineering

Do not build for hypothetical future requirements.

Prefer the simplest maintainable solution.

---

## One Feature At A Time

Complete one feature before starting another.

---

## Two Day Rule

If a feature grows beyond two days of work,
split it into smaller deliverables.

---

## Deploy Frequently

Every completed feature should be:

- Committed
- Pushed to GitHub
- Deployed to Vercel
- Tested

---

## Zero Training

The application should be intuitive enough that a new user can understand it without reading documentation.

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
- Beds
- Bed Rent

---

## Residents

- Add
- Edit
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
- Auto Split
- Auto Ledger Posting

---

## Settings

Basic Configuration

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
- Multi PG
- Analytics

---

# Coding Standards

- TypeScript only
- No duplicate logic
- Reusable components
- Clean naming
- Small functions
- No dead code

---

# Definition of Done

A task is complete only if:

✓ Code compiles

✓ No TypeScript errors

✓ Tested locally

✓ Pushed to GitHub

✓ Deployed on Vercel

✓ Accepted by Product Owner

---

# Decision Rule

Whenever a design decision is required, ask:

> "Does this help us deliver a usable application faster without creating major future problems?"

If the answer is YES, implement it.

If the answer is NO, postpone it.

# Non-Negotiables

The following principles require explicit approval before they can be changed:

- Technology Stack
- Ledger is the only source of truth
- Separate Deposit Ledger
- Single PG Architecture
- MVP First Strategy
- No Over Engineering
# IMPORTANT

Before implementing any feature, every developer or AI assistant working on this project must read this document completely.

These rules take precedence over implementation convenience.

If any implementation conflicts with these rules, the rules must be followed unless explicitly changed by the Product Owner.

Minimal Dependencies

Every dependency must have a purpose.

Before adding any package, we ask:

Does React already provide this?
Can we write it ourselves easily?
Does this dependency save significant time?

If not, we don't install it.

Rule: Build Integrity

Every milestone must end with:

npm run build succeeds.
npm run lint succeeds (when applicable).
The application runs without runtime errors.

No milestone is considered complete until the project is in a runnable state.

## Data Standards

- Codes and identifiers are stored in UPPERCASE.
- Display names are normalized to Title Case.
- Descriptions preserve user formatting.
- Trim unnecessary whitespace.

## Business Rules

Never ask the user to enter information that can be derived.

Examples:

- Capacity
- Bed IDs
- Running totals
- Outstanding balances

## Architecture Standards

Business logic belongs in reusable utilities.

UI components are responsible for presentation and orchestration.

Avoid duplicating business logic.

## UX Standards

Optimize keyboard navigation for the primary business workflow.

Destructive actions should not interrupt normal data entry.

Prefer:

- Smart defaults
- Inline validation
- Live feedback
- Automatic normalization

over manual user effort.

