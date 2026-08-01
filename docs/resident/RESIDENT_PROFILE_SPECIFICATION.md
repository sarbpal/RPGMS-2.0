# Resident Profile Specification

**Version:** 1.0  
**Status:** Frozen Draft  
**Last Updated:** July 2026

---

# Related Documents

- ACCOMMODATION_ARCHITECTURE.md
- FINANCE_ARCHITECTURE.md
- RESIDENT_ARCHITECTURE.md

---

# 1. Purpose

The Resident Profile Specification defines the business information maintained about a Resident within RPGMS.

It establishes the structure, ownership, validation principles, and lifecycle of Resident Profile information independently of accommodation, financial, operational, or compliance processes.

This specification serves as the authoritative business reference for all Resident Profile functionality implemented within RPGMS.

---

# 2. Scope

This specification defines:

- Resident Profile philosophy
- Resident information categories
- Business ownership of Resident information
- Resident Profile validation principles
- Privacy principles
- Future extensibility

This specification intentionally excludes:

- Stay management
- Check-in
- Check-out
- Accommodation allocation
- Bed transfers
- Reservations
- Financial transactions
- Compliance activities
- Operational workflows

These subjects are defined by their respective business specifications.

---

# 3. Guiding Principles

The Resident Profile has been designed according to the following architectural principles.

## Resident Represents Identity

The Resident Profile represents **who the Resident is**.

It does not represent where the Resident stays, when the Resident stayed, or how the Resident was billed.

---

## Current Information Only

The Resident Profile maintains only the Resident's current information.

Historical information belongs to dedicated business domains where appropriate.

Examples include:

- Stay History
- Accommodation History
- Billing History
- Compliance History

---

## Single Source of Ownership

Every business concept owns its own information.

Resident information shall not duplicate information owned by another business domain.

Examples:

| Business Domain | Owns |
|----------------|------|
| Resident | Identity and Profile Information |
| Stay | Admission and Occupancy |
| Accommodation | Physical Allocation |
| Finance | Financial Transactions |
| Compliance | Statutory Compliance |

---

## Business Before Technology

Business requirements define the structure of the Resident Profile.

User interface design, database implementation, and software architecture shall follow the business model rather than determine it.

---

## Minimal Information Collection

Only information necessary for business operations, legal compliance, or resident services should be collected.

The Resident Profile intentionally avoids collecting unnecessary personal information.

---

## Separation of Concerns

Resident Profile information remains independent from:

- Stay Information
- Financial Information
- Accommodation Information
- Compliance Information

Each business domain is responsible for maintaining its own data.

---

# 4. Resident Profile Philosophy

The Resident Profile is a permanent business record representing a person who has interacted with the organization.

A Resident may stay in the property multiple times throughout the lifetime of the system.

Regardless of the number of Stays, there shall be only one Resident Profile.

The Resident Profile remains independent of accommodation allocation, financial transactions, and operational events.

The Resident Profile stores only the Resident's current information.

Historical operational information is maintained by the business domains responsible for those activities.

---

## Resident Philosophy

One Person

↓

One Resident Profile

↓

One or More Stays

---

The Resident Profile answers the question:

> **Who is the Resident?**

The Stay answers:

> **When did the Resident stay?**

Accommodation answers:

> **Where did the Resident stay?**

Finance answers:

> **What financial transactions occurred?**

Compliance answers:

> **What statutory obligations were completed?**

---

# 5. Resident Information Categories

Resident information is organized into logical business categories.

These categories represent business concepts only and do not imply database design or user interface layout.

The Resident Profile consists of the following information categories:

1. Personal Identity
2. Contact Information
3. Government Identification
4. Address Information
5. Emergency Contact
6. Parent / Guardian Information
7. Education / Employment Information
8. Medical Information
9. Resident Documents
10. System Generated Information

Each category owns a distinct business responsibility.

Information shall not be duplicated across categories unless required by business rules.

---

# 6. Field Behaviour

Every field within the Resident Profile follows common business behaviour definitions.

These definitions provide consistent interpretation across the entire Resident Profile.

| Behaviour | Meaning |
|-----------|---------|
| Required | Information required according to business rules |
| Editable | Information may be modified after creation |
| Unique | Value must be unique where business rules require |
| Historical | Previous values are retained |
| Sensitive | Access requires appropriate authorization |
| Searchable | Available for searching and filtering |
| Exportable | May appear in reports or exports according to organizational policy |
| System Managed | Created or maintained automatically by RPGMS |

