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

## ADR-023 — Electricity Allocation Reversal, Audit Integrity & Controlled Financial Adjustment

**Status:** Accepted

### Context

Following the implementation of supplier bill allocation confirmation (Stage 1 through Stage 4), operator corrections required the ability to reverse a confirmed electricity allocation (`ElectricityAllocation`). Reversal must preserve original calculation data, maintain an immutable historical audit trail, cancel associated resident Finance bills, post counter-balancing double-entry ledger records, and execute within an all-or-nothing compensating rollback boundary without creating custom refund or credit-note mechanisms outside the Finance domain.

### Decision

1. **Authoritative Reversal Lifecycle**: `ElectricityAllocation` is the single authoritative aggregate root owning the allocation reversal lifecycle (`CONFIRMED -> REVERSED`). The physical supplier invoice (`ElectricityBill`) remains unmutated and does NOT have a `REVERSED` lifecycle state.
2. **Explicit Audit Metadata**: `ElectricityAllocation` records mandatory operator identity (`reversedBy`), ISO timestamp (`reversedAt`), stable reference ID (`reversalReferenceId = 'rev_' + allocation.id`), and optional operational notes (`reversalReason`). Historical calculation parameters and confirmation metadata remain strictly unmutated.
3. **Finance Domain Primitives**: Resident financial adjustments delegate 100% to existing Finance primitives: resident bills transition to `status = 'CANCELLED'` via `FinanceRepository.saveBill()`, and counter-postings (`Debit ELECTRICITY_REVENUE`, `Credit ACCOUNTS_RECEIVABLE`) with `referenceType = REVERSAL` are posted via `LedgerApplicationService.reverseEntries()`.
4. **No Custom Credit-Note Mechanism**: Reversing a paid bill naturally leaves an Accounts Receivable credit balance on the resident ledger view model under standard double-entry rules. No custom credit-note, refund, or resident credit logic is introduced in Electricity.
5. **Application-Level Compensating Rollback**: Multi-participant reversal operates within an application-level compensating rollback boundary using pre-reversal in-memory Finance snapshots (`preReversalBillsSnapshot`, `preReversalLedgerEntriesSnapshot`) to restore Finance state and maintain `CONFIRMED` allocation status if any participant reversal step fails.

### Consequences

#### Advantages:
- **Domain & Architectural Separation**: Electricity domain owns supplier allocation reversal rules while Finance authoritatively manages ledger double-entry counter-postings and receivables.
- **Immutable Audit History**: Preserves complete historical lineage and attribution without altering original calculation parameters.
- **Zero Orphan Financial States**: Compensating rollback guarantees atomic reversal outcomes across multi-participant allocations.
- **Clean 9-File Implementation**: Executed with zero modifications to Finance code or external domain interfaces.

---

## ADR-024 — Running Deposit Account Lifecycle, Partial Returns, and Decoupled Settlement

**Status:** Accepted

### Context

Following the initial Settlement Implementation (Sprint FR-1), deposit tracking remained static at initial admission and settlement calculations were coupled to operational checkout. Stage 6 required establishing a running, Stay-dependent deposit account supported by double-entry ledger postings, enabling mid-stay partial returns, additional contributions, damage deductions, and decoupling settlement calculations from operational checkout.

### Decision

1. **DEC-DEP-01 (Partial Deposit Returns):** Partial deposit returns are permitted during `ACTIVE`, `ON_NOTICE`, and `CHECKED_OUT` stay states. Returns are strictly guarded against live available deposit balance (`sum(deposit credits) - sum(deposit debits)`). Rejects zero, negative, or over-return amounts.
2. **DEC-DEP-02 (Additional Deposit Contributions):** Additional deposit contributions are permitted after the initial admission deposit. Each contribution is recorded as an independent immutable transaction (`DEPOSIT_RECEIPT`), posting double-entry ledger entries (`Debit CASH/BANK`, `Credit SECURITY_DEPOSIT_LIABILITY`).
3. **DEC-DEP-03 (Alumni Re-admission Identity Invariant):** Readmission of an `ALUMNI` resident preserves the permanent `Resident` identity and establishes a new `Stay` aggregate. Returning alumni do not require duplicate resident profiles.
4. **DEC-DEP-04 (Deposit Mutation Idempotency & Concurrency):** All deposit mutations support session-scoped `idempotencyKey` replay and conflict detection, and are serialized per stay using `activeStayLocks` (BR-454).
5. **DEC-DEP-05 (Live T2 Revalidation & Rollback Boundary):** Deposit returns and deductions re-derive authoritative live ledger balances at $T_2$ immediately before posting, and multi-step mutations are protected by snapshot-based compensating rollback boundaries (BR-453, BR-454).
6. **Decoupled Post-Checkout Settlement (BR-460):** `generateSettlementPreview` allows preview calculations on stays with operational status `CHECKED_OUT` without forcing operational checkout re-execution.
7. **Resident ALUMNI Transition (BR-461):** `confirmSettlement` converts `Resident.status` to `ResidentStatus.ALUMNI` upon completion of final financial settlement when all stays for the resident are settled and closed.

### Consequences

#### Advantages:
- **Running Deposit Ledger**: Reflects real-world running deposit accounts with immutable audit history.
- **Over-Return Protection & Replay Safety**: Prevents negative or excessive deposit refunds through live double-entry liability balance validation and deterministic idempotency.
- **Decoupled Financial Completion**: Allows post-checkout utility ingestion, damage adjustments, and final settlement without disturbing operational bed inventory release.
- **Identity Integrity**: Preserves permanent resident identity across multiple stays over time.

---

## ADR-025 — Billing Engine Controlled Run, Claim, Recovery and Retry Architecture

**Status:** Accepted

### Context

RPGMS billing requires controlled execution over operator-selected Billing Periods, while preserving Stay ownership, immutable financial history, duplicate prevention, concurrent-run safety, late-entry handling, and explicit recovery when financial outcome is uncertain. Preview-only calculation is insufficient because two overlapping Billing Runs may observe the same eligible Charge before either is authoritatively confirmed.

The broader architecture defines the Billing Engine as an Architectural Service that coordinates billing execution, while the Ledger Engine maintains authoritative financial history. The Billing Engine therefore requires an explicit processing lifecycle without becoming the owner of financial truth.

### Decision

1. **Billing Run lifecycle:** Billing Runs use Preview → authoritative revalidation → Confirmation → Claim → Processing → Final Outcome.
2. **Operator-selected Billing Period:** The operator chooses the Billing Period; it is not hard-coded. Overlapping Billing Periods are permitted.
3. **Eligibility Cutoff:** Authoritative eligibility is determined from data available and valid at confirmation/claim time, not from the earlier Preview.
4. **First Claim Wins:** The first successful authoritative Claim establishes exclusive Billing Operation responsibility for a Charge. Competing runs exclude already claimed or financially resolved Charges.
5. **Claim is processing state:** A Claim is not financial truth. Bills, Payments, Settlements and Ledger history remain owned by Finance/Ledger capabilities.
6. **Retry:** `NOT_PROCESSED` items return to normal future eligibility; attempted `FAILED` or `CLAIM_FAILED` operations require controlled Retry Runs. A Retry Run is a new immutable Billing Run.
7. **Recovery:** Uncertain financial outcomes enter `RECOVERY_REQUIRED`; the Claim remains protected until an authorized recovery resolution establishes financial success or absence of financial commitment.
8. **Graceful Stop:** Stop Processing prevents new operations from starting while allowing in-flight operations to finish; never-started work becomes `NOT_PROCESSED`.
9. **Audit:** Billing Run, Billing Operation, Claim, Retry and Recovery decisions remain permanently auditable.
10. **Target architecture document:** `docs/BILLING_ENGINE_ARCHITECTURE.md` is the authoritative target architecture for Billing Engine processing behavior and specializes `docs/ARCHITECTURE.md` without overriding `docs/BUSINESS_RULES.md`, `docs/DOMAIN_MODEL.md`, or `PROJECT_RULES.md`.

### Consequences

#### Advantages:
- Prevents duplicate financial processing under overlapping Billing Runs.
- Preserves the distinction between processing ownership and financial truth.
- Supports late-entered Charges and historical-period reruns without rewriting history.
- Provides a controlled path for failures, uncertainty, recovery and retry.
- Preserves immutable Billing Run lineage and auditability.

#### Trade-offs:
- Billing processing requires explicit state management and reconciliation logic.
- Concurrent claim acquisition requires database/application transaction design.
- Recovery cases require additional operational tooling and authorization controls.

---

## ADR-026 — Billing Engine Charge Ownership, Discovery Contracts, and Cross-Domain Financial Reconciliation

**Status:** Accepted

### Context

Following the reconciliation between the generic Billing Engine architecture (ADR-025, `docs/BILLING_ENGINE_ARCHITECTURE.md`) and the approved Electricity Business Rules & Domain Design (`docs/ELECTRICITY_BUSINESS_RULES_AND_DOMAIN_DESIGN.md`), explicit architectural boundaries are required to govern cross-domain charge ownership, financial invoice independence, generic discovery contracts, and historical stay financial attribution.

Specifically, the Electricity domain already posts authoritative utility receivable bills to Finance upon operator confirmation. The Billing Engine must not duplicate, mutate, or subsume domain-posted bills, nor should it enforce universal single-bill consolidation or filter out checked-out/alumni stays from legitimate utility billing.

