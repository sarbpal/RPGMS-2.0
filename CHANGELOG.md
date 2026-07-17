# CHANGELOG.md

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-008
Version         : 2.0
Status          : Active
Owner           : Development Team
Created         : 2026-07-16
Last Updated    : 2026-07-16
Applies To      : RPGMS 2.0 Repository

Purpose

This document records the historical evolution of RPGMS 2.0.

Unlike SESSION.md, this document is permanent.

Entries are never removed.

Corrections are made by adding new entries rather than rewriting history.

All notable changes to this project will be documented here.

---

## Version 0.1.0

### Added

- Project created
- GitHub repository
- VS Code setup
- PROJECT_RULES.md
- Initial Architecture Decisions
- MVP Roadmap

---

### Status

Project Initialization Complete

# Sprint 0.5 – Repository Foundation

Status

Completed

Summary

Repository restructured into the production layout.

Added

• Standard project structure
• Initial application architecture

Changed

• Flattened repository
• Consolidated package configuration
• Standardized project root

Quality

• Build verified
• Application operational

## Sprint 1.1 – Application Header

**Status:** Completed ✅

### Added

* Application Header component.
* Fixed Material UI AppBar.
* Centered RPGMS 2.0 application title.
* Logo placeholder.
* User avatar placeholder.

### Changed

* Integrated the Header component into the application shell (`App.tsx`).
* Preserved the existing welcome screen beneath the header.

### Quality

* Project builds successfully (`npm run build`).
* Header verified in the browser.
* Code reviewed and accepted.
* No architecture changes.
* No business logic introduced.
* No new dependencies added.

## Sprint 1.2 – Application Sidebar

**Status:** Completed ✅

### Added

- Permanent desktop sidebar.
- Placeholder navigation menu.
- Material UI navigation icons.

### Changed

- Integrated the sidebar into the application shell.
- Updated the application layout to accommodate the sidebar.

### Quality

- Project builds successfully (`npm run build`).
- Sidebar verified in the browser.
- Code reviewed and accepted.
- No business logic introduced.
- No routing implemented.
- ---

## Sprint 1.3 – Application Shell

**Status:** Completed ✅

### Added

- Reusable `MainLayout` component.
- Support for rendering page content through `children`.

### Changed

- Moved `Header` and `Sidebar` into `MainLayout`.
- Refactored `App.tsx` into a thin composition layer.
- Preserved the existing application appearance.

### Quality

- Project builds successfully (`npm run build`).
- Browser verified.
- Code reviewed and accepted.
- No visual regressions.
- No business logic introduced.
- No routing implemented.
- Application Shell completed.

---

## Sprint 2.1 – Dashboard Foundation

**Status:** Completed ✅

### Added

- Dashboard feature page.
- Dashboard rendered inside the existing `MainLayout`.
- Four placeholder summary cards:
  - Occupancy
  - Residents
  - Outstanding Dues
  - Monthly Collection
- Quick Actions section.

### Changed

- Replaced the temporary welcome page with the Dashboard.
- Updated Quick Actions to reflect daily operational tasks:
  - Add Resident
  - Record Payment
  - Occupancy
  - Add Complaint

### Quality

- Project builds successfully (`npm run build`).
- Browser verified.
- Code reviewed and accepted.
- Architecture preserved.
- Frozen application shell respected.
- No business logic introduced.
- No routing implemented.

===========================================================
Milestone M0 – Engineering Foundation
===========================================================

Status

Completed

Summary

Established the AI engineering foundation for RPGMS 2.0.

Completed

• DOCUMENTATION_INDEX.md
• AI_GOVERNANCE.md
• AI_CONTEXT.md
• AI_INSTRUCTIONS.md
• AI_SESSION_PROTOCOL.md
• SESSION.md redesign
• NEXT_TASK.md
• CHANGELOG.md redesign

Impact

Established a standardized AI-assisted development workflow.

All future development will follow documented governance,
business context, coding standards and session protocols.

Date

2026-07-16

===========================================================
Sprint 3.1 – Feature Module Scaffolding
===========================================================

Status

Completed

Summary

Established the feature-first project structure for all major RPGMS modules.

Added

• Feature folders:
  - Accommodation
  - Electricity
  - Finance
  - Maintenance
  - Reports
  - Residents
  - Settings
  - Shared

• Placeholder README documentation for feature organization.

• Barrel exports (`index.ts`) for feature modules.

Quality

• Feature-first architecture established.
• Repository structure standardized.
• Build verified successfully.
• No business logic introduced.

-----------------------------------------------------------

===========================================================
Sprint 3.2 – Application Navigation
===========================================================

Status

Completed

Summary

Completed the application navigation framework and routed application shell.

Added

• Placeholder pages for:
  - Residents
  - Accommodation
  - Finance
  - Electricity
  - Maintenance
  - Reports
  - Settings

• React Router configuration.

• Route registration for all feature modules.

• Sidebar navigation.

• Active navigation highlighting.

Changed

• App now uses RouterProvider.

• MainLayout now renders routed pages through Outlet.

Quality

• Navigation verified.

• All registered routes accessible.

• npm run build successful.

• No business logic introduced.

• Architecture preserved.

Date

2026-07-16

Version History

1.0

Initial changelog.

2.0

Restructured into chronological milestone and sprint history.

## Documentation

- Added AI_ONBOARDING.md as the primary onboarding guide for AI assistants.
- Added AI_HANDOFF.md for rapid project handoff between AI assistants.
- Updated README.md with AI Documentation section.
- Strengthened AI governance for multi-assistant development (ChatGPT, Gemini, Codex, Claude).


## Sprint 4 – Accommodation Foundation

### Completed
- Implemented Accommodation page shell
- Added summary cards and search toolbar
- Implemented FlatCard, AreaSection, and BedCard components
- Established Flat → Area → Bed domain hierarchy
- Added realistic mock accommodation data
- Refined UI based on review (typography, spacing, hierarchy)
- Completed build and lint verification

## [Sprint 4.3] - Complete Add Flat Workflow

### Added

- Add Flat dialog
- Dynamic Area configuration
- Smart Bed Prefix suggestions
- Validation and normalization
- Live Layout Preview
- `generateBeds()` utility
- Flat Draft object generation
- Developer draft preview
- Keyboard-first navigation improvements

### Changed

- Improved Add Area keyboard workflow.
- Removed Delete button from the normal tab order.
- Added automatic focus to newly created Areas.
- Standardized Area Name formatting to Title Case.

### Technical

- Extracted reusable bed generation logic.
- Preserved single source of truth for capacity calculation.
- Maintained clean separation between UI and business logic.

### Quality

- Build passes.
- Lint passes.
- Responsive layout maintained.

------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------