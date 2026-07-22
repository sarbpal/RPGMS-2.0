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

## [Sprint 4.4.1] - Local Application State

### Added
- Local React state for flats collection in `AccommodationPage`.
- Integrated `AddFlatDialog`'s submission with parent state, replacing the temporary developer JSON preview block.
- Dynamically calculated summary statistics and filtering (by search query and bed status) based on local state.
- Real-time page layout updates upon flat creation.
- MUI Snackbar and Alert notifications for success feedback on new flat additions.

### Changed
- Removed mock data from rendered flats list (initially loads empty and displays empty state).
- Cleaned up developer logs and preview sections from `AddFlatDialog`.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 4.4.1a] - Validation Hardening

### Added
- Added `existingFlatNumbers` prop to `AddFlatDialog` to enforce Flat Number uniqueness validation.
- Added inline validation error indicators for duplicate Flat Numbers immediately upon typing.
- Swapped priority of Area Name and Bed Prefix checks to show duplicate errors immediately without waiting for touched blur.
- Implemented immediate generated Bed ID uniqueness validation before flat creation.
- Disabled the Create Flat button if any validation errors are active.

### Changed
- Locked the first character of Bed Prefix inputs to system-suggested prefix (e.g. 'B' for Bedroom, 'H' for Hall).
- Limited Bed Prefix typing to only allow one extra user-editable second character, restricted to uppercase letters A-Z (rejecting invalid input immediately).
- Disabled the Bed Prefix input field when the Area Name is empty.
- Restored auto-suggestions for Bed Prefixes if the custom prefix is cleared back to matching the default suggestion.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 4.4.2] - Accommodation List Integration

### Added
- Integrated interactive card click events on `AccommodationSummary` to update `statusFilter` immediately when users click stats cards (e.g. clicking "Vacant Beds" filters the list of flats for vacant beds and highlights it in the toolbar, keeping filters and summary cards fully synchronized).
- Centralized derived calculations in `AccommodationPage` to feed stats downstream into components.

### Changed
- Removed mock data folder (`src/features/accommodation/mock/`) completely to clean up temporary development data.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 5.1] - Edit Flat UI

### Added
- Extended the `Flat` interface with `floor` and `description` fields, and the `Area` interface with a `bedPrefix` field.
- Added a presentational Edit button to the header of every `FlatCard`.
- Integrated `flatToEdit` prop in `AddFlatDialog` to enable dual mode support (create and edit modes) inside the same dialog.
- Configured a dynamic key `key={isAddDialogOpen ? (flatToEdit ? \`edit-\${flatToEdit.id}\` : 'new-flat') : 'closed'}` in the parent to force React to mount fresh dialogs and re-initialize state, avoiding performance issues from asynchronous state updates in `useEffect`.
- Handled preserving existing occupied bed statuses and resident names when matching bed IDs are found during layout modifications.
- Ignored the currently edited flat's number when checking for Flat Number duplicates in edit mode.

### Changed
- Refactored `toTitleCase` and `getSuggestedPrefix` outside of the `AddFlatDialog` component scope as pure global functions to prevent hoisting and access errors.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 5.2] - Delete Flat Workflow

### Added
- Added an `onDelete` callback prop to the `FlatCard` component.
- Rendered a presentational Delete button next to the Edit button in `FlatCard`'s header section.
- Designed and integrated a confirmation `Dialog` in `AccommodationPage` that warns the user before deleting a flat.
- Implemented state-driven deletion logic in `AccommodationPage` that immediately filters the deleted flat out of the state array, reactively updating the summary metrics, search results, and filters.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.1] - Residents Foundation

### Added
- Created the Residents module foundation, including types, components, and controllers.
- Defined `Resident`, `PersonalInfo`, and `EmergencyContact` models in `src/features/residents/types/index.ts`.
- Developed presentational UI components `ResidentsToolbar` and `ResidentsTable` under `src/features/residents/components/`.
- Implemented `ResidentDialog` that supports Add and Edit workflows, utilizing MUI v6 `<Grid>` sizes and dynamic pre-population.
- Configured dynamic dropdown filtering to only display flats with at least one vacant bed (including beds currently assigned to the edited resident to prevent lockouts).
- Grouped beds inside the dialog by their actual Area names dynamically loaded from Accommodation data.
- Built a validation system to enforce unique resident IDs, mobile number, full name, flat, and at least one bed selection.
- Programmed automatic de-allocation of beds when checked-out or alumni statuses are saved.
- Synchronized `residents` and `flats` local state via browser `localStorage` to preserve database consistency across sibling route navigations.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.1 - Bugfix] - Accommodation & Residents State Persistence Bug

