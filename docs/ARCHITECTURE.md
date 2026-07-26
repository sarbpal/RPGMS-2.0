# RPGMS 2.0 – Software Architecture

---

## Document Information

**Document ID:** ARCHITECTURE.md

**Version:** 3.0

**Status:** Approved Software Architecture

**Owner:** RPGMS Architecture

**Last Updated:** 26 July 2026

---

# Purpose

This document defines the software architecture of RPGMS.

Its purpose is to describe how the software is organised to implement the business architecture defined by RPGMS while remaining maintainable, scalable and consistent throughout the lifetime of the product.

This document establishes the architectural principles, responsibilities and structural boundaries that guide software development across every module of the application.

---

# Scope

This document defines:

- Software architecture
- Architectural principles
- Architectural layers
- Domain architecture
- Cross-cutting architectural services
- Data architecture
- Event architecture
- Security architecture
- User interface architecture
- Architectural governance

This document intentionally does **not** define:

- Business concepts
- Business policies
- Business rules
- Operational workflows
- Database schema
- API contracts
- User interface implementation
- Product roadmap

These responsibilities belong to their respective governance documents.

---

# Relationship to Other Documents

RPGMS documentation follows a layered governance model.

Each document has a single, clearly defined responsibility.

### BUSINESS_BLUEPRINT.md

Defines:

> **What the business is.**

It describes the business concepts, business relationships and business lifecycles that exist independently of software implementation.

---

### BUSINESS_RULES.md

Defines:

> **What the business must do.**

It specifies the mandatory business rules governing every operational and financial activity within RPGMS.

---

### ARCHITECTURE.md

Defines:

> **How the software realises the business.**

It explains how the software is organised to implement the Business Blueprint and enforce the Business Rules.

---

Together these documents establish a complete architectural foundation for RPGMS.

---

# Architectural Objectives

The architecture of RPGMS is designed to achieve the following objectives:

- Alignment with the Business Blueprint
- Enforcement of Business Rules
- Clear separation of responsibilities
- High maintainability
- Long-term scalability
- Predictable evolution
- Consistent implementation
- Simplicity over unnecessary complexity

Every architectural decision should support one or more of these objectives.

---

# Architectural Philosophy

The software architecture exists to serve the business.

Business architecture determines **what** the software must represent.

Business rules determine **what** the software must enforce.

Software architecture determines **how** those responsibilities are organised into a maintainable and scalable system.

Technology choices may evolve over time.

The architectural principles defined in this document are intended to remain stable throughout the lifetime of RPGMS.

---

# Architectural Principles

The following principles govern every architectural decision made within RPGMS.

These principles are intended to remain stable regardless of programming language, framework or infrastructure.

---

## AP-001 Business Before Technology

### Principle

Software architecture shall always serve the business architecture.

Technology choices shall support business objectives rather than define them.

### Rationale

Business requirements evolve more slowly than technology.

By placing business architecture first, RPGMS remains resilient to changes in implementation technology.

---

## AP-002 Clear Separation of Responsibilities

### Principle

Every architectural layer, domain, service and component shall have one clearly defined responsibility.

Responsibilities shall not overlap unnecessarily.

### Rationale

Clear responsibility simplifies development, testing, maintenance and future evolution.

---

## AP-003 Domain Ownership

### Principle

Every business capability shall have exactly one owning software domain.

The owning domain is responsible for implementing:

- Business behaviour
- Business validation
- Business state
- Domain services

Other domains may reference owned information but shall not duplicate ownership.

### Rationale

Single ownership prevents inconsistent implementations and conflicting business logic.

---

## AP-004 Single Source of Truth

### Principle

Every business fact shall have one authoritative software representation.

Derived information shall originate from its authoritative source rather than independent duplication.

### Rationale

A single source of truth improves consistency and reduces maintenance complexity.

---

## AP-005 Layered Responsibilities

### Principle

Software responsibilities shall be organised into clearly defined architectural layers.

Each layer shall depend only upon responsibilities beneath it.

Higher layers coordinate behaviour.

Lower layers implement specialised responsibilities.

### Rationale

Layered architecture improves maintainability and reduces coupling.

---

## AP-006 Business Logic Belongs to the Domain

### Principle

Business rules and business calculations shall be implemented within the domain responsible for that business capability.

Presentation, orchestration and infrastructure layers shall not duplicate business logic.

### Rationale

Business behaviour should exist in exactly one location.

---

## AP-007 Feature Cohesion

### Principle

Each feature module shall own the complete implementation of its business capability.

Implementation details belonging to one feature shall remain encapsulated within that feature wherever practical.

### Rationale

Feature cohesion improves maintainability and enables independent evolution.

---

## AP-008 Simplicity Over Complexity

### Principle

Architectural solutions shall remain as simple as possible while satisfying demonstrated business requirements.

Additional complexity shall only be introduced when justified by clear architectural benefit.

### Rationale

Simple architectures are easier to understand, maintain and extend.

---

## AP-009 Explicit Dependencies

### Principle

Dependencies between architectural components shall remain explicit and directional.

Circular dependencies shall be avoided.

Implementation details shall never become architectural dependencies.

### Rationale

Explicit dependency management preserves architectural integrity.

---

## AP-010 Event-Driven Accountability

### Principle

Significant business operations shall be represented as Business Events.

Architectural services such as Audit, Notifications and Reporting shall derive behaviour from those events rather than directly from user interface actions.

### Rationale

An event-driven approach improves traceability, extensibility and consistency across the application.

---

## AP-011 Historical Integrity