### Decision

1. **Constitutional Orchestration Principle:** The Billing Engine orchestrates billable obligations; it does not create, calculate, allocate, or alter the underlying business obligation. Commercial pricing remains in Stay/Commercial, supplier bill allocation remains in Electricity, and service pricing remains in Operations.
2. **Domain-Posted Bill Independence (Amended D-5):** Financial bills generated and posted directly by owning business domains (such as Electricity supplier bill allocations confirmed under BR-E-45) remain independent Finance `Bill` records. The Billing Engine acknowledges them as `COMMITTED` and never mutates, consolidates, or recreates them.
3. **Billing Run Batch Consolidation Scope:** A `BillingRun` consolidates into a single `Bill` *only* those unbilled obligations that are claimed and dispatched simultaneously within that specific Billing Run (e.g., Monthly Rent + unbilled Laundry Service Charges).
4. **Historical Stay Financial Attribution:** Financial obligations are attributed to the authoritative historical `Stay` rather than current operational status alone. Legitimate utility and adjustment obligations may be billed against `CHECKED_OUT`, `CLOSED`, or `ALUMNI`-associated Stays (preserving BR-E-42 and BR-E-43).
5. **Generic Financial Commitment Contract:** Billing discovery uses a normalized `DiscoveredObligation` contract distinguishing `UNCOMMITTED` (eligible for claim/dispatch) from `COMMITTED` (already financially authoritative, carries `financialReferenceId`).
6. **Decoupled Period Semantics:** The system explicitly distinguishes Billing Engine Processing Period (operator scope), Rent Cycle / Billing Anniversary (Stay commercial term), and Electricity Supplier Bill Period (supplier invoice date range).
7. **Read-Only Discovery Adapters:** Domain discovery adapters (e.g. `ElectricityDiscoveryAdapter`, `RentDiscoveryAdapter`, `LaundryDiscoveryAdapter`) are strictly read-only translators. They do not calculate tariffs, reconstruct occupancy, or perform financial writes.

### Consequences

#### Advantages:
- Eliminates risk of duplicate financial posting for domain-posted utility bills.
- Preserves absolute immutability of Finance `Bill` and `LedgerEntry` records.
- Supports valid post-checkout utility ingestion without resurrecting operational Stays.
- Provides a clean, extensible `ChargeDiscoveryProvider` contract for future charge types.

#### Trade-offs:
- Resident Financial Profile and Ledgers display multiple independent bills when obligations originate from distinct domain workflows.
- Discovery queries must support date-overlap and historical Stay lookups rather than simple active-status filtering.

---

## ADR-027 — Authoritative Runtime Repository Graph Unification & Property-Wide Billing Discovery Semantics

**Status:** Accepted

### Context

Following the implementation of Billing Slices 1–4B, end-to-end manual testing of the running UI identified two runtime integration issues:
1. When operators created a Billing Run from the UI without specifying target `stayIds` (intending a property-wide run), the omitted parameter became an empty array and discovery short-circuited immediately to zero obligations.
2. In-memory repository singletons were fragmented across modules: Admission/Stay/Accommodation operated on one set of repository instances created by `stayWorkflowComposition`, while Billing coordinators and Finance services defaulted to independently instantiated in-memory repositories. As a result, newly admitted Stays or operational updates were invisible across module boundaries.

### Decision

1. **Unified Authoritative Runtime Repository Graph:**
   - The application composition root (`stayWorkflowComposition.ts` and module repository exports) binds all operational workflows (Admission, Stay, Resident, Accommodation, Electricity, Finance, and Billing) to single authoritative runtime repository singletons (`defaultStayRepository`, `defaultResidentRepository`, `defaultAccommodationRepository`, `defaultReservationRepository`, `defaultFinanceRepository`, `defaultElectricityRepository`, `defaultBillingRunRepository`, `defaultBillingClaimRepository`).
   - Any Stay created via Admission or updated in the Stay Registry is immediately and synchronously visible to Billing Discovery and Finance services.
   - Isolated unit and integration tests continue to supply distinct, isolated repository instances to preserve hermetic test execution.

2. **Property-Wide Discovery Semantics:**
   - In `ChargeDiscoveryProvider`, `BillingDiscoveryService`, `RentDiscoveryAdapter`, and `ElectricityDiscoveryAdapter`, an omitted, empty, or undefined `stayIds` parameter explicitly indicates **property-wide discovery**.
   - When `stayIds` is omitted, discovery adapters evaluate all candidate Stays available in the authoritative `StayRepository` whose billing anniversary or utility period falls within the target date range.
   - When explicit `stayIds` are supplied, discovery remains strictly constrained to only those specified Stays.

### Consequences

#### Advantages:
- Enables full end-to-end manual testing across Admission → Stay Registry → Electricity Allocation → Billing Workspace → Finance Ledgers.
- Property managers can execute standard monthly billing runs across the entire property without manually specifying individual stay IDs.
- Zero duplication of domain entities or repository instances at runtime.
- 100% preservation of test isolation for hermetic automated tests.

#### Trade-offs:
- Property-wide discovery processes all candidate stays in memory for the selected date range.

---

## ADR-028 — Stay Workspace Contextual Quick Actions Integration & Coordinator Delegation

**Status:** Accepted

### Context

In the Stay Workspace (`/stay/:stayId`), seven Quick Action buttons (*Record Payment*, *Generate Monthly Rent*, *Add Laundry Charges*, *Add Electricity Charges*, *Transfer Bed*, *Give Notice*, *Begin Checkout*) were rendered by `QuickActions.tsx`, but lacked callback wiring in `StayWorkspacePage.tsx`.

The Stay Workspace already holds the authoritative Stay aggregate, Resident entity, commercial terms (agreed rent and deposit), and live balance metrics. The target application services (`paymentService`, `billingService`, `settlementService`, `StayAccommodationCoordinator`, `StayNoticeCoordinator`, `StayCheckoutCoordinator`) and modals (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, `SettlementDialog`) were already established.

### Decision

1. **Context-Driven Presentation Wiring:**
   - `StayWorkspacePage.tsx` directly supplies the authentic `stayId`, `resident`, `stayDomainEntity`, and computed `balances` to target dialogs without requiring manual resident/stay reselection or constructing fake placeholder accounts (such as `"Global Finance Account"`).
2. **Coordinator & Service Delegation:**
   - Financial operations (`Record Payment`, `Generate Monthly Rent`, `Add Laundry Charges`, `Begin Checkout`) delegate to `paymentService`, `billingService`, and `settlementService` across established Finance boundaries.
   - Stay lifecycle operations (`Transfer Bed`, `Give Notice`) delegate to `StayAccommodationCoordinator` and `StayNoticeCoordinator`.
   - Electricity action routes the operator directly to `/electricity` (preserving Electricity domain ownership of share calculation and bill confirmation).
3. **Live State Refresh:**
   - Successful completion of any action triggers state re-projection in `StayWorkspaceCoordinator` (`setRefreshTrigger`), immediately updating header, summary cards, and the activity timeline.

### Consequences

#### Advantages:
- Restores full operational functionality to all 7 Quick Actions in the Stay Workspace.
- 100% preservation of domain ownership (Finance owns double-entry ledgers, Stay owns lifecycle/bed allocation, Electricity owns meter calculations).
- Eliminates placeholder/dummy resident construction.
- Comprehensive end-to-end integration test coverage.

#### Trade-offs:
## ADR-029 — Finance Workspace Global Action Stay Selection & Elimination of Scaffolding Placeholder

**Status:** Accepted

### Context

On the top-level Finance Dashboard (`/finance`), header action buttons (*Receive Payment*, *Generate Rent*, *Add Extra Charge*, *Process Settlement*) were previously wired with a temporary UI scaffolding fallback (`targetResident` as `"Global Finance Account"`, `RES-GLOBAL`, `res_global`, with `dummyBalances`).

Because RPGMS 2.0 financial domain operations (bills, payments, ledger postings, settlements) are strictly Stay-scoped domain operations, executing actions against `RES-GLOBAL` resulted in disabled buttons (e.g. *Generate Rent* failed validation due to `agreedRent = 0` and missing `stayId`) or threatened to post orphaned records.

### Decision

1. **Elimination of Scaffolding Placeholder:**
   - Completely removed `Global Finance Account`, `RES-GLOBAL`, and `res_global` from `FinanceWorkspacePage.tsx`. No synthetic or fallback Resident/Stay objects are permitted in operational workflows.
2. **Authoritative Stay Selection Step (Option A):**
   - When an operator clicks a top-level action button on `/finance`, `SelectStayModal` opens, presenting all active and on-notice stays resolved via `FinanceWorkspaceCoordinator.getActiveStaysForSelection()`.
   - The selector displays resident name/code, flat and bed allocations, stay status (`ACTIVE` / `ON_NOTICE`), monthly rent, and current outstanding balance.
3. **Seamless Context Propagation:**
   - Upon selecting a stay, the target action modal (`ReceivePaymentModal`, `GenerateRentModal`, `AddLaundryModal`, `SettlementDialog`) opens directly with the authentic `Resident`, `stayId`, `Flat`, `Bed`, agreed rent, and live balances.
4. **Preservation of Row-Level Context Actions:**
   - Contextual table row actions (e.g. `Receive Payment` for an outstanding resident) already possess authoritative context and directly bypass the selector modal.

