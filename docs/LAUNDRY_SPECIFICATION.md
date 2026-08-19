# Laundry Specification

**Document Status:** Business Design — Pre-Implementation  
**Document Type:** Domain Specification  
**Domain:** Laundry  
**Version:** 1.0  
**Last Updated:** 2026-08-19

---

# 1. Purpose

The Laundry domain manages the complete operational lifecycle of resident laundry services within RPGMS 2.0.

The domain covers the lifecycle from the time laundry is collected from a resident through processing, return, resident handover, exception handling, resolution, and the determination of chargeable laundry services.

The Laundry domain is designed to support both:

- external laundry processing through a vendor; and
- in-house laundry processing.

The resident-facing Laundry experience remains common regardless of the processing route.

The Laundry domain is responsible for operational laundry facts and rules. Financial accounting remains owned by the Finance domain.

---

# 2. Scope

## 2.1 In Scope

The Laundry domain includes:

- Laundry Item Master;
- Laundry Service Master;
- Laundry Charge Master;
- Laundry Transactions;
- Garment Lines;
- service selection;
- collection of physical laundry;
- collection confirmation;
- collection photographs;
- condition observations;
- rate snapshots;
- processing-route selection;
- external-vendor processing;
- in-house processing at the MVP level;
- laundry return;
- partial return;
- delivery and handover;
- partial delivery;
- room placement;
- resident verification;
- laundry exceptions;
- exception investigation;
- exception resolution;
- service-fulfillment tracking;
- operational chargeability determination;
- Laundry-to-Finance charge events;
- laundry-related operational timeline;
- laundry workspace/dashboard behaviour;
- cancellation before processing release;
- historical integrity and auditability of Laundry business facts.

---

## 2.2 Out of Scope for the MVP

The following are intentionally outside the MVP Laundry operational model:

- machine-level laundry management;
- washing-machine assignment;
- dryer assignment;
- internal laundry work queues;
- detailed internal processing stages;
- internal laundry staff task management;
- machine capacity management;
- machine maintenance management;
- internal laundry cost accounting;
- utility consumption allocation to individual laundry items;
- automated vendor integration;
- automated vendor manifests;
- vendor-side quantity declarations;
- service-level routing of individual services to different processing providers;
- advanced laundry production planning.

The MVP must preserve the architectural ability to introduce these capabilities later without redesigning the core Laundry Transaction model.

---

# 3. Domain Ownership

Laundry is an **Operational Support Domain** within RPGMS 2.0.

The Laundry domain owns the operational truth concerning:

- what laundry was collected;
- what services were requested;
- what rates were applicable at collection confirmation;
- what physical condition was observed;
- how the laundry was routed for processing;
- what laundry was physically returned;
- what laundry was physically handed over;
- what exceptions occurred;
- how those exceptions were investigated and resolved;
- which requested services were actually fulfilled;
- which delivered services became operationally chargeable.

Laundry does **not** own:

- resident identity;
- Stay ownership;
- accommodation ownership;
- financial Charges;
- Payments;
- Payment Allocations;
- financial Adjustments;
- the resident's overall financial ledger.

Those responsibilities remain with their respective RPGMS domains.

---

# 4. Relationship to Other RPGMS Domains

## 4.1 Resident / Stay

A Laundry Transaction belongs to a resident's current Stay.

The Laundry domain references the Stay as the operational context for the laundry relationship.

Laundry does not own the Stay or resident lifecycle.

The relationship is:

Stay
  │
  └── Laundry Transaction(s)

A Stay may therefore have multiple Laundry Transactions over time and may have multiple concurrent Laundry Transactions where operationally required.

## 4.2 Accommodation

Laundry may require accommodation information when a delivery uses the ROOM_PLACEMENT handover method.

Accommodation provides the resident's current accommodation context.

Laundry does not own the room or bed allocation.

The relationship is:

Laundry Delivery
      │
      └── ROOM_PLACEMENT
              │
              └── Resident's current accommodation

## 4.3 Finance

Laundry determines the operational chargeability of completed laundry services.

Finance owns the authoritative financial Charge.

The boundary is:

Laundry
   │
   │ determines chargeable service
   ▼
LaundryChargeRaised
   │
   ▼
Finance
   │
   └── creates authoritative Charge

Laundry does not create or own Finance Charges directly.

Finance remains authoritative for:

Charges;
Payments;
Payment Allocations;
Credits/Adjustments;
financial balances;
the unified Stay financial ledger.

Laundry may receive or display relevant financial information, but it does not become a second financial ledger.

## 4.4 Billing Engine

The Billing Engine does not own Laundry pricing rules.

Laundry owns its own:

Laundry Item Master;
Laundry Service Master;
Laundry Charge Master;
rate determination;
rate snapshot;
operational chargeability rules.

The Billing Engine may process the resulting Finance Charge according to the common financial architecture, but it must not calculate Laundry-specific commercial rates or determine Laundry service pricing.

The relationship is:

Laundry Charge Master
        │
        ▼
Laundry Rate Snapshot
        │
        ▼
Laundry operational chargeability
        │
        ▼
LaundryChargeRaised
        │
        ▼
Finance Charge
        │
        ▼
Billing / financial processing

## 4.5 Business Events

Significant Laundry business operations produce immutable Laundry-owned Business Events.

Laundry events describe Laundry-owned operational facts.

Laundry must not publish events that claim ownership of Finance facts such as:

payment received;
payment allocated;
financial adjustment posted;
financial ledger balance changed.

Those remain Finance-owned events.

# 5. Core Domain Boundary

The Laundry domain can be summarized as:

                    LAUNDRY DOMAIN
                         │
                         ▼
                Laundry Transaction
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Collection       Processing       Delivery
        │                │                │
   Garment Lines   In-House / Vendor   Handover
        │                │                │
   Rate Snapshot        Return       Resident Verification
        │                │                │
   Condition         Exceptions      Chargeability
   Observations          │                │
                         ▼                ▼
                     Resolution     Finance Event

The Laundry domain therefore owns the operational laundry lifecycle, while Finance owns the resulting financial consequences.

# 6. Design Principles

The Laundry domain follows these principles:

## 6.1 Physical quantity is distinct from service quantity

A physical garment is counted once regardless of how many services are requested for it.

For example:

1 Shirt
  ├── Cleaning
  └── Ironing

represents one physical shirt receiving two services.

It does not represent two shirts.

## 6.2 Original collection facts are preserved

Once Collection Confirmation occurs, the original collected quantities, requested services, and applicable rate snapshots become historical facts.

Later processing outcomes must not rewrite those original facts.

## 6.3 Processing route is operational, not commercial

The resident selects the services required.

The operator selects the Processing Route.

The MVP supports:

IN_HOUSE
EXTERNAL_VENDOR

Processing Route does not determine the resident's commercial price.

## 6.4 Delivery is a physical business event

Laundry becomes delivered when it is handed over through an accepted handover method.

Resident verification is recorded separately.

Therefore:

Physical Handover ≠ Resident Verification

## 6.5 Exceptions do not rewrite history

An Exception records a problem with the Laundry process or outcome.

It does not modify the original collection, service selection, rate snapshot, or other historical facts.

## 6.6 Financial consequences remain in Finance

Laundry may determine that a financial consequence is appropriate as part of an operational resolution.

The resulting financial transaction is created and owned by Finance.

## 6.7 Future internal operations must extend, not replace, the MVP model

The MVP intentionally treats in-house processing as a simple processing route.

Future internal laundry operations may introduce detailed operational workflows without changing the resident-facing Laundry Transaction model.

# 7. Ubiquitous Language

The following terms have precise business meanings within the Laundry domain. These definitions are authoritative for the Laundry specification.

---

## 7.1 Laundry Item

A **Laundry Item** is a recognized physical category of laundry that can be collected, processed, returned, and delivered.

Examples include:

- Shirt
- Trouser
- Jeans
- Sweater
- Blanket
- Bedsheet
- Towel

A Laundry Item represents a category of physical laundry, not an individually identified garment.

The Laundry domain does not require individual garment identity for normal MVP operation.

---

## 7.2 Laundry Service

A **Laundry Service** is an operation that may be requested for a Laundry Item.

Examples include:

- Cleaning
- Ironing
- Dry Cleaning

The Service Master is configurable so that new services can be introduced without changing the Laundry domain model.

A Laundry Service is a business concept and does not necessarily correspond to one internal physical processing step.

For example:

Resident Service:
Cleaning

may internally involve:

Washing
Drying
Folding

Those internal processing steps are outside the MVP Laundry model

## 7.3 Laundry Charge Master

The Laundry Charge Master defines the current commercial rate applicable to a combination of Laundry Item and Laundry Service.

Conceptually:

Laundry Item
+
Laundry Service
+
Rate
+
Effective Period

Examples:

Shirt + Cleaning       = ₹20
Shirt + Ironing        = ₹10
Sweater + Cleaning     = ₹25
Shirt + Dry Cleaning   = ₹80

The Charge Master is configurable by authorized operators.

It must support adding new Item + Service combinations without requiring application code changes.

## 7.4 Rate

A Rate is the monetary amount associated with a Laundry Item + Laundry Service combination in the Charge Master.

A Rate is configuration data.

A Rate is not itself a historical transaction fact.

## 7.5 Rate Snapshot

A Rate Snapshot is the historical copy of the applicable Laundry Charge Master rate captured when Collection Confirmation occurs.

The Rate Snapshot protects an existing Laundry Transaction from later Charge Master changes.

Example:

At Collection Confirmation:


Shirt Cleaning = ₹20
Shirt Ironing  = ₹10

If the Charge Master later changes:

Shirt Cleaning = ₹25
Shirt Ironing  = ₹12

the existing Laundry Transaction continues to use:

Shirt Cleaning = ₹20
Shirt Ironing  = ₹10

because those values were already snapshotted.

## 7.6 Laundry Transaction

A Laundry Transaction is the complete operational record of one laundry collection relationship for a resident's Stay.

A Laundry Transaction records the lifecycle of laundry from collection through processing, return, delivery, exception handling, resolution, and chargeability.

A Laundry Transaction belongs to exactly one Stay.

A Stay may have multiple Laundry Transactions.

Multiple Laundry Transactions may exist concurrently for the same Stay.

## 7.7 Garment Line

A Garment Line represents a quantity of the same Laundry Item for which the same set of Laundry Services applies.

A Garment Line contains:

Laundry Item;
physical quantity;
requested Services;
applicable Rate Snapshots.

Example:

Shirt × 2
Cleaning + Ironing

is one Garment Line.

If the resident has:

3 Shirts


2 for Cleaning + Ironing
1 for Cleaning only

the Laundry Transaction contains:

Garment Line 1:
Shirt × 2
Cleaning + Ironing


Garment Line 2:
Shirt × 1
Cleaning

The physical quantity is therefore:

2 + 1 = 3 Shirts

and not six.

## 7.8 Physical Quantity

Physical Quantity is the number of actual pieces represented by a Laundry Item or Garment Line.

A physical piece is counted once regardless of the number of services applied to it.

For example:

1 Shirt
Cleaning + Ironing

has:

Physical Quantity = 1
Service Count = 2

The Laundry domain must never interpret the two services as two physical garments.

## 7.9 Collection

A Collection is the physical receipt of laundry from the resident by RPGMS staff.

Collection records the laundry physically handed over by the resident and the services requested for that laundry.

Collection includes:

Laundry Items;
physical quantities;
requested Services;
collection photographs;
staff involvement;
resident verification;
collection timestamp.

Collection becomes a historical business fact when Collection Confirmation occurs.

## 7.10 Collection Confirmation

Collection Confirmation is the business confirmation that the recorded Laundry collection accurately represents the physical laundry handed over by the resident and the services requested.

Collection Confirmation establishes the historical baseline for:

collected quantities;
requested services;
applicable Rate Snapshots;
collection evidence.

After Collection Confirmation, the original collection facts must not be silently overwritten.

## 7.11 Collection Photograph

A Collection Photograph is photographic evidence captured during collection and retained as temporary operational evidence of the laundry handed over.

Photographs are captured for all collected laundry.

Collection photographs are retained until the Laundry Transaction reaches physical completion, unless an active Exception, dispute, investigation, legal requirement, or other approved evidence-retention condition requires them to be retained longer.

Physical completion is determined by:

Collected − Delivered − Resolved = 0

The photographs are associated with the Collection rather than being treated as individual garment identities.

## 7.12 Condition Observation

A Condition Observation records a physical condition observed on collected laundry before processing.

Examples include:

existing tear;
stain;
damaged button;
worn fabric;
other visible defect.

A Condition Observation may apply to an affected quantity within a Garment Line.

Example:

Shirt × 3


Condition:
Existing tear


Affected Quantity:
1

The Condition Observation does not reduce the collected quantity.

## 7.13 Processing Route

A Processing Route identifies where the Laundry Transaction will be processed.

The MVP supports:

IN_HOUSE
EXTERNAL_VENDOR

The Processing Route is selected by the operator.

The resident selects the required Laundry Services but does not select the Processing Route.

Processing Route is an operational decision and does not determine the resident's Laundry rate.

## 7.14 In-House Processing

In-House Processing means that RPGMS processes the Laundry Transaction internally.

For MVP, In-House Processing is intentionally lightweight.

The system records:

Processing Route = IN_HOUSE

and supports the common Laundry lifecycle through processing and return.

The MVP does not manage:

washing machines;
dryers;
internal work queues;
staff processing assignments;
processing stations;
detailed processing stages;
machine capacity;
internal laundry costing.

These may be introduced as future capabilities.

## 7.15 External Vendor Processing

External Vendor Processing means that the Laundry Transaction is sent to an external laundry service provider for processing.

For an External Vendor Processing Route, the selected external vendor is recorded.

The external vendor workflow includes:

Processing Release
        ↓
With Vendor
        ↓
Laundry Return

The detailed external vendor workflow is defined later in this specification.

## 7.16 Processing Provider

A Processing Provider identifies the party or operational route responsible for processing the Laundry.

For MVP:

Processing Route = EXTERNAL_VENDOR
Processing Provider = Selected Vendor

For:

Processing Route = IN_HOUSE

the system records the internal processing route without requiring a separate vendor entity.

## 7.17 Laundry Return

A Laundry Return records laundry physically received back into RPGMS custody after processing.

A Laundry Return records the quantities actually received and verified by RPGMS staff.

The system must not assume that the vendor returned the full collected quantity.

For example:

Collected:
Shirts × 3
Trousers × 2


Returned:
Shirts × 3
Trousers × 1

The system records:

Returned = 4 physical garments

and identifies the remaining quantity through reconciliation.

## 7.18 Delivery

A Delivery records the physical handover of processed laundry from RPGMS to the resident or to the resident's designated accommodation location.

Multiple Deliveries may occur for the same Laundry Transaction.

A Delivery may therefore represent:

a complete handover; or
a partial handover.

Delivery is based on actual physical handover rather than merely on laundry being marked as returned.

## 7.19 Delivery Line

A Delivery Line records the quantity of a Garment Line physically included in a particular Delivery.

Example:

Original Garment Line:
Shirt × 3


Delivery #1:
Shirt × 2


Delivery #2:
Shirt × 1

The original Garment Line remains:

Shirt × 3

The Delivery Lines record the subsequent physical handovers.

## 7.20 Handover Method

The Handover Method records how laundry was physically handed over.

MVP methods include:

DIRECT_HANDOVER
ROOM_PLACEMENT
DIRECT_HANDOVER

Laundry is physically handed directly to the resident.

ROOM_PLACEMENT

Laundry is placed in the resident's room based on the resident's instruction.

Room Placement does not require the resident to be physically present.

The staff member records the placement as the completed physical handover.

## 7.21 Resident Verification

Resident Verification records whether the resident personally verified the laundry at the time of Delivery.

Resident Verification is distinct from physical Delivery.

Therefore:

Delivered = Yes
Resident Verified = No

is a valid state, such as when laundry is placed in the resident's room while the resident is away.

## 7.22 Exception

A Laundry Exception records a problem, discrepancy, dispute, or quality issue requiring investigation or resolution.

Examples include:

missing item;
damaged item;
disputed returned item;
wrong item returned;
service not performed;
service not performed as requested;
quality issue;
other operational discrepancy.

An Exception does not rewrite the original Laundry facts.

## 7.23 Exception Investigation

Exception Investigation is the operational process of determining what happened and what business outcome should be recorded.

Investigation may involve:

staff review;
physical inspection;
vendor discussion;
resident discussion;
review of collection photographs;
review of delivery information;
other relevant evidence.

## 7.24 Exception Resolution

An Exception Resolution records the final business conclusion of an Exception investigation.

A Resolution may record:

outcome;
affected quantity;
responsible party;
resolution notes;
financial action requirement;
resolver;
resolution date/time;
supporting evidence where applicable.

A Resolution is operationally separate from any resulting Finance transaction.

A resolved Exception does not necessarily imply a financial adjustment.

## 7.25 Responsible Party

The Responsible Party identifies the party determined to be responsible for an Exception where responsibility can be established.

Possible categories may include:

VENDOR
RESIDENT
RPGMS
UNKNOWN
NONE
OTHER

Responsible Party is an operational finding.

It is not automatically equivalent to financial liability.

## 7.26 Service Fulfillment

Service Fulfillment records whether a requested Laundry Service has actually been performed for the affected physical quantity.

For example:

Requested:
Shirt × 2
Cleaning + Ironing


Actual initial outcome:
Cleaning completed
Ironing not completed

The Cleaning service is fulfilled.

The Ironing service is not yet fulfilled.

A requested service is not chargeable merely because it was originally selected.

## 7.27 Chargeable Laundry Service

A Chargeable Laundry Service is a requested Laundry Service that has:

actually been fulfilled; and
been physically delivered for the affected quantity.

Therefore:

Requested Service
        ↓
Service Fulfilled
        ↓
Affected Quantity Delivered
        ↓
Chargeable

A requested but unfulfilled service is not chargeable.

If the service is subsequently fulfilled and delivered, it becomes chargeable using the original Rate Snapshot.

## 7.28 Laundry Charge Event

A Laundry Charge Event is the Laundry domain's business event indicating that a confirmed Delivery has produced chargeable Laundry services.

The event communicates the operational financial fact to Finance.

The Laundry Charge Event is not itself the authoritative Finance Charge.

Finance creates the authoritative financial Charge.

# 8. Master Data

The Laundry domain uses configurable master data so that Laundry Items, Laundry Services, and their commercial rates can evolve without application-code changes.

## 8.1 Laundry Item Master

The Laundry Item Master defines recognized Laundry Item categories.

Each active Laundry Item should have, at minimum:

unique identifier;
item name;
active/inactive status;
audit metadata.

Examples:

SHIRT
TROUSER
JEANS
SWEATER
BLANKET
BEDSHEET
TOWEL

New Laundry Item categories may be added without changing the Laundry Transaction model.

Historical Laundry Transactions retain their original Item reference and must not be silently reclassified because the master data changed later.

## 8.2 Laundry Service Master

The Laundry Service Master defines available resident-facing Laundry Services.

Each active Laundry Service should have, at minimum:

unique identifier;
service name;
active/inactive status;
audit metadata.

Examples:

CLEANING
IRONING
DRY_CLEANING

New Laundry Services may be added without changing the Laundry Transaction model.

A Service Master entry represents a resident-facing business service. It does not prescribe the internal physical processing steps used to fulfil that service.

## 8.3 Laundry Charge Master

The Laundry Charge Master defines the commercial rate for a Laundry Item + Laundry Service combination.

Conceptually:

Laundry Item
+
Laundry Service
+
Rate
+
Effective Period

Example:

Shirt + Cleaning       ₹20
Shirt + Ironing        ₹10
Shirt + Dry Cleaning   ₹80
Sweater + Cleaning     ₹25

The Charge Master must allow authorized operators to:

create new Item + Service rates;
change future rates;
deactivate obsolete rates;
maintain effective periods;
review historical rate configuration.

A Charge Master change must not alter historical Rate Snapshots.

## 8.4 Charge Master and Transaction Separation

The Charge Master represents current/future commercial configuration.

A Laundry Transaction represents historical operational facts.

Therefore:

Charge Master
     │
     │ rate at collection confirmation
     ▼
Rate Snapshot
     │
     ▼
Laundry Transaction

Once snapshotted, the transaction does not depend on future Charge Master changes for historical pricing.

## 8.5 No Hard-Coded Laundry Pricing

Laundry rates must not be hard-coded into application logic.

The system must obtain applicable rates from the Laundry Charge Master when establishing Rate Snapshots.

This allows the operator to introduce combinations such as:

Shirt + Cleaning
Shirt + Ironing
Shirt + Dry Cleaning
Sweater + Cleaning
Blanket + Cleaning

without requiring a code change for each new commercial combination.

# 9. Master Data Lifecycle

Master data is configuration, not transaction history.

Deactivating or changing a Laundry Item, Laundry Service, or Charge Master entry must not alter previously confirmed Laundry Transactions.

Historical transactions remain tied to the business facts that were valid when those transactions were confirmed.

# 10. Laundry Transaction

## 10.1 Purpose

A Laundry Transaction represents one operational laundry relationship for a resident's Stay.

It begins when laundry is collected and continues through:

Collection
   ↓
Inspection
   ↓
Processing
   ↓
Return
   ↓
Delivery
   ↓
Exception / Resolution, where applicable
   ↓
Completion

A Laundry Transaction is the primary operational container for all laundry facts associated with that collection.