### Principle

The architecture shall preserve historical business truth.

Architectural decisions shall support immutable business history rather than permitting historical modification.

### Rationale

Historical integrity is essential for operational trust, financial accuracy and auditability.

---

## AP-012 Evolution Without Disruption

### Principle

The architecture shall support future expansion without requiring fundamental redesign of existing business domains.

New capabilities shall extend the architecture rather than replace established responsibilities.

### Rationale

Long-term stability enables predictable growth while protecting existing functionality.

---

# Architectural Principles Summary

The architecture of RPGMS is guided by a small set of stable principles:

- Business before technology
- Clear ownership
- Single responsibility
- Single source of truth
- Layered organisation
- Feature cohesion
- Event-driven accountability
- Historical integrity
- Evolution through extension

These principles provide the foundation for every architectural decision made within the project.

---

# Layered Architecture

RPGMS adopts a layered software architecture to achieve clear separation of responsibilities.

Each layer has a well-defined purpose and communicates only with the layers immediately adjacent to it.

This separation improves maintainability, testability and long-term scalability.

---

## Architectural Layers

The software is organised into five primary layers.

```text
Presentation Layer
        │
        ▼
Application Layer
        │
        ▼
Domain Layer
        │
        ▼
Infrastructure Layer
        │
        ▼
Persistence Layer
```

Each layer performs a distinct architectural responsibility.

---

## Presentation Layer

### Responsibility

The Presentation Layer provides the user interface through which users interact with RPGMS.

It is responsible for:

- Rendering user interface components
- Collecting user input
- Displaying business information
- Presenting workflow state
- Initiating user actions

### The Presentation Layer shall not:

- Implement business rules
- Perform business calculations
- Access persistence directly
- Coordinate multiple business domains

---

## Application Layer

### Responsibility

The Application Layer coordinates business workflows.

It acts as the bridge between the Presentation Layer and the Domain Layer.

Typical responsibilities include:

- Coordinating multiple business domains
- Executing application use cases
- Preparing View Models
- Managing workflow state
- Handling user requests
- Coordinating transactions

The Application Layer orchestrates business operations but does not own business behaviour.

---

## Coordinators

Where a workflow spans multiple business domains, the Application Layer may define a Coordinator.

Examples include:

- Stay Workspace Coordinator
- Admission Coordinator
- Checkout Coordinator
- Reservation Coordinator

A Coordinator is responsible for orchestrating a single business workflow.

A Coordinator shall not:

- Contain business rules
- Perform business calculations
- Access infrastructure directly
- Render user interface components

---

## Domain Layer

### Responsibility

The Domain Layer implements the business architecture.

Every software domain corresponds to an owning business domain defined in the Business Blueprint.

The Domain Layer owns:

- Business entities
- Business services
- Domain validation
- Business calculations
- Domain events
- Aggregate consistency

Business behaviour shall exist only within the Domain Layer.

---

## Infrastructure Layer

### Responsibility

The Infrastructure Layer provides technical capabilities required by the application.

Examples include:

- Database access
- External services
- Authentication providers
- Notification providers
- File storage
- Logging
- Repository implementations

Infrastructure implements technical concerns while remaining independent of business behaviour.

---

## Persistence Layer

### Responsibility

The Persistence Layer provides durable storage for business information.

Persistence technologies may evolve without requiring changes to business architecture.

The Persistence Layer shall not contain business rules.

---

# Dependency Direction

Dependencies always flow downward through the architecture.

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
Infrastructure
        │
        ▼