### Fixed
- Fixed a state persistence bug where Flat and Bed information created in `AccommodationPage` was lost during routing transitions to `ResidentsPage`.
- Configured `AccommodationPage` to load its initial state from browser `localStorage` on mount (matching `ResidentsPage`).
- Configured `AccommodationPage` to write state changes to `localStorage` immediately inside actions (add, edit, delete), ensuring that initial renders never save empty arrays over existing data and Accommodation remains the single source of truth for Flat data.

### Quality
- Build passes.
- Lint passes.
- State is preserved across route changes and page refreshes.

## [Sprint 6.2] - Residents UX Refinement

### Added
- Created `ResidentProfilePage` component under `src/features/residents/` as a read-only profile dashboard dividing Personal Info, Accommodation Details, and Emergency Contacts into card sections.
- Configured a route for `residents/:id` in `src/app/router.tsx` to handle profile rendering.
- Integrated click events on `ResidentsTable` rows to trigger route transitions to the profile page using the `useNavigate` hook, while keeping the presentational Edit button from triggering page routing using `e.stopPropagation()`.
- Added a pure utility `generateResidentNumber` that reads active resident registry sequences to auto-fill the unique Resident ID on creation (in format `Rxxxxxx`), locking the input to read-only in the dialog.

### Changed
- Simplified `ResidentsTable` to display only Resident No., Name, Mobile, Flat, Beds, Status, and Actions, removing Email and Joining Date fields.
- Updated `ResidentsToolbar` search input placeholder to `"Search by Resident No., Name, Mobile or Flat..."`.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.3] - Resident Onboarding Simplification

### Changed
- Removed the `Status` dropdown from the `ResidentDialog` component (making the status selection non-editable in both Add and Edit modes).
- Configured application logic to automatically assign `ACTIVE` status to newly registered residents upon onboarding, while preserving the existing status of already registered residents during layout edits.
- Simplified `ResidentDialog` layout to include only the minimal fields required to occupy a bed (Resident No., Full Name, Mobile, Joining Date, Flat, and Bed checkboxes), removing inputs for Email, DOB, Gender, and Emergency Contacts.
- Preserved existing values for Email, DOB, Gender, and Emergency Contacts when saving details in edit mode.

### Quality
- Build passes.
- Lint passes.
- Resident Profile page continues to display the full status and supplementary fields.

## [Sprint 5] - Accommodation Pricing

### Added
- Extended `Bed` and `Area` interfaces with `defaultRent` and `defaultDeposit` properties in `src/features/accommodation/types/index.ts`.
- Enhanced `generateBeds` utility in `src/features/accommodation/utils/generateBeds.ts` to accept area default Rent and Deposit values and assign them to generated beds.
- Updated `AddFlatDialog` to collect non-negative integer values for default Rent and default Deposit per Area, maintaining validation and UI behavior.
- Added Bed Code and Default Rent side-by-side inside the Live Layout Preview of `AddFlatDialog`.
- Implemented self-healing synchronization on load in `AccommodationPage` to automatically migrate existing beds and areas to have default Rent and Deposit values initialized to `0`.
- Displayed default Rent and Deposit on each bed's card in `BedCard`.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.1] - Resident Module Foundation

### Added
- Formulated the Resident domain model containing GUID `id`, system-managed `residentCode`, `fullName`, `mobileNumber`, `documentType`, `documentNumber`, `joiningDate`, `flatId`, `allocatedBedIds`, `agreedRent`, `agreedDeposit`, `status`, `createdAt`, and `updatedAt` in `src/features/residents/types/index.ts`.
- Introduced `ResidentDraft` model representing onboarding data without system-managed fields.
- Created `ResidentStatus` (`ACTIVE`, `ON_NOTICE`, `CHECKED_OUT`, `ALUMNI`) and `DocumentType` enums.
- Created `mockResidents.ts` under `src/features/residents/data/` showing single-bed and multi-bed allocations.
- Re-architected the `residents` folder directory structure (`components`, `pages`, `types`, `hooks`, `utils`, `data`, `constants`) and updated module exports.
- Setup clean placeholders for `ResidentsPage` and `ResidentProfilePage` to satisfy router loading while keeping the focus on the model foundation.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.2] - Resident Onboarding Wizard (UI Foundation)