---

## Behaviour Principles

### Required

Required fields are determined by business requirements rather than technical implementation.

Some fields may become mandatory based on organizational policy or applicable legal requirements.

---

### Editable

Editable information may be modified whenever business rules permit.

Updates always represent the Resident's current information.

---

### Unique

Uniqueness applies only where required by business rules.

Examples include:

- Resident ID
- Government Identification Numbers (where applicable)

---

### Historical

The Resident Profile does not maintain historical versions of profile information.

Historical information belongs to dedicated business domains where applicable.

---

### Sensitive

Sensitive information requires appropriate access controls.

Examples include:

- Government Identification
- Medical Information
- Resident Documents

---

### Searchable

Searchable information supports operational efficiency through searching, filtering, and reporting.

---

### Exportable

Exportable information may be included in reports, exports, and integrations according to organizational policy.

Sensitive information may be subject to additional restrictions.

---

### System Managed

System Managed fields are maintained automatically by RPGMS.

Users shall not modify these values directly.

---

# 7. Personal Identity

## Purpose

Personal Identity uniquely identifies the Resident within RPGMS.

This information represents the Resident's permanent identity and remains independent of any Stay.

---

## Business Rules

- Personal Identity belongs to the Resident Profile.
- Personal Identity remains independent of every Stay.
- A Resident Profile represents one individual only.
- Personal Identity stores the Resident's current identity information.
- Supported values are defined by organizational policy where applicable.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Resident ID | Yes | No | Yes | Yes | No | Yes | Yes | Yes | Permanent system identifier |
| Full Name | Yes | Yes | No | No | No | Yes | Yes | No | Legal or official name |
| Preferred Name | No | Yes | No | No | No | Yes | Yes | No | Optional display name |
| Date of Birth | No | Yes | No | No | Yes | Yes | Restricted | No | Optional |
| Gender | No | Yes | No | No | No | Yes | Yes | No | Supported values defined by organizational policy |
| Nationality | No | Yes | No | No | No | Yes | Yes | No | Optional |
| Marital Status | No | Yes | No | No | No | Yes | Yes | No | Optional |
| Photograph | No | Yes | No | No | Yes | No | Restricted | No | Optional resident photograph |

---

## Business Notes

### Resident Identity

The Resident Profile uniquely identifies a person within RPGMS.

Regardless of the number of admissions, only one Resident Profile shall exist for the same individual.

---

### Current Information

The Resident Profile stores only the Resident's current identity information.

Historical identity changes are outside the scope of the current MVP.

# 8. Contact Information

## Purpose

Contact Information records the Resident's preferred communication details.

This information enables the organization to communicate with the Resident during enquiries, admission, occupancy, billing, operational activities, and after checkout where required.

Contact Information belongs to the Resident Profile and remains independent of any Stay.

---

## Business Rules

- Contact Information belongs to the Resident Profile.
- At least one contact number shall be provided.
- A Resident may provide a Voice Call Number, a WhatsApp Number, or both.
- The Voice Call Number and WhatsApp Number may be the same or different.
- Alternate Contact Number is optional.
- Email Address is optional.
- Contact Information may be updated whenever required.
- The Resident Profile stores only the Resident's current contact information.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Voice Call Number | Conditional* | Yes | No | No | No | Yes | Yes | No | Primary number for voice communication |
| WhatsApp Number | Conditional* | Yes | No | No | No | Yes | Yes | No | WhatsApp communication |
| Alternate Contact Number | No | Yes | No | No | No | Yes | Yes | No | Optional secondary contact number |
| Email Address | No | Yes | No | No | No | Yes | Yes | No | Optional |

*At least one of Voice Call Number or WhatsApp Number shall be provided.

---

## Business Notes

### Communication Preference

Residents may choose to provide:

- Voice Call Number only
- WhatsApp Number only
- Both Voice Call and WhatsApp Numbers

The system shall not assume both numbers are identical.

---

### Current Information

The Resident Profile stores only the Resident's current contact information.

Historical contact information is outside the scope of the current MVP.

---

# 9. Government Identification

## Purpose

Government Identification records official identity numbers voluntarily provided by the Resident or collected in accordance with organizational policy or applicable legal requirements.

