# RPGMS 2.0

# Module Status

**Document Version:** 3.1
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
| Application Shell | 🟢 Complete |
| Accommodation Module | 🟢 MVP Complete |
| Resident Module | 🟢 MVP Complete |
| Stay Workspace | 🟢 MVP Complete |
| Reservation & Admission | 🟢 Complete |
| Finance | 🟢 Complete (CR-3 / Sprint FR-5) |
| Electricity | 🟢 MVP Complete (CR-4 / Stage 1–5 Complete) |
| Maintenance | 🟢 Foundation Complete |
| Reports | 🟢 Foundation Complete |

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
- Quick Actions
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
- Resident Financial Profile (`ResidentFinancialProfile.tsx`)
- Deposit Ledger Table (`DepositLedgerTable.tsx`)
- Partial Deposit Return Modal (`PartialDepositReturnModal.tsx`)
- Deposit Deduction Modal (`DepositDeductionModal.tsx`)
- Two-Stage Checkout Settlement Dialog (`SettlementDialog.tsx`)

### Business Capabilities

- Double-entry ledger architecture (`LedgerApplicationService`, `BalanceEngine`)
- Monthly rent bill generation & category accounting
- Security Deposit liability account & category routing (`AccountType.SECURITY_DEPOSIT_LIABILITY`)
- Running Deposit Account ledger (`DepositTransaction`)
- Additional deposit contributions (`DEPOSIT_RECEIPT`) & mid-stay partial returns (`PARTIAL_RETURN`)
- Damage deductions (`DEPOSIT_DEDUCTION`) with mandatory reason auditing
- Over-return & over-deduction balance guards
- Decoupled settlement preview & confirmation (`CHECKED_OUT` stay support under BR-460)
- Resident status transition to `ALUMNI` on final financial completion (BR-461)
- Complete Vitest test suite (51 test files, 324 passing tests)

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

# Maintenance Module

**Status:** 🟢 Foundation Complete

**State:** Future Capability

## Purpose

Manages maintenance requests, work orders, vendor coordination, asset servicing, and issue resolution across the hostel.

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
| Finance | 🔵 Active Development | Active (CR-3) |
| Electricity | 🟢 MVP Complete | Active (CR-4) |
| Maintenance | 🟢 Foundation Complete | Future Capability |
| Reports | 🟢 Foundation Complete | Future Capability |

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