### Added
- Developed `ResidentOnboardingWizard` component inside `src/features/residents/components/ResidentOnboardingWizard.tsx` with a three-step horizontal Stepper layout.
- Integrated `ResidentDraft` state tracking as the single source of truth across all three steps.
- Programmed input fields for step 1 (Full Name, Mobile Number, Document Type, and Document Number) with required-field validation and error boundaries.
- Rendered form layout structures for step 2 (Joining Date, Flat Selection, Allocate Beds, Rent, and Deposit) with descriptive placeholder data.
- Built a three-column confirmation grid summarizing Resident identity, Accommodation allocation, and Commercial terms for step 3.
- Integrated the onboarding wizard directly on `ResidentsPage` to enable interactive testing and visual check-in review.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.3] - Accommodation Selection & Bed Allocation

### Added
- Implemented Flat Selection selector populating only flats containing vacant beds along with vacant bed counters in `ResidentOnboardingWizard.tsx`.
- Developed dynamic Bed Allocation grouping beds by their respective Areas inside the selected Flat.
- Programmed automatic pricing calculation that aggregates default Rent and Deposit values across all selected beds upon checkbox toggling.
- Setup manual override locks for Rent and Deposit inputs, preventing auto-calculations from overwriting manual operator inputs.
- Implemented reset pricing function reverting overridden pricing back to defaults when changing flats or clicking "Reset to default pricing".
- Completed Step 3 Confirmation panel to summarize final allocated flat name, parsed short bed codes, rent, and deposit commercial terms.
- Enforced navigation validation checking for valid joining date, selected flat, and at least one allocated bed before advancing to confirmation.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.3.1] - UX Polish

### Added
- Created a reusable `toTitleCase` text formatting utility inside `src/features/residents/utils/formatters.ts`.
- Integrated `toTitleCase` in the onboarding wizard's name input on blur and confirmation card render.
- Refactored Rent and Deposit override fields to accept `number | ''` inputs in the local `WizardDraft` state, resolving leading-zero entry issues and allowing operators to backspace-clear numeric fields natively.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.4] - Resident Creation & Persistence

### Added
- Programmed transactional database updates, mapping both `Resident` creation and `Bed` occupancy updates in a single synchronized sequence in `localStorage`.
- Created an automatic, sequential `residentCode` sequence generator producing sequential strings in `Rxxxxxx` format.
- Associated the title-case resident name and `OCCUPIED` status with the allocated beds.
- Persisted agreed commercial terms (`agreedRent` and `agreedDeposit`) onto the resident profile without altering default bed configurations.
- Integrated automated post-creation workflows: success alerts, state refresh, input field wipes, and wizard resetting.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 6.5] - Resident Navigation & Routing

### Added
- Replaced the embedded onboarding layout on the default `/residents` route with a standalone, searchable registry data table showing active and historic resident records.
- Configured dynamic row navigation links mapping clicked data rows directly to resident-specific profile page routes (`/residents/:residentId`).
- Created a dedicated `/residents/new` onboarding workflow path hosting the multi-step registration wizard, linking it via the "Add Resident" action.
- Built a read-only details layout for the `ResidentProfilePage` organizing identity markers, bed allocations, commercial agreements, and system timestamps.
- Added a fallback error card on the profile page to handle invalid parameters gracefully.
- Configured React Router routes order, registering the literal `/residents/new` before the parameter pattern `/residents/:id`.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.

## [Sprint 7] - Resident Profile & Management

### Added
- Redesigned `ResidentProfilePage` workspace header, displaying name, resident code, active status chip, allocated flat and beds, and joining date (formatted in standard `day Month year` layout).
- Implemented read-only and edit-mode state toggles supporting Edit, Save, and Cancel actions.
- Added input fields mapping for editable details: Full Name, Mobile, Document Type/Number, Agreed Rent, and Agreed Deposit.
- Integrated validation rules (empty check, numeric validation, title case name formatting on save, and number | '' clear capability on inputs) for profile edits.
- Added 4 responsive operational metric summary cards (Total, Active, On Notice, Checked Out) at the top of the `/residents` page.
- Expanded registry table search criteria to cover matching against allocated bed codes.
- Designed tailored, user-friendly empty state templates for missing profiles and search filters with zero matches.

### Quality
- Build passes.
- Lint passes.
- Responsive layout maintained.
Architectural Design Session

