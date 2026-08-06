# Table of Contents

1. Purpose

2. Scope

3. Business Event Philosophy

4. Relationship with Business Transactions

5. Current Projection

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

This document does not define implementation details, storage mechanisms, event schemas or software architecture.

Detailed Business Events for individual business capabilities shall be defined within their respective Workspace Specifications.

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

The MVP is expected to generate Business Events for the following business capabilities:

- Reservation
- Admission
- Stay
- Accommodation
- Finance
- Commercial Agreements

Additional Business Events may be introduced as new business capabilities are added.

The constitutional principles defined in this document shall apply equally to all future Business Events.

