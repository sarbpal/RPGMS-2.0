# MODULE STATUS

**Version:** 3.0  
**Status:** Active

---

## Purpose

This document provides the current implementation status of every major business and technical domain within RPGMS.

It serves as a high-level project dashboard, showing the maturity of each domain, current focus, and upcoming milestones.

This document is a project status snapshot and should not be used as a changelog.

---

## Status Legend

| Status | Meaning |
|---------|---------|
| 🟢 Stable | Implemented and considered stable. |
| 🟡 In Progress | Active development is underway. |
| 🔵 Planned | Design completed, implementation planned. |
| ⚪ Not Started | Not yet started. |
| 🔴 Needs Review | Requires architectural or implementation review. |

---

## Foundation

### Application Shell

**Status:** 🟢 Stable

**Purpose**

Provides the common application framework, navigation, routing, authentication boundaries, and responsive layout used by all business domains.

**Completed**

- Application shell
- Header
- Sidebar
- Responsive layout
- Routing
- Main layout
- Theme integration

**Pending**

- None

---

### Dashboard

**Status:** 🟡 In Progress

**Purpose**

Provides operational visibility into the current state of RPGMS through real-time metrics, alerts, and actionable information.

**Completed**

- Dashboard layout
- Summary cards
- Quick actions
- Placeholder widgets

**Pending**

- Live occupancy metrics
- Financial summary
- Operational alerts
- Resident activity
- Today's tasks
- Real-time data integration

**Next Milestone**

Connect dashboard components to live business data from the Accommodation, Resident, Stay, and Finance domains.

---

## Core Business Domains

### Accommodation

**Status:** 🟢 Stable

**Purpose**

Manages the physical accommodation structure of RPGMS, including Flats, Areas, Beds, and occupancy capacity.

**Completed**

- Accommodation business architecture
- Flat management
- Area management
- Automatic bed generation
- Bed naming rules
- Live Layout Preview
- Bed status management
- Capacity calculation
- Occupancy summary

**Pending**

- Edit Flat workflow
- Accommodation persistence
- Advanced occupancy reporting

**Next Milestone**

Integrate Accommodation with the Stay domain for resident allocation and occupancy management.

---

### Resident

**Status:** 🟡 In Progress

**Purpose**

Manages the permanent identity and profile of every Resident independently of accommodation occupancy.

**Completed**

- Resident Profile Specification
- Resident Architecture
- Business Rules
- Data Model
- Residents Module Audit (`RESIDENT_MODULE_AUDIT.md`)
- Service Layer Foundation (`residentService.ts`)
- Custom Hooks (`useResidents.ts`, `useResident.ts`)
- Resident Profile Expansion (Sprint 7.2 - Identity, Family, Emergency Contact, Address, Occupation, Medical)
- Section-Level Card Profile Editing UI (`ResidentProfilePage.tsx`)

**Pending**

- Resident Profile domain separation (Stay domain integration in Sprint 7.3)
- Resident history timeline & Stay event log
- Operational lifecycle dialogs (Notice, Checkout, Bed Transfer)

**Next Milestone**

Implement domain separation (Resident vs Stay) and Stay domain integration.

---

### Stay

**Status:** 🟡 In Progress

**Purpose**

Manages the operational relationship between Residents and Accommodation, including reservations, occupancy, transfers, notice periods, and checkout.

**Completed**

- Stay Specification
- Business Rules
- Data Model
- Stay Migration Plan (`STAY_MIGRATION_PLAN.md`)
- Data Ownership Matrix (`DATA_OWNERSHIP_MATRIX.md`)
- Stay Domain Foundation Types (`Stay`, `StayStatus`, `StayEvent`) in `src/features/residents/stay/types/`
- Stay Service Public Interface & Persistence Helpers (`stayService.ts`)
- Storage Versioning (`rpgms_storage_version`) & Stay Storage (`rpgms_stays`)
- Idempotent Legacy Data Migration Adapter (`migrateLegacyResidentsData()`)

**Pending**

- Hook integration & atomic onboarding transactions (Sprint 7.3.3)
- Stay event logging & timeline
- Operational lifecycle dialogs (Notice, Checkout, Bed Transfer)

**Next Milestone**

Implement Hook Integration & Atomic Onboarding Transactions in Sprint 7.3.3.

---

## Financial Domains

### Finance

**Status:** 🔵 Planned

**Purpose**

Manages the financial records of every Stay, ensuring complete, accurate, and auditable accounting of all monetary transactions.

**Completed**

- Finance domain identified
- Business architecture defined
- Data model defined
- Ledger identified as the single source of truth

**Pending**

- Finance Specification
- Ledger implementation
- Financial transaction engine
- Receipts
- Refunds
- Adjustments
- Financial reconciliation

**Next Milestone**

Complete the Finance Specification and implement the Ledger foundation.

