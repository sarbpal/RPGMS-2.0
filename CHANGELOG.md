# Changelog

All notable changes to this project will be documented here.

---

## Version 0.1.0

### Added

- Project created
- GitHub repository
- VS Code setup
- PROJECT_RULES.md
- Initial Architecture Decisions
- MVP Roadmap

---

### Status

Project Initialization Complete

## Sprint 0.5

### Changed

- Flattened repository structure.
- Removed duplicate package.json.
- Standardized project root.
## Sprint 0.5 – Repository Foundation

### Changed

* Flattened the repository by moving the Vite application from `/app` to the repository root.
* Removed duplicate project configuration (`package.json`, `package-lock.json`, `.gitignore`).
* Reinstalled dependencies using the consolidated project configuration.
* Relocated the application bootstrap to `src/app/App.tsx`.
* Created the initial application architecture folders:

  * `app`
  * `components`
  * `features`
  * `services`
  * `types`
  * `utils`
* Verified the application builds and runs successfully after the migration.

### Notes

* This completes the Repository Foundation phase of Sprint 0.5.
* Internal application architecture will be refined before Sprint 1 begins.
Sprint 0.5 completed.
Repository flattened.
Architecture established.
Application shell started.
# Changelog

All notable changes to RPGMS 2.0 will be documented in this file.

The project follows a sprint-based development process.

---

## Sprint 1.1 – Application Header

**Status:** Completed ✅

### Added

* Application Header component.
* Fixed Material UI AppBar.
* Centered RPGMS 2.0 application title.
* Logo placeholder.
* User avatar placeholder.

### Changed

* Integrated the Header component into the application shell (`App.tsx`).
* Preserved the existing welcome screen beneath the header.

### Quality

* Project builds successfully (`npm run build`).
* Header verified in the browser.
* Code reviewed and accepted.
* No architecture changes.
* No business logic introduced.
* No new dependencies added.
