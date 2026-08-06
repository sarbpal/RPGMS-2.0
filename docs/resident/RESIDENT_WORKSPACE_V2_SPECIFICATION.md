# Resident Workspace V2 Specification

**Project:** RPGMS 2.0 – Ritu PG Management System  
**Module:** Resident Management  
**Document Version:** 1.0  
**Document Status:** Approved
**Prepared By:** RPGMS 2.0 Project  
**Last Updated:** 19 July 2026

---

# Purpose of this Document

This document defines the complete business, operational, and architectural specification for the Resident Workspace in RPGMS 2.0.

The Resident Workspace is the permanent master record of every resident associated with the PG. It manages resident identity, personal profile, compliance records, registered assets, and long-term historical information while intentionally remaining independent of operational residency management.

This document establishes the design philosophy, business rules, ownership boundaries, information architecture, operational workflows, and user experience standards for the Resident module.

This specification serves as the constitutional reference for all future implementation, enhancement, maintenance, and architectural decisions related to Resident Management.

---

# Scope

This document covers:

- Resident Workspace
- Residents List Workspace
- Resident Information Architecture
- Resident Documents
- Compliance Management
- Search Strategy
- Resident Timeline
- Navigation Philosophy
- Business Rules
- Information Ownership
- Future Evolution

This document does **not** define:

- Stay lifecycle management
- Accommodation operations
- Commercial agreements
- Billing
- Finance
- Reservation lifecycle

These responsibilities are documented separately within their respective modules.

---

# Applicability

This specification applies to all engineering work related to the Resident module within RPGMS 2.0.

It shall be followed when:

- Designing new Resident module features.
- Enhancing existing Resident functionality.
- Implementing user interface components.
- Developing application layer workflows.
- Designing repositories and business projections.
- Reviewing architectural changes.
- Performing AI-assisted development.
- Conducting design or code reviews.

All future enhancements to the Resident module shall remain consistent with the constitutional principles defined in this specification.

---

# Constitutional Scope

This document defines the constitutional business architecture of the Resident module.

It specifies:

- Business responsibilities
- Domain ownership
- Operational workflows
- Information architecture
- Business rules
- Navigation philosophy
- Long-term architectural principles

This document intentionally does **not** prescribe implementation details such as:

- React component structure
- API design
- Database schema
- Repository implementation
- DTO definitions
- UI styling
- Infrastructure configuration

Implementation decisions shall remain consistent with the principles defined in this specification while allowing appropriate technical flexibility.

---

# Related Documents

- ARCHITECTURE.md
- PROJECT_RULES.md
- BUSINESS_CONSTITUTION_RECONCILIATION.md
- PROJECT_ENGINEERING_STANDARD.md
- Stay Workspace Specification (Future)
- Stay Module Release Certificate

---

## Relationship with the Stay Workspace Specification

The Resident Workspace Specification and the future Stay Workspace Specification are complementary constitutional documents.

The Resident Workspace defines the permanent identity and long-term profile of a person.

The Stay Workspace Specification defines the operational lifecycle of residency.

Together, these specifications describe the complete lifecycle of a resident within RPGMS 2.0 while preserving clear domain ownership between permanent identity and operational residency.

Neither specification supersedes the other. They should be read together when implementing functionality that spans both domains.

---

# Version History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | 19-Jul-2026 | Initial Resident Workspace V2 Specification |
| 1.1 | 05-Aug-2026 | Documentation Consolidation Sprint (DCS-1): Reviewed and refined the Resident Workspace Specification for constitutional alignment, clarified document applicability and scope, strengthened cross-document governance, and aligned the specification with the approved engineering standards and project documentation framework. |

---

# Table of Contents

1. Purpose
2. Design Philosophy
3. Domain Ownership
4. Resident Lifecycle
5. Residents List Workspace
6. Resident Workspace
7. Standard Admission Workspace
8. Resident Information Architecture
9. Resident Documents
10. Compliance Management
11. Search Strategy
12. Timeline & History
13. Navigation Philosophy
14. Security & Permissions
15. Data Retention & Audit
16. Business Rules
17. Future Enhancements
18. Design Validation Checklist

Appendices

A. Field Ownership Matrix

B. Operational Terminology

C. Domain Ownership Matrix

D. Real World Business Workflows

---

# 1. Purpose

## 1.1 Objective

The Resident Workspace represents the permanent master record of a person residing in the PG.

Its primary objective is to maintain all long-term resident information including personal identity, contact information, documents, registered assets, compliance records, and historical information throughout the resident's relationship with the organisation.

Unlike operational workspaces, the Resident Workspace is intentionally designed to outlive individual stays. A resident may complete multiple stays over several years while continuing to use the same Resident record.

---

## 1.2 Design Intent

The Resident Workspace is designed around the philosophy that a **Resident represents a person**, while a **Stay represents a period of residency**.

This separation ensures that operational activities such as admissions, accommodation allocation, commercial agreements, notice processing, and checkout remain independent from the resident's permanent identity.

The Resident Workspace therefore serves as the long-term source of truth for person-related information while operational information is displayed through projections originating from the Stay domain.

---

## 1.3 Business Objectives

The Resident Workspace shall:

- Maintain a permanent resident master record.
- Support multiple historical stays without creating duplicate residents.
- Enable minimal onboarding during admission.
- Encourage progressive profile completion over time.
- Maintain resident documents and compliance records.
- Provide operational visibility through the Current Stay Summary.
- Preserve complete historical information for audit purposes.
- Provide quick navigation to operational workspaces.
- Support efficient day-to-day hostel operations.

---

## 1.4 Guiding Principles

The Resident Workspace is governed by the following principles:

- Resident represents a Person.
- Stay represents Residency.
- Resident records are permanent.
- Admission should remain minimal.
- Profiles grow progressively over time.
- Every piece of information has a single owner.
- Operational information is displayed but never duplicated.
- Repeatable information shall support unlimited entries.
- Historical information shall never be lost.
- Compliance shall be managed independently from the Stay lifecycle.
- Search shall support real operational workflows.
- The workspace shall assist operators rather than function as a simple data entry form.

---

## 1.5 Relationship with Other Workspaces

The Resident Workspace collaborates with several other modules while maintaining clear ownership boundaries.

| Workspace | Responsibility |
|-----------|----------------|
| Residents List | Locate and manage residents |
| Resident Workspace | Permanent resident master record |
| Stay Workspace | Operational residency management |
| Accommodation | Physical accommodation resources |
| Reservations | Reservation lifecycle before admission |
| Finance | Billing, ledger and settlement |
| Compliance | Compliance records and renewals |

Each workspace owns its respective business responsibilities while collaborating through clearly defined domain boundaries.

---

## 1.6 Success Criteria

The Resident Workspace shall successfully achieve the following objectives:

- Support rapid resident onboarding.
- Preserve permanent resident identity.
- Support multiple stays throughout the resident lifecycle.
- Eliminate duplication of operational information.
- Support progressive profile completion.
- Provide complete compliance visibility.
- Maintain complete audit history.
- Improve operator productivity through intuitive workspace design.
- Remain fully aligned with the Clean Architecture principles adopted by RPGMS 2.0.

---

# 2. Design Philosophy

The Resident Workspace has been designed around a set of fundamental business principles that guide every architectural decision, user interface design, workflow, and future enhancement.

These principles ensure that the Resident module remains consistent with the overall architecture of RPGMS 2.0 while accurately reflecting the real-world operational practices of the PG.

Every future enhancement to the Resident module shall be evaluated against these principles before implementation.

---

## 2.1 Resident Represents a Person

A Resident represents a permanent person record within RPGMS.

The Resident exists independently of any particular stay, room allocation, commercial agreement, or accommodation.

A resident may complete multiple stays over several years while continuing to use the same Resident record.

The Resident Workspace therefore manages the long-term identity and profile of the person rather than the operational details of a particular stay.

---

## 2.2 Stay Represents Residency

A Stay represents a specific period during which a resident occupies accommodation within the PG.

Operational activities including admission, accommodation allocation, commercial agreements, notice, and checkout belong exclusively to the Stay domain.

The Resident Workspace may display operational information originating from the active Stay but shall never own or maintain that information.

This separation preserves clear domain ownership and prevents duplication of operational data.

---

## 2.3 Resident First Philosophy

Every operational workflow begins by identifying the person.

Whether the resident arrives through a reservation, a walk-in admission, or a returning admission, the system first establishes or identifies the Resident before initiating operational residency.

This philosophy ensures that resident identity remains independent from individual stays and supports multiple stays throughout the resident lifecycle.

---

## 2.4 Minimal Onboarding

Admission should never become a lengthy data entry exercise.

Only the information required to operationally admit a resident shall be collected during onboarding.

Additional resident information shall be completed progressively over time through the Resident Workspace.

This philosophy reflects the real-world operational practices of the PG and minimizes delays during admission.

---

## 2.5 Progressive Profile Completion

The Resident Profile is intentionally designed to evolve over time.

Operators should be able to continuously enrich the resident profile whenever additional information becomes available.

Profile completion shall never prevent operational activities once the minimum admission requirements have been satisfied.

The system should encourage profile completion without making it mandatory during admission.

---

## 2.6 Progressive Compliance

Compliance activities are performed throughout the resident's stay rather than exclusively during admission.

Documents such as police intimation reports, employment proof, student proof, and future compliance requirements may be collected whenever they become available.

Compliance therefore evolves alongside the resident profile instead of delaying admission.

---

## 2.7 Single Source of Truth

Every business entity within RPGMS shall have exactly one authoritative owner.

Examples include:

- Resident owns personal identity and long-term profile information.
- Stay owns operational residency.
- Accommodation owns physical accommodation resources.
- Finance owns accounting and financial transactions.
- Compliance owns compliance records and renewals.

Information shall never be duplicated across multiple domains.

Operational information displayed within the Resident Workspace shall always originate from its owning domain.

---

## 2.8 Operational Data is Displayed, Not Owned

The Resident Workspace presents important operational information through the Current Stay Summary.

Examples include:

- Flat
- Bed
- Door ID
- Monthly Rent
- Security Deposit
- Stay Status
- Notice Status
- Expected Checkout

This information is displayed solely for operational convenience.

The authoritative source remains the Stay Projection generated by the Stay domain.

No operational data shall be persisted within the Resident aggregate.

---

## 2.9 Repeatable Collections

Information that may legitimately occur multiple times shall never be represented by fixed fields.

Instead, the Resident Workspace shall support repeatable collections.

Examples include:

- Resident Documents
- Emergency / Reference Contacts
- Registered Devices
- Registered Vehicles
- Future compliance records

This approach provides long-term scalability while maintaining a consistent user experience.

---

## 2.10 Workspace-Oriented Design

The Resident Workspace is not intended to function as a large data entry form.

Instead, it provides an operational workspace where information is organised into logical business sections.

Each section should support independent viewing, editing, and management without requiring operators to navigate a single large profile form.

This design improves usability, simplifies validation, and supports future role-based permissions.

---

## 2.11 Operational Readiness

Operational readiness is distinct from profile completeness.

A resident may be operationally ready to reside in the PG even though portions of the resident profile remain incomplete.

The Resident Workspace should clearly distinguish between:

- Admission Readiness
- Operational Readiness
- Compliance Status
- Overall Profile Completion

This approach enables efficient hostel operations while encouraging progressive completion of resident information.

---

## 2.12 Historical Preservation

Historical information represents an important business asset.

Resident history, compliance history, documents, and operational events shall be preserved wherever practical.

Updates should create historical records instead of replacing significant business information.

The Resident Workspace should provide visibility into historical information while maintaining the integrity of current operational data.

---

## 2.13 Search Supports Operations

Search functionality shall be designed around real operational workflows rather than technical database fields.

Operators should be able to locate residents using whichever information is immediately available during daily operations.

Search shall therefore support identity, accommodation, access control, contact information, documents, vehicles, registered devices, and other operational identifiers relevant to the business.

---

## 2.14 Long-Term Evolution

The Resident Workspace has been designed as a long-term operational platform.

Future enhancements such as document verification, OCR, digital signatures, resident self-service, mobile applications, and additional compliance workflows shall extend the existing architecture rather than replacing it.

All future enhancements shall remain consistent with the principles defined in this chapter.

---

# 3. Domain Ownership

Clear ownership boundaries are fundamental to the architecture of RPGMS 2.0.

Every business entity, field, workflow, and responsibility shall belong to exactly one bounded context.

The purpose of this chapter is to establish those ownership boundaries for the Resident Workspace and define how it collaborates with other domains without duplicating information or responsibilities.

These ownership rules shall be considered authoritative for all future development.

---

## 3.1 Ownership Philosophy

Every piece of information within RPGMS shall have exactly one owner.

Information may be displayed in multiple workspaces where operationally useful, but it shall always originate from its owning domain.

No business information shall be duplicated merely for presentation convenience.

This philosophy preserves data integrity, simplifies maintenance, and ensures that every business rule is implemented in only one location.

---

## 3.2 Resident Domain Owns

The Resident domain owns all long-term information relating to a person.

This includes:

### Personal Identity

- Resident Code
- Full Name
- Photograph
- Gender
- Date of Birth
- Occupation

### Contact Information

- Mobile Number
- Email Address
- Future Alternate Contact Numbers

### Permanent Address

- Address
- City / District
- State
- PIN Code

### Resident Documents

- Identity Documents
- Education Documents
- Employment Documents
- Compliance Documents
- Financial Documents
- Other Supporting Documents

### Emergency / Reference Contacts

