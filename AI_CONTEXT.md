# AI_CONTEXT.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-003
Version         : 1.1
Status          : Active
Owner           : Project Architecture
Created         : 2026-07-16
Last Updated    : 2026-07-16
Applies To      : All AI Assistants working on RPGMS 2.0

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document provides the business and technical context required for any AI
assistant contributing to RPGMS 2.0.

It explains what the project is, why it exists, how the business operates,
and the core principles that should guide implementation.

This document describes the project.

It does not define coding standards or AI operating procedures.

Those are documented separately in:

- AI_GOVERNANCE.md
- AI_INSTRUCTIONS.md

Before proposing changes to entities, aggregate boundaries, ownership, or business processes, review:

BUSINESS_BLUEPRINT.md
BUSINESS_RULES.md
DOMAIN_MODEL.md
ARCHITECTURE.md

------------------------------------------------------------------------------
Project Overview
------------------------------------------------------------------------------

Project Name

RPGMS 2.0

Purpose

Replace the existing Google Sheets + Google Apps Script based PG Management
System with a modern web application.

The goal is to build a commercial-quality Hostel / PG Management System that is:

- Simple to operate
- Financially accurate
- Easy to maintain
- Scalable for future growth

Repository

RPGMS-2.0

Primary Branch

feature/application-shell (current development branch)

Default Branch

main

------------------------------------------------------------------------------
Business Scope
------------------------------------------------------------------------------

Current MVP Scope

- Single PG
- Single Administrator
- Desktop-first
- Responsive UI
- Single business entity

Not included in Version 1

- Multi-property support
- Multi-tenant architecture
- Franchise management
- Advanced analytics
- Mobile-first workflows

These capabilities may be considered in future versions.

------------------------------------------------------------------------------
Out of Scope (Version 1)
------------------------------------------------------------------------------

The following are intentionally excluded from the MVP:

- Multi-property management
- Multiple administrators
- Native mobile application
- Offline synchronization
- Franchise management
- Advanced analytics
- AI-powered automation

These features may be considered in future releases.

------------------------------------------------------------------------------
Business Terminology
------------------------------------------------------------------------------

Resident
    A person staying in the PG.

Flat
    A physical accommodation unit.

Bed
    The smallest allocatable accommodation unit.

Ledger
    The authoritative record of financial transactions.

Security Deposit
    Refundable amount held separately from the resident ledger.

Notice
    Resident has informed management of their intention to leave.

Checkout
    Completion of the resident's stay.

Occupancy
    Current allocation of beds to residents.

Service
    A chargeable facility or recurring resident service.

------------------------------------------------------------------------------
Business Architecture
------------------------------------------------------------------------------

The application follows the natural business workflow.

Accommodation
        ↓
Residents
        ↓
Finance
        ↓
Electricity
        ↓
Reports

Business modules should reflect real operational workflows wherever possible.

------------------------------------------------------------------------------
Business Principles
------------------------------------------------------------------------------

Financial Principles

- The ledger is the financial source of truth.
- Financial balances are calculated, never stored.
- Historical financial records are immutable.
- Security deposits are maintained separately from the resident ledger.

Accommodation Principles

- One active resident occupies one active primary bed.
- One bed may have only one active resident.
- Historical allocations are preserved.

Billing Principles

- Billing must remain auditable.
- Charges should always be reproducible from source records.
- Business correctness takes precedence over UI convenience.

------------------------------------------------------------------------------
Resident Lifecycle
------------------------------------------------------------------------------

Resident Status

- Active
- On Notice
- Checked Out

Business Rules

Notice Date automatically proposes a Checkout Date
30 days later.

Checkout Date remains editable until checkout is completed.

Historical resident information must always remain available.

---

## Resident Module Context

The Resident module manages the permanent identity of individuals residing within the PG.

Resident owns:

- Personal Information
- Contact Information
- Address
- Documents
- Emergency Contacts
- Registered Vehicles
- Registered Devices
- Medical Information

Resident does not own operational residency.

Operational residency belongs to the Stay domain.

The Resident Workspace presents Stay information through projections only.

### Resident Module Principles

The Resident Module follows these constitutional principles:

- One Person → One Resident.
- One Resident → One Active Stay.
- Admission follows the Standard Admission Workspace.
- Admission follows Minimal Operational Admission.
- Profile information is completed progressively.
- Documents represent evidence.
- Compliance records business activities.
- Timeline presents Business Events.
- Search is read-only.
- Navigation is read-only.
- Historical information is preserved.

### Resident Workspace

The Resident Workspace is organised into operational sections.

Major components include:

- Resident Header
- Current Stay Summary
- Operational Readiness
- Profile Completion
- Personal Information
- Contact Information
- Address
- Emergency Contacts
- Documents
- Vehicles
- Devices
- Compliance Summary
- Timeline

The Resident Workspace acts as the operational hub for resident-related activities while preserving clear ownership boundaries between Resident, Stay, Accommodation, Compliance and Finance.

------------------------------------------------------------------------------
Electricity Workflow
------------------------------------------------------------------------------

Electricity Billing Process

Enter Bill

        ↓

Allocate Consumption

        ↓

Generate Resident Charges

        ↓

Post Ledger Entries

------------------------------------------------------------------------------
Technology Overview
------------------------------------------------------------------------------

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

This section provides high-level context only.

Detailed implementation standards belong in AI_INSTRUCTIONS.md.

------------------------------------------------------------------------------
Development Philosophy
------------------------------------------------------------------------------

The project follows these principles:

- MVP First
- Keep It Simple
- Avoid Over-Engineering
- Deliver Working Software
- Build for Long-Term Maintainability
- Prefer Readability over Cleverness

------------------------------------------------------------------------------
User Experience Philosophy
------------------------------------------------------------------------------

The application should require minimal training.

It should be:

- Simple
- Fast
- Consistent
- Professional
- Predictable

Business users should be able to operate the system confidently without
extensive technical knowledge.

------------------------------------------------------------------------------
Current Project Phase
------------------------------------------------------------------------------

Milestone M0

Engineering Foundation

Current Focus

- Documentation
- Governance
- Architecture
- Application Shell

Business module development begins after the Engineering Foundation milestone
is completed.

------------------------------------------------------------------------------
Related Documents
------------------------------------------------------------------------------

- DOCUMENTATION_INDEX.md
- AI_GOVERNANCE.md
- AI_INSTRUCTIONS.md
- ROADMAP.md
- docs/ARCHITECTURE.md
- docs/BUSINESS_RULES.md

------------------------------------------------------------------------------
Version History
------------------------------------------------------------------------------

Version    Date         Description
-------    ----------   -----------------------------------------------
1.0        2026-07-15   Initial project context.
1.1        2026-07-16   Expanded business context, terminology,
                        architecture and project philosophy.

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status          : Active

Approved By     : Project Owner

Approval Date   : 2026-07-16

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------