# RPGMS 2.0

# Module Status

**Document Version:** 3.2
**Status:** Active  
**Last Updated:** August 2026


---

# Purpose

This document provides the current implementation status of every major RPGMS 2.0 business module.

It serves as the single source of truth for module maturity, implementation progress, dependencies, and future development priorities.

Unlike the project roadmap, which focuses on future planning, this document reflects the current state of implementation of each module.

---

# Current Project Status

## Current Development Phase

**Business Capability Development**

The engineering foundation, application shell, accommodation model, and Resident ecosystem have been completed. Development is now focused on delivering the remaining business capabilities required for the Minimum Viable Product (MVP).

---

## Current Capability Release

**CR-4 — Operational Services**

Current development is focused on delivering the Operational Services capability release (CR-4), including electricity metering, consumption allocation, utility billing, and maintenance management.

---

## Overall Project Health

| Area | Status |
|-------|--------|
| Engineering Foundation | 🟢 Complete |
| Supabase Persistence Foundation | 🟢 Complete (S-IMP-01 / ADR-042) |
| Master & Guest Operational Persistence | 🟢 Complete (S-IMP-02 / ADR-043) |
| Application Shell | 🟢 Complete |
| Accommodation Module | 🟢 MVP Complete (Supabase Persisted) |
| Resident Module | 🟢 MVP Complete (Supabase Persisted) |
| Stay Workspace | 🟢 MVP Complete |
| Reservation & Admission | 🟢 Complete (Reservation Persisted) |
| Finance | 🟢 Complete (CR-3 / Sprint FR-5) |
| Electricity | 🟢 MVP Complete (CR-4 / Stage 1–5 Complete) |
| Billing | 🟢 Slices 1–4B Complete (CR-4) |
| Population Unification | 🟢 Complete (ADR-030) |
| Maintenance | 🟢 Foundation Complete |
| Reports | 🟢 Foundation Complete |
| Laundry | 🟢 Exception Lifecycle Presentation Workflows Complete (L-01–L-14 Complete) |

---

# Module Status

The following sections describe the implementation maturity of each major RPGMS business module.

---

# Accommodation Module

**Status:** 🟢 MVP Complete

**State:** Frozen

## Purpose

Manages the complete physical accommodation hierarchy of RPGMS, including Areas, Flats, Beds, occupancy management, and accommodation structure. This module provides the physical foundation upon which Reservations, Admissions, Residents, and Stays operate.

---

## Completed

### Workspace

- Accommodation Workspace
- Area Management
- Flat Management
- Bed Management

### Business Features

- Accommodation hierarchy
- Flat capacity management
- Bed lifecycle management
- Bed status management
- Occupancy summary
- Live accommodation overview
- Accommodation validation

### User Experience

- Modern workspace layout
- Summary dashboard
- Search and filtering
- Consistent workspace navigation
- Responsive interface

### Architecture

- Clean Architecture
- Repository abstraction
- Coordinator pattern
- ViewModel pattern
- Presentation layer separation
- In-memory infrastructure implementation

---

## Future Enhancements

- Supabase repository implementation
- Accommodation analytics
- Occupancy forecasting
- Bulk accommodation operations
- Advanced reporting

---

## Dependencies

### Upstream

None

### Downstream

- Reservation
- Admission
- Resident
- Stay

---

# Resident Module

**Status:** 🟢 MVP Complete

**State:** Frozen

## Purpose

Manages the permanent identity of every resident and provides the primary operational workspace for resident lifecycle management.

The Resident Module is independent of the Stay lifecycle and acts as the central operational hub for resident-related activities throughout RPGMS.

---

## Completed

### Workspaces

- Residents List Workspace
- Resident Workspace
- Current Stay Summary

### Business Features

- Universal resident search
- Resident status filtering
- Resident profile management
- Contact information
- Address management
- Emergency contacts
- Government identification
- Document management
- Registered vehicles
- Registered devices
- Resident assets management

### Operational Dashboard

- Profile Completion
- Operational Readiness
- Current Stay projection
- Quick Actions
- Resident summary information

### User Experience

- Workspace Navigation
- Parent-child workspace navigation
- Responsive workspace layout
- Consistent business section cards
- Single entry point for Resident Profile editing
- Operational workspace design