Government Identification belongs to the Resident Profile and remains independent of any Stay.

Digital copies of documents are managed separately under **Resident Documents**.

---

## Business Rules

- Government Identification belongs to the Resident Profile.
- Collection of Government Identification shall be governed by organizational policy and applicable legal requirements.
- Government Identification Numbers shall store only the current values.
- Government Identification documents are managed separately under Resident Documents.
- Unique identifiers may be validated according to organizational policy.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Aadhaar Number | No | Yes | Yes* | No | Yes | Yes | Restricted | No | Optional |
| PAN Number | No | Yes | Yes* | No | Yes | Yes | Restricted | No | Optional |
| Passport Number | No | Yes | Yes* | No | Yes | Yes | Restricted | No | Optional |
| Driving Licence Number | No | Yes | Yes* | No | Yes | Yes | Restricted | No | Optional |
| Voter ID Number | No | Yes | Yes* | No | Yes | Yes | Restricted | No | Optional |
| Other Government ID | No | Yes | No | No | Yes | Yes | Restricted | No | Optional |

*Subject to organizational policy.

---

## Business Notes

### Current Information

The Resident Profile stores only the Resident's current Government Identification information.

Historical values are outside the scope of the current MVP.

---

### Separation from Documents

Government Identification records business information only.

Digital copies of identity documents are maintained separately under the Resident Documents category.

For example:

- Aadhaar Number belongs to Government Identification.
- Aadhaar Card PDF or image belongs to Resident Documents.

---

### Privacy

Government Identification information is classified as Sensitive Information.

Access shall be restricted to authorized personnel according to organizational policy.

---

# 10. Address Information

## Purpose

Address Information records the Resident's place of residence and correspondence for operational, legal, and administrative purposes.

The Resident Profile maintains only the Resident's current address information.

---

## Business Rules

- Address Information belongs to the Resident Profile.
- The Resident Profile supports two address types:
  - Permanent Address
  - Correspondence Address (Optional)
- Permanent Address should be available for every Resident wherever possible.
- Correspondence Address is optional.
- Permanent Address and Correspondence Address may be identical.
- Address Information may be updated whenever required.
- The Resident Profile stores only the Resident's current address information.

---

## Permanent Address

| Field | Required |
|--------|:--------:|
| Address Line 1 | Yes* |
| Address Line 2 | No |
| Landmark | No |
| City | Yes* |
| State / Province | Yes* |
| Postal Code | Yes* |
| Country | Yes* |

---

## Correspondence Address

| Field | Required |
|--------|:--------:|
| Address Line 1 | No |
| Address Line 2 | No |
| Landmark | No |
| City | No |
| State / Province | No |
| Postal Code | No |
| Country | No |

*Subject to organizational policy.

---

## Business Notes

### Permanent Address

Permanent Address represents the Resident's long-term residential address.

---

### Correspondence Address

Correspondence Address is intended for situations where communication should be sent to an address different from the Permanent Address.

If Correspondence Address is not provided, the Permanent Address may be used.

---

### Same as Permanent Address

RPGMS may allow users to copy the Permanent Address into the Correspondence Address where both addresses are identical.

---

### Current Information

The Resident Profile stores only the Resident's current address information.

Historical address information is outside the scope of the current MVP.

---

# 11. Emergency Contact

## Purpose

Emergency Contact identifies the person whom the organization should contact in the event of an emergency involving the Resident.

Emergency Contact is independent of Parent or Guardian Information.

Emergency Contact belongs to the Resident Profile and remains independent of any Stay.

---

## Business Rules

- Every Resident should have one Primary Emergency Contact.
- Additional Emergency Contacts may be introduced in future versions.
- Emergency Contact may be changed whenever required.
- Emergency Contact may be any trusted individual nominated by the Resident.
- Emergency Contact information belongs to the Resident Profile.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Contact Name | Yes | Yes | No | No | No | Yes | Yes | No | Full name |
| Relationship | Yes | Yes | No | No | No | Yes | Yes | No | Relationship to Resident |
| Voice Call Number | Conditional* | Yes | No | No | No | Yes | Yes | No | Voice communication |
| WhatsApp Number | Conditional* | Yes | No | No | No | Yes | Yes | No | WhatsApp communication |
| Alternate Contact Number | No | Yes | No | No | No | Yes | Yes | No | Optional |
| Email Address | No | Yes | No | No | No | Yes | Yes | No | Optional |