## 10.2 Relationship to Stay

Every Laundry Transaction belongs to exactly one Stay.

The Laundry Transaction must retain the Stay reference throughout its lifecycle.

The Laundry domain does not own the Stay.

The Stay provides the resident and occupancy context under which the Laundry Transaction exists.

## 10.3 Multiple Laundry Transactions

A resident may have multiple Laundry Transactions over time.

Multiple Laundry Transactions may also exist concurrently for the same Stay.

For example:

Stay S-001


Laundry Transaction L-001
Collected: 19 Aug
Status: WITH_VENDOR


Laundry Transaction L-002
Collected: 20 Aug
Status: COLLECTED

The system must treat these as independent Laundry Transactions.

Their quantities, services, processing routes, deliveries, exceptions, and financial events must remain separately traceable.

## 10.4 Laundry Transaction Creation

A Laundry Transaction is created when staff begins recording a new laundry collection for a resident.

At creation, the transaction may contain preliminary information.

The transaction is not considered a confirmed collection until Collection Confirmation occurs.

Initial state:

DRAFT

A Draft transaction may be corrected normally before Collection Confirmation.

# 11. Laundry Collection

## 11.1 Collection Purpose

Collection records the physical laundry handed over by the resident to RPGMS staff.

The collection process establishes:

what physical laundry was received;
how many pieces were received;
which services were requested;
collection evidence;
staff participation;
resident verification.

## 11.2 Physical Counting

Laundry is counted by physical pieces.

Each physical garment is counted once, regardless of the number of services requested for that garment.

For example:

1 Shirt
Cleaning + Ironing

represents:

Physical Quantity = 1

not:

Physical Quantity = 2

The two services describe operations requested for the same physical garment.

## 11.3 Mixed Service Selection

A resident may divide the same Laundry Item type across different service combinations.

For example:

3 Shirts


2 Shirts:
Cleaning + Ironing


1 Shirt:
Cleaning only

This must be represented as two Garment Lines:

Garment Line 1
Shirt × 2
Cleaning + Ironing


Garment Line 2
Shirt × 1
Cleaning

The total physical Shirt quantity remains:

3

The services do not increase physical quantity.

## 11.4 Multiple Services on One Garment Line

A Garment Line may contain multiple requested services.

Example:

Shirt × 2
Cleaning
Ironing

This means:

2 physical Shirts
+
Cleaning service for both
+
Ironing service for both

It does not create separate physical garment quantities for Cleaning and Ironing.

## 11.5 Collection Photographs

Photographs are captured for all Laundry collected from the resident.

The purpose of the photographs is temporary operational evidence of the physical laundry at collection.

Photographs may support:

- quantity verification;
- condition verification;
- dispute investigation;
- comparison during Return and Delivery;
- Exception investigation.

Collection photographs are associated with the Collection and are not used to establish individual garment identity.

Collection photographs are retained until the Laundry Transaction reaches **physical completion**, unless an active Exception, dispute, investigation, legal requirement, or other approved evidence-retention condition requires them to be retained longer.

Physical completion is determined by:

Collected − Delivered − Resolved = 0

Collection photographs remain associated with the original Collection and are never rewritten to reflect later physical outcomes.

## 11.6 Staff Verification

The collecting staff member records the physical quantity and requested services.

The staff member verifies the recorded collection against the physical laundry before Collection Confirmation.

Staff verification establishes that the operator has checked the recorded information.

## 11.7 Resident Verification

The resident is given the opportunity to verify:

physical quantity;
Laundry Item categories;
requested services.

The resident's verification is recorded separately from staff verification.

The system must not assume that staff verification and resident verification are the same business fact.

# 12. Collection Inspection
    
## 12.1 Inspection Purpose

Before laundry is released for processing, the operator may inspect the collected laundry.

The inspection is used to identify:

pre-existing damage;
visible defects;
stains;
other relevant physical conditions;
discrepancies requiring discussion with the resident.

## 12.2 Operator Inspection

The operator may inspect the laundry after collection and before processing release.

The operator may confirm an observed condition with the collecting staff member.

Where required, the operator may discuss the condition with the resident before the laundry is processed.

## 12.3 Condition Observation

A Condition Observation records the condition observed at inspection.

Example:

Shirt × 3


Observation:
Existing tear near cuff


Affected Quantity:
1

The observation does not change the physical collection quantity.

The system continues to record:

Collected Shirts = 3

## 12.4 Condition Evidence

Where appropriate, the operator may associate the relevant collection photograph or other evidence with the Condition Observation.

The purpose is to preserve the factual context in which the condition was observed.

# 13.  Collection Confirmation

## 13.1 Confirmation Boundary

Collection Confirmation is the point at which the initial collection becomes an established historical business fact.

At Collection Confirmation, the system confirms:

collected physical quantities;
Garment Lines;
requested Services;
applicable Charge Master rates;
Rate Snapshots;
collection evidence;
staff verification;
resident verification status.

## 13.2 Rate Snapshot Timing

The applicable Laundry Charge Master rates are snapshotted at Collection Confirmation.

The transaction therefore records the commercial rates applicable to the requested services at the time of collection confirmation.

Example:

Charge Master at confirmation:


Shirt Cleaning = ₹20
Shirt Ironing  = ₹10

The Laundry Transaction receives:

Rate Snapshot:


Shirt Cleaning = ₹20
Shirt Ironing  = ₹10

If the Charge Master later changes:

Shirt Cleaning = ₹25
Shirt Ironing  = ₹12

the existing Laundry Transaction continues to use:

₹20
₹10

for the services covered by its Rate Snapshots.

## 13.3 Historical Collection Facts

After Collection Confirmation, the following are historical facts:

collected quantity;
Laundry Item;
requested Services;
Rate Snapshots;
collection photographs;
recorded condition observations;
collection confirmation information.

These facts must not be silently overwritten to reflect later processing outcomes.

## 13.4 Collection Confirmation Event

Successful Collection Confirmation produces the Laundry business event:

LaundryCollectionConfirmed

The event represents the confirmed collection business fact.

It is owned by the Laundry domain.

# 14. Amendments and Corrections

## 14.1 Before Collection Confirmation

Before Collection Confirmation, the operator may correct the Draft transaction as part of normal data entry.

Examples:

Change Shirt quantity from 3 to 4

or:

Change Shirt service:
Cleaning
→
Cleaning + Ironing

Such changes are normal Draft editing.

## 14.2 After Collection Confirmation

After Collection Confirmation, the original collection facts are protected from silent editing.

If a genuine business correction is required, the system must use a controlled correction/amendment operation.

The original historical fact must remain auditable.

The system must not simply overwrite the original quantity or service selection without preserving the correction history.

## 14.3 Amendments Must Preserve Historical Meaning

A correction must make it possible to determine:

Original recorded fact
        ↓
Correction
        ↓
Current operational interpretation

The corrected state must never make the original event disappear from the historical record.

# 15. Collection Cancellation

## 15.1 Cancellation Before Processing Release

A confirmed Laundry Collection may be cancelled before the laundry is released for processing.

Cancellation is permitted only when the physical laundry is returned to the resident.

The transaction is not deleted.

The system records the cancellation as a business operation.

## 15.2 Cancellation Boundary

Once the Laundry has been released for processing, the normal pre-processing cancellation operation is no longer available.

Any subsequent return or recovery must be handled through the normal processing, return, delivery, and exception mechanisms.

## 15.3 Cancelled Transaction

A cancelled Laundry Transaction remains part of the historical Laundry record.

Its state becomes:

CANCELLED

The system must retain:

original collection;
cancellation;
cancellation reason;
staff/operator;
timestamp;
relevant evidence.

A cancelled transaction must not be treated as a completed Laundry Transaction.

# 16. Collection Data Integrity

The following invariants apply after Collection Confirmation.

Physical quantity invariant

The original collected quantity is immutable.

Service invariant

The originally requested services remain historically traceable.

Pricing invariant

Historical Rate Snapshots remain unchanged even if the Charge Master changes.

Evidence invariant

Collection photographs remain associated with the original collection.

Audit invariant

A correction must not erase the original historical fact.

# 17. Collection Example

Consider:

Resident:
R-001


Laundry Transaction:
L-001

The resident provides:

3 Shirts
2 Trousers

Service selection:

Shirt × 2
Cleaning + Ironing


Shirt × 1
Cleaning


Trouser × 2
Cleaning

The system records:

Garment Line 1
Shirt × 2
Cleaning + Ironing


Garment Line 2
Shirt × 1
Cleaning


Garment Line 3
Trouser × 2
Cleaning

Physical quantity:

Shirts   = 3
Trousers = 2
Total    = 5 garments

If one Shirt has a pre-existing tear:

Condition Observation
Affected Quantity = 1

The physical quantity remains:

5 garments

After Collection Confirmation:

Collected = 5

This becomes the historical physical baseline for the remainder of the Laundry Transaction.

# 18. Processing Route

## 18.1 Purpose

The Processing Route identifies how a confirmed Laundry Transaction will be processed after collection and inspection.

The MVP supports two Processing Routes:

IN_HOUSE
EXTERNAL_VENDOR

The Processing Route is an operational decision made by the operator.

The resident selects the Laundry Services required, but does not select the Processing Route.

## 18.2 Processing Route Selection

The operator selects the Processing Route after:

Collection Confirmation; and
inspection of the collected laundry;

and before the laundry is released for processing.

The sequence is:

Collection
    ↓
Collection Confirmation
    ↓
Inspection
    ↓
Processing Route Selection
    ↓
Processing Release

The Processing Route must be established before the Laundry Transaction enters active processing.

## 18.3 Processing Route Does Not Determine Pricing

Processing Route is independent of resident-facing commercial pricing.

The same Laundry Service and Rate Snapshot apply regardless of whether the laundry is processed:

IN_HOUSE

or:

EXTERNAL_VENDOR

For example:

Shirt + Cleaning
Rate Snapshot = ₹20

remains ₹20 whether the operator selects:

IN_HOUSE

or:

EXTERNAL_VENDOR

Processing Route must never be used as an implicit pricing rule.

# 19. Processing Release

## 19.1 Definition

Processing Release is the business operation through which the collected and inspected Laundry Transaction is released for processing.

Processing Release establishes that:

collection has been confirmed;
inspection has been completed as required;
Processing Route has been selected;
the laundry is ready to enter processing.

## 19.2 Processing Release Event

A successful Processing Release produces the Laundry business event:

LaundryProcessingReleased

The event is owned by the Laundry domain.

The event must identify the Processing Route.

Example:

LaundryProcessingReleased


Processing Route:
EXTERNAL_VENDOR

or:

LaundryProcessingReleased


Processing Route:
IN_HOUSE

## 19.3 Processing Release Is Not a Vendor-Specific Concept

The Processing Release concept is deliberately independent of external vendors.

For an external route:

Processing Release
        ↓
External Vendor

For an in-house route:

Processing Release
        ↓
Internal Laundry Processing

The core Laundry lifecycle therefore does not depend on the existence of a vendor.

# 20. External Vendor Processing

## 20.1 External Vendor Selection

When the operator selects:

Processing Route = EXTERNAL_VENDOR

the operator must select the external laundry vendor responsible for processing.

The selected vendor is recorded as part of the Processing information.

## 20.2 Release to External Vendor

The physical laundry is handed over by RPGMS staff to the selected external vendor.

The system records the Processing Release.

The Laundry Transaction enters the external processing state:

WITH_VENDOR

The system does not require a vendor-side electronic manifest for MVP.

The authoritative physical quantity remains the quantity recorded by RPGMS staff.

## 20.3 Vendor-Side Quantity Is Not Authoritative

The current business operation does not maintain a vendor-side Laundry manifest.

Therefore, RPGMS must not assume that the vendor returned the quantity originally collected.

The authoritative return quantity is established when RPGMS staff physically receives and checks the returned laundry.

For example:

Collected:
Shirt × 3
Trouser × 2

Vendor physically returns:

Shirt × 3
Trouser × 1

RPGMS records:

Returned = 4

The missing Trouser is identified through reconciliation.

## 20.4 Vendor Processing State

While the Laundry is with the external vendor, the transaction is represented operationally as:

WITH_VENDOR

This state means:

The Laundry has been released to an external vendor and has not yet been recorded as returned to RPGMS.

## 20.5 External Vendor Return

When the vendor physically returns laundry, RPGMS staff:

receives the laundry;
counts the returned pieces;
checks the returned laundry;
records the actual quantities received;
records any discrepancies or service issues.

The return is recorded as a:

Laundry Return

rather than as a vendor-provided quantity statement.

# 21. In-House Processing — MVP

## 21.1 Purpose

In-house processing allows RPGMS to process Laundry internally without introducing a separate internal laundry operations subsystem.

The MVP deliberately keeps this workflow simple.

## 21.2 In-House Route

When the operator selects:

Processing Route = IN_HOUSE

the Laundry Transaction enters internal processing.

The system records that the laundry is being processed internally.

## 21.3 No Detailed Internal Operations in MVP

The MVP does not record:

washing machine;
dryer;
processing station;
staff task assignment;
washing stage;
drying stage;
ironing station;
machine capacity;
internal production queue;
internal processing cost.

These are future capabilities.

## 21.4 In-House Processing Completion

For MVP, the operator records that the internal processing has been completed and that the processed laundry is ready to be returned into the normal Laundry handover flow.

The system then creates the corresponding:

Laundry Return

record.

The common Laundry workflow resumes:

In-House Processing
        ↓
Laundry Return
        ↓
Delivery

## 21.5 In-House Processing Does Not Create a Different Transaction Type

An in-house Laundry Transaction is still the same Laundry Transaction.

There is no separate:

In-House Laundry Transaction

entity.

Instead:

Laundry Transaction
Processing Route = IN_HOUSE

is used.

This ensures that external and internal processing share:

Garment Lines;
Services;
Rate Snapshots;
Collection;
Return;
Delivery;
Exceptions;
Resolution;
Chargeability;
Finance integration.

# 22. Processing Lifecycle

The operational processing lifecycle is:

COLLECTED
    ↓
PROCESSING ROUTE SELECTED
    ↓
PROCESSING RELEASED
    ↓
PROCESSING
    ↓
LAUNDRY RETURN
    ↓
AWAITING HANDOVER

The exact operational state displayed to the user may depend on the Processing Route.

For external processing:

COLLECTED
    ↓
WITH_VENDOR
    ↓
AWAITING_HANDOVER

For in-house processing:

COLLECTED
    ↓
IN_HOUSE_PROCESSING
    ↓
AWAITING_HANDOVER

The underlying business events remain the authoritative history.

# 23. Processing State and Business Events

Current status is an operational projection.

Business Events are immutable historical facts.

For example:

LaundryProcessingReleased
        ↓
Current Projection:
WITH_VENDOR

Later:

LaundryReturned
        ↓
Current Projection:
AWAITING_HANDOVER

The status must not replace the event history.

The system must be able to reconstruct the operational history from the recorded business events.

# 24. Processing Route Immutability

Once processing has actually been released, the Processing Route must not be silently changed.

For example:

EXTERNAL_VENDOR

must not simply be edited to:

IN_HOUSE

after the laundry has already been physically released to the vendor.

If a genuine operational change is required after release, it must be represented through a controlled business operation that preserves the original processing history.

# 25. Changing the Processing Route Before Release

Before Processing Release, the operator may change the selected Processing Route.

Example:

Selected:
EXTERNAL_VENDOR

The operator subsequently decides:

IN_HOUSE

provided the laundry has not yet been released for processing.

The final selected route at Processing Release becomes the historical Processing Route for the processing cycle.

# 26. Processing Route and Garment Lines

For MVP, Processing Route applies to the entire Laundry Transaction.

The system does not support routing individual Garment Lines or individual Services to different processing providers.

For example, the following is supported:

Laundry Transaction
Processing Route = EXTERNAL_VENDOR


Shirt × 2
Cleaning + Ironing


Trouser × 2
Cleaning

The following is not supported in MVP:

Shirt Cleaning
→ In-House


Shirt Ironing
→ External Vendor

or:

Shirt
→ Vendor A


Trouser
→ Vendor B

Service-level or garment-level routing may be introduced as a future extension if operational requirements justify it.

# 27. Processing Exceptions

Processing may reveal discrepancies or service failures.

Examples include:

missing garment;
damaged garment;
wrong garment returned;
requested service not performed;
requested service only partially performed;
quality issue.

Such problems are recorded as Laundry Exceptions.

The Processing Route does not change the Exception model.

For example:

IN_HOUSE
   ↓
Damage Exception

and:

EXTERNAL_VENDOR
   ↓
Damage Exception

both use the same Exception and Resolution model.

# 28. Partial Processing Return

A Laundry Return may contain fewer physical garments than were originally collected.

Example:

Collected:
Shirt × 3
Trouser × 2


Total Collected:
5

Return:

Shirt × 3
Trouser × 1


Total Returned:
4

The system records:

Collected = 5
Returned = 4

The missing physical quantity is:

Outstanding = 1

The missing quantity must be represented through reconciliation and, where appropriate, a Laundry Exception.

The original Garment Lines are not modified.

# 29. Service Processing Outcome

The processing outcome must distinguish between:

physical return; and
service fulfillment.

A garment may be physically returned while one or more requested services were not fulfilled.

Example:

Requested:


Shirt × 2
Cleaning + Ironing

Returned:

Shirt × 2
Cleaning completed
Ironing not completed

The physical quantity returned is:

2 Shirts

but the service outcome is:

Cleaning = Fulfilled
Ironing  = Not Fulfilled

The missing service is recorded as a Laundry Exception where appropriate.

# 30. Processing and Chargeability

A returned garment is not automatically fully chargeable merely because it has been physically returned.

Chargeability is determined separately for each requested service.

A service becomes chargeable only when:

Service Fulfilled
+
Affected Physical Quantity Delivered

Therefore:

Shirt Cleaning

may become chargeable while:

Shirt Ironing

remains non-chargeable if ironing was not performed.

If ironing is subsequently performed and the affected quantity is delivered, the Ironing service becomes chargeable using the Rate Snapshot captured at Collection Confirmation.

# 31. Processing Example — External Vendor

Example:

Laundry Transaction L-0027


Garment Lines:


Shirt × 2
Cleaning + Ironing


Shirt × 1
Cleaning


Trouser × 2
Cleaning

Collection is confirmed.

The operator selects:

Processing Route:
EXTERNAL_VENDOR


Vendor:
ABC Laundry

Processing Release occurs.

Current state:

WITH_VENDOR

The vendor returns:

Shirt × 2
Shirt × 1
Trouser × 1

RPGMS records:

Returned = 4

The remaining Trouser quantity is identified as outstanding.

An Exception may be raised:

MISSING
Affected Quantity = 1

The four returned garments proceed to the Delivery workflow.

# 32. Processing Example — In-House

The same Laundry Transaction could instead have:

Processing Route:
IN_HOUSE

The operator records that internal processing is underway.

No machine, staff station, or internal processing task is required in MVP.

When processing is complete, the processed laundry is recorded as returned.

The same Delivery workflow then applies.

This demonstrates that Processing Route changes the processing path without changing the core Laundry Transaction model.

# 33. Laundry Return

## 33.1 Purpose

A Laundry Return records laundry physically received back by RPGMS after processing.

The Return establishes the quantity that has physically come back into RPGMS custody.

A Laundry Return is independent of the original Collection quantity.

The system must record the quantity actually received rather than assuming that all collected laundry has been returned.


## 33.2 Return Verification

When processed laundry is physically received, RPGMS staff:

1. receives the laundry;
2. counts the physical pieces;
3. checks the returned laundry against the original Garment Lines;
4. identifies any discrepancy;
5. records the actual returned quantities;
6. records applicable Exceptions.

The staff member performing the verification is recorded.

## 33.3 Returned Quantity

Returned quantity represents the physical quantity actually received and verified by RPGMS staff.

Example:

Collected:

Shirt × 3
Trouser × 2

Total Collected = 5

Actual return:

Shirt × 3
Trouser × 1


Total Returned = 4

The system records:

Collected = 5
Returned = 4

It must not automatically record:

Returned = 5

merely because five garments were originally collected.

## 33.4 Return Reconciliation

The system reconciles each Laundry Return against the original Garment Lines.

The reconciliation identifies:

quantity returned;
quantity not yet returned;
quantity previously returned;
quantity already delivered;
quantity otherwise resolved.

The original Garment Lines remain unchanged.

## 33.5 Partial Return

A Laundry Transaction may have a partial return.

Example:

Collected = 5
Returned = 4

The Laundry Transaction remains operationally incomplete because one physical piece has not yet been accounted for.

The outstanding quantity must be investigated where appropriate.

A missing quantity may result in a Laundry Exception.

## 33.6 Multiple Returns

The Laundry domain may record more than one Laundry Return for the same Laundry Transaction.

Example:

Return #1
4 garments


Return #2
1 garment

The cumulative returned quantity is:

4 + 1 = 5

The original Collection remains:

Collected = 5

The Laundry Transaction may therefore receive additional physical laundry after the first Return.

## 33.7 Return Condition Check

Staff must check the returned laundry for observable discrepancies.

Examples include:

missing quantity;
damage;
wrong garment;
requested service not performed;
requested service only partially performed;
quality issue.

These observations may result in Laundry Exceptions.

## 33.8 Return Does Not Mean Delivery

A Laundry Return means:

The laundry has come back into RPGMS custody.

It does not mean:

The resident has received the laundry.

Therefore:

Returned ≠ Delivered

A returned garment remains available for Delivery until physically handed over.

# 34. Delivery

## 34.1 Purpose

A Delivery records the physical handover of returned laundry from RPGMS to the resident or to the resident's accommodation location according to the accepted handover process.

A Laundry Transaction may contain multiple Deliveries.

## 34.2 Delivery Eligibility

Laundry may be delivered only from quantities that have been physically returned and verified.

The system must prevent Delivery quantities from exceeding the quantity available for handover.

Conceptually:

Deliverable Quantity
=
Verified Returned Quantity
− Previously Delivered Quantity

Resolved quantities that have not been physically returned must not be treated as available for Delivery.

## 34.3 Partial Delivery

A Laundry Transaction may be partially delivered.

Example:

Collected = 5
Returned = 5


Delivery #1 = 3

Remaining deliverable quantity:

5 − 3 = 2

The transaction remains operationally incomplete until the remaining quantity is delivered or otherwise resolved.

## 34.4 Multiple Deliveries

Multiple Deliveries may occur for the same Laundry Transaction.

Example:

Delivery #1
3 garments


Delivery #2
1 garment


Delivery #3
1 garment

The system must maintain each Delivery as a separate historical business fact.

The original Garment Lines are never rewritten to represent the deliveries.

## 34.5 Delivery Lines

Each Delivery contains one or more Delivery Lines.

A Delivery Line identifies:

source Garment Line;
quantity delivered;
handover information.

Example:

Original Garment Line:


Shirt × 3


Delivery #1:


Shirt × 2


Delivery #2:


Shirt × 1

The original Garment Line remains:

Shirt × 3

The Delivery Lines provide the physical handover history.

# 35. Handover Methods
    
## 35.1 Direct Handover

DIRECT_HANDOVER means staff physically hands the laundry to the resident.

The resident may inspect the laundry at handover.

The system records the Delivery and the resident verification result.

## 35.2 Room Placement

ROOM_PLACEMENT means staff places the returned laundry in the resident's room based on an instruction previously given by the resident.

Room Placement is valid even when the resident is not physically present.

Example:

Resident instruction:


"If the laundry comes back while I am away,
keep it in my room."

Staff may therefore complete:

Handover Method = ROOM_PLACEMENT
Resident Present = NO
Resident Verification = NO

provided the staff member physically places the laundry in the resident's room.

## 35.3 Resident Instruction

Where ROOM_PLACEMENT is used, the system records that the placement was performed under the resident's instruction.

The MVP does not require:

OTP;
digital signature;
biometric confirmation;
resident presence.

The staff member records the physical placement.

# 36.  Resident Verification

## 36.1 Verification Is Separate From Delivery

Resident Verification and Delivery are independent facts.

A Delivery can therefore be completed when:

Delivered = YES
Resident Verified = NO

This is valid when laundry is placed in the resident's room while the resident is absent.

## 36.2 Direct Handover Verification

For DIRECT_HANDOVER, the resident may verify:

quantity;
Laundry Items;
visible condition;
returned service outcome.

The verification result is recorded with the Delivery.

## 36.3 Verification Outcome

The system should record whether the resident:

VERIFIED
NOT_VERIFIED

Where a resident identifies a problem during or after handover, an appropriate Laundry Exception may be raised.

Resident Verification does not modify the original Collection facts.

## 37. Delivery Confirmation

## 37.1 Delivery Confirmation Boundary

A Delivery becomes a confirmed business fact when staff confirms that the physical handover has occurred.

The Delivery records:

Delivery identifier;
Laundry Transaction;
Delivery Lines;
quantities;
handover method;
staff member;
delivery timestamp;
resident presence;
resident verification status where applicable;
room placement information where applicable.

## 37.2 Delivery Event

A confirmed Delivery produces:

LaundryDelivered

The event is owned by the Laundry domain.

The event represents physical handover.

It does not by itself represent:

resident verification;
financial payment;
financial settlement.

# 38. Delivery and Exceptions

## 38.1 Exception Does Not Automatically Prevent Delivery

A Laundry Exception does not automatically prevent Delivery.

For example:

Garment:
Shirt × 1


Exception:
Existing damage / processing damage

If the resident accepts the physical garment, staff may deliver it.

The system records:

Delivered = 1
Exception = OPEN

The Laundry Transaction may still complete physically while the Exception remains open.

## 38.2 Identity Dispute

An identity dispute is different.

If the resident or staff determines that the returned garment cannot be confidently associated with the resident's Laundry Transaction, the affected quantity must not be treated as successfully delivered until the identity issue is resolved.

Example:

Returned:
Shirt × 1


Resident:
"This is not my shirt."

The system records an appropriate Exception.

The disputed quantity remains unresolved for purposes of the Laundry Transaction until the business outcome is established.

## 38.3 Damaged Garment Accepted by Resident

A damaged garment may still be delivered if the resident accepts physical handover.

Example:

Collected = 1
Returned = 1
Delivered = 1


Exception:
DAMAGED
Status = OPEN

The Delivery remains valid.

The Exception follows its own Investigation and Resolution lifecycle.

# 38.4 Service Not As Requested

A garment may be physically delivered even when one requested service was not fulfilled.

Example:

Requested:


Shirt × 2
Cleaning + Ironing


Returned:


Shirt × 2
Cleaning completed
Ironing not completed

If the resident accepts the physical garments, the Delivery may be completed.

However:

Cleaning = Fulfilled
Ironing = Not Fulfilled

The unfulfilled Service remains non-chargeable until the Service is subsequently fulfilled for the affected quantity.

If the affected physical quantity has already been delivered, the Service may become chargeable when the later fulfillment occurs.

A second physical Delivery is not required merely because a previously delivered Service was subsequently fulfilled.

If the corrective Service requires the garment to be physically collected again and returned again, those additional physical movements are recorded as separate operational events and must not overwrite the original Delivery history.

# 39. Delivery and Chargeability

Delivery is one of the conditions required for a Laundry Service to become chargeable.

A service becomes chargeable only when both conditions are satisfied:

1. Service Fulfilled
2. Affected Quantity Delivered

Therefore:

Requested
   ↓
Fulfilled
   ↓
Delivered
   ↓
Chargeable

A physical Delivery alone does not automatically make every requested service chargeable.

39.1 Example — Service Fulfilled
Requested:
Shirt × 2
Cleaning + Ironing


Returned:
Shirt × 2
Cleaning + Ironing completed


Delivered:
Shirt × 2

Both services are chargeable:

Cleaning × 2
Ironing × 2

using the original Rate Snapshots.

39.2 Example — Service Not Fulfilled
Requested:
Shirt × 2
Cleaning + Ironing


Returned:
Shirt × 2
Cleaning completed
Ironing not completed


Delivered:
Shirt × 2

Chargeable:

Cleaning × 2

Not chargeable:

Ironing × 2

If the vendor or in-house operation subsequently performs the Ironing and the shirts are delivered after that fulfillment, the Ironing becomes chargeable using its original Rate Snapshot.

# 40. Laundry Return and Delivery Example

Consider:

Collected:


Shirt × 3
Trouser × 2


Total = 5

First Return:

Shirt × 3
Trouser × 1


Returned = 4

The system identifies:

Outstanding physical quantity = 1

Delivery #1:

Shirt × 2
Trouser × 1


Delivered = 3

Remaining returned and deliverable quantity:

4 − 3 = 1

The remaining Shirt may then be delivered separately:

Delivery #2
Shirt × 1

At this point:

Collected = 5
Returned = 4
Delivered = 4

One Trouser remains unreturned.

The Laundry Transaction therefore remains incomplete.

Later, the second Return occurs:

Return #2
Trouser × 1

Then:

Collected = 5
Returned = 5
Delivered = 4

Final Delivery:

Delivery #3
Trouser × 1

Now:

Collected = 5
Returned = 5
Delivered = 5

The physical Laundry relationship is complete.

# 41. Physical Quantity Reconciliation

The Laundry domain maintains a physical reconciliation across the lifecycle.

The core quantities are:

Collected  
Returned  
Delivered  
Resolved

Where `Resolved` represents physical quantity that has been **conclusively accounted for through an Exception Resolution and is no longer expected to be physically delivered**.

Examples include:

- permanently lost Laundry;
- another formally resolved outcome where physical delivery will no longer occur.

The following do not create Resolved Quantity:

- an open Exception;
- an Exception under investigation;
- a quantity merely identified as missing;
- a quantity affected by a Damage Exception;
- a quantity affected by an Identity Dispute;
- a service failure.

A recovered item does not create Resolved Quantity.

A recovered item becomes part of the Returned quantity only when RPGMS physically receives and verifies it.

The core reconciliation invariant is:

Outstanding =
Collected
− Delivered
− Resolved

A Laundry Transaction is physically complete when:

Outstanding = 0

## 41.1 Important Distinction: Returned vs Resolved

A quantity that is resolved as permanently lost is not treated as returned.

Example:

Collected = 5
Returned = 4
Delivered = 4
Resolved = 1

Then:

Outstanding = 5 − 4 − 1
            = 0

The Laundry Transaction may therefore become physically complete even though only four garments were physically returned.

The historical record still clearly shows:

Collected = 5
Returned = 4
Resolved = 1

This distinction must be preserved.

# 42. Delivery Does Not Rewrite Collection

A Delivery never changes:

- original collected quantity;
- original Garment Lines;
- original requested Services;
- Rate Snapshots;
- Collection photographs;
- original Condition Observations.

Delivery records what happened later.

This ensures that the Laundry history remains reconstructable.

# 43. Delivery Example — Room Placement

Example:

Laundry Transaction:
L-0027


Returned:
4 garments

Resident previously instructed:

"If I am out, keep the laundry in my room."

Resident is absent.

Staff places the four garments in the resident's room.

Delivery:

Handover Method = ROOM_PLACEMENT
Resident Present = NO
Resident Verified = NO
Staff = [Staff Member]

The physical Delivery is confirmed.

The transaction records:

Delivered = 4

The absence of resident verification does not invalidate the physical handover.

# 44. Delivery History

Each Delivery must remain independently traceable.

For example:

Laundry Transaction L-0027


Delivery #1
19 Aug 16:10
3 garments
ROOM_PLACEMENT
Resident absent


Delivery #2
20 Aug 10:30
1 garment
DIRECT_HANDOVER
Resident verified

The Delivery history allows the system to answer:

- what was delivered;
- When it was delivered;
- how it was delivered;
- who performed the handover;
- whether the resident verified it;
- which Garment Lines and quantities were involved.

# 45. Delivery and Operational Completion

Delivery contributes to the physical completion calculation.

However, Delivery alone does not guarantee completion.

The Laundry Transaction becomes physically complete only when:

Collected
− Delivered
− Resolved
=
0

Therefore:

All Collected Quantity
        ↓
Delivered
     OR
Resolved
        ↓
Outstanding = 0
        ↓
Laundry Transaction Completed

An unrelated open Exception does not automatically prevent completion when the physical quantity has been fully delivered or resolved.

# 46. Delivery Business Principles

The following principles apply:

1. Only physically returned and verified quantities may be delivered.
2. Delivery may be partial.
3. Multiple Deliveries are supported.
4. Delivery records physical handover.
5. Resident Verification is a separate fact.
6. Room Placement is a valid MVP handover method.
7. An open condition or quality Exception does not automatically prevent Delivery.
8. Identity disputes require resolution before the affected quantity can be treated as successfully delivered.
9. Delivery does not modify original Collection facts.
10. Delivery is one of the conditions required for service chargeability.
11. Delivery history is immutable once confirmed.
12. Physical completion is determined by quantity reconciliation, not merely by the existence of a Delivery record.

# 47. Laundry Exceptions

## 47.1 Purpose

A Laundry Exception records a problem, discrepancy, dispute, or quality issue identified during the Laundry lifecycle.

An Exception provides a controlled mechanism to investigate and resolve an operational problem without rewriting the original Laundry history.

Exceptions may arise during:

- collection;
- inspection;
- processing;
- return;
- delivery;
- post-delivery verification.

## 47.2 Exception as a Separate Business Fact

An Exception is a business fact about something that went wrong or requires investigation.

It is not a replacement for the original Laundry facts.

For example, if:

Collected:
Trouser × 2

and:

Returned:
Trouser × 1

the system must preserve:

Collected = 2
Returned = 1

and create an Exception:

Type = MISSING
Affected Quantity = 1

The Exception does not change the original Collection quantity from 2 to 1.

# 48. Exception Types

The Laundry domain supports the following operational Exception categories.

## 48.1 Missing

A physical Laundry Item expected from the Collection has not been returned.

Example:

Collected:
Trouser × 2


Returned:
Trouser × 1


Exception:
MISSING
Affected Quantity = 1
48.2 Damaged

A Laundry Item is returned with damage that was not present or not recorded at Collection.

Examples include:

- torn fabric;
- damaged button;
- damaged zip;
- other processing-related physical damage.

A pre-existing defect recorded during Inspection is not automatically a Damage Exception.

## 48.3 Existing Condition Dispute

A dispute may arise concerning whether a physical condition existed before processing.

Collection photographs and Condition Observations may be used as evidence.

The Exception records the dispute without changing the original Condition Observation.

## 48.4 Wrong Item Returned

A physically returned Laundry Item may not correspond to the resident's collected Laundry.

Example:

Resident collected:
Blue Shirt


Returned:
Different Shirt

This may be recorded as:

WRONG_ITEM_RETURNED

The affected quantity remains unresolved until the business outcome is established.

## 48.5 Identity Dispute

An identity dispute occurs when it cannot be established that a returned physical item belongs to the resident's Laundry Transaction.

Example:

Returned:
Shirt × 1


Resident:
"This is not my shirt."

The affected quantity must not be treated as successfully delivered until the identity issue is resolved.

## 48.6 Service Not Performed

A requested Laundry Service was not performed.

Example:

Requested:
Cleaning + Ironing


Actual:
Cleaning only

The Cleaning Service is fulfilled.

The Ironing Service is not fulfilled.

## 48.7 Service Not Performed as Requested

A requested service was performed, but the expected service outcome was not achieved.

Examples may include:

- inadequate cleaning;
- ironing not completed to the requested outcome;
- other service-quality failure.
  
## 48.8 Quality Issue

A Laundry Item is returned but does not meet the expected service outcome.

Examples include:

- unacceptable cleaning quality;
- visible residual stain;
- poor ironing result;
- other quality concern.
  
## 48.9 Quantity Discrepancy

A quantity discrepancy is identified where the physical count does not match the expected quantity.

Quantity discrepancies may result in a Missing Exception or other appropriate Exception type depending on the investigation.

## 48.10 Other

An operational issue that does not fit the defined Exception categories may be recorded as:

OTHER

The operator must provide an appropriate description.

# 49.  Exception Lifecycle

An Exception follows its own lifecycle.

The MVP lifecycle is:

OPEN
  ↓
UNDER_INVESTIGATION
  ↓
RESOLVED

Where appropriate, the system may allow an Exception to be closed as a non-actionable or informational outcome according to the project's general Exception conventions.

The Laundry specification does not require an Exception to remain open until the Laundry Transaction itself is complete.

# 50. Exception Creation

## 50.1 Who May Raise an Exception

An Exception may be raised by authorized RPGMS staff when a discrepancy or issue is identified.

The resident may also report a problem, but the system records the resulting Exception as an RPGMS Laundry business fact.

## 50.2 Exception Evidence

Where relevant, an Exception may reference available evidence, including:

- Collection Photographs;
- Condition Observations;
- Return information;
- Delivery information;
- staff observations;
- resident statements;
- vendor communication;
- other supporting information.

Evidence must not be used to overwrite historical facts.

## 50.3 Exception Affected Quantity

Where an Exception applies to only part of a Garment Line, the affected quantity must be recorded separately.

Example:

Garment Line:
Shirt × 3


Exception:
DAMAGED


Affected Quantity:
1

The original Garment Line remains:

Shirt × 3

# 51. Exception Investigation

## 51.1 Purpose

Investigation determines:

what happened;
which physical quantity is affected;
whether the issue is genuine;
whether responsibility can be established;
what operational resolution is appropriate;
whether a financial consequence may be required.

## 51.2 Investigation Participants

Investigation may involve:

Laundry staff;
the operator;
the resident;
the external vendor;
other authorized RPGMS staff.

The specific participants depend on the Exception.

## 51.3 Investigation Process

The operator may:

review the original Collection;
review Collection Photographs;
review Condition Observations;
inspect returned Laundry;
compare returned items against the original collection;
discuss the issue with staff;
contact the resident;
contact the external vendor where applicable;
determine the operational outcome.
51.4 Vendor Investigation

For External Vendor Processing, the operator may investigate discrepancies directly with the vendor.

Examples:

Missing item
Damage
Service not performed
Quality issue

The vendor's response is recorded as investigation information.

A vendor response is not automatically accepted as authoritative physical evidence.

RPGMS staff's physical verification remains authoritative for what was actually returned.

## 51.5 In-House Investigation

For In-House Processing, investigation is performed internally.

The same Exception model applies.

No separate In-House Exception system is required in MVP.

# 52. Exception Resolution

## 52.1 Purpose

Resolution records the business outcome of an Exception investigation.

A Resolution may state that:

- the item was subsequently returned;
- the service was subsequently completed;
- the resident accepted the item;
- the vendor corrected the issue;
- RPGMS corrected the issue;
- the item was permanently lost;
- a financial adjustment is required;
- no financial adjustment is required;
- the issue was otherwise resolved.

## 52.2 Resolution Examples

Item Recovered
Exception:
MISSING
Affected Quantity:
1


Resolution:
ITEM_RECOVERED

The recovered item is then processed through the normal Return and Delivery workflow.

Service Corrected
Exception:
SERVICE_NOT_PERFORMED


Resolution:
SERVICE_CORRECTED

The service is subsequently fulfilled.

The affected quantity becomes chargeable only after the service is fulfilled and the affected quantity is delivered.

Vendor Corrected
Exception:
SERVICE_NOT_PERFORMED


Resolution:
VENDOR_CORRECTED

The vendor performs the required corrective service.

Permanently Lost
Exception:
MISSING


Resolution:
PERMANENTLY_LOST
Affected Quantity:
1

The affected quantity may contribute to Resolved for physical reconciliation.

It is not treated as returned.

# 53. Responsible Party

## 53.1 Purpose

The investigation may determine whether responsibility can be attributed to a party.

Possible outcomes include:

VENDOR
RESIDENT
RPGMS
UNKNOWN
NONE
OTHER

Responsibility is an operational conclusion.

## 53.2 Responsibility Does Not Automatically Create Liability

The system must not automatically create a financial liability merely because an Exception identifies a Responsible Party.

For example:

Responsible Party = VENDOR

does not automatically mean:

Finance Adjustment = Required

Financial consequences require an explicit business decision and are handled by Finance.

# 54. Exception and Physical Reconciliation

An Exception may affect the physical reconciliation of a Laundry Transaction.

Example:

Collected = 5
Returned = 4
Delivered = 4

One item is missing.

If investigation concludes:

Resolution = PERMANENTLY_LOST

then:

Resolved = 1

and:

Outstanding =
5 − 4 − 1
= 0

The physical Laundry relationship can therefore become complete.

The historical record still shows that:

5 were collected
4 were physically returned
1 was permanently lost

# 55. Exception and Delivery

An Exception does not automatically prevent physical Delivery.

Example:

Returned:
Shirt × 1


Exception:
DAMAGED


Resident:
Accepts the shirt

The system may record:

Delivered = 1
Exception = OPEN

The Delivery remains valid.

The Exception continues through its own Investigation and Resolution lifecycle.

# 56. Exception and Identity Disputes

An identity dispute is treated differently from a normal quality issue.

If RPGMS physically receives and verifies a returned garment, that physical quantity remains part of the `Returned` quantity even if its identity is disputed.

For example:

Returned:
Shirt × 1

Resident:
"This is not mine."

The system records:

Returned = 1

and creates an appropriate Identity Dispute Exception.

However, the disputed quantity is **not eligible for Delivery against the resident's Laundry Transaction** while the identity issue remains unresolved.

Therefore:

Returned ≠ Successfully Delivered

for an identity-disputed quantity.

The disputed quantity remains unresolved for the purpose of Delivery and final business outcome until the identity issue is resolved.

The system must not:

- remove the physical Return merely because identity is disputed;
- treat the disputed quantity as Delivered;
- silently substitute the disputed garment for the originally collected garment.

The eventual Resolution determines the final business outcome.

# 57. Exception and Service Fulfillment

An Exception may identify that a requested service has not been fulfilled.

Example:

Requested:
Shirt × 2
Cleaning + Ironing


Returned:
Shirt × 2
Cleaning completed
Ironing not completed

The Exception may record:

Type:
SERVICE_NOT_PERFORMED


Affected Service:
IRONING


Affected Quantity:
2

The Ironing service remains non-chargeable.

If the shirts are subsequently ironed:

Service Fulfillment:
IRONING = FULFILLED

and subsequently delivered:

Affected Quantity Delivered = 2

the Ironing service becomes chargeable.

# 58. Exception Resolution and Financial Consequence

A Resolution may indicate that a financial consequence should be considered.

Examples:

permanent loss;
confirmed damage;
service failure;
agreed compensation;
other commercial adjustment.

The Laundry domain records the operational outcome and communicates the required financial consequence to Finance.

Finance determines and records the authoritative financial transaction.

Laundry must not directly modify:

Finance Charges;
Payments;
financial ledger entries;
resident account balances.

# 59. Exception Resolution Event

A confirmed Resolution produces the Laundry business event:

LaundryExceptionResolved

The event records that the Laundry Exception has reached an established business outcome.

If the Resolution requires a financial action, that is communicated through the appropriate Finance integration.

# 60. Exception Does Not Rewrite History

The following historical facts must remain preserved even after Resolution:

- original Collection quantity;
- original Garment Lines;
- original requested Services;
- Rate Snapshots;
- Collection Photographs;
- Condition Observations;
- Return quantities;
- Delivery quantities;
- original Exception;
- Investigation history;
- Resolution.

Resolution adds a new business fact.

It does not replace the old one.

# 61. Exception Example — Missing Trouser

A resident provides:

Trouser × 2
Cleaning

Collection is confirmed:

Collected = 2

Vendor returns:

Trouser × 1

RPGMS records:

Returned = 1

The system identifies:

Outstanding = 1

An Exception is raised:

Type:
MISSING


Affected Quantity:
1


Status:
OPEN

Investigation begins:

UNDER_INVESTIGATION

The vendor later returns the missing Trouser.

The second Return records:

Returned additional = 1

The Exception is resolved:

Resolution:
ITEM_RECOVERED

The recovered Trouser then enters the normal Delivery workflow.

# 62. Exception Example — Service Not Performed

A resident requests:

Shirt × 2
Cleaning + Ironing

The vendor returns:

Shirt × 2
Cleaning completed
Ironing not completed

Staff records:

Returned = 2

An Exception is raised:

Type:
SERVICE_NOT_PERFORMED


Affected Service:
IRONING


Affected Quantity:
2

The shirts may be delivered if the resident accepts them or if they are placed in the resident's room according to the agreed handover instruction.

However:

Ironing = Not Fulfilled

Therefore:

Ironing Charge = ₹0

The vendor subsequently irons the shirts.

The service becomes:

Ironing = Fulfilled

When the affected quantity is subsequently delivered, the Ironing service becomes chargeable at the original Rate Snapshot.

No new Rate lookup occurs.

# 63. Exception Example — Existing Damage

At Collection Inspection:

Shirt × 1
Existing tear near cuff

A Condition Observation is recorded.

The laundry is subsequently returned with the same tear.

This is not automatically a Damage Exception because the condition was already recorded at Collection.

If the resident disputes the condition, an Exception may be raised concerning the pre-existing condition.

The original Condition Observation remains unchanged and can be used as evidence.

# 64. Exception Business Principles

The following principles apply:

1. An Exception records a problem without rewriting historical facts.
2. Exceptions may apply to a partial quantity.
3. Exceptions have their own lifecycle.
4. Investigation determines the operational outcome.
5. Responsibility is separate from financial liability.
6. A vendor response is not automatically authoritative over RPGMS physical verification.
7. A physical Delivery may occur while an Exception remains open, except where the affected quantity has an unresolved identity/dispute issue.
8. An Exception does not automatically prevent Laundry Transaction completion.
9. A resolved missing item becomes physically returned only when it is actually received.
10. A resolved service failure becomes chargeable only after the service is fulfilled and the affected quantity is delivered.
11. Financial consequences are handled by Finance.
12. Exception history is immutable once recorded.

# 65. Chargeability and Finance Integration

## 65.1 Purpose

The Laundry domain determines when a requested Laundry Service has become operationally chargeable.

The Finance domain owns the authoritative financial Charge.

The boundary between the two domains is:

Laundry determines:

- what service was requested;
- what rate was applicable;
- whether the service was fulfilled;
- what physical quantity was affected;
- whether the affected quantity was delivered.

Finance determines:

- the authoritative Charge;
- Payments;
- Payment Allocations;
- financial Adjustments;
- financial balances;
- financial settlement.

---

# 66. Requested Service

A Requested Service is a service selected by the resident for a specific physical quantity of a Laundry Item.

Example:

Shirt × 2  
Cleaning + Ironing

This represents:

- Cleaning requested for 2 Shirts;
- Ironing requested for the same 2 Shirts.

A Requested Service is not automatically a Charge.

---

# 67. Service Fulfillment

A Requested Service becomes fulfilled only when the requested service has actually been performed for the affected physical quantity.

Example:

Requested:

Shirt × 2  
Cleaning + Ironing

Actual processing:

Cleaning completed  
Ironing not completed

The resulting service status is:

Cleaning = Fulfilled  
Ironing = Not Fulfilled

The physical Shirts may still be returned and delivered.

However, the unfulfilled Ironing service is not chargeable.

---

# 68. Service Delivery

For chargeability purposes, delivery is evaluated against the affected physical quantity of the service.

Example:

Requested:

Shirt × 3  
Cleaning + Ironing

Processing:

Cleaning + Ironing completed for all 3

Delivery:

Shirt × 2

The chargeable quantity at this point is:

Cleaning = 2  
Ironing = 2

The remaining quantity is:

1 Shirt

That remaining Shirt becomes chargeable for those services only when it is subsequently delivered.

---

# 69. Chargeability Rule

A Requested Service becomes chargeable only when both conditions are satisfied:

1. The service has been fulfilled for the affected quantity.
2. The affected physical quantity has been delivered.

Therefore:

Requested Service ≠ Charge

Fulfilled Service ≠ Charge

Delivered Quantity ≠ Charge

The service becomes chargeable only when:

Service Fulfilled + Affected Quantity Delivered

---

# 70. Chargeability Is Service-Specific

Chargeability is determined separately for each Laundry Service.

Example:

Shirt × 2

Requested:

Cleaning + Ironing

Processing result:

Cleaning = Fulfilled  
Ironing = Not Fulfilled

Delivery:

Shirt × 2

Chargeable:

Cleaning × 2

Not chargeable:

Ironing × 2

The Laundry domain must not create a combined charge for all originally requested services merely because the garments were delivered.

---

# 71. Chargeability Is Quantity-Specific

Chargeability must also be determined for the affected physical quantity.

Example:

Shirt × 3

Cleaning + Ironing fulfilled for all 3.

First Delivery:

Shirt × 2

Chargeable:

Cleaning × 2  
Ironing × 2

Remaining:

Shirt × 1

Second Delivery:

Shirt × 1

Additional chargeable quantity:

Cleaning × 1  
Ironing × 1

The Laundry domain therefore supports incremental chargeability as physical quantities are delivered.

---

# 72. Rate Snapshot

The rate used for a Laundry Charge is the Rate Snapshot captured at Collection Confirmation.

The system must not re-read the current Charge Master rate when a later Delivery becomes chargeable.

Example:

At Collection Confirmation:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10

Later Charge Master change:

Shirt Cleaning = ₹25  
Shirt Ironing = ₹12

Existing Laundry Transaction remains:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10

If the service becomes chargeable after the rate change, the original Rate Snapshot is used.

---

# 73. Laundry Charge Calculation

The operational Laundry charge calculation is based on:

Chargeable Quantity × Rate Snapshot

For each chargeable Laundry Service.

Example:

Shirt Cleaning Rate Snapshot = ₹20

Quantity delivered and fulfilled = 2

Laundry charge:

2 × ₹20 = ₹40

If Ironing Rate Snapshot = ₹10:

2 × ₹10 = ₹20

Total Laundry Charge for those services:

₹60

Laundry determines this operational chargeable amount.

Finance creates the authoritative financial Charge.

---

# 74. Laundry Charge Event

When a chargeable Laundry Service is confirmed, Laundry raises:

LaundryChargeRaised

The event communicates the operational financial fact to Finance.

The event should contain sufficient information for Finance to create the corresponding Charge without requiring Finance to reconstruct Laundry pricing rules.

Relevant information includes:

- Stay;
- Laundry Transaction;
- source Garment Line;
- Laundry Item;
- Laundry Service;
- chargeable quantity;
- Rate Snapshot;
- calculated amount;
- delivery reference;
- chargeability basis.

---

# 75. Finance Charge

Finance receives the Laundry Charge Event and creates the authoritative financial Charge.

The Finance Charge belongs to the resident's Stay.

The Finance domain remains responsible for:

- Charge identity;
- Charge status;
- financial ledger representation;
- Payment application;
- Payment Allocation;
- Adjustments;
- financial reporting.

Laundry does not maintain a parallel financial balance.

---

# 76. One Charge Event Per Chargeable Delivery

When a Delivery makes a quantity of fulfilled services chargeable, Laundry raises a corresponding LaundryChargeRaised event.

Example:

Laundry Transaction:

Shirt × 3  
Cleaning + Ironing

All services fulfilled.

Delivery #1:

Shirt × 2

Laundry raises a charge event for:

Cleaning × 2  
Ironing × 2

Later:

Delivery #2:

Shirt × 1

Laundry raises another charge event for:

Cleaning × 1  
Ironing × 1

This prevents the system from charging for undelivered quantities.

---

# 77. No Double Charging

A physical quantity must not be charged more than once for the same Laundry Service.

The system must maintain sufficient historical information to determine:

- what quantity has already become chargeable;
- which service has already been charged;
- which quantity remains chargeable.

Example:

Shirt Cleaning:

Collected = 3  
Fulfilled = 3  
Delivered = 2  
Charged = 2

The next eligible quantity is:

1 Shirt

The system must not raise another charge for the first two Shirts.

---

# 78. Partial Delivery and Charging Example

Consider:

Laundry Transaction:

Shirt × 3

Requested:

Cleaning + Ironing

Rate Snapshots:

Cleaning = ₹20  
Ironing = ₹10

All services are fulfilled.

First Delivery:

Shirt × 2

Charge raised:

Cleaning = 2 × ₹20 = ₹40  
Ironing = 2 × ₹10 = ₹20

Total first charge:

₹60

Remaining:

Shirt × 1

Second Delivery:

Shirt × 1

Additional charge:

Cleaning = 1 × ₹20 = ₹20  
Ironing = 1 × ₹10 = ₹10

Total second charge:

₹30

Total Laundry Charge:

₹90

The total equals:

3 × ₹20 + 3 × ₹10 = ₹90

---

# 79. Advance Payment

A resident may pay for Laundry before the Laundry Charge is created.

For example:

Laundry is collected.

The resident pays:

₹100

at the time of collection.

At that point, the Laundry domain has not yet established the final chargeable amount.

The payment therefore belongs to Finance and is treated as an advance or unallocated payment according to Finance's payment model.

Laundry must not create a fake Charge merely to consume the advance payment.

---

# 80. Advance Payment and Laundry Charge

Example:

Resident pays:

₹100

before Laundry delivery.

Later, actual chargeable Laundry services amount to:

₹80

Finance may allocate:

₹80

of the advance against the Laundry Charge.

Remaining unallocated amount:

₹20

The remaining ₹20 continues to be governed by Finance.

Laundry does not maintain the ₹20 balance.

---

# 81. Advance Payment Example — Full Charge

Resident pays:

₹100

Actual Laundry Charge after fulfilment and delivery:

₹100

Finance allocates:

₹100

The Laundry financial obligation is fully settled.

Laundry itself does not record the payment as settlement.

---

# 82. Advance Payment Example — Higher Final Charge

Resident pays:

₹100

Actual Laundry Charge:

₹120

Finance applies:

₹100

from the advance.

Remaining amount due:

₹20

The additional ₹20 is handled entirely by Finance.

Laundry does not collect or track the outstanding financial balance.

---

# 83. Advance Payment Example — Lower Final Charge

Resident pays:

₹100

Actual Laundry Charge:

₹80

Finance applies:

₹80

Remaining advance:

₹20

The ₹20 remains a Finance-owned unallocated amount.

The Laundry domain does not decide whether that amount is:

- refunded;
- transferred;
- applied to another financial obligation;
- retained as an account balance.

Those are Finance decisions.

---

# 84. Service Failure After Advance Payment

Consider:

Resident pays:

₹100

At collection, the Laundry Transaction contains:

Shirt × 3  
Cleaning + Ironing

The resident has paid before delivery.

Processing result:

Cleaning fulfilled  
Ironing not fulfilled

Delivery:

Shirt × 3

Only Cleaning becomes chargeable.

Suppose:

Cleaning = ₹60  
Ironing = ₹30

Actual Laundry Charge:

₹60

The resident's ₹100 advance remains a Finance-owned payment.

Finance applies:

₹60

Remaining:

₹40

Laundry does not create a ₹30 Ironing Charge because Ironing was not fulfilled.

---

# 85. Later Fulfillment of Previously Unfulfilled Service

Suppose the vendor later completes the Ironing.

The Ironing service becomes fulfilled.

The affected Shirts are then delivered.

The Ironing service becomes chargeable using the original Rate Snapshot.

Example:

Original Ironing Rate Snapshot:

₹10 per Shirt

Affected quantity:

3

Additional Laundry Charge:

3 × ₹10 = ₹30

Finance may allocate available advance payment against the resulting Charge.

---

# 86. Financial Adjustments

An operational Laundry Resolution may determine that a financial adjustment is appropriate.

Examples:

- confirmed permanent loss;
- confirmed damage;
- agreed compensation;
- service failure;
- other approved commercial resolution.

Laundry records the operational basis for the financial action.

Finance creates and owns the actual financial Adjustment.

The Laundry domain must never directly modify the financial ledger.

---

# 87. Laundry Does Not Determine Financial Liability

Laundry may determine:

Responsible Party = VENDOR

or:

Responsible Party = RPGMS

or:

Responsible Party = RESIDENT

However, this does not automatically determine a financial amount.

The operational outcome and financial consequence are separate business facts.

Example:

Responsible Party:

VENDOR

Financial outcome:

No Adjustment

This is valid.

Likewise:

Responsible Party:

VENDOR

Financial outcome:

Adjustment Required

is also valid.

---

# 88. Financial Adjustment Example

Collected:

Shirt × 1

Returned:

Shirt × 1

Condition:

Damage caused during processing

Investigation:

Responsible Party = VENDOR

Resolution:

Compensation approved

Laundry records the operational Resolution.

Finance subsequently records the appropriate financial Adjustment according to Finance rules.

The Laundry Transaction history remains unchanged.

---

# 89. Laundry and Resident Financial Balance

Laundry does not maintain:

- resident laundry balance;
- resident payment balance;
- resident outstanding balance;
- resident credit balance.

These are Finance responsibilities.

Laundry may display financial information supplied by Finance where required by the Laundry workspace.

---

# 90. Laundry and Billing Engine

The Billing Engine does not calculate Laundry-specific prices.

Laundry determines:

- Item;
- Service;
- Rate;
- Rate Snapshot;
- fulfilled quantity;
- delivered quantity;
- chargeable quantity;
- operational charge amount.

Finance creates the authoritative Charge.

The Billing Engine processes financial obligations according to the common RPGMS financial architecture.

The Billing Engine must not independently calculate:

Shirt Cleaning = ₹20

or any other Laundry-specific commercial rate.

---

# 91. Chargeable Quantity Reconciliation

For each Laundry Service, the system must be able to determine:

- Requested Quantity;
- Fulfilled Quantity;
- Delivered Quantity;
- Previously Charged Quantity;
- Remaining Chargeable Quantity.

Conceptually:

Chargeable Quantity =
minimum(Fulfilled Quantity, Delivered Quantity)
− Previously Charged Quantity

The resulting value must never be negative.

This is a service-level reconciliation and must be evaluated separately for each Laundry Service.

---

# 92. Example — Different Service Outcomes

Laundry Transaction:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled for 3  
Ironing fulfilled for 2

Return:

Shirt × 3

Delivery:

Shirt × 3

Chargeability:

Cleaning = 3  
Ironing = 2

The remaining:

Ironing = 1

is not chargeable until that service is fulfilled for the remaining Shirt and the affected Shirt has been delivered.

---

# 93. Example — Partial Delivery With Different Service Fulfillment

Laundry Transaction:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled for 3  
Ironing fulfilled for 2

Return:

Shirt × 3

First Delivery:

Shirt × 2

At this point:

Cleaning:
Fulfilled = 3
Delivered = 2
Chargeable = 2

Ironing:
Fulfilled = 2
Delivered = 2
Chargeable = 2

Therefore the first charge contains:

Cleaning × 2  
Ironing × 2

The remaining Shirt may later be delivered.

When it is delivered:

Cleaning × 1 becomes chargeable.

Ironing does not become chargeable for that Shirt unless Ironing is first fulfilled.

---

# 94. Chargeability and Exceptions

An Exception does not automatically cancel chargeability.

Chargeability depends on the actual service outcome and physical delivery.

Example:

Cleaning fulfilled.

Shirt returned.

Shirt delivered.

A quality Exception is subsequently raised.

Cleaning remains operationally chargeable unless the Exception Resolution results in an approved financial adjustment.

The Laundry Charge is not silently deleted.

Any financial consequence is handled through Finance.

---

# 95. Chargeability and Service Rework

If a service is reworked because the original service was inadequate, the system must not automatically create a second resident charge for the same service and quantity.

Example:

Cleaning was performed but was unacceptable.

The vendor re-cleans the Shirt.

The second Cleaning operation is corrective rework.

The resident is not charged twice for the same requested Cleaning service.

The original Rate Snapshot remains associated with the original requested service.

Any vendor-side commercial consequence is an operational matter and does not automatically change the resident's Laundry Charge.

---

# 96. Chargeability and Replacement Items

If a missing or damaged Laundry Item is replaced as part of Exception Resolution, the replacement does not automatically create a new Laundry Service charge.

The original Laundry Transaction remains the commercial context.

Any financial compensation or adjustment is handled through Finance.

---

# 97. Financial Event Boundary

Laundry-owned events may communicate operational financial facts.

Finance-owned events communicate financial facts.

Laundry may publish:

LaundryChargeRaised

Finance may subsequently publish the appropriate financial event representing:

- Charge Created;
- Payment Allocated;
- Adjustment Posted;
- other Finance-owned facts.

Laundry must not publish events that claim ownership of Finance ledger state.

---

# 98. Commercial Integrity Principles

The following principles apply:

1. A Requested Service is not automatically a Charge.
2. A service must be fulfilled before it becomes chargeable.
3. The affected physical quantity must be delivered before that quantity becomes chargeable.
4. Chargeability is evaluated separately for each Laundry Service.
5. Chargeability is evaluated separately for physical quantity.
6. Rate Snapshots are captured at Collection Confirmation.
7. Historical Laundry Transactions never reprice because the Charge Master changes.
8. Partial Delivery may create partial charges.
9. A physical quantity must never be charged twice for the same service.
10. Corrective rework does not automatically create an additional resident charge.
11. Advance Payments are owned by Finance.
12. Laundry does not create fake Charges to consume advance payments.
13. Finance owns the authoritative Charge.
14. Finance owns Payments and Payment Allocations.
15. Finance owns financial Adjustments.
16. Laundry determines operational chargeability but does not own the financial ledger.
17. Operational responsibility does not automatically determine financial liability.
18. Financial consequences arising from Laundry Exceptions are handled through Finance.
19. Current Charge Master rates never replace historical Rate Snapshots.
20. The financial outcome must remain reconstructable from Laundry operational facts and Finance financial facts.

# 99. Laundry Transaction Lifecycle

## 99.1 Lifecycle Overview

A Laundry Transaction progresses through a controlled operational lifecycle.

The conceptual lifecycle is:

DRAFT → COLLECTED → PROCESSING → AWAITING_HANDOVER → PARTIALLY_DELIVERED → COMPLETED

The lifecycle may also enter:

CANCELLED

before Processing Release, subject to the cancellation rules defined in this specification.

Exceptions operate alongside the primary Laundry Transaction lifecycle and do not constitute an alternative transaction lifecycle.

---

# 100. Laundry Transaction States

## 100.1 DRAFT

`DRAFT` means the Laundry Transaction is being prepared and has not yet reached Collection Confirmation.

A Draft may contain:

- resident/Stay reference;
- preliminary Laundry Items;
- preliminary quantities;
- requested Services;
- collection information;
- photographs;
- preliminary observations.

Draft information may be corrected as part of normal data entry.

No historical collection fact is established until Collection Confirmation.

---

## 100.2 COLLECTED

`COLLECTED` means:

- physical laundry has been received;
- collection has been confirmed;
- Garment Lines have been established;
- requested Services have been recorded;
- Rate Snapshots have been captured;
- collection evidence has been preserved.

The Laundry Transaction is now an established operational transaction.

---

## 100.3 PROCESSING

`PROCESSING` means the Laundry has been released for processing.

The Processing Route has been established.

For External Vendor Processing, the operational display may use:

`WITH_VENDOR`

For In-House Processing, the operational display may use:

`IN_HOUSE_PROCESSING`

Both represent the common lifecycle stage:

`PROCESSING`

---

## 100.4 AWAITING_HANDOVER

`AWAITING_HANDOVER` means processed Laundry has been returned and verified by RPGMS staff and is available for resident Delivery.

The Laundry has returned to RPGMS custody.

It has not necessarily yet been delivered to the resident.

---

## 100.5 PARTIALLY_DELIVERED

`PARTIALLY_DELIVERED` means that some, but not all, of the collected physical quantity has been physically delivered or otherwise conclusively accounted for.

Example:

Collected = 5
Resolved = 0
Delivered = 3

Outstanding = 2

The Laundry Transaction remains physically incomplete.

The state may also occur where part of the collected quantity has been Delivered and another part has been Resolved.

The authoritative physical completion calculation remains:

Collected − Delivered − Resolved

---

## 100.6 COMPLETED