### Architecture

- Clean separation between Resident and Stay
- Coordinator pattern
- ViewModel pattern
- Repository abstraction
- Read model projections
- Clean Architecture compliance

---

## Future Enhancements

- Resident timeline
- Compliance summary
- AI-assisted recommendations
- Advanced universal search
- Resident activity history
- Resident communication history

---

## Dependencies

### Upstream

- Accommodation

### Downstream

- Stay
- Reservation
- Admission
- Finance
- Electricity
- Maintenance
- Reports

---

# Stay Module

**Status:** 🟢 MVP Complete

**State:** Frozen

## Purpose

Manages the operational residency of a resident independently of the Resident identity.

The Stay Module records where a resident is staying, the period of occupancy, accommodation allocation, and operational status. A resident may have multiple stays over time, while the Resident identity remains permanent.

---

## Completed

### Workspaces

- Stay Workspace
- Current Stay Summary
- Accommodation Allocation
- Stay Information

### Business Features

- Stay lifecycle management
- Area allocation
- Flat allocation
- Bed allocation
- Door ID projection
- Joining date tracking
- Monthly rent projection
- Security deposit projection
- Stay status management

### User Experience

- Parent-child workspace navigation
- Interactive Quick Actions (Record Payment, Generate Monthly Rent, Add Laundry Charges, Add Electricity Charges navigation, Transfer Bed, Give Notice, Begin Checkout)
- Operational workspace layout
- Current Stay projection
- Consistent workspace sections

### Architecture

- Independent Stay aggregate
- Resident / Stay separation
- Accommodation projection
- Read model projections
- Repository abstraction
- Coordinator pattern
- ViewModel pattern
- Clean Architecture compliance

---

## Future Enhancements

- Stay history
- Stay transfer workflow
- Stay extensions
- Financial summary
- Stay timeline
- Operational analytics

---

## Dependencies

### Upstream

- Accommodation
- Resident

### Downstream

- Finance
- Electricity
- Maintenance
- Reports

---

# Reservation Module

**Status:** 🟢 Complete

**State:** Frozen

## Purpose

Manages prospective residents from initial enquiry through reservation confirmation until admission.

The Reservation Module bridges the gap between enquiry and admission while maintaining reservation history, follow-ups, and booking status.

---

## Planned Features

### Workspaces

- Reservations List Workspace
- Reservation Workspace

### Business Features

- Reservation lifecycle
- Reservation status management
- Expected admission tracking
- Reservation follow-ups
- Reservation notes
- Reservation search

### User Experience

- Workspace navigation
- Operational dashboard
- Reservation summary
- Quick actions

---

## Dependencies

### Upstream

- Accommodation

### Downstream

- Admission
- Resident
- Stay

---

# Admission Module

**Status:** 🟢 Complete

**State:** Frozen

## Purpose

Converts a confirmed reservation (or direct walk-in) into an operational Resident and an active Stay.

The Admission Module is responsible for validating admission readiness, allocating accommodation, collecting mandatory information, and creating the operational records required for hostel management.

---

## Planned Features

### Workspaces

- Admission Workspace
- Admission Readiness Dashboard

### Business Features

- Walk-in admission
- Reservation conversion
- Accommodation allocation
- Resident creation
- Stay creation
- Document verification
- Admission checklist

### User Experience

- Guided admission workflow
- Operational readiness validation
- Admission summary
- Quick actions

---

## Dependencies

### Upstream

- Reservation
- Accommodation

### Downstream

- Resident
- Stay
- Finance

---

# Finance Module

**Status:** 🟢 Complete

**State:** Frozen (CR-3 / Stage 6 Deposit Account Lifecycle & Settlement Refinement Completed)

## Purpose

Manages the complete financial lifecycle of residents, including rent, running security deposit account, electricity, laundry, split billing, payments, damage adjustments, decoupled checkout settlement, and resident ledger management.

---

## Completed Features

### Workspaces & Components