*At least one contact number shall be provided.

---

## Business Notes

### Emergency Contact

Emergency Contact represents the person nominated by the Resident for emergency situations.

This person does not need to be a Parent or Guardian.

---

### Relationship

Relationship is descriptive only.

Typical values include:

- Father
- Mother
- Brother
- Sister
- Guardian
- Spouse
- Friend
- Employer
- HR Representative
- Corporate Coordinator
- Other

---

### Current Information

The Resident Profile stores only the Resident's current Emergency Contact information.

Historical Emergency Contact information is outside the scope of the current MVP.

# 12. Parent / Guardian Information

## Purpose

Parent / Guardian Information records the primary parent, guardian, or responsible adult associated with the Resident for administrative and reference purposes.

Parent / Guardian Information is independent of the Emergency Contact and does not necessarily represent the person to be contacted during emergencies.

Parent / Guardian Information belongs to the Resident Profile and remains independent of any Stay.

---

## Business Rules

- Parent / Guardian Information belongs to the Resident Profile.
- Parent / Guardian Information is optional unless required by organizational policy.
- A Resident may provide Parent information, Guardian information, or both.
- Parent / Guardian Information may be updated whenever required.
- Parent / Guardian Information is intended for administrative and reference purposes.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Primary Parent / Guardian Name | No | Yes | No | No | No | Yes | Yes | No | Primary parent or guardian |
| Relationship | No | Yes | No | No | No | Yes | Yes | No | Father, Mother, Guardian, etc. |
| Voice Call Number | No | Yes | No | No | No | Yes | Yes | No | Contact number |
| WhatsApp Number | No | Yes | No | No | No | Yes | Yes | No | Optional |
| Email Address | No | Yes | No | No | No | Yes | Yes | No | Optional |

---

## Business Notes

### Parent or Guardian

The Resident may provide information relating to:

- Father
- Mother
- Legal Guardian
- Other Responsible Adult

The terminology remains intentionally flexible to support different family structures and living arrangements.

---

### Administrative Reference

Parent / Guardian Information is maintained primarily for administrative and reference purposes.

Emergency situations should normally use the Emergency Contact information unless organizational policy specifies otherwise.

---

### Current Information

The Resident Profile stores only the Resident's current Parent / Guardian information.

Historical Parent / Guardian information is outside the scope of the current MVP.

---

# 13. Education / Employment Information

## Purpose

Education / Employment Information records the Resident's current educational or professional affiliation.

This information supports administration, communication, reporting, and operational activities.

The Resident Profile stores only the Resident's current Education / Employment Information.

---

## Business Rules

- Education / Employment Information belongs to the Resident Profile.
- Occupation shall be selected from the predefined list of supported occupation types.
- Applicable fields depend on the selected Occupation.
- Education / Employment Information may be updated whenever required.
- The Resident Profile stores only the current information.

---

## Supported Occupation Types

The MVP supports the following occupation types:

- Student
- Working Professional
- Self-Employed
- Business Owner
- Retired
- Unemployed
- Other

Future versions of RPGMS may expand this list as business requirements evolve.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Occupation | Yes | Yes | No | No | No | Yes | Yes | No | Selected from supported occupation types |
| Organization / Institution Name | No* | Yes | No | No | No | Yes | Yes | No | Company, College, University, Institute, etc. |
| Department | No | Yes | No | No | No | Yes | Yes | No | Department or Faculty |
| Course / Designation | No | Yes | No | No | No | Yes | Yes | No | Course or Job Designation |
| Employee / Student ID | No | Yes | No | No | Yes | Yes | Restricted | No | Optional |
| Work / Study Location | No | Yes | No | No | No | Yes | Yes | No | Office or Campus Location |

*Required only where applicable.

---

## Business Notes

### Occupation

Occupation determines the type of educational or employment information applicable to the Resident.

The predefined occupation list ensures consistency across searching, filtering, reporting, and analytics.

---

### Organization / Institution

A single field records the Resident's current organization or institution.

Examples include:

- Company
- College
- University
- Training Institute
- Business Name

This field remains independent of any future Organization or Corporate Account functionality.

---

### Current Information

The Resident Profile stores only the Resident's current Education / Employment Information.

Historical information is outside the scope of the current MVP.

---

# 14. Medical Information

## Purpose

