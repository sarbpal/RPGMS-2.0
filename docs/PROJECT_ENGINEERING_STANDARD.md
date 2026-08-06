# RPGMS 2.0

# Project Engineering Standards

------------------------------------------------------------------------------
Document Information
------------------------------------------------------------------------------

Document ID     : DOC-004
Version         : 1.0
Status          : Approved
Owner           : Project Architecture
Created         : 2026-08-05
Last Updated    : 2026-08-05
Applies To      : All RPGMS 2.0 source code and user interface development

------------------------------------------------------------------------------
Purpose
------------------------------------------------------------------------------

This document defines the engineering standards used throughout RPGMS 2.0.

Its purpose is to ensure that all business modules, user interfaces, workflows, and technical implementations follow a consistent engineering approach.

These standards are derived from proven implementation patterns established during MVP development and serve as the authoritative reference for future development.

------------------------------------------------------------------------------
Table of Contents
------------------------------------------------------------------------------

1. Engineering Philosophy

2. Workspace Engineering Standards

3. Workspace Types

4. Navigation Engineering Standards

5. Workspace Action Standards

6. Dashboard Engineering Standards

7. Business Section Engineering Standards

8. Business Projection Standards

9. Search & Filter Engineering Standards

10. Application Layer Engineering Standards

11. Repository Engineering Standards

12. Data Entry Engineering Standards

13. Testing Engineering Standards

14. Documentation Engineering Standards

15. Engineering Evolution & Governance
    
------------------------------------------------------------------------------
Relationship to PROJECT_RULES.md
------------------------------------------------------------------------------

PROJECT_RULES.md defines the constitutional rules governing the project.

PROJECT_ENGINEERING_STANDARD.md defines the recommended engineering patterns used to implement those rules.

Where PROJECT_RULES.md specifies what must or must not be done, this document explains how approved implementations should be designed and constructed.

Both documents are complementary and should be read together.

------------------------------------------------------------------------------
Related Documents
------------------------------------------------------------------------------

This document should be read together with:

• PROJECT_RULES.md
• ARCHITECTURE.md
• DOCUMENTATION_INDEX.md
• MODULE_STATUS.md

Where conflicts exist, constitutional documents take precedence over
engineering standards.

------------------------------------------------------------------------------
Applicability
------------------------------------------------------------------------------

These engineering standards apply to:

• New business modules
• Existing module enhancements
• User interface development
• Application layer implementation
• Repository implementation
• Documentation updates

Existing modules should gradually adopt these standards as they evolve.

------------------------------------------------------------------------------
1. Engineering Philosophy
------------------------------------------------------------------------------

RPGMS 2.0 is engineered around business workflows rather than individual software features.

Engineering decisions should always favour:

- Business clarity over technical cleverness.
- Consistency over novelty.
- Maintainability over short-term convenience.
- Reusable patterns over one-off implementations.
- Explicit design over hidden behaviour.

Every implementation should contribute to a coherent product rather than solving an isolated problem.

Engineering standards documented here are based on proven implementation patterns established during MVP development and should be applied consistently across all business modules.

------------------------------------------------------------------------------
Core Engineering Principles
------------------------------------------------------------------------------

### 1. Business First

Business workflows drive technical implementation.

User interfaces, services, repositories, and domain models exist to support operational business processes.

---

### 2. Consistency Over Creativity

When an established engineering pattern exists, it should be reused rather than redesigned.

Consistency improves maintainability, usability, and long-term product quality.

---

### 3. Reusable Building Blocks

Engineering effort should produce reusable patterns that benefit future modules.

Examples include:

- Workspace layouts
- Navigation patterns
- Dashboard cards
- Section cards
- Coordinators
- ViewModels

---

### 4. Separation of Responsibilities

Each architectural layer has a clearly defined responsibility.

Business logic belongs in the Domain.

Application orchestration belongs in Coordinators.

Presentation components remain focused on rendering and user interaction.

Infrastructure concerns remain isolated behind repository abstractions.

---

### 5. Incremental Evolution

Engineering standards evolve through successful implementation.

New patterns should only become standards after they have been validated in production-quality business modules.

------------------------------------------------------------------------------
2. Workspace Engineering Standards
------------------------------------------------------------------------------

Purpose

Define the standard structure for every operational workspace in RPGMS 2.0.

A consistent workspace design enables operators to move between business modules without relearning the user interface, improves implementation consistency, and reduces future engineering effort.

These standards apply to all operational workspaces unless explicitly documented otherwise.

------------------------------------------------------------------------------
Workspace Philosophy
------------------------------------------------------------------------------

A workspace represents a complete business activity rather than a single database entity.

Every workspace should provide the information, actions, and operational context required to complete a business workflow efficiently.

Workspaces should be designed around how hostel staff perform their daily operations rather than around technical implementation details.

------------------------------------------------------------------------------
Standard Workspace Layout
------------------------------------------------------------------------------

Every operational workspace should follow the same high-level structure.

Workspace Navigation
        ↓
Workspace Header
        ↓
Quick Actions
        ↓
Operational Summary
        ↓
Operational Dashboard (Optional)
        ↓
Business Sections

The order should remain consistent across all business modules.

------------------------------------------------------------------------------
Workspace Navigation
------------------------------------------------------------------------------

Every workspace should provide lightweight navigation to its parent workspace.

Navigation should:

• Clearly indicate the parent context.
• Require only a single click.
• Appear consistently at the top of the workspace.
• Never compete visually with primary business actions.

Examples:

Residents List
        ↓
Resident Workspace
        ↓
Stay Workspace

------------------------------------------------------------------------------
Workspace Header
------------------------------------------------------------------------------

The Workspace Header establishes the identity of the current business object.

Typical information includes:

• Primary title
• Business identifier
• Operational status
• Primary avatar or icon (where applicable)

The header should avoid displaying excessive operational information that belongs within dedicated business sections.

------------------------------------------------------------------------------
Quick Actions
------------------------------------------------------------------------------

Quick Actions provide immediate access to the most common operations performed within the workspace.

Guidelines:

• Display only high-value actions.
• Avoid duplicate actions.
• Use clear business terminology.
• Keep actions consistent across similar workspaces.

Quick Actions should support business workflows rather than expose every available operation.

------------------------------------------------------------------------------
Operational Summary
------------------------------------------------------------------------------

The Operational Summary presents the most important operational information required immediately after entering a workspace.

Examples:

Resident Workspace

• Current Stay
• Flat
• Bed
• Door ID
• Monthly Rent

Future workspaces should provide an equivalent business summary appropriate to their domain.

------------------------------------------------------------------------------
Operational Dashboard
------------------------------------------------------------------------------

Where operational indicators are required, they should be grouped into a compact dashboard immediately below the Operational Summary.

Dashboard cards present indicators rather than detailed business information.

Examples:

• Profile Completion
• Operational Readiness

Dashboards should remain concise and focused on operational awareness.

------------------------------------------------------------------------------
Business Sections
------------------------------------------------------------------------------

Detailed business information should be organised into independent section cards.

Each section should have a single responsibility.

Typical examples include:

• Personal Information
• Contact Information
• Address
• Emergency Contacts
• Documents
• Vehicles
• Devices

Business sections should remain independent so that future enhancements can be introduced without affecting unrelated sections.

------------------------------------------------------------------------------
Benefits
------------------------------------------------------------------------------

Following a common workspace structure provides:

• Consistent operator experience.
• Faster onboarding for new users.
• Reusable implementation patterns.
• Reduced engineering effort.
• Improved long-term maintainability.

------------------------------------------------------------------------------
3. Workspace Types
------------------------------------------------------------------------------

Purpose

RPGMS workspaces are divided into two primary categories:

• List Workspaces
• Detail Workspaces

Each category serves a different operational purpose and follows its own engineering standards.

------------------------------------------------------------------------------
List Workspaces
------------------------------------------------------------------------------

Purpose

List Workspaces provide operators with an overview of multiple business objects and enable efficient search, filtering, and navigation.

Examples

• Residents List
• Reservations List
• Finance Dashboard
• Maintenance Dashboard

------------------------------------------------------------------------------
Standard Layout
------------------------------------------------------------------------------

Every List Workspace should follow this structure.

Workspace Header
        ↓
Summary Cards (Optional)
        ↓
Search & Filters
        ↓
Business Object List
        ↓
Pagination / Infinite Scroll (where applicable)

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

List Workspaces should:

• Prioritise operational speed.
• Support keyboard-driven workflows.
• Minimise navigation effort.
• Display only operationally relevant information.
• Avoid excessive detail.

The primary purpose is discovery and navigation rather than editing.

------------------------------------------------------------------------------
Detail Workspaces
------------------------------------------------------------------------------

Purpose

Detail Workspaces provide a complete operational view of a single business object.

They should contain everything required to understand, manage, and operate on that object.

Examples

• Resident Workspace
• Stay Workspace
• Admission Workspace
• Reservation Workspace

------------------------------------------------------------------------------
Standard Layout
------------------------------------------------------------------------------

Workspace Navigation
        ↓
Workspace Header
        ↓
Quick Actions
        ↓
Operational Summary
        ↓
Operational Dashboard (Optional)
        ↓
Business Sections

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Detail Workspaces should:

• Present information in logical business groups.
• Avoid unnecessary scrolling.
• Keep related information together.
• Provide immediate access to common actions.
• Maintain consistent section ordering.

------------------------------------------------------------------------------
Navigation Between Workspace Types
------------------------------------------------------------------------------

List Workspaces act as entry points.

Detail Workspaces provide operational management.

Typical navigation:

Residents List
        ↓
Resident Workspace
        ↓
Stay Workspace

Navigation should always preserve business context and provide a clear path back to the parent workspace.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Operators should always know:

• Where they are.
• What business object they are managing.
• What actions are immediately available.
• How to return to the previous operational context.

------------------------------------------------------------------------------
4. Navigation Engineering Standards
------------------------------------------------------------------------------

Purpose

Navigation within RPGMS 2.0 should reflect business workflows rather than technical application structure.

Operators should always understand:

• Where they are.
• What business object they are working with.
• How they arrived there.
• How to return to the previous operational context.

Navigation should minimise cognitive effort and support efficient day-to-day hostel operations.

------------------------------------------------------------------------------
Navigation Philosophy
------------------------------------------------------------------------------

Navigation follows business relationships.

Users should move naturally through related business objects instead of unrelated application screens.

Example:

Reservation
        ↓
Admission
        ↓
Resident
        ↓
Stay
        ↓
Finance

Each transition represents a business workflow rather than merely opening another screen.

------------------------------------------------------------------------------
Parent–Child Navigation
------------------------------------------------------------------------------

Operational workspaces should maintain a clear parent–child hierarchy.

Every child workspace should provide a lightweight, single-click return to its immediate parent.

Examples

Residents List
        ↓
Resident Workspace
        ↓
Stay Workspace

Reservation List
        ↓
Reservation Workspace

Future modules should follow the same navigation philosophy.

------------------------------------------------------------------------------
Workspace Navigation Pattern
------------------------------------------------------------------------------

Every Detail Workspace should begin with a lightweight navigation link.

Examples

← Back to Residents

← Back to Reservation

← Back to Finance

Navigation links should:

• Be visually unobtrusive.
• Appear above the Workspace Header.
• Never compete with primary business actions.
• Always return to the immediate parent workspace.

