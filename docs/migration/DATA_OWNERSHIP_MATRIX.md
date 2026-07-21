# Resident → Stay Data Ownership Matrix

**Project:** RPGMS 2.0  
**Milestone:** Sprint 7.2.5 (Design Freeze & Ownership Contract)  
**Document:** `docs/migration/DATA_OWNERSHIP_MATRIX.md`  
**Status:** Frozen / Authoritative Contract  
**Last Updated:** 22 July 2026  

---

## Executive Summary

This document establishes the definitive data ownership matrix for every field currently maintained within the **Resident** model in RPGMS 2.0. 

As mandated by Architecture Version 2.0 (`ARCHITECTURE.md`) and `RESIDENT_ARCHITECTURE.md`, the Resident model must be cleanly separated from operational Stay information prior to Sprint 7.3 migration.

**Design Freeze Principle**: Every field has exactly ONE architectural owner. No operational or financial state shall be duplicated across domain boundaries.

---

## Master Data Ownership Matrix

| Field | Current Location | Future Owner Domain | Classification | Migration Strategy | Architectural Reason |
|---|---|---|---|---|---|
| `id` | `Resident` | **Resident** | System | **Remain in Resident** | Permanent, immutable system identifier for the person. |
| `residentCode` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Permanent business identifier assigned to the person (`R000001`). Reused across all stays. |
| `fullName` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Legal full name of the individual. |
| `mobileNumber` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Primary voice call & communication number. |
| `alternateMobile` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Secondary contact number. |
| `email` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Personal email address. |
| `documentType` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Classification of official government identity document. |
| `documentNumber` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Government ID number (Aadhaar, PAN, Passport, etc.). |
| `fatherOrGuardianName` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Family relationship detail. |
| `motherName` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Family relationship detail. |
| `emergencyContactName` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Primary emergency contact person. |
| `emergencyContactRelation` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Relationship of emergency contact to resident. |
| `emergencyContactPhone` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Direct phone number for emergency contact. |
| `permanentAddress` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Legal residential address. |
| `correspondenceAddress` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Mailing / postal address. |
| `city` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Address city. |
| `state` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Address state / province. |
| `pinCode` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Postal PIN code. |
| `occupation` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Professional / educational affiliation type. |
| `employerOrCollege` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Employer company or educational institute name. |
| `bloodGroup` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Personal health attribute. |
| `medicalNotes` | `Resident` | **Resident** | Permanent | **Remain in Resident** | Voluntary emergency medical notes or allergy details. |
| `createdAt` | `Resident` | **System Metadata** | System | **Remain in Resident** | Identity creation timestamp. |
| `updatedAt` | `Resident` | **System Metadata** | System | **Remain in Resident** | Identity profile last modified timestamp. |
| `joiningDate` | `Resident` | **Stay** | Operational | **Move to Stay** | Represents the check-in date of a specific admission (`checkInDate`). |
| `flatId` | `Resident` | **Stay** | Operational | **Move to Stay** | Accommodation unit allocated for a specific stay. |
| `allocatedBedIds` | `Resident` | **Stay** | Operational | **Move to Stay** | Specific bed IDs allocated during a stay. |
| `agreedRent` | `Resident` | **Stay** | Financial | **Move to Stay** | Contractual rent terms agreed for a specific stay. |
| `agreedDeposit` | `Resident` | **Stay** | Financial | **Move to Stay** | Security deposit terms agreed for a specific stay. |
| `status` | `Resident` | **Stay** | Operational | **Move to Stay** | Operational state of admission (`ACTIVE`, `ON_NOTICE`, `CHECKED_OUT`, `CLOSED`). |
| `residentName` | `Bed` (`Accommodation`) | **Derived / Computed** | Derived | **Derived Only** | Stored text on Bed object is eliminated; active resident name is derived via active `Stay` lookup. |

---

## Domain Responsibilities Breakdown

### 1. Resident Responsibilities
The **Resident domain** is strictly responsible for managing **who the person is**.

**Resident owns ONLY:**
- System Identity (`id`, `createdAt`, `updatedAt`)
- Business Identity (`residentCode`)
- Personal Name & Contact (`fullName`, `mobileNumber`, `alternateMobile`, `email`)
- Government Identification (`documentType`, `documentNumber`)
- Family Information (`fatherOrGuardianName`, `motherName`)
- Emergency Contact Information (`emergencyContactName`, `emergencyContactRelation`, `emergencyContactPhone`)
- Residential & Correspondence Address (`permanentAddress`, `correspondenceAddress`, `city`, `state`, `pinCode`)
- Educational & Professional Affiliation (`occupation`, `employerOrCollege`)
- Personal Health & Medical Details (`bloodGroup`, `medicalNotes`)

*Boundary Constraint*: The Resident domain maintains ZERO knowledge of room numbers, bed IDs, rent amounts, security deposits, check-in dates, or admission statuses.

---

### 2. Stay Responsibilities
The **Stay domain** is strictly responsible for managing **when, where, and under what terms a person occupies accommodation**.

**Stay owns ONLY:**
- Stay System Identity (`id`, `createdAt`, `updatedAt`)
- Identity Reference (`residentId`)
- Physical Allocation Reference (`flatId`, `allocatedBedIds`)
- Admission Timeline (`checkInDate`, `checkOutDate`, `noticeDate`, `expectedCheckOutDate`)
- Commercial Contract Terms (`agreedRent`, `agreedDeposit`)
- Operational Admission Status (`status`: `ACTIVE`, `ON_NOTICE`, `CHECKED_OUT`, `CLOSED`)
- Chronological Operational Event Log (`stayEvents`: Check-in, Bed Transfer, Notice Submission, Checkout Settlement)

*Boundary Constraint*: The Stay domain does not own personal identity data (names, phone numbers, government IDs). It references a `residentId`.

---

### 3. Accommodation Responsibilities
The **Accommodation domain** is strictly responsible for managing the **physical layout and capacity of the property**.

**Accommodation owns ONLY:**
- Property Structure (`Property`, `Flat`, `Area`, `Bed`)
- Physical Capacity & Layout Hierarchy
- Bed Operational Status (`status`: `VACANT`, `OCCUPIED`, `RESERVED`, `ON_NOTICE`, `MAINTENANCE`, `BLOCKED`)
- Default Bed Pricing Rules (`defaultRent`, `defaultDeposit`)

*Boundary Constraint*: Accommodation does not store resident names, contact details, contracts, or ledger entries. Occupant details are dynamically derived by querying the active `Stay` for a given bed ID.

---

### 4. Finance Responsibilities
The **Finance domain** is strictly responsible for managing **monetary obligations and transactions**.

**Finance owns ONLY:**
- Financial Accounts (`Receivable`, `Deposit`, `Advance`, `Settlement Hold`, `Adjustment`)
- Immutable Financial Ledger (`LedgerEntry`)
- Billing Cycles & Invoices (`Bill`, `BillLine`)
- Payment Records (`Payment`)
- Settlement Allocations

*Boundary Constraint*: Finance belongs to a `Stay`. Financial balances are derived from ledger entries, never stored on `Resident` or `Stay` entities.

---

## Derived Fields Analysis

The following fields previously stored or passed in components **disappear completely as stored properties** and become **runtime derived / computed values**:

1. **`Bed.residentName` (on Accommodation `Bed` object)**:
   - *Previous*: Hardcoded text string on bed JSON object.
   - *Future*: **Derived**. Calculated dynamically by querying active `Stay` records for `allocatedBedIds.includes(bed.id)` and joining `Resident.fullName`.
2. **`Current Flat Display` (e.g. "Flat 101")**:
   - *Previous*: Format logic scattered across UI components.
   - *Future*: **Derived**. Computed by joining `Stay.flatId` with `Accommodation.Flat.name`.
3. **`Allocated Beds Display` (e.g. "B1, B2")**:
   - *Previous*: Manual regex parsing in components.
   - *Future*: **Derived**. Utility function formatting `Stay.allocatedBedIds`.
4. **`Outstanding Balance`**:
   - *Previous*: Not tracked or manually calculated.
   - *Future*: **Derived**. Calculated by summing `Finance` ledger charges minus settlements for the active `Stay`.
5. **`Current Rent & Deposit Display`**:
   - *Previous*: Read directly from `Resident` object.
   - *Future*: **Derived**. Retrieved from active `Stay.agreedRent` and `Stay.agreedDeposit`.
6. **`Occupancy Summary Metrics` (Active, On Notice, Checked Out Counts)**:
   - *Previous*: Filtered directly over `Resident.status`.
   - *Future*: **Derived**. Calculated by counting `Stay` records grouped by `Stay.status`.

---

## Implementation Notes & Sprint 7.3 Sequencing

### 1. Transitional Composite View Model (`ResidentWithActiveStay`)
To ensure zero breaking changes to the presentation layer during Sprint 7.3:
- A composite view model `ResidentWithActiveStay` will join `Resident` (identity) and active `Stay` (occupancy) at runtime.
- `useResidents()` and `useResident()` will return `ResidentWithActiveStay` objects, guaranteeing that `ResidentsPage` and `ResidentProfilePage` require zero UI refactoring.

### 2. Automatic Non-Destructive Storage Migration
- On initialization, `residentService` will run a non-destructive migration check on `localStorage.getItem('rpgms_residents')`.
- If legacy resident records contain operational fields (`flatId`, `agreedRent`, etc.):
  1. Extracts a new `Stay` record for each resident into `rpgms_stays`.
  2. Strips operational fields from `rpgms_residents`, leaving pure `Resident` records.
  3. Writes sanitized `rpgms_residents` and newly generated `rpgms_stays`.

### 3. Execution Sequence for Sprint 7.3
- **Sprint 7.3.1**: Create `src/features/stay/types/index.ts` and `stayService.ts`.
- **Sprint 7.3.2**: Implement `migrateLegacyResidentsData()` and composite view model `ResidentWithActiveStay` in `residentService.ts`.
- **Sprint 7.3.3**: Update `useResidents.ts`, `useResident.ts`, and `ResidentOnboardingWizard.tsx` atomic transactions.
- **Sprint 7.3.4**: Run `npm run build` verification and update documentation.

---

*Document frozen as authoritative contract for Sprint 7.3 migration.*  
*Saved to `docs/migration/DATA_OWNERSHIP_MATRIX.md`.*
