# Dashboard

Purpose

Show today's business status.

Cards

- Occupancy
- Vacant Beds
- Rent Due
- Collections

Actions

- Add Resident
- Record Payment
- Add Electricity Bill

Tables

- Residents On Notice
- Pending Dues
# Flats

Purpose

Manage physical flats.

Functions

- Add Flat

- Edit Flat

- Activate/Deactivate

Columns

- Flat No

- Floor

- Total Beds

- Occupied Beds

- Status

# Finance Workspace

Purpose

Manage resident financial accounts, double-entry ledger, running deposit accounts, payments, damage adjustments, and checkout settlement.

Deposit Ledger

- Displays chronological transaction history for a Stay (Deposit Receipts, Partial Returns, Damage Deductions, Settlement Clearance).
- Displays running Security Deposit liability balance.

Partial Deposit Return

- Modal interface for recording mid-stay or post-checkout partial deposit returns.
- Validates return amount against current available deposit held (`sum(credit) - sum(debit)`).
- Captures payment mode (Cash/Bank) and optional remarks.
- Rejects zero, negative, or over-return amounts.
- Available for stays in `ACTIVE`, `ON_NOTICE`, and `CHECKED_OUT` states.

Deposit Deduction

- Modal interface for recording damage or penalty deductions against security deposit.
- Requires mandatory damage/penalty reason for audit trail.
- Validates deduction amount against available deposit held.
- Credits damage recovery revenue and debits security deposit liability.

Resident Financial Profile

- Provides quick action triggers for Record Payment, Generate Rent Bill, Partial Deposit Return, Deposit Deduction, and Process Settlement.
- Displays ledger activity stream, outstanding dues, and deposit account status.

# Laundry Workspace

Purpose

Manage the operational lifecycle of resident laundry services, from collection intake and physical piece verification to processing route tracking, return verification, delivery handovers, and commercial chargeability.

Cards

- Total Active Orders: All in-flight non-completed laundry orders.
- Awaiting Intake & Inspection: Orders awaiting collection confirmation (Drafts) or pre-processing inspection.
- In Processing: Orders undergoing internal in-house cleaning or released to external commercial vendors.
- Open Exceptions: Orders with active disputes, missing pieces, or garment damages requiring investigation.

Toolbar & Filters

- Universal Search: Instant search across resident name, resident code, room/flat, transaction ID, and bag tag barcodes.
- Status Lifecycle Tabs: All Orders, Drafts, Awaiting Inspection, In Processing, Ready for Delivery, Partially Delivered, Completed, Exceptions.

Transaction Table & Columns

- Order ID & Date: System transaction identifier and intake date/time.
- Resident & Room: Resident full name, code, flat number, and bed identifier.
- Piece Reconciliation: Counters for Collected, Delivered, and Outstanding physical pieces in custody.
- Route: In-House processing vs External commercial vendor.
- Status: Color-coded operational lifecycle badge.
- Commercial / Charges: Estimated commercial value and posted Finance bill status.
- Actions: Quick confirm button for drafts, quick inspect trigger for collected orders, quick return trigger for in-process orders, quick deliver trigger for returned orders, and full detail inspection trigger.

Detail Drawer

- Multi-tab operational inspector showing Garments & Services, Processing & Custody (with Custody Reconciliation Card, expected/returned/delivered counts, and garment-line custody breakdown), Deliveries (overview card and itemized handover receipts), Exceptions (operational discrepancy lifecycle, blocking delivery badges, investigation audit history, formal resolution outcomes with resolved quantities, and contextual investigation/resolution triggers), Commercial & Charges (evaluating BR-L-012 chargeability upon physical delivery), and Audit Timeline without frontend business rule calculations.
- Contextual lifecycle action buttons: "Confirm Collection Baseline" (for Drafts), "Record Pre-Processing Inspection" (for uninspected Collected orders), "Select Route & Release to Processing" (for inspected Collected orders), "Record Return from Processing" (for in-process or partially returned orders), and "Record Resident Delivery" (for orders with deliverable items in custody).

Command Dialogs

- Create Collection Draft: Select active resident stay, configure garment lines with physical piece counts and requested services, and record intake notes.
- Confirm Collection: Record staff member ID, physical bag count, tag barcodes, optional transient photo references, and resident verification to lock immutable RateSnapshots.
- Record Pre-Processing Inspection: Inspect physical garment lines, stage condition observations (stains, tears, button defects, affected piece counts, photo evidence URIs), and complete inspection sign-off.
- Select Route & Release to Processing: Choose operational processing route (`IN_HOUSE` laundry room vs `EXTERNAL_VENDOR` commercial partner with required vendor code), verify inspection prerequisite, and release order into active processing.
- Record Return from Processing: Record custody intake receipt from laundry room or external vendor, specify returned quantities per garment line, receiving staff ID, timestamp, and return notes.
- Record Resident Delivery Handover: Record resident physical handover with method selection (`DIRECT_HANDOVER` with in-person resident verification vs `ROOM_PLACEMENT` with room reference and placement photo evidence URIs), delivered quantities per garment line, delivery staff ID, timestamp, and handover notes.
- Raise Operational Exception: Record operational discrepancies, damages, missing items, or service defects targeting transaction, garment line, or service allocation scope, with affected quantities, optional blocking requests, description, and photo evidence references.
- Record Exception Investigation: Document investigative findings, responsible party determinations (`VENDOR`, `RESIDENT`, `RPGMS`, `UNKNOWN`, `NONE`, `OTHER`), and supporting photo evidence references.
- Resolve Operational Exception: Formally resolve operational exceptions with authoritative business outcomes (`ITEM_RECOVERED`, `SERVICE_CORRECTED`, `VENDOR_CORRECTED`, `RESIDENT_ACCEPTED`, `PERMANENTLY_LOST`, `NO_ACTION_REQUIRED`, `OTHER`), resolved physical piece counts for physical reconciliation, responsible party attribution, and business resolution notes.