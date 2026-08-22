# RPGMS 2.0

# Product Roadmap

**Document Version:** 3.0  
**Status:** Active  
**Last Updated:** 07 Aug 2026

---

# Purpose

This roadmap defines the planned evolution of RPGMS 2.0 from its current MVP implementation towards a complete hostel and PG management platform.

Unlike the Module Status document, which records implementation progress, this roadmap focuses on future business capabilities, capability releases, and long-term product direction.

---

# Product Vision

RPGMS 2.0 is being developed as a modern, workspace-oriented hostel and PG management platform.

The primary objective is to provide hostel operators with an operational system that mirrors real-world business workflows rather than traditional CRUD-based software.

The platform is built around independent business domains connected through clearly defined relationships while maintaining Clean Architecture and strict domain ownership.

---

# Current Development Phase

MVP Engineering

The engineering foundation has been completed.

The Accommodation and Resident capabilities have reached MVP completion.

Development is now focused on Reservation and Admission Management.

---

# Current Milestone

## Capability Release 3 (CR-3) / Operational UI Integration

**Status:** ✅ Completed

### Delivered

- Finance Dashboard & Operational Integration (UI-INTEGRATION-01)
- Payment Reversal Confirmation & Audit Journal (ADR-039, ADR-041)
- Security Deposit Operations (Partial Returns & Deductions) Entry Points
- Authoritative Resident Double-Entry Ledger Modal
- Financial Core Hardening & Advance Credit Compensation Boundary (ADR-040)

Business documentation is considered frozen for MVP implementation.

---

# Capability Release Roadmap

Development of RPGMS 2.0 is organized into Capability Releases (CRs).

Each Capability Release delivers one complete business capability rather than a collection of unrelated technical tasks.

---

## CR-1 — Resident Management

**Status:** ✅ Completed

### Delivered

- Engineering Foundation
- Application Shell
- Accommodation Module
- Residents List Workspace
- Resident Workspace
- Stay Workspace
- Operational Dashboard
- Workspace Navigation
- Resident Assets
- Current Stay Summary

---

## CR-2 — Reservation & Admission Management

**Status:** ✅ Completed

### Delivered

- Reservations List Workspace
- Reservation Workspace
- Reservation Search
- Reservation Follow-up
- Admission Workspace
- Admission Readiness
- Walk-in Admission
- Reservation Conversion
- Resident Creation
- Stay Creation

---

## CR-3 — Financial Operations

**Status:** ✅ Completed

### Delivered

- Finance Dashboard & Workspace
- Double-Entry Resident Ledger
- Monthly Rent Generation & Category Accounting
- Security Deposit Liability Category Routing (`AccountType.SECURITY_DEPOSIT_LIABILITY`)
- Running Deposit Account Ledger & Additional Contributions (DEC-DEP-02)
- Mid-Stay Partial Deposit Returns & Over-Return Balance Guards (DEC-DEP-01)
- Damage Deductions & Mandatory Reason Auditing
- Payment Management & Advance Overpayment Handling
- Payment Reversal & Counter-Entry Posting (ADR-039)
- Operational UI Integration across Stay and Finance Workspaces (ADR-041, UI-INTEGRATION-01)
- Decoupled Post-Checkout Settlement Preview & Confirmation (BR-460)
- Resident ALUMNI Status Transition on Financial Completion (BR-461 & DEC-DEP-03)


---

## CR-4 — Operational Services

**Status:** 🔄 In Progress

### Completed Deliverables

- Electricity Workspace & Supplier Bill Ingestion
- Physical Meter Reading & Tariff Engine
- Historical Occupancy Reconstruction & Share Selection Allocation
- Electricity Allocation Reversal & Financial Adjustment Workflow (BR-E-49)

### Planned Deliverables

- Maintenance Workspace
- Complaint Management
- Vendor Management
- Operational Reports

---

## CR-5 — Reporting & Analytics

**Status:** Planned

### Planned Deliverables

- Management Dashboard
- Occupancy Analytics
- Financial Analytics
- Resident Analytics
- Electricity Analytics
- Export & Printing
- Business Reports

