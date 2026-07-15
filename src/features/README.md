# Features

This project follows a feature-first architecture.

Each feature is self-contained and owns its:

- Components
- Hooks
- Services
- Types

Example:

features/
    residents/
        components/
        hooks/
        services/
        types/
        ResidentsPage.tsx
        index.ts

Features should not directly depend on each other.

Reusable code should be moved to:

features/shared/

Application-level components belong to:

src/components/