---

### Billing

**Status:** 🔵 Planned

**Purpose**

Manages recurring charges, billing cycles, invoices, rent calculation, and bill generation.

**Completed**

- Business rules defined
- Data model defined
- Anniversary billing model established

**Pending**

- Billing Specification
- Billing engine
- Invoice generation
- Recurring charge management
- Due date management
- Billing history
- Billing reports

**Next Milestone**

Implement the Billing engine after the Finance foundation is complete.

---

## Operational Domains

### Compliance

**Status:** 🔵 Planned

**Purpose**

Manages all statutory, contractual, and organizational compliance requirements associated with a Stay.

**Completed**

- Compliance Architecture
- Business Rules
- Data Model

**Pending**

- Compliance Specification
- Police Intimation
- Rent Agreement Management
- Tenant Verification
- Document Management
- Compliance Dashboard
- Compliance Reporting

**Next Milestone**

Complete the Compliance Specification following the Finance and Billing domains.

---

### Door IDs

**Status:** 🔵 Planned

**Purpose**

Manages secure access credentials assigned to Residents during an Active Stay.

**Completed**

- Business Rules
- Data Model

**Pending**

- Door ID assignment
- Door ID release
- Assignment history
- Integration with access control system
- Door ID reporting

**Next Milestone**

Implement Door ID management after the Stay domain is operational.

---

### Complaints

**Status:** ⚪ Not Started

**Purpose**

Manages the complete lifecycle of resident complaints from reporting through resolution.

**Completed**

- Business Rules
- Data Model

**Pending**

- Complaint Specification
- Complaint registration
- Complaint assignment
- Resolution workflow
- Complaint history
- Complaint reporting

**Next Milestone**

Design and implement the Complaint domain.

---

### Reporting

**Status:** ⚪ Not Started

**Purpose**

Provides operational, financial, occupancy, and management reporting across all business domains.

**Completed**

- Reporting identified as a business domain

**Pending**

- Reporting Specification
- Operational reports
- Financial reports
- Occupancy reports
- Compliance reports
- Management dashboards
- Analytics

**Next Milestone**

Implement reporting after the core operational domains are complete.

---

## Technical Foundation

### Architecture

**Status:** 🟢 Stable

**Purpose**

Establishes the long-term business and technical architecture of RPGMS.

**Completed**

- Business Architecture
- Resident Specification
- Accommodation Specification
- Stay Specification
- Business Rules
- Data Model
- Domain ownership defined
- Logical entity relationships defined

**Pending**

- Finance Specification
- Billing Specification
- Compliance Specification

---

### Documentation

**Status:** 🟡 In Progress

**Purpose**

Maintains the architectural, business, and technical knowledge required for long-term project development.

**Completed**

- Project Rules
- Architecture
- Business Rules
- Data Model
- Resident Specification
- Accommodation Specification
- Stay Specification
- Compliance Architecture
- Development Log

**Pending**

- Rewrite MODULE_STATUS.md
- Rewrite DECISIONS.md
- Rewrite NEXT_TASK.md
- Finance Specification
- Billing Specification
- Compliance Specification

---

### Code Quality

**Status:** 🟢 Stable

**Purpose**

Ensures the codebase remains maintainable, consistent, and suitable for long-term development.

**Completed**

- Feature-first project structure
- TypeScript
- ESLint
- Shared business utilities
- Reusable component architecture
- Consistent project organization

**Pending**

- Unit testing
- Integration testing
- End-to-end testing

---

### Deployment

**Status:** 🟢 Stable

**Purpose**

Provides a reliable development and deployment pipeline.

**Completed**

- GitHub repository
- Vercel deployment
- Development workflow
- Branch strategy

**Pending**

- Production deployment pipeline
- Release workflow
- Automated testing pipeline

---

## Current Focus

Complete the documentation baseline by finalizing the remaining governance documents before beginning implementation of the Finance domain.

---

## Next Major Milestone

**Finance Domain**

Deliverables:

- Finance Specification
- Billing Specification
- Compliance Specification
- Finance implementation foundation

---

## Overall Project Health

| Area | Status |
|------|--------|
| Business Architecture | 🟢 Complete |
| Technical Foundation | 🟢 Stable |
| Documentation | 🟡 In Progress |
| Core Domain Specifications | 🟢 Complete |
| Implementation | 🟡 In Progress |
| Finance Domain | 🔵 Planned |
| Billing Domain | 🔵 Planned |
| Compliance Domain | 🔵 Planned |

---

# Change Log

| Version | Date | Description |
|---------|------|-------------|
| 3.0 | July 2026 | Reorganized module status around the RPGMS business architecture and project roadmap. |

## Finance

Status: COMPLETE
Specification: COMPLETE
Architecture: STABLE
Version: 2.0
State: SEALED

---

