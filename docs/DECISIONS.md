# ARCHITECTURE DECISIONS

**Version:** 2.0  
**Status:** Active

---

## Purpose

This document records the significant architectural decisions that shape RPGMS.

Architecture Decision Records (ADRs) document long-term decisions that affect the business architecture, system design, engineering practices, or project direction.

The purpose of an ADR is to explain:

- What decision was made.
- Why the decision was made.
- The consequences of the decision.
- Whether the decision remains current.

This document records permanent architectural knowledge and should not be used as a changelog.

---

## Decision Lifecycle

Each Architecture Decision Record (ADR) shall have one of the following statuses:

| Status | Meaning |
|---------|---------|
| Proposed | Under discussion and not yet adopted. |
| Accepted | Approved and part of the current architecture. |
| Superseded | Replaced by a newer architectural decision. |
| Deprecated | Retained for historical reference but no longer recommended. |

Accepted ADRs form part of the permanent architectural history of RPGMS.

---

## ADR Categories

Architecture decisions are grouped into the following categories:

- Business Architecture
- Financial Architecture
- Application Architecture
- Engineering Practices
- Project Governance

---

# Business Architecture

---

## ADR-001 — Resident and Stay are Separate Business Entities

**Status:** Accepted

### Context

A person may stay at the property multiple times over several years.

Each stay has its own:

- Bed allocation
- Financial history
- Compliance
- Door ID
- Dates
- Operational events

Treating a Resident as synonymous with a Stay would mix permanent identity with temporary occupancy.

### Decision

The system separates the concepts of **Resident** and **Stay**.

- **Resident** represents a person.
- **Stay** represents one continuous period of accommodation.

A Resident may therefore have multiple independent Stay records throughout their lifetime.

### Consequences

- Resident history is preserved permanently.
- Returning residents do not require duplicate profiles.
- Each Stay maintains an independent financial and operational history.
- Future analytics become significantly simpler.
- The business model reflects real-world operations.

---

## ADR-002 — Stay is the Operational Center of the System

**Status:** Accepted

### Context

Operational activities such as accommodation, billing, compliance, complaints, and access control all occur during a specific Stay rather than against the Resident directly.

### Decision

The **Stay** entity is the central operational entity within RPGMS.

Business domains including Accommodation, Finance, Billing, Compliance, Door IDs, and Complaints are associated with a Stay rather than directly with a Resident.

### Consequences

- Clear ownership of operational data.
- Simplified business relationships.
- Better lifecycle management.
- Easier future expansion of business modules.
- Strong separation between identity and operations.

---

## ADR-003 — Accommodation Hierarchy is Property → Flat → Area → Bed

**Status:** Accepted

### Context

Beds alone do not adequately represent the physical layout of a hostel.

Areas such as Bedrooms, Halls, and Small Bedrooms provide meaningful structure for residents and administrators.

### Decision

Accommodation shall follow the hierarchy:

**Property → Flat → Area → Bed**

Beds always belong to an Area.

Areas always belong to a Flat.

### Consequences

- Flexible flat layouts.
- Support for different room configurations.
- Consistent bed naming.
- Improved occupancy reporting.
- Scalable accommodation model.

---

## ADR-004 — Ledger is the Single Source of Truth for Financial History

**Status:** Accepted

### Context

Financial information is one of the most critical assets of the system.

Maintaining balances in multiple places creates opportunities for inconsistencies, reconciliation issues, and data corruption.

### Decision

The **Ledger** shall be the single source of truth for all financial transactions.

Every financial event shall result in one or more immutable ledger entries.

Balances, dues, and financial summaries shall always be calculated from the Ledger rather than stored independently.

### Consequences

- Complete financial audit trail.
- Elimination of duplicate financial data.
- Simplified reconciliation.
- Reliable financial reporting.
- Future accounting features become easier to implement.

---

## ADR-005 — Business Rules are Independent of Implementation

**Status:** Accepted

### Context

Business rules should remain valid regardless of the programming language, framework, or database used by the application.