`COMPLETED` means the **physical Laundry relationship** has been fully accounted for.

The completion condition is:

Collected − Delivered − Resolved = 0

Therefore, all collected physical quantity has either:

- been physically delivered; or
- been conclusively resolved through the Exception process.

`COMPLETED` is a **physical lifecycle state only**.

It does not mean that:

- every requested Service has been fulfilled;
- every Exception has been resolved;
- every operationally chargeable Service has been financially posted;
- every financial obligation has been settled.

Service Fulfillment, chargeability, Exception Resolution, and financial settlement remain independently governed business facts.

An open Exception does not prevent physical completion when the affected physical quantity has otherwise been conclusively accounted for.

---

## 100.7 CANCELLED

`CANCELLED` means the Laundry Transaction was cancelled before Processing Release and the collected Laundry was returned to the resident.

A cancelled transaction remains in the historical record.

It is not treated as a completed Laundry Transaction.

---

# 101. State Transition Rules

## 101.1 Draft to Collected

Transition:

`DRAFT → COLLECTED`

occurs when Collection Confirmation is completed.

Required conditions include:

- collection information is complete;
- physical quantities are confirmed;
- requested Services are confirmed;
- applicable Rate Snapshots are established;
- required collection evidence is recorded;
- required verification information is recorded.

---

## 101.2 Collected to Processing

Transition:

`COLLECTED → PROCESSING`

occurs when Processing Release is confirmed.

Required conditions include:

- Collection Confirmation has occurred;
- required inspection has been completed;
- Processing Route has been selected;
- external vendor has been selected when the route is `EXTERNAL_VENDOR`;
- the Laundry is physically released for processing.

---

## 101.3 Processing to Awaiting Handover

Transition:

`PROCESSING → AWAITING_HANDOVER`

occurs when processed Laundry has been physically returned to RPGMS and the Return has been verified.

A partial Return may result in the Laundry Transaction remaining operationally in a processing/return state while outstanding quantities remain unresolved.

The exact displayed status may depend on the implementation of the workspace projection.

---

## 101.4 Awaiting Handover to Partially Delivered

Transition:

`AWAITING_HANDOVER → PARTIALLY_DELIVERED`

occurs when a Delivery is confirmed but the Laundry Transaction still has outstanding physical quantity.

---

## 101.5 Awaiting Handover to Completed

Transition:

`AWAITING_HANDOVER → COMPLETED`

occurs when a Delivery or Resolution causes:

Collected − Delivered − Resolved = 0

---

## 101.6 Partially Delivered to Completed

Transition:

`PARTIALLY_DELIVERED → COMPLETED`

occurs when subsequent Delivery and/or Resolution causes:

Collected − Delivered − Resolved = 0

---

## 101.7 Collected to Cancelled

Transition:

`COLLECTED → CANCELLED`

is permitted only before Processing Release.

The collected Laundry must physically be returned to the resident.

Cancellation of a Laundry Transaction does not automatically cancel, refund, reverse, or otherwise modify any Payment already recorded by Finance.

If a Payment was received before cancellation, any resulting financial action is determined and recorded by Finance.

Laundry records the operational cancellation and the physical return of the collected Laundry.

---

# 102. State Is a Projection

Laundry Transaction State is a current operational projection.

The authoritative historical record is composed of:

- Laundry business events;
- confirmed collections;
- returns;
- deliveries;
- exceptions;
- resolutions;
- other immutable business facts.

The current state must remain derivable from the underlying business history.

The state must not be treated as the sole source of truth.

---

# 103. Exception Lifecycle

Exceptions have an independent lifecycle:

`OPEN → UNDER_INVESTIGATION → RESOLVED`

An Exception may remain open while the Laundry Transaction progresses through:

- Return;
- Delivery;
- Completion.

An open Exception does not automatically prevent Laundry Transaction completion.

The exception lifecycle is therefore independent of the primary Laundry Transaction lifecycle.

---

# 104. Business Event Principles

Laundry Business Events represent significant business facts.

Events are historical facts and must not be treated as mutable status values.

An event should be raised when a meaningful business transition or business fact occurs.

The Laundry domain owns its Laundry events.

Finance owns Finance events.

---

# 105. Core Laundry Business Events

The core Laundry event vocabulary is:

- `LaundryTransactionCreated`
- `LaundryCollectionConfirmed`
- `LaundryConditionObserved`
- `LaundryProcessingReleased`
- `LaundryReturned`
- `LaundryDelivered`
- `LaundryExceptionRaised`
- `LaundryExceptionResolved`
- `LaundryChargeRaised`
- `LaundryTransactionCompleted`
- `LaundryTransactionCancelled`

The final event vocabulary must be reconciled with the project's central Business Events specification before implementation.

---

# 106. LaundryTransactionCreated

`LaundryTransactionCreated` records that a new Laundry Transaction has been created.

It establishes the existence of the transaction.

It does not mean that physical laundry has already been collected.

---

# 107. LaundryCollectionConfirmed

`LaundryCollectionConfirmed` records that the physical collection has been confirmed.

The event establishes the historical collection baseline.

It is the pricing snapshot boundary for the Laundry Transaction.

---

# 108. LaundryConditionObserved

`LaundryConditionObserved` records a relevant physical condition observed during Laundry inspection.

The event may identify:

- Laundry Item;
- affected quantity;
- condition;
- observation time;
- operator/staff;
- supporting evidence.

The event does not change the original collected quantity.

---

# 109. LaundryProcessingReleased

`LaundryProcessingReleased` records that Laundry has been released for processing.

The event identifies the Processing Route.

For example:

Processing Route = `EXTERNAL_VENDOR`

or:

Processing Route = `IN_HOUSE`

For External Vendor Processing, the selected vendor is included as part of the event context.

---

# 110. LaundryReturned

`LaundryReturned` records that Laundry has physically returned to RPGMS custody after processing.

The event represents the actual quantity received and verified by RPGMS staff.

It must not assume that the original Collection quantity was fully returned.

---

# 111. LaundryDelivered

`LaundryDelivered` records that Laundry has physically been handed over.

The event identifies:

- Laundry Transaction;
- Delivery;
- affected Garment Lines;
- delivered quantities;
- Handover Method;
- staff member;
- delivery timestamp.

Resident Verification is represented as additional delivery information and is not implied by the event itself.

---

# 112. LaundryExceptionRaised

`LaundryExceptionRaised` records that an operational Laundry problem has been identified.

The event identifies the relevant Exception and affected quantity where applicable.

Examples include:

- missing item;
- damage;
- wrong item;
- identity dispute;
- service failure;
- quality issue.

---

# 113. LaundryExceptionResolved

`LaundryExceptionResolved` records that an Exception investigation has reached a business Resolution.

The event does not itself create a financial Adjustment.

Where a financial consequence is required, Finance handles the financial transaction separately.

---

# 114. LaundryChargeRaised

`LaundryChargeRaised` records that a fulfilled Laundry Service and affected delivered quantity have become operationally chargeable.

The event communicates the chargeable business fact to Finance.

It must use the Rate Snapshot associated with the Laundry Transaction.

The event must not require Finance to re-read the current Laundry Charge Master.

---

## 114.1 Laundry Charge Event Idempotency

`LaundryChargeRaised` must represent a uniquely identifiable chargeable business fact.

The event must contain sufficient identity information to allow Finance to recognize duplicate delivery or processing of the same charge event.

For the same:

- Laundry Transaction;
- Garment Line or applicable Service quantity;
- Laundry Service;
- chargeable quantity;

the Laundry domain must not raise multiple authoritative charge events for the same chargeable quantity.

Finance must also be able to process the event idempotently so that retrying the same event does not create duplicate financial Charges.

Event delivery failure or retry must therefore never result in double charging.

---

# 115. LaundryTransactionCompleted

`LaundryTransactionCompleted` records that the Laundry Transaction has reached physical completion.

The completion condition is:

Collected − Delivered − Resolved = 0

The event does not mean that all financial obligations have necessarily been settled.

Financial settlement remains a Finance responsibility.

---

# 116. LaundryTransactionCancelled

`LaundryTransactionCancelled` records the cancellation of a Laundry Transaction before Processing Release.

The event should identify:

- Laundry Transaction;
- cancellation reason;
- staff/operator;
- timestamp;
- confirmation that the physical Laundry was returned to the resident.

---

# 117. Event Ordering

The normal event sequence is:

`LaundryTransactionCreated`

followed by:

`LaundryCollectionConfirmed`

followed, where applicable, by:

`LaundryConditionObserved`

followed by:

`LaundryProcessingReleased`

followed by:

`LaundryReturned`

followed by one or more:

`LaundryDelivered`

and/or:

`LaundryExceptionRaised`

and:

`LaundryExceptionResolved`

with:

`LaundryChargeRaised`

occurring when individual services and quantities become chargeable.

Finally:

`LaundryTransactionCompleted`

is raised when the physical completion condition is satisfied.

The event sequence is not required to be a single straight line because Exceptions and partial Returns/Deliveries may occur in parallel with the main operational flow.

---

# 118. Business Invariants

The following invariants are fundamental to the Laundry domain.

## 118.1 Physical Quantity Invariant

A physical Laundry Item is counted once regardless of the number of Services applied.

---

## 118.2 Collection Invariant

The original confirmed Collection quantity must remain historically traceable.

---

## 118.3 Service Invariant

Requested Services are recorded independently of physical quantity.

Multiple Services may apply to the same physical quantity.

---

## 118.4 Rate Invariant

Historical Rate Snapshots do not change when the Charge Master changes.

---

## 118.5 Processing Route Invariant

Processing Route is an operational choice and does not determine resident pricing.

---

## 118.6 Return Invariant

Returned quantity is based on the physical quantity actually received and verified by RPGMS staff.

---

## 118.7 Delivery Invariant

Delivery quantity must not exceed physically returned and available quantity.

---

## 118.8 Delivery History Invariant

Confirmed Deliveries are historical facts and must not be silently overwritten.

---

## 118.9 Resident Verification Invariant

Physical Delivery and Resident Verification are separate facts.

---

## 118.10 Exception Invariant

Exceptions do not rewrite the original Laundry facts.

---

## 118.11 Identity Invariant

A quantity involved in an unresolved identity dispute must not be treated as successfully delivered.

---

## 118.12 Completion Invariant

Physical completion occurs only when:

Collected − Delivered − Resolved = 0

---

## 118.13 Chargeability Invariant

A Laundry Service becomes chargeable only when:

Service Fulfilled + Affected Quantity Delivered

---

## 118.14 No Double Charging Invariant

The same physical quantity must not be charged more than once for the same Laundry Service.

---

## 118.15 Rate Preservation Invariant

A charge raised for an existing Laundry Transaction must use the Rate Snapshot from that transaction, not the current Charge Master rate.

---

## 118.16 Finance Ownership Invariant

Laundry may determine operational chargeability but does not own the authoritative financial Charge.

---

## 118.17 Payment Ownership Invariant

Laundry does not own Payments, Payment Allocations, or financial balances.

---

## 118.18 Adjustment Ownership Invariant

Laundry may establish the operational basis for a financial adjustment, but Finance owns the resulting financial Adjustment.

---

## 118.19 Historical Integrity Invariant

Confirmed Laundry business facts must remain reconstructable from the historical record.

---

# 119. Complete Lifecycle Example

Consider the following Laundry Transaction.

Resident provides:

Shirt × 3

Requested Services:

- 2 Shirts: Cleaning + Ironing
- 1 Shirt: Cleaning

The system creates:

Garment Line 1:
Shirt × 2
Cleaning + Ironing

Garment Line 2:
Shirt × 1
Cleaning

Collection is confirmed.

Rate Snapshots:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10

The operator records:

Processing Route = `EXTERNAL_VENDOR`

Processing Release occurs.

The Laundry is with the vendor.

The vendor returns:

Shirt × 3

RPGMS verifies the physical return.

Processing outcome:

Cleaning fulfilled for 3  
Ironing fulfilled for 2

Delivery #1:

Shirt × 2

Chargeability after Delivery #1:

Cleaning × 2  
Ironing × 2

Charge:

Cleaning = ₹40  
Ironing = ₹20

Total:

₹60

The remaining Shirt is delivered later.

Delivery #2:

Shirt × 1

Chargeability:

Cleaning × 1

Additional Charge:

₹20

Ironing remains non-chargeable for the remaining Shirt because Ironing was not fulfilled.

If the remaining Shirt is subsequently ironed, the Ironing Service becomes chargeable using the original ₹10 Rate Snapshot, because the Shirt was already physically delivered.

The final physical reconciliation is:

Collected = 3  
Delivered = 3  
Resolved = 0

Therefore:

Outstanding = 3 − 3 − 0 = 0

The Laundry Transaction becomes:

`COMPLETED`

The financial Charges remain owned by Finance.

---

# 120. Lifecycle Summary

The complete Laundry lifecycle can be summarized as:

1. Create Laundry Transaction.
2. Record physical Collection.
3. Record requested Services.
4. Capture Collection Photographs.
5. Staff verifies collection.
6. Resident verifies collection where applicable.
7. Inspect Laundry.
8. Record Condition Observations.
9. Confirm Collection.
10. Capture Rate Snapshots.
11. Select Processing Route.
12. Release Laundry for processing.
13. Process internally or through External Vendor.
14. Receive and verify returned Laundry.
15. Reconcile returned quantities.
16. Raise Exceptions where required.
17. Deliver returned Laundry.
18. Record Resident Verification where applicable.
19. Determine service fulfillment.
20. Determine chargeable quantities.
21. Raise Laundry Charge Events.
22. Resolve Exceptions where required.
23. Repeat Return/Delivery cycles where necessary.
24. Complete the Laundry Transaction when physical reconciliation reaches zero.
25. Finance independently manages resulting Charges, Payments, Allocations, Adjustments, and settlement.

---

# 121. Lifecycle Design Principle

The Laundry domain deliberately separates four concepts that must never be collapsed into one status:

1. Physical possession;
2. Service fulfillment;
3. Physical delivery;
4. Financial chargeability.

A Laundry Item may therefore be:

- returned but not delivered;
- delivered but associated with an open Exception;
- delivered while one requested Service remains unfulfilled;
- physically resolved without being returned;
- delivered and fully chargeable;
- delivered but only partially chargeable.

This separation is fundamental to the correctness of the Laundry domain.

# 122. Laundry Workspace

## 122.1 Purpose

The Laundry Workspace is the primary operational workspace for managing Laundry Transactions.

It provides staff with the information and actions required to:

- collect laundry;
- confirm collections;
- inspect laundry;
- select Processing Routes;
- manage processing;
- record Returns;
- reconcile quantities;
- manage Deliveries;
- manage Exceptions;
- determine chargeability;
- review Laundry history.

The Laundry Workspace is an operational workspace.

It does not replace the Finance workspace or financial ledger.

---

# 123. Workspace Design Principles

The Laundry Workspace must be designed around the operational lifecycle rather than around database entities.

The primary user question should always be:

> What needs to happen to this Laundry Transaction next?

The workspace should therefore make the current operational state, outstanding quantities, pending actions, Exceptions, and chargeability clearly visible.

The workspace should not require staff to navigate through unrelated screens to understand the current Laundry situation.

---

# 124. Laundry Dashboard

The Laundry Workspace should provide a dashboard or summary area showing the current operational workload.

At minimum, the dashboard should be capable of surfacing:

- Laundry Transactions requiring collection confirmation;
- Laundry Transactions awaiting inspection;
- Laundry Transactions awaiting Processing Route;
- Laundry currently with External Vendors;
- Laundry undergoing In-House Processing;
- Laundry awaiting handover;
- Partially delivered Laundry;
- Laundry with outstanding physical quantities;
- Open Laundry Exceptions;
- Laundry requiring investigation;
- Laundry requiring resolution;
- chargeable Laundry awaiting financial posting where applicable.

The dashboard is an operational summary.

It must not be treated as the authoritative source of Laundry facts.

---

# 125. Laundry Transaction List

The Laundry Workspace should provide a searchable and filterable list of Laundry Transactions.

The list should allow staff to identify transactions using relevant operational information such as:

- resident;
- Stay;
- Laundry Transaction identifier;
- current status;
- Processing Route;
- external vendor;
- collection date;
- delivery status;
- Exception status;
- chargeability status.

The exact search and filter controls are implementation decisions, but the workspace must support efficient operational retrieval.

---

# 126. Laundry Transaction Detail

Selecting a Laundry Transaction should provide a complete operational view.

The detail view should make the following information available:

## Collection

- resident;
- Stay;
- collection date/time;
- staff member;
- Garment Lines;
- physical quantities;
- requested Services;
- Collection Photographs;
- resident verification;
- staff verification.

## Inspection

- Condition Observations;
- affected quantities;
- supporting evidence.

## Pricing

- Rate Snapshots;
- requested Services;
- current chargeability;
- chargeable quantities;
- Laundry Charges raised;
- Finance references where available.

## Processing

- Processing Route;
- External Vendor where applicable;
- Processing Release;
- processing status.

## Return

- Return records;
- returned quantities;
- outstanding quantities;
- discrepancies.

## Delivery

- Delivery records;
- delivered quantities;
- Handover Methods;
- resident verification;
- room placement information.

## Exceptions

- open Exceptions;
- investigation history;
- responsibility;
- Resolution;
- financial consequence status where applicable.

## History

- chronological Laundry business events;
- corrections;
- amendments;
- operational actions.

---

# 127. Collection Workspace

The Collection workflow should allow staff to create and complete a Laundry Transaction efficiently at the point where physical laundry is received.

The workflow should support:

1. selecting the resident/Stay;
2. creating the Laundry Transaction;
3. adding Laundry Items;
4. entering physical quantities;
5. selecting Services;
6. grouping identical Item + Service combinations into Garment Lines;
7. capturing Collection Photographs;
8. recording Condition Observations where identified;
9. recording staff verification;
10. recording resident verification;
11. reviewing the complete collection;
12. confirming the Collection.

---

# 128. Collection Entry

The collection interface must make physical counting unambiguous.

The operator must be able to enter:

- Laundry Item;
- physical quantity;
- one or more Services.

Example:

Shirt × 2  
Cleaning + Ironing

and:

Shirt × 1  
Cleaning

must remain distinguishable as separate Garment Lines.

The interface must not represent Cleaning and Ironing as separate physical quantities.

---

# 129. Collection Review

Before Collection Confirmation, the operator should be able to review a summary such as:

Resident: [Resident]

Laundry Items:

Shirt — 3 pieces  
Trouser — 2 pieces

Service Selection:

Shirt — 2 pieces — Cleaning + Ironing  
Shirt — 1 piece — Cleaning  
Trouser — 2 pieces — Cleaning

The system should make the relationship between physical quantity and requested Services visually clear.

---

# 130. Collection Confirmation

Collection Confirmation should be an explicit operator action.

The system should clearly communicate that Confirmation establishes the historical collection baseline.

After confirmation:

- collected quantities become historical facts;
- requested Services become historically recorded;
- Rate Snapshots are established;
- Collection evidence is preserved.

The user should not be able to casually edit these facts after confirmation.

---

# 131. Inspection Workspace

The Inspection workflow should allow the operator to review collected Laundry before Processing Release.

The workspace should provide access to:

- Collection Photographs;
- Garment Lines;
- physical quantities;
- existing Condition Observations;
- ability to add new Condition Observations.

The operator should be able to identify the affected quantity where a condition applies only to part of a Garment Line.

Example:

Shirt × 3

Condition:

Existing tear

Affected Quantity:

1

---

# 132. Processing Route Selection

The Processing workspace must require the operator to select the Processing Route before Processing Release.

Available MVP choices:

- `IN_HOUSE`
- `EXTERNAL_VENDOR`

If `EXTERNAL_VENDOR` is selected, the operator must select the applicable vendor.

If `IN_HOUSE` is selected, no vendor selection is required.

The workspace should make clear that Processing Route is an operational decision and does not change the resident's Laundry pricing.

---

# 133. Processing Workspace — External Vendor

For External Vendor Processing, the workspace should show:

- Laundry Transaction;
- resident;
- Garment Lines;
- collected quantities;
- requested Services;
- Rate Snapshots;
- Collection Photographs;
- Condition Observations;
- selected vendor;
- Processing Release;
- current vendor-processing status;
- expected/actual Return information;
- outstanding quantities;
- Exceptions.

The MVP does not require electronic vendor-side workflow.

The workspace should support the actual operating model in which RPGMS staff physically hands the Laundry to the vendor.

---

# 134. Processing Workspace — In-House

For In-House Processing, the workspace should provide a simplified operational workflow.

At MVP level, the operator needs to be able to:

- identify the Laundry Transaction;
- see the collected Laundry;
- see requested Services;
- mark internal processing as underway;
- record completion of internal processing;
- move the Laundry into the Return workflow.

The MVP should not expose machine-level or production-management concepts.

---

# 135. Return Workspace

The Return workflow should be optimized for physical verification.

When Laundry is received back, staff should be able to:

1. select the Laundry Transaction;
2. review original Garment Lines;
3. count returned physical items;
4. record actual returned quantities;
5. identify missing quantities;
6. identify wrong or disputed items;
7. identify damage;
8. identify service failures;
9. record relevant Exceptions;
10. confirm the Return.

The workspace must not default the Return quantity to the original Collection quantity without explicit verification.

---

# 136. Return Reconciliation View

The workspace should provide a clear reconciliation between:

- Collected;
- Returned;
- Previously Returned;
- Delivered;
- Previously Delivered;
- Resolved;
- Outstanding.

For example:

Collected: 5  
Returned: 4  
Delivered: 3  
Resolved: 0  
Outstanding: 2

The workspace should make clear that:

Returned quantity and Delivered quantity are different operational facts.

---

# 137. Delivery Workspace

The Delivery workflow should allow staff to select available returned Laundry and record a physical handover.

The workspace should show:

- Laundry Transaction;
- available deliverable quantities;
- previous Deliveries;
- outstanding quantities;
- relevant Exceptions;
- requested Services;
- service fulfillment status.

The operator then records the Delivery.

---

# 138. Partial Delivery

The Delivery workspace must support partial Delivery.

Example:

Available:

Shirt × 3

Staff may deliver:

Shirt × 2

The system records:

Delivered = 2

Remaining:

Shirt × 1

The remaining quantity remains available for a subsequent Delivery.

---

# 139. Handover Method

The Delivery workflow must require a Handover Method.

MVP options:

- `DIRECT_HANDOVER`
- `ROOM_PLACEMENT`

For `DIRECT_HANDOVER`, the system should allow Resident Verification to be recorded.

For `ROOM_PLACEMENT`, the system records the resident's prior instruction and the staff member who performed the placement.

---

# 140. Room Placement Workflow

When the resident has instructed staff to place completed Laundry in the room while the resident is away, the operator may use:

`ROOM_PLACEMENT`

The workflow should capture:

- resident instruction;
- staff member;
- placement date/time;
- accommodation context;
- delivered quantities.

Resident presence is not required.

Resident Verification may therefore remain:

`NOT_VERIFIED`

The Delivery is still valid because physical placement has occurred.

---

# 141. Delivery Verification

The Delivery workflow should distinguish:

- physical Delivery;
- resident presence;
- resident Verification.

For example:

Delivered = Yes  
Resident Present = No  
Resident Verified = No

is a valid outcome for Room Placement.

---

# 142. Exception Workspace

The Laundry Workspace should provide a dedicated mechanism for raising and managing Exceptions.

The operator should be able to:

- create an Exception;
- select Exception Type;
- identify affected Laundry Item;
- identify affected quantity;
- identify affected Service where applicable;
- add notes;
- attach or reference supporting evidence;
- assign or record investigation responsibility;
- update investigation status;
- record Resolution.

---

# 143. Exception Investigation Workspace

The investigation view should present the evidence required to determine what happened.

Where relevant, it should provide access to:

- Collection information;
- Collection Photographs;
- Condition Observations;
- Return information;
- Delivery information;
- resident statements;
- vendor information;
- previous Exception activity.

The operator should not need to reconstruct the Laundry history manually from unrelated screens.

---

# 144. Exception Resolution Workspace

The Resolution workflow should allow the operator to record:

- outcome;
- affected quantity;
- Responsible Party;
- Resolution notes;
- whether further physical action is required;
- whether a financial consequence should be considered.

If a financial consequence is indicated, the system should hand the matter to Finance rather than creating the financial Adjustment directly within Laundry.

---

# 145. Chargeability View

The Laundry Workspace should make operational chargeability visible.

For each relevant Garment Line / Service combination, the operator should be able to determine:

- Requested Quantity;
- Fulfilled Quantity;
- Delivered Quantity;
- Previously Charged Quantity;
- Remaining Chargeable Quantity;
- Rate Snapshot;
- Chargeable Amount;
- whether a Laundry Charge has been raised.

The workspace should make it obvious why a service is or is not currently chargeable.

---

# 146. Chargeability Example in Workspace

For:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled = 3  
Ironing fulfilled = 2

Delivery:

Delivered = 2

The workspace should show approximately:

| Service | Requested | Fulfilled | Delivered | Chargeable |
|---|---:|---:|---:|---:|
| Cleaning | 3 | 3 | 2 | 2 |
| Ironing | 3 | 2 | 2 | 2 |

The remaining Shirt has:

Cleaning = potentially chargeable when delivered  
Ironing = not chargeable until fulfilled

The exact visual representation is an implementation decision, but the underlying information must be available.

---

# 147. Finance Visibility

Laundry may display relevant Finance information where useful to the operator.

Examples:

- Laundry Charge raised;
- Finance Charge reference;
- amount;
- financial status;
- advance payment available;
- adjustment status.

However, financial actions must be performed through Finance-owned workflows.

The Laundry Workspace must not provide controls that directly edit Finance ledger information.

---

# 148. Advance Payment Visibility

Where a resident has paid an advance before the Laundry Charge exists, the Laundry Workspace may display a Finance-provided indication such as:

Advance Payment Available

The exact financial amount and allocation status are authoritative in Finance.

Laundry must not allocate, refund, or otherwise modify the advance.

---

# 149. Transaction Timeline

The Laundry Transaction Detail view should provide a chronological operational timeline.

The timeline should include significant events such as:

- Transaction Created;
- Collection Confirmed;
- Condition Observed;
- Processing Released;
- Laundry Returned;
- Laundry Delivered;
- Exception Raised;
- Exception Resolved;
- Laundry Charge Raised;
- Transaction Completed;
- Transaction Cancelled.

The timeline is a read-oriented projection of historical Laundry events.

---

# 150. Staff Actions

The workspace should clearly identify the staff member responsible for significant operational actions.

Examples:

- collection confirmation;
- inspection;
- Processing Release;
- Return verification;
- Delivery;
- Room Placement;
- Exception creation;
- Exception Resolution.

Staff attribution provides operational accountability.

---

# 151. Role and Permission Principles

Laundry actions must follow the RPGMS role and permission architecture.

At minimum, the system should distinguish between:

- viewing Laundry information;
- creating Draft Transactions;
- confirming Collections;
- recording Condition Observations;
- selecting Processing Routes;
- releasing Laundry for Processing;
- recording Returns;
- recording Deliveries;
- raising Exceptions;
- resolving Exceptions;
- viewing chargeability;
- initiating financial follow-up.

Exact role mappings are an implementation/governance decision and should align with the project's central authorization model.

---

# 152. Operational Search

The Laundry Workspace should support rapid retrieval of a Laundry Transaction.

Search should be possible using appropriate identifiers such as:

- resident;
- Stay;
- Laundry Transaction;
- vendor;
- processing status;
- collection date;
- delivery status;
- Exception status.

The final search field set may evolve based on operational usage.

---

# 153. Operational Filters

The workspace should support filtering by meaningful operational states, including:

- Draft;
- Collected;
- Processing;
- With Vendor;
- In-House Processing;
- Awaiting Handover;
- Partially Delivered;
- Completed;
- Cancelled.

Exception-related filters should also be available where operationally useful.

---

# 154. Outstanding Work

The Laundry Workspace should prioritize work requiring staff attention.

Examples include:

- collections awaiting confirmation;
- inspections awaiting completion;
- Processing Route not selected;
- Laundry awaiting Return;
- partial Returns;
- outstanding physical quantities;
- Laundry awaiting Delivery;
- open Exceptions;
- unresolved identity disputes;
- services fulfilled but awaiting delivery;
- chargeable quantities awaiting charge creation.

The dashboard should therefore function as a work-oriented operational surface rather than merely as a reporting page.

---

# 155. Resident-Facing Information

The Laundry domain may expose appropriate Laundry information to the resident where RPGMS later provides a resident-facing workspace.

Resident-facing information may include:

- Laundry collected;
- requested Services;
- collection quantities;
- current processing status;
- returned quantities;
- delivered quantities;
- Exceptions relevant to the resident;
- applicable Laundry Charges;
- payment status supplied by Finance.

Resident-facing views must not expose internal operational information that is inappropriate for residents, such as:

- internal staff notes;
- internal investigation commentary;
- confidential vendor discussions;
- internal responsibility deliberations.

The exact resident-facing scope is outside the MVP implementation unless separately approved.

---

# 156. Vendor Information

Vendor-related information is operational information owned by Laundry.

The Laundry Workspace may display:

- selected vendor;
- Processing Release;
- vendor processing status;
- Return information;
- vendor-related Exceptions;
- investigation information.

Vendor information must not be treated as a substitute for RPGMS physical verification.

---

# 157. Operational Evidence

The Laundry Workspace should provide contextual access to relevant evidence.

Evidence may include:

- Collection Photographs;
- Condition Observations;
- Return observations;
- Delivery information;
- Exception evidence.

Evidence should remain associated with the business fact for which it was captured.

---

# 158. Workspace Dashboard Principle

The Laundry Workspace should follow the RPGMS Workspace Dashboard Principle.

The dashboard should provide:

- current state;
- operational workload;
- exceptions;
- outstanding quantities;
- next actions;
- key metrics.

The dashboard should not become a second source of business truth.

All displayed information must ultimately derive from authoritative Laundry domain facts and, where applicable, Finance facts.

---

# 159. UI and Domain Separation

The Laundry specification defines operational behaviour and required user capabilities.

It does not prescribe:

- React component structure;
- Material UI component selection;
- CSS;
- exact screen dimensions;
- frontend state-management implementation;
- database table layout.

Those decisions belong to implementation architecture and UI specifications.

The implementation must, however, preserve all business rules and invariants defined in this specification.

---

# 160. Workspace Completion Principle

A Laundry workspace action should always produce a clear operational outcome.

Examples:

Collection Confirmation:

> The collection is now historically confirmed.

Processing Release:

> The Laundry has entered its selected Processing Route.

Return Confirmation:

> The physically returned quantity has been verified.

Delivery Confirmation:

> The selected quantity has been physically handed over.

Exception Resolution:

> The operational issue has reached an established business outcome.

Chargeability:

> The fulfilled and delivered quantity is now eligible for financial charging.

This principle should guide the eventual implementation of the Laundry workspace.

# 161. Reporting, Audit and Historical Integrity

## 161.1 Purpose

The Laundry domain must provide sufficient operational history to understand what happened to every Laundry Transaction from Collection through final physical resolution.

Reporting and audit capabilities must be based on authoritative Laundry facts and must not introduce independent business truth.

---

# 162. Laundry Operational Reporting

The Laundry domain should support reporting on the operational lifecycle.

Relevant reporting dimensions include:

- Laundry Transactions;
- collection quantities;
- Laundry Items;
- requested Services;
- Processing Routes;
- External Vendors;
- In-House Processing;
- Returns;
- Deliveries;
- outstanding quantities;
- Exceptions;
- Exception resolutions;
- chargeable quantities;
- Laundry Charges.

The exact report catalogue may evolve as operational requirements become clearer.

---

# 163. Laundry Transaction Report

A Laundry Transaction report should be able to provide, at minimum:

- Laundry Transaction;
- resident;
- Stay;
- collection date;
- collected quantity;
- Processing Route;
- vendor where applicable;
- returned quantity;
- delivered quantity;
- resolved quantity;
- outstanding quantity;
- current status;
- Exception status;
- chargeability status.

The report should allow staff to identify transactions requiring attention.

---

# 164. Laundry Item Report

The system should be capable of reporting Laundry quantities by Laundry Item.

Examples:

- Shirts collected;
- Trousers collected;
- Jeans collected;
- Blankets collected.

Where useful, reporting may distinguish:

- collected;
- returned;
- delivered;
- resolved;
- outstanding.

---

# 165. Service Report

Laundry Services should be reportable independently from physical Laundry Items.

Examples:

- Cleaning;
- Ironing;
- Dry Cleaning.

The system should be able to determine:

- requested quantity;
- fulfilled quantity;
- delivered quantity;
- chargeable quantity;
- charged amount.

This distinction is important because a single physical garment may receive multiple Services.

---

# 166. Processing Route Report

The system should be capable of reporting Laundry activity by Processing Route.

Examples:

`IN_HOUSE`

`EXTERNAL_VENDOR`

This may support operational analysis such as:

- quantity processed in-house;
- quantity processed externally;
- current Laundry with vendors;
- outstanding vendor returns;
- internal processing workload.

The report must not imply that Processing Route determines resident pricing.

---

# 167. Vendor Report

For External Vendor Processing, reporting may include:

- vendor;
- Laundry Transactions sent;
- collected quantities;
- returned quantities;
- outstanding quantities;
- Exceptions;
- service failures;
- damage;
- missing items;
- resolution history.

Vendor reporting is operational.

It must not automatically be treated as vendor financial accounting.

---

# 168. Exception Report

The Laundry domain should support an Exception report showing:

- Exception;
- Laundry Transaction;
- resident;
- Exception Type;
- affected Laundry Item;
- affected quantity;
- affected Service where applicable;
- status;
- Responsible Party;
- investigation information;
- Resolution;
- financial consequence status where applicable.

The report should allow staff to identify unresolved operational issues quickly.

---

# 169. Outstanding Laundry Report

The system should be capable of identifying Laundry Transactions with outstanding physical quantities.

The fundamental calculation is:

Collected − Delivered − Resolved

Any positive result represents outstanding physical quantity.

Example:

Collected = 5  
Delivered = 4  
Resolved = 0

Outstanding = 1

Such transactions should be visible to staff for investigation or follow-up.

---

# 170. Chargeability Report

The system should support reporting on Laundry Services that are operationally chargeable.

Relevant information includes:

- Laundry Transaction;
- Laundry Item;
- Service;
- chargeable quantity;
- Rate Snapshot;
- chargeable amount;
- Laundry Charge Event;
- Finance Charge reference where available.

The report should also identify services that are:

- requested but not fulfilled;
- fulfilled but not yet delivered;
- delivered and chargeable;
- already charged.

---

# 171. Advance Payment Visibility

Where Finance provides appropriate information, Laundry reporting may identify Laundry Transactions for which:

- an advance payment exists;
- a Laundry Charge has been raised;
- the advance has been allocated;
- a financial balance remains.

Financial amounts and allocation status remain Finance-owned facts.

Laundry reporting must not independently calculate resident financial balances.

---

# 172. Audit Requirements

Significant Laundry actions must be auditable.

At minimum, the audit trail should allow the system to determine:

- who performed the action;
- what action occurred;
- when it occurred;
- which Laundry Transaction was affected;
- what business fact was established or changed;
- relevant reason or notes where required.

---

# 173. Auditable Actions

The following actions should be auditable:

- Laundry Transaction creation;
- Collection entry;
- Collection Confirmation;
- Collection correction;
- Condition Observation;
- Processing Route selection;
- Processing Release;
- vendor selection;
- Return;
- Return correction;
- Delivery;
- Room Placement;
- Resident Verification;
- Exception creation;
- Exception investigation;
- Exception Resolution;
- chargeability determination;
- Laundry Charge Event;
- cancellation;
- Laundry Transaction completion.

---

# 174. Historical Business Facts

The Laundry system must preserve the historical meaning of confirmed business facts.

Examples include:

- original Collection;
- original Garment Lines;
- requested Services;
- Rate Snapshots;
- Collection Photographs;
- Condition Observations;
- Processing Route;
- Returns;
- Deliveries;
- Exceptions;
- Resolutions;
- chargeability events.

Historical facts must not be silently replaced by later operational outcomes.

---

# 175. Correction Model

Operational corrections are permitted where required, but corrections must preserve history.

The system should represent:

Original Fact → Correction → Current Interpretation

rather than:

Original Fact → Overwritten Fact

This principle applies particularly to:

- quantity corrections;
- Service corrections;
- Return corrections;
- Delivery corrections;
- Exception corrections.

---

# 176. Correction Before Confirmation

Before Collection Confirmation, normal editing is permitted.

Draft information may be corrected without requiring a formal correction record for every keystroke.

The final confirmed Collection becomes the historical baseline.

---

# 177. Correction After Confirmation

After Collection Confirmation, changes to historical Collection facts must use a controlled correction mechanism.

Examples:

- incorrect quantity;
- incorrect Laundry Item;
- incorrect requested Service;
- incorrect staff attribution;
- incorrect verification information.

The correction must preserve the original confirmed information.

---

# 178. Return Corrections

If an operator incorrectly records a Return quantity, the system must not simply overwrite the historical Return without traceability.

A controlled correction must preserve:

- original Return;
- correction;
- reason;
- operator;
- timestamp.

The resulting reconciliation must remain explainable.

---

# 179. Delivery Corrections

The same principle applies to Delivery.

If an incorrect Delivery quantity or handover detail is discovered, the original Delivery history must remain auditable.

The correction must not create an unexplained change in:

- delivered quantity;
- chargeability;
- resident verification;
- physical reconciliation.

---

# 180. Charge Correction Boundary

If an operational correction affects an already-raised Laundry Charge, Laundry must not directly modify the Finance Charge.

Instead:

Laundry records the corrected operational fact.

Finance determines the appropriate financial consequence.

Possible Finance outcomes may include:

- no action;
- financial Adjustment;
- reversal/correction;
- additional Charge;
- other Finance-defined action.

---

# 181. Evidence Retention

Collection Photographs are temporary operational evidence.

The agreed operational rule is:

> Collection Photographs are retained until the Laundry is taken/handed over.

The implementation must therefore provide a lifecycle for the evidence rather than treating photographs as permanent resident records by default.

Where a photograph is required as evidence for an unresolved Exception, retention must remain sufficient to support the Exception investigation and Resolution.

---

# 182. Audit vs Operational Evidence

Audit records and Collection Photographs serve different purposes.

Audit records answer:

> Who did what and when?

Collection Photographs answer:

> What did the physical Laundry look like when it was collected?

Neither should be used as a substitute for the other.

---

# 183. Historical Rate Integrity

The Laundry Charge Master may change over time.

Historical Laundry Transactions must remain associated with their original Rate Snapshots.

Reports of historical Laundry Charges must therefore use the Rate Snapshot applicable to each transaction rather than the current Charge Master.

---

# 184. Historical Service Integrity

If a Laundry Service is later renamed or deactivated, historical transactions must continue to preserve the meaning of the Service that was requested.

Historical Laundry reporting must not silently reinterpret old transactions because the Service Master changed.

---

# 185. Historical Item Integrity

If a Laundry Item is later renamed or deactivated, historical transactions must continue to preserve their original Laundry Item meaning.

Historical transactions must not be silently reclassified merely because Master Data changes.

---

# 186. Audit Timeline

The Laundry Transaction should provide an operational timeline capable of reconstructing the major lifecycle events.

Example:

Laundry Transaction Created  
↓  
Collection Confirmed  
↓  
Condition Observed  
↓  
Processing Released  
↓  
Laundry Returned  
↓  
Exception Raised  
↓  
Laundry Delivered  
↓  
Exception Resolved  
↓  
Laundry Charge Raised  
↓  
Laundry Transaction Completed

The timeline is a projection of historical business facts.

---

# 187. Historical Reconstruction Principle

Given a Laundry Transaction, an authorized operator should be able to determine:

1. What was collected?
2. What Services were requested?
3. What rates were applicable?
4. What conditions were observed?
5. Where was the Laundry processed?
6. What actually came back?
7. What was delivered?
8. What remained outstanding?
9. What Exceptions occurred?
10. How were Exceptions resolved?
11. What became chargeable?
12. What financial Charges were raised?
13. When did the Laundry Transaction become physically complete?

The system should not require staff to infer these facts from overwritten current-state fields.

---

# 188. Immutability Principle

The following are historical business facts once confirmed and must remain reconstructable:

- Collection Confirmation;
- Rate Snapshots;
- Processing Release;
- Laundry Returns;
- Deliveries;
- Exceptions;
- Resolutions;
- Laundry Charge Events;
- Completion;
- Cancellation.

Corrections may add new facts but must not erase the historical event.

---

# 189. Audit and Finance Boundary

Laundry audit history records Laundry-owned operational actions.

Finance audit history records Finance-owned financial actions.

For example:

Laundry records:

LaundryChargeRaised  
Amount = ₹60

Finance records:

Charge Created  
Amount = ₹60

Later Finance records:

Payment Allocated  
Amount = ₹60

The Laundry audit trail does not become the Finance ledger.

---

# 190. Reporting Integrity

Laundry reports must derive their information from authoritative Laundry facts.

Reports must not:

- recalculate historical rates using current Master Data;
- infer physical return from Collection quantity;
- infer Delivery from Return;
- infer Service Fulfillment from Delivery;
- infer payment from Charge;
- infer financial settlement from Laundry completion.

Each business fact must come from its owning domain.

---

# 191. Operational Reconciliation

The Laundry Workspace and reports should provide enough information to reconcile:

Physical Quantity:

Collected → Returned → Delivered / Resolved

Service Quantity:

Requested → Fulfilled → Delivered → Charged

Financial:

Laundry Charge Event → Finance Charge → Payment / Allocation / Adjustment

These are related but separate reconciliations.

---

# 192. Reconciliation Example

Consider:

Collected:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled × 3  
Ironing fulfilled × 2

Returned:

Shirt × 3

Delivered:

Shirt × 2

Physical reconciliation:

Collected = 3  
Returned = 3  
Delivered = 2  
Resolved = 0  
Outstanding = 1

Service reconciliation:

Cleaning:
Requested = 3
Fulfilled = 3
Delivered = 2
Chargeable = 2

Ironing:
Requested = 3
Fulfilled = 2
Delivered = 2
Chargeable = 2

The Laundry system must be able to represent both reconciliations simultaneously.

---

# 193. Audit Principle

The purpose of Laundry auditability is not merely compliance.

It is operational accountability.

The system should make it possible to answer:

> What happened to this resident's laundry?

without relying on:

- staff memory;
- verbal instructions;
- spreadsheets;
- informal WhatsApp messages;
- undocumented vendor conversations.

