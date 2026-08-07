# FR-1 — Finance Core & Test Stabilization Plan

**Project:** RPGMS 2.0  
**Capability Release:** CR-3 — Financial Operations (Sprint FR-1)  
**Document:** `docs/finance/FR-1_FINANCE_CORE_TEST_STABILIZATION_PLAN.md`  
**Status:** Planning Document (Awaiting Approval)  
**Date:** 07 August 2026  
**Author:** RPGMS 2.0 Lead Architect & Engineering Team  

---

## 1. Objective

The objective of **Sprint FR-1 (Finance Core & Test Stabilization)** is to refactor `SettlementApplicationService` (`settlementService.ts`) to use explicit constructor dependency injection for `StayRepository` and build a comprehensive, isolated Vitest unit test suite (`settlementService.test.ts`) covering all checkout settlement preview, confirmation, calculation, balance clearing, double-entry ledger postings, and error handling scenarios.

FR-1 is strictly a **refactoring and stabilization sprint**. It does **NOT** add new UI features, alter business rules, or modify database models.

---

## 2. FR-0 Conditions Being Addressed

This plan directly addresses Condition 2 from the **FR-0 Finance Architecture & Readiness Report** (`docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md`):

- **Condition 2**: Refactor `settlementService.ts` to eliminate internal `new InMemoryStayRepository()` instantiations, accept `StayRepository` via constructor dependency injection, and create a comprehensive Vitest test suite achieving 100% logic coverage across settlement workflows.

*(Note: Condition 1 — Governance Register Reconciliation — is documented in Section 14 as a documentation update. Condition 3 — Admission → Finance Hook — is analyzed in Section 13 as a target for Sprint FR-2).*

---

## 3. Current settlementService Architecture

Inspection of `src/features/finance/services/settlementService.ts` reveals:

```typescript
export class SettlementApplicationService {
  private repository: FinanceRepository;

  constructor(repository: FinanceRepository = defaultFinanceRepository) {
    this.repository = repository;
  }
  ...
  public generateSettlementPreview(stayId: string, damageDeductions = 0, remarks = ''): GeneratePreviewResult {
    ...
    // Internal instantiation!
    const stay = new InMemoryStayRepository().findByIdSync(stayId);
    ...
  }

  public confirmSettlement(previewPayload: SettlementPreview, ...): ConfirmSettlementResult {
    ...
    // Internal instantiation!
    const stayRepo = new InMemoryStayRepository();
    const currentStay = stayRepo.findByIdSync(stayId);
    ...
  }
}
```

### Architectural Deficiencies:
1. **Hidden Coupling & Storage Isolation Failure**: Instantiating `new InMemoryStayRepository()` inside method execution creates isolated, short-lived repository instances that do not share state with test fixtures or other application services.
2. **Untestability**: Unit tests cannot mock or populate `StayRepository` data because `settlementService` instantiates a fresh empty repository on every call.
3. **Violation of Clean Architecture**: Application services must depend on domain abstractions (`StayRepository`) injected via their constructor, not on concrete infrastructure classes (`InMemoryStayRepository`) instantiated inside method bodies.

---

## 4. Current Dependency Graph

```text
Current (Hardcoded Infrastructure Instantiation):
   SettlementApplicationService
        ├──> FinanceRepository (Injected via constructor, defaults to defaultFinanceRepository)
        ├──> ledgerService (Singleton import)
        ├──> balanceEngine (Singleton import)
        └──> InMemoryStayRepository (HARDCODED inside generateSettlementPreview & confirmSettlement) ❌

Proposed (Clean Dependency Injection):
   SettlementApplicationService
        ├──> FinanceRepository (Injected via constructor, defaults to defaultFinanceRepository)
        ├──> StayRepository (Injected via constructor, defaults to new InMemoryStayRepository()) ✅
        ├──> ledgerService (Singleton import / injectable)
        └──> balanceEngine (Singleton import)
```

---

## 5. Existing DI Patterns in RPGMS 2.0

RPGMS 2.0 uses a consistent, standard dependency-injection pattern across all application coordinators and services (e.g. `AdmissionCoordinator.ts`, `AccommodationWorkspaceCoordinator.ts`, `StayCheckoutCoordinator.ts`):