Embedding implementation details into business documentation makes long-term maintenance difficult.

### Decision

Business Rules shall describe **what** the business requires rather than **how** the software implements those requirements.

Implementation details belong within technical documentation and source code.

### Consequences

- Business documentation remains technology independent.
- Easier migration to future technologies.
- Clear separation between business and engineering concerns.
- Improved maintainability of documentation.

---

## ADR-006 — Specifications Define Business Behaviour

**Status:** Accepted

### Context

As the project grows, business logic becomes too large to document solely within Business Rules or Data Model documents.

Each major domain requires a dedicated specification describing its workflows, lifecycle, validations, and user interactions.

### Decision

Every major business domain shall have its own Specification document.

Specifications define:

- Business workflows
- Lifecycle states
- Validation rules
- User interactions
- Operational behaviour
- Future extensibility

Business Rules define principles, while Specifications define behaviour.

### Consequences

- Better organised documentation.
- Clear ownership of business domains.
- Easier onboarding for future developers.
- Scalable documentation structure for long-term development.

---

# Application Architecture

---

## ADR-007 — Feature-First Project Structure

**Status:** Accepted

### Context

As RPGMS grows, organizing code by technical layers (components, pages, hooks, services) makes related business functionality difficult to locate and maintain.

### Decision

The application shall use a **feature-first** project structure.

Each business domain owns its:

- Components
- Pages
- Hooks
- Services
- Utilities
- Types
- Tests

Shared functionality shall be placed only in dedicated shared modules.

### Consequences

- Better scalability.
- Clear ownership of code.
- Reduced coupling between business domains.
- Easier onboarding of new developers.
- Simpler long-term maintenance.

---

## ADR-008 — Domain Ownership is Explicit

**Status:** Accepted

### Context

Business entities often appear to belong to multiple modules, creating ambiguity and duplication.

For example, a Bed is referenced by Accommodation, Stay, Billing, and Reporting.

### Decision

Every business entity shall have exactly **one owning domain**.

Other domains may reference an entity but shall not own or duplicate its business logic.

### Consequences

- Clear architectural boundaries.
- Reduced duplication.
- Simplified maintenance.
- Predictable ownership of business rules.
- Improved consistency across the application.

---

## ADR-009 — Shared Components Must Be Business-Agnostic

**Status:** Accepted

### Context

Reusable UI components often become tightly coupled to a specific business domain, reducing their usefulness elsewhere.

### Decision

Components placed in shared modules shall remain business-agnostic.

Business-specific logic belongs within the owning feature module.

Shared components may provide generic functionality but shall not contain domain-specific rules.

### Consequences

- Higher component reusability.
- Better separation of concerns.
- Cleaner feature modules.
- Easier testing and maintenance.

---

# Engineering Practices

---

## ADR-010 — Documentation is a First-Class Deliverable

**Status:** Accepted

### Context

Long-lived software projects often accumulate undocumented architectural decisions, making future maintenance and onboarding difficult.

### Decision

Documentation shall be treated as a deliverable alongside source code.

Significant architectural or business decisions shall be documented before a sprint is considered complete.

Core governance documents include:

- ARCHITECTURE.md
- PROJECT_RULES.md
- BUSINESS_RULES.md
- DATA_MODEL.md
- Specifications
- DECISIONS.md

### Consequences

- Architectural knowledge is preserved.
- Faster onboarding for future developers.
- Better consistency across the project.
- Reduced dependency on individual contributors.

---

## ADR-011 — Build, Lint, and Documentation are Sprint Exit Criteria

**Status:** Accepted

### Context

A feature is not complete simply because the code works. Long-term project quality depends on maintaining technical standards and keeping documentation synchronized with implementation.

### Decision

A sprint shall not be considered complete until:

- The project builds successfully.
- Linting passes without errors.
- Significant architectural changes are documented.
- Relevant project documentation has been updated.

### Consequences

- Higher code quality.
- Consistent project governance.
- Reduced technical debt.
- Documentation remains aligned with implementation.