------------------------------------------------------------------------------
Forward Navigation
------------------------------------------------------------------------------

Forward navigation should always represent progression within a business workflow.

Examples

Reservation
        ↓
Create Admission

Resident
        ↓
Open Stay Workspace

Finance
        ↓
View Resident Ledger

Forward navigation should always preserve operational context.

------------------------------------------------------------------------------
Context Preservation
------------------------------------------------------------------------------

Business context should remain visible throughout navigation.

Whenever possible, users should not lose awareness of:

• Current Resident
• Current Stay
• Current Reservation
• Current Finance Record

Navigation should minimise unnecessary context switching.

------------------------------------------------------------------------------
Navigation Consistency
------------------------------------------------------------------------------

Navigation patterns should remain identical across all business modules.

Users should never have to learn a different navigation model for each workspace.

Consistency improves:

• Learnability
• Operational speed
• User confidence
• Long-term maintainability

------------------------------------------------------------------------------
Navigation Principles
------------------------------------------------------------------------------

Every navigation decision should satisfy the following principles:

1. Business first.

2. Parent before child.

3. Preserve context.

4. One-click return.

5. Predictable navigation.

6. No dead ends.

7. Minimise operator effort.

------------------------------------------------------------------------------
5. Workspace Action Standards
------------------------------------------------------------------------------

Purpose

Workspace actions provide operators with access to business operations.

Actions should be organised according to their purpose and importance, ensuring that common workflows remain fast while less frequent operations remain discoverable without creating unnecessary visual clutter.

------------------------------------------------------------------------------
Action Philosophy
------------------------------------------------------------------------------

Actions should support business workflows rather than expose every available system capability.

The user interface should guide operators toward the most common and operationally important tasks.

------------------------------------------------------------------------------
Action Categories
------------------------------------------------------------------------------

Workspace actions are organised into four categories:

1. Quick Actions

High-value actions performed frequently within a workspace.

Examples:

• Edit Resident Profile
• Open Stay Workspace
• Create Admission
• Register Payment

Quick Actions should appear immediately below the Workspace Header.

---

2. Section Actions

Actions related to a specific business section.

Examples:

• Register Vehicle
• Register Device
• Add Emergency Contact
• Upload Document

Section Actions should appear in the header of the section to which they belong.

---

3. Context Actions

Actions that apply to a specific business object within a list or collection.

Examples:

• View Details
• Edit
• Remove
• Mark as Completed

Context Actions should remain visually associated with the object they operate on.

---

4. Destructive Actions

Operations that permanently modify or remove business data.

Examples:

• Delete Reservation
• Remove Vehicle
• Cancel Admission

Destructive actions should:

• Require explicit confirmation.
• Be visually distinct.
• Never appear as the primary action.
• Respect all business rules and validation.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Workspace actions should:

• Use business terminology.
• Be easy to discover.
• Avoid duplicate entry points.
• Maintain consistent placement across workspaces.
• Clearly distinguish primary and secondary actions.

------------------------------------------------------------------------------
Single Entry Point Principle
------------------------------------------------------------------------------

Each major business workflow should have one clearly defined primary entry point.

Example:

Resident Profile editing is initiated through the Workspace Quick Action.

Section cards present information but should not duplicate entry points for the same workflow.

This reduces operator confusion and simplifies future maintenance.

------------------------------------------------------------------------------
Primary Action Hierarchy
------------------------------------------------------------------------------

When multiple actions are available, they should follow this priority:

1. Primary Business Action
2. Secondary Business Actions
3. Section Actions
4. Context Actions
5. Destructive Actions

Primary actions should always remain visually prominent.

------------------------------------------------------------------------------
Future Evolution
------------------------------------------------------------------------------

Additional action categories may be introduced in future capability releases.

However, new categories should only be added when they represent a genuinely different interaction pattern rather than a variation of an existing category.

------------------------------------------------------------------------------
6. Dashboard Engineering Standards
------------------------------------------------------------------------------

Purpose

Operational dashboards provide operators with immediate awareness of the current business state.

Dashboards should surface indicators that help operators make decisions quickly without requiring them to inspect detailed business information.

Dashboards communicate operational health rather than store operational data.

------------------------------------------------------------------------------
Dashboard Philosophy
------------------------------------------------------------------------------

Dashboards answer the question:

"What requires my attention right now?"

They should present concise, high-value information that enables operators to identify issues, assess readiness, and determine the next action.

Dashboards should never become repositories for detailed business records.

------------------------------------------------------------------------------
Dashboard Placement
------------------------------------------------------------------------------

When required, the Operational Dashboard should appear immediately below the Operational Summary.

Standard Detail Workspace Layout

Workspace Navigation
        ↓
Workspace Header
        ↓
Quick Actions
        ↓
Operational Summary
        ↓
Operational Dashboard
        ↓
Business Sections

The dashboard should provide an overview before users begin reviewing detailed information.

------------------------------------------------------------------------------
Dashboard Components
------------------------------------------------------------------------------

Dashboard cards should present operational indicators rather than detailed business data.

Typical dashboard indicators include:

• Operational Readiness
• Profile Completion
• Outstanding Tasks
• Pending Approvals
• Payment Status
• Compliance Status

Each card should communicate a single operational concern.

------------------------------------------------------------------------------
Dashboard Card Design
------------------------------------------------------------------------------

Dashboard cards should:

• Present one clear metric or status.
• Be visually compact.
• Use concise supporting text.
• Avoid large tables or detailed lists.
• Highlight conditions requiring operator attention.

Multiple indicators should be presented as separate cards rather than combined into a single complex card.

------------------------------------------------------------------------------
Status Indicators
------------------------------------------------------------------------------