Persistence
```

Lower layers shall never depend upon higher layers.

---

# Layer Communication Rules

## Presentation → Application

Presentation components invoke application workflows.

Presentation never bypasses the Application Layer.

---

## Application → Domain

Application coordinates domain behaviour.

Application never duplicates business rules.

---

## Domain → Infrastructure

The Domain Layer communicates through defined abstractions.

The Domain Layer remains independent of implementation technologies.

---

## Infrastructure → Persistence

Infrastructure manages storage and integration concerns.

Persistence details remain encapsulated within Infrastructure.

---

# Layer Responsibilities Summary

| Layer | Primary Responsibility |
|--------|------------------------|
| Presentation | User interaction |
| Application | Workflow orchestration |
| Domain | Business behaviour |
| Infrastructure | Technical services |
| Persistence | Durable storage |

Together these layers provide a stable architectural framework that separates business concerns from technical implementation while preserving alignment with the Business Blueprint and Business Rules.

---

# Domain Architecture

The Domain Architecture defines how the software implements the business domains described in the Business Blueprint.

Each Software Domain is responsible for implementing one Business Domain.

Software Domains own business behaviour.

Cross-domain workflows are coordinated by the Application Layer.

Software Domains communicate through well-defined interfaces and Business Events rather than implementation details.

---

# Domain Responsibilities

Every Software Domain shall:

- Implement one Business Domain
- Own its business behaviour
- Enforce Business Rules
- Maintain domain consistency
- Publish Business Events
- Expose well-defined public services

Software Domains shall not duplicate responsibilities owned by another domain.

---

# Core Software Domains

The following domains form the core architecture of RPGMS.

---

## Dashboard Domain

### Purpose

Provides operational visibility across the application.

### Responsibilities

- Operational summaries
- Key performance indicators
- Alerts
- Business insights

### Owns

- Dashboard Views
- Dashboard Services

Dashboard does not own business data.

---

## Accommodation Domain

### Purpose

Implements the physical accommodation model.

### Responsibilities

- Property
- Flats
- Areas
- Beds
- Occupancy availability

### Owns

- Property
- Flat
- Area
- Bed

Produces Business Events including:

- Bed Created
- Bed Status Changed
- Bed Blocked
- Bed Released

---

## Resident Domain

### Purpose

Implements permanent resident identity.

### Responsibilities

- Resident profile
- Personal information
- Contact information
- Identity documents

### Owns

- Resident

Produces Business Events including:

- Resident Created
- Resident Updated
- Resident Archived

---

## Stay Domain

### Purpose

Implements operational residency.

### Responsibilities

- Admission
- Stay lifecycle
- Bed allocation
- Operational resources
- Checkout

### Owns

- Stay

Produces Business Events including:

- Stay Created
- Bed Allocated
- Stay Checked Out
- Stay Closed

---

## Reservation Domain

### Purpose

Implements reservation management.

### Responsibilities

- Reservation lifecycle
- Reservation validity
- Reservation conversion
- Reservation cancellation

### Owns

- Reservation

Produces Business Events including:

- Reservation Created
- Reservation Confirmed
- Reservation Cancelled
- Reservation Converted

---

## Finance Domain

### Purpose

Implements financial accounting.

### Responsibilities

- Charges
- Payments
- Ledger
- Deposits
- Settlement

### Owns

- Charge
- Payment
- Ledger
- Deposit

Produces Business Events including:

- Charge Raised
- Payment Received
- Deposit Collected
- Settlement Completed

---

## Maintenance Domain

### Purpose

Implements maintenance management.

### Responsibilities

- Maintenance requests
- Work orders
- Resolution tracking

Produces Business Events including:

- Maintenance Reported
- Work Assigned
- Work Completed

---

## Complaints Domain

### Purpose

Implements complaint management.

### Responsibilities

- Complaint registration
- Investigation
- Resolution

Produces Business Events including:

- Complaint Logged
- Complaint Escalated
- Complaint Closed

---

## Reporting Domain

### Purpose

Provides business reporting.

### Responsibilities

- Report generation
- Business analytics
- Operational summaries

Reporting derives information from other domains.

Reporting owns no business entities.

---

## Notification Domain

### Purpose

Implements business communication.

### Responsibilities

- Notification generation
- Delivery coordination
- Communication history

Notifications derive from Business Events.

Notifications do not modify business data.

---

## Configuration Domain

### Purpose

Implements business configuration.

### Responsibilities

- Business defaults
- Operational policies
- Configurable behaviour

Configuration influences future operations but does not modify historical business records.

---

# Domain Independence

Software Domains remain independently maintainable.

Domains communicate through:

- Public services
- Business Events
- Shared contracts

Domains shall never depend upon another domain's internal implementation.

---

# Cross-Domain Workflows

Business workflows frequently involve multiple domains.

Examples include:

Admission

```text
Reservation
        │
        ▼
Resident
        │
        ▼
Stay
        │
        ▼
Accommodation
        │
        ▼
Finance
```

Checkout

```text
Stay
        │
        ▼
Finance
        │
        ▼
Settlement
        │
        ▼