The Laundry Transaction should become the authoritative operational record.

# 194. MVP Scope, Future Evolution and Extensibility

## 194.1 Purpose

The Laundry MVP must support the actual current operational process while establishing a stable domain model that can accommodate future in-house Laundry operations.

The MVP must remain operationally simple.

Future capabilities must extend the Laundry domain rather than require replacement of the core Laundry Transaction model.

---

# 195. MVP Objectives

The Laundry MVP must provide a complete operational lifecycle covering:

1. Laundry collection;
2. physical counting;
3. Service selection;
4. Collection Photographs;
5. staff verification;
6. resident verification;
7. inspection;
8. Condition Observations;
9. Charge Master configuration;
10. Rate Snapshots;
11. Processing Route selection;
12. External Vendor Processing;
13. simplified In-House Processing;
14. Laundry Return;
15. physical quantity reconciliation;
16. partial Return;
17. Delivery;
18. partial Delivery;
19. Direct Handover;
20. Room Placement;
21. Resident Verification;
22. Exceptions;
23. Investigation;
24. Resolution;
25. Service Fulfillment;
26. chargeability;
27. Laundry Charge Events;
28. Finance integration;
29. advance-payment handling through Finance;
30. operational reporting;
31. audit history;
32. Laundry Transaction completion.

---

# 196. MVP Processing Routes

The MVP supports exactly two Processing Routes:

`IN_HOUSE`

`EXTERNAL_VENDOR`

The Processing Route is selected by the operator.

---

# 197. MVP External Vendor Model

The External Vendor workflow reflects the current operating model.

The process is:

Collection  
↓  
Inspection  
↓  
Processing Route Selection  
↓  
Processing Release  
↓  
Physical handover to Vendor  
↓  
With Vendor  
↓  
Vendor returns Laundry  
↓  
RPGMS staff counts and verifies Return  
↓  
Delivery

The MVP does not require a digital vendor-side system.

---

# 198. MVP Vendor Interaction

The external vendor may receive Laundry through the existing physical operating process.

The RPGMS system remains authoritative for:

- what was collected;
- what services were requested;
- what rates applied;
- what was physically returned;
- what was physically delivered;
- what Exceptions were identified.

The vendor does not become an authoritative external source of RPGMS Laundry history.

---

# 199. MVP In-House Laundry Model

The MVP intentionally treats In-House Laundry as a simplified Processing Route.

The operator selects:

`IN_HOUSE`

The Laundry Transaction then enters In-House Processing.

The operator records when processing is complete.

The Laundry subsequently enters the normal Return and Delivery workflow.

No separate internal Laundry operations subsystem is required for MVP.

---

# 200. Why In-House Laundry Is a Processing Route

The domain must not create separate business models for:

- Vendor Laundry;
- In-House Laundry.

Both represent the same resident Laundry relationship.

The difference is where processing occurs.

Therefore:

Laundry Transaction  
→ Processing Route = `EXTERNAL_VENDOR`

or:

Laundry Transaction  
→ Processing Route = `IN_HOUSE`

The Collection, Services, Rates, Return, Delivery, Exceptions, Chargeability, and Finance boundary remain common.

---

# 201. Future In-House Laundry Evolution

Future in-house operations may become more sophisticated.

Possible future capabilities include:

- internal Laundry work queues;
- staff assignment;
- washing stages;
- drying stages;
- folding;
- ironing stations;
- machine assignment;
- machine capacity;
- batch/work-unit processing;
- processing timestamps;
- internal quality checks;
- internal production status;
- internal Laundry inventory;
- consumables;
- internal laundry costing;
- utility consumption;
- maintenance of laundry equipment.

These capabilities are intentionally outside the MVP.

---

# 202. Future Internal Processing Model

If detailed internal processing is introduced, it should be added beneath the existing Laundry Transaction.

The future model should conceptually remain:

Laundry Transaction  
↓  
Processing Route = `IN_HOUSE`  
↓  
Internal Processing Workflow  
↓  
Laundry Return  
↓  
Delivery

The internal workflow should not replace the Laundry Transaction.

---

# 203. Future Vendor Integration

Future versions may introduce electronic Vendor integration.

Possible capabilities include:

- digital vendor manifest;
- vendor acknowledgement;
- vendor quantity confirmation;
- vendor status updates;
- digital vendor Return;
- vendor API integration;
- vendor performance metrics;
- automated discrepancy reconciliation.

These capabilities must supplement the RPGMS operational record.

They must not remove RPGMS physical verification as the authoritative record of what was actually received back.

---

# 204. Future Vendor Quantity Reconciliation

If a vendor eventually provides a digital quantity confirmation, the system may record:

Vendor Reported Quantity

separately from:

RPGMS Verified Returned Quantity

For example:

Vendor Reported:

Shirt × 3  
Trouser × 2

RPGMS Verified:

Shirt × 3  
Trouser × 1

The difference remains a reconciliation issue.

The vendor's reported quantity must not silently overwrite the RPGMS verified quantity.

---

# 205. Future Service Routing

The MVP applies one Processing Route to the entire Laundry Transaction.

Future versions may require more granular routing.

For example:

Shirt Cleaning  
→ In-House

Shirt Dry Cleaning  
→ External Vendor

or:

Shirt  
→ Vendor A

Trouser  
→ Vendor B

Such routing must be introduced as an extension of the Processing model.

It must not require duplication of the Laundry Transaction itself.

---

# 206. Future Processing Granularity

The MVP operates primarily at:

- Laundry Transaction;
- Garment Line;
- Service;
- physical quantity.

Future internal processing may require additional granularity such as:

- individual processing tasks;
- work units;
- processing stages;
- staff assignments;
- machine operations.

These should be introduced only where operational requirements justify them.

The MVP must not prematurely model these concepts.

---

# 207. Future Individual Garment Identity

The MVP does not require individual garment identity.

A Laundry Item represents a category and quantity.

For example:

Shirt × 3

does not require:

- Shirt A;
- Shirt B;
- Shirt C.

Future requirements may justify individual garment identification through:

- tags;
- barcodes;
- QR codes;
- RFID;
- unique garment identifiers.

If introduced, individual garment identity must be an extension of the existing Garment Line and physical quantity model.

It must not invalidate historical quantity-based transactions.

---

# 208. Future Laundry Batch Processing

The MVP does not treat Laundry as batch-based.

A resident may divide laundry by Service combinations within the same Laundry Transaction.

For example:

Shirt × 2  
Cleaning + Ironing

Shirt × 1  
Cleaning

This remains a quantity/service model.

Future internal operations may introduce physical processing batches for operational efficiency.

A processing batch would represent an internal operational grouping.

It must not redefine the resident's Laundry Transaction or commercial Service quantities.

---

# 209. Future Internal Costing

The MVP does not calculate the internal cost of processing Laundry.

Future In-House Laundry may require:

- labour cost;
- electricity cost;
- water cost;
- detergent/consumable cost;
- machine depreciation;
- equipment maintenance;
- other operational costs.

Such costing belongs to an appropriate Finance/Operations model and must not be confused with the resident-facing Laundry Charge Master.

---

# 210. Resident Pricing Independence

Future internal cost changes must not automatically change resident Laundry pricing.

For example:

The cost of processing a Shirt internally may increase because of:

- electricity;
- labour;
- detergent;
- equipment costs.

The resident-facing rate remains determined by the Laundry Charge Master.

Any pricing change is an explicit commercial configuration decision.

---

# 211. Future Laundry Charge Master Evolution

The Charge Master may eventually support richer pricing models.

Potential future capabilities include:

- seasonal rates;
- vendor-specific rates;
- internal/external pricing;
- bulk pricing;
- promotional pricing;
- resident-category pricing;
- minimum charges;
- special garment handling charges.

Such extensions must preserve the fundamental historical principle:

> The applicable commercial rate is snapshotted when the Laundry Transaction reaches the pricing boundary.

The precise pricing boundary must not be changed casually once the system is in production.

---

# 212. Future Service Composition

A future Laundry Service may represent a more complex service package.

For example:

`Premium Cleaning`

may internally involve:

- Cleaning;
- Drying;
- Folding;
- Finishing.

The resident-facing Service remains a single commercial Service.

The internal processing model may expand without changing the commercial Laundry Transaction model.

---

# 213. Future Service Dependencies

Future Services may have dependencies.

For example:

Ironing may require Cleaning first.

The MVP does not require a formal dependency engine.

If introduced later, dependencies should be represented in the Service/Processing model rather than hard-coded into individual Laundry Transactions.

---

# 214. Future Quality Management

Future Laundry operations may introduce formal Quality Control.

Possible capabilities include:

- quality inspection checkpoints;
- inspection checklists;
- staff approval;
- vendor quality scoring;
- resident quality feedback;
- repeat-service workflow.

These capabilities should extend the Exception and Service Fulfillment model rather than create a separate Laundry transaction type.

---

# 215. Future Vendor Performance

The Laundry domain may eventually support vendor performance reporting.

Possible metrics include:

- turnaround time;
- missing-item rate;
- damage rate;
- service failure rate;
- quality issues;
- Exception frequency;
- resolution time;
- return accuracy.

Vendor performance metrics must be calculated from authoritative Laundry events and verified operational facts.

---

# 216. Future Automation

Future versions may automate operational actions such as:

- reminders for overdue vendor returns;
- alerts for unresolved Exceptions;
- alerts for Laundry awaiting Delivery;
- chargeability notifications;
- vendor performance alerts;
- resident notifications.

Automation must operate on authoritative Laundry facts.

Automation must not create independent business truth.

---

# 217. Future Notifications

Potential resident notifications may include:

- Laundry collected;
- Laundry sent for processing;
- Laundry returned;
- Laundry ready for delivery;
- Laundry delivered;
- Laundry Exception raised;
- Laundry Exception resolved;
- Laundry Charge created.

Notification delivery is a communication concern.

The underlying Laundry business fact remains owned by Laundry.

---

# 218. Future Resident Self-Service

A future resident workspace may allow residents to:

- view Laundry Transactions;
- review collected quantities;
- review requested Services;
- view processing status;
- view Returns;
- view Deliveries;
- verify Delivery;
- report an Exception;
- view Laundry Charges.

Resident self-service must not bypass the Laundry domain's business rules.

---

# 219. Future Digital Collection

The current collection process is staff-operated.

Future versions may introduce resident-assisted collection such as:

- resident pre-entry;
- QR-based collection;
- mobile collection;
- digital confirmation;
- resident photograph capture.

Such features should feed the same Laundry Transaction and Collection Confirmation model.

---

# 220. Future Evidence Management

Collection Photographs are currently temporary operational evidence.

Future versions may introduce a more formal Evidence model supporting:

- photographs;
- videos;
- documents;
- signatures;
- digital acknowledgements.

If introduced, the Laundry domain should reference the common evidence capability rather than creating a Laundry-specific document management subsystem.

---

# 221. MVP Non-Goals

The following are explicitly not MVP requirements:

- individual garment tracking;
- RFID;
- barcode-based garment tracking;
- machine management;
- machine scheduling;
- detailed internal processing stages;
- internal work queues;
- digital vendor integration;
- vendor APIs;
- vendor-side manifests;
- automated vendor quantity reconciliation;
- batch processing;
- internal Laundry costing;
- utility cost allocation;
- automated pricing;
- complex pricing formulas;
- resident self-service Laundry management;
- automated notifications;
- advanced quality management.

These may be considered after the core Laundry lifecycle has been implemented and validated operationally.

---

# 222. Extensibility Principle

The Laundry domain must be designed so that future operational sophistication can be added without changing the fundamental resident Laundry relationship.

The stable core is:

Laundry Transaction  
↓  
Garment Lines  
↓  
Requested Services  
↓  
Rate Snapshots  
↓  
Processing Route  
↓  
Returns  
↓  
Deliveries  
↓  
Exceptions / Resolutions  
↓  
Chargeability  
↓  
Finance

Future capabilities should extend one or more of these layers rather than replace the core model.

---

# 223. Avoid Premature Complexity

The MVP must not model future operational complexity merely because that complexity is foreseeable.

The implementation should solve the actual current operational problem:

> Collect, process, return, deliver, reconcile, resolve, and charge Laundry correctly.

Future requirements should be introduced when there is a real operational need.

This principle is particularly important for In-House Laundry.

The system must be capable of supporting a sophisticated internal Laundry operation later without requiring that sophistication today.

---

# 224. MVP Success Criteria

The Laundry MVP is successful when staff can reliably answer:

1. What Laundry did the resident give us?
2. How many physical pieces were collected?
3. What Services were requested for each quantity?
4. What rates applied at Collection Confirmation?
5. Was the Laundry processed internally or externally?
6. What was actually returned?
7. What remains outstanding?
8. What was delivered?
9. Was the resident present or was the Laundry placed in the room?
10. Did the resident verify the Delivery?
11. What Exceptions occurred?
12. What was the Resolution?
13. Which Services were actually fulfilled?
14. What quantity became chargeable?
15. What Laundry Charges were raised?
16. What financial action did Finance take?
17. Is the physical Laundry relationship complete?

If these questions can be answered reliably from the system, the Laundry MVP has achieved its core operational objective.

---

# 225. Future Evolution Principle

The Laundry domain should evolve incrementally.

The preferred evolution path is:

MVP External Vendor + Simple In-House

→

Improved Return/Reconciliation

→

Vendor Performance

→

Detailed In-House Processing

→

Internal Work Management

→

Advanced Evidence and Quality Management

→

Automation and Notifications

→

Optional Individual Garment Tracking

The sequence is illustrative rather than a committed roadmap.

Future evolution must preserve the historical and commercial integrity of existing Laundry Transactions.

---

# 226. Architectural Stability Principle

The following concepts are considered foundational and should not be casually redesigned:

- Laundry Transaction;
- Garment Line;
- physical quantity;
- Laundry Service;
- Laundry Charge Master;
- Rate Snapshot;
- Processing Route;
- Laundry Return;
- Delivery;
- Exception;
- Resolution;
- Service Fulfillment;
- operational chargeability;
- Laundry-to-Finance boundary.

Changes to these concepts after implementation should require explicit architectural review.

---

# 227. MVP Boundary Summary

The Laundry MVP deliberately provides:

**Simple Collection**

Physical counting, Service selection, photographs, inspection, and confirmation.

**Flexible Pricing**

Configurable Item + Service Charge Master with historical Rate Snapshots.

**Two Processing Routes**

External Vendor and simplified In-House.

**Flexible Delivery**

Partial Delivery, multiple Deliveries, Direct Handover, and Room Placement.

**Operational Reconciliation**

Collected, Returned, Delivered, Resolved, and Outstanding quantities.

**Exception Management**

Investigation and Resolution without rewriting history.

**Service-Level Chargeability**

Services are charged only when fulfilled and delivered.

**Finance Separation**

Laundry determines operational chargeability; Finance owns financial truth.

**Future-Proof Core**

Detailed internal Laundry operations can be added later without replacing the resident Laundry Transaction model.

# 228. End-to-End Business Scenarios

## 228.1 Purpose

This section defines canonical Laundry scenarios that demonstrate how the Laundry domain rules operate together.

These scenarios are not merely examples.

They serve as behavioural reference cases for:

- business-rule validation;
- implementation;
- testing;
- documentation reconciliation;
- future architectural review.

Where an implementation produces behaviour inconsistent with these scenarios, the implementation must be reviewed against the applicable Laundry business rules.

---

# 229. Scenario 1 — One Shirt With Cleaning and Ironing

## Situation

A resident gives:

Shirt × 1

The resident requests:

- Cleaning;
- Ironing.

## Collection

The system records:

Garment Line:

Shirt × 1  
Cleaning + Ironing

Physical Quantity:

1

The system does not record two Shirts.

## Pricing

At Collection Confirmation:

Cleaning = ₹20  
Ironing = ₹10

Rate Snapshots are captured.

## Processing

Both Services are fulfilled.

## Return

Shirt × 1 is returned.

## Delivery

Shirt × 1 is delivered.

## Chargeability

Cleaning:

Fulfilled = 1  
Delivered = 1  
Chargeable = 1

Ironing:

Fulfilled = 1  
Delivered = 1  
Chargeable = 1

## Charge

Cleaning = ₹20  
Ironing = ₹10

Total:

₹30

The resident is charged for one Shirt receiving two Services, not for two Shirts.

---

# 230. Scenario 2 — Three Shirts With Mixed Services

## Situation

A resident gives:

Shirt × 3

The resident requests:

- 2 Shirts for Cleaning + Ironing;
- 1 Shirt for Cleaning only.

## Collection Representation

The system records:

Garment Line 1:

Shirt × 2  
Cleaning + Ironing

Garment Line 2:

Shirt × 1  
Cleaning

Total physical quantity:

3 Shirts

## Pricing

Assume:

Cleaning = ₹20  
Ironing = ₹10

Rate Snapshots are captured at Collection Confirmation.

## Processing

All requested Services are fulfilled.

## Return

Shirt × 3 returned.

## Delivery

Shirt × 3 delivered.

## Chargeability

Garment Line 1:

Cleaning = 2  
Ironing = 2

Garment Line 2:

Cleaning = 1

Total chargeable Services:

Cleaning × 3  
Ironing × 2

## Charge

Cleaning:

3 × ₹20 = ₹60

Ironing:

2 × ₹10 = ₹20

Total:

₹80

The system never interprets the two Services on the first two Shirts as additional physical Shirts.

---

# 231. Scenario 3 — Partial Delivery

## Situation

A resident gives:

Shirt × 3

Requested:

Cleaning + Ironing

All Services are fulfilled.

All three Shirts are returned.

## First Delivery

Staff delivers:

Shirt × 2

The system records:

Collected = 3  
Returned = 3  
Delivered = 2  
Resolved = 0  
Outstanding = 1

## Chargeability

Cleaning:

Fulfilled = 3  
Delivered = 2  
Chargeable = 2

Ironing:

Fulfilled = 3  
Delivered = 2  
Chargeable = 2

The first charge therefore covers:

Cleaning × 2  
Ironing × 2

## Second Delivery

Staff later delivers:

Shirt × 1

The system now records:

Collected = 3  
Returned = 3  
Delivered = 3  
Resolved = 0  
Outstanding = 0

The Laundry Transaction becomes physically complete.

The remaining Cleaning and Ironing services become chargeable.

---

# 232. Scenario 4 — Partial Return

## Situation

A resident gives:

Shirt × 3  
Trouser × 2

Total:

5 physical garments

## Return

Vendor returns:

Shirt × 3  
Trouser × 1

RPGMS staff verifies the physical Return.

The system records:

Collected = 5  
Returned = 4

Outstanding:

1

## Exception

An Exception is raised:

Type = `MISSING`

Affected Quantity = 1

The original Collection remains:

Trouser × 2

The system does not change the Collection to Trouser × 1.

---

# 233. Scenario 5 — Missing Item Subsequently Recovered

Continuing Scenario 4:

The missing Trouser is later returned.

## Second Return

RPGMS receives:

Trouser × 1

The system records an additional Return.

Cumulative:

Collected = 5  
Returned = 5

The Missing Exception is resolved:

Resolution = `ITEM_RECOVERED`

## Delivery

The recovered Trouser proceeds through the normal Delivery workflow.

The original Missing Exception remains permanently recorded as part of the Laundry history.

---

# 234. Scenario 6 — Missing Item Permanently Lost

Continuing Scenario 4:

The missing Trouser cannot be recovered.

Investigation determines:

Resolution = `PERMANENTLY_LOST`

The system records:

Collected = 5  
Returned = 4  
Delivered = 4  
Resolved = 1

Outstanding:

5 − 4 − 1 = 0

The Laundry Transaction may become physically complete.

However, the history clearly shows:

- 5 collected;
- 4 physically returned;
- 1 permanently lost.

The missing item is never falsely represented as returned.

---

# 235. Scenario 7 — Service Not Performed

## Situation

A resident gives:

Shirt × 2

Requested:

Cleaning + Ironing

## Processing Outcome

Cleaning is completed.

Ironing is not completed.

## Return

Shirt × 2 are returned.

## Exception

The system records:

Exception Type = `SERVICE_NOT_PERFORMED`

Affected Service = Ironing

Affected Quantity = 2

## Delivery

The resident accepts the Shirts.

Delivery is completed.

## Chargeability

Cleaning:

Fulfilled = 2  
Delivered = 2  
Chargeable = 2

Ironing:

Fulfilled = 0  
Delivered = 2  
Chargeable = 0

The resident is charged only for Cleaning.

---

# 236. Scenario 8 — Failed Service Subsequently Corrected

Continuing Scenario 7:

The vendor subsequently performs the missing Ironing service.

The system records:

Ironing:

Fulfilled = 2

The affected Shirts had already been physically delivered.

Therefore, no second Delivery is required merely because the corrective Service was subsequently performed.

The previously delivered quantity is now eligible for Ironing chargeability because:

- Ironing is fulfilled for the affected quantity; and
- the affected quantity has already been delivered.

The Ironing Service becomes chargeable for the affected quantity using the original Rate Snapshot.

If the original Rate Snapshot was:

₹10

the additional charge is:

2 × ₹10 = ₹20

The resident is not charged twice for Cleaning.

The corrective Ironing does not create:

- a second Cleaning charge;
- a duplicate Delivery;
- an additional physical garment quantity.

If the corrective operational process requires the physical garment to be collected again and returned again, those are separate physical events and must not overwrite the original Delivery history.