Operational status should be communicated using consistent visual language.

Recommended states include:

🟢 Normal

Business operation is complete or healthy.

🟡 Attention Required

Operator review or action is recommended.

🔴 Action Required

Immediate operator intervention is required.

Dashboard colours should reinforce business meaning rather than serve decorative purposes.

------------------------------------------------------------------------------
Dashboard Content
------------------------------------------------------------------------------

Dashboards should display summaries.

Business records belong in dedicated section cards.

Example

Correct

Profile Completion
Operational Readiness

Incorrect

Complete Personal Information
Emergency Contacts
Vehicle Details
Documents

These belong in Business Sections.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Dashboards should:

• Remain concise.
• Surface operational information only.
• Avoid duplication with Business Sections.
• Support rapid decision making.
• Scale gracefully as additional indicators are introduced.

------------------------------------------------------------------------------
Examples
------------------------------------------------------------------------------

Resident Workspace

Operational Dashboard

• Profile Completion
• Operational Readiness

Future Examples

Reservation Workspace

• Reservation Readiness
• Expected Admissions

Admission Workspace

• Admission Checklist
• Document Verification

Finance Workspace

• Outstanding Dues
• Payment Status

Maintenance Workspace

• Open Complaints
• Overdue Work Orders

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Dashboards inform.

Business Sections explain.

This distinction should remain consistent throughout RPGMS.

------------------------------------------------------------------------------
7. Business Section Engineering Standards
------------------------------------------------------------------------------

Purpose

Business Sections organise detailed operational information into logical,
independent, and reusable units.

Each section should represent a single business responsibility, allowing
operators to quickly locate information while enabling future enhancements
without affecting unrelated functionality.

------------------------------------------------------------------------------
Business Section Philosophy
------------------------------------------------------------------------------

Business Sections answer the question:

"Tell me everything I need to know about this aspect of the business object."

Unlike dashboards, which provide operational awareness, Business Sections
provide detailed operational information and management capabilities.

------------------------------------------------------------------------------
Single Responsibility
------------------------------------------------------------------------------

Every Business Section should have one clearly defined responsibility.

Examples

Resident Workspace

• Personal Information
• Contact Information
• Address
• Emergency Contacts
• Documents
• Vehicles
• Devices

Each section owns one business concern only.

------------------------------------------------------------------------------
Standard Section Structure
------------------------------------------------------------------------------

Every Business Section should follow the same structure.

Section Title
        ↓
Optional Section Action
        ↓
Section Content

This layout should remain consistent across all RPGMS workspaces.

------------------------------------------------------------------------------
Section Header
------------------------------------------------------------------------------

The section header establishes the identity of the Business Section.

It should contain:

• Section title
• Optional section action
• Consistent typography
• Consistent spacing

Headers should remain visually lightweight while clearly separating one
business concern from another.

------------------------------------------------------------------------------
Section Actions
------------------------------------------------------------------------------

Section actions apply only to the content of that section.

Examples

Vehicles

• Register Vehicle

Devices

• Register Device

Documents

• Upload Document

Emergency Contacts

• Add Contact

Section actions should never duplicate Workspace Quick Actions.

------------------------------------------------------------------------------
Section Content
------------------------------------------------------------------------------

Section content should:

• Present related business information together.
• Avoid unrelated data.
• Use consistent spacing.
• Use consistent typography.
• Support future expansion.

Where appropriate, content should be presented using reusable cards, lists,
or key-value layouts.

------------------------------------------------------------------------------
Section Independence
------------------------------------------------------------------------------

Business Sections should remain independent.

Adding, removing, or enhancing one section should not require changes to
other sections within the workspace.

This modularity simplifies maintenance and future capability development.

------------------------------------------------------------------------------
Section Ordering
------------------------------------------------------------------------------

Business Sections should follow the natural business workflow.

Example

Resident Workspace

Personal Information
        ↓
Contact Information
        ↓
Address
        ↓
Emergency Contacts
        ↓
Documents
        ↓
Vehicles
        ↓
Devices

The ordering should help operators naturally progress through the information.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Business Sections should:

• Have one responsibility.
• Use consistent visual hierarchy.
• Support independent evolution.
• Avoid duplicate information.
• Avoid duplicate actions.
• Preserve business workflow order.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Dashboards answer:

"What needs attention?"

Business Sections answer:

"What do I need to manage?"

Maintaining this distinction is essential for a consistent RPGMS user experience.

------------------------------------------------------------------------------
8. Business Projection Standards
------------------------------------------------------------------------------

Purpose

Business Projections allow a workspace to present operational information that
is owned by another business domain without transferring ownership or
duplicating business logic.

They provide operators with the information required to perform their work
while preserving clear domain boundaries.

------------------------------------------------------------------------------
Business Projection Philosophy
------------------------------------------------------------------------------

A workspace should present the information an operator needs, regardless of
which business domain owns that information.

However, displaying information does not imply ownership.

Ownership always remains with the originating business domain.

------------------------------------------------------------------------------
Domain Ownership
------------------------------------------------------------------------------

Every business object has a single owning domain.

Examples

Resident

Owns:

• Identity
• Contact Information
• Documents
• Vehicles
• Devices

Stay

Owns:

• Area
• Flat
• Bed
• Door ID
• Monthly Rent
• Security Deposit
• Stay Status

Finance

Owns:

• Ledger
• Payments
• Billing
• Outstanding Dues

Ownership must never be transferred through presentation.

------------------------------------------------------------------------------
Business Projection
------------------------------------------------------------------------------

A workspace may project information from another domain for operational
convenience.

Example

Resident Workspace

Projects

• Current Stay
• Flat
• Bed
• Door ID
• Monthly Rent

These values remain owned by the Stay domain.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Business Projections should:

• Be read-only.
• Clearly represent current operational state.
• Never duplicate business rules.
• Never become the system of record.
• Be derived through the Application Layer.

------------------------------------------------------------------------------
Projection Placement
------------------------------------------------------------------------------

Projected information should appear within an Operational Summary rather than
inside unrelated Business Sections.

Examples

Resident Workspace

Current Stay Summary

Admission Workspace

Reservation Summary

Finance Workspace

Resident Summary

------------------------------------------------------------------------------
Updating Projected Information
------------------------------------------------------------------------------

Operators should edit projected information only by navigating to the owning
workspace.

Example

Resident Workspace

Current Stay Summary

↓

Open Stay Workspace

↓

Edit Stay

This preserves domain ownership while supporting efficient workflows.

------------------------------------------------------------------------------
Benefits
------------------------------------------------------------------------------

Business Projections provide:

• Better operational awareness.
• Reduced navigation.
• Clear ownership boundaries.
• Reusable engineering patterns.
• Strong architectural consistency.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Project information.

Do not transfer ownership.

Display information.

Do not duplicate business rules.

------------------------------------------------------------------------------
9. Search & Filter Engineering Standards
------------------------------------------------------------------------------

Purpose

Search and filtering are primary operator tools for locating business objects
quickly and efficiently.

Every List Workspace should provide consistent search and filtering behaviour
to minimise operator effort and improve day-to-day productivity.

------------------------------------------------------------------------------
Search Philosophy
------------------------------------------------------------------------------

Search should prioritise operational efficiency over technical implementation.

Operators should be able to locate business objects using the information they
naturally remember rather than requiring exact identifiers.

Search should feel universal, predictable, and responsive across all RPGMS
modules.

------------------------------------------------------------------------------
Universal Search
------------------------------------------------------------------------------

Where appropriate, List Workspaces should provide a single universal search box.

A universal search may evaluate multiple business attributes simultaneously.

Example

Resident Search

• Resident Name
• Resident Code
• Mobile Number
• Government ID
• Door ID
• Vehicle Registration
• Device MAC Address
• Flat
• Bed

The supported search fields depend on the business domain.

------------------------------------------------------------------------------
Search Placement
------------------------------------------------------------------------------

Search should appear prominently within the List Workspace.

Standard layout:

Workspace Header
        ↓
Summary Cards (Optional)
        ↓
Search
        ↓
Filters
        ↓
Business Object List

Search should remain immediately accessible without excessive pointer movement
or scrolling.

------------------------------------------------------------------------------
Filter Philosophy
------------------------------------------------------------------------------

Filters reduce the visible dataset based on operational criteria.

Unlike search, filters should use predefined business values.

Examples

Resident Status

• Active
• On Notice
• Alumni

Reservation Status

• Enquiry
• Reserved
• Confirmed
• Cancelled

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Search should:

• Be responsive.
• Support partial matches where appropriate.
• Ignore letter case where appropriate.
• Produce predictable results.
• Return an empty result set rather than incorrect matches.

Filters should:

• Use business terminology.
• Remain visually consistent.
• Be easy to reset.
• Preserve user context during navigation.

------------------------------------------------------------------------------
Search and Filter Relationship
------------------------------------------------------------------------------

Search and filters should operate together.

The visible result set should satisfy both:

Search Criteria

AND

Selected Filters

Operators should not need to choose between searching and filtering.

------------------------------------------------------------------------------
Result Presentation
------------------------------------------------------------------------------

Search results should update the business object list without disrupting the
workspace layout.

Where possible:

• Preserve scroll position.
• Preserve selected filters.
• Clearly indicate when no results are found.

------------------------------------------------------------------------------
Future Evolution
------------------------------------------------------------------------------

Future capability releases may introduce:

• Advanced Search
• Saved Searches
• Search Suggestions
• Recently Used Searches

These enhancements should extend the existing search model rather than replace
it.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Search should help operators remember.

Filters should help operators narrow.

Together they should minimise the effort required to locate business
information.

------------------------------------------------------------------------------
10. Application Layer Engineering Standards
------------------------------------------------------------------------------

Purpose

The Application Layer coordinates business workflows between the Domain,
Infrastructure, and Presentation layers.

It contains application-specific orchestration while preserving the integrity
of the business domain.

The Application Layer should never become a repository of business rules.

------------------------------------------------------------------------------
Application Layer Philosophy
------------------------------------------------------------------------------

The Application Layer answers the question:

"How should this business use case be executed?"

It coordinates business objects but does not own them.

Business decisions remain within the Domain Layer.

------------------------------------------------------------------------------
Primary Responsibilities
------------------------------------------------------------------------------

The Application Layer is responsible for:

• Executing application use cases.
• Coordinating multiple repositories.
• Preparing ViewModels.
• Building Business Projections.
• Managing workspace-specific workflows.
• Handling navigation-level orchestration.

It should not contain business policies that belong to the Domain.

------------------------------------------------------------------------------
Coordinator Pattern
------------------------------------------------------------------------------

Every major workspace should be implemented through a dedicated Coordinator.

Examples

ResidentsListCoordinator

ResidentWorkspaceCoordinator

ReservationWorkspaceCoordinator

AdmissionWorkspaceCoordinator

FinanceWorkspaceCoordinator

The Coordinator acts as the orchestration point for the workspace.

------------------------------------------------------------------------------
Coordinator Responsibilities
------------------------------------------------------------------------------

A Coordinator should:

• Retrieve business entities.
• Coordinate multiple repositories.
• Build ViewModels.
• Build Business Projections.
• Prepare dashboard information.
• Prepare summary information.
• Prepare workspace sections.

The Coordinator should remain free of presentation concerns.