### Consequences

#### Advantages:
- Eliminates placeholder/dummy resident construction from the Finance Workspace.
- Guarantees that every bill, payment, and settlement is bound to a valid, authoritative `Stay` aggregate.
- Prevents invalid or disabled modal states.
- Clean separation between global dashboard discovery and contextual execution.

#### Trade-offs:
- Requires one additional selection click when initiating financial transactions from the top-level property dashboard without a row selection.

---

## ADR-030 — Cross-Workspace Operational Population Unification & Canonical Repository Singletons

**Status:** Accepted

### Context

RPGMS 2.0 creates complete Resident, Stay, Bed Allocation, and Financial records during walk-in admissions and reservation conversions through `AdmissionCoordinator`. However, runtime testing identified population disconnection across workspaces:
1. Different workspaces (`/residents`, `/resident/:id`, `/stay/:id`, `/finance`, `/billing`, `/electricity`) read from disparate in-memory repository instances due to independent constructor instantiations and composition root divergence.
2. Presentation components (such as `ResidentFinancialProfile.tsx` and `AccommodationSelectionCard.tsx`) constructed unseeded or isolated in-memory repositories during render.
3. The Residents workspace lacked a direct, prominent entry point for initiating a new Walk-in Admission (`/admission/walk-in`).

### Decision

1. **Canonical Repository Singletons:**
   - Established authoritative exported singleton instances: `defaultResidentRepository`, `defaultStayRepository`, `defaultAccommodationRepository`, `defaultReservationRepository`, `defaultFinanceRepository`, `defaultElectricityRepository`, `defaultBillingRunRepository`, and `defaultBillingClaimRepository`.
2. **Strict Object Identity Invariant:**
   - Enforced strict reference equality (`===`) across all operational coordinators (`AdmissionCoordinator`, `ResidentsListCoordinator`, `ResidentWorkspaceCoordinator`, `StayWorkspaceCoordinator`, `FinanceWorkspaceCoordinator`, `BillingWorkspaceCoordinator`, `AccommodationWorkspaceCoordinator`, `ReservationWorkspaceCoordinator`, `MaintenanceWorkspaceCoordinator`) and the central composition root (`stayWorkflowComposition.ts`).
3. **Elimination of Rogue In-Memory Instantiations:**
   - Removed all ad-hoc `new InMemoryStayRepository()`, `new InMemoryResidentRepository()`, and `new InMemoryAccommodationRepository()` calls in runtime UI components and hook defaults, binding them strictly to canonical singletons.
4. **Primary Admission Entry Point on Residents Page:**
   - Added a `New Admission (Walk-in)` primary action button in the header of `ResidentsPage.tsx` navigating directly to `/admission/walk-in`.
5. **Preservation of Architectural & Financial Contracts:**
   - Preserved all baseline seed data (`RES-00124`, `RES-00125`, `RES-00101`, `STAY-2026-00041`, `STAY-2026-00042`, `STAY-2026-00010`).
   - Preserved Finance Global Action Stay selection (`SelectStayModal.tsx`, ADR-029) and eliminated all synthetic placeholders (`RES-GLOBAL`).
   - Preserved Billing property-wide discovery semantics (`stayIds === undefined || stayIds.length === 0`, ADR-027).
   - Preserved hermetic test isolation by allowing unit/integration tests to inject mock or fresh repository instances when explicitly instantiated with arguments.

### Consequences

#### Advantages:
- **Unified Operational Population:** Any resident admitted via walk-in or converted from a reservation is immediately visible in the Residents List, Resident Workspace, Stay Workspace, Finance Stay Selector, and Billing Discovery.
- **Intuitive Workflow Navigation:** Operators can initiate walk-in admissions directly from the Residents workspace.
- **Zero Data Drift:** Eliminates disconnected runtime state while preserving strict architectural layering and double-entry ledger integrity.
- **Complete Test Verification:** Verified via end-to-end cross-workspace integration tests (`CrossWorkspacePopulationIntegration.test.ts`) with 100% test pass rate across all 94 suites.

---

## ADR-031 — Laundry Operational Support Domain Architecture & Finance Boundary Reconciliation

**Status:** Accepted

### Context

Laundry management is a high-volume operational service required for residents during their stay. Previously, laundry was represented merely as a generic charge type within the Finance domain (or manually triggered via `AddLaundryModal`).

The approved `LAUNDRY_SPECIFICATION.md` establishes a comprehensive business domain model for Laundry as an Operational Support Domain, governing physical collection, garment lines, immutable rate snapshots, pre-processing inspections, routing (`IN_HOUSE` vs `EXTERNAL_VENDOR`), physical returns verification, deliveries (`DIRECT_HANDOVER`, `ROOM_PLACEMENT`), exceptions, investigation, resolution, and service-level chargeability determination.

Explicit architectural decisions are required to formally establish domain ownership, aggregate roots, physical reconciliation invariants, cross-domain charge event boundaries, and prevent the Billing Engine from calculating Laundry-specific pricing.

### Decision

1. **Laundry as an Operational Support Domain:**
   - Laundry is formally established as an Operational Support Domain owning operational laundry truth, physical items, services, charge masters, rate snapshots, garment lines, collection evidence, processing routing, return verification, deliveries, and exceptions.
   - `LaundryTransaction` is the Aggregate Root.
   - Each `LaundryTransaction` belongs to exactly one active `Stay`. A Stay may have multiple concurrent Laundry Transactions.
2. **Physical Reconciliation Invariant:**
   - Physical pieces are reconciled strictly via:
     $$\text{Outstanding} = \text{Collected} - \text{Delivered} - \text{Resolved}$$
   - Physical completion occurs strictly when $\text{Outstanding} = 0$.
   - `Returned` and `Delivered` are distinct physical facts ($\text{Returned} \neq \text{Delivered}$).
   - `Resolved` represents physical pieces conclusively accounted for through formal Exception Resolution where physical delivery will no longer occur (e.g. permanently lost laundry).
3. **Chargeability & Finance Domain Boundary:**
   - A service becomes chargeable only when:
     $$\text{Service Fulfilled} + \text{Affected Physical Quantity Delivered}$$
   - Evaluated deterministically at ServiceAllocation granularity via:
     $$\text{Newly Chargeable Quantity} = \max(0, \min(\text{Fulfilled}, \text{Delivered}) - \text{Previously Charged})$$
   - Each newly chargeable quantity tranche creates an immutable `LaundryChargeRecord` child entity owned by `ServiceAllocation` with a deterministic business identity:
     $$\text{businessChargeId} = \text{transactionId}:\text{garmentLineId}:\text{serviceId}:\text{BRK-XX}$$
   - `LaundryChargeRecord` is initialized with status `PENDING_POSTING` and is transitioned to `POSTED` with `financeBillId` upon financial posting.
   - When chargeable, the Laundry domain emits the `LaundryChargeRaised` domain event with complete pricing context (Stay ID, Transaction ID, Garment Line, Item, Service, chargeable quantity, Rate Snapshot, and calculated amount).
   - Finance receives `LaundryChargeRaised` and creates the authoritative financial Charge in the Unified Stay Ledger. Laundry never creates Finance Charges directly, maintains a parallel financial ledger, or owns financial balances.
   - `LaundryChargeRaised` is uniquely identifiable and Finance must process it idempotently so that delivery retries never duplicate financial Charges.
4. **Billing Engine Independence:**
   - The Billing Engine acts as a batch orchestrator and claim lock manager via `LaundryDiscoveryAdapter`. It evaluates service dates within billing periods, acquires claim locks, and dispatches unbilled charges to Finance without calculating laundry rates or altering pricing rules.
5. **Master Data & Pricing Immutability:**
   - Charge Master rates are captured as immutable Rate Snapshots at Collection Confirmation. Master data price changes never alter historical transactions. No hard-coded pricing is permitted.
6. **Processing Route Operational Decoupling:**
   - Selection between `IN_HOUSE` and `EXTERNAL_VENDOR` is an operational decision and does not alter resident pricing.

### Consequences

#### Advantages:
- Establishes a complete, auditable operational model for Laundry without corrupting financial ledgers.
- Prevents double charging, duplicate billing upon retry, and miscalculation of physical piece counts.
- Preserves clean event-driven boundaries (`LaundryChargeRaised`) aligned with Clean Architecture and DDD.
- Ensures Billing Engine remains a pure orchestrator.

#### Trade-offs:
- Requires event-driven communication and idempotent handling between Laundry and Finance domains.

---

## ADR-032 — Financial Obligation Uniqueness Boundary & Cross-Module Deduplication Architecture

**Status:** Accepted

### Context

During the financial architecture audit (FA-01), an asymmetric financial deduplication defect was identified in the Rent lifecycle:
1. Manual Rent generation directly creates a Finance Bill and posts balanced Ledger entries.
2. A subsequent automated Billing Run executes, and its `RentDiscoveryAdapter` (which hardcoded `commitmentStatus: 'UNCOMMITTED'`) discovers the same commercial rent cycle, acquires an in-memory `BillingClaim`, and invokes `BillingApplicationService.createBill()`.
3. Because `createBill()` lacked invariant duplicate checking, it created a second `MONTHLY_RENT` Bill and posted duplicate debits and credits to the double-entry Ledger.
4. In the reverse direction (Billing Run first, then Manual), duplicate creation was already blocked by Finance's `hasDuplicateRentBill()` domain rule.