Medical Information records health-related details voluntarily provided by the Resident that may assist the organization during emergencies or accommodation management.

All Medical Information is optional and is recorded only if voluntarily disclosed by the Resident.

The Resident Profile stores only the Resident's current Medical Information.

It is not intended to serve as a comprehensive medical record.

---

## Business Rules

- Medical Information belongs to the Resident Profile.
- Providing Medical Information is entirely voluntary.
- No Resident shall be required to disclose Medical Information unless required by applicable law or organizational policy.
- The absence of Medical Information shall not prevent Resident registration, admission, or check-in.
- Residents are responsible for the accuracy of any Medical Information they choose to provide.
- Medical Information may be updated or removed whenever required.
- The Resident Profile stores only the Resident's current Medical Information.

---

## Field Specification

| Field | Required | Editable | Unique | Historical | Sensitive | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:------:|:----------:|:---------:|:----------:|:----------:|:--------------:|---------|
| Blood Group | No | Yes | No | No | Yes | Yes | Restricted | No | Voluntarily provided |
| Known Medical Conditions | No | Yes | No | No | Yes | No | Restricted | No | Voluntarily provided |
| Known Allergies | No | Yes | No | No | Yes | No | Restricted | No | Voluntarily provided |
| Current Medications | No | Yes | No | No | Yes | No | Restricted | No | Voluntarily provided |
| Medical Notes | No | Yes | No | No | Yes | No | Restricted | No | Voluntarily provided |

---

## Business Notes

### Voluntary Disclosure

Medical Information is collected only if the Resident voluntarily chooses to provide it.

Residents may decline to provide any or all Medical Information.

---

### Scope

Medical Information is intended solely to support emergency response and operational awareness.

It is not a substitute for professional medical records.

---

### Privacy

Medical Information is classified as Sensitive Information.

Access shall be restricted to authorized personnel in accordance with organizational policy and applicable privacy regulations.

---

### Current Information

The Resident Profile stores only the Resident's current Medical Information.

Historical Medical Information is outside the scope of the current MVP.

# 15. Resident Documents

## Purpose

Resident Documents records digital copies of documents voluntarily or operationally collected for resident verification, compliance, and administrative purposes.

Resident Documents belong to the Resident Profile and remain independent of any Stay.

Resident Documents store uploaded files only. Business information contained within those documents is maintained separately within the appropriate Resident Profile categories.

---

## Business Rules

- Resident Documents belong to the Resident Profile.
- Document collection shall be governed by organizational policy and applicable legal requirements.
- A Resident may have zero or more documents.
- Multiple document types may be stored for the same Resident.
- A document may be replaced whenever a newer version is provided.
- The Resident Profile maintains only the current version of each document.
- Historical document versions are outside the scope of the current MVP.

---

## Supported Document Categories

The MVP supports the following document categories:

- Photograph
- Aadhaar Card
- PAN Card
- Passport
- Driving Licence
- Voter ID
- College / Student Identity Card
- Employee Identity Card
- Rent Agreement (if applicable)
- Other Supporting Documents

Future versions of RPGMS may introduce additional document categories.

---

## Document Information

Each uploaded document records the following information.

| Field | Required | Editable | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:----------:|:----------:|:--------------:|---------|
| Document Type | Yes | No | Yes | Yes | No | Selected from supported document categories |
| File Name | Yes | No | Yes | Yes | Yes | Original or system-generated file name |
| Upload Date | Yes | No | Yes | Yes | Yes | Automatically recorded |
| Uploaded By | Yes | No | Yes | Yes | Yes | System generated |
| Verification Status | Yes | Yes | Yes | Yes | No | Pending Review, Verified, Rejected, Not Applicable |
| Remarks | No | Yes | Yes | Yes | No | Optional administrative remarks |

---

## Business Notes

### Current Documents

The Resident Profile stores only the current document for each document type.

If a document is replaced, the latest uploaded document becomes the active document.

Historical document versions are outside the scope of the current MVP.

---

### Separation from Resident Information

Resident Documents store uploaded files only.

Business information extracted from those documents belongs to the appropriate Resident Profile category.

Examples:

- Aadhaar Number belongs to Government Identification.
- Aadhaar Card image belongs to Resident Documents.

This separation allows documents to be replaced without affecting business information.

---

### Verification Status

Verification Status indicates whether the organization has reviewed the uploaded document.