---

# Project Governance

---

## ADR-012 — Business Architecture Drives Implementation

**Status:** Accepted

### Context

Implementing features before establishing a clear business architecture often leads to rework, inconsistent models, and unnecessary complexity.

### Decision

Business architecture shall be defined before implementation.

The preferred order of work is:

1. Business Architecture
2. Business Rules
3. Data Model
4. Domain Specification
5. Implementation
6. Testing
7. Documentation updates

### Consequences

- More stable architecture.
- Reduced redesign effort.
- Clear implementation roadmap.
- Consistent business behaviour across modules.

---

## ADR-013 — Architecture Decisions are Permanent Records

**Status:** Accepted

### Context

Architectural decisions explain *why* the system is built a particular way. They should remain available even if later decisions replace them.

### Decision

Architecture Decision Records shall never be deleted.

If a decision changes:

- The existing ADR shall be marked **Superseded** or **Deprecated**.
- A new ADR shall record the replacement decision.
- Historical context shall be preserved.

### Consequences

- Complete architectural history.
- Easier understanding of past design choices.
- Improved governance for future contributors.
- Long-term maintainability of the project.

---
## ADR-014 - Application Layer Pattern

### Context

Each major workspace shall contain an Application Layer responsible for coordinating domain services and preparing a ViewModel for presentation.

The Application Layer consists of:

- Workspace Coordinator
- Workspace ViewModel

Presentation components receive data only through the ViewModel.

Presentation components must never directly access repositories, Supabase, or domain services.

### Consequences

Advantages

- Clear separation of concerns.
- Reusable presentation components.
- Centralized orchestration.
- Easier testing.
- Consistent architecture across workspaces.
- Simpler future expansion.

Trade-offs

- Additional layer of abstraction.
- More files per feature module.
- Slightly higher initial implementation effort.

This pattern shall be used for all major orchestration workspaces within RPGMS 2.0 unless an Architecture Decision Record explicitly defines an alternative.

Examples include:

- Stay Workspace
- Resident Workspace
- Finance Workspace
- Maintenance Workspace
- Inventory Workspace

This ensures a consistent Application Layer architecture throughout the system.

## ADR-015 — Bidirectional Resident to Reservation Traceability

**Status:** Proposed

### Context

During Sprint RA-6 (Complete Admission Execution), forward traceability from a Reservation to its resulting entities was established via the optional properties `convertedResidentId?: string` and `convertedStayId?: string` on the `Reservation` domain entity.

Additionally, the `Stay` aggregate records backward traceability to the originating reservation via `BusinessEvent` metadata (`eventType: 'ADMISSION'`, `metadata: { reservationId, reservationNumber }`).

However, the `Resident` domain entity (`src/features/resident/domain/entities/Resident.ts`) currently has no explicit top-level field linking it back to its originating `sourceReservationId?: string`. To trace which reservation originated a specific `Resident`, the system must currently query `Reservation.convertedResidentId` on `ReservationRepository` or parse `Stay.businessEvents`.

### Decision

Add an optional explicit domain property `sourceReservationId?: string` to the `Resident` domain entity interface:

```typescript
export interface Resident {
  id: string;
  residentCode: string;
  fullName: string;
  status: ResidentStatus;
  mobileNumber: string;
  sourceReservationId?: string; // Explicit backward traceability link to originating Reservation
  ...
}
```

When `AdmissionCoordinator.confirmReservedAdmission()` executes a Reserved Admission conversion:
1. It shall pass `sourceReservationId: reservation.id` when constructing the new `Resident` entity.
2. It sets `convertedResidentId` and `convertedStayId` on the `Reservation` entity.

### Consequences

#### Advantages:
- **Direct Bidirectional Traceability**: Allows immediate backward querying from a `Resident` entity to its originating `Reservation` without parsing unindexed JSON arrays or querying cross-repository associations.
- **Audit & Compliance Support**: Preserves clear constitutional lineage showing whether a resident entered via Reservation (`sourceReservationId` populated) or via Walk-in Admission (`sourceReservationId` undefined).
- **Zero Breaking Changes**: Making `sourceReservationId` an optional field (`string | undefined`) preserves complete backward compatibility with existing resident seed datasets and non-reservation admissions.