------------------------------------------------------------------------------
ViewModel Pattern
------------------------------------------------------------------------------

The Application Layer exposes information through ViewModels.

Presentation components consume ViewModels rather than Domain entities
directly.

Benefits include:

• Presentation independence.
• Stable UI contracts.
• Easier testing.
• Easier evolution.

------------------------------------------------------------------------------
Business Projections
------------------------------------------------------------------------------

Business Projections should be created within the Application Layer.

Example

Resident Workspace

↓

Projects Current Stay

↓

Stay Repository

↓

ResidentWorkspaceViewModel

The Domain remains unchanged while the workspace receives all required
information.

------------------------------------------------------------------------------
Application Layer Boundaries
------------------------------------------------------------------------------

The Application Layer may:

• Read business entities.
• Coordinate repositories.
• Build projections.
• Prepare workspace models.

The Application Layer should not:

• Persist infrastructure data directly.
• Contain business validation rules.
• Render UI.
• Know framework-specific details.

------------------------------------------------------------------------------
Dependency Direction
------------------------------------------------------------------------------

Dependencies should always point inward.

Presentation
        ↓
Application
        ↓
Domain

Infrastructure implements interfaces owned by the Domain or Application.

The Application Layer should never depend on Presentation components.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Application services should:

• Have a single responsibility.
• Remain stateless where practical.
• Be deterministic.
• Be easily testable.
• Avoid unnecessary framework coupling.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

The Application Layer coordinates.

The Domain decides.

The Presentation renders.

The Infrastructure persists.

------------------------------------------------------------------------------
11. Repository Engineering Standards
------------------------------------------------------------------------------

Purpose

Repositories provide the persistence boundary between the business domain and
the underlying data source.

They abstract data access while allowing the Domain and Application layers to
remain independent of storage technology.

------------------------------------------------------------------------------
Repository Philosophy
------------------------------------------------------------------------------

Repositories exist to retrieve and persist business objects.

They should hide infrastructure implementation details while exposing business-
oriented operations.

A repository represents a collection of business entities rather than database
tables.

------------------------------------------------------------------------------
Repository Responsibilities
------------------------------------------------------------------------------

Repositories are responsible for:

• Retrieving business entities.
• Persisting business entities.
• Executing business-oriented queries.
• Managing aggregate persistence.
• Providing data access abstractions.

Repositories should not implement business policies.

------------------------------------------------------------------------------
Repository Interfaces
------------------------------------------------------------------------------

Repository interfaces belong to the Domain or Application boundary.

Examples

ResidentRepository

StayRepository

AccommodationRepository

ReservationRepository

FinanceRepository

Infrastructure provides the concrete implementation.

------------------------------------------------------------------------------
Repository Implementations
------------------------------------------------------------------------------

Different implementations may exist for the same repository interface.

Examples

InMemoryResidentRepository

SupabaseResidentRepository

MockResidentRepository

All implementations must provide identical business behaviour.

Changing the implementation must not affect the Application or Presentation
layers.

------------------------------------------------------------------------------
Business-Oriented Methods
------------------------------------------------------------------------------

Repository methods should express business intent.

Examples

Correct

findResidentById()

findActiveStay()

searchResidents()

saveResident()

Incorrect

selectResidentTable()

executeResidentQuery()

updateResidentRow()

Method names should describe business operations rather than database actions.

------------------------------------------------------------------------------
Search Operations
------------------------------------------------------------------------------

Repositories may expose business-oriented search capabilities.

Search implementations should remain independent of presentation concerns.

The repository should return business entities or projections rather than UI
objects.

------------------------------------------------------------------------------
Aggregate Boundaries
------------------------------------------------------------------------------

Each repository owns a single aggregate.

Repositories should not directly manipulate entities belonging to another
aggregate.

Cross-domain workflows should be coordinated by the Application Layer.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Repositories should:

• Be technology independent.
• Have clear aggregate ownership.
• Return consistent results.
• Be deterministic.
• Remain easily testable.
• Avoid framework-specific behaviour in their interfaces.

------------------------------------------------------------------------------
Future Evolution
------------------------------------------------------------------------------

Repository implementations may evolve as the application grows.

Examples include:

• Supabase
• PostgreSQL
• Offline storage
• Synchronisation services

These changes should not require modifications to business logic.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Repositories persist business objects.

They do not implement business workflows.

Business workflows belong to the Application Layer.

------------------------------------------------------------------------------
12. Data Entry Engineering Standards
------------------------------------------------------------------------------

Purpose

Data Entry interfaces enable operators to create, update, and validate business
information.

Every data entry workflow should prioritise accuracy, consistency, and
operational efficiency while preserving business integrity.

------------------------------------------------------------------------------
Data Entry Philosophy
------------------------------------------------------------------------------

Data entry should support the operator rather than challenge them.

Interfaces should minimise unnecessary effort, prevent avoidable mistakes, and
guide users naturally through the required business workflow.

------------------------------------------------------------------------------
Single Responsibility
------------------------------------------------------------------------------

Each data entry workflow should have one clearly defined purpose.

Examples

Resident Profile

Purpose:

Manage permanent resident information.

Stay Workspace

Purpose:

Manage operational residency.

Admission

Purpose:

Create a Resident and an active Stay.

Avoid combining unrelated business workflows into a single form.

------------------------------------------------------------------------------
Business-Oriented Design
------------------------------------------------------------------------------

Fields should be grouped according to business meaning rather than database
structure.

Example

Personal Information

↓

Contact Information

↓

Address

↓

Emergency Contacts

↓

Documents

This organisation mirrors how operators think about the business object.

------------------------------------------------------------------------------
Validation
------------------------------------------------------------------------------

Validation should occur at multiple levels.

Presentation Layer

• Required fields
• Input format
• Immediate feedback