Notification
```

The Application Layer coordinates these workflows.

Individual domains remain responsible only for their own business behaviour.

---

# Domain Architecture Summary

Software Domains provide the primary organisational structure of RPGMS.

Each domain owns one business capability.

Each domain enforces its own Business Rules.

Cross-domain workflows are coordinated rather than shared.

This architecture enables independent evolution while preserving business consistency across the application.

---

# Cross-Cutting Architectural Services

Cross-Cutting Architectural Services provide shared technical and application capabilities that support multiple Software Domains.

Unlike Software Domains, Architectural Services do not own business concepts or business behaviour.

Their purpose is to provide reusable capabilities while preserving the independence of each Software Domain.

---

# Architectural Service Principles

Every Architectural Service shall:

- Support multiple Software Domains
- Remain independent of business ownership
- Expose well-defined interfaces
- Avoid storing duplicated business information
- Derive behaviour from Business Events where appropriate

Architectural Services shall never become owners of business concepts.

---

# Authentication Service

## Purpose

Authenticates users accessing RPGMS.

## Responsibilities

- User authentication
- Session establishment
- Identity verification
- Authentication providers

Authentication determines identity only.

It does not determine authorisation.

---

# Authorisation Service

## Purpose

Determines whether an authenticated user is permitted to perform a requested business operation.

## Responsibilities

- Role evaluation
- Permission evaluation
- Access decisions
- Administrative authority

Business Domains rely upon Authorisation rather than implementing permission logic independently.

---

# Audit Service

## Purpose

Provides permanent accountability for significant business activity.

## Responsibilities

- Audit recording
- Audit retrieval
- Timeline generation
- Historical traceability

The Audit Service derives information from Business Events.

It does not create business behaviour.

---

# Notification Service

## Purpose

Coordinates business communication.

## Responsibilities

- Notification generation
- Delivery scheduling
- Channel selection
- Delivery history

Notifications are generated from completed Business Events.

Notifications never modify business state.

---

# Search Service

## Purpose

Provides unified discovery of business information.

## Responsibilities

- Search indexing
- Query execution
- Result aggregation
- Permission-aware filtering

Search does not own business information.

Search provides discovery only.

---

# Reporting Service

## Purpose

Provides operational and analytical reporting across RPGMS.

## Responsibilities

- Report generation
- Business analytics
- Trend analysis
- Operational summaries

Reporting derives information from authoritative business domains.

Reporting never becomes an independent source of business truth.

---

# Billing Engine

## Purpose

Coordinates recurring billing operations.

## Responsibilities

- Billing execution
- Billing schedules
- Charge generation
- Billing orchestration

Business pricing rules remain within the owning domains.

The Billing Engine coordinates execution.

---

# Ledger Engine

## Purpose

Maintains the authoritative financial history of RPGMS.

## Responsibilities

- Ledger posting
- Balance calculation
- Financial reconciliation
- Financial history

The Ledger Engine provides financial consistency across the application.

---

# Configuration Service

## Purpose

Provides configurable operational behaviour.

## Responsibilities

- Business defaults
- Operational configuration
- Feature configuration
- Organisational settings

Configuration influences future operations.

Configuration never rewrites historical business information.

---

# File Storage Service

## Purpose

Manages business documents and other stored files.

## Responsibilities

- Document storage
- Retrieval
- Version management
- Secure access

Business ownership of documents remains with the owning Software Domain.

---

# Integration Service

## Purpose

Coordinates communication with external systems.

## Responsibilities

- Payment providers
- Email providers
- SMS providers
- Government services
- Future third-party integrations

External integrations remain isolated from core business behaviour.

---

# Service Independence

Architectural Services remain independent of one another wherever practical.

Services communicate through:

- Public interfaces
- Business Events
- Shared contracts

Services shall not become tightly coupled.

---

# Service Architecture Summary

Architectural Services provide reusable capabilities shared across multiple Software Domains.

They support the business without owning business behaviour.

Business knowledge remains within Software Domains.

Shared technical capabilities remain within Architectural Services.

This separation preserves modularity, maintainability and long-term scalability.

---

# Data Architecture

The Data Architecture defines how business information is represented, owned and managed within RPGMS.

It provides the architectural principles governing business entities, relationships, identity and consistency.

This chapter defines software architecture rather than database implementation.

Database technologies may evolve without changing these principles.

---

# Data Architecture Principles

Business information shall be organised according to the following principles:

- Clear ownership
- Single source of truth
- Stable identity
- Historical integrity
- Derived information where practical
- Explicit relationships
- Consistent lifecycle management

These principles apply across every Software Domain.

---

# Business Entity Ownership

Every Business Entity shall belong to exactly one Software Domain.

The owning domain is responsible for:

- Creating the entity
- Validating the entity
- Maintaining the entity
- Preserving historical integrity
- Publishing Business Events affecting the entity

Other domains may reference the entity but shall not assume ownership.

---

# Aggregate Boundaries

Business Entities shall be organised into Aggregates.

An Aggregate represents a consistency boundary within a Software Domain.

Each Aggregate shall have one Aggregate Root responsible for maintaining the integrity of the Aggregate.

Examples include:

- Resident
- Stay
- Reservation
- Commercial Agreement

Aggregates communicate through public interfaces rather than direct internal access.

---

# Entity Identity

Every Business Entity shall possess a stable and permanent identity.

Identity shall remain unchanged throughout the lifecycle of the entity.

Identity shall never depend upon mutable business information.

Business identity supports:

- Operational references
- Reporting
- Audit
- Historical traceability

---

# Value Objects

Value Objects represent descriptive business information without independent identity.

Examples include:

- Address
- Contact Information
- Monetary Amount
- Date Range

Value Objects exist only as part of an owning Business Entity.

They shall not possess independent lifecycle or ownership.

---

# Business Relationships

Relationships between Business Entities shall remain explicit.

Relationships shall preserve:

- Referential integrity
- Historical integrity
- Business ownership

Business relationships shall remain understandable independently of implementation technology.

---

# Derived Information

Information that can be reliably calculated from authoritative business data should normally be derived rather than stored.

Examples include:

- Outstanding Balance
- Occupancy Percentage
- Available Beds
- Monthly Totals
- Dashboard Metrics

Derived information shall never become an independent source of business truth.

---

# Historical Preservation

Historical business information shall remain permanently understandable.

Changes to current business data shall not invalidate historical records.

Historical relationships shall remain intact even after operational activities have concluded.

Examples include:

- Completed Stays
- Settled Charges
- Archived Reservations
- Historical Payments

---

# Data Consistency

Consistency shall be maintained within each Aggregate.

Cross-domain consistency shall be achieved through coordinated business workflows and Business Events.

Architectural consistency shall take precedence over implementation convenience.

---

# Data Validation

Validation responsibilities shall remain close to business ownership.

Business Domains validate business information.

Application workflows coordinate validation across multiple domains.

Presentation validates only user interaction.

Infrastructure validates only technical requirements.

---

# Data Evolution

The architecture shall support future expansion of the business model without requiring redesign of existing Business Entities.

New entities, relationships and attributes shall extend the model while preserving existing identity and historical integrity.

---

# Data Architecture Summary

The Data Architecture provides a stable representation of business information across RPGMS.

Business Entities own business knowledge.

Aggregates preserve consistency.

Value Objects describe business information.

Relationships remain explicit.

Historical truth remains permanent.

Together these principles ensure that business information remains accurate, maintainable and aligned with the Business Blueprint throughout the lifetime of the application.

---

# Event Architecture

The Event Architecture defines how significant business activity is communicated throughout RPGMS.

Business Events provide the primary mechanism for communicating completed business operations between Software Domains and Architectural Services.

The Event Architecture promotes loose coupling, historical traceability and architectural extensibility.

---

# Event Principles

Business Events shall:

- Represent completed business operations
- Be owned by the originating Software Domain
- Be immutable
- Become part of the permanent business history
- Be available to authorised Architectural Services

Business Events shall describe what has occurred rather than what should occur.

---

# Business Events

A Business Event represents a completed business operation.

Examples include:

- Resident Created
- Reservation Confirmed
- Stay Created
- Bed Allocated
- Charge Raised
- Payment Received
- Checkout Completed
- Settlement Completed

Business Events represent facts.

Business Events shall never represent user intentions or incomplete activities.

---

# Event Ownership

Every Business Event shall originate from exactly one Software Domain.

Examples include:

| Business Event | Originating Domain |
|----------------|-------------------|
| Resident Created | Resident Domain |
| Stay Created | Stay Domain |
| Bed Allocated | Accommodation Domain |
| Charge Raised | Finance Domain |
| Complaint Logged | Complaints Domain |

Originating domains remain responsible for the correctness of published Business Events.

---

# Event Publication

Business Events are published after successful completion of the corresponding business operation.

Events shall represent completed business state.

Events shall never be published for operations that have failed or been rolled back.

---

# Event Consumers

Multiple Architectural Services may consume the same Business Event.

Examples include:

- Audit Service
- Notification Service
- Reporting Service
- Search Service

Each consuming service remains independent.

Consumers shall not depend upon one another.

---

# Event Flow

A completed business operation typically follows the architectural flow below.

```text
Business Operation
        │
        ▼