- Finance Dashboard & Workspace (`FinanceWorkspacePage.tsx`)
- Payment Receipts & Reversal Audit Journal Table
- Authoritative Stay Selector Dialog (`SelectStayModal.tsx`)
- Reverse Payment Confirmation Modal (`ReversePaymentModal.tsx`)
- Resident Financial Profile (`ResidentFinancialProfile.tsx`)
- Resident Double-Entry Ledger Viewer (`ResidentLedgerModal.tsx`)
- Deposit Ledger Table (`DepositLedgerTable.tsx`)
- Partial Deposit Return Modal (`PartialDepositReturnModal.tsx`)
- Deposit Deduction Modal (`DepositDeductionModal.tsx`)
- Two-Stage Checkout Settlement Dialog (`SettlementDialog.tsx`)
- Stay Workspace Quick Actions Integration (`QuickActions.tsx`, `StayWorkspacePage.tsx`)

### Business Capabilities

- Double-entry ledger architecture (`LedgerApplicationService`, `BalanceEngine`)
- Authoritative Stay-scoped selection for all global dashboard actions (eliminated placeholder `RES-GLOBAL`)
- Monthly rent bill generation & category accounting
- Security Deposit liability account & category routing (`AccountType.SECURITY_DEPOSIT_LIABILITY`)
- Running Deposit Account ledger (`DepositTransaction`)
- Additional deposit contributions (`DEPOSIT_RECEIPT`) & mid-stay partial returns (`PARTIAL_RETURN`)
- Damage deductions (`DEPOSIT_DEDUCTION`) with mandatory reason auditing
- Over-return & over-deduction balance guards
- Payment reversal workflow with balanced double-entry compensating counter-postings & obligation restoration (ADR-039, ADR-041)
- Operator-facing UI integration for Deposit Return, Deposit Deduction, Resident Ledger, and Payment Reversals across Stay and Finance workspaces (UI-INTEGRATION-01)
- Decoupled settlement preview & confirmation (`CHECKED_OUT` stay support under BR-460)
- Resident status transition to `ALUMNI` on final financial completion (BR-461)
- Complete Vitest test suite (123 passing test files, 1,247 passing tests)

---

## Dependencies


### Upstream

- Resident
- Stay

### Downstream

- Reports

---

# Electricity Module

**Status:** 🟢 MVP Complete (Stage 1–5 Implemented)

**State:** Active (CR-4)

## Purpose

Manages electricity supplier bills, sub-meter readings, monthly consumption, historical occupancy reconstruction, operator share selection, resident utility bill allocation, ledger counter-posting, and allocation reversal audit integrity.

---

## Completed Features

### Workspaces & Modals

- Electricity Workspace (`ElectricityPage.tsx`)
- Supplier Bill Entry Modal (`SupplierBillEntryModal.tsx`)
- Draft Allocation Review Panel (`DraftAllocationReviewPanel.tsx`)
- Allocation History & Audit Table (`AllocationHistoryTable.tsx`)
- Allocation Reversal Modal (`ReverseAllocationModal.tsx`)

### Business Features

- Physical sub-meter reading & tariff calculation engine
- Supplier bill ingestion (`ElectricityBill`)
- Historical occupancy reconstruction (`ParticipantDiscoveryService`)
- Potential share calculation & operator share selection
- Remainder paise deterministic allocation
- Finance ledger double-entry posting (`Debit ACCOUNTS_RECEIVABLE`, `Credit ELECTRICITY_REVENUE`)
- Allocation Reversal & Audit Integrity workflow (`CONFIRMED -> REVERSED`)
- Finance bill cancellation (`BillStatus.CANCELLED`) & ledger counter-posting (`referenceType = REVERSAL`)
- Owner-absorbed allocation handling (`OWNER_ABSORBED`)
- Application-level compensating rollback on multi-participant failure
- Complete Vitest test suite (50 test files, 312 passing tests)

---

## Dependencies

### Upstream

- Accommodation
- Stay

### Downstream

- Finance

---

# Billing Module

**Status:** 🟢 Slices 1–4B Complete (Normal Billing & Recovery/Retry Workbenches Complete)

**State:** Active Operational Capability (CR-4)

## Purpose

Orchestrates controlled billing cycles across Stays and uncommitted domain charges (Rent, Ancillary), discovers billable obligations, enforces first-claim-wins concurrency, revalidates live state against material changes at eligibility cutoff, dispatches consolidated billing batches to Finance without duplicating domain-posted invoices (e.g. Confirmed Electricity), resolves uncertain financial dispatch outcomes (`RECOVERY_REQUIRED`) against authoritative Finance evidence, and enables safe, non-duplicating retry runs with immutable lineage.