```typescript
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';

export class ServiceClass {
  private stayRepository: StayRepository;

  constructor(
    financeRepo: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = new InMemoryStayRepository()
  ) {
    this.repository = financeRepo;
    this.stayRepository = stayRepository;
  }
}
```

### Pattern Characteristics:
- Interfaces are imported from domain (`StayRepository`).
- Default parameters instantiate `InMemoryStayRepository` for production convenience.
- Unit tests pass custom mock or pre-populated repositories (`new InMemoryStayRepository([sampleStay])`) directly into the constructor.

---

## 6. Proposed Dependency Injection Design

Refactor `SettlementApplicationService` in `src/features/finance/services/settlementService.ts`:

```typescript
import type { StayRepository } from '../../stay';
import { InMemoryStayRepository } from '../../stay';

export class SettlementApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = new InMemoryStayRepository()
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
  }
```

### Internal Method Adjustments:
In `generateSettlementPreview`:
- Replace `const stay = new InMemoryStayRepository().findByIdSync(stayId);` with `const stay = this.stayRepository.findByIdSync ? this.stayRepository.findByIdSync(stayId) : await this.stayRepository.findById(stayId);` (or synchronous resolution as per `InMemoryStayRepository`).

In `confirmSettlement`:
- Replace `const stayRepo = new InMemoryStayRepository(); const currentStay = stayRepo.findByIdSync(stayId);` with `const currentStay = this.stayRepository.findByIdSync ? this.stayRepository.findByIdSync(stayId) : await this.stayRepository.findById(stayId);` and save using `this.stayRepository.saveSync(currentStay)` or `await this.stayRepository.save(currentStay)`.

---

## 7. Required Production Code Changes

Only **1 production file** will be modified:

### `src/features/finance/services/settlementService.ts`
- Add `private stayRepository: StayRepository;` field.
- Update constructor signature to accept `stayRepository: StayRepository = new InMemoryStayRepository()`.
- Replace internal `new InMemoryStayRepository()` calls with `this.stayRepository`.

---

## 8. Required Caller Changes

Inspection of existing callers (`useStayFinance.ts`, `reportingService.ts`, `timelineService.ts`, `FinanceWorkspaceCoordinator.ts`) shows that they interact with `settlementService` via:
- The exported singleton `export const settlementService = new SettlementApplicationService();`
- Default constructor arguments `new SettlementApplicationService()`.

Because the constructor provides default parameter fallbacks (`stayRepository: StayRepository = new InMemoryStayRepository()`), **ZERO existing callers require signature or code changes**. All existing callers remain 100% backward-compatible.

---

## 9. Required Test Changes

We will create **1 new test file**:

### `src/features/finance/services/__tests__/settlementService.test.ts`
This file will define an isolated Vitest test suite that instantiates `SettlementApplicationService` with fresh test repositories before every test (`beforeEach`).

---

## 10. Detailed Test Matrix

The new test suite `settlementService.test.ts` will cover the following 18 test scenarios across 5 categories:

| Category | Test Scenario ID | Description & Verification |
|---|---|---|
| **Stage 1 Preview: Validations** | `TC-STL-01` | Rejects preview if `stayId` is empty or whitespace. |
| | `TC-STL-02` | Rejects preview if `damageDeductions` is negative or non-numeric. |
| | `TC-STL-03` | Rejects preview if target `Stay` is not found in `StayRepository`. |
| | `TC-STL-04` | Rejects preview if target `Stay` is already in `CHECKED_OUT` operational state. |
| | `TC-STL-05` | Rejects preview if target `Stay` has already been settled (`Settlement` record exists). |
| **Stage 1 Preview: Calculations** | `TC-STL-06` | Calculates `HOSTEL_REFUNDS_RESIDENT` preview when deposit > (receivables + damage). |
| | `TC-STL-07` | Calculates `RESIDENT_PAYS_HOSTEL` preview when receivables + damage > deposit. |
| | `TC-STL-08` | Calculates `ZERO_BALANCE` preview when deposit exactly equals receivables + damage. |
| | `TC-STL-09` | Confirms Stage 1 preview is strictly READ-ONLY (no ledger entries posted, no repository writes). |
| **Stage 2 Confirmation: Ledger Postings** | `TC-STL-10` | Posts double-entry entries clearing `SECURITY_DEPOSIT_LIABILITY`, `ADVANCE_CREDIT`, `ACCOUNTS_RECEIVABLE`. |
| | `TC-STL-11` | Posts `DAMAGE_RECOVERY` Credit when damage deductions are applied. |
| | `TC-STL-12` | Posts `CASH` / `BANK` asset movements matching chosen `PaymentMethod`. |
| | `TC-STL-13` | Verifies double-entry debit-credit equality (`sum(debit) === sum(credit)`) for confirmed settlement. |
| **Stage 2 Confirmation: Stay State** | `TC-STL-14` | Transitions operational `Stay` status from `ACTIVE` or `ON_NOTICE` to `CHECKED_OUT` on confirmation. |
| | `TC-STL-15` | Saves `Settlement` entity with snapshot, generated settlement number (`STL-YYYYMM-XXXX`), and status `SETTLED`. |
| **Edge Cases & Duplicate Governance** | `TC-STL-16` | Prevents duplicate confirmation if a `Settlement` already exists for the `stayId`. |
| | `TC-STL-17` | Rejects confirmation if preview payload is null or invalid. |
| | `TC-STL-18` | Verifies non-mutation of Resident identity record or physical Accommodation structure during settlement. |

---

## 11. Existing Business Behavior to Preserve

- **Read-only Stage 1 Preview**: `generateSettlementPreview` must make zero storage modifications or state mutations.
- **Two-Stage Workflow**: Preview must precede confirmation.
- **Settlement Outcomes**: `HOSTEL_REFUNDS_RESIDENT`, `RESIDENT_PAYS_HOSTEL`, `ZERO_BALANCE`.
- **Double-Entry Rules**: Deposit clearing, receivable clearing, advance clearing, damage recovery income, liquid asset movement.
- **Operational Checkout Synchronization**: Confirming settlement updates `Stay` status to `CHECKED_OUT` if not already checked out.

---

## 12. Potential Regression Risks

| Risk | Severity | Mitigation |
|---|:---:|---|
| **Breaking Default Singleton Callers** | Low | Retain default constructor arguments in `SettlementApplicationService`. |
| **Repository Method Type Mismatch** | Low | Ensure `InMemoryStayRepository` methods (`findByIdSync`, `saveSync`, `findById`, `save`) match `StayRepository` interface expectations. |

---

## 13. Admission → Finance Hook Assessment

### Analysis:
- **Requirement**: When an admission is confirmed (Walk-in or Reserved), the system must generate:
  1. Security Deposit Liability posting (`CASH`/`BANK` Debit, `SECURITY_DEPOSIT_LIABILITY` Credit).
  2. First Month Rent Bill posting (`ACCOUNTS_RECEIVABLE` Debit, `RENT_REVENUE` Credit).
- **Location**: `AdmissionCoordinator.confirmReservedAdmission` and `confirmWalkInAdmission` in `src/features/admission/application/coordinator/AdmissionCoordinator.ts`.
- **Sprint Placement**: This integration involves modifying `AdmissionCoordinator.ts` and `AdmissionCoordinator.test.ts`. To keep FR-1 strictly focused on **Finance Core & Test Stabilization**, the Admission → Finance Hook is placed in **Sprint FR-2 (Admission & Rent Billing Integration)**.

---

## 14. Governance Register Reconciliation Assessment

Following completion of CR-2 (Sprints RA-1 through RA-7 and New Reservation Restoration), governance files need to be reconciled:

1. **`CAPABILITY_REGISTER.md`**:
   - Update Capability Release CR-2 (Reservation & Admission Management) from `In Progress` / `Planned` to `Functional` / `Maturity Level 3`.
   - Re-index CR-3 to `Financial Operations` to align with `ROADMAP.md` v3.0.
2. **`docs/MODULE_STATUS.md`**:
   - Update Reservation & Admission module status from `Planned` to `🟢 MVP Complete` / `State: Frozen`.
   - Update Finance module state from `Future Capability` to `🔵 Active Development` / `State: Next Capability (CR-3)`.

*These documentation updates will be executed as part of governance housekeeping in Sprint FR-1.*