Business Domain
        │
        ▼
Business Event
        │
        ├────────────► Audit Service
        │
        ├────────────► Notification Service
        │
        ├────────────► Reporting Service
        │
        └────────────► Search Service
```

The originating Business Domain remains unaware of how individual Architectural Services use the published event.

---

# Audit Integration

The Audit Service records significant Business Events.

Audit information includes:

- Business Event
- Responsible User
- Date and Time
- Business Object
- Authority

Audit does not create business behaviour.

Audit records completed business behaviour.

---

# Notification Integration

Notifications derive from Business Events.

Examples include:

- Admission Confirmation
- Payment Receipt
- Checkout Confirmation
- Complaint Status Update

Notification delivery shall not influence the success or failure of the originating business operation.

---

# Reporting Integration

Reporting derives operational and analytical information from Business Events and authoritative business data.

Reporting shall never become an independent owner of business information.

---

# Search Integration

Search indexes business information based on completed Business Events.

Search remains a discovery mechanism rather than a source of business truth.

---

# Event Evolution

New Business Events may be introduced as the business architecture evolves.

Existing Business Events should remain stable wherever practical.

Architectural evolution shall preserve compatibility with existing consuming services.

---

# Event Architecture Summary

The Event Architecture provides the communication backbone of RPGMS.

Business Domains publish Business Events.

Architectural Services consume Business Events.

Audit records accountability.

Notifications communicate completed activity.

Reporting derives business insight.

Search enables discovery.

This event-driven approach enables Software Domains to remain independent while supporting rich cross-domain functionality.

---

# Security Architecture

The Security Architecture defines how RPGMS protects business information, enforces authorised access and maintains accountability across the application.

Security is implemented as a cross-cutting architectural concern.

Every Software Domain relies upon the Security Architecture rather than implementing independent security mechanisms.

---

# Security Principles

The Security Architecture is governed by the following principles:

- Authenticate every user
- Authorise every business operation
- Apply least privilege
- Preserve accountability
- Protect business information
- Maintain complete auditability

Security shall remain consistent across every Software Domain.

---

# Authentication

## Purpose

Authentication establishes the identity of a user interacting with RPGMS.

Authentication answers the question:

> "Who is the user?"

### Responsibilities

The Authentication Service is responsible for:

- Identity verification
- Session establishment
- Session termination
- Authentication providers
- Session validation

Authentication establishes identity only.

It does not determine permissions.

---

# Authorisation

## Purpose

Authorisation determines whether an authenticated user may perform a requested business operation.

Authorisation answers the question:

> "Is this user permitted to perform this action?"

### Responsibilities

The Authorisation Service is responsible for:

- Role evaluation
- Permission evaluation
- Access decisions
- Business operation authorisation
- Administrative authority

Business Domains rely upon Authorisation rather than implementing permission logic independently.

---

# Role-Based Access Control

RPGMS implements security using Role-Based Access Control (RBAC).

Users are assigned one or more Roles.

Roles define the business responsibilities a user may perform.

Permissions are granted through Roles rather than directly to individual users wherever practical.

This approach simplifies administration and promotes consistent access control.

---

# Permission Evaluation

Every protected business operation shall undergo permission evaluation before execution.

Permission evaluation occurs before Business Rules are applied.

Where permission is denied:

- The business operation shall not proceed.
- No Business Event shall be published.
- No Audit Record of business activity shall be created.

Security-related audit information may still be recorded according to organisational policy.

---

# Administrative Overrides

Certain exceptional business operations may require Administrative Override.

Administrative Overrides shall:

- Require appropriate authority
- Be explicitly authorised
- Generate Business Events
- Generate Audit Records
- Preserve historical traceability

Administrative Override does not bypass accountability.

---

# Security Boundaries

Every Software Domain shall expose only its authorised public interfaces.

Internal implementation details remain inaccessible outside the owning domain.

Security boundaries shall protect:

- Business data
- Business services
- Administrative operations
- Configuration
- Audit information

---

# Principle of Least Privilege

Users shall receive only the permissions required to perform their assigned business responsibilities.

Additional permissions shall be granted only where justified by organisational policy.

Least Privilege reduces operational risk while supporting efficient business operations.

---

# Sensitive Information

Sensitive business information shall be protected according to organisational policy.

Examples include:

- Personal identity information
- Contact information
- Financial information
- Authentication credentials
- Audit records
- Administrative configuration

Access to sensitive information shall always require appropriate authority.

---

# Audit and Security

Security-related business operations shall remain fully auditable.

Examples include:

- User authentication
- Administrative Override
- Permission changes
- Role assignments
- Configuration changes

Audit records shall preserve:

- Responsible User
- Date and Time
- Business Operation
- Authority
- Outcome

---

# Security Evolution

The Security Architecture shall support future enhancement without requiring redesign of existing Software Domains.

Future enhancements may include:

- Multi-factor authentication
- Single Sign-On
- External identity providers
- Advanced permission models
- Federated authentication

Security evolution shall preserve compatibility with the Business Architecture.

---

# Security Architecture Summary

The Security Architecture provides consistent protection across RPGMS.

Authentication establishes identity.

Authorisation evaluates business authority.

Roles define responsibilities.

Permissions govern operations.

Administrative Overrides remain accountable.

Audit preserves security history.

Together these principles provide a secure, maintainable and scalable security model aligned with the Business Blueprint and Business Rules.

---

# User Interface Architecture

The User Interface Architecture defines how users interact with RPGMS.

It establishes a consistent approach for organising screens, navigation, user workflows and presentation components.

The User Interface presents business information without containing business logic.

Business behaviour remains within the Domain Layer.

---

# User Interface Principles

The User Interface shall:

- Present business information clearly
- Support efficient business workflows
- Remain consistent across all modules
- Delegate business operations to the Application Layer
- Avoid implementing business rules
- Remain responsive and accessible

The User Interface is responsible for presentation, not business decision-making.

---

# Application Layout

RPGMS provides a consistent application shell.

The application layout consists of:

- Application Header
- Navigation Sidebar
- Main Workspace
- Contextual Actions
- Notifications
- Dialogs

Every module shall operate within the same application layout.

---

# Navigation Architecture

Navigation provides access to the major Software Domains.

Primary navigation includes:

- Dashboard
- Accommodation
- Residents
- Reservations
- Finance
- Maintenance
- Complaints
- Reports
- Settings

Navigation reflects business capabilities rather than technical implementation.

---

# Page Architecture

Every major feature is represented by a dedicated page.

A page is responsible for:

- Loading business information
- Coordinating user interactions
- Displaying appropriate workspaces
- Delegating business operations

Pages do not implement business rules.

---

# Workspace Architecture

Complex business activities are implemented using Workspaces.

Examples include:

- Admission Workspace
- Stay Workspace
- Checkout Workspace
- Reservation Workspace

A Workspace may combine information from multiple Software Domains while presenting a unified business workflow.

Business coordination occurs through the Application Layer.

---

# Component Architecture

User Interface components shall be organised according to responsibility.

Component categories include:

- Layout Components
- Navigation Components
- Presentation Components
- Form Components
- Dialog Components
- Shared Components

Components remain reusable wherever practical.

---

# View Models

The User Interface presents business information through View Models.

View Models adapt domain information into forms suitable for presentation.

View Models:

- Simplify rendering
- Combine related information
- Avoid exposing internal domain structures

View Models do not own business behaviour.

---

# State Management

User Interface state shall remain local wherever practical.

Examples include:

- Selected tabs
- Dialog visibility
- Form progress
- User preferences
- Temporary filters

Business state remains within the Application and Domain Layers.

The User Interface shall not become the authoritative source of business information.

---

# Forms

Forms provide controlled interaction with business information.

Forms are responsible for:

- Data entry
- Input validation
- User guidance
- Error presentation

Business validation remains the responsibility of the Domain Layer.

---

# Shared Design System

All User Interface elements shall follow the shared Design System.

The Design System provides consistency for:

- Typography
- Colours
- Icons
- Spacing
- Layout
- Buttons
- Forms
- Tables
- Cards
- Dialogs

Shared design standards promote usability and maintainability.

---

# Responsive Design

The User Interface shall adapt appropriately to supported screen sizes.

Responsive behaviour shall preserve:

- Business workflow
- Readability
- Accessibility
- Operational efficiency

Responsive design shall not change business behaviour.

---

# Accessibility

The User Interface shall support accessible interaction wherever practical.

Accessibility considerations include:

- Keyboard navigation
- Screen reader compatibility
- Colour contrast
- Focus management
- Consistent navigation
- Clear visual hierarchy

Accessibility supports efficient operation for all authorised users.

---

# Error Presentation

Errors shall be communicated clearly and consistently.

The User Interface shall distinguish between:

- Validation errors
- Business rule violations
- Permission failures
- System failures

Users shall receive sufficient information to understand the outcome without exposing internal implementation details.

---

# User Interface Evolution

The User Interface shall support future enhancement without requiring redesign of the underlying Software Domains.

Future improvements may include:

- Additional workflows
- Alternative layouts
- Mobile optimisation
- Advanced dashboards
- Personalised workspaces

Presentation may evolve independently while preserving business consistency.

---

# User Interface Architecture Summary

The User Interface provides a consistent presentation layer for RPGMS.

Pages organise business capabilities.

Workspaces support complex workflows.

Components remain reusable.

View Models adapt business information for presentation.

Business logic remains outside the User Interface.

This architecture promotes clarity, consistency and long-term maintainability while supporting efficient day-to-day hostel operations.

---

# Future Evolution

The architecture of RPGMS is designed to support continuous business and technical evolution while preserving architectural consistency.

Future enhancements shall extend the existing architecture rather than replace it.

Architectural evolution shall remain guided by the Business Blueprint and Business Rules.

---

# Evolution Principles

Future development shall adhere to the following principles:

- Preserve business architecture
- Extend rather than replace
- Maintain backward compatibility where practical
- Protect historical integrity
- Minimise architectural disruption
- Encourage modular growth

Business requirements drive architectural evolution.

Technology choices support architectural objectives.

---

# Business Expansion

The architecture supports the addition of new business capabilities through new Software Domains.

Examples include:

- Visitor Management
- Inventory Management
- Housekeeping
- Vendor Management
- Staff Management
- Asset Management
- Coworking Management
- Multi-Property Management

Each new capability shall follow the established Domain Architecture.

---

# Workflow Expansion

Business workflows may become more sophisticated over time.

Future workflows may include:

- Digital admissions
- Online reservations
- Automated renewals
- Digital agreements
- Self-service checkout
- Maintenance scheduling
- Approval workflows

Workflow expansion shall preserve existing domain responsibilities.

---

# Technology Independence

The architecture is intentionally independent of specific implementation technologies.

Examples of replaceable technologies include:

- Front-end framework
- Database platform
- Authentication provider
- Notification provider
- Storage provider
- Reporting tools

Technology may evolve without requiring changes to the Business Blueprint or Business Rules.

---

# Integration Readiness

RPGMS shall support integration with external systems through well-defined interfaces.

Potential integrations include:

- Payment gateways
- Government identity services
- Messaging platforms
- Accounting software
- Access control systems
- IoT devices
- Business intelligence platforms

Integrations shall remain isolated from core business logic.

---

# Scalability

The architecture supports growth in:

- Number of residents
- Number of properties
- Number of users
- Business transactions
- Reporting requirements
- Operational complexity

Scalability shall be achieved through modular architecture rather than architectural redesign.

---

# Multi-Property Readiness

The architecture supports future expansion from a single property to multiple properties.

Examples include:

- Shared resident management
- Property-specific accommodation
- Centralised reporting
- Property-level configuration
- Cross-property administration

Business ownership shall remain clearly defined regardless of organisational scale.

---

# Automation Readiness

The architecture supports increasing levels of business automation.

Examples include:

- Scheduled billing
- Automated reminders
- Recurring maintenance
- Occupancy monitoring
- Financial reconciliation
- Business notifications

Automation coordinates business operations but does not replace Business Rules.

---

# Artificial Intelligence Readiness

The architecture is designed to support responsible use of Artificial Intelligence.

Potential AI capabilities include:

- Operational insights
- Predictive occupancy analysis
- Revenue forecasting
- Complaint categorisation
- Maintenance prioritisation
- Document assistance
- Administrative recommendations

AI shall assist business operations.

AI shall not become the authoritative source of business decisions or business data.

All AI-generated outputs remain subject to human review where business judgement is required.

---

# Documentation Evolution

Architectural documentation shall evolve together with the software.

Changes to the Business Blueprint or Business Rules shall be reflected in the corresponding architectural documentation.

Documentation shall remain synchronised with implementation throughout the lifetime of the project.

---

# Future Evolution Summary

The architecture of RPGMS is designed for long-term sustainability.

Business growth, technological change and organisational expansion are expected.

The architecture provides stable foundations while enabling controlled evolution.

Business principles remain constant.

Technology remains adaptable.

This approach ensures that RPGMS can continue to evolve without compromising architectural integrity.

---

# Documentation Architecture

The Documentation Architecture defines how architectural knowledge is organised, maintained and governed within RPGMS.

Documentation is treated as a first-class architectural asset.

Every significant architectural and business decision shall be represented within the appropriate project documentation.

---

# Documentation Principles

Project documentation shall:

- Be authoritative
- Be consistent
- Be traceable
- Be maintainable
- Evolve with the software
- Avoid duplication

Documentation shall describe architecture rather than duplicate implementation.

---

# Documentation Hierarchy

Project documentation follows a hierarchical structure.

```text
Business Blueprint
        │
        ▼