---

## Completed (Slices 1–4B)

### Domain & Claims (Slice 1)
- `BillingRun`, `BillingOperation`, `BillingClaim` aggregates
- Deterministic identity (`ObligationKey`)
- Atomic claim repository (`tryAcquireClaim`, first-claim-wins)
- Validation rules (`BillingClaimRules`)

### Discovery & Eligibility (Slice 2)
- Multi-provider discovery engine (`BillingDiscoveryService`)
- Source-domain adapters (`RentDiscoveryAdapter`, `ElectricityDiscoveryAdapter`)
- Eligibility evaluation & breakdown (`BillingEligibilityService`)
- Read-only observation of confirmed Electricity (`COMMITTED`)

### Execution Orchestration & Finance Integration (Slice 3)
- Execution orchestrator (`BillingExecutionService`)
- Material change detection (`MaterialChangeRules`)
- Final pre-dispatch revalidation & all-or-nothing dispatch
- Consolidated Finance dispatch via `BillingApplicationService.createBill()`
- Clean failure release vs. uncertainty (`RECOVERY_REQUIRED`) claim retention
- Graceful stop mechanics & immutable retry lineage

### Normal Operator Workspace (Slice 4A)
- Presentation coordinator (`BillingWorkspaceCoordinator`)
- Strongly typed view models (`BillingWorkspaceViewModel`)
- React state hook (`useBillingWorkspace`)
- Dashboard KPI summary cards (`BillingSummaryCards`)
- Active run execution & graceful stop banner (`ActiveRunBanner`)
- Run creation dialog (`CreateRunModal`)
- Interactive preview & drilldown with material change alert (`PreviewConfirmationModal`)
- Historical run audit dialog (`RunDetailsModal`)
- Historical runs table (`BillingRunsTable`)
- Dedicated workspace page (`BillingPage`) registered at `/billing` and sidebar

### Recovery & Retry Workbench (Slice 4B)
- Application recovery service (`BillingRecoveryService`)
- Authoritative Finance evidence correlation (matched Bills & balanced double-entry ledger postings)
- Evidence classification (`COMMITTED`, `NOT_COMMITTED`, `UNKNOWN`)
- Conclusive recovery resolution methods on `BillingOperation` (`resolveCommitted`, `resolveNotCommitted`)
- Gated resolution semantics: `resolveAsCommitted` (commits claims, transitions to `SUCCESS`, permanently prevents retry) vs. `resolveAsNotCommitted` (releases claims, transitions to `FAILED`, enables retry)
- Strict prohibition of force-resolving `UNKNOWN` or inconclusive evidence
- Immutable Retry Run creation (`retryOfRunId = originalRun.id`) with strict exclusion of `SUCCESS`, `NO_CHARGES`, and blocking of unresolved `RECOVERY_REQUIRED` operations
- Interactive Recovery Workbench modal (`RecoveryWorkbenchModal`) and Retry Run modal (`CreateRetryRunModal`)

### Property-Wide Discovery Substrate (Repair 1)
- Contractual support for `stayIds: undefined` across `ChargeDiscoveryProvider`, `BillingDiscoveryService`, `RentDiscoveryAdapter`, and `ElectricityDiscoveryAdapter` for property-wide runs.
- Chronological date normalization (`normalizeToIsoDate`) in `RentDiscoveryAdapter` supporting both ISO and persisted human-readable date formats (e.g. `12-Mar-2026`).
- End-to-end integration tests proving property-wide run creation against shared seed repository records without requiring manual stay ID selection.

---

## Deferred Scope (Future Capabilities)

- **Future:** Operational Laundry discovery via `LaundryDiscoveryAdapter` (aligned with approved `LAUNDRY_SPECIFICATION.md` domain design).
- **Future:** Maintenance / Penalty billing (pending Maintenance commercial architecture).
- **Future:** PostgreSQL / Supabase SQL schema & repository persistence migration.
- **Future:** Automated / Cron scheduled billing cycles and AI recovery heuristics.

---

## Dependencies

### Upstream