---

## 15. Files Expected to Change

| File Path | Reason for Change |
|---|---|
| `src/features/finance/services/settlementService.ts` | Add constructor dependency injection for `StayRepository` and replace internal `new InMemoryStayRepository()` calls. |
| `src/features/finance/services/__tests__/settlementService.test.ts` | **NEW FILE**: Vitest test suite covering settlement preview, confirmation, double-entry postings, and error handling. |
| `CAPABILITY_REGISTER.md` | Reconcile governance register to reflect CR-2 completion and CR-3 activation. |
| `docs/MODULE_STATUS.md` | Reconcile module status document to mark Reservation & Admission complete and Finance active. |

---

## 16. Files Expected NOT to Change

- `src/features/finance/domain/**` (Entities, value objects, domain rules remain unchanged).
- `src/features/finance/components/**` & `pages/**` (UI components remain untouched).
- `src/features/admission/**` (Admission coordinator untouched until Sprint FR-2).
- `src/features/stay/**` (Stay aggregate untouched).
- `src/features/resident/**` (Resident aggregate untouched).

---

## 17. Implementation Sequence

```text
Step 1: Refactor settlementService.ts constructor & repository references
   ↓
Step 2: Create src/features/finance/services/__tests__/settlementService.test.ts
   ↓
Step 3: Execute Vitest test suite (npm run test / vitest run)
   ↓
Step 4: Execute TypeScript typecheck & production build (npm run build)
   ↓
Step 5: Update CAPABILITY_REGISTER.md & docs/MODULE_STATUS.md governance files
   ↓
Step 6: Final Verification & Audit
```

---

## 18. Verification Plan

1. **Unit Test Verification**: Run `npx vitest run src/features/finance/services/__tests__/settlementService.test.ts` and verify 100% test pass rate.
2. **Full Test Suite Verification**: Run `npm test` to confirm zero regressions across all 180+ existing test cases.
3. **Typecheck & Build**: Run `npm run build` (`tsc -b && vite build`) to confirm zero TypeScript compilation errors and a clean bundle build.

---

## 19. Commit Strategy

Single clean commit:
`CR-3 / FR-1 — Refactor settlementService DI and add unit test suite`

---

## 20. Open Decisions Requiring Approval

1. **Approval of DI Refactoring Plan**: Confirm refactoring `settlementService.ts` to accept `StayRepository` in its constructor.
2. **Approval of Test Matrix**: Confirm the 18 test scenarios in Section 10.
3. **Approval of Sprint Boundary**: Confirm deferring the Admission → Finance Hook to Sprint FR-2.

---

## FR-1 STATUS: `READY FOR IMPLEMENTATION`

### Justification:
The dependency injection issue in `settlementService.ts` is clearly isolated, the required constructor refactoring pattern is established across the codebase, the test suite is fully defined, zero caller breaking changes are required, and the sprint scope is strictly bounded.

---

### Session Verification Summary

1. **Files Inspected**:
   - `src/features/finance/services/settlementService.ts`
   - `src/features/stay/domain/interfaces/StayRepository.ts`
   - `src/features/admission/application/coordinator/AdmissionCoordinator.ts`
   - `src/features/admission/application/coordinator/__tests__/AdmissionCoordinator.walkin.test.ts`
   - `CAPABILITY_REGISTER.md`, `docs/MODULE_STATUS.md`, `ROADMAP.md`
2. **Files Created**:
   - `docs/finance/FR-1_FINANCE_CORE_TEST_STABILIZATION_PLAN.md`
3. **Files Modified**:
   - **`0` production source code files modified.**
   - **`0` documentation files modified.**
4. **Confirmation**:
   - **CONFIRMED**: Zero production source code files were created, edited, or modified.
   - **CONFIRMED**: Zero existing documentation files were edited or modified.
5. **Git Status**:
   - Branch: `feature/application-shell` (clean, synchronized with `origin/feature/application-shell`, 2 untracked planning docs in `docs/finance/`).
6. **Recommended Next Step**:
   - Review and approve `docs/finance/FR-1_FINANCE_CORE_TEST_STABILIZATION_PLAN.md` and authorize execution of **Sprint FR-1**.
