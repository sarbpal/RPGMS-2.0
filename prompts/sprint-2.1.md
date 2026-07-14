# Sprint 2.1 – Dashboard Foundation

**Sprint:** 2.1  
**Status:** Planned  
**Priority:** High  
**Module:** Dashboard

---

# Objective

Implement the first Dashboard page for RPGMS 2.0.

This sprint establishes the visual dashboard framework that will become the primary landing page for the application.

The Dashboard shall render inside the existing `MainLayout`.

No business logic or live data shall be implemented.

---

# Scope

This sprint includes:

- Create the Dashboard page.
- Replace the temporary welcome screen.
- Display a page title.
- Display a welcome message.
- Display four placeholder summary cards.
- Display a Quick Actions section.
- Integrate the Dashboard into the existing Application Shell.

---

# Out of Scope

Do **NOT** implement:

- Database connectivity
- Supabase
- Authentication
- Routing
- Charts or graphs
- Notifications
- Recent activity
- Dashboard calculations
- Live statistics
- Resident information
- Finance calculations
- Electricity calculations
- Reports
- Search
- Filtering

These will be implemented in later sprints.

---

# Design Requirements

The Dashboard shall:

- Render inside the existing `MainLayout`.
- Follow the existing Material UI theme.
- Use a desktop-first layout.
- Maintain consistent spacing and typography.
- Use Material UI Cards for summary information.
- Use Material UI Buttons for Quick Actions.
- Present a clean, professional business application interface.

---

# Dashboard Sections

## Page Header

Display:

- Dashboard
- Welcome to RPGMS 2.0

---

## Summary Cards

Create four placeholder cards.

### Occupancy

Value:

```
--
```

---

### Residents

Value:

```
--
```

---

### Outstanding Dues

Value:

```
₹ --
```

---

### Monthly Collection

Value:

```
₹ --
```

---

## Quick Actions

Display four visual-only buttons.

- Add Resident
- Record Payment
- Electricity
- Reports

Buttons shall have no click behaviour.

---

# Files

Create or modify only the files required for Sprint 2.1.

Respect the Architecture Freeze Register.

Do not modify:

- Header.tsx
- Sidebar.tsx
- MainLayout.tsx

unless absolutely necessary.

---

# Acceptance Criteria

Sprint 2.1 is complete only if:

- Dashboard renders inside `MainLayout`.
- Temporary welcome page has been replaced.
- Four summary cards are displayed.
- Quick Actions section is displayed.
- Application builds successfully.
- No TypeScript errors exist.
- No unrelated files have been modified.

---

# Verification

Before completing the sprint:

- Run `npm run build`.
- Resolve all build errors.
- Resolve all TypeScript errors.
- Verify the Dashboard in the browser.

---

# Output Required

Provide:

1. Files modified.
2. Summary of implementation.
3. Build status.

Stop after Sprint 2.1.

Do not begin Sprint 2.2.

---

# Completion

**Status:** Pending

---

# Completion

**Status:** Completed ✅

**Completed On:** 15 July 2026

## Result

Implemented the first Dashboard page for RPGMS.

The Dashboard now includes:

- Dashboard title
- Welcome message
- Four placeholder summary cards
- Operational Quick Actions

Quick Actions:

- Add Resident
- Record Payment
- Occupancy
- Add Complaint

The Dashboard renders inside the existing MainLayout.

No routing or business logic was introduced.

---

## Verification

- ✅ `npm run build` passed.
- ✅ Browser verified.
- ✅ Code reviewed.
- ✅ Architecture preserved.
- ✅ Sprint accepted.

---

## Files Modified

- `src/features/dashboard/DashboardPage.tsx`
- `src/app/App.tsx`

---

## Milestone

The Dashboard Foundation has been established.

Future dashboard sprints will focus on live business information rather than structural changes.