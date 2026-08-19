# Table of Contents

1. Purpose
2. Scope
3. Business Event Philosophy
4. Relationship with Business Transactions
5. Current Projection
6. Authoritative Domain Event Specifications
7. Laundry Domain Business Events

---

# Purpose

Business Events represent significant business decisions or operational activities that occur during the lifecycle of the organisation.

Business Events provide the authoritative record of how the business has evolved over time.

They preserve operational history while supporting current operational projections.

Business Events are independent of user interfaces, databases and implementation technologies.

This document defines the constitutional principles governing Business Events within RPGMS 2.0.

---

# Scope

This specification defines the constitutional principles governing Business Events within RPGMS.

It describes what Business Events represent, the characteristics they shall possess, and the role they play within the overall business architecture.

This document establishes the high-level business event vocabulary and governance across domains. Detailed Business Events, payload schemas, and event handling for individual business capabilities are defined in their respective Domain and Workspace Specifications.

---

# Business Event Philosophy

A Business Event represents something meaningful that happened in the business.

Business Events answer the question:

> "What happened?"

Business Events do not answer:

- Who owns the data?
- How is it stored?
- How is it displayed?

They simply record that a meaningful business event occurred.

Business Events are permanent.

Business Events are immutable.

Business Events provide the historical narrative of the organisation.

Business Events preserve Historical Truth.

They do not establish Business Truth.

Business Truth is established exclusively through authorised Business Transactions.

Business Events permanently record that Business Truth was established, modified or concluded.

---

# Relationship with Business Transactions

Business Transactions establish Business Truth.

Business Events preserve the historical record of those transactions.

Every successful Business Transaction shall generate one or more immutable Business Events.

Business Events themselves shall never modify Business Truth.

---

# Current Projection

The MVP generates Business Events for the following business capabilities:

- Reservation
- Admission
- Stay
- Accommodation
- Finance
- Commercial Agreements
- Laundry (Operational Support Domain)

Additional Business Events may be introduced as new business capabilities are added.

The constitutional principles defined in this document shall apply equally to all future Business Events.

---

# Authoritative Domain Event Specifications

Detailed event payloads, state transition semantics, and invariant rules for each domain are governed by their respective approved domain specifications:

| Domain | Authoritative Specification | Governance |
|---|---|---|
| Laundry | `docs/LAUNDRY_SPECIFICATION.md` | Approved Baseline |
| Finance | `docs/finance/FINANCE_SPECIFICATION.md` | Sealed |
| Stay / Admission | `docs/STAY_WORKSPACE.md`, `docs/admission/` | Approved |
| Accommodation | `docs/accommodation/ACCOMMODATION_SPECIFICATION.md` | Approved |

---

# Laundry Domain Business Events

The Laundry domain owns the complete operational lifecycle of resident laundry services. Per `docs/LAUNDRY_SPECIFICATION.md` (§105–§117), the authoritative Laundry event vocabulary consists of the following 11 immutable Business Events:

| Business Event | Domain Owner | Nature & Description |
|---|---|---|
| `LaundryTransactionCreated` | Laundry | Records the initialization of a new Laundry Transaction for an active Stay. |
| `LaundryCollectionConfirmed` | Laundry | Records confirmation of physical collection; establishes immutable baseline for quantities, requested services, and pricing Rate Snapshots. |
| `LaundryConditionObserved` | Laundry | Records physical condition or pre-existing defect observed during pre-processing inspection. |
| `LaundryProcessingReleased` | Laundry | Records physical release of laundry for processing and establishes the selected Processing Route (`IN_HOUSE` or `EXTERNAL_VENDOR`). |
| `LaundryReturned` | Laundry | Records physical receipt and staff verification of returned laundry into RPGMS custody. |
| `LaundryDelivered` | Laundry | Records physical handover of returned laundry to the resident (`DIRECT_HANDOVER` or `ROOM_PLACEMENT`). |
| `LaundryExceptionRaised` | Laundry | Records an operational discrepancy, missing item, damage, or service issue requiring investigation. |
| `LaundryExceptionResolved` | Laundry | Records the formal operational conclusion of an exception investigation. |
| `LaundryChargeRaised` | Laundry | Emits an operational financial fact when fulfilled services and delivered physical quantities become chargeable. |
| `LaundryTransactionCompleted` | Laundry | Records physical completion of the transaction when $\text{Collected} - \text{Delivered} - \text{Resolved} = 0$. |
| `LaundryTransactionCancelled` | Laundry | Records cancellation of a transaction prior to Processing Release with physical laundry returned to the resident. |

---

## LaundryChargeRaised Event Semantics & Finance Boundary

`LaundryChargeRaised` is the exclusive cross-domain mechanism for communicating chargeable laundry services to Finance:

1. **Event Ownership**: Published exclusively by the Laundry domain upon confirmed physical delivery of fulfilled services.
2. **Payload Completeness**: Carries complete operational pricing truth (Stay ID, Laundry Transaction ID, Garment Line, Item, Service, chargeable quantity, Rate Snapshot, and calculated amount) so Finance does not re-read Laundry master data or recalculate pricing.
3. **Idempotency Invariant**: `LaundryChargeRaised` represents a uniquely identifiable chargeable business fact. The Laundry domain shall never emit duplicate events for the same chargeable quantity, and Finance shall process `LaundryChargeRaised` idempotently so that delivery retries never result in duplicate financial Charges.
4. **Finance Authority**: Finance consumes `LaundryChargeRaised` and creates the authoritative financial Charge in the Unified Stay Ledger. Laundry never maintains a parallel financial balance or ledger.

