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