Comparative analysis (FA-02) evaluated three candidate architectural models:
- **Model A (Billing-Owned Recurring Obligation Issuance)**: Forcing all bill creation exclusively through the Billing Engine.
- **Model B (Finance-Owned Financial Uniqueness)**: Establishing Finance as the authoritative financial uniqueness and deduplication boundary for all Bill creation paths (automated and manual), while source domains own business facts and obligation identities, and discovery providers check Finance commitments.
- **Model C (Explicit Business Financial Obligation Entity)**: Introducing a cross-cutting `FinancialObligation` entity between domains and Finance.

### Decision

RPGMS 2.0 adopts **Model B (Finance-Owned Financial Uniqueness)** and establishes the following canonical principles:

1. **Clear Conceptual Separation**:
   - **Source-Domain Business Fact**: The originating domain (Stay, Electricity, Laundry, etc.) determines that a chargeable commercial fact exists.
   - **Financial Obligation**: The commercial/financial obligation represented by the source business fact. The source domain remains responsible for its identity and business semantics.
   - **Billing Claim**: An ephemeral operational concurrency lock (`BillingClaim`) acquired by a `BillingRun` to coordinate discovery, eligibility, and execution without collision from competing runs. A Billing Claim is *not* a universal financial obligation and does not by itself constitute financial realization.
   - **Finance Bill**: The authoritative financial realization/record of an obligation within the Finance domain. Finance owns the authoritative financial uniqueness boundary.
   - **Ledger Posting**: The immutable double-entry financial consequence (`validateDoubleEntry`) in the `UnifiedStayLedger`. The Ledger does *not* own business-obligation uniqueness.

2. **Finance as Authoritative Uniqueness Boundary**:
   - All financial realization paths—whether initiated by automated Billing Runs, domain-posted events (Electricity, Laundry), Admission workflows, or authorized staff manual operations—must pass through the same Finance uniqueness boundary.
   - Finance enforces deduplication before persisting Bills or posting Ledger entries.

3. **Obligation Identity (`obligationKey`)**:
   - Every financial charge must carry a stable source-domain obligation identity (`obligationKey` on `BillLineItem` / Bill correlation) sufficient for Finance to determine whether the same obligation has already been financially realized.
   - *Adoption Status (FI-01 & EI-02)*:
     - **Rent**: Converged on `RENT:<stayId>:<anniversaryDate>` with transitional legacy rent period fallback protection.
     - **Laundry**: Participates via `LAUNDRY:<stayId>:<businessChargeId>` on `BillLineItem`.
     - **Electricity**: Integrated (EI-02) via canonical `ELECTRICITY:<stayId>:<participantAllocationId>` on `BillLineItem`, with `participant.financeBillId` preserved as downstream realization reference and Finance uniqueness as authoritative duplicate prevention boundary.

4. **Source-Domain Discovery & Commitment Checking**:
   - Source-domain charge discovery providers must verify existing Finance commitments before presenting obligations as uncommitted, establishing a uniform pattern across all billable domains.

5. **Legitimacy of Manual Operations**:
   - Manual operational actions (e.g. generating a rent bill from the desk, manual adjustments, or operational corrections) remain valid and supported, but are subject to the same Finance uniqueness rules as automated runs.

### Rejected Alternatives

- **Model A (Billing-Owned Issuance) Rejected**: Billing is an orchestration service, not the owner of financial truth. Forcing all charges through Billing contradicts domain-posted invoice independence (BR-414) for Electricity and Laundry, and introduces unnecessary operational friction for desk workflows.
- **Model C (Explicit Financial Obligation Entity) Rejected**: Introducing an intermediate stateful entity across all modules creates unnecessary cross-module complexity, duplicate business state, and migration burden without functional benefit over Model B.

### Consequences

#### Advantages:
- Defines and implements (FI-01, FC-01) the architectural invariant that manual, admission, and automated financial realization paths converge on the same Finance uniqueness boundary, eliminating the architectural asymmetry.
- Preserves the constitutional separation of concerns: Source domains own business pricing; Billing owns batch orchestration; Finance owns financial truth and uniqueness; Ledger owns double-entry balancing.
- Establishes a generic architectural standard applicable across Rent, Electricity, Laundry, and future charge types (Maintenance, Damage, Penalties).

#### Trade-offs & Costs:
- Finance financial-realization APIs enforce financial uniqueness for financial realizations carrying a stable source-domain obligation identity (`obligationKey`), according to applicable source-domain invariants.
- Source-domain charge discovery providers verify existing Finance commitments during discovery before presenting obligations as uncommitted.
- Integration tests verify cross-path deduplication across automated, manual, and admission flows.

---

## ADR-033 — Stay ↔ Finance Financial Truth Boundary & Projection Consumption Architecture

**Status:** Accepted

### Context

Prior to FC-02, the Stay Workspace presentation layer suffered from financial truth fabrication and infrastructure ambiguity (DEF-FIN-001):
- `StayWorkspaceCoordinator` hardcoded fabricated financial values (`outstandingBalance: 0`, `pendingElectricity: 450`, `pendingLaundry: 0`, and synthetic payment date strings).
- `StayWorkspacePage` duplicated billing filter calculations in local React `useMemo` hooks.
- Contractual agreement terms (agreed rent/deposit) were conflated with realized financial ledger balances.

A direct injection of `FinanceRepository` into `StayWorkspaceCoordinator` would violate domain boundaries, leak persistence infrastructure, and tempt duplicate accounting calculations.

### Decision

RPGMS 2.0 establishes the canonical **Stay ↔ Finance Financial Truth Boundary**:

```
Finance Domain (Ledger / Billing / Payments)
      │
      ▼
Finance Application Services / Projections (balanceEngine, billingService, paymentService)
      │
      ▼
Stay Application / Composition Boundary (StayWorkspaceCoordinator via stayWorkflowComposition)
      │
      ▼
Stay Workspace ViewModel (StayWorkspaceViewModel.financialSummary)
      │
      ▼
Stay UI (StayWorkspacePage, FinancialSummaryCard)
```

1. **No Infrastructure Leakage**: `StayWorkspaceCoordinator` depends strictly on application-level Finance capabilities (`BalanceApplicationService`, `BillingApplicationService`, `PaymentApplicationService`), never on `FinanceRepository`.
2. **Authoritative Financial Ownership**:
   - Live Accounts Receivable balance (`outstandingBalance`) is sourced from the Ledger balance engine.
   - Realized security deposit held (`securityDepositHeld`) is sourced from Ledger liability entries.
   - Realized current-month charges (`currentMonthRent`) reflect non-cancelled bills for the stay in the current billing period (`YYYY-MM`).
   - Unbilled states truthfully report `0` or `'No payments recorded'` without synthetic placeholders.
3. **Preservation of Stay Contractual Ownership**:
   - Agreed rent plan and deposit terms remain owned by the Stay aggregate's commercial agreement and are displayed in the `StaySummaryCard`.
   - Realized financial numbers are displayed in the `FinancialSummaryCard`.
4. **F-01 Stay Isolation Invariant**:
   - Stay-scoped financial queries are strictly isolated to the selected stay ID; property-wide totals never leak into stay views.
5. **No Financial Business Logic in UI**:
   - React components and local hooks consume the prepared ViewModel directly without computing financial sums or balances.

### Consequences

#### Advantages:
- Eliminates all fabricated financial constants and synthetic fallback placeholders.
- Preserves the constitutional Workspace Dashboard Principle: UI consumes authoritative application projections rather than computing domain rules.
- Prevents coupling between Stay domain logic and Finance storage schemas.

#### Trade-offs & Costs:
- `StayWorkspaceCoordinator` requires injection of application-level Finance services at composition root (`stayWorkflowComposition`).
- Tests for Stay Workspace coordination verify authoritative Finance projection behavior alongside Stay operational states.

---

## ADR-034 — Finance-Owned Advance Credit & Auto-Consumption Architecture

**Status:** Accepted

### Context

When residents pay amounts exceeding their current accounts receivable, surplus funds represent an unearned revenue liability. Previously, advance credit was stored in the ledger upon overpayment under `AccountType.ADVANCE_CREDIT` but was never consumed when subsequent bills were realized, leaving new bills unpaid while advance credit sat idle (DEF-FIN-002).

### Decision

RPGMS 2.0 establishes the canonical **Finance-Owned Advance Credit & Auto-Consumption Architecture**:

```
BillingApplicationService (Obligation Discovery & Invoicing)
      │
      │ 1. realizes Bill & posts invoice entries (DR AR, CR Revenue)
      │ 2. delegates advance credit application
      ▼
PaymentApplicationService (Financial Intake & Advance Capability)
      │
      ├── AdvanceApplicationRule (Pure Domain Rule)
      │       │ calculates deterministic allocations (dueDate ASC, createdAt ASC)
      │
      ├── LedgerApplicationService
      │       │ posts balanced double-entry (DR ADVANCE_CREDIT, CR ACCOUNTS_RECEIVABLE)
      │       │ deterministic reference: ADV-APP:${bill.id}
      │
      └── updates & persists Bill settlement state (paidAmount, balanceAmount, status)
```

