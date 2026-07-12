# AI Context

This document provides context for any AI assistant working on RPGMS 2.0.

Read this document completely before writing or modifying code.

After reading this document, also read:

1. PROJECT_RULES.md
2. docs/Decisions.md

These documents define the project architecture and must be followed.

---

# Project

Project Name

RPGMS 2.0

Purpose

Replace the existing Google Sheets + Apps Script based PG Management System with a modern web application.

---

# Business

Current Scope

- Single PG
- Single Admin
- Desktop First
- Responsive UI

No multi-property support in Version 1.

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite
- Material UI

Backend

- Supabase

Database

- PostgreSQL

Deployment

- Vercel

Repository

- GitHub

---

# Development Philosophy

- MVP First
- No Over Engineering
- Ship Working Software
- Keep Components Small
- Prefer Readability

---

# Architecture

Accommodation

↓

Residents

↓

Finance

↓

Electricity

The application follows the business workflow.

---

# Financial Rules

Ledger is the only source of truth.

Never store balances.

Never duplicate totals.

Every financial transaction creates a ledger entry.

Deposit Ledger is completely separate from Resident Ledger.

---

# Resident Lifecycle

Resident Status

- Active
- On Notice
- Checked Out

Notice Date automatically proposes Checkout Date + 30 days.

Checkout Date remains editable.

---

# Electricity

Workflow

Enter Bill

↓

Split Bill

↓

Automatic Ledger Posting

---

# Coding Guidelines

- TypeScript
- Functional Components
- Material UI
- No any
- No duplicate code
- Keep files small
- Use meaningful names

---

# User Experience

The application should require almost no training.

Simple.

Fast.

Professional.

---

# Current Sprint

Read ROADMAP.md

Current Deliverable will always be provided in the prompt.

Only implement the requested deliverable.

Do not build future functionality unless explicitly instructed.

---

# Before Writing Code

Always verify:

- Does this follow PROJECT_RULES.md?
- Does this violate any Architecture Decision?
- Is this the simplest solution?
- Is this required for the MVP?