#### Trade-offs:
- Minor extension to the `Resident` domain interface requiring update in `AdmissionCoordinator` resident creation logic and `InMemoryResidentRepository` mapping.

---

## ADR-018 — Synchronous Admission Finance Initialization & Compensating Rollback

**Status:** Accepted

### Context

Sprint FR-2 introduces the integration between the Admission workflow (`AdmissionCoordinator`) and the Finance domain (`billingService`, `ledgerService`). When an admission is committed (either via Reservation Conversion or Direct Walk-in), initial financial records (Security Deposit Liability, First Month Rent Bill, and optional Token Advance Credit) must be created.

Because RPGMS 2.0 MVP operates using an in-memory repository architecture without multi-repository database transactions, financial initialization must be executed synchronously within the admission confirmation boundary, and any financial failure must cleanly roll back all created admission state.

### Decision

1. **Synchronous Execution**: `AdmissionCoordinator` invokes a dedicated `AdmissionFinanceService` synchronously after `Stay` and `Resident` aggregates are created, before returning `AdmissionResult`.
2. **Dedicated Application Service**: `AdmissionFinanceService` encapsulates all admission-related financial initialization logic (Security Deposit posting: `Debit ACCOUNTS_RECEIVABLE`, `Credit SECURITY_DEPOSIT_LIABILITY`; First Month Rent Bill: `billingService.createBill()`; Token Disposition).
3. **Compensating Rollback Strategy**: If `AdmissionFinanceService` fails or throws an exception, `AdmissionCoordinator` executes a rollback sequence that deletes created `Bill` and `LedgerEntry` records, deletes the created `Stay`, deletes/reverts `Resident`, and restores pre-admission snapshots of `Reservation` and `Flat`.

### Consequences

#### Advantages:
- **Strict Financial Consistency**: Prevents operational check-in without immediate accounting recognition.
- **Clean Domain Boundaries**: Prevents `AdmissionCoordinator` from becoming a Finance God-class.
- **All-or-Nothing Atomicity**: Enforces zero orphan records across Resident, Stay, Bed, and Finance domains.

---

## ADR-019 — Payment Processing & Billing Core Stabilization

**Status:** Accepted

### Context

Following Sprint FR-1 (Settlement Core & DI Stabilization) and Sprint FR-2 (Admission & Rent Billing Integration), the core `billingService.ts` and `paymentService.ts` required constructor Dependency Injection (DI) refactoring for `StayRepository` to eliminate direct concrete repository instantiations inside application use cases. Dedicated Vitest unit test suites were also required to establish 100% test coverage over payment recording, bill generation, payment allocations, advance overpayments, and balance derivation math.

### Decision

1. **Constructor Dependency Injection**: `BillingApplicationService` and `PaymentApplicationService` receive `StayRepository` and `FinanceRepository` via constructor parameters, defaulting to `InMemoryStayRepository` and `defaultFinanceRepository` for backward compatibility.
2. **Direct Stay agreedRent Lookup**: `generateMonthlyRentBill()` retrieves `stay.agreedRent` using the injected `StayRepository` instance rather than instantiating a new repository internally.
3. **Comprehensive Service & Engine Test Coverage**: Create unit test suites for `billingService`, `paymentService`, and `balanceEngine` verifying ledger double-entry precision, debit account routing (`CASH` vs `BANK`), advance credit liability overpayment handling, and payment allocation mechanics across open bills.

### Consequences

#### Advantages:
- **Architectural Inversion of Control**: Eliminates hidden infrastructure coupling in application services.
- **Enhanced Test Isolation**: Enables pure mock repository injection during unit testing.
- **Verified Financial Integrity**: Guarantees accurate payment recording, double-entry balance equality, and overpayment advance tracking across all business workflows.

---