Business Rules
        │
        ▼
Software Architecture
        │
        ▼
Domain Documentation
        │
        ▼
Implementation Documentation
        │
        ▼
Source Code
```

Each layer derives guidance from the layer above.

Lower layers shall not contradict higher layers.

---

# Documentation Responsibilities

Each document has a clearly defined responsibility.

| Document | Primary Responsibility |
|----------|------------------------|
| BUSINESS_BLUEPRINT.md | Business concepts, terminology and organisational model |
| BUSINESS_RULES.md | Business policies, constraints and operational rules |
| ARCHITECTURE.md | Software architecture and architectural principles |
| DOMAIN_MODEL.md *(planned)* | Business entities and relationships |
| UI_GUIDELINES.md | User interface standards and design principles |
| ROADMAP.md | Planned business and technical evolution |
| CHANGELOG.md | Historical record of significant changes |
| PROJECT_RULES.md | Project governance and engineering standards |
| AI_* documents | AI governance, workflow and collaboration guidance |

Each document owns its subject area.

Responsibilities shall not overlap unnecessarily.

---

# Traceability

Architectural decisions shall be traceable through the documentation hierarchy.

For example:

```text
Business Blueprint
        │
Defines:
Resident

        ▼

Business Rules
        │
Defines:
Resident lifecycle

        ▼