1. **Finance Ownership**: Advance Credit is an authoritative Finance-owned liability recorded under `AccountType.ADVANCE_CREDIT`.
2. **Capability Ownership**: `PaymentApplicationService.applyAdvanceCreditToBills(stayId)` is the canonical owner of the Advance Credit application lifecycle. Billing discovers obligations and triggers this capability without directly mutating ledger accounts or evaluating credit balances.
3. **Pure Domain Rule**: `AdvanceApplicationRule` deterministically calculates allocation amounts across open non-cancelled bills in chronological order of due date (`dueDate` ASC, tiebreaker `createdAt` ASC).
4. **Balanced Accounting Model**: Advance consumption posts balanced double-entry ledger entries:
   - Debit: `AccountType.ADVANCE_CREDIT` (reduces advance liability)
   - Credit: `AccountType.ACCOUNTS_RECEIVABLE` (reduces invoice receivable)
   - Reference: `LedgerReferenceType.ADVANCE_APPLICATION` with deterministic key `ADV-APP:${bill.id}`
5. **Operational Scope**: Advance Credit is stay-scoped operationally (`stayId`). Resolution of surplus credit at checkout is governed by Financial Settlement.
6. **Security Deposit Independence**: Security deposits (`AccountType.SECURITY_DEPOSIT_LIABILITY`) are independent collateral and are strictly excluded from monthly bill auto-consumption.

### Consequences

#### Advantages:
- Eliminates stranded advance credit balances; bills automatically settle upon realization when advance funds exist.
- Strictly preserves double-entry accounting integrity and zero phantom balances.
- Deterministic idempotency (`ADV-APP:${bill.id}`) prevents duplicate consumption across retries.
- Upholds the FC-02 Stay ↔ Finance truth boundary and FI-01 uniqueness invariants.

#### Trade-offs & Costs:
- `BillingApplicationService.createBill` executes advance auto-consumption post-realization.

---

## ADR-035 — Payment Idempotency & Dependency Injection Architecture

**Status:** Accepted
**Date:** August 2026
**Context:** FC-03B Payment Idempotency & Dependency-Injection Cleanup (DEF-FIN-004, DEF-FIN-006)

### Context

During FC-03 architectural audits, two related financial integrity defects were identified:
1. **Lack of Payment Idempotency Guard (`DEF-FIN-004`)**: `PaymentApplicationService.recordPayment` generated random UUID payment identifiers on every execution. Retried network requests, user double-clicks, or automated replays created duplicate payments and duplicate cash/advance ledger entries.
2. **Dependency Injection Leak (`DEF-FIN-006`)**: `PaymentApplicationService` directly imported the global `balanceEngine` singleton, breaking test isolation and causing hermetic services instantiated with mock repositories to query global default state.

### Decision

1. **Payment Identity Separation**:
   - `payment.id`: Internal persistent identity of the Payment record.
   - `idempotencyKey`: Optional client/caller submission key identifying a specific payment intent across retries.
   - `referenceNumber`: Optional external payment identifier (e.g. UPI txn ID, Bank NEFT ref).
2. **Deterministic Replay & Conflict Semantics**:
   - **Exact Idempotent Replay**: When `recordPayment` receives an `idempotencyKey` that already exists for the Stay with identical financial attributes (amount, payment method, reference number), it returns the existing `Payment` without posting duplicate ledger entries or mutating bills.
   - **Idempotency Key Conflict**: If an `idempotencyKey` matches an existing payment but attributes conflict (e.g. different amount), the operation is rejected with an explicit conflict error.
   - **Reference Number Replay & Conflict**: If a matching `(stayId, paymentMethod, referenceNumber)` exists, matching amounts are replayed as exact duplicates, while conflicting amounts are rejected.
3. **Current-Process Concurrency Protection**:
   - `PaymentApplicationService` maintains per-stay active execution locks (`activePaymentLocks`) ensuring concurrent payment submissions for the same stay are strictly serialized across the entire critical section (idempotency check $\rightarrow$ balance read $\rightarrow$ allocation $\rightarrow$ ledger posting $\rightarrow$ persistence).
4. **BalanceApplicationService Dependency Injection**:
   - `PaymentApplicationService` accepts `BalanceApplicationService` via constructor injection (`balanceService?: BalanceApplicationService`), defaulting to `new BalanceApplicationService(repository)`.
   - Direct imports of global `balanceEngine` inside `PaymentApplicationService` are eliminated.

### Consequences

#### Advantages:
- Prevents double-posting of cash receipts, duplicate bill allocations, and phantom advance credit liabilities.
- Supports deterministic network retry and duplicate user submission handling.
- Guarantees hermetic test isolation when custom mock repositories are injected.
- Establishes a clean architectural foundation for future database unique constraints (`UNIQUE(stay_id, idempotency_key)`).

---

## ADR-036 — Receive Payment Workflow & Presentation Truth Boundary

**Status:** Accepted
**Date:** August 2026
**Context:** FC-03C Receive Payment Modal UI & Financial Contract Consumption

### Context

Following the stabilization of FC-03A (Advance Credit auto-consumption) and FC-03B (Payment idempotency and dependency injection), the primary user-facing payment entry point (`ReceivePaymentModal`) required realignment with the authoritative Finance contracts:
1. **False Outstanding Ceiling**: The UI previously blocked payments exceeding outstanding dues and disabled payment recording when outstanding dues were zero, preventing legitimate overpayments and Advance Credit creation.
2. **Missing Client Idempotency Lifecycle**: The UI previously omitted `idempotencyKey` from payment submission payloads, leaving submissions vulnerable to unmanaged double-clicks or retry duplication.
3. **Financial Truth Boundary**: Presentation needed clear separation between real-time estimation previews (dues vs advance) and authoritative Finance realization results.

### Decision

1. **Elimination of UI Payment Ceilings**:
   - The UI shall permit any valid positive payment amount ($> 0$), regardless of whether outstanding receivables are greater than, equal to, or zero.
   - Any payment surplus exceeding open receivables is recognized by Finance as Advance Credit liability (`AccountType.ADVANCE_CREDIT`).
2. **Presentation-Only Estimated Allocation Preview**:
   - The UI may display a real-time estimated allocation preview (dues portion vs advance portion) using pre-calculated balance snapshots.
   - This preview is explicitly labeled as presentation-only and non-authoritative; authoritative bill allocations and advance credit creation are performed strictly by `PaymentApplicationService`.
3. **Client-Side Payment Intent & Idempotency Key Lifecycle**:
   - A unique `idempotencyKey` is generated upon opening a new payment modal session representing that specific payment intent.
   - Ordinary pre-submission field editing (amount, payment method, reference number, remarks) does not churn or regenerate the key; the key remains stable for the entire payment session.
   - Retries of the same payment intent (e.g. after a network glitch, transient error, or concurrency lock) reuse the exact same `idempotencyKey`.
   - Successful payment completion or closing/cancelling and reopening the modal creates a new session with a fresh `idempotencyKey`.
4. **Complete Payment Method Coverage**:
   - Supports all domain enum values (`CASH`, `UPI`, `BANK_TRANSFER`, `CHEQUE`, `CARD`, `OTHER`).
   - Reference number is validated as mandatory for non-cash methods and optional for cash.

### Consequences

#### Advantages:
- Enables full resident advance payment workflows and overpayments without UI restriction.
- Hardens client submissions against duplicate double-clicks and network retries using the FC-03B idempotency contract.
- Clearly separates UI presentation estimation from Finance realization truth.
- Provides operator visibility into existing advance credit and new advance credit generated per transaction.

---

## ADR-037 — Settlement ↔ Bill Synchronization, Live T2 Balance Revalidation, and Checkout Decoupling

### Status
Accepted (FC-04 Settlement ↔ Bill Synchronization Checkpoint)

### Context
Following the completion of payment workflows (FC-01 through FC-03C), the FC-04 architectural audit identified that the Settlement subsystem was operating in isolation from `Bill` entities:
1. **Bill Desynchronization (DEF-FIN-007)**: Settlement credited `ACCOUNTS_RECEIVABLE` in the ledger, but open `Bill` entities remained `UNPAID` or `PARTIALLY_PAID` with unreduced `balanceAmount`.
2. **Stale Snapshot Blind Confirmation (DEF-FIN-008)**: `confirmSettlement` accepted client-side preview payloads from time $T_1$ and posted ledger entries at $T_2$ without re-evaluating live ledger balances, risking duplicate AR credits and negative liabilities if intermediate payments or billing runs occurred.
3. **Missing Settlement Idempotency & Concurrency (DEF-FIN-009)**: `SettlementApplicationService` lacked idempotency key support and per-stay concurrency locking.
4. **Checkout Coupling & Missing Deposit History (DEF-FIN-010)**: Settlement directly mutated `Stay.processCheckout` bypassing `StayCheckoutCoordinator` and bed release, and failed to record a `DepositTransaction` (`SETTLEMENT_CLEARANCE`) in the deposit ledger.

### Decision

1. **Authoritative Obligation Synchronization**:
   - When a settlement resolves accounts receivable, open non-cancelled `Bill` entities (`UNPAID` / `PARTIALLY_PAID`) for the stay are synchronized using canonical FIFO obligation allocation (`calculatePaymentAllocations`) strictly up to the resolved receivable amount (`outstandingReceivable`).
   - For obligations fully resolved by settlement, `paidAmount` is incremented by the allocated amount, `balanceAmount` becomes 0, and `status` transitions to `BillStatus.PAID`.
   - Already-paid bills, cancelled bills, and future/unrelated obligations exceeding the resolved settlement receivable remain untouched in their historical state.
   - Enforces post-settlement invariant:
     $$\text{Ledger AR Balance} = 0 \land \sum_{\text{resolved Bills}} \text{balanceAmount} = 0$$
