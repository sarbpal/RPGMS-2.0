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
- Actions: Quick confirm button for drafts, and full detail inspection trigger.

Detail Drawer

- Multi-tab operational inspector showing Garments & Services, Processing & Custody, Deliveries, Exceptions, Commercial & Charges, and Audit Timeline without frontend business rule calculations.

Command Dialogs

- Create Collection Draft: Select active resident stay, configure garment lines with physical piece counts and requested services, and record intake notes.
- Confirm Collection: Record staff member ID, physical bag count, tag barcodes, optional transient photo references, and resident verification to lock immutable RateSnapshots.