Verification Status represents an internal administrative process only.

It does not imply verification by any government authority.

---

### Privacy

Resident Documents may contain sensitive personal information.

Access shall be restricted to authorized personnel in accordance with organizational policy and applicable privacy regulations.

---

# 16. System Generated Information

## Purpose

System Generated Information records metadata automatically maintained by RPGMS to support identification, auditing, reporting, and operational management.

These fields are managed exclusively by RPGMS and are not directly editable by users.

System Generated Information belongs to the Resident Profile and remains independent of any Stay.

---

## Business Rules

- System Generated Information is created and maintained automatically by RPGMS.
- Users shall not directly modify System Generated Information.
- System Generated Information supports auditing, reporting, integration, and operational management.
- Values may change only through authorized system processes.

---

## Field Specification

| Field | Required | Editable | Searchable | Exportable | System Managed | Remarks |
|--------|:-------:|:--------:|:----------:|:----------:|:--------------:|---------|
| Resident ID | Yes | No | Yes | Yes | Yes | Permanent Resident identifier |
| Resident Status | Yes | No | Yes | Yes | Yes | Derived from Resident Lifecycle |
| Created On | Yes | No | Yes | Yes | Yes | Automatically recorded |
| Created By | Yes | No | Yes | Yes | Yes | System recorded |
| Last Updated On | Yes | No | Yes | Yes | Yes | Automatically maintained |
| Last Updated By | Yes | No | Yes | Yes | Yes | System recorded |
| Archived Flag | Yes | No | Yes | Yes | Yes | Indicates archived Resident Profile |
| Internal Notes | No | Yes* | Yes | Restricted | Yes | Administrative notes |

*Editable only by authorized users according to organizational policy.

---

## Business Notes

### Resident ID

Resident ID is the permanent identifier assigned by RPGMS.

The Resident ID never changes regardless of the number of Stays completed by the Resident.

---

### Resident Status

Resident Status reflects the Resident's current lifecycle state.

The values are defined by the Resident Architecture.

---

### Audit Information

Creation and modification information is maintained automatically by RPGMS.

These fields support accountability, auditing, and operational reporting.

---

### Internal Notes

Internal Notes are intended solely for authorized administrative use.

Internal Notes are not visible to Residents and should not contain information that violates organizational policy or applicable privacy regulations.

---

# 17. Validation Principles

## Purpose

Validation Principles define the business rules governing the quality, consistency, and integrity of Resident Profile information.

These principles apply regardless of user interface, database design, or software implementation.

---

## Business Principles

### Business-Driven Validation

Validation rules shall be based on business requirements rather than technical implementation.

---

### Current Information

The Resident Profile stores only the Resident's current information.

Historical information belongs to dedicated business domains where applicable.

---

### Consistency

Resident information shall be recorded using standardized formats wherever practical.

Standardization improves:

- Searching
- Filtering
- Reporting
- Analytics
- Data quality

Examples include:

- Occupation
- Relationship
- Gender
- Nationality
- Country

---

### Uniqueness

Business identifiers designated as unique shall not be duplicated across Resident Profiles.

Examples include:

- Resident ID
- Aadhaar Number
- PAN Number
- Passport Number

Subject to organizational policy.

---

### Optional Information

Information identified as optional shall not prevent Resident registration, admission, or check-in unless required by applicable law or organizational policy.

---

### Sensitive Information

Sensitive information shall be collected only where necessary.

Access shall be restricted according to organizational policy.

---

### Separation of Responsibility

The Resident Profile validates only Resident information.

Validation relating to:

- Stay
- Accommodation
- Finance
- Compliance

belongs to their respective business domains.

# 18. Privacy & Data Ownership

## Purpose

Privacy and Data Ownership define the principles governing the collection, maintenance, access, protection, and use of Resident information within RPGMS.

These principles ensure that Resident information is managed responsibly while supporting the organization's legitimate operational requirements.

---

## Business Principles

### Resident Information

Resident information represents personal information relating to an individual Resident.

The organization acts as the custodian of this information for legitimate business, operational, legal, and compliance purposes.

---

### Data Minimization

Only information necessary for business operations, legal compliance, resident services, or organizational administration should be collected.

Unnecessary collection of personal information should be avoided.

---

### Current Information

The Resident Profile stores only the Resident's current information.

Historical information shall be maintained only where explicitly owned by another business domain.