2. **Live T2 Balance Revalidation**:
   - At confirmation time ($T_2$), `confirmSettlement` re-derives live stay balances from the ledger.
   - If live balances (receivable, advance credit, deposit, net amount, outcome) diverge from the submitted preview snapshot ($T_1$), confirmation is rejected with an actionable error requiring a preview refresh.
3. **Settlement Idempotency, Concurrency & Compensating Rollback Safety**:
   - `confirmSettlement` accepts an optional session-stable `idempotencyKey`.
   - Replaying with the same key and identical financial parameters returns the existing `Settlement` record without duplicate ledger entries or deposit transactions. Conflicting parameters with the same key are rejected with an idempotency conflict error.
   - Serializes concurrent settlement executions via static in-memory `activeStayLocks`.
   - Protects multi-step execution using a pre-operation snapshot and compensating rollback boundary: if any post-ledger repository write fails, all repository state is restored to pre-operation snapshot, ensuring retries with the same `idempotencyKey` execute cleanly without orphan entries or duplicate Ledger realizations.
4. **Deposit Settlement Clearance Audit Trail**:
   - When security deposit liability is cleared in settlement, a `DepositTransaction` with `transactionType: 'SETTLEMENT_CLEARANCE'` is recorded in `FinanceRepository`.
5. **Decoupled Operational Checkout & Post-Checkout Selection**:
   - Removed direct `Stay.processCheckout` mutation from `SettlementApplicationService`, strictly delegating operational checkout to `StayCheckoutCoordinator` (BR-460, BR-209).
   - Updated `FinanceWorkspaceCoordinator.getActiveStaysForSelection()` to include `StayStatus.CHECKED_OUT` stays for post-checkout settlement.

### Consequences

#### Advantages:
- Establishes zero-discrepancy parity between Ledger `ACCOUNTS_RECEIVABLE` and `Bill` obligation entities using canonical FIFO allocation.
- Eliminates race conditions and stale ledger double-credits via live T2 validation, concurrency locking, and compensating rollback.
- Distinguishes Ledger posting atomicity from application-level workflow compensating recovery.
- Restores clear separation between commercial settlement and operational accommodation checkout.
---

## ADR-038 — Operational Checkout Closure Orchestration and Cross-Domain Alumni Evaluation

### Status
Accepted (FC-05 Operational Checkout Checkpoint)

### Context
Following the completion of FC-04 (which cleanly decoupled Financial Settlement from Operational Checkout), the FC-05 architectural audit identified several operational and lifecycle defects:
1. **Broken UI Entry Point (DEF-CHK-001)**: The "Begin Checkout" action in `StayWorkspacePage` triggered `SettlementDialog` instead of an Operational Checkout workflow.
2. **Inverted Resident → Alumni Lifecycle (DEF-CHK-002)**: `SettlementApplicationService` prematurely marked `ACTIVE` residents as `ALUMNI`, while `StayCheckoutCoordinator` did not evaluate the `ALUMNI` invariant at all. Per AL-002 and BR-461, `ALUMNI` conversion requires **both** operational checkout (`CHECKED_OUT`/`CLOSED`) and final financial settlement.
3. **Broken Snapshot Rollback (DEF-CHK-003)**: `StayCheckoutCoordinator` used shallow reference assignment for snapshot capture, breaking rollback on downstream accommodation save failures.
4. **Identifier Inconsistency & Duplicate Logic (DEF-CHK-004, DEF-CHK-006)**: Flat/Bed lookups lacked prefix normalization, and checkout logic was duplicated between `StayCheckoutCoordinator` and `StayLifecycleCoordinator`.

### Decision

1. **Canonical Operational Checkout Owner**:
   - `StayCheckoutCoordinator` is established as the single canonical coordinator for operational checkout. `StayLifecycleCoordinator.processCheckout` delegates directly to `StayCheckoutCoordinator`.
2. **True Snapshot & Compensating Rollback**:
   - Captures independent deep clone snapshots (`new Stay(stay)`, `flatSnapshots`, `residentSnapshot`).
   - If any accommodation or resident persistence step fails, all mutations across Stay, Accommodation, and Resident repositories are reverted cleanly.
3. **Cross-Domain Resident Lifecycle Evaluation (`ResidentLifecycleService`)**:
   - Implemented a reusable, cross-domain `ResidentLifecycleService` enforcing the complete Alumni invariant (AL-002, BR-461):
     $$\text{Status} = \text{ALUMNI} \iff (\forall s \in \text{Stays}(\text{residentId}), s.\text{status} \in \{\text{CHECKED\_OUT}, \text{CLOSED}\} \land \text{SettlementCompleted}(s))$$
   - Both `StayCheckoutCoordinator` (operational closure) and `SettlementApplicationService` (financial closure) trigger this shared evaluation upon completing their respective domain workflows.
4. **Prefix-Resilient Identifier Normalization**:
   - Bed and Flat lookups use prefix normalization (`findFlat`, `isBedMatch`), ensuring physical bed vacancy is synchronized reliably across all active allocations.
5. **Dedicated Operational Checkout UI (`CheckOutModal.tsx`)**:
   - "Begin Checkout" opens `CheckOutModal`, capturing `actualCheckoutDate` and departure notes, while post-checkout stays expose "Financial Settlement".

### Consequences

#### Advantages:
- Enforces permanent separation: Checkout manages operational bed vacating; Settlement manages financial closure.
- Eliminates premature or skipped `ALUMNI` conversions regardless of whether Settlement or Checkout occurs first.
- Guarantees multi-domain failure recovery via deep snapshot rollback.
- Eliminates coordinator duplication and provides a thin, dedicated operational checkout UI.

---

## ADR-039 — Payment Reversal Architecture, Obligation Restoration & Advance Credit Integrity

### Status
Accepted (FC-07 Payment Reversal Checkpoint)

### Context
Following the completion of deposit return workflows (FC-06), the financial architecture required formalization of Payment Reversals (bounced cheques, chargebacks, disputed bank transfers, operator receipt entry errors):
1. **Financial History Mutability Risk**: Deleting or updating historical payments would corrupt double-entry ledger auditing and break historical financial truth (BR-421, BR-422).
2. **Receivable & Bill Obligation Desynchronization**: Reversing a payment without restoring the exact obligations recorded in `payment.allocations` would leave bills in a false `PAID` state while the ledger reflects outstanding receivables.
3. **Advance Credit Derecognition & Negative Liability Defect**: If an overpayment created Advance Credit that was subsequently auto-consumed by later bills, reversing the source payment blindly would drive the advance credit liability into negative values while downstream bills remained paid by phantom funds.
4. **Settlement & Checkout Boundary Invariants**: Reversals must be prevented on settled stays to avoid invalidating finalized settlements, while being supported on checked-out stays prior to settlement.

### Decision
1. **Full Payment Reversal & Immutable Historical Fact**:
   - The canonical reversal unit is the full `Payment` aggregate (`payment.id`). Partial payment reversal is prohibited.
   - Original `Payment`, its `allocations`, and original `LedgerEntry` records remain permanently in the repository.
   - The `Payment` aggregate transitions lifecycle state to `REVERSED`, capturing `reversedAt`, `reversedBy`, `reversalReason`, `reversalIdempotencyKey`, and `reversalLedgerEntryIds`.
2. **Balanced Double-Entry Counter-Postings (`LedgerReferenceType.REVERSAL`)**:
   - Posts balanced compensating entries to the Unified Stay Ledger:
     - **Credit CASH / BANK** (Asset Derecognition) for total amount $A$.
     - **Debit ACCOUNTS_RECEIVABLE** (Asset Restoration) for allocated receivable portion $P_{\text{AR}}$ (if $P_{\text{AR}} > 0$).
     - **Debit ADVANCE_CREDIT** (Liability Derecognition) for advance credit portion $P_{\text{ADV}}$ (if $P_{\text{ADV}} > 0$).
     $$\sum \text{Debit} = P_{\text{AR}} + P_{\text{ADV}} = A = \sum \text{Credit} = A$$
3. **Obligation Restoration & Historical Multi-Payment Preservation**:
   - Iterates through `payment.allocations` and restores target `Bill` balances:
     $$\text{newPaidAmount} = \max(0, \text{paidAmount} - \text{allocationAmount})$$
     $$\text{newBalanceAmount} = \text{totalAmount} - \text{newPaidAmount}$$
     $$\text{newStatus} = \begin{cases} \text{BillStatus.UNPAID} & \text{if } \text{newPaidAmount} = 0 \\ \text{BillStatus.PARTIALLY_PAID} & \text{if } \text{newPaidAmount} > 0 \end{cases}$$
   - Any independent subsequent payments applied to the same bill remain intact and financially effective.
4. **Consumed Advance Credit Guard**:
   - If $P_{\text{ADV}} > 0$ and live available advance credit is less than $P_{\text{ADV}}$ ($\text{LiveAdvanceCredit} < P_{\text{ADV}}$), reversal is strictly rejected, preventing negative liabilities and inconsistent downstream bill statuses.
