# RPGMS Backlog

## AI

- OCR from UPI screenshots
- WhatsApp reminders
- AI chatbot
- AI resident insights

## Operations

- Laundry
- Complaints
- Visitor Register

## Reports

- Occupancy trends
- Revenue charts
- Profit analysis

## Future

- Multiple PGs
- Mobile App
- QR Check-in
## Technical Debt

Evaluate flattening the React application from /app to the repository root before Version 1.0 if it provides clear benefits for deployment or maintenance.

Introduce shared layout constants (HEADER_HEIGHT, SIDEBAR_WIDTH) once the application shell is complete.

Replace hardcoded layout dimensions with shared layout constants (HEADER_HEIGHT, SIDEBAR_WIDTH).
Add active/selected navigation state.
Replace placeholder avatars with the RPGMS logo and user profile.
Review application background consistency.

## UI / UX Enhancements

### Accommodation
- Refine Bed Status Filter to display matching beds instead of only filtering flats.

## Future Enhancement — Corporate Accommodation & Flexible Billing

**Priority:** Future Release (Post-MVP)

### Background

RPGMS currently treats every occupant as an individual Resident.

Some organizations (companies, colleges, training institutes, etc.) reserve accommodation for multiple people during training programs or temporary assignments.

Although Residents remain individual persons with their own Stay history, the financial responsibility and booking relationship may belong to an external organization.

### Proposed Enhancements

#### Organization Domain

Introduce an Organization entity to manage institutional and corporate customers.

Examples:

- Companies
- Colleges
- Training Institutes
- NGOs
- Other Sponsoring Organizations

The Organization module may include:

- Organization Name
- Contact Person
- GST Details
- Billing Address
- Payment Terms
- Agreement / Contract
- Invoice Preferences

---

#### Financial Responsibility Model

Separate the concept of **Resident** from **Payer**.

Allow financial responsibility to be assigned to:

- Resident (Self)
- Organization
- Parent / Guardian
- Sponsor
- Other Party

Support both:

- Entire Stay billed to one payer.
- Mixed responsibility (e.g., Company pays rent, Resident pays laundry and damages).

---

#### Corporate Reporting

Support future reports such as:

- Residents by Organization
- Organization Occupancy
- Organization Billing Summary
- Corporate Outstanding
- Corporate Ledger
- Corporate Invoice Generation

---

#### Business Principles

- Resident identity remains individual and permanent.
- Each Resident retains independent Stay history.
- Organizations do not replace Residents.
- Organizations may sponsor or financially support one or more Residents.
- Resident Architecture remains unchanged.
- Financial responsibility is handled by the Finance domain.

---
### Stay Compliance

Introduce a dedicated Stay Compliance module.

Compliance records belong to a Stay and not to the Resident Profile.

Initial compliance types include:

- Police Intimation
  - Status
  - Submitted Date
  - Acknowledgement Number
  - PDF Copy
  - Remarks

Future compliance records may include:

- Rent Agreement
- Tenant Verification
- Visa / FRRO Registration
- Organization Approval
- Other statutory documents

Accommodation Enhancement: Bed Details Drawer

Clicking a bed card opens a contextual side panel showing resident details, financial summary, stay status, and context-specific actions (occupied vs vacant), without leaving the Accommodation page.
- 
**Status:** Deferred until post-MVP.