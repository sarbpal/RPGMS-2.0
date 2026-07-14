# Sprint 1.2 – Application Sidebar

**Sprint:** 1.2
**Status:** Planned
**Priority:** High
**Module:** Application Shell

---

# Objective

Implement the application sidebar for RPGMS 2.0.

This sprint focuses **only** on creating the visual sidebar component that forms part of the application shell.

No business functionality shall be implemented.

---

# Scope

This sprint includes:

* Create the Sidebar component.
* Integrate the Sidebar into the current application shell.
* Display placeholder navigation items.
* Preserve the existing Header component.
* Preserve the existing welcome screen.

---

# Out of Scope

Do **NOT** implement:

* Routing
* Authentication
* Authorization
* Business logic
* Dashboard functionality
* Resident module
* Finance module
* Icons (unless already part of the project design)
* Collapsible sidebar
* Responsive/mobile behaviour
* Theme switching

These items will be implemented in future sprints.

---

# Design Requirements

The Sidebar shall:

* Use Material UI.
* Follow the existing project theme.
* Be desktop-first.
* Appear directly below the Header.
* Remain permanently visible on desktop.
* Use simple placeholder navigation items.
* Maintain consistent spacing and typography.
* Contain no business logic.

---

# Placeholder Menu

Display the following items:

* Dashboard
* Accommodation
* Residents
* Finance
* Electricity
* Maintenance
* Reports
* Settings

These items are placeholders only.

They must not perform any action.

---

# Files

Create or modify only the files required for Sprint 1.2.

Do not modify unrelated components.

Do not modify Header.tsx.

Do not modify project architecture.

---

# Acceptance Criteria

Sprint 1.2 is complete only if:

* Sidebar is visible.
* Header remains visible.
* Welcome screen remains visible.
* Sidebar is positioned correctly.
* Application builds successfully.
* No TypeScript errors exist.
* No unrelated files have been modified.

---

# Verification

Before completing the sprint:

* Run `npm run build`
* Resolve all build errors.
* Resolve all TypeScript errors.
* Verify the sidebar is visible in the running application.

---

# Output Required

Provide:

1. Files modified.
2. Summary of implementation.
3. Build status.

Stop after Sprint 1.2.

Do not begin Sprint 1.3.
