# Sprint 1.3 – Application Shell Completion

**Sprint:** 1.3
**Status:** Planned
**Priority:** High
**Module:** Application Shell

---

## Objective

Create a reusable MainLayout component that becomes the standard application shell for RPGMS.

---

## Scope

- Create MainLayout.tsx.
- Compose the existing Header and Sidebar inside MainLayout.
- Accept page content using React children.
- Refactor App.tsx to use MainLayout.
- Preserve the existing welcome screen.

---

## Out of Scope

Do NOT implement:

- Routing
- Authentication
- Business logic
- Dashboard functionality
- Responsive navigation
- Theme changes

---

## Design Requirements

MainLayout shall:

- Use the existing Header.
- Use the existing Sidebar.
- Render page content through `children`.
- Preserve the current visual appearance.
- Introduce no behavioural changes.

---

## Files

Create or modify only:

- src/components/layout/MainLayout.tsx
- src/components/layout/index.ts (if required)
- src/app/App.tsx

Do not modify Header.tsx.

Do not modify Sidebar.tsx unless absolutely necessary.

---

## Acceptance Criteria

Sprint 1.3 is complete only if:

- MainLayout exists.
- Header renders through MainLayout.
- Sidebar renders through MainLayout.
- App.tsx becomes a thin composition layer.
- UI is visually unchanged.
- Build succeeds.
- No unrelated files modified.

---

## Verification

- Run `npm run build`.
- Verify the application in the browser.
- Confirm that the appearance matches Sprint 1.2.

---

## Output Required

Return:

1. Files modified.
2. Summary of implementation.
3. Build status.

Stop after Sprint 1.3.

---

# Completion

**Status:** Completed ✅

**Completed On:** 15 July 2026

## Result

- Reusable `MainLayout` implemented.
- `Header` moved into `MainLayout`.
- `Sidebar` moved into `MainLayout`.
- `App.tsx` refactored into a thin composition layer.
- Existing welcome screen preserved.
- Visual appearance unchanged.

## Verification

- ✅ `npm run build` passed.
- ✅ Browser tested.
- ✅ Code reviewed.
- ✅ Architecture reviewed.
- ✅ Sprint accepted.

## Files Modified

- `src/components/layout/MainLayout.tsx`
- `src/app/App.tsx`

## Milestone Achieved

🏛️ **Application Shell Complete**

The RPGMS application shell is now considered stable.

Future business pages shall render inside `MainLayout`.

No feature shall directly implement or render the application shell.