- Defined Resident vs Admission architecture.
- Defined Resident Contract model.
- Locked lock-in and notice business rules.
- Defined notice cancellation behaviour.
- Defined readmission workflow using new Admissions.
- Finalized roadmap adjustments for Lifecycle and Billing.

## Documentation

### Finance Domain

- Completed comprehensive review of `FINANCE_SPECIFICATION.md`
- Refined architectural principles and domain boundaries
- Clarified responsibilities for Billing, Settlement, Ledger, Timeline, Lifecycle, Reporting, and Extension Guidelines
- Standardized terminology around Stay ownership and derived financial views
- Reinforced Ledger as the single financial source of truth
- Document marked as Version 2.0 and considered architecturally complete
  
  ## Internal Refactoring

### Residents Module

- Introduced Resident Service layer
- Added useResidents hook
- Added useResident hook
- Removed direct localStorage access from UI components
- Preserved existing onboarding workflow and data model
- No functional or UI changes

## Residents Module

### Sprint 7.2 – Resident Profile Completion

- Expanded Resident profile to align with the core Resident Profile Specification.
- Added support for Identity, Family, Emergency Contact, Address, Occupation, and Medical information.
- Reorganized the Resident Profile into logical section cards.
- Implemented independent section-level editing with save/cancel workflows.
- Preserved the existing onboarding flow and operational resident data.
- Maintained backward compatibility with the current Resident data model.
- Continued using the Service and Hooks architecture introduced in Sprint 7.1.

## Residents Module

### Sprint 7.3.1 – Stay Domain Foundation

- Introduced the Stay domain foundation within the Residents feature.
- Added Stay, StayStatus, and StayEvent domain types.
- Created the initial Stay service interface with stub methods.
- Established the architectural foundation for Resident and Stay separation.
- No application behavior or UI changes introduced.

## Residents Module

### Sprint 7.3.2 – Storage Versioning & Migration Foundation

- Added storage versioning to support future data migrations.
- Introduced dedicated Stay persistence using a separate storage key.
- Implemented idempotent migration of operational Resident data into Stay records.
- Preserved legacy Resident storage for backward compatibility.
- No application behavior or UI changes introduced.
  
  ## Residents Module

### Sprint 7.3.3 – Composite View Model & Service Integration

- Introduced the ResidentWithActiveStay runtime composite model.
- Updated resident services to dynamically combine Resident identity with active Stay information.
- Updated resident hooks to expose composite models.
- Implemented atomic onboarding that creates Resident and Stay records together.
- Preserved backward compatibility through dual-write support.
- No UI or workflow changes introduced.

## Residents Module

### Sprint 7.3.4 – Architectural Stabilization & Verification

- Performed complete audit of Residents and Stay modules for architectural consistency.
- Confirmed zero circular dependencies between `residentService` and `stayService`.
- Verified UI components consume composite view models cleanly.
- Verified atomic onboarding transaction (`Resident` -> `Stay` -> `Bed Occupancy`).
- Successfully verified project build with zero TypeScript errors.

## Finance Sprint F1 – Domain Foundation

- Created Finance module foundation.
- Added strongly typed finance domain models.
- Added finance storage abstraction.
- Added service skeletons:
  - Ledger Service
  - Balance Engine
  - Billing Service
  - Payment Service
  - Settlement Service
- Added finance hooks.
- Added Finance page shell.
- Added finance utilities.
- Established public Finance APIs.
- No business logic implemented.

## Finance Sprint F2 – Immutable Ledger Core

- Implemented immutable append-only ledger architecture.
- Added balanced double-entry validation.
- Introduced batch posting via `postEntries()`.
- Added ledger query APIs.
- Added reversal entry support.
- Established append-only persistence for ledger entries.
- No balance calculations or business workflows implemented.

## Finance Sprint F3 – Balance Engine

### Added
- Implemented dynamic Balance Engine.
- Added stay-level balance derivation from immutable ledger entries.
- Added property-wide finance summary calculations.
- Implemented account helper methods for balance and ledger totals.
- Added support for Refund Payable calculations.
- All balances are derived dynamically with no persisted balance values.

### Notes
- Balance Engine is strictly read-only.
- No ledger mutations or business workflows introduced.
- No billing, payment, or settlement logic implemented.

## Finance Sprint F4 – Billing Engine

### Added
- Implemented Billing Engine.
- Added monthly rent bill generation.
- Added recurring charge bill generation.
- Added one-time charge bill generation.
- Added automated double-entry ledger posting for all bills.
- Added bill persistence.
- Added bill number generation.
- Added duplicate monthly rent prevention.