## ADR-020 — Financial Reporting, Activity Timeline & Workspace Coordination

**Status:** Accepted

### Context

Following Sprint FR-1 (Settlement Core), Sprint FR-2 (Admission Finance Integration), and Sprint FR-3 (Payment & Billing Core), the remaining reporting and presentation services (`reportingService.ts`, `timelineService.ts`, `FinanceWorkspaceCoordinator.ts`) required constructor Dependency Injection (DI) refactoring for `StayRepository`, `ResidentRepository`, and `FinanceRepository`. Dedicated Vitest unit test suites were also required to establish 100% test coverage over property-wide dashboard aggregation, resident financial summaries, collections reporting, chronological activity streams, and workspace ViewModels.

### Decision

1. **Constructor Dependency Injection**: `ReportingApplicationService`, `TimelineApplicationService`, and `FinanceWorkspaceCoordinator` receive repository and child service instances via constructor parameters, defaulting to in-memory singleton instances for backward compatibility.
2. **Read-Only Reporting Guarantees**: Reporting and timeline services operate strictly read-only, deriving dashboard metrics, outstanding dues, collections, and activity streams on demand from authoritative repositories without mutating state.
3. **Comprehensive Application & Reporting Test Coverage**: Create unit test suites for `reportingService`, `timelineService`, and `FinanceWorkspaceCoordinator` verifying property-wide metric aggregation, chronological event sorting (newest first), resident dues sorting (highest first), and complete workspace ViewModel assembly.

### Consequences

#### Advantages:
- **Architectural Inversion of Control**: Complete inversion of control across all Finance application services and coordinators.
- **Pure Test Isolation**: Enables mock repository injection without reliance on global state or `localStorage`.
- **Verified Reporting Integrity**: Ensures financial dashboards, activity streams, and audit reports reflect authoritative financial data accurately.

---

## ADR-021 — Finance UI Workspace Coordination & Interactive Modal Integration

**Status:** Accepted

### Context