---

# 237. Scenario 9 — Existing Damage at Collection

## Situation

A resident gives:

Shirt × 1

During Inspection, staff observes:

Existing tear near cuff.

## Collection Record

The system records a Condition Observation:

Laundry Item = Shirt  
Affected Quantity = 1  
Condition = Existing tear

Collection Photograph may be associated as supporting evidence.

## Processing

The Shirt is processed.

## Return

The same tear is visible when the Shirt is returned.

No new Damage Exception is automatically required because the condition was already recorded before processing.

The original Condition Observation remains available as historical evidence.

---

# 238. Scenario 10 — New Damage During Processing

## Situation

A resident gives:

Shirt × 1

No relevant damage is recorded at Collection.

The Shirt is returned with a new tear.

## Exception

The system records:

Exception Type = `DAMAGED`

Affected Quantity = 1

Investigation determines:

Responsible Party = `VENDOR`

The Shirt may still be delivered if the resident accepts it.

The Exception remains independently resolvable.

If compensation or another financial action is approved, Finance handles the financial consequence.

---

# 239. Scenario 11 — Damaged Laundry Accepted at Delivery

## Situation

A Shirt is returned with processing-related damage.

The resident sees the damage and accepts the physical Shirt.

## Delivery

The system records:

Delivered = 1

Resident Verification = `VERIFIED`

## Exception

The Damage Exception remains:

Status = `OPEN`

The Laundry Transaction is not prevented from progressing merely because the Exception remains open.

The Exception follows its own Investigation and Resolution lifecycle.

---

# 240. Scenario 12 — Wrong Item Returned

## Situation

A resident gives:

Blue Shirt × 1

The vendor returns a Shirt that staff cannot confidently identify as the resident's Shirt.

The resident states:

"This is not my Shirt."

## Exception

The system records:

Exception Type = `IDENTITY_DISPUTE`

Affected Quantity = 1

The disputed Shirt must not be treated as successfully delivered to the resident until the identity issue is resolved.

The affected quantity remains unresolved.

---

# 241. Scenario 13 — Resident Away and Room Placement

## Situation

A resident has already instructed staff:

"If my Laundry is ready while I am away, keep it in my room."

The Laundry is returned while the resident is out.

## Delivery

Staff places the Laundry in the resident's room.

The system records:

Handover Method = `ROOM_PLACEMENT`

Resident Present = `NO`

Resident Verification = `NOT_VERIFIED`

Staff Member = [Recorded Staff]

The Delivery is valid because physical handover by room placement has occurred.

Resident Verification is not implied.

---

# 242. Scenario 14 — Advance Payment Equals Final Charge

## Situation

The resident pays:

₹100

at the time of Collection.

At this point, the final charge has not yet been established.

Finance records the payment.

## Final Laundry Outcome

After fulfilment and Delivery, the actual Laundry Charge is:

₹100

Finance creates the authoritative Charge and allocates the ₹100 advance.

Laundry does not create or allocate the payment.

---

# 243. Scenario 15 — Advance Payment Greater Than Final Charge

## Situation

Resident pays:

₹100

Actual Laundry Charge:

₹80

Finance allocates:

₹80

Remaining:

₹20

The ₹20 remains governed by Finance.

Laundry does not determine whether the remaining amount is refunded, transferred, or retained.

---

# 244. Scenario 16 — Advance Payment Less Than Final Charge

## Situation

Resident pays:

₹100

Actual Laundry Charge:

₹120

Finance allocates:

₹100

Remaining amount due:

₹20

The ₹20 is a Finance-owned outstanding amount.

Laundry does not maintain the outstanding financial balance.

---

# 245. Scenario 17 — Advance Payment and Failed Service

## Situation

Resident pays:

₹100

Laundry:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled  
Ironing not fulfilled

Delivery:

Shirt × 3

Actual chargeable amount:

Cleaning only

Assume:

Cleaning = ₹60  
Ironing = ₹30

Laundry Charge:

₹60

Finance applies ₹60 from the ₹100 advance.

Remaining Finance-owned amount:

₹40

No Ironing Charge is created until Ironing is actually fulfilled and the affected quantity becomes eligible for chargeability.

---

# 246. Scenario 18 — Charge Master Rate Changes After Collection

## Situation

At Collection Confirmation:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10

Rate Snapshots are created.

Before Delivery, the operator changes the Charge Master:

Shirt Cleaning = ₹25  
Shirt Ironing = ₹12

## Outcome

The existing Laundry Transaction continues to use:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10

The new rates apply only to transactions whose pricing boundary occurs after the new rates become effective.

Historical transactions are never repriced because of later Master Data changes.

---

# 247. Scenario 19 — External Vendor Processing

## Situation

Processing Route:

`EXTERNAL_VENDOR`

Vendor:

ABC Laundry

## Workflow

Collection Confirmed  
↓  
Inspection  
↓  
Vendor Selected  
↓  
Processing Released  
↓  
Laundry physically handed to Vendor  
↓  
WITH_VENDOR  
↓  
Vendor Return  
↓  
RPGMS Physical Verification  
↓  
Delivery

The vendor does not need a digital RPGMS account or electronic manifest in MVP.

RPGMS staff's physical verification establishes the authoritative Return quantity.

---

# 248. Scenario 20 — In-House Processing

## Situation

Processing Route:

`IN_HOUSE`

## Workflow

Collection Confirmed  
↓  
Inspection  
↓  
Processing Released  
↓  
In-House Processing  
↓  
Operator records Processing Complete  
↓  
Laundry Return  
↓  
Delivery

No machine, workstation, employee assignment, or detailed internal production record is required in MVP.

The same Laundry Transaction model is used.

---

# 249. Scenario 21 — Change from External Vendor to In-House Before Release

## Situation

The operator initially selects:

`EXTERNAL_VENDOR`

Before the Laundry is physically released for processing, the operator decides to process it internally.

The Processing Route is changed to:

`IN_HOUSE`

This is permitted because Processing Release has not yet occurred.

The final Processing Route established at Processing Release becomes the historical processing route.

---

# 250. Scenario 22 — Processing Route Change After Release

## Situation

The Laundry has already been physically handed to an External Vendor.

The transaction records:

Processing Route = `EXTERNAL_VENDOR`

The operator later decides that the Laundry should be processed internally.

The original Processing Route must not simply be overwritten.

A controlled operational process would be required to handle the change while preserving the original release history.

The implementation must not silently transform:

`EXTERNAL_VENDOR`

into:

`IN_HOUSE`

after physical release.

---

# 251. Scenario 23 — Partial Service Fulfillment

## Situation

Laundry:

Shirt × 3

Requested:

Cleaning + Ironing

Processing outcome:

Cleaning fulfilled × 3  
Ironing fulfilled × 2

Return:

Shirt × 3

Delivery:

Shirt × 3

## Chargeability

Cleaning:

Chargeable = 3

Ironing:

Chargeable = 2

The remaining Ironing quantity:

1

remains non-chargeable until the service is fulfilled for that physical quantity.

---

# 252. Scenario 24 — Partial Service Fulfillment and Partial Delivery

## Situation

Laundry:

Shirt × 3

Requested:

Cleaning + Ironing

Processing:

Cleaning fulfilled × 3  
Ironing fulfilled × 2

Return:

Shirt × 3

First Delivery:

Shirt × 2

## Chargeability

Cleaning:

Fulfilled = 3  
Delivered = 2  
Chargeable = 2

Ironing:

Fulfilled = 2  
Delivered = 2  
Chargeable = 2

The first Laundry Charge therefore contains:

Cleaning × 2  
Ironing × 2

Second Delivery:

Shirt × 1

Cleaning becomes chargeable for the final Shirt.

Ironing does not become chargeable for that Shirt until Ironing is fulfilled.

---

# 253. Scenario 25 — Open Exception at Physical Completion

## Situation

Laundry:

Shirt × 1

Returned:

Shirt × 1

Delivered:

Shirt × 1

A Damage Exception remains open.

Physical reconciliation:

Collected = 1  
Delivered = 1  
Resolved = 0

Outstanding:

0

The Laundry Transaction may become:

`COMPLETED`

while the Damage Exception remains:

`OPEN`

The Exception continues independently until Resolution.

This prevents operational completion from being unnecessarily blocked by an unrelated unresolved issue.

---

# 254. Scenario 26 — Exception Resolution Requires Financial Action

## Situation

A Shirt is damaged during Vendor Processing.

Investigation concludes:

Responsible Party = `VENDOR`

Resolution:

Compensation approved.

Laundry records the operational Resolution and financial-action requirement.

Finance then creates the appropriate financial Adjustment according to Finance rules.

Laundry does not directly modify the resident's financial ledger.

---

# 255. Scenario 27 — No Financial Action Despite Responsibility

## Situation

A vendor is determined to be responsible for a minor service-quality issue.

Resolution:

Vendor correction completed.

No resident compensation or financial Adjustment is required.

The Exception is resolved.

No Finance Adjustment is created.

This demonstrates that:

Responsible Party ≠ Automatic Financial Liability

---

# 256. Scenario 28 — Multiple Laundry Transactions for One Stay

A resident has:

Laundry Transaction L-001

Status:

WITH_VENDOR

The following day, the resident submits additional Laundry:

Laundry Transaction L-002

Status:

COLLECTED

Both transactions belong to the same Stay.

They remain operationally independent.

A Return or Exception in L-001 must not modify:

- Garment Lines in L-002;
- Services in L-002;
- Rate Snapshots in L-002;
- Delivery quantities in L-002.

---

# 257. Scenario 29 — Laundry Transaction Cancelled Before Processing

## Situation

Laundry is collected and Collection Confirmation occurs.

Before Processing Release, the resident asks for the Laundry back.

Staff returns all collected Laundry to the resident.

The transaction is cancelled.

The system records:

`LaundryTransactionCancelled`

Status:

`CANCELLED`

The original Collection remains historically available.

The transaction is not deleted.

No normal Laundry Charge is created merely because the Collection existed.

Any payment already received is handled by Finance.

---

# 258. Scenario 30 — Attempted Cancellation After Processing Release

## Situation

Laundry has already been physically released to the vendor.

The resident subsequently asks to cancel the Laundry.

The pre-processing Cancellation operation is no longer available.

The Laundry must proceed through the appropriate operational recovery process.

The original Processing Release remains historical.

Any financial consequence is determined according to the actual operational outcome and Finance rules.

---

# 259. Scenario 31 — Rework Does Not Double Charge

## Situation

Shirt Cleaning is completed but the cleaning quality is unacceptable.

The vendor re-cleans the Shirt.

The original Cleaning Service remains one requested commercial Service.

The resident is not charged:

Cleaning × 2

merely because the vendor performed two physical cleaning operations.

The second operation is corrective rework.

The original Rate Snapshot remains the basis for the resident's Cleaning Charge.

---

# 260. Scenario 32 — Replacement Does Not Create a New Laundry Charge

## Situation

A Laundry Item is permanently damaged or lost.

The business resolution requires the vendor to provide a replacement.

The replacement is not a new resident Laundry Transaction.

It is part of the Exception Resolution of the original Laundry Transaction.

The replacement does not automatically create a new Laundry Service Charge.

Any financial consequence is handled through Finance.

---

# 261. Scenario 33 — Collection Photograph as Evidence

At Collection:

Shirt × 1

A photograph is captured.

Later, a dispute arises regarding a visible pre-existing mark.

The Collection Photograph is used as supporting evidence during Investigation.

The photograph does not become an individual garment identity.

It remains Collection evidence.

The original Collection and Condition Observation remain the authoritative business facts.

---

# 262. Scenario 34 — Return Quantity Greater Than Expected

## Situation

Collected:

Shirt × 2

A Return is presented:

Shirt × 3

The system must not silently accept the additional Shirt as belonging to the Laundry Transaction.

The operator must investigate the discrepancy.

Possible outcomes include:

- additional item identified as belonging to another Laundry Transaction;
- wrong item returned;
- data-entry error;
- other operational explanation.

The original Collection remains:

Shirt × 2

The system must not automatically change it to Shirt × 3.

---

# 263. Scenario 35 — Delivery Attempt Exceeds Available Quantity

## Situation

Collected:

Shirt × 3

Returned:

Shirt × 2

Staff attempts to deliver:

Shirt × 3

The system must prevent confirmation of the Delivery because only two Shirts are physically available for handover.

The maximum deliverable quantity is:

2

The operator must either:

- deliver 2; or
- correct the Return information if the physical count was entered incorrectly.

The system must never create a Delivery that exceeds physically available quantity.

---

# 264. Scenario 36 — Chargeable Service Awaiting Delivery

## Situation

Laundry:

Shirt × 3

Cleaning fulfilled:

3

Ironing fulfilled:

3

Returned:

3

Delivered:

2

The system must identify:

Cleaning:
Chargeable = 2

Ironing:
Chargeable = 2

The remaining Shirt is not chargeable yet because it has not been delivered.

The workspace should surface the remaining chargeable quantity after the next Delivery.

---

# 265. Scenario 37 — Delivered but Service Not Fulfilled

## Situation

Laundry:

Shirt × 1

Requested:

Cleaning + Ironing

Returned:

Shirt × 1

Processing:

Cleaning fulfilled  
Ironing not fulfilled

Delivered:

Shirt × 1

The Laundry Transaction records:

Delivered = 1

But:

Cleaning = Chargeable

Ironing = Not Chargeable

The system must not equate Delivery with full Service Fulfillment.

---

# 266. Scenario 38 — Fully Delivered but Financially Unsettled

## Situation

Laundry is completely delivered.

Physical reconciliation:

Outstanding = 0

The Laundry Transaction becomes:

`COMPLETED`

However, Finance may still show an unpaid Laundry Charge.

This is valid.

Laundry completion means physical Laundry completion.

It does not mean financial settlement.

---

# 267. Scenario 39 — Financially Paid Before Physical Completion

## Situation

Resident pays an advance before Laundry processing is complete.

Finance records the Payment.

Laundry continues through:

Processing  
↓  
Return  
↓  
Delivery

The existence of the advance does not change the Laundry operational lifecycle.

Laundry becomes complete according to physical reconciliation.

Finance independently tracks the Payment and eventual Charge allocation.

---

# 268. Scenario 40 — Complete End-to-End Example

## Collection

Resident provides:

3 Shirts  
2 Trousers

Service selection:

2 Shirts:
Cleaning + Ironing

1 Shirt:
Cleaning

2 Trousers:
Cleaning

Rate Snapshots:

Shirt Cleaning = ₹20  
Shirt Ironing = ₹10  
Trouser Cleaning = ₹20

## Inspection

One Shirt has a pre-existing tear.

Condition Observation:

Shirt × 1  
Existing tear

## Processing

Processing Route:

`EXTERNAL_VENDOR`

Vendor:

ABC Laundry

## Return

Vendor returns:

3 Shirts  
1 Trouser

RPGMS verifies:

Returned = 4

Outstanding:

1 Trouser

Missing Exception:

Affected Quantity = 1

## First Delivery

Staff delivers:

2 Shirts  
1 Trouser

Delivered = 3

Chargeability:

Shirt Cleaning × 2  
Shirt Ironing × 2  
Trouser Cleaning × 1

Charge:

Shirt Cleaning = ₹40  
Shirt Ironing = ₹20  
Trouser Cleaning = ₹20

Total:

₹80

## Exception Resolution

Vendor later returns:

1 Trouser

The Missing Exception is resolved as:

`ITEM_RECOVERED`

## Second Delivery

Staff delivers:

1 Shirt  
1 Trouser

Cumulative Delivery:

5 physical garments

Service chargeability now becomes:

Shirt Cleaning × 3  
Shirt Ironing × 2  
Trouser Cleaning × 2

Final total:

Shirt Cleaning = ₹60  
Shirt Ironing = ₹20  
Trouser Cleaning = ₹40

Total:

₹120

Physical reconciliation:

Collected = 5  
Returned = 5  
Delivered = 5  
Resolved = 0  
Outstanding = 0

Laundry Transaction:

`COMPLETED`

Finance independently records the resulting Laundry Charges and any applicable Payment Allocations.

---

# 269. Acceptance Rules

The following acceptance rules provide a practical baseline for validating the Laundry implementation.

## AR-01 — Physical Counting

The system must count each physical Laundry Item once regardless of the number of Services applied.

---

## AR-02 — Mixed Services

The system must support different Service combinations for different quantities of the same Laundry Item.

---

## AR-03 — Charge Master

An authorized operator must be able to create a new Laundry Item + Service rate without code changes.

---

## AR-04 — Rate Snapshot

The applicable rate must be snapshotted at Collection Confirmation.

---

## AR-05 — Historical Pricing

Changing the Charge Master must not change existing Rate Snapshots.

---

## AR-06 — Collection Evidence

Collection Photographs must be captured for collected Laundry according to the agreed operational workflow.

---

## AR-07 — Processing Route

The operator must be able to select `IN_HOUSE` or `EXTERNAL_VENDOR`.

---

## AR-08 — Vendor Selection

When `EXTERNAL_VENDOR` is selected, a vendor must be identified before Processing Release.

---

## AR-09 — Simple In-House MVP

When `IN_HOUSE` is selected, the system must support the processing lifecycle without requiring machine-level or detailed internal processing data.

---

## AR-10 — Return Verification

The Return quantity must be based on the actual physical quantity verified by RPGMS staff.

---

## AR-11 — Partial Return

The system must support Returns that are less than the original Collection quantity.

---

## AR-12 — Multiple Returns

The system must support multiple Returns for one Laundry Transaction.

---

## AR-13 — Partial Delivery

The system must support Delivery of only part of the available returned quantity.

---

## AR-14 — Multiple Deliveries

The system must support multiple Deliveries for one Laundry Transaction.

---

## AR-15 — Room Placement

The system must support `ROOM_PLACEMENT` when the resident has instructed staff to place Laundry in the room while absent.

---

## AR-16 — Resident Verification

The system must record Resident Verification separately from physical Delivery.

---

## AR-17 — Exception Quantity

Exceptions must support affected quantities smaller than the total Garment Line quantity.

---

## AR-18 — Exception History

Resolving an Exception must not erase the original Exception or related historical facts.

---

## AR-19 — Service Fulfillment

The system must distinguish Requested, Fulfilled, Delivered, and Chargeable quantities.

---

## AR-20 — Partial Service Fulfillment

Different Services on the same physical quantity must be independently chargeable according to their actual fulfillment and delivery.

---

## AR-21 — No Double Charging

The same physical quantity must not be charged more than once for the same Laundry Service.

---

## AR-22 — Finance Boundary

Laundry must not directly create or modify the authoritative Finance Charge.

---

## AR-23 — Advance Payment

A Payment received before final Laundry Charge creation must remain Finance-owned.

---

## AR-24 — Physical Completion

A Laundry Transaction becomes physically complete only when:

Collected − Delivered − Resolved = 0

---

## AR-25 — Financial Independence

Laundry completion must not imply financial settlement.

---

## AR-26 — Historical Integrity

Confirmed Collection, Return, Delivery, Exception, Resolution, and Chargeability facts must remain historically reconstructable.

---

## AR-27 — Cancellation

A confirmed Laundry Transaction may be cancelled before Processing Release only when the collected Laundry is returned to the resident.

---

## AR-28 — Post-Release History

Processing Route must not be silently changed after Processing Release.

---

## AR-29 — Corrective Rework

Corrective processing must not automatically create a duplicate resident charge for the same requested Service and physical quantity.

---

## AR-30 — Replacement

Replacement of a lost or damaged Laundry Item must not automatically create a new resident Laundry Service Charge.

---

# 270. Final Laundry Domain Principle

The Laundry domain exists to maintain a reliable operational truth about the resident's physical Laundry relationship.

The system must always be able to distinguish:

- what the resident gave us;
- what Services the resident requested;
- what rate applied;
- what condition was observed;
- where the Laundry was processed;
- what physically came back;
- what was physically delivered;
- what was not delivered;
- what was resolved;
- what Services were actually fulfilled;
- what became chargeable;
- what financial consequences were passed to Finance.

The fundamental model is:

Laundry Transaction  
→ Physical Laundry  
→ Requested Services  
→ Processing  
→ Return  
→ Delivery  
→ Exception / Resolution  
→ Service Fulfillment  
→ Chargeability  
→ Finance

The Laundry domain owns the operational truth.

Finance owns the financial truth.

The two domains cooperate through explicit business boundaries and events.

This separation is fundamental to RPGMS 2.0 and must be preserved throughout implementation and future evolution.

---

# 271. Specification Completion Statement

This specification defines the approved business design for the Laundry domain at MVP level.

It establishes:

- the Laundry vocabulary;
- the Laundry Transaction model;
- physical quantity rules;
- Service selection;
- Charge Master;
- Rate Snapshots;
- Collection;
- Inspection;
- Processing Routes;
- External Vendor Processing;
- simplified In-House Processing;
- Return;
- Delivery;
- Room Placement;
- Resident Verification;
- Exceptions;
- Investigation;
- Resolution;
- Service Fulfillment;
- chargeability;
- Finance integration;
- advance-payment handling;
- reporting;
- audit;
- historical integrity;
- MVP boundaries;
- future extensibility;
- canonical business scenarios;
- acceptance rules.

This document should be treated as the detailed Laundry business specification for subsequent documentation reconciliation and implementation planning.

Before implementation begins, the specification should be reconciled with the project's constitutional, architectural, domain, business-rule, business-event, Finance, and module-status documentation.