Application Layer

• Workflow validation
• Cross-domain validation

Domain Layer

• Business rules
• Invariants
• Aggregate integrity

Business rules should never rely solely on UI validation.

------------------------------------------------------------------------------
Editing
------------------------------------------------------------------------------

Editing should follow the Single Entry Point principle.

Each major business object should have one primary editing workflow.

Example

Resident

↓

Edit Resident Profile

Business Sections should display information without duplicating the primary
editing workflow.

------------------------------------------------------------------------------
Data Integrity
------------------------------------------------------------------------------

Data entry workflows should:

• Prevent invalid business states.
• Preserve existing data where appropriate.
• Avoid accidental overwrites.
• Clearly communicate validation errors.
• Confirm destructive operations.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Data entry interfaces should:

• Use business terminology.
• Maintain consistent layouts.
• Support keyboard navigation.
• Preserve user context.
• Minimise scrolling where practical.
• Avoid unnecessary modal dialogs.

------------------------------------------------------------------------------
Future Evolution
------------------------------------------------------------------------------

Future enhancements may include:

• Multi-step workflows
• Guided wizards
• Draft support
• Auto-save
• AI-assisted data entry

These enhancements should build upon the same engineering principles.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Data entry should feel natural.

Business validation should remain authoritative.

The interface should guide.

The Domain should decide.

------------------------------------------------------------------------------
13. Testing Engineering Standards
------------------------------------------------------------------------------

Purpose

Testing ensures that RPGMS business behaviour remains reliable, predictable,
and maintainable as the application evolves.

The objective of testing is to verify business correctness rather than simply
increase code coverage.

------------------------------------------------------------------------------
Testing Philosophy
------------------------------------------------------------------------------

Testing should provide confidence that business workflows continue to operate
correctly.

Tests should focus on protecting business behaviour, architectural integrity,
and critical application workflows.

------------------------------------------------------------------------------
Testing Priorities
------------------------------------------------------------------------------

Testing effort should follow the following priority:

1. Business Rules
2. Application Layer
3. Business Projections
4. Repository Behaviour
5. User Interface

Business correctness always takes precedence over visual behaviour.

------------------------------------------------------------------------------
Unit Testing
------------------------------------------------------------------------------

Unit tests should validate isolated business behaviour.

Examples include:

• Business rule evaluation
• Coordinator behaviour
• ViewModel generation
• Search logic
• Projection construction
• Validation logic

Unit tests should execute quickly and remain deterministic.

------------------------------------------------------------------------------
Application Layer Testing
------------------------------------------------------------------------------

Application Layer tests should verify that Coordinators correctly:

• Retrieve business entities.
• Coordinate repositories.
• Build ViewModels.
• Construct Business Projections.
• Prepare Operational Dashboards.
• Handle expected workflow scenarios.

Application Layer tests should avoid dependence on external infrastructure.

------------------------------------------------------------------------------
Repository Testing
------------------------------------------------------------------------------

Repository tests should verify:

• Retrieval operations.
• Persistence operations.
• Search behaviour.
• Aggregate integrity.
• Consistent business results.

Repository implementations should behave consistently regardless of storage
technology.

------------------------------------------------------------------------------
Presentation Testing
------------------------------------------------------------------------------

Presentation testing should verify:

• Correct rendering.
• Navigation behaviour.
• User interaction.
• Conditional visibility.
• Workspace composition.

Presentation tests should avoid duplicating business rule validation already
covered by lower architectural layers.

------------------------------------------------------------------------------
Regression Testing
------------------------------------------------------------------------------

Every resolved defect should be evaluated to determine whether a regression
test should be added.

Critical business defects should always result in new automated tests.

------------------------------------------------------------------------------
Engineering Guidelines
------------------------------------------------------------------------------

Tests should:

• Be deterministic.
• Be easy to understand.
• Have a single purpose.
• Avoid unnecessary duplication.
• Remain independent of execution order.
• Use meaningful business terminology.

------------------------------------------------------------------------------
Testing Pyramid
------------------------------------------------------------------------------

RPGMS follows a business-oriented testing strategy.

Business Rules
        ↓
Application Layer
        ↓
Repositories
        ↓
Presentation

The majority of automated tests should exist within the lower architectural
layers where business behaviour is defined.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Test business behaviour.

Protect architectural boundaries.

Use the user interface to verify presentation rather than business logic.

------------------------------------------------------------------------------
14. Documentation Engineering Standards
------------------------------------------------------------------------------

Purpose

Documentation is an integral part of RPGMS 2.0 engineering.

It preserves architectural decisions, business knowledge, engineering
standards, and implementation guidance, ensuring that the project remains
maintainable as it evolves.

Documentation should evolve alongside the software rather than after it.

------------------------------------------------------------------------------
Documentation Philosophy
------------------------------------------------------------------------------

Documentation is treated as a first-class engineering asset.

Every significant architectural decision, reusable engineering pattern, and
business capability should be documented to ensure consistent implementation
across the project.

Well-maintained documentation reduces onboarding time, improves development
consistency, and preserves institutional knowledge.

------------------------------------------------------------------------------
Documentation Hierarchy
------------------------------------------------------------------------------

RPGMS documentation is organised into five layers:

1. Constitutional Documents

Define the permanent business, architectural, and engineering foundation.

2. Engineering Standards

Define proven engineering patterns and implementation guidance.

3. AI Governance

Define how AI assistants understand and contribute to the project.

4. Project Management

Track current implementation status, roadmap, and development progress.

5. Module Specifications

Describe the detailed functional and implementation requirements for
individual business capabilities.

Each layer builds upon the layers above it.

------------------------------------------------------------------------------
Single Source of Truth
------------------------------------------------------------------------------