- Stay
- Resident
- Accommodation
- Electricity

### Downstream

- Finance

---

# Laundry Module

**Status:** 🟢 Complete / Production-Ready (L-01 – L-16 Complete)

**State:** Fully Implemented / MVP Complete

## Purpose

Manages the complete operational lifecycle of resident laundry services, from collection, garment lines, rate snapshots, pre-processing inspection, routing (in-house vs external vendor), return count verification, delivery handovers (direct vs room placement), exceptions, investigation, resolution, cancellation, and determination of chargeable laundry services emitting `LaundryChargeRaised` domain events to Finance.

---

## Completed (L-01 through L-16)

### Domain & Business Rules (L-01 – L-07)

- Master Data: Laundry Item Master, Laundry Service Master, Laundry Charge Master (L-01)
- Aggregate Root & Invariants: `LaundryTransaction`, `GarmentLine`, `ServiceAllocation` (L-02)
- Service Fulfillment & Chargeability: BR-L-012 newly chargeable quantity evaluation (L-03)
- Collection & Snapshot: Immutable Rate Snapshots captured at collection confirmation (L-04)
- Inspection & Routing: Condition observations, inspection verification, routing release (L-05)
- Returns & Custody: Return verification, piece counting, physical reconciliation invariant (L-06)
- Delivery & Exceptions: Direct/Room placement delivery, exception investigation and resolution (L-07)

### Cross-Domain & Infrastructure (L-08 – L-09)

- Finance Integration: `LaundryPostingService` consuming `LaundryChargeRaised` events to create authoritative Finance Bills (L-08)
- Persistence & Storage: `InMemoryLaundryRepository`, `laundryStorage`, ephemeral `evidenceStorage` with Section 181 lifecycle (L-09)
- Composition Root Registration: Singletons registered in `stayWorkflowComposition.ts` (L-09)

### Application Orchestration Layer (L-10)

- Presentation Models: Pure read-only ViewModels (`LaundryWorkspaceMetricsViewModel`, `LaundryTransactionSummaryViewModel`, `LaundryTransactionDetailViewModel`, `LaundryMasterCatalogViewModel`, `SelectableLaundryStayItem`, `PostChargesResultViewModel`, `LaundryChargeRecordViewModel`)
- Application DTOs: Strongly-typed input and filter contracts (`CreateCollectionDraftDTO`, `ConfirmCollectionDTO`, `CancelCollectionDTO`, `RecordInspectionDTO`, `ReleaseProcessingDTO`, `RecordReturnDTO`, `RecordDeliveryDTO`, `RaiseExceptionDTO`, `RecordInvestigationDTO`, `ResolveExceptionDTO`, `PostChargesDTO`, etc.)
- Application Services: `LaundryCollectionService`, `LaundryProcessingService`, `LaundryDeliveryService`, `LaundryExceptionService`, `LaundryEvidenceService`
- Workspace Coordinator: `LaundryWorkspaceCoordinator` orchestrating operational workflows, cross-domain Stay/Resident/Flat enrichment, and Finance charge posting
- Composition Root Integration: Registered `laundryWorkspaceCoordinator` in `stayWorkflowComposition.ts`

### Presentation Foundation (L-11)

- Workspace Shell & Hook: `LaundryWorkspacePage.tsx` and `useLaundryWorkspace.ts`
- Operational Dashboard: `LaundryDashboardCards.tsx` with 1-to-1 metric-click filtering
- Search & Toolbar: `LaundryToolbar.tsx` supporting universal search and lifecycle status tabs
- Responsive Table & Cards: `LaundryTransactionTable.tsx`
- Multi-Tab Inspector: `LaundryTransactionDetailDrawer.tsx` rendering all ViewModel facets without frontend business calculations
- Initial Command Dialogs: `CreateCollectionDraftDialog.tsx` and `ConfirmCollectionDialog.tsx`
- Application Shell Integration: Registered `/laundry` route in `router.tsx` and Sidebar navigation with `LocalLaundryService` icon

### Collection & Processing Presentation Workflows (L-12)