---

## CR-6 — Platform Enhancements

**Status:** Future

### Planned Deliverables

- Supabase Infrastructure
- Notifications
- AI Assistance
- Mobile Optimisation
- Performance Improvements
- Advanced Search
- Timeline Views
- Compliance Monitoring

---

# Business Capability Evolution

RPGMS 2.0 is being developed incrementally, with each capability building upon the previous one. The objective is to deliver complete business workflows rather than isolated software features.

---

## Phase 1 – Platform Foundation

**Status:** ✅ Completed

### Objectives

- Establish engineering standards.
- Implement Clean Architecture.
- Build the application shell.
- Create the accommodation model.
- Establish the Resident and Stay domains.

### Outcome

A stable engineering platform supporting future business capabilities.

---

## Phase 2 – Resident Operations

**Status:** ✅ Completed

### Objectives

- Resident management
- Stay management
- Operational workspaces
- Current Stay projection
- Resident operational dashboard
- Workspace navigation

### Outcome

Complete operational management of existing residents.

---

## Phase 3 – Reservation & Admission

**Status:** 🔄 In Progress

### Objectives

- Reservation lifecycle
- Admission workflow
- Walk-in admissions
- Reservation conversion
- Admission readiness
- Resident creation
- Stay creation

### Outcome

Complete resident onboarding workflow.

---

## Phase 4 – Financial Operations

**Status:** Planned

### Objectives

- Billing
- Resident ledger
- Payments
- Deposits
- Electricity allocation
- Laundry billing

### Outcome

Complete financial lifecycle management.

---

## Phase 5 – Operational Services

**Status:** Planned

### Objectives

- Maintenance
- Electricity operations
- Operational reporting
- Vendor management

### Outcome

Complete day-to-day hostel operations.

---

## Phase 6 – Business Intelligence

**Status:** Future

### Objectives

- Analytics
- Dashboards
- AI assistance
- Forecasting
- Advanced reporting

### Outcome

Data-driven hostel management.

---

# MVP Success Criteria

The RPGMS 2.0 Minimum Viable Product (MVP) will be considered complete when the following business capabilities are fully implemented, tested, documented, and operational.

## Core Business Capabilities

- Accommodation Management
- Reservation Management
- Admission Management
- Resident Management
- Stay Management
- Finance Management
- Electricity Management
- Maintenance Management
- Reports & Operational Dashboards

---

## Engineering Goals

The MVP must satisfy the following engineering objectives:

- Clean Architecture throughout the application.
- Strict business domain ownership.
- Workspace-oriented user experience.
- Consistent navigation patterns.
- Responsive user interface.
- Complete TypeScript type safety.
- Automated testing for critical business logic.
- Stable production builds.
- Complete constitutional documentation.

---

# Long-Term Product Vision

Following MVP completion, RPGMS will evolve into a comprehensive hostel and PG management platform through incremental capability releases.

Future development may include:

- AI-assisted operational workflows
- Predictive analytics
- Resident communication tools
- Mobile applications
- Multi-property management
- Vendor ecosystem integration
- Advanced business intelligence
- Workflow automation
- Notification services
- External system integrations

Future enhancements will build upon the stable engineering and business foundations established during the MVP.

---

# Roadmap Governance

This roadmap is reviewed whenever a major business capability reaches MVP completion or when project priorities change.

Routine implementation details, bug fixes, and minor feature additions are tracked through the project backlog and do not require roadmap updates.

The roadmap should remain a strategic planning document focused on business capability evolution rather than day-to-day development activities.

## Documentation Capability Sprint 2 (Completed)

Status: ✅ Complete

Core business architecture frozen.

Outputs:

- BUSINESS_CONSTITUTION.md
- BUSINESS_MODEL.md
- BUSINESS_RULES.md
- BUSINESS_EVENTS_SPECIFICATION.md
- RESERVATION_WORKSPACE_SPECIFICATION.md
- ADMISSION_WORKSPACE_SPECIFICATION.md