Every significant topic must have one authoritative document.

Information should not be duplicated across multiple documents.

When a topic evolves, its authoritative document should be updated rather than
replicating information elsewhere.

------------------------------------------------------------------------------
Documentation Maintenance
------------------------------------------------------------------------------

Documentation should be updated whenever:

• A new engineering pattern is established.
• A business rule changes.
• A major architectural decision is made.
• A business capability reaches a significant milestone.
• A constitutional document changes.

Routine implementation details and minor bug fixes generally do not require
documentation updates unless they affect architectural understanding.

------------------------------------------------------------------------------
Writing Standards
------------------------------------------------------------------------------

Documentation should:

• Be concise.
• Use business terminology.
• Explain the reasoning behind decisions.
• Avoid unnecessary repetition.
• Remain implementation independent where appropriate.
• Be easy to navigate.

Examples and diagrams should be used where they improve understanding.

------------------------------------------------------------------------------
Version Management
------------------------------------------------------------------------------

Governance documents should include:

• Document Information
• Version
• Status
• Last Updated
• Version History

Major structural revisions should increment the document version and record
the reason for the change.

------------------------------------------------------------------------------
Engineering Documentation
------------------------------------------------------------------------------

Significant engineering patterns should be documented before being reused
across multiple modules.

Examples include:

• Workspace Standards
• Navigation Standards
• Dashboard Standards
• Business Projection Standards
• Coordinator Pattern

Documenting proven patterns promotes consistency and reduces future design
effort.

------------------------------------------------------------------------------
Module Specifications
------------------------------------------------------------------------------

Each major business capability should have its own specification document.

Module specifications describe:

• Business workflows
• Workspace design
• Functional requirements
• User experience
• Acceptance criteria

Module specifications should remain aligned with constitutional documents and
engineering standards.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Good documentation preserves engineering knowledge.

Great documentation enables consistent engineering.

------------------------------------------------------------------------------
Engineering Exceptions
------------------------------------------------------------------------------

Engineering standards define the preferred implementation approach.

Exceptions may be permitted when:

• Required by business constraints.
• Required by technical limitations.
• Necessary to preserve architectural integrity.

All significant deviations should be documented and justified.

------------------------------------------------------------------------------
15. Engineering Evolution & Governance
------------------------------------------------------------------------------

Purpose

Engineering standards should evolve in a controlled and deliberate manner as
RPGMS grows.

This chapter defines how new engineering patterns become official standards,
how existing standards are maintained, and how long-term consistency is
preserved across the project.

------------------------------------------------------------------------------
Engineering Evolution Philosophy
------------------------------------------------------------------------------

Engineering standards should emerge from proven implementation rather than
theoretical design.

A successful implementation becomes a candidate for standardisation only after
it has demonstrated clear benefits across real business scenarios.

The objective is continuous improvement without sacrificing consistency.

------------------------------------------------------------------------------
Standard Adoption Process
------------------------------------------------------------------------------

A new engineering pattern should follow the lifecycle below before becoming an
official RPGMS standard.

Implementation
        ↓
Validation
        ↓
Reuse
        ↓
Documentation
        ↓
Standardisation

Only patterns that have been successfully reused across multiple business
modules should normally become engineering standards.

------------------------------------------------------------------------------
Criteria for Standardisation
------------------------------------------------------------------------------

A pattern may be adopted as an engineering standard when it:

• Solves a recurring engineering problem.
• Improves implementation consistency.
• Enhances maintainability.
• Simplifies future development.
• Has been successfully validated in production-quality modules.

Engineering standards should not be introduced solely because they are
technically interesting or fashionable.

------------------------------------------------------------------------------
Review Process
------------------------------------------------------------------------------

Engineering standards should be reviewed whenever:

• A major business capability is completed.
• A new reusable engineering pattern emerges.
• A significant architectural decision is made.
• Existing standards no longer support project goals.

Reviews should focus on improving consistency while preserving architectural
stability.

------------------------------------------------------------------------------
Backward Compatibility
------------------------------------------------------------------------------

New engineering standards should remain compatible with existing
implementations whenever practical.

When compatibility cannot be maintained:

• The reason should be documented.
• Migration guidance should be provided.
• Affected modules should be updated in a planned manner.

------------------------------------------------------------------------------
Relationship to Constitutional Documents
------------------------------------------------------------------------------

Engineering standards must remain consistent with:

• BUSINESS_BLUEPRINT.md
• BUSINESS_RULES.md
• DOMAIN_MODEL.md
• ARCHITECTURE.md
• PROJECT_RULES.md

Engineering Standards define implementation guidance.

Constitutional documents define project governance.

Where conflicts exist, constitutional documents always take precedence.

------------------------------------------------------------------------------
Continuous Improvement
------------------------------------------------------------------------------

Engineering standards should improve incrementally.

Small, well-validated improvements are preferred over large-scale redesigns.

Successful patterns should be documented early so that future modules inherit
them rather than rediscovering them.

------------------------------------------------------------------------------
Future Capability Releases
------------------------------------------------------------------------------

Each Capability Release should be evaluated for new reusable engineering
patterns.

Examples may include:

• New workspace types.
• New navigation models.
• New dashboard patterns.
• New coordinator patterns.
• New business projection techniques.

Only patterns with long-term value should be incorporated into this document.

------------------------------------------------------------------------------
Design Principle
------------------------------------------------------------------------------

Engineering standards exist to improve consistency rather than restrict
innovation.

Innovation should produce better standards.

Standards should produce better software.

------------------------------------------------------------------------------
Approval
------------------------------------------------------------------------------

Status

Approved

This document forms part of the constitutional engineering guidance for
RPGMS 2.0 and should be reviewed whenever significant engineering patterns
are established or existing standards evolve.