- Contact Name
- Relationship
- Phone Number

### Registered Devices

- Device Name
- Device Type
- MAC Address

### Registered Vehicles

- Vehicle Type
- Registration Number

### Medical Information

- Blood Group
- Allergies
- Medical Notes

### Resident History

- Resident Profile Updates
- Resident Timeline
- Resident Preferences (Future)

The Resident domain is responsible for maintaining this information throughout the resident's lifetime within the system.

---

## 3.3 Stay Domain Owns

The Stay domain owns all operational residency information.

This includes:

- Admission
- Check-in
- Current Stay
- Stay Status
- Bed Allocation
- Bed Transfers
- Flat Transfers
- Commercial Agreements
- Monthly Rent
- Security Deposit
- Notice
- Expected Checkout
- Operational Checkout
- Current Projection
- Stay Timeline
- Business Events

The Resident Workspace may display information originating from the active Stay through the Current Stay Summary but shall never own or modify that information.

---

## 3.4 Accommodation Domain Owns

The Accommodation domain owns all physical accommodation resources.

This includes:

- Areas
- Flats
- Rooms (where applicable)
- Beds
- Bed Status
- Door IDs
- Physical Occupancy
- Maintenance Blocks

Door IDs are operational access credentials managed by the Accommodation domain.

The Resident Workspace may display the currently assigned Door ID through the active Stay projection but shall not own or maintain Door ID assignments.

---

## 3.5 Reservation Domain Owns

The Reservation domain owns the complete reservation lifecycle before admission.

This includes:

- Reservation Creation
- Reservation Status
- Expected Arrival
- Token Amount
- Reservation Conversion
- Reservation Cancellation

Admission marks the transition from Reservation to Stay.

The Resident Workspace shall not own reservation information.

---

## 3.6 Finance Domain Owns

The Finance domain owns all accounting and financial transactions.

This includes:

- Billing
- Ledger Entries
- Payments
- Refunds
- Deposits
- Settlements
- Financial Reports
- Outstanding Dues

Although the Resident Workspace may display selected financial information through the Current Stay Summary, the Finance domain remains the single source of truth for all accounting records.

---

## 3.7 Compliance Domain Owns

The Compliance domain manages administrative and regulatory compliance activities performed during the resident's stay.

This includes:

- Police Intimation Records
- Police Verification Records
- Agreement Renewals
- Compliance Renewals
- Compliance History
- Compliance Alerts
- Compliance Status

Compliance activities do not terminate or recreate a Stay.

They are administrative activities performed alongside an uninterrupted operational Stay.

Compliance records shall be maintained as immutable historical records.

---

## 3.8 Shared Information

Certain information may be displayed across multiple workspaces for operational convenience.

Examples include:

| Information | Owner | Displayed In |
|------------|-------|--------------|
| Flat | Stay | Resident Workspace |
| Bed | Stay | Resident Workspace |
| Door ID | Accommodation | Resident Workspace |
| Monthly Rent | Stay | Resident Workspace |
| Security Deposit | Stay | Resident Workspace |
| Stay Status | Stay | Resident Workspace |
| Notice Status | Stay | Resident Workspace |

Displaying shared information does not transfer ownership.

All updates shall continue to originate from the owning domain.

---

## 3.9 Ownership Principles

The following ownership principles shall always apply:

- Every business entity has exactly one owner.
- Information may be displayed in multiple workspaces but owned only once.
- Business rules shall be implemented only within the owning domain.
- Operational projections shall never become duplicate sources of truth.
- Domain boundaries shall not be crossed for implementation convenience.
- Future enhancements shall preserve these ownership boundaries.

---

## 3.10 Summary

The Resident Workspace exists to manage the long-term identity and profile of a person.

Operational residency belongs to the Stay domain.

Physical accommodation belongs to the Accommodation domain.

Financial accounting belongs to the Finance domain.

Reservations belong to the Reservation domain.

Compliance activities belong to the Compliance domain.

Maintaining these boundaries is essential to preserving the Clean Architecture and long-term maintainability of RPGMS 2.0.

---

# 4. Resident Lifecycle

The Resident Lifecycle defines the long-term relationship between a person and the PG.

Unlike a Stay, which represents a single operational residency, the Resident record represents the permanent identity of the individual within RPGMS.

A Resident may complete multiple independent stays throughout several years while continuing to use the same Resident record.

The Resident lifecycle therefore focuses on the person rather than individual accommodation periods.

---

## 4.1 Lifecycle Philosophy

A Resident is intended to be a permanent business entity.

The Resident record is created only once and remains available throughout the resident's entire relationship with the PG.

Individual admissions, accommodation allocations, commercial agreements, notices, operational checkouts, and future readmissions are managed through separate Stay records.

This separation preserves historical accuracy while preventing duplicate resident records.

---

## 4.2 Resident Lifecycle

The typical Resident lifecycle is illustrated below.

Enquiry (Future)
        │
        ▼
Reservation (Optional)
        │
        ▼
Admission
        │
        ├── Existing Resident → Reuse Resident
        │
        └── New Person → Create Resident
        │
        ▼
Create Stay
        ▼
Resident with Active Stay
        ▼
Resident On Notice
        ▼
Operational Checkout
        ▼
Resident (Alumni)
        ▼
Future Admission
        ▼
New Stay

The Resident record continues throughout this lifecycle.

Only the Stay changes.

---

## 4.3 Pre-Admission Stage

A prospective resident is a person who has expressed interest in joining the PG but has not yet completed admission.

A prospective resident may originate from:

- Walk-in enquiry
- Telephone enquiry
- Online enquiry
- Reservation
- Returning resident enquiry

A prospective resident does not yet have an operational Stay.

---

## 4.4 Resident Creation

A Resident record is created when the person is admitted for the first time.

Where the resident already exists within RPGMS, the existing Resident record shall always be reused.

Duplicate Resident records shall never be created for the same individual.

---

## 4.5 Admission

Admission creates a new Stay for the Resident.

Admission does not create a new Resident when an existing Resident record is available.

During admission the system:

- identifies or creates the Resident,
- creates a new Stay,
- creates the initial Commercial Agreement,
- allocates accommodation,
- assigns Door ID,
- establishes operational residency.

The admission process follows the principle of Minimal Onboarding.

---

## 4.6 Active Stay

Once admitted, the Resident enters an Active Stay.

The Resident Workspace continues to own personal information while operational information is managed by the Stay domain.

The Resident Workspace displays the Current Stay Summary using the Stay Projection.

---

## 4.7 Notice Period

When notice is submitted, the Stay transitions to ON_NOTICE.

The Resident record remains unchanged.

Accommodation, commercial agreements and operational history continue under the same Stay.

The Resident Workspace reflects the current notice status through the Current Stay Summary.

---

## 4.8 Operational Checkout

Operational Checkout completes the current Stay.

During checkout:

- Bed allocation is released.
- Door ID is released.
- Commercial agreements are closed.
- Operational residency ends.

The Resident record remains active within RPGMS.

Operational Checkout never deletes or recreates the Resident.

---

## 4.9 Alumni

After operational checkout, the resident enters Alumni status.

The Resident remains permanently available within RPGMS.

Historical information including:

- documents,
- compliance records,
- previous stays,
- historical timelines,

shall remain available for future reference.

Alumni may subsequently return to the PG through a future admission.

---

## 4.10 Returning Resident

A returning resident shall always reuse the existing Resident record.

A new Stay is created while preserving all historical information.

Previous stays remain historically available.

The Resident Workspace therefore becomes progressively richer over time as additional stays and profile information accumulate.

---

## 4.11 Multiple Stay Lifecycle

A Resident may complete multiple independent stays throughout their relationship with the PG.

Example:

```text
Resident

↓

Stay 1

↓

Checkout

↓

Stay 2

↓

Checkout

↓

Stay 3

↓

...
```

Each Stay maintains its own:

- Commercial Agreements
- Bed Allocations
- Business Events
- Operational Timeline

The Resident maintains the permanent identity across all stays.

---

## 4.12 Compliance Throughout the Lifecycle

Compliance activities occur independently of the Stay lifecycle.

Examples include:

- Police Intimation
- Agreement Renewal
- Employment Proof
- Student Proof

Compliance activities may occur multiple times during a single Stay.

Completing a compliance activity does not terminate, suspend or recreate the Stay.

Compliance history remains permanently preserved.

---

## 4.13 Lifecycle Principles

The following principles govern the Resident lifecycle:

- A Resident is created only once.
- A Resident may have multiple historical stays.
- A Resident may have at most one Active Stay at any point in time.
- Admissions create Stays, not Residents.
- Operational Checkout ends the Stay, not the Resident.
- Returning residents reuse the existing Resident record.
- Historical information shall never be lost.
- Compliance activities do not interrupt operational residency.
- The Resident Workspace remains the permanent master record throughout the lifecycle.

---

## 4.14 Summary

The Resident Lifecycle separates permanent identity from operational residency.

Residents represent people.

Stays represent periods of residency.

This distinction enables RPGMS to preserve complete operational history while maintaining a single permanent Resident record throughout the resident's relationship with the organisation.

---

# 5. Residents List Workspace

The Residents List Workspace serves as the operational entry point for Resident Management within RPGMS 2.0.

Its primary purpose is to enable operators to efficiently locate, review, filter, and manage residents while providing immediate visibility into the current operational status of the PG.

The workspace is designed for day-to-day operational use and emphasizes speed, clarity, and minimal navigation.

The Residents List Workspace manages residents.

It does not manage operational stays.

Operational activities are performed through the Resident Workspace and the Stay Workspace.

---

## 5.1 Workspace Objectives

The Residents List Workspace shall enable operators to:

- Locate residents quickly.
- Search using operational information.
- View resident status at a glance.
- Identify residents requiring attention.
- Navigate directly to the Resident Workspace.
- Initiate admission of a new resident.
- Apply operational filters.
- Support future administrative reporting.

The workspace should minimise the number of clicks required to locate and begin working with any resident.

---

## 5.2 Workspace Layout

The workspace shall be organised into the following sections:

1. Summary Cards
2. Search
3. Filters
4. Resident Listing
5. Global Actions

This layout shall remain consistent with other major workspaces within RPGMS 2.0.

---

## 5.3 Summary Cards

Summary cards provide operators with an immediate overview of resident activity.

Each summary card shall display a count and act as a quick filter.

Selecting a summary card shall automatically apply the corresponding filter to the resident list.

Suggested summary cards include:

- Total Residents
- Active Residents
- Residents On Notice
- Alumni
- Profile Completion Pending

Future cards may include:

- Compliance Pending
- Agreement Renewal Due
- Police Intimation Due
- Missing Documents

Future versions may display operational badges including:

- Agreement Renewal Due
- Police Intimation Due
- Missing Documents
- Compliance Pending

These badges shall provide immediate visibility into important operational activities without opening the Resident Workspace.

The workspace shall support adding future summary cards without redesign.

---

## 5.4 Search

Search is the primary operational tool within the Residents List Workspace.

The search bar shall remain immediately visible without requiring scrolling and shall appear before the filter controls.

Typical layout:

Summary Cards

↓

Search

↓

Filters

↓

Resident Cards

Search shall be designed around real-world operational workflows rather than technical database fields.

Operators should be able to locate a resident using whichever information is immediately available.

Search shall operate across multiple business identifiers simultaneously.

Supported search criteria include:

### Resident Identity

- Resident Code
- Resident Name

### Contact Information

- Mobile Number
- Email Address

### Resident Documents

- Document Number

### Accommodation

- Flat Number
- Bed Number

### Access Control

- Door ID

Door ID searches shall return only residents with an ACTIVE or ON_NOTICE Stay.

Residents without an active Stay shall not appear in Door ID search results.

### Registered Devices

- MAC Address

### Registered Vehicles

- Vehicle Registration Number

Search should remain responsive regardless of which identifier is entered.

---

## 5.5 Filters

Filters and Search serve different operational purposes.

Search is intended to locate a specific resident using one or more business identifiers.

Filters reduce the working set of residents based on operational criteria.

These two mechanisms complement each other and should not be considered interchangeable.

Suggested filters include:

### Operational Status

- Active
- On Notice
- Alumni

### Stay Status

- Has Active Stay
- No Active Stay

### Profile Status

- Profile Complete
- Profile Incomplete

### Compliance

- Compliance Pending
- Agreement Renewal Due
- Police Intimation Due

### Assets

- Has Registered Vehicle
- Has Registered Devices

Additional filters may be introduced as business requirements evolve.

---

## 5.6 Resident Listing

Operational Readiness Indicator

The Resident Card should clearly indicate whether the resident is operationally ready or requires attention.

This indicator enables operators to quickly identify residents needing immediate action.

Residents shall be displayed using card-based presentation during MVP.

Each card should provide sufficient operational information without requiring the workspace to be opened.

Each Resident Card should display:

- Resident Photograph
- Resident Name
- Resident Code
- Mobile Number
- Current Status
- Current Flat (if applicable)
- Current Bed (if applicable)
- Current Door ID (if applicable)
- Profile Completion Indicator

Each card shall provide a clear action to open the Resident Workspace.

---

## 5.7 Resident Card Behaviour

Selecting a Resident Card shall open the Resident Workspace.

The Resident Card itself shall remain informational.

Operational actions shall be performed within the Resident Workspace.

This keeps the Residents List focused on locating residents rather than executing business operations.

---

## 5.8 Global Actions

The Residents List Workspace shall provide global actions independent of any individual resident.

Initially this includes:

- New Admission

Future global actions may include:

- Import Residents
- Export Residents
- Bulk Operations
- Print
- Advanced Search

Global actions shall always appear in a consistent location within the workspace.

---

## 5.9 Views

The default presentation shall use Card View.

A future Table View may be introduced for administrative users.

The underlying business behaviour shall remain identical regardless of presentation.

---

## 5.10 Empty States

When no residents satisfy the selected filters or search criteria, the workspace shall present a clear and informative empty state.

The interface should guide operators to:

- Clear filters.
- Modify search criteria.
- Create a new resident where appropriate.

Empty states shall never leave operators uncertain about why no results are displayed.

---

## 5.11 Navigation

The Residents List Workspace is the primary entry point into Resident Management.

Typical navigation flow:

Dashboard

↓

Residents List

↓

Resident Workspace

↓

Stay Workspace

Navigation shall remain consistent throughout RPGMS 2.0.

---

## 5.12 Business Rules

The following rules govern the Residents List Workspace:

- The workspace lists Residents, not Stays.
- Search shall support operational identifiers.
- Door ID search shall return only ACTIVE and ON_NOTICE residents.
- Summary Cards shall function as quick filters.
- The Resident Card shall remain informational.
- Operational changes shall occur within the Resident Workspace.
- The workspace shall remain consistent with the navigation philosophy of RPGMS 2.0.
- Future enhancements shall preserve the separation between Resident and Stay responsibilities.

---

## 5.13 Summary

The Residents List Workspace provides the operational gateway into Resident Management.

It enables operators to quickly locate residents, understand their current operational status, and navigate into the Resident Workspace while preserving the architectural separation between Resident, Stay, Accommodation, and Finance domains.

Its design emphasises operational efficiency, consistency, and long-term scalability.

## 5.14 Sorting

The workspace shall support multiple sort orders.

Suggested sorting options include:

- Resident Name
- Resident Code
- Joining Date
- Recently Updated
- Agreement Renewal Due
- Police Intimation Due
- Profile Completion
- Operational Readiness

Additional sorting options may be introduced as operational requirements evolve.

# 6. Resident Workspace

The Resident Workspace is the primary operational workspace for managing an individual resident within RPGMS 2.0.

It serves as the permanent master record of the resident while providing immediate visibility into the resident's current operational status through information projected from the Stay domain.

The workspace is intentionally designed as a business workspace rather than a traditional data entry form.

Its purpose is to help operators efficiently manage resident information throughout the resident's entire relationship with the PG.

---

## 6.1 Workspace Objectives

The Resident Workspace shall enable operators to:

- View the complete resident profile.
- Review the current operational Stay.
- Perform resident-related actions.
- Monitor operational readiness.
- Monitor compliance status.
- Progressively complete resident information.
- Navigate seamlessly to operational workspaces.
- Preserve complete historical information.

The workspace should minimise navigation while maintaining clear separation between Resident, Stay, Accommodation and Finance responsibilities.

---

## 6.2 Workspace Design Philosophy

The Resident Workspace is designed around the following principles:

- Resident information is permanent.
- Operational information is projected.
- Sections are independently manageable.
- Editing is section-based.
- Historical information is preserved.
- The workspace assists operators rather than functioning as a large form.
- Business information is organised according to operational workflows.

---

## 6.3 Workspace Layout

The Resident Workspace shall be organised into the following major sections.

1. Resident Header

2. Quick Actions

3. Current Stay Summary

4. Workspace Alerts

5. Operational Readiness

6. Profile Completion

7. Resident Information Sections

8. Navigation to Related Workspaces

The layout should remain consistent across desktop and future mobile implementations.

---

## 6.4 Resident Header

The Resident Header provides immediate identification of the resident.

It should display:

- Resident Photograph
- Resident Name
- Resident Code
- Current Status
- Current Flat (if applicable)
- Current Bed (if applicable)
- Current Door ID (if applicable)

The header should remain visible while navigating through the workspace wherever practical.

Operational information displayed in the header originates from the active Stay Projection.

---

## 6.5 Quick Actions

Quick Actions provide shortcuts to the most frequently performed operational activities.

Quick Actions should remain context-sensitive.

Typical actions include:

- Open Stay Workspace
- Edit Personal Information
- Add Document
- Add Emergency Contact
- Register Device
- Register Vehicle
- Record Compliance Activity
- View Timeline

Future actions may include:

- Print Resident Summary
- Send WhatsApp
- Email Resident
- Generate Compliance Report

Quick Actions should never bypass business rules defined within the owning domain.

---

## 6.6 Current Stay Summary

The Current Stay Summary provides a read-only operational snapshot of the resident's active Stay.

The summary exists for operational convenience.

It does not own any operational information.

The Current Stay Summary should display:

### Operational Status

- Stay Status
- Notice Status

### Accommodation

- Area
- Flat
- Bed
- Door ID

### Commercial

- Monthly Rent
- Security Deposit

### Dates

- Joining Date
- Notice Date
- Expected Checkout Date
- Actual Checkout Date (when applicable)

All information displayed within the Current Stay Summary shall originate directly from the Stay Projection.

Updates to this information shall only occur through the Stay Workspace.

---

## 6.7 Workspace Alerts

The Resident Workspace should proactively inform operators of important operational issues.

Examples include:

- Agreement Renewal Due
- Police Intimation Pending
- Missing Identity Document
- Missing Emergency Contact
- Compliance Pending
- Missing Photograph

Workspace Alerts are informational.

They highlight operational attention items without preventing normal workflow unless required by business rules.

---

## 6.8 Operational Readiness

Operational Readiness indicates whether the resident currently satisfies the operational requirements necessary to continue residing within the PG.

Operational Readiness is distinct from Profile Completion.

Typical indicators include:

- Identity Available
- Active Stay Present
- Door ID Assigned
- Mandatory Compliance Completed

The workspace should clearly indicate whether the resident is:

- Operationally Ready
- Requires Attention

Operational Readiness should always reflect the current operational state rather than historical information.

---

## 6.9 Profile Completion

Profile Completion measures the completeness of the Resident master record.

Examples of information contributing to Profile Completion include:

- Personal Information
- Contact Information
- Address
- Photograph
- Documents
- Emergency Contacts
- Devices
- Vehicles
- Medical Information

Profile Completion is intended to encourage progressive completion rather than enforce mandatory data entry.

The percentage should never prevent operational activities once admission requirements have been satisfied.

Personal Information            ✅ Complete

Contact Information             ✅ Complete

Permanent Address               ⚠ Missing PIN Code

Resident Documents              ⚠ Aadhaar Missing

Emergency Contacts              ⚠ No Contact Added

Registered Devices              ℹ None Registered

Registered Vehicles             ℹ None Registered

Medical Information             Optional

---

## 6.10 Navigation

The Resident Workspace acts as the bridge between permanent resident information and operational residency.

Typical navigation:

Dashboard

↓

Residents List

↓

Resident Workspace

↓

Stay Workspace

Additional navigation may include:

- Reservation (where applicable)
- Accommodation
- Finance

Navigation should remain intuitive and minimise unnecessary workspace switching.

---

## 6.11 Business Rules

The Resident Workspace shall follow these principles:

- The Resident Workspace owns resident information only.
- Operational information is displayed through projections.
- Editing shall occur at section level.
- Quick Actions shall respect domain boundaries.
- Profile Completion shall never delay admission.
- Operational Readiness shall remain independent of Profile Completion.
- Historical information shall remain preserved.
- Future enhancements shall maintain this architectural separation.

---

## 6.12 Summary

The Resident Workspace serves as the permanent operational home of every resident within RPGMS 2.0.

It combines permanent resident information with operational visibility while preserving clear ownership boundaries between Resident, Stay, Accommodation, Finance, Reservations and Compliance.

The workspace is designed to maximise operational efficiency while supporting long-term resident management.

---

## 6.13 Resident Information Sections

Resident information shall be organised into independent business sections.

Each section represents a logical business area and shall be managed independently.

The Resident Workspace shall remain primarily read-oriented.

Editing should occur at the section level without requiring operators to edit the entire resident profile simultaneously.

Each section shall support independent viewing, editing, and future enhancement.

---

## 6.14 Personal Information

The Personal Information section identifies the resident.

Typical information includes:

- Full Name
- Photograph
- Gender
- Date of Birth
- Occupation

This section represents the permanent identity of the resident.

Changes to this section should be infrequent.

---

## 6.15 Contact Information

The Contact Information section records the primary communication channels for the resident.

Typical information includes:

- Mobile Number
- Email Address

Future versions may support:

- Alternate Mobile Numbers
- WhatsApp Number
- Preferred Communication Method

---

## 6.16 Permanent Address

The Permanent Address section records the resident's permanent place of residence.

Typical information includes:

- Address
- City / District
- State
- PIN Code

Future versions may support:

- Country
- Location Verification
- Google Maps Integration

---

## 6.17 Resident Documents

Resident Documents maintain all documents associated with the resident.

This section supports multiple document categories including:

- Identity Documents
- Education Documents
- Employment Documents
- Compliance Documents
- Financial Documents
- Other Supporting Documents

The Resident Workspace shall support an unlimited number of documents.

Each document shall maintain its own metadata and historical record.

Document management is specified separately within Chapter 9.

---

## 6.18 Emergency / Reference Contacts

Emergency Contacts provide important contact information for operational use.

Each contact shall contain:

- Name
- Relationship
- Phone Number

The system shall support multiple emergency or reference contacts.

The workspace shall not assume predefined relationships such as Father or Mother.

Relationship values shall be operator-defined.

---

## 6.19 Registered Devices

The Registered Devices section records devices authorised for use within the PG.

Typical information includes:

- Device Name
- Device Type
- MAC Address

Examples include:

- Mobile Phone
- Laptop
- Tablet
- Desktop Computer

Multiple registered devices shall be supported.

---

## 6.20 Registered Vehicles

The Registered Vehicles section records vehicles belonging to the resident.

Typical information includes:

- Vehicle Type
- Registration Number

The Resident Workspace shall support multiple registered vehicles.

Vehicle ownership remains part of the resident profile regardless of the current Stay.

---

## 6.21 Medical Information

Medical Information records optional health-related information that may assist hostel management during emergencies.

Typical information includes:

- Blood Group
- Allergies
- Medical Notes

Medical Information is optional and shall not prevent admission or operational readiness.

---

## 6.22 System Information

System Information provides read-only administrative details.

Typical information includes:

- Resident Code
- Created On
- Last Updated
- Number of Historical Stays (Future)

System Information shall not be editable by operators.

---

## 6.23 Section Editing Philosophy

The Resident Workspace shall support section-level editing.

Each information section should provide its own independent Edit action.

Operators should never be required to edit the complete resident profile within a single large form.

Benefits include:

- Reduced cognitive load.
- Faster updates.
- Improved validation.
- Better scalability.
- Future role-based permissions.
- Easier maintenance.

The workspace therefore behaves as a collection of independently manageable business components.

---

## 6.24 Collapsible Sections

Detailed information sections should support expand and collapse behaviour.

Examples include:

- Personal Information
- Contact Information
- Permanent Address
- Resident Documents
- Emergency Contacts
- Registered Devices
- Registered Vehicles
- Medical Information
- System Information

Operational sections including:

- Current Stay Summary
- Workspace Alerts
- Operational Readiness
- Profile Completion

shall remain expanded by default.

The system should remember the operator's preferred section state where practical.

---

## 6.25 Business Rules

The Resident Information sections shall follow these principles:

- Every section owns a clearly defined business responsibility.
- Editing shall occur independently for each section.
- Repeatable collections shall support unlimited entries.
- Resident information remains independent of operational Stay information.
- Historical information shall be preserved wherever practical.
- The Resident Workspace remains primarily read-oriented.
- Future sections may be added without redesigning the workspace.

---

## 6.26 Summary

The Resident Workspace is designed as a collection of independently managed business sections rather than a traditional profile form.

This approach supports progressive profile completion, simplifies day-to-day operations, improves long-term maintainability, and remains fully aligned with the architectural principles of RPGMS 2.0.

---

# 7. Standard Admission Workspace

The Admission Workspace provides the single, standard workflow for admitting a resident into the PG.

Regardless of how admission is initiated, the same business process, validation rules, and operational workflow shall be followed.

The Admission Workspace is intentionally designed to support rapid onboarding while collecting only the information required to establish operational residency.

Additional resident information shall be completed progressively through the Resident Workspace after admission.

---

## 7.1 Admission Philosophy

Admission is an operational workflow rather than a data collection exercise.

The primary objective of admission is to establish a legally and operationally valid Stay for the resident.

The admission process should therefore remain simple, efficient, and focused on the information required for immediate occupancy.

Additional information shall be collected progressively throughout the resident's stay.

---

## 7.2 Single Admission Workflow

RPGMS shall provide a single Admission Workspace shared across all entry points.

Admission may originate from:

- Reservation
- Walk-in Admission
- Existing Resident (Returning Resident)
- Future Online Admission

Although different entry points may pre-populate information, all admissions shall ultimately follow the same workflow.

There shall never be multiple independent admission forms.

---

## 7.3 Admission Entry Points

The Admission Workspace may be launched from:

- Reservations Workspace
- Residents Workspace
- Accommodation Workspace
- Dashboard (Future)
- Quick Actions (Future)

The entry point determines which information is pre-populated but does not change the admission workflow.

---

## 7.4 Admission Process

The standard admission process shall consist of the following steps:

### Step 1 – Identify the Person

The system shall determine whether the person already exists as a Resident.

If an existing Resident is found:

- Reuse the existing Resident.

If no Resident exists:

- Create a new Resident.

Duplicate Resident records shall never be created.

---

### Step 2 – Create the Stay

Admission creates a new Stay for the Resident.

The Stay establishes the operational relationship between the resident and the PG.

---

### Step 3 – Allocate Accommodation

The operator shall select:

- Area
- Flat
- Bed

The selected bed becomes occupied by the newly created Stay.

### Door ID Assignment

Door ID assignment is not part of the Admission process.

Admission establishes operational residency.

Door ID assignment establishes physical access control and remains the responsibility of the Accommodation domain.

Where a Door ID is not immediately available, admission shall continue without interruption.

Door IDs may be assigned immediately after admission or at a later time through the appropriate operational workflow.

---

### Step 4 – Establish Commercial Terms

The operator shall specify:

- Monthly Rent
- Security Deposit

These values establish the initial Commercial Agreement.

---

### Step 5 – Complete Admission

Admission shall:

- Create or reuse the Resident.
- Create the Stay.
- Allocate accommodation.
- Establish the Commercial Agreement.
- Generate admission business events.
- Open the Resident Workspace.

---

### Step 6 - Security Deposit

The Admission Workspace establishes the agreed Security Deposit as part of the initial Commercial Agreement.

Admission does not record financial transactions relating to the deposit.

Activities including:

- Deposit Collection
- Partial Deposit Collection
- Payment Mode
- Receipt Generation
- Ledger Entries
- Outstanding Deposit Tracking

remain the exclusive responsibility of the Finance domain.

This separation preserves clear ownership boundaries between Admission, Stay and Finance.

--- 

## 7.5 Minimum Operational Admission Dataset

The following information represents the minimum dataset required for admission.

### Resident

- Full Name
- Mobile Number

### Identity

- Document Type
- Document Number

When "Other" is selected as the Document Type, the operator shall provide a custom document type.

### Stay

- Joining Date
- Area
- Flat
- Bed

### Commercial

- Monthly Rent
- Security Deposit

This dataset is intentionally minimal.

All remaining information shall be completed progressively.

---

## 7.6 Progressive Completion

Admission shall never require complete resident information.

Information including:

- Permanent Address
- Emergency Contacts
- Registered Devices
- Registered Vehicles
- Medical Information
- Additional Documents
- Compliance Records

may be completed after admission through the Resident Workspace.

This philosophy minimises delays while encouraging gradual profile enrichment.

Resident Photograph is recommended but not mandatory during admission.

Where available, the photograph may be captured during admission.

Where unavailable, admission shall proceed normally.

The Resident Workspace shall subsequently identify the missing photograph through Workspace Alerts and Profile Completion indicators.

---

## 7.7 Validation Rules

The Admission Workspace shall validate:

- Mandatory fields are completed.
- Selected bed is available.
- Commercial values are valid.
- Joining Date is valid.
- Resident duplication is prevented.

Validation should prevent invalid admissions while avoiding unnecessary data entry requirements.

---

## 7.8 Completion

Upon successful admission:

- Resident record exists.
- Active Stay exists.
- Bed is occupied.
- Commercial Agreement exists.
- Current Stay Summary becomes available.
- Resident Workspace opens automatically.

Admission is therefore considered the transition from a prospective occupant to an operational resident.

---

## 7.9 Admission Completion Workflow

Upon successful admission the system shall:

- Create or reuse the Resident.
- Create the Stay.
- Allocate Accommodation.
- Establish the initial Commercial Agreement.
- Generate admission business events.

The Admission Workspace should then guide the operator towards the Resident Workspace for progressive profile completion.

Future implementations may optionally present an Admission Complete confirmation page offering actions such as:

- Open Resident Workspace
- Assign Door ID
- Print Admission Summary

The Resident Workspace becomes the primary workspace immediately after admission.

## 7.10 Business Rules

The following principles govern Admission:

- Admission creates a Stay.
- Admission creates a Resident only when one does not already exist.
- Returning residents reuse the existing Resident.
- Admission follows one standard workflow.
- Admission collects only the minimum operational dataset.
- Additional information is collected progressively.
- Duplicate Residents shall never be created.
- Admission shall immediately establish operational residency.
- Admission establishes commercial terms but does not perform financial transactions.
- Door ID assignment is independent of Admission.
- Resident Photograph is recommended but shall never delay admission.
  
---

## 7.11 Summary

The Admission Workspace establishes the operational relationship between the resident and the PG.

It provides a single, consistent workflow regardless of how admission is initiated while preserving the principles of Minimal Onboarding, Progressive Profile Completion, and clear domain ownership.

The Admission Workspace forms the bridge between the Resident domain and the Stay domain.

---

# 8. Resident Information Architecture

The Resident Information Architecture defines how resident information is organised within RPGMS 2.0.

Rather than grouping information according to database tables or user interface components, information is organised into logical business sections based on ownership and operational purpose.

Each section represents a distinct business responsibility and forms an independent component within the Resident Workspace.

This architecture supports progressive profile completion, long-term maintainability, and future scalability while preserving clear ownership boundaries.

---

## 8.1 Information Architecture Principles

The Resident Information Architecture is governed by the following principles:

- Information shall be organised according to business purpose.
- Every piece of information shall have a single owner.
- Repeatable information shall support unlimited entries.
- Operational information shall be displayed through projections rather than duplicated.
- Historical information shall be preserved wherever practical.
- Future information categories shall be added without redesigning the overall architecture.

---

## 8.2 Personal Information

The Personal Information section records the permanent identity of the resident.

Typical information includes:

- Full Name
- Photograph
- Gender
- Date of Birth
- Occupation

This information changes infrequently and forms the foundation of the Resident profile.

---

## 8.3 Contact Information

The Contact Information section records the resident's primary communication details.

Typical information includes:

- Mobile Number
- Email Address

Future enhancements may include:

- Alternate Mobile Numbers
- WhatsApp Number
- Preferred Communication Method

---

## 8.4 Permanent Address

The Permanent Address section records the resident's permanent residential address.

Typical information includes:

- Address
- City / District
- State
- PIN Code

Future versions may support additional geographical information where required.

---

## 8.5 Resident Documents

The Resident Documents section stores documents associated with the resident.

Document categories include:

- Identity
- Education
- Employment
- Compliance
- Financial
- Other

Each document maintains its own metadata and lifecycle.

The Resident Workspace shall support an unlimited number of documents.

Detailed document management is defined separately in Chapter 9.

---

### 8.5.1 Relationship between Documents and Compliance

Resident Documents store the documentary evidence associated with the resident. Compliance Records reference or validate those documents as part of operational compliance activities. A document may exist without creating a Compliance Record, and a Compliance Record may reference one or more supporting documents. This separation preserves clear business responsibilities while avoiding duplication.

---

## 8.6 Emergency / Reference Contacts

Emergency and Reference Contacts provide important operational contact information.

Each contact shall contain:

- Name
- Relationship
- Phone Number

The system shall support multiple contacts.

Relationship values shall not be restricted to predefined family relationships.

---

## 8.7 Registered Devices

The Registered Devices section records devices belonging to the resident.

Each registered device shall contain:

- Device Name
- Device Type
- MAC Address

The architecture shall support multiple registered devices.

Future enhancements may include additional device attributes.

---

## 8.8 Registered Vehicles

The Registered Vehicles section records vehicles associated with the resident.

Each vehicle shall contain:

- Vehicle Type
- Registration Number

The architecture shall support multiple registered vehicles.

Future enhancements may include vehicle ownership documentation.

---

## 8.9 Medical Information

Medical Information records optional health-related information that may assist hostel management during emergencies.

Typical information includes:

- Blood Group
- Allergies
- Medical Notes

Medical Information remains optional and shall never prevent admission or operational residency.

---

## 8.10 Current Stay Projection

The Current Stay Projection provides operational visibility within the Resident Workspace.

Typical information displayed includes:

- Stay Status
- Flat
- Bed
- Door ID
- Monthly Rent
- Security Deposit
- Joining Date
- Notice Status
- Notice Date
- Expected Checkout Date
- Actual Checkout Date

The Current Stay Projection is read-only.

Its information originates from the Stay domain and shall never be duplicated within the Resident aggregate.

---

## 8.11 System Information

System Information provides administrative details relating to the Resident record.

Typical information includes:

- Resident Code
- Created On
- Last Updated
- Number of Historical Stays (Future)

System Information is read-only.

---

## 8.12 Section Independence

Each information section represents an independent business component.

Sections shall be capable of evolving independently without impacting unrelated sections.

Examples include:

- Adding new document categories.
- Introducing additional medical information.
- Supporting future compliance information.
- Extending registered device details.

The architecture shall encourage modular growth rather than redesign.

---

## 8.13 Future Expansion

The Resident Information Architecture has been intentionally designed to accommodate future business requirements.

Examples include:

- Passport Information
- Visa Information
- Employer Details
- Guardian Information
- Digital Identity Verification
- OCR
- Document Expiry Tracking
- Digital Signatures

Future enhancements shall extend the existing architecture rather than replacing it.

---

## 8.14 Business Rules

The Resident Information Architecture shall comply with the following principles:

- Resident information is permanent.
- Information shall be organised according to business responsibility.
- Operational information is displayed through projections.
- Repeatable collections support unlimited entries.
- Historical information shall be preserved wherever practical.
- New information categories shall integrate without redesign.
- Information ownership shall remain consistent with the Domain Ownership model.

---

## 8.15 Summary

The Resident Information Architecture provides a scalable and business-oriented framework for organising resident information.

By separating permanent resident information from operational projections and organising data into logical business sections, the architecture supports long-term maintainability, progressive profile completion, and future business growth while remaining fully aligned with the architectural principles of RPGMS 2.0.

---

# 9. Resident Documents

Resident Documents provide the documentary evidence associated with a Resident throughout the resident's relationship with the PG.

The purpose of the Resident Documents subsystem is to maintain organised, searchable and historically preserved documentary records while remaining independent from operational workflows.

Documents represent supporting evidence.

They do not represent operational business activities.

Business activities such as Police Intimation, Agreement Renewal or Identity Verification are managed separately through the Compliance subsystem.

---

## 9.1 Document Philosophy

Resident Documents exist to preserve documentary evidence.

Each document belongs to the Resident rather than to a particular Stay.

Documents may continue to remain relevant across multiple Stays.

The Resident Documents subsystem therefore forms part of the permanent Resident record.

---

## 9.2 Document Categories

Documents shall be organised into logical business categories.

Standard categories include:

### Identity

Examples:

- Aadhaar Card
- Passport
- Driving Licence
- Voter ID
- PAN Card

---

### Education

Examples:

- College Identity Card
- Admission Letter
- Bonafide Certificate

---

### Employment

Examples:

- Company Identity Card
- Employment Letter
- Offer Letter
- Salary Slip

---

### Compliance

Examples:

- Police Intimation
- Police Verification
- Rent Agreement
- Local Authority Documents

---

### Financial

Examples:

- Cancelled Cheque
- Bank Passbook
- Other Financial Documents

---

### Other

The system shall support additional document categories as business requirements evolve.

---

## 9.2.1 Document Types

Each Document Category shall define one or more standard Document Types.

Examples include:

### Identity

- Aadhaar Card
- Passport
- Driving Licence
- Voter ID
- PAN Card
- Other

### Education

- College Identity Card
- Bonafide Certificate
- Admission Letter
- Other

### Employment

- Company Identity Card
- Employment Letter
- Offer Letter
- Salary Slip
- Other

### Compliance

- Police Intimation
- Police Verification
- Rent Agreement
- Other

### Financial

- Cancelled Cheque
- Bank Passbook
- Other

Where the operator selects **Other**, the system shall allow entry of a custom Document Type.

This approach provides standardisation while allowing flexibility for future document types.

---

## 9.3 Document Information

Each document shall maintain its own information.

Typical information includes:

- Document Category
- Document Type
- Document Number
- Issue Date (Where Applicable)
- Expiry Date (Where Applicable)
- Remarks

Future versions may support:

- Issuing Authority
- Verification Status
- Digital Signature

---

## 9.3.1 Document Number

Document Numbers shall be recorded where applicable.

The requirement for a Document Number depends upon the selected Document Type.

Examples:

| Document Type | Document Number |
|---------------|-----------------|
| Aadhaar Card | Required |
| Passport | Required |
| PAN Card | Required |
| Driving Licence | Required |
| Voter ID | Required |
| College Identity Card | Optional |
| Company Identity Card | Optional |
| Employment Letter | Not Applicable |
| Police Intimation | Not Applicable |
| Photograph | Not Applicable |

The system shall require a Document Number only where it is meaningful for the selected Document Type.

This avoids forcing operators to enter unnecessary information while maintaining accurate document records.

---

## 9.4 Document Files

Future versions of RPGMS may support uploading scanned copies of documents.

Examples include:

- PDF
- JPG
- PNG

The Resident record shall remain independent from the physical storage mechanism.

Document metadata and document files should remain logically separated.

---

## 9.5 Multiple Documents

The Resident Workspace shall support multiple documents.

Examples include:

- Multiple Identity Documents
- Multiple Employment Documents
- Multiple Compliance Documents

The architecture shall impose no practical limit on document quantity.

---

## 9.6 Document History

Documents represent historical business evidence.

Wherever practical:

- Previous documents shall be preserved.
- Updated documents should not overwrite historical records.
- Significant document changes should remain auditable.

---

## 9.7 Relationship with Compliance

Resident Documents and Compliance Records represent different business concepts.

Resident Documents store documentary evidence.

Compliance Records store business activities.

Examples:

Police Intimation PDF

↓

Resident Document

Police Intimation Submitted

↓

Compliance Record

Agreement PDF

↓

Resident Document

Agreement Renewal Completed

↓

Compliance Record

This separation preserves clear business ownership.

---

## 9.8 Search

Resident Documents shall support searching using:

- Document Category
- Document Type
- Document Number

Future enhancements may include:

- OCR
- Full Text Search
- Expiry Date Search

---

## 9.9 Future Enhancements

Future capabilities may include:

- OCR
- AI-assisted document classification
- Automatic expiry reminders
- Digital verification
- QR code validation
- Cloud document storage

These enhancements shall extend the existing architecture without altering business ownership.

---

## 9.10 Business Rules

The Resident Documents subsystem shall comply with the following principles:

- Documents belong to the Resident.
- Documents are documentary evidence.
- Documents do not represent business activities.
- Compliance records remain separate.
- Multiple documents shall be supported.
- Historical documents shall be preserved.
- New document categories shall integrate without redesign.

---

## 9.11 Summary

The Resident Documents subsystem provides a permanent repository for documentary evidence associated with a Resident.

By separating documentary evidence from operational business activities, RPGMS maintains clear ownership boundaries while supporting long-term auditability, compliance and future scalability.

---

# 10. Compliance Management

The Compliance Management subsystem records, monitors and preserves regulatory and administrative compliance activities performed throughout a resident's relationship with the PG.

Compliance activities exist independently of the Resident profile and the operational Stay.

They represent business activities carried out to satisfy legal, regulatory or organisational requirements.

The Compliance subsystem provides complete historical visibility while ensuring that compliance activities do not interfere with normal operational residency.

---

## 10.1 Compliance Philosophy

Compliance is a continuous operational responsibility.

It is not limited to the admission process.

Compliance activities may occur at any point during a resident's Stay.

Examples include:

- Police Intimation
- Police Verification
- Agreement Renewal
- Future statutory requirements

Compliance activities shall be recorded independently while preserving the continuity of the resident's operational Stay.

---

## 10.2 Compliance Principles

The Compliance subsystem shall follow these principles:

- Compliance activities are independent business events.
- Compliance does not terminate or recreate a Stay.
- Compliance records are append-only.
- Compliance history shall be permanently preserved.
- Compliance may reference supporting documents.
- Compliance shall remain independent of document storage.

---

## 10.3 Compliance Types

The architecture shall support multiple compliance activities.

Examples include:

### Police Intimation

Submission of mandatory police information.

---

### Police Verification

Completion of police verification requirements.

---

### Agreement Renewal

Renewal of the resident's agreement after the applicable operational period.

---

### Future Compliance Activities

Examples may include:

- Local Authority Requirements
- Government Notifications
- Internal Administrative Compliance

The architecture shall support additional compliance types without redesign.

---

## 10.4 Compliance Record

Each completed compliance activity creates a new immutable Compliance Record.

Typical information includes:

- Compliance Type
- Completed On
- Valid Until
- Supporting Document (Optional)
- Remarks

Future versions may include:

- Completed By
- Verification Status
- External Reference Number

Compliance Records shall never overwrite previous records.

---

## 10.4.1 Compliance Status

Each Compliance Record shall expose an operational status representing its current validity.

Compliance Status is derived from the Compliance Record dates and applicable business policies.

Typical statuses include:

- Pending
- Valid
- Due Soon
- Overdue

Compliance Status provides operational visibility while avoiding duplication of business information.

Status shall be derived dynamically wherever practical rather than maintained as independent data.

The Resident Workspace may use Compliance Status to generate alerts, highlight upcoming renewals, and assist operators in prioritising compliance activities.


## 10.5 Agreement Renewal

Agreement Renewal represents an administrative renewal of the resident's occupancy agreement.

Agreement Renewal:

- does not create a new Resident,
- does not create a new Stay,
- does not perform operational checkout,
- does not create a new Commercial Agreement unless commercial terms change.

Agreement Renewal represents continuation of the existing Stay.

Each completed renewal creates a new Compliance Record.

The next renewal period shall be calculated from the completed renewal date in accordance with applicable business policy.

---

### Agreement Renewal Policy

The timing of Agreement Renewal is determined by the business policy of the organisation.

For Ritu PG Services, Agreement Renewal is normally due eleven (11) months after:

- the original Admission Date, where no previous renewal exists, or
- the most recently completed Agreement Renewal.

This policy represents a business rule rather than a software limitation.

The architecture shall support modification of this policy should business requirements change in the future.

---

## 10.6 Police Intimation

Police Intimation represents the recording of police compliance activities.

Each completed Police Intimation creates a new Compliance Record.

Supporting documents may be attached through the Resident Documents subsystem.

Police Intimation history shall remain permanently available.

---

## 10.7 Compliance Lifecycle

Compliance activities follow a simple lifecycle.

```text
Due

↓

Completed

↓

Valid

↓

Renewal Due

↓

Completed

↓

Valid

↓

...
```

Each completion generates a new immutable Compliance Record.

---

## 10.8 Compliance Alerts

The Resident Workspace should proactively notify operators of important compliance events.

Examples include:

- Agreement Renewal Due
- Police Intimation Due
- Compliance Expired
- Compliance Pending

Alerts assist operators but do not replace Compliance Records.

---

## 10.8.1 Compliance Summary

The Resident Workspace should provide a high-level Compliance Summary giving operators immediate visibility into the resident's current compliance position.

Typical information may include:

- Agreement Status
- Agreement Valid Until
- Police Intimation Status
- Police Intimation Valid Until
- Overall Compliance Status

The Compliance Summary provides operational visibility only.

It does not replace the detailed Compliance Records maintained by the Compliance subsystem.

Future versions may expand the Compliance Summary as additional compliance activities are introduced.

---

## 10.9 Relationship with Resident Documents

Resident Documents store documentary evidence.

Compliance Records store completed business activities.

A Compliance Record may reference one or more Resident Documents.

Updating a document does not automatically complete a Compliance activity.

Similarly, completing a Compliance activity does not replace or modify the associated document.

This separation preserves clear ownership boundaries.

---

## 10.10 Compliance History

Compliance history shall remain permanently preserved.

Historical Compliance Records shall not be overwritten or deleted.

The Resident Workspace should provide access to historical compliance information whenever required.

---

## 10.11 Business Rules

The Compliance subsystem shall comply with the following principles:

- Compliance activities are independent of the Stay lifecycle.
- Compliance activities create immutable Compliance Records.
- Compliance Records are append-only.
- Supporting documents remain within the Resident Documents subsystem.
- Agreement Renewal continues the existing Stay.
- Police Intimation creates a Compliance Record.
- Compliance history shall never be lost.
- Future compliance activities shall integrate without redesign.
- Compliance Status shall be derived from Compliance Records rather than maintained independently.
- Compliance Summary provides operational visibility and does not replace Compliance Records.

---

## 10.12 Summary

The Compliance Management subsystem provides a scalable and auditable framework for managing regulatory and administrative obligations throughout a resident's operational lifecycle.

By separating compliance activities from both Resident Documents and the Stay lifecycle, RPGMS preserves clear business ownership while supporting future operational growth and regulatory requirements.

---

# 11. Search Strategy

The Search Strategy defines how operators locate residents and operational information within RPGMS 2.0.

Search is designed around real operational workflows rather than database structure or field ownership.

Operators should be able to locate a resident using whatever information is immediately available without first determining which module owns that information.

The objective of the Search Strategy is to minimise search time while maintaining clear architectural boundaries between business domains.

---

## 11.1 Search Philosophy

Search is an operational tool.

Operators search using available information rather than database knowledge.

Examples include:

- Resident Name
- Mobile Number
- Door ID
- Flat Number
- Bed Number
- Vehicle Registration Number
- MAC Address
- Government Document Number

The system shall determine where to search and present the appropriate results.

Search should therefore feel natural and require minimal training.

---

## 11.2 Three-Level Search Model

The Search Strategy consists of three complementary levels.

### Level 1 — Universal Search

Universal Search provides rapid day-to-day resident lookup.

This is the primary search mechanism used by operators.

---

### Level 2 — Operational Filters

Operational Filters reduce the working set of residents based on operational conditions.

---

### Level 3 — Advanced Search

Advanced Search supports administrative queries and reporting.

These three mechanisms serve different operational purposes while remaining fully integrated.

---

## 11.3 Universal Search

Universal Search accepts a single search input.

The operator should simply enter the available information.

The system determines the appropriate search behaviour.

Typical searchable identifiers include:

### Resident Identity

- Resident Code
- Resident Name

### Contact

- Mobile Number
- Email Address

### Accommodation

- Area
- Flat Number
- Bed Number

### Access Control

- Door ID

Door ID searches shall return only residents with an ACTIVE or ON_NOTICE Stay.

Residents without an active Stay shall not appear in Door ID search results.

### Documents

- Document Number

### Registered Devices

- MAC Address

### Registered Vehicles

- Vehicle Registration Number

Future searchable identifiers may be introduced without redesign.

---

## 11.3.1 Search Suggestions

Future versions of RPGMS may provide intelligent search suggestions while the operator is typing.

Search suggestions should assist operators by presenting likely matches before the search is completed.

Examples include:

- Resident Name
- Resident Code
- Door ID
- Mobile Number
- Flat Number

Search suggestions are intended to improve operational efficiency while reducing typing and search errors.

Suggestions shall not alter the underlying Search Strategy or business rules.

---

## 11.3.2 Recent Searches

Future versions may maintain a short list of recently searched residents for each operator.

Recent Searches are intended to support day-to-day operational workflows where the same residents may be accessed repeatedly within a short period.

Typical information may include:

- Resident Name
- Resident Code
- Last Search Time

Recent Searches provide operational convenience only and shall not be considered part of the permanent Resident record.

---

## 11.4 Operational Filters

Filters reduce the number of visible residents.

Filters are intended for operational workflows rather than locating a single resident.

Examples include:

### Operational Status

- Active
- On Notice
- Alumni

### Profile Status

- Complete
- Incomplete

### Compliance

- Agreement Renewal Due
- Police Intimation Due
- Compliance Pending

### Assets

- Has Vehicle
- Has Registered Devices

### Operational Attention

- Missing Photograph
- Missing Emergency Contact
- Missing Identity Document
- No Door ID Assigned

Multiple filters may be applied simultaneously.

---

## 11.5 Advanced Search

Advanced Search supports administrative and management activities.

Examples include:

- Joined Between Dates
- Occupation
- City
- State
- Agreement Renewal Date
- Police Intimation Date
- Compliance Status
- Profile Completion Percentage

Advanced Search may continue to evolve as reporting requirements expand.

---

## 11.6 Search Ranking

Where multiple matches exist, results should be presented according to operational relevance.

Suggested priority:

1. Exact Resident Code
2. Exact Door ID
3. Exact Mobile Number
4. Exact Document Number
5. Exact Vehicle Registration
6. Exact MAC Address
7. Exact Resident Name
8. Partial Matches

Ranking should prioritise the information most likely intended by the operator.

Where multiple exact matches exist, the system should prioritise currently active operational records before historical records wherever appropriate.

This behaviour improves day-to-day operational efficiency while preserving access to historical information.

---

## 11.7 Search Results

Search results should present sufficient operational information without requiring immediate navigation.

Typical information includes:

- Resident Name
- Resident Code
- Current Status
- Flat
- Bed
- Door ID
- Mobile Number

Operators should be able to open the Resident Workspace directly from the search results.

---

## 11.8 Search Performance

Search should provide results rapidly and support everyday operational use.

Search should remain responsive regardless of the identifier entered.

Future implementations may support incremental search and search suggestions.

---

## 11.8.1 Consistent Search Experience

The Universal Search behaviour shall remain consistent wherever resident lookup is required throughout RPGMS.

Modules including:

- Residents
- Reservations
- Accommodation
- Stay Workspace
- Finance

should provide the same search experience and support the same operational identifiers wherever practical.

This consistency reduces operator training requirements and improves usability across the application.

---

## 11.8.2 Read-Only Operation

Search is a read-only operation.

Search retrieves and presents information without modifying business data or triggering operational workflows.

Any subsequent business activity shall be initiated explicitly by the operator after selecting the appropriate search result.

This separation preserves clear boundaries between information retrieval and business operations.

---

## 11.9 Business Rules

The Search Strategy shall comply with the following principles:

- Search shall be based on operational workflows.
- Operators search using available information.
- Search shall remain independent of domain ownership.
- Filters reduce the working set.
- Universal Search locates individual residents.
- Advanced Search supports administration.
- Door ID search shall exclude residents without an ACTIVE or ON_NOTICE Stay.
- Future searchable identifiers shall integrate without redesign.
- Universal Search shall provide a consistent experience across RPGMS.
- Search shall remain a read-only operation.
- Search suggestions and Recent Searches are operational convenience features and shall not alter search results or business rules.
- Search ranking should prioritise active operational records over historical records where appropriate.

---

## 11.10 Summary

The Search Strategy enables operators to locate residents quickly using real-world operational information rather than technical knowledge of the underlying system.

By combining Universal Search, Operational Filters and Advanced Search, RPGMS provides an intuitive, scalable and efficient search experience while preserving clear domain ownership and architectural boundaries.

---

# 12. Timeline & History

The Resident Timeline provides a chronological view of significant business events throughout the resident's relationship with the PG.

Its purpose is to provide operators with a meaningful operational history rather than a technical audit log.

The timeline combines important events from multiple business domains while preserving the ownership of each event within its originating domain.

---

## 12.1 Timeline Philosophy

The Resident Timeline tells the story of the resident's relationship with the PG.

Only business-significant events shall appear in the timeline.

Routine technical updates or administrative database changes shall not appear.

The timeline shall remain chronological, append-only, and easy to understand.

---

## 12.2 Timeline Principles

The Resident Timeline shall follow these principles:

- Events are append-only.
- Events are never edited or overwritten.
- Events remain owned by their originating domain.
- Events are displayed chronologically.
- Historical information is preserved permanently.
- The timeline provides operational understanding rather than technical auditing.

---

## 12.3 Timeline Sources

Timeline events may originate from multiple business domains.

Examples include:

### Resident

- Resident Created
- Profile Updated
- Photograph Added
- Emergency Contact Added
- Vehicle Registered
- Device Registered

### Stay

- Admission Completed
- Bed Allocated
- Bed Changed
- Flat Changed
- Commercial Agreement Revised
- Notice Submitted
- Operational Checkout Completed

### Compliance

- Police Intimation Submitted
- Police Verification Completed
- Agreement Renewed
- Compliance Completed

### Finance (Future)

- Security Deposit Received
- Security Deposit Refunded
- Settlement Completed

Each event remains owned by its originating domain.

---

## 12.3.1 Timeline Categories

Timeline events may be categorised according to their operational significance.

Typical categories include:

- Resident
- Stay
- Compliance
- Finance
- Accommodation
- System

Categorisation improves readability, filtering and future reporting while preserving the ownership of each event.

---

## 12.4 Timeline Event Information

Each Timeline Event should contain:

- Event Date and Time
- Event Type
- Short Description
- Originating Domain
- Optional Supporting Information

Future versions may include:

- Performed By
- Linked Workspace
- Related Documents

---

## 12.4.1 Event Importance

Timeline events may be classified according to their operational importance.

Typical classifications include:

### Major

Examples:

- Admission Completed
- Operational Checkout
- Agreement Renewal
- Commercial Agreement Revised

### Standard

Examples:

- Bed Transfer
- Flat Transfer
- Vehicle Registered
- Device Registered

### Informational

Examples:

- Profile Updated
- Photograph Added
- Emergency Contact Updated

Event importance assists operators in understanding significant historical events while maintaining a consistent timeline.

---

## 12.5 Timeline Presentation

Timeline events shall be displayed in reverse chronological order by default.

Operators should immediately see the most recent activities.

Older events shall remain accessible without altering historical order.

---

## 12.5.1 Visual Representation

Future implementations may visually distinguish different event types using consistent icons or visual indicators.

Examples include:

- Resident
- Stay
- Accommodation
- Compliance
- Finance

Visual representation is intended to improve readability without altering the chronological order or business meaning of events.

---
## 12.6 Timeline Filtering

Future versions may allow filtering by event source.

Examples include:

- Resident Events
- Stay Events
- Compliance Events
- Finance Events

Filtering affects presentation only.

It shall never modify the underlying timeline.

---

## 12.6.1 Timeline Search

Future versions may support searching within a Resident Timeline.

Examples include:

- Event Type
- Keywords
- Date Range
- Originating Domain

Timeline Search improves navigation through long resident histories without affecting the underlying historical records.

---

## 12.7 Timeline Navigation

Where appropriate, timeline events may provide navigation to their originating workspace.

Examples include:

- Open Stay Workspace
- View Compliance Record
- View Document
- View Financial Transaction

Navigation shall remain read-only unless the operator explicitly initiates an editing workflow.

Timeline navigation shall always preserve the read-only nature of historical events.

Editing historical information shall only be possible through the owning business workflow where explicitly permitted.

---

## 12.8 Historical Integrity

Historical events represent permanent business history.

Historical corrections should be represented by new Timeline Events wherever practical rather than modifying previously recorded events.

This preserves an accurate historical record of operational activities.

Corrections should create new events rather than modifying existing historical records wherever practical.

This preserves complete operational traceability.

---

## 12.9 Relationship with Audit Logs

The Resident Timeline is not intended to replace technical audit logs.

Technical audit logs record system activity.

The Resident Timeline records business activity.

These two mechanisms serve different purposes and shall remain independent.

---

## 12.10 Business Rules

The Resident Timeline shall comply with the following principles:

- Timeline events represent business activities.
- Events are append-only.
- Events remain owned by their originating domain.
- Events are displayed chronologically.
- Historical information shall never be lost.
- Timeline presentation shall remain independent of event ownership.

---

## 12.11 Summary

The Resident Timeline provides a complete business history of the resident's relationship with the PG.

By combining meaningful events from multiple domains while preserving ownership boundaries, the timeline enables operators to understand the resident's history quickly and accurately without exposing technical implementation details.

---

# 13. Navigation Philosophy

The Navigation Philosophy defines how operators move between workspaces within the Resident module and related operational modules.

Navigation is designed around real business workflows rather than technical implementation or data relationships.

The objective is to minimise operator effort while maintaining clear business boundaries and preserving user context.

The Resident Workspace acts as the central hub for all resident-related activities.

---

## 13.1 Navigation Principles

Navigation throughout the Resident module shall follow the following principles:

- Navigation follows business workflows.
- Each workspace has a clearly defined responsibility.
- Operators should never lose their current working context.
- Navigation should minimise unnecessary clicks.
- Cross-workspace navigation should remain predictable.
- Business ownership shall not be compromised by navigation convenience.

---

## 13.2 Resident Workspace as the Hub

The Resident Workspace serves as the primary operational hub for an individual resident.

From the Resident Workspace, operators may navigate to related operational workspaces including:

- Stay Workspace
- Accommodation
- Finance
- Reservations (where applicable)
- Compliance Records
- Resident Documents

The Resident Workspace remains the central point for resident-centric activities.

---

## 13.3 Standard Navigation Flow

The typical navigation sequence is:

Dashboard

↓

Residents List

↓

Resident Workspace

↓

Related Operational Workspace

↓

Return to Resident Workspace

This flow ensures that operators always have a consistent point of reference.

---

## 13.4 Context Preservation

Navigation between workspaces shall preserve the operational context wherever practical.

Examples include:

- Selected Resident
- Active Stay
- Current Search
- Applied Filters
- Scroll Position (Future)

Returning to a previous workspace should restore the operator's context whenever possible.

---

## 13.4.1 Return Navigation

Navigation should preserve the operator's workflow by returning to the originating workspace wherever practical.

Typical example:

Residents List

↓

Resident Workspace

↓

Stay Workspace

↓

Resident Workspace

↓

Residents List

Operators should return to the workspace from which they navigated rather than a fixed default page.

This approach reduces unnecessary navigation and maintains continuity during day-to-day operations.

---

## 13.5 Workspace Ownership

Navigation between workspaces does not transfer business ownership.

Examples:

- Opening the Stay Workspace does not make the Resident Workspace responsible for Stay operations.
- Opening Finance does not transfer ownership of financial information to the Resident Workspace.

Each workspace remains responsible only for its own business domain.

---

## 13.6 Cross-Workspace Navigation

Cross-workspace navigation shall be explicit.

Typical navigation includes:

Resident Workspace

↓

Open Stay Workspace

Resident Workspace

↓

View Compliance Record

Resident Workspace

↓

Open Finance

Resident Workspace

↓

View Accommodation

Operators should always understand which workspace they are entering.

---

## 13.6.1 Embedded Information and Related Workspaces

The Resident Workspace provides both embedded operational information and navigation to related workspaces.

Embedded information provides immediate operational visibility without requiring navigation.

Examples include:

- Current Stay Summary
- Compliance Summary
- Operational Readiness
- Profile Completion

Related workspaces provide complete business functionality.

Examples include:

- Stay Workspace
- Finance Workspace
- Accommodation Workspace
- Compliance Workspace (Future)

Embedded information shall remain read-only.

Business operations shall always be performed within the appropriate owning workspace.


---

## 13.7 Navigation Consistency

Navigation controls should remain consistent throughout RPGMS.

Examples include:

- Page titles
- Workspace headers
- Primary action placement
- Back navigation
- Breadcrumbs (Future)

Consistency reduces training requirements and improves operator confidence.

---

## 13.7.1 Breadcrumb Philosophy

Future versions of RPGMS may provide breadcrumb navigation to indicate the operator's current location within the application.

Breadcrumbs should:

- Clearly indicate the current workspace.
- Provide convenient navigation to previously visited workspaces.
- Preserve the logical business hierarchy.
- Never perform business operations.

Breadcrumbs improve orientation while maintaining consistent navigation throughout RPGMS.

---

## 13.8 Deep Linking

Future versions may support direct navigation to specific workspaces.

Examples include:

- Specific Resident Workspace
- Particular Stay
- Compliance Record
- Resident Document

Deep links should preserve security permissions and business ownership.

---

## 13.8.1 Read-Only Navigation

Navigation is a read-only activity.

Moving between workspaces shall never modify business data or trigger operational workflows.

Business operations shall occur only through explicit operator actions within the appropriate workspace.

This separation preserves clear boundaries between navigation and business processing.

---

## 13.9 Business Rules

The Navigation Philosophy shall comply with the following principles:

- Navigation follows business workflows.
- Navigation shall preserve operator context.
- Workspaces retain their business ownership.
- Cross-workspace navigation shall be explicit.
- Future navigation enhancements shall remain consistent with the overall architecture.
- Navigation shall preserve the operator's originating context wherever practical.
- Embedded information provides visibility only and does not replace related workspaces.
- Navigation shall remain a read-only activity.
- Breadcrumb navigation shall support orientation without altering business workflows.
  
---

## 13.10 Summary

The Navigation Philosophy provides a consistent and predictable approach to moving between workspaces within RPGMS.

By organising navigation around business workflows and preserving operational context, the system enables operators to work efficiently while maintaining clear architectural boundaries and domain ownership.

---

# 14. Security & Permissions

The Security & Permissions model defines the business responsibilities governing access to Resident information and operational activities within RPGMS 2.0.

Its purpose is to ensure that authorised operators can perform their duties while preserving the integrity, confidentiality and historical accuracy of resident information.

This chapter defines business permissions rather than technical implementation.

Authentication mechanisms, user accounts and role-based access control are implementation concerns and are outside the scope of this specification.

---

## 14.1 Security Philosophy

Security shall follow the principle of least privilege.

Operators should have access only to the information and business operations necessary to perform their responsibilities.

Permissions shall be based upon business responsibilities rather than technical convenience.

---

## 14.2 Business Responsibilities

Security permissions are organised according to business responsibilities.

Typical responsibilities include:

- View Resident Information
- Update Resident Information
- Admit Resident
- Manage Stay
- Manage Accommodation
- Manage Compliance
- View Finance
- Manage Finance
- View Historical Information

Future responsibilities may be introduced without redesigning the permission model.

---

## 14.3 Read and Write Permissions

Viewing information and modifying information represent separate permissions.

Examples include:

- View Resident Profile
- Edit Resident Profile

- View Documents
- Manage Documents

- View Compliance
- Manage Compliance

- View Finance
- Manage Finance

Separating read and write permissions improves operational control while supporting future organisational growth.

---

## 14.4 Operational Permissions

Operational permissions govern activities that modify business state.

Examples include:

- Admit Resident
- Allocate Bed
- Transfer Bed
- Revise Commercial Agreement
- Submit Notice
- Complete Operational Checkout
- Record Compliance Activity

These permissions should be granted only to authorised operators.

---

## 14.5 Historical Information

Historical information forms part of the permanent business record.

Operators may be granted permission to view historical information.

Modification of historical records shall be prohibited unless explicitly supported through approved business correction workflows.

Historical preservation remains a fundamental architectural principle.

---

## 14.5.1 Resident Deletion Policy

Resident records represent permanent business entities.

Residents with operational history shall never be physically deleted from RPGMS.

Where a resident is no longer active, the Resident shall transition to the appropriate historical status (for example, Alumni) while preserving the complete business history.

Future implementations may support administrative archiving for operational convenience.

Archiving shall not remove or alter historical information.

---

## 14.6 Sensitive Information

Certain resident information may require additional protection.

Examples include:

- Government Document Numbers
- Medical Information
- Financial Information
- Personal Contact Information

Future implementations may apply additional permission controls to sensitive information.

---

## 14.6.1 Emergency Access

Future versions of RPGMS may support controlled emergency access to selected resident information.

Examples include:

- Medical Information
- Emergency Contact Details

Emergency access shall be limited to authorised personnel and should be appropriately audited.

Emergency access represents an exceptional operational capability and shall not replace normal security permissions.

---
## 14.7 Section-Level Permissions

The Resident Workspace is organised into independent business sections.

Future versions may grant permissions at the section level.

Examples include:

- Edit Personal Information
- Edit Contact Information
- Manage Documents
- Manage Registered Vehicles
- Manage Registered Devices
- Manage Compliance

Section-level permissions improve flexibility while preserving clear ownership boundaries.

---

## 14.7.1 Business State Restrictions

Some operations may become unavailable due to the current business state rather than operator permissions.

Examples include:

- A completed Stay cannot be operationally modified after Checkout.
- Historical Compliance Records remain read-only.
- Historical Commercial Agreements remain immutable.

These restrictions originate from business rules rather than security permissions.

Business state restrictions shall always take precedence over user permissions.

---

## 14.8 Cross-Domain Permissions

Navigation between workspaces does not automatically grant permission to perform operations within those workspaces.

Examples include:

- Viewing the Stay Workspace does not permit Stay modifications.
- Opening the Finance Workspace does not permit financial transactions.
- Viewing Compliance does not permit recording Compliance activities.

Each business domain remains responsible for enforcing its own permissions.

---

## 14.8.1 Permission Audit

Significant operational activities should record the responsible operator and the time at which the activity was performed.

Examples include:

- Admission
- Operational Checkout
- Commercial Agreement Revision
- Compliance Completion

Permission auditing supports accountability, operational transparency and future auditing requirements.

Permission Audit complements, but does not replace, the Resident Timeline and technical audit logging mechanisms.

----

## 14.9 Future Role-Based Access Control

Future versions of RPGMS may implement Role-Based Access Control (RBAC).

Typical roles may include:

- Administrator
- Manager
- Office Staff
- Accountant
- Maintenance Staff
- Read-Only User

The business permissions defined within this chapter shall form the foundation of any future RBAC implementation.

---

## 14.9.1 Future Resident Self-Service

Future versions of RPGMS may support controlled self-service capabilities for residents.

Examples may include:

- Updating Contact Information
- Updating Permanent Address
- Uploading Supporting Documents
- Viewing Personal Information

Operational activities including:

- Admission
- Stay Management
- Commercial Agreements
- Compliance Activities
- Operational Checkout

shall remain under the control of authorised operators.

Self-service capabilities shall respect the business ownership principles defined throughout this specification.

---

## 14.10 Business Rules

The Security & Permissions model shall comply with the following principles:

- Permissions follow business responsibilities.
- Read and write permissions remain independent.
- Historical information shall remain protected.
- Navigation does not grant operational permissions.
- Business domains remain responsible for enforcing their own permissions.
- Future RBAC implementations shall preserve these principles.
- Resident records with operational history shall not be physically deleted.
- Business state restrictions shall take precedence over user permissions.
- Significant operational activities should support permission auditing.
- Future self-service capabilities shall respect business ownership boundaries.
- Emergency access shall be exceptional, controlled and auditable.
  
---

## 14.11 Summary

The Security & Permissions model provides a business-oriented framework for protecting resident information and operational activities.

By organising permissions around business responsibilities rather than technical implementation, RPGMS supports long-term scalability while preserving the integrity of resident information and maintaining clear domain ownership.

---

# 15. Data Retention & Audit

The Data Retention & Audit model defines how resident information, operational history and business records are preserved throughout the lifecycle of RPGMS.

The objective is to ensure that important business information remains available for operational, legal, financial and historical purposes while maintaining the integrity and traceability of all significant business activities.

Historical information represents a valuable business asset and shall be preserved wherever practical.

---

## 15.1 Data Retention Philosophy

RPGMS follows the principle of historical preservation.

Business information should be retained rather than discarded.

Historical records provide valuable operational context, support compliance, improve accountability and enable future business analysis.

The system shall therefore favour preservation over deletion.

---

## 15.2 Retained Information

The following information shall normally be retained permanently:

### Resident

- Resident Profile
- Contact Information
- Address History (Future)
- Registered Vehicles
- Registered Devices

### Stay

- Historical Stays
- Commercial Agreements
- Bed Allocations
- Business Events

### Documents

- Resident Documents
- Historical Document Versions (where applicable)

### Compliance

- Compliance Records
- Agreement Renewals
- Police Intimation History

### Timeline

- Resident Timeline
- Business Events

Historical information shall remain available regardless of the resident's operational status.

---

## 15.2.1 Legal and Regulatory Retention

Certain categories of information may be subject to statutory or regulatory retention requirements.

Examples may include:

- Financial Records
- Compliance Records
- Police Intimation Records
- Government-issued Documents

Where applicable, statutory retention requirements shall take precedence over internal administrative retention policies.

The architecture shall support such requirements without compromising the integrity of historical business information.

---

## 15.3 Historical Preservation

Historical information shall not be overwritten wherever practical.

Corrections should create new historical records rather than modifying previous records.

Examples include:

- Agreement Renewals
- Compliance Activities
- Commercial Agreement Revisions
- Operational Checkout

This approach preserves complete operational history.

---

## 15.3.1 Data Correction

Operational mistakes may occasionally require correction.

Wherever practical, corrections should be represented by new business records or correction events rather than modifying historical records.

Examples include:

- Commercial Agreement Revision
- Compliance Correction
- Business Event Correction

This approach preserves the original historical record while maintaining an accurate representation of subsequent business activity.

---

## 15.4 Audit Philosophy

Audit information exists to explain:

- What happened
- When it happened
- Who performed the activity (where applicable)

Auditability supports operational transparency and accountability.

Business audit information remains distinct from technical system logging.

---

## 15.5 Business Audit

Business Audit records significant business activities.

Examples include:

- Admission
- Bed Transfer
- Commercial Agreement Revision
- Notice Submission
- Operational Checkout
- Agreement Renewal
- Police Intimation

Business Audit provides meaningful operational history.

---

## 15.5.1 Audit Visibility

Access to Business Audit information shall be governed by the Security & Permissions model.

Operators may view audit information only where authorised by their business responsibilities.

Audit visibility supports transparency while maintaining appropriate confidentiality of operational information.

---

## 15.6 Technical Audit

Technical audit information records system-level activities.

Examples may include:

- User Login
- Authentication Events
- System Errors
- Permission Changes

Technical Audit is outside the scope of this specification but shall remain separate from Business Audit.

---

## 15.7 Archiving

Future versions of RPGMS may support administrative archiving.

Archiving improves operational performance without removing historical information.

Archived residents shall remain searchable through appropriate administrative workflows.

Archiving shall never result in permanent loss of business history.

---

## 15.7.1 Soft Delete Policy

Business entities with operational history shall not be permanently deleted.

Where removal from normal operational workflows is required, the system should prefer:

- Historical Status
- Alumni Status
- Administrative Archiving

Physical deletion should be reserved for exceptional administrative situations where no business history exists.

This policy preserves historical integrity while supporting long-term operational continuity.

---

## 15.8 Data Integrity

Historical information shall maintain its integrity throughout the lifetime of the system.

Examples include:

- Business Events remain immutable.
- Compliance Records remain immutable.
- Historical Commercial Agreements remain immutable.
- Historical Bed Allocations remain immutable.

Immutable records improve confidence in historical information.

---

## 15.8.1 Business Event Retention

Business Events represent the authoritative operational history of business entities.

Business Events shall remain permanently associated with their originating business entity throughout its lifetime.

Business Events shall be retained regardless of changes to the operational status of the associated Resident or Stay.

The preservation of Business Events is fundamental to maintaining complete operational traceability.

---

## 15.8.2 Relationship with the Resident Timeline

The Resident Timeline provides a presentation of historical business activity.

Business Events remain the authoritative source of operational history.

The Timeline aggregates and presents relevant Business Events from multiple business domains without becoming the owner of those events.

This separation preserves clear ownership boundaries while providing operators with a unified historical view.

---

## 15.9 Future Retention Policies

Future versions may introduce configurable retention policies for selected information.

Examples include:

- Temporary Files
- Generated Reports
- System Logs

Retention policies shall never compromise permanent business history unless explicitly required by applicable law.

---

## 15.10 Business Rules

The Data Retention & Audit model shall comply with the following principles:

- Historical information is preserved.
- Business records shall not be physically deleted wherever practical.
- Historical records are append-only.
- Business Audit remains independent from Technical Audit.
- Future archiving shall preserve historical information.
- Immutable business records shall remain protected.
- Future retention policies shall respect historical preservation.
- Business entities with historical information shall not be physically deleted.
- Statutory retention requirements shall take precedence where applicable.
- Data corrections should preserve historical traceability wherever practical.
- Business Audit visibility shall follow the Security & Permissions model.
- Business Events constitute permanent operational history.
- The Resident Timeline presents Business Events without owning them.
  
---

## 15.11 Summary

The Data Retention & Audit model preserves the complete operational history of residents throughout their relationship with the PG.

By treating historical information as a long-term business asset rather than temporary operational data, RPGMS supports accountability, compliance, business continuity and future organisational growth.

---

# 16. Business Rules

This chapter consolidates the fundamental business rules governing the Resident module within RPGMS 2.0.

The rules contained in this chapter summarise the principles established throughout this specification and serve as the constitutional reference for future development.

No implementation, enhancement or workflow shall violate these business rules without an approved architectural change.

---

## 16.0.1 Relationship with Other Chapters

This chapter consolidates the principal business rules established throughout this specification.

It serves as the constitutional summary of the Resident module.

Where a conflict or ambiguity exists, the detailed chapter governing the specific business area shall take precedence over this summary.

This approach ensures that Chapter 16 remains a concise reference while preserving the authoritative detail contained elsewhere in the specification.

---

## 16.1 Resident Ownership

The Resident represents a person.

The Resident is a permanent business entity.

A Resident owns:

- Personal Information
- Contact Information
- Permanent Address
- Documents
- Emergency Contacts
- Registered Devices
- Registered Vehicles
- Medical Information

The Resident does not own operational Stay information.

---

## 16.2 Stay Ownership

Operational residency belongs to the Stay domain.

The Stay owns:

- Admission
- Accommodation
- Commercial Agreements
- Notice Lifecycle
- Operational Checkout
- Business Events
- Current Projection

The Resident Workspace displays Stay information through projections only.

---

## 16.3 One Resident Principle

Each person shall have only one Resident record.

Returning residents shall reuse the existing Resident.

Duplicate Resident records shall not be created.

---

## 16.4 Stay Lifecycle

A Resident may have:

- Zero Active Stays
- One Active Stay
- Multiple Historical Stays

Only one Stay may be operationally active at any point in time.

---

## 16.5 Admission

Admission establishes operational residency.

Admission:

- creates or reuses the Resident,
- creates a Stay,
- allocates accommodation,
- establishes the initial Commercial Agreement.

Admission follows the principle of Minimal Operational Admission.

---

## 16.6 Progressive Profile Completion

Admission collects only the minimum information required to establish residency.

Additional resident information shall be completed progressively through the Resident Workspace.

Profile Completion shall never delay operational admission.

---

## 16.7 Documents

Documents belong to the Resident.

Documents represent documentary evidence.

Documents do not represent business activities.

Multiple documents shall be supported.

Historical documents shall be preserved wherever practical.

---

## 16.8 Compliance

Compliance records business activities.

Compliance:

- is independent of the Stay,
- is independent of Resident Documents,
- may reference supporting documents.

Compliance Records are append-only.

---

## 16.9 Search

Operators search using the information available to them.

The system determines where to search.

Search is read-only.

Search shall remain consistent throughout RPGMS.

---

## 16.10 Navigation

Navigation follows business workflows.

Navigation preserves operator context.

Navigation is read-only.

Navigation does not transfer business ownership.

---

## 16.11 Timeline

Timeline events represent business history.

Timeline events:

- are append-only,
- remain owned by their originating domain,
- are presented chronologically.

The Timeline presents history.

It does not own history.

---

## 16.12 Historical Preservation

Historical business information is a permanent business asset.

Business records shall not be physically deleted wherever practical.

Business history shall remain available for operational, legal and historical purposes.

---

## 16.13 Security

Permissions follow business responsibilities.

Business state restrictions take precedence over permissions.

Navigation and Search do not grant operational permissions.

---

## 16.14 Operational Readiness

Operational Readiness determines whether the resident currently satisfies the operational requirements necessary to continue residing within the PG.

Operational Readiness is independent of:

- Profile Completion
- Compliance Summary

Each serves a distinct business purpose.

---

## 16.15 Business Events

Business Events constitute the authoritative operational history.

Business Events:

- are immutable,
- remain permanently associated with the owning business entity,
- form the source of Timeline presentation.

---

## 16.16 Architectural Principles

The Resident module shall always preserve the following principles:

- Clear Domain Ownership
- Clean Architecture
- Progressive Profile Completion
- Historical Preservation
- Projection-Driven UI
- Append-Only History
- Read-Only Navigation
- Read-Only Search
- Modular Growth
- Separation of Concerns

These principles govern all future enhancements.

---

## 16.17 Summary

The Business Rules defined within this chapter represent the constitutional principles governing the Resident module.

Future development shall preserve these principles to ensure architectural consistency, operational correctness and long-term maintainability throughout RPGMS 2.0.

---

## 16.18 Golden Rules

The following principles represent the fundamental constitutional rules governing the Resident module.

These rules should remain true regardless of future implementation or technology changes.

- One Person → One Resident.
- One Resident → One Active Stay at a Time.
- Admission establishes operational residency.
- Resident information is permanent.
- Stay information is operational.
- Documents are Evidence.
- Compliance records Business Activities.
- Business Events are the authoritative operational history.
- Timeline presents Business Events but does not own them.
- Search retrieves information and never modifies business data.
- Navigation changes context and never performs business operations.
- Historical information is preserved wherever practical.
- Business ownership shall remain clearly separated across domains.

---

## 16.19 Architectural Guardrails

The following practices are prohibited unless an approved architectural review explicitly authorises a change.

Never:

- Create duplicate Resident records.
- Allow more than one Active Stay for a Resident.
- Recreate a Stay solely to renew an agreement.
- Store Stay information inside the Resident domain.
- Treat Documents as Compliance activities.
- Overwrite historical business records where historical preservation is required.
- Perform business operations through Search.
- Perform business operations through Navigation.
- Bypass established domain ownership boundaries.
- Introduce functionality that compromises Clean Architecture principles.

These guardrails protect the long-term consistency and maintainability of RPGMS.

---

## 16.20 Future Constitutional Changes

The Business Rules defined within this chapter represent the constitutional principles of the Resident module.

Future enhancements shall extend these principles rather than replace them.

Any proposal requiring modification of these constitutional principles shall undergo formal architectural review and documentation before implementation.

This governance model ensures that RPGMS continues to evolve without compromising its established business architecture, domain ownership or design philosophy.

---

# 17. Future Enhancements

This chapter outlines potential future enhancements for the Resident module.

These enhancements are not part of the current Resident Workspace V2 implementation.

They represent future opportunities for extending the module while preserving the constitutional principles established throughout this specification.

All future enhancements shall comply with:

- Domain Ownership
- Clean Architecture
- Historical Preservation
- Progressive Profile Completion
- Projection-Driven Design
- Separation of Concerns

Future functionality shall extend the existing architecture rather than replace it.

---

## 17.1 Enhancement Philosophy

The Resident module has been intentionally designed to support long-term growth.

Future functionality should be introduced incrementally without requiring major architectural redesign.

New capabilities shall integrate naturally into the existing business model.

Architectural consistency shall always take precedence over feature expansion.

---

## 17.1.1 Out of Scope for Resident Workspace V2

The following capabilities are intentionally outside the scope of the Resident Workspace V2 specification.

These features belong to other RPGMS modules or future implementation phases.

Examples include:

- Visitor Management
- Inventory Management
- Maintenance Management
- Laundry Management
- Billing Engine
- Mobile Applications
- Resident Portal
- Payment Gateway Integration

Their exclusion from this specification does not imply they are unsupported by RPGMS.

They shall be addressed within their respective module specifications or future architectural phases.

---

# 17.2 Near-Term Enhancements

The following enhancements represent logical extensions of the current Resident module.

Examples include:

### Resident Experience

- Resident Photograph Capture
- Multiple Email Addresses
- Alternate Mobile Numbers
- Preferred Communication Method

### Resident Workspace

- Section Health Indicators
- Workspace Personalisation
- Favourite Sections
- Recent Residents

### Search

- Auto-complete Suggestions
- Recent Searches
- Saved Searches

### Documents

- Document Preview
- Bulk Upload
- Drag-and-Drop Upload
- Multiple File Attachments

### Compliance

- Compliance Dashboard
- Compliance Calendar
- Upcoming Compliance Alerts

---

## 17.3 Medium-Term Enhancements

These enhancements improve operational efficiency.

### Intelligent Documents

- OCR
- Automatic Document Classification
- Duplicate Detection
- Document Expiry Monitoring

### Resident Services

- Resident Self-Service Portal
- Online Profile Updates
- Digital Document Submission

### Communication

- WhatsApp Integration
- Email Notifications
- SMS Notifications

### Operations

- QR Code Generation
- Visitor Management
- Package Management

---

## 17.4 Long-Term Enhancements

The following capabilities support long-term strategic growth.

### Artificial Intelligence

- AI-assisted Profile Completion
- Intelligent Search
- Resident Risk Indicators
- Predictive Compliance Monitoring

### Automation

- Workflow Automation
- Smart Reminders
- Automatic Follow-ups

### Integration

- Government Portal Integration
- Digital Identity Verification
- Payment Gateway Integration
- Access Control Integration

### Mobile

- Mobile Operator Application
- Resident Mobile Application
- Offline Synchronisation

---

## 17.4.1 Artificial Intelligence Principles

Future Artificial Intelligence capabilities shall assist operators without replacing established business processes.

AI may support activities such as:

- Information extraction
- Intelligent search
- Document classification
- Compliance reminders
- Workflow assistance

AI shall not:

- Override business rules.
- Modify business data autonomously.
- Circumvent approval workflows.
- Replace operator accountability.

All AI-assisted functionality shall remain consistent with the AI Governance principles established for RPGMS 2.0.

---

## 17.5 Analytics

Future analytics capabilities may include:

- Resident Demographics
- Occupancy Trends
- Agreement Renewal Trends
- Compliance Trends
- Resident Retention
- Admission Sources

Analytics shall consume business information without altering business ownership.

---

## 17.6 Reporting

Future reporting capabilities may include:

- Compliance Reports
- Resident History Reports
- Agreement Renewal Reports
- Operational Readiness Reports
- Document Status Reports

Reports remain presentation components and shall not own business information.

---

## 17.7 Integration

Future integrations may include:

- WhatsApp Business
- Email Platforms
- Payment Providers
- Access Control Systems
- Government Compliance Systems
- Cloud Storage Providers

Integrations shall remain infrastructure concerns and shall not alter domain ownership.

---

## 17.7.1 Integration Principles

External integrations extend the capabilities of RPGMS but do not become owners of business information.

Examples include:

- Access Control Systems
- Payment Providers
- Communication Platforms
- Government Services
- Cloud Storage Providers

Business ownership shall always remain within the appropriate RPGMS domain.

External systems may exchange information with RPGMS but shall not redefine or replace established business rules or domain ownership.

---

## 17.8 Scalability

The Resident module has been designed to support:

- Additional Resident Information Sections
- New Compliance Types
- New Document Categories
- Additional Business Workflows
- Larger Organisations
- Multi-Property Operations (Future)

Scalability shall be achieved through extension rather than architectural redesign.

---

## 17.8.1 Multi-Property Operations

The Resident module has been architected to support future expansion to multiple properties or business locations.

Potential future capabilities include:

- Shared Resident Directory
- Property-specific Accommodation
- Centralised Resident Search
- Cross-Property Reporting
- Multi-Property Administration

Future multi-property functionality shall extend the existing architecture without altering the constitutional principles of the Resident module.

---

## 17.9 Architectural Principles

Future enhancements shall preserve:

- Domain Ownership
- Clean Architecture
- Projection-Driven UI
- Append-Only History
- Progressive Profile Completion
- Read-Only Search
- Read-Only Navigation
- Business Event Ownership
- AI shall assist business operations without replacing operator responsibility.
- External integrations shall extend business capabilities without becoming owners of business information.
- Future expansion to multiple properties shall preserve established domain ownership.
- Functionality intentionally excluded from Resident Workspace V2 shall be implemented through their respective modules rather than by expanding Resident beyond its defined responsibilities.
  
Future functionality shall never compromise these principles.

---

## 17.10 Summary

The Resident module has been intentionally designed to evolve over time.

Future enhancements should extend the existing architecture while preserving the constitutional principles established throughout this specification.

The objective is sustainable evolution rather than continual redesign.

---

# 18. Design Validation Checklist

The Design Validation Checklist provides the final architectural quality gate for all future development of the Resident module.

Every significant enhancement, refactoring, feature request or bug fix should be evaluated against this checklist before implementation.

The objective is to ensure that future development preserves the constitutional principles established throughout this specification.

---

## 18.1 Purpose

The checklist exists to:

- Preserve architectural consistency.
- Protect business rules.
- Prevent domain leakage.
- Maintain Clean Architecture.
- Encourage long-term maintainability.
- Support consistent AI-assisted development.

The checklist is intended for:

- Developers
- Architects
- Reviewers
- AI Coding Assistants

---

## 18.2 Domain Ownership

Before implementing a change, confirm:

✓ Does every piece of information belong to the correct business domain?

✓ Is Resident information owned by Resident?

✓ Is operational information owned by Stay?

✓ Are financial activities owned by Finance?

✓ Are documents owned by Resident?

✓ Are compliance activities owned by Compliance?

✓ Is accommodation information owned by Accommodation?

No implementation should violate established domain ownership.

---

## 18.3 Business Rules

Confirm:

✓ Does the implementation preserve the established business rules?

✓ Does it maintain One Resident per person?

✓ Does it preserve One Active Stay?

✓ Does it preserve Progressive Profile Completion?

✓ Does it respect Minimal Operational Admission?

---

## 18.4 Historical Preservation

Confirm:

✓ Are historical records preserved?

✓ Are Business Events append-only?

✓ Are historical Stays retained?

✓ Are Compliance Records retained?

✓ Are historical Commercial Agreements preserved?

✓ Is historical information protected?

---

## 18.5 Projection-Driven Design

Confirm:

✓ Is operational information displayed through projections?

✓ Is Current Stay information duplicated?

✓ Is projection logic placed in the correct layer?

✓ Does the Resident Workspace remain projection-driven?

---

## 18.6 Separation of Concerns

Confirm:

✓ Are UI components free of business logic?

✓ Are Coordinators responsible only for orchestration?

✓ Are business rules implemented inside the owning domain?

✓ Are repositories responsible only for persistence?

---

## 18.7 Navigation & Search

Confirm:

✓ Does Navigation remain read-only?

✓ Does Search remain read-only?

✓ Are business operations initiated explicitly?

✓ Is operator context preserved?

---

## 18.8 Security

Confirm:

✓ Are permissions based upon business responsibilities?

✓ Do business state restrictions remain authoritative?

✓ Are historical records protected?

✓ Are sensitive fields appropriately protected?

---

## 18.9 Future Compatibility

Confirm:

✓ Can this enhancement be extended?

✓ Does it avoid unnecessary coupling?

✓ Does it preserve modularity?

✓ Does it preserve scalability?

✓ Does it preserve historical integrity?

---

## 18.10 AI Development Checklist

When using AI-assisted development:

Confirm:

✓ Has the AI read the constitutional documents?

✓ Has the AI respected Domain Ownership?

✓ Has the AI avoided introducing business logic into UI?

✓ Has the AI preserved historical information?

✓ Has the AI avoided unnecessary architectural changes?

✓ Has the AI preserved Clean Architecture?

✓ Has the AI respected the Business Rules?

AI-generated code shall always be reviewed by a human before acceptance.

---

## 18.10.1 Standard AI-Assisted Development Workflow

Future AI-assisted development within RPGMS should follow the established engineering workflow.

The recommended sequence is:

1. Read the constitutional documents.
2. Analyse the existing implementation.
3. Produce an Assessment & Gap Analysis.
4. Await implementation approval.
5. Implement the approved changes.
6. Perform an architectural self-audit.
7. Update all relevant documentation.
8. Execute verification gates.
9. Obtain final approval.

This workflow promotes architectural consistency, controlled implementation and complete documentation throughout the project lifecycle.

---

## 18.10.2 Change Classification

Not all changes require the same level of architectural review.

The following classification provides guidance.

| Change Type | Review Requirement |
|-------------|-------------------|
| Bug Fix | Standard Review |
| UI Refinement | Standard Review |
| Documentation Update | Standard Review |
| Performance Improvement | Standard Review |
| New Business Rule | Architectural Review |
| Domain Ownership Change | Architectural Review |
| Data Model Change | Architectural Review |
| New Business Entity | Architectural Review |
| Constitutional Principle Change | Formal Architectural Approval |

The objective is to apply appropriate governance while avoiding unnecessary review overhead for routine implementation work.

---

## 18.11 Validation Outcome

Every significant implementation should conclude with one of the following outcomes:

### Approved

The implementation complies with the constitutional principles.

### Approved with Observations

Minor improvements have been identified but no constitutional principles have been violated.

### Requires Architectural Review

The proposed implementation conflicts with one or more constitutional principles.

Implementation should not proceed until the architectural concerns have been resolved.

---

## 18.11.1 Architecture Health Score

Following completion of the Design Validation Checklist, the implementation should be assessed against the principal architectural dimensions.

Typical assessment areas include:

| Architectural Dimension | Status |
|-------------------------|--------|
| Domain Ownership | PASS / FAIL |
| Business Rules | PASS / FAIL |
| Historical Preservation | PASS / FAIL |
| Clean Architecture | PASS / FAIL |
| Projection-Driven Design | PASS / FAIL |
| Separation of Concerns | PASS / FAIL |
| Security & Permissions | PASS / FAIL |
| Future Compatibility | PASS / FAIL |

Overall Architecture Health shall be recorded as one of:

- PASS
- PASS WITH OBSERVATIONS
- ARCHITECTURAL REVIEW REQUIRED

The Architecture Health Score provides a consistent quality assessment for future implementations.

---

## 18.11.2 Architectural Red Flags

The following conditions shall automatically trigger an architectural review before implementation proceeds.

Examples include:

- Introducing duplicate ownership of business information.
- Moving Stay information into the Resident domain.
- Introducing business logic into UI components.
- Introducing business logic into repositories.
- Physically deleting historical business records.
- Overwriting immutable Business Events.
- Bypassing established domain ownership.
- Introducing new business entities without defined ownership.
- Violating the One Resident or One Active Stay principles.
- Circumventing established Business Rules.

The presence of any Architectural Red Flag requires formal review before implementation.

---

## 18.12 Summary

The Design Validation Checklist serves as the final architectural quality gate for the Resident module.

Every significant enhancement should be evaluated against the constitutional principles established throughout this specification before implementation.

The objective is not merely to verify functionality but to preserve business correctness, architectural integrity, historical preservation and long-term maintainability.

---

## 18.13 Constitutional Statement

The Resident Workspace V2 Specification defines the constitutional architecture of the Resident module within RPGMS 2.0.

Future enhancements shall extend this architecture rather than replace it unless an approved architectural review explicitly revises the constitutional principles documented herein.

This specification shall remain the authoritative business reference for future development, ensuring that the Resident module continues to evolve in a consistent, maintainable and architecturally sound manner.

---