### Notes
- Billing Engine creates business documents and corresponding ledger postings.
- No payment processing or settlement logic introduced.
- Balance calculations remain delegated to the Balance Engine.

## Finance Sprint F5 – Payment Processing Engine

### Added
- Implemented Payment Processing Engine.
- Added payment recording for supported payment methods.
- Added automatic double-entry ledger postings for payments.
- Added overpayment handling using Advance Credit.
- Added automatic payment allocation across outstanding bills.
- Added payment persistence.
- Added payment number generation.

### Notes
- Payment processing updates financial position exclusively through the immutable ledger.
- Bill allocation follows oldest outstanding bills first.
- No settlement or checkout workflow implemented.

## Finance Sprint F6 – Deposit & Checkout Settlement Engine

### Added
- Implemented two-stage Settlement Engine.
- Added read-only Settlement Preview generation.
- Added Settlement Confirmation workflow.
- Added security deposit refund processing.
- Added advance credit adjustment during settlement.
- Added damage recovery support.
- Added settlement persistence with preview snapshot auditing.
- Added automatic stay financial closure during settlement.

### Notes
- Settlement Preview is completely read-only.
- Settlement Confirmation creates immutable double-entry ledger postings.
- All settlement balances are derived through the Balance Engine.
- Settlement records retain the complete preview snapshot for auditing.

## Finance Sprint F7 – Financial Timeline & Hooks Layer

### Added
- Implemented Timeline Service to aggregate financial events across Bills, Payments, Ledger, and Settlements.
- Added unified `FinanceTimelineEvent` model.
- Added timeline summary generation using the Balance Engine.
- Added reusable React hooks for finance timeline and recent activity.
- Integrated timeline and activity stream into the Finance page.
- Added recent finance activity support for dashboard widgets.

### Notes
- Timeline Service is strictly read-only.
- No business logic or financial calculations were duplicated.
- All balances continue to be derived exclusively through the Balance Engine.
- Existing Finance domain services remained unchanged.

## Finance Sprint F8 – Reports & Analytics

### Added
- Implemented Reporting Service for Finance dashboard and operational reports.
- Added Finance dashboard summary aggregation.
- Added resident financial summary reporting.
- Added monthly collections reporting.
- Added outstanding residents report.
- Added settlement audit report.
- Updated Finance page with dashboard cards, recent activity, outstanding dues, and settlement audit views.

### Notes
- Reporting layer is strictly read-only.
- All balances and financial values are derived from existing Finance services.
- No accounting logic or ledger operations were introduced.

## Post Review Refinements
Sprint 9.1 completed
Stay Workspace Foundation created
Route /stay/:stayId added
ADR-014 adopted (Application Layer Pattern)
Architecture documentation updated

## Sprint 9.2 – Application Layer Foundation
Sprint 9.2 completed
Application Layer implemented
StayWorkspaceCoordinator created
StayWorkspaceViewModel created
Presentation components refactored to consume ViewModels
ADR-014 implemented

## Sprint 9.3 – Stay Domain Foundation

### Added

- Introduced the Stay Domain layer as the technology-independent business core of the Stay module.
- Added `Stay` domain entity representing a resident's operational stay.
- Added `StayStatus` value object to provide strongly typed operational stay states.
- Added `StayType` value object for business classification of stays.
- Added `StayRepository` interface defining the persistence contract without implementation.
- Added domain barrel exports for consistent module organization.

### Changed

- Refactored `StayWorkspaceCoordinator` to consume domain entities and value objects instead of scattered string literals.
- Strengthened separation between the Application and Domain layers in accordance with ADR-014.

### Architecture

- Completed the initial Domain Layer for the Stay module.
- Reinforced the layered architecture:

  ```text
  Presentation
        │
        ▼
  Application
        │
        ▼
  Domain
        │
        ▼
  Infrastructure (future)
  ```

- Confirmed that the Domain layer remains independent of React, Material UI, Supabase, SQL, and other infrastructure concerns.

### Notes

- No repository implementation was introduced in this sprint.
- No persistence or business services were implemented.
- The sprint focused exclusively on establishing the business vocabulary and domain model for future development.

## Sprint 9.4 – Stay Infrastructure Foundation
nfrastructure layer introduced
In-memory repository implemented
Repository contract validated
Coordinator refactored for dependency injection

This is another meaningful architectural milestone.
------------------------------------------------------------------------------
End of Document
------------------------------------------------------------------------------