Following Sprints FR-1 (Settlement Core), FR-2 (Admission Finance Integration), FR-3 (Payment & Billing Core Stabilization), and FR-4 (Financial Reporting & Timeline Coordination), the core domain engines and application services of the Finance domain were fully stabilized with constructor dependency injection. However, presentation components (`FinanceWorkspacePage.tsx`, `ResidentFinancialProfile.tsx`) rendered static or read-only metrics, and draft UI modal components (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`) were unwired to application services. Furthermore, a dedicated checkout settlement modal (`SettlementDialog.tsx`) and a reactive presentation state hook (`useFinanceWorkspace.ts`) were required to complete Capability Release 3 (CR-3 — Financial Operations).

### Decision

1. **Reactive Workspace Coordination Hook (`useFinanceWorkspace`)**: Implement a dedicated presentation hook encapsulating property-wide ViewModels (`createViewModel`), active modal visibility (`'RECEIVE_PAYMENT' | 'GENERATE_RENT' | 'ADD_LAUNDRY' | 'PROCESS_SETTLEMENT' | null`), selected context (`resident`, `stayId`, `flat`), and reactive re-fetching via an internal state refresh counter (`refreshCount`).
2. **Two-Stage Checkout Settlement Dialog (`SettlementDialog`)**: Implement `SettlementDialog.tsx` rendering Stage 1 settlement preview calculations (unpaid debits, deposit held, advance credit, damage recovery deduction, net refund/payable, outcome) via `settlementService.generateSettlementPreview()`, and executing Stage 2 settlement commitment via `settlementService.confirmSettlement()`.
3. **Application Service Delegation**: UI modals and presentation components delegate all monetary transactions, double-entry ledger postings, payment allocations, and settlement rules directly to application services (`paymentService`, `billingService`, `settlementService`). UI components do not compute financial balances or construct double-entry ledger postings.
4. **Comprehensive UI & E2E Test Suite**: Establish Vitest unit test coverage for `FinanceWorkspacePage.test.tsx`, `ResidentFinancialProfile.test.tsx`, and a 7-step end-to-end integration test (`FinanceE2EJourney.test.ts`) verifying the complete financial lifecycle.

### Consequences

#### Advantages:
- **Clean Layered Architecture**: Preserves strict separation between presentation components and domain business logic.
- **Interactive Financial Operations**: Operators can record payments, issue rent bills, add extra charges, and execute checkout settlements with immediate, real-time UI state updates.
- **Verified End-to-End Financial Integrity**: Guarantees zero balance discrepancies from admission through checkout settlement and final financial closure.

---

## ADR-022 — Electricity Consumption Allocation & Financial Ledger Billing Integration

**Status:** Accepted

### Context

Following the completion of Capability Release 3 (CR-3 — Financial Operations) in Sprint FR-5, RPGMS 2.0 transitioned to Capability Release 4 (CR-4 — Operational Services) starting with Sprint FR-6 / OS-1 (Electricity Operations, Metering & Financial Integration). Electricity operations require ingesting sub-meter readings, validating reading monotonicity, calculating tariff slab charges, allocating split utility amounts across active flat occupants, and posting utility bills into the resident ledger without violating domain boundaries or introducing duplicate accounting logic inside the Electricity domain.

### Decision

1. **Domain Boundary & Entity Architecture**: Establish `Meter`, `MeterReading`, `ElectricityTariff`, and `ConsumptionAllocation` in `src/features/electricity/domain/`. Monotonicity (`currentReading >= previousReading`) is enforced by domain rule `meterRules.ts`.
2. **Finance Domain Delegation**: `electricityService.ts` delegates utility bill generation directly to `billingService.generateRecurringChargeBill(stayId, readingPeriod, 'Electricity', description, allocatedAmount)` in the Finance domain (`billType: RECURRING_CHARGE`, `category: UTILITIES`), generating balanced double-entry ledger postings (`Debit ACCOUNTS_RECEIVABLE`, `Credit UTILITIES`).
3. **Flat Occupant Equal Split & Remainder Determinism**: Calculate utility split amounts evenly across active flat occupants (`status === ACTIVE || status === ON_NOTICE`). Remainder paise from division are added to the first occupant allocation to guarantee `sum(allocations) === totalFlatBill`.
4. **Compensating Rollback Strategy**: If `generateRecurringChargeBill` fails for any occupant during a flat allocation, `electricityService.ts` executes a compensating transaction rollback, deleting the created `MeterReading` and restoring `Meter.lastReadingValue` to maintain all-or-nothing atomicity aligned with ADR-018 patterns.
5. **Interactive Presentation & Workspace**: Build `ElectricityPage.tsx`, `useElectricityWorkspace.ts`, and `RecordMeterReadingModal.tsx` providing real-time Stage 1 preview calculations prior to Stage 2 confirmation.

### Consequences

#### Advantages:
- **Strict Architecture Boundaries**: Electricity domain manages utility metering and split allocations while Finance handles accounting, ledger entries, and receivables.
- **Guaranteed Monotonicity & Atomicity**: Prevents invalid lower readings and guarantees zero orphan billing states via compensating rollback.
- **Full End-to-End Testability**: Verified across unit, integration, and E2E test suites with 100% pass rates.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 2.6 | August 2026 | Added ADR-022 (Electricity Consumption Allocation & Financial Ledger Billing Integration). |
| 2.5 | August 2026 | Added ADR-021 (Finance UI Workspace Coordination & Interactive Modal Integration). |
| 2.4 | August 2026 | Added ADR-020 (Financial Reporting, Activity Timeline & Workspace Coordination). |
| 2.3 | August 2026 | Added ADR-019 (Payment Processing & Billing Core Stabilization). |
| 2.2 | August 2026 | Added ADR-018 (Synchronous Admission Finance Initialization & Compensating Rollback). |
| 2.1 | August 2026 | Added proposed ADR-015 (Bidirectional Resident to Reservation Traceability). |
| 2.0 | July 2026 | Rewritten using a structured ADR format aligned with the RPGMS business architecture. |

---