5. **Settlement Protection & Post-Checkout Support**:
   - Reversal is strictly rejected on `SETTLED` stays to preserve final commercial closure.
   - Reversal is permitted on `CHECKED_OUT` stays before financial settlement.
6. **Idempotency, Concurrency & Compensating Rollback Boundary**:
   - Session-stable `idempotencyKey` supports deterministic replay and conflict detection.
   - Dual-lock mutex (`activePaymentLocks` and `activeStayLocks`) serializes concurrent executions.
   - Deep pre-operation snapshot rollback guarantees clean state restoration across ledger entries, bills, and payments in the event of persistence failures.

### Consequences

#### Advantages:
- Preserves absolute historical auditability without deleting financial records.
- Guarantees exact parity between ledger balances and open bill obligations.
- Eliminates phantom money and negative liability states through the consumed advance credit guard.
- Provides robust idempotency and failure-atomic rollback for in-memory and future relational persistence.

---

## ADR-040 — Advance Credit Application Compensation Boundary (Pre-Supabase Hardening)

### Status
Accepted (Pre-Supabase Hardening Checkpoint)

### Context
The post-FC-07 architectural review (see Final Decision in the review report) identified a HIGH-severity structural gap in `applyAdvanceCreditToBills()`:

1. The function posts `ADVANCE_APPLICATION` ledger entries via `ledgerService.postEntries()`.
2. It then mutates Bill projections (`paidAmount`, `balanceAmount`, `status`) and persists them via `repository.saveBills()`.
3. No compensating rollback existed for the window between steps 1 and 2.

If Bill persistence failed after ledger entries were committed, the system could reach an inconsistent state:
- Ledger: `ADVANCE_CREDIT` consumed (debit posted), `ACCOUNTS_RECEIVABLE` reduced.
- Bills: `paidAmount` / `status` unchanged (stale projection).
- `ADV-APP:{bill.id}` idempotency guard: prevents a corrective re-application on the same bill.

This left no automatic recovery path short of manual ledger correction, a forbidden operation.

The review explicitly noted that the existing `ADV-APP:{bill.id}` deduplication key prevents a second ledger posting but does **not** heal a stale bill projection when the first application's bill update failed — making it not a substitute for a proper compensation boundary.

### Decision
1. **Compensating Rollback Boundary**: Before any mutation, deep-copy snapshots of the full ledger entry array and the full bill array are captured independently. These snapshots serve as the `BEGIN` boundary for the joint ledger + bill mutation pair.
2. **Mutation Sequencing Preserved**: The ledger is posted first (as before), then bills are updated. The sequencing is unchanged; only the failure-path behavior is hardened.
3. **Inner Try/Catch on Bill Persistence**: The bill persistence step is wrapped in an inner `try/catch`. On any thrown error, both the ledger snapshot and the bill snapshot are restored via `repository.saveLedgerEntries(snapshotLedger)` and `repository.saveBills(snapshotBills)`.
4. **Ledger Validation Failure Path Unchanged**: If `ledgerService.postEntries()` returns `success: false` (validation failure before any mutation), no rollback is needed and the early-return path remains unchanged.
5. **Idempotency Consistency**: After a compensating rollback, no `ADV-APP:{bill.id}` entries remain in the ledger for the affected bills, ensuring a subsequent retry executes from a clean idempotent state identical to the pre-operation state.
6. **No New Lock Namespace**: The existing `activeStayLocks (stayId)` mutex is preserved without modification. Compensation does not alter concurrency semantics.
7. **Snapshot Depth**: Snapshots use `array.map(obj => ({ ...obj }))` — shallow-cloning each record object. LedgerEntry and Bill domain entities are plain objects with no nested mutable references, making shallow-clone sufficient for correct restoration.

### Consequences

#### Advantages:
- Eliminates the HIGH-severity class of inconsistency where Advance Credit is ledger-consumed but bills remain stale.
- Preserves full ADV-APP idempotency across both successful and failed application attempts.
- Retry after failure produces exactly the correct financial result with no duplicate entries.
- Establishes the canonical logical transaction scope for the Supabase migration (the snapshot+rollback boundary maps directly to a single database transaction).

#### Trade-offs:
- Adds two full-array reads (`getLedgerEntries()`, `getBills()`) for snapshot capture before every successful application. Accepted cost in the in-memory runtime; will be superseded by database-level transaction isolation at Supabase migration time.

---

## ADR-041: Stay & Finance Operational UI Integration Architecture (UI-INTEGRATION-01)

### Status
Accepted

### Date
August 2026

### Context
While the core financial domain (FC-01 through FC-07) and pre-Supabase hardening (ADR-040) completed and verified all backend business capabilities, the UI-READINESS-01 audit identified critical functional integration gaps:
1. **Deposit Operations Entry Points**: `PartialDepositReturnModal`, `DepositDeductionModal`, and `DepositLedgerTable` existed as tested components but had no operator-facing action buttons on `StayWorkspacePage.tsx` or `FinanceWorkspacePage.tsx`.
2. **Payment Reversal Workflow**: `paymentService.reversePayment()` (FC-07, ADR-039) was fully implemented in the domain layer, but the Finance Workspace lacked a Payment Receipts & Reversal Journal table and confirmation dialog to inspect payments and trigger reversals.
3. **Resident Double-Entry Ledger Viewer**: `ResidentLedgerModal.tsx` was unmounted from the main workspace pages.

### Decision
1. **Stay Workspace Integration**:
   - Extended `QuickActions.tsx` with `onPartialDepositReturn`, `onDepositDeduction`, and `onViewLedger` actions across both active and post-checkout stay lifecycles.
   - Connected `StayWorkspacePage.tsx` to mount `PartialDepositReturnModal`, `DepositDeductionModal`, and `ResidentLedgerModal` using authoritative stay context and financial balance projections.
   - Refactored `StaysRegistryPage.tsx` to access residents via `stayCoordinator.getAllResidents()`, preserving Clean Architecture presentation boundaries.
2. **Finance Workspace Integration**:
   - Created `ReversePaymentModal.tsx` capturing mandatory operational reversal reasons, enforcing double-entry counter-posting notices, and using session-stable idempotency keys.
   - Added a property-wide **Payment Receipts & Reversal Audit** journal table in `FinanceWorkspacePage.tsx` displaying payment details, status chips (`RECORDED` vs `REVERSED`), reversal metadata tooltips, and action triggers.
   - Added global header actions in `FinanceWorkspacePage.tsx` for Deposit Return, Deposit Deduction, and View Full Ledger via `SelectStayModal.tsx`.
   - Mounted `PartialDepositReturnModal`, `DepositDeductionModal`, `ResidentLedgerModal`, and `ReversePaymentModal` in `FinanceWorkspacePage.tsx`.
3. **Financial Truth Boundary Preservation**:
   - Presentation components perform zero accounting math. All financial data is rendered strictly from application service ViewModels (`BalanceApplicationService`, `LedgerApplicationService`, `DepositApplicationService`, `PaymentApplicationService`).

### Consequences

#### Advantages:
- Closes the end-to-end operator feedback loop across all financial capabilities (FC-01 through FC-07).
- Freezes all application layer ViewModel and coordinator contracts prior to relational persistence design (S-ARCH-01).
- Provides comprehensive operational auditability for deposits, payments, reversals, and double-entry ledger rows from the UI.

#### Trade-offs:
- None. Reused existing tested components and application services without architectural drift or visual redesign overhead.

---

## ADR-042: Supabase Persistence Foundation Architecture (S-IMP-01)

### Status
Accepted

### Date
August 2026

### Context
Following the completion and remote verification of the Financial Core (FC-01 through FC-07), Pre-Supabase Hardening (ADR-040), and Operational UI Integration (UI-INTEGRATION-01, ADR-041), the system required moving from pure in-memory test doubles toward a robust, relational Supabase/PostgreSQL persistence architecture. S-ARCH-01 established the relational schema, SQL precision (`NUMERIC(12,2)`), foreign keys, row-level security, and transactional PL/pgSQL atomic RPC functions. S-IMP-01 establishes the foundational implementation.

### Decision
1. **Supabase Client & Config Infrastructure**:
   - Integrated `@supabase/supabase-js` client provider with environment variable configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PERSISTENCE_MODE`).
   - Implemented strict database types (`Database`, `Tables`, `Functions`) in `src/infrastructure/supabase/database.types.ts`.
   - Created configuration helper `getPersistenceMode()` defaulting safely to `'memory'` when credentials are absent.

2. **Relational Database Migrations**:
   - Created foundational migration `20260823000001_initial_schema.sql` defining relational tables for flats, areas, beds, residents, stays, stay_bed_allocations, reservations, bills, bill_line_items, payments, payment_allocations, ledger_transactions, ledger_entries, deposit_transactions, and settlements.
   - Created atomic migration `20260823000002_atomic_functions.sql` establishing PL/pgSQL RPC procedures for deferred double-entry ledger balance constraints (`fn_check_ledger_transaction_balanced`), batch transaction posting (`fn_post_ledger_transaction`), atomic payment receipt and FIFO allocation with row locking (`fn_record_payment_atomic`), atomic payment reversal (`fn_reverse_payment_atomic`), and operational checkout bed vacancy updates (`fn_process_operational_checkout`).

3. **Supabase Repository Adapters & Domain Mappers**:
   - Implemented domain entity to DB row mappers: `AccommodationMappers`, `ResidentMappers`, `StayMappers`, and `FinanceMappers`.
   - Implemented Supabase repository adapters: `SupabaseAccommodationRepository`, `SupabaseResidentRepository`, `SupabaseStayRepository`, and `SupabaseFinanceRepository`.
   - Created `repositoryFactory` in `src/infrastructure/repositoryFactory.ts` to manage runtime repository dependency resolution based on active persistence mode.

4. **Repository Contract Tests & Test-Double Preservation**:
   - Created comprehensive contract tests (`AccommodationPersistenceContract.test.ts`, `ResidentPersistenceContract.test.ts`, `StayPersistenceContract.test.ts`, `FinancePersistenceContract.test.ts`) validating entity mapping roundtrips and repository CRUD invariants.
   - Preserved existing in-memory repository singletons (`InMemoryAccommodationRepository`, `InMemoryResidentRepository`, `InMemoryStayRepository`, `InMemoryFinanceRepository`) ensuring existing unit and integration test suites run completely without external network dependencies.

### Consequences

#### Advantages:
- Establishes a production-ready PostgreSQL persistence foundation without compromising the pure domain layer or business rules.
- Guarantees financial double-entry integrity at both the application level and database constraint level.
- Provides a clean switching mechanism between in-memory and Supabase persistence modes.

#### Trade-offs:
- Requires dual repository maintenance during the phased migration, mitigated by shared contract tests.

---

## ADR-043 — Master & Guest Operational Persistence Implementation (Accommodation, Resident, Reservation)

### Status
Accepted (S-IMP-02 Implementation Checkpoint)

### Context
Following the foundational persistence architecture established in S-ARCH-01 and S-IMP-01 (ADR-042), S-IMP-02 activates production-ready Supabase persistence for the Master and Guest Operational domains: **Accommodation**, **Resident**, and **Reservation**.

Prior to S-IMP-02:
1. `AccommodationRepository` was partially synchronous, leading to contract friction when interacting with relational database adapters.
2. `ResidentRepository` Supabase adapter had stubs that required fail-fast error handling and `.maybeSingle()` queries.
3. `ReservationRepository` lacked a Supabase adapter, relational row mapper, and persistence contract tests.
4. Callers across coordinators and UI components needed harmonization for async persistence (`Promise<T>`) while retaining synchronous in-memory test double helpers (`*Sync`) for deterministic unit and integration test assertions.

### Decision
1. **Harmonized Async Domain Repository Contracts**:
   - `AccommodationRepository` domain interface is standardized to return `Promise<T>` for all I/O operations (`findAll`, `findById`, `save`, `saveAll`, `delete`).
   - `InMemoryAccommodationRepository` fulfills the async contract and provides `*Sync` helper methods (`findAllSync`, `findByIdSync`, `saveSync`, `saveAllSync`, `deleteSync`) for synchronous in-memory test doubles and coordinators.
2. **Reservation Persistence Adapter & Mappers**:
   - Implemented `ReservationMappers` handling bidirectional domain $\leftrightarrow$ relational row translation:
     - Domain `ACTIVE` $\leftrightarrow$ DB `'CONFIRMED'` (preserving PG enum compatibility).
     - Audit log serialization and JSON timestamp handling.
   - Implemented `SupabaseReservationRepository` supporting full async CRUD and search operations with strict fail-fast error handling (no silent memory fallback).
   - Implemented `ReservationPersistenceContract.test.ts`.
3. **Resident Persistence Hardening**:
   - Hardened `SupabaseResidentRepository` with explicit fail-fast errors on database or PostgREST failure.
   - Replaced `.single()` with `.maybeSingle()` for clean null-handling on missing records.
4. **Repository Factory & Composition Root Integration**:
   - Integrated `reservationRepository` into `RepositoryRegistry` and `repositoryFactory.ts`.
   - Wired `stayWorkflowComposition.ts` to source all domain repositories directly from `repositoryRegistry`.
5. **Memory-Mode Regression Protection**:
   - Validated that `VITE_PERSISTENCE_MODE=memory` remains fully functional across all domains (Accommodation, Resident, Reservation, Stay, Admission, Billing, Finance, Electricity, Laundry).

### Consequences

#### Advantages:
- Complete relational persistence coverage for Master (Accommodation) and Guest (Resident, Reservation) domains.
- Clear contract boundary: domain repository contracts are strictly asynchronous (`Promise<T>`); in-memory doubles provide synchronous accessors for fast isolated testing.
- Eliminates silent failure risk by ensuring Supabase adapters propagate explicit persistence errors.

#### Trade-offs:
- Coordinators interfacing with multiple in-memory doubles must explicitly use synchronous helper methods or async orchestration.

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 4.8 | August 2026 | S-IMP-02: Master & Guest Operational Persistence (ADR-043, Accommodation async harmonization, SupabaseReservationRepository, ReservationMappers, ReservationPersistenceContract tests, Resident hardening, repositoryFactory integration). |
| 4.7 | August 2026 | S-IMP-01: Supabase Persistence Foundation (ADR-042, initial DDL migrations, atomic functions, database types, Supabase repository adapters, mappers, contract tests, repository factory). |
| 4.6 | August 2026 | UI-INTEGRATION-01: Stay & Finance Operational UI Integration (ADR-041, ReversePaymentModal, Deposit & Ledger Action Wiring). |
| 4.5 | August 2026 | Pre-Supabase Hardening: Advance Credit Application Compensation Boundary (ADR-040, BR-425). |
| 4.4 | August 2026 | FC-07: Payment Reversal Architecture, Obligation Restoration & Advance Credit Integrity (ADR-039, BR-424). |
| 4.3 | August 2026 | FC-05: Operational Checkout Closure Orchestration & Cross-Domain Alumni Evaluation (ADR-038, BR-460, BR-461, AL-002, DEF-CHK-001 through DEF-CHK-007). |
| 4.2 | August 2026 | FC-04: Settlement ↔ Bill Synchronization, Live T2 Revalidation & Checkout Decoupling (ADR-037, DEF-FIN-007, DEF-FIN-008, DEF-FIN-009, DEF-FIN-010). |
| 4.1 | August 2026 | FC-03C: Receive Payment Workflow & Presentation Truth Boundary (ADR-036, BR-423). |
| 4.0 | August 2026 | FC-03B: Payment Idempotency & Dependency Injection Architecture (ADR-035, BR-419, DEF-FIN-004, DEF-FIN-006). |
| 3.9 | August 2026 | FC-03A: Finance-Owned Advance Credit & Auto-Consumption Architecture (ADR-034, DEF-FIN-002). |
| 3.8 | August 2026 | FC-02: Stay ↔ Finance Financial Truth Boundary & Projection Consumption Architecture (ADR-033, DEF-FIN-001). |
| 3.7 | August 2026 | FC-01: Core Financial Truth & Admission Obligation Convergence (BR-416, BR-417, DEF-FIN-003, DEF-FIN-005, UI-FIN-001). |
| 3.6 | August 2026 | Added ADR-032 (Financial Obligation Uniqueness Boundary & Cross-Module Deduplication Architecture). |
| 3.5 | August 2026 | Added ADR-031 (Laundry Operational Support Domain Architecture & Finance Boundary Reconciliation). |
| 3.4 | August 2026 | Added ADR-030 (Cross-Workspace Operational Population Unification & Canonical Repository Singletons). |
| 3.3 | August 2026 | Added ADR-029 (Finance Workspace Global Action Stay Selection & Elimination of Scaffolding Placeholder). |
| 3.2 | August 2026 | Added ADR-028 (Stay Workspace Contextual Quick Actions Integration & Coordinator Delegation). |
| 3.1 | August 2026 | Added ADR-027 (Authoritative Runtime Repository Graph Unification & Property-Wide Billing Discovery Semantics). |
| 3.0 | August 2026 | Added ADR-026 (Billing Engine Charge Ownership, Discovery Contracts, and Cross-Domain Financial Reconciliation). |
| 2.9 | August 2026 | Added ADR-025 (Billing Engine Controlled Run, Claim, Recovery and Retry Architecture). |
| 2.8 | August 2026 | Added ADR-024 (Running Deposit Account Lifecycle, Partial Returns, and Decoupled Settlement). |
| 2.7 | August 2026 | Added ADR-023 (Electricity Allocation Reversal, Audit Integrity & Controlled Financial Adjustment). |
| 2.6 | August 2026 | Added ADR-022 (Electricity Consumption Allocation & Financial Ledger Billing Integration). |
| 2.5 | August 2026 | Added ADR-021 (Finance UI Workspace Coordination & Interactive Modal Integration). |
| 2.4 | August 2026 | Added ADR-020 (Financial Reporting, Activity Timeline & Workspace Coordination). |
| 2.3 | August 2026 | Added ADR-019 (Payment Processing & Billing Core Stabilization). |
| 2.2 | August 2026 | Added ADR-018 (Synchronous Admission Finance Initialization & Compensating Rollback). |
| 2.1 | August 2026 | Added proposed ADR-015 (Bidirectional Resident to Reservation Traceability). |
| 2.0 | July 2026 | Rewritten using a structured ADR format aligned with the RPGMS business architecture. |
