# Engineering Baseline

Version: 1.0

Status: Living Document

---

# Purpose

This document defines the engineering principles and implementation standards for RPGMS 2.0.

It complements the constitutional business documents by describing how software should be designed, implemented and evolved.

Unless there is a documented Architectural Decision Record (ADR), all new development should follow these principles.

---

# Engineering Philosophy

Business drives architecture.

Architecture drives implementation.

Implementation drives user experience.

Technology exists to support the business, never the other way around.

---

# Core Engineering Principles

## 1. Business First

Every feature must represent a genuine business capability.

Do not build technical features that have no business value.

---

## 2. Domain Driven Design

Business rules belong in the Domain.

The Domain must remain independent of:

- React
- Material UI
- Browser APIs
- Local Storage
- Supabase
- HTTP

---

## 3. Clean Architecture

Every mature business module follows the dependency direction:

Presentation
↓
Application
↓
Domain
↓
Infrastructure

Dependencies always point inward.

---

## 4. Repository Pattern

Business logic never communicates directly with persistence.

Repositories abstract all storage.

Current implementations may use:

- In-memory repositories
- Local Storage

Future implementations may use:

- Supabase
- PostgreSQL

Changing persistence must not affect the Domain.

---

## 5. Thin Presentation Layer

React components should:

- render data
- collect user input
- delegate actions

Presentation should not contain business rules.

---

## 6. Application Layer

The Application Layer coordinates use cases.

It may:

- orchestrate repositories
- invoke domain services
- coordinate workflows

It should not contain business rules.

---

## 7. Domain Layer

The Domain is the heart of the system.

It contains:

- Entities
- Value Objects
- Domain Services
- Business Rules
- Repository Interfaces

The Domain must be testable without React.

---

## 8. Infrastructure Layer

Infrastructure implements technical concerns.

Examples:

- Local Storage
- Supabase
- API clients
- Repository implementations

Infrastructure depends on the Domain.

The Domain never depends on Infrastructure.

---

# Reference Modules

The following modules are considered reference implementations.

- Resident
- Stay
- Finance

Accommodation will become a reference implementation after final alignment.

All future business modules should follow their architectural patterns.

---

# Business Modules

Every new business capability should become a self-contained module.

Typical structure:

feature/

    application/

    domain/

    infrastructure/

    components/

    pages/

---

# Business Rules

Business rules must be implemented exactly once.

Avoid duplicating business logic across:

- React components
- Coordinators
- Services

The Domain remains the single source of truth.

---

# Value Objects

Introduce Value Objects whenever:

- validation is intrinsic
- behaviour belongs with the value
- primitive obsession begins to appear

---

# Application Services

Application Services coordinate business workflows involving multiple repositories or domain objects.

They should not become repositories or domain objects.

---

# Repository Interfaces

Repositories expose business operations.

Avoid exposing persistence details.

Repositories should remain implementation independent.

---

# Documentation

Documentation is part of the implementation.

Whenever architecture or business behaviour changes, update the relevant documents before closing the sprint.

---

# AI Development Workflow

Before implementing changes, AI assistants must:

1. Read the project documentation.
2. Understand the business requirement.
3. Follow the established architecture.
4. Minimise changes.
5. Preserve existing business behaviour.
6. Update documentation if required.

---

# Engineering Rule

Prefer extending the existing architecture over introducing new architectural patterns.

Consistency is more valuable than novelty.

---

# Long-Term Goal

The objective of RPGMS 2.0 is to become a maintainable, business-first platform capable of evolving for many years without requiring architectural redesign.

Engineering decisions should always support this objective.

