# Shared Feature Resources

## Purpose

This folder contains reusable code that is shared **between business features**.

Examples include:

- Reusable UI components
- Shared hooks
- Shared business utilities
- Shared feature types
- Shared feature services

---

## Do NOT put application-level components here

The following belong in `src/components`:

- Header
- Sidebar
- MainLayout
- Navigation
- Theme-related components

These are part of the application shell.

---

## Put reusable business components here

Examples:

- PageHeader
- StatCard
- SearchToolbar
- EmptyState
- ConfirmDialog
- DataTable
- LoadingState
- FilterPanel

These can be used by multiple features such as Residents, Finance, Reports, and Maintenance.

---

## Rule of Thumb

Ask one question before creating a component:

**Is this component tied to the application layout?**

- **Yes** → `src/components`
- **No, it is shared by multiple business features** → `src/features/shared`

---

## Current Status

This folder is intentionally empty.

Reusable components will be added as the project evolves.