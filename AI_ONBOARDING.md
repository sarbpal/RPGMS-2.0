# AI ONBOARDING GUIDE
## RPGMS Version 2.0

Version: 1.0
Last Updated: July 2026

---

# Purpose

This document provides the onboarding process for any AI assistant contributing to the RPGMS Version 2.0 project.

It applies to:

- ChatGPT
- Gemini Antigravity
- Codex
- Claude
- Future AI coding assistants

This document must be read before making any code changes.

---

# Project Overview

RPGMS (Ritu PG Management System) is a modern Property/PG Management System being rebuilt from scratch.

Primary goals are:

- Clean architecture
- Maintainability
- Scalability
- Business-first design
- Incremental delivery

The project follows an MVP-first strategy. Features are added incrementally after a stable foundation is complete.

---

# Technology Stack

Frontend

- React
- TypeScript
- Material UI
- React Router

Backend

- Supabase

Hosting

- Vercel

Version Control

- Git
- GitHub

---

# Required Reading Order

Before writing any code, read the following documents in order:

1. PROJECT_RULES.md
2. AI_CONTEXT.md
3. AI_INSTRUCTIONS.md
4. SESSION.md
5. ROADMAP.md
6. CHANGELOG.md
7. Relevant files under docs/

Do not begin implementation until these documents are understood.

---

# Development Philosophy

Always prefer:

- Working software
- Simple architecture
- Readability
- Maintainability

Never over-engineer.

Do not introduce unnecessary abstractions.

Implement only the functionality required for the current sprint.

---

# Coding Standards

Always:

- Use TypeScript strict typing
- Use functional React components
- Keep components small
- Prefer composition over inheritance
- Follow feature-based architecture
- Keep business logic out of UI components
- Use Material UI consistently

Never:

- Use any unless absolutely unavoidable
- Duplicate business logic
- Introduce new libraries without approval
- Break existing functionality

---

# Architecture Rules

Respect the existing project architecture.

Do not:

- Move folders
- Rename modules
- Change routing
- Restructure the application

Unless explicitly requested.

---

# Business Rules

Business rules always take precedence over technical preferences.

If implementation conflicts with BUSINESS_RULES.md,

Business Rules win.

---

# Git Workflow

Make small logical changes.

Prefer incremental commits.

Never:

- Force push
- Rewrite history
- Delete documentation
- Rename major folders without approval

---

# Documentation Responsibilities

When architecture changes:

Update:

- SESSION.md
- CHANGELOG.md
- ROADMAP.md

If documentation is no longer accurate, update it before ending the session.

---

# AI Guardrails

When uncertain:

Ask.

Never invent requirements.

Never assume business logic.

Never silently change behaviour.

Explain important design decisions.

---

# Session Start Checklist

Before coding:

□ Read SESSION.md

□ Read ROADMAP.md

□ Understand current sprint

□ Identify affected modules

□ Explain implementation plan

---

# Session End Checklist

Before finishing:

□ Verify build

□ Update documentation

□ Suggest commit message

□ Summarize changes

---

# Project Status

Current Milestone:
Engineering Foundation

Current Sprint:
Sprint 4 – Residents Module Foundation

Status:
In Progress

Next Objective:
Implement Residents module following existing architecture.

---

End of Document