Architecture
        │
Defines:
Resident Domain

        ▼

Implementation
        │
Implements:
Resident Module

        ▼

Source Code
```

Every implementation decision should be traceable to an architectural decision.

Every architectural decision should be traceable to a business decision.

---

# Documentation Consistency

When significant business or architectural changes occur:

- The relevant documentation shall be updated.
- Related documents shall be reviewed for consistency.
- Contradictory information shall be resolved before implementation is considered complete.

Documentation and implementation shall evolve together.

---

# Domain Documentation

As the application grows, individual Software Domains may maintain their own supporting documentation.

Examples include:

- Resident Domain
- Stay Domain
- Finance Domain
- Reservation Domain

Domain documentation shall remain subordinate to this Architecture document.

---

# Decision Records

Significant architectural decisions shall be recorded in a permanent decision log.

Decision records should include:

- Context
- Decision
- Rationale
- Consequences

Decision records preserve architectural history and support future maintenance.

---

# Documentation Ownership

Business documentation is owned by the business architecture.

Architectural documentation is owned by the software architecture.

Implementation documentation is owned by the engineering process.

Ownership ensures accountability for maintaining each document.

---

# Documentation Review

Documentation shall be reviewed whenever:

- New Software Domains are introduced
- Business Rules change
- Architectural principles evolve
- Significant workflows are redesigned
- Major implementation milestones are completed

Documentation review is an integral part of architectural governance.

---

# Documentation Evolution

Documentation shall evolve incrementally.

Existing documentation should be extended wherever practical rather than replaced.

Historical versions provide an important record of architectural evolution.

---

# Documentation Architecture Summary

Documentation forms the architectural memory of RPGMS.

Each document has a defined purpose.

Each document supports the layer above and below it.

Traceability connects business concepts, architectural decisions and implementation.

This structured approach ensures that knowledge remains organised, consistent and maintainable throughout the lifetime of the project.

---

# Architectural Governance

Architectural Governance defines how the software architecture of RPGMS is maintained, evolved and protected throughout the lifetime of the project.

The purpose of governance is not to restrict development, but to ensure that architectural consistency is preserved as the application grows.

Every significant architectural decision shall remain aligned with the Business Blueprint and Business Rules.

---

# Governance Principles

Architectural governance is guided by the following principles:

- Business before implementation
- Consistency over convenience
- Simplicity over unnecessary complexity
- Evolution rather than replacement
- Clear ownership
- Long-term maintainability

Architectural decisions shall support sustainable software development.

---

# Architectural Compliance

All implementation shall comply with the architectural principles defined in this document.

Compliance includes:

- Respecting Software Domain boundaries
- Preserving Layered Architecture
- Maintaining clear ownership
- Following documented Business Rules
- Supporting historical integrity
- Using Architectural Services appropriately

Architectural compliance is considered part of the Definition of Done for significant development work.

---

# Architectural Decision-Making

Significant architectural decisions shall be evaluated against the following questions:

1. Does the change support the Business Blueprint?

2. Does the change comply with Business Rules?

3. Does the change preserve Domain ownership?

4. Does the change maintain Layered Architecture?

5. Does the change simplify or unnecessarily complicate the architecture?

6. Does the change preserve future extensibility?

Only decisions that satisfy these principles should become part of the permanent architecture.

---

# Architectural Exceptions

Occasionally, implementation constraints may require deviations from the preferred architecture.

Architectural exceptions shall:

- Be explicitly documented
- Include a clear justification
- Identify associated risks
- Describe any temporary measures
- Include a plan for future resolution where appropriate

Architectural exceptions shall remain rare.

Temporary implementation shortcuts shall not become permanent architecture without formal review.

---

# Change Management

Architecture evolves through controlled change.

When significant architectural changes are introduced:

- The relevant documentation shall be updated.
- Related documentation shall be reviewed.
- Business impact shall be evaluated.
- Existing implementations shall remain consistent wherever practical.

Architectural change shall be deliberate rather than incidental.

---

# Architectural Reviews

Major development milestones should include an architectural review.

Reviews should confirm:

- Continued compliance with Business Blueprint
- Continued compliance with Business Rules
- Correct Domain ownership
- Appropriate use of Architectural Services
- Documentation consistency
- Long-term maintainability

Architectural review supports continuous improvement rather than fault-finding.

---

# Documentation Authority

The documentation hierarchy defines the authoritative source for architectural decisions.

The order of authority is:

1. BUSINESS_BLUEPRINT.md
2. BUSINESS_RULES.md
3. ARCHITECTURE.md
4. Domain Documentation
5. Implementation Documentation
6. Source Code

Where inconsistencies exist, the higher-level document takes precedence.

Implementation shall be corrected to align with the governing documentation.

---

# Continuous Improvement

Architecture is expected to evolve throughout the lifetime of RPGMS.

Continuous improvement shall:

- Preserve architectural consistency
- Improve maintainability
- Simplify implementation where possible
- Support future business growth

Architectural evolution is encouraged when guided by documented principles.

---

# Architectural Vision

The long-term vision of RPGMS is to provide a software platform that faithfully represents the business it serves.

The software architecture exists to support business operations rather than dictate them.

Business concepts remain stable.

Technology remains adaptable.

Architecture provides the bridge between the two.

---

# Conclusion

The architecture of RPGMS is founded upon three complementary layers of governance:

Business Blueprint defines the business.

Business Rules define business behaviour.

Software Architecture defines how the software implements the business.

Together they establish a coherent, maintainable and extensible foundation for the continued evolution of RPGMS.

This document serves as the governing architectural reference for the software implementation of RPGMS and shall guide future development, architectural decisions and long-term maintenance.

---