---

### Sensitive Information

The following information is considered Sensitive Information:

- Government Identification
- Medical Information
- Resident Documents

Access to Sensitive Information shall be restricted to authorized personnel according to organizational policy.

---

### Operational Use

Resident information shall be used only for legitimate operational purposes including:

- Resident Management
- Accommodation Management
- Financial Operations
- Compliance Activities
- Administrative Reporting
- Statutory Requirements

Resident information shall not be used for purposes unrelated to the operation of the organization.

---

### Access Control

Access to Resident information shall be based on organizational responsibilities.

Different user roles may have different levels of access according to organizational policy.

---

### Document Protection

Resident Documents may contain personally identifiable information.

Appropriate safeguards should be implemented to prevent unauthorized access, disclosure, modification, or deletion.

---

### Compliance

The organization is responsible for managing Resident information in accordance with applicable laws, regulations, and organizational policies.

---

# 19. Future Extensions

The Resident Profile has been intentionally designed to support future enhancements without requiring structural redesign.

Potential future enhancements include:

- Multiple Emergency Contacts
- Multiple Parent / Guardian Records
- Resident Preferences
- Communication Preferences
- Resident Categories
- Resident Tags
- Organization / Corporate Associations
- Resident Verification Workflow
- Digital Signatures
- Resident Consent Records
- Resident Document Versioning
- International Resident Support
- Integration with Stay Compliance records
- Biometric Identity Integration
- Resident Self-Service Portal

Future enhancements shall preserve the architectural principles defined within this specification.

---

# 20. Design Principles

The Resident Profile has been designed around the following business principles.

These principles shall guide all future enhancements.

---

## Resident Represents Identity

The Resident Profile answers the question:

> **Who is the Resident?**

It does not answer:

- Where the Resident stayed.
- When the Resident stayed.
- What financial transactions occurred.
- Which compliance activities were completed.

---

## Single Business Ownership

Every business concept owns its own information.

Business information shall not be duplicated across domains.

| Business Domain | Owns |
|----------------|------|
| Resident | Identity and Profile Information |
| Stay | Occupancy and Stay Lifecycle |
| Accommodation | Physical Allocation |
| Finance | Financial Transactions |
| Compliance | Statutory Compliance |

---

## Current Information Only

The Resident Profile stores only current information.

Historical information belongs to the business domain responsible for creating that history.

---

## Separation of Concerns

Resident information remains independent from:

- Stay
- Accommodation
- Finance
- Compliance

This separation ensures that changes in one business domain do not unnecessarily affect another.

---

## Business Before Technology

Business requirements determine the structure of the Resident Profile.

Technology implementation shall follow the business model rather than define it.

---

## Minimal Data Collection

Only information that provides business value should be collected.

The Resident Profile intentionally avoids unnecessary collection of personal information.

---

## Future-Aware Design

The Resident Profile has been designed so future functionality can be introduced without major structural redesign.

---

# 21. Related Business Domains

The Resident Profile interacts with several business domains but does not own their information.

| Business Domain | Relationship |
|----------------|--------------|
| Resident | Owns Resident identity and profile information |
| Stay | Uses the Resident Profile during admission and occupancy |
| Accommodation | Allocates physical space to a Stay |
| Finance | Creates financial transactions for a Stay |
| Compliance | Records statutory compliance associated with a Stay |

The Resident Profile remains the authoritative source of Resident identity throughout all business domains.

---

# 22. Out of Scope

The following information intentionally does not belong to the Resident Profile.

It is maintained by other business domains.

### Stay Information

- Check-in
- Checkout
- Notice
- Stay Status
- Stay History

### Accommodation Information

- Flat
- Area
- Bed
- Bed Transfers
- Room Changes

### Financial Information

- Rent
- Security Deposit
- Billing Cycle
- Outstanding Dues
- Payments
- Ledger

### Compliance Information

- Police Intimation
- Police Intimation PDF
- Compliance Status
- Statutory Documents related to a Stay

These subjects are defined by their respective business specifications.

---

# 23. Change Log

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial Resident Profile Specification |

---

# Document Status

**Status:** Frozen v1.0

This document defines the business specification for the Resident Profile within RPGMS.

Future revisions shall preserve the architectural principles established by this specification unless superseded by an approved architectural decision.

---

Implementation Status

Version 1.0

Implemented in REF-001.