- Pre-Processing Inspection Dialog: `RecordInspectionDialog.tsx` with garment line review, defect category selection, affected piece limits, photo evidence URIs, and sign-off
- Route & Processing Release Dialog: `ReleaseProcessingDialog.tsx` supporting `IN_HOUSE` and `EXTERNAL_VENDOR` routes with mandatory vendor identifier
- Workflow Orchestration: Strict 2-step sequence enforcement (`COLLECTED` -> Inspection -> Release to Processing -> `IN_PROCESS`)
- Workspace Table & Drawer Actions: Integrated quick inspection triggers in table and contextual action buttons in the detail drawer

### Returns & Delivery Presentation Workflows (L-13)

- Physical Return Receipt Dialog: `RecordReturnDialog.tsx` supporting garment lines return quantities, receiving staff ID, timestamp, return notes, and custody preview.
- Custody Reconciliation Presentation: Integrated in `LaundryTransactionDetailDrawer.tsx` Tab 1 ("Processing & Custody") presenting expected pieces, cumulative returned pieces, outstanding return pieces, and line-by-line custody breakdown without frontend business calculations.
- Resident Delivery Handover Dialog: `RecordDeliveryDialog.tsx` supporting `DIRECT_HANDOVER` (in person with resident verification) and `ROOM_PLACEMENT` (room location reference and placement photo evidence URIs).
- Delivery-Triggered BR-L-012 Chargeability: Seamless chargeability evaluation in domain aggregate upon delivery, updating commercial totals and service allocation charges in `LaundryTransactionDetailDrawer.tsx` Tab 4 ("Commercial & Charges").
- Workspace Table & Drawer Integration: Contextual return and delivery triggers in table and detail drawer.

### Exception Lifecycle Presentation Workflows (L-14)

- Raise Operational Exception Dialog: `RaiseExceptionDialog.tsx` supporting transaction-level, garment-line-level, and service-allocation-level exception targeting, affected quantity inputs, optional delivery blocking requests, descriptions, and photo evidence references.
- Exception Investigation Dialog: `RecordInvestigationDialog.tsx` supporting investigator staff ID, findings notes, operational responsible party attribution (`VENDOR`, `RESIDENT`, `RPGMS`, `UNKNOWN`, `NONE`, `OTHER`), and evidence references.
- Resolve Exception Dialog: `ResolveExceptionDialog.tsx` supporting authoritative resolution outcomes (`ITEM_RECOVERED`, `SERVICE_CORRECTED`, `VENDOR_CORRECTED`, `RESIDENT_ACCEPTED`, `PERMANENTLY_LOST`, `NO_ACTION_REQUIRED`, `OTHER`), resolved physical pieces contributing to physical reconciliation without delivery, and resolution notes.
- Exception Lifecycle Inspector: Integrated in `LaundryTransactionDetailDrawer.tsx` Tab 3 ("Exceptions") with status badges (`OPEN`, `UNDER_INVESTIGATION`, `RESOLVED`), blocking delivery indicators, garment/service targeting tags, chronological investigation audit logs, formal resolution outcome cards, and contextual action buttons.
- Physical Completion Projection: Projected authoritative `totalResolvedPieces` from domain onto summary and detail ViewModels without frontend calculation.

### Commercial Finance Posting Workflows (L-15)

- Post Charges Confirmation Dialog: `PostChargesDialog.tsx` supporting itemized pending charge review, authoritative quantity/rate/amount inspection, staff ID identity confirmation (`staffId`), and error recovery.
- Commercial & Charges Tab Presentation: Completed in `LaundryTransactionDetailDrawer.tsx` Tab 4 ("Commercial & Charges") with financial summary cards, unposted charges action banner, itemized charges table with charge keys, unit rates, quantities, total amounts, posting status badges (`POSTED` vs `PENDING_POSTING`), and direct Finance Bill ID references.
- Idempotent Finance Orchestration: Wired `evaluateAndPostCharges` through `useLaundryWorkspace.ts` and `LaundryWorkspaceCoordinator.ts`, strictly enforcing `businessChargeId` idempotency.

### Operational Completion & Hardening (L-16)

- Pre-Release Collection Cancellation Workflow: `cancelCollection()` domain aggregate method, `CancelCollectionDTO`, `LaundryCollectionService.cancelCollection()`, and `CancelCollectionDialog.tsx` modal presentation enforcing Section 15 rules (permitted only for `DRAFT` and `COLLECTED` prior to processing release, with mandatory `staffId`, mandatory `reason`, and `physicalReturnedToResident: true` event recording).
- Comprehensive Operational Hardening & Regression Suite: `LaundryOperationalHardening.test.ts` validating all canonical positive cancellation paths, negative rejection across all prohibited states (`IN_PROCESS`, `RETURNED_*`, `DELIVERED_*`, `COMPLETED`, `CANCELLED`), non-interference isolation with Finance, and multi-stage lifecycle reconciliation.

---

## Dependencies

### Upstream

- Stay
- Resident
- Accommodation

### Downstream

- Finance
- Billing (read-only discovery)
- Reports

---

# Maintenance Module

**Status:** 🟢 MVP Complete (CR-4 / Maintenance Foundation Implemented)

**State:** Active Operational Capability

## Purpose

Manages maintenance requests, operational repairs, technician assignments, category & location metrics, financial repair costs, and append-only audit histories across the hostel.

---

## Planned Features

### Workspaces

- Maintenance Dashboard
- Complaint Workspace
- Work Order Workspace

### Business Features

- Complaint registration
- Maintenance tracking
- Vendor management
- Asset maintenance
- Resolution history

---

## Dependencies

### Upstream

- Accommodation
- Resident

### Downstream

- Reports

---

# Reports Module

**Status:** 🟢 Foundation Complete

**State:** Future Capability

## Purpose

Provides operational, financial, accommodation, and management reports across all RPGMS business modules.

---

## Planned Features

### Workspaces

- Reports Dashboard

### Business Features

- Occupancy reports
- Resident reports
- Financial reports
- Electricity reports
- Maintenance reports
- Management dashboards
- Export and printing

---

## Dependencies

### Upstream

All business modules

---

# Current Priorities

The immediate focus of the project is to consolidate the completed Resident Module and establish a stable engineering baseline before beginning the next major business capability.

## Documentation Consolidation Sprint (DCS-1)

Current objectives:

- Review and freeze the Resident Module MVP.
- Freeze the Resident Workspace Specification.
- Update governance and engineering documents.
- Capture reusable workspace design patterns.
- Establish a stable documentation baseline for future development.

---

# Next Capability Release

## CR-2 – Reservation & Admission Management

### Primary Deliverables

- Reservations List Workspace
- Reservation Workspace
- Admission Workspace
- Admission Readiness Dashboard
- Reservation Search
- Reservation Follow-up
- Reservation to Admission conversion workflow
- Resident and Stay integration

---

# Module Maturity Summary

| Module | Status | State |
|---------|--------|--------|
| Engineering Foundation | 🟢 Complete | Stable |
| Application Shell | 🟢 Complete | Stable |
| Accommodation | 🟢 MVP Complete | Frozen |
| Resident | 🟢 MVP Complete | Frozen |
| Stay | 🟢 MVP Complete | Frozen |
| Reservation | 🟢 Complete | Frozen |
| Admission | 🟢 Complete | Frozen |
| Finance | 🟢 Complete (CR-3) | Frozen |
| Electricity | 🟢 MVP Complete | Active (CR-4) |
| Billing | 🟢 Slices 1–4B Complete | Active (CR-4) |
| Population Unification | 🟢 Complete (ADR-030) | Stable |
| Maintenance | 🟢 Foundation Complete | Future Capability |
| Reports | 🟢 Foundation Complete | Future Capability |
| Laundry | 🟢 Exception Workflows Complete | L-01 – L-14 Complete (L-15 In Progress) |

---

# Overall Project Assessment

RPGMS 2.0 has successfully completed its engineering foundation and the first two major business capabilities:

- Accommodation Management
- Resident Management

The project has now transitioned from platform construction to business capability development.

The completed Resident Module establishes the reference implementation for future RPGMS workspaces, introducing standardized workspace navigation, operational dashboards, consistent section layouts, and clear domain ownership between Resident and Stay.

Future modules will follow these established engineering and user experience patterns to ensure architectural consistency across the application.

---

# Document Maintenance

This document is updated whenever a business module reaches a significant implementation milestone or changes its development state.

Routine feature additions within an existing module do not require updates unless they materially change the module's maturity or roadmap.

