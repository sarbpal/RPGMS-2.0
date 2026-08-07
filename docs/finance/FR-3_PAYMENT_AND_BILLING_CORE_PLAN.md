# Sprint FR-3 — Payment & Billing Core Stabilization Plan

**Sprint:** FR-3 — Payment & Billing Core Stabilization  
**Document:** `docs/finance/FR-3_PAYMENT_AND_BILLING_CORE_PLAN.md`  
**Status:** Approved Blueprint / Planning  
**Last Updated:** August 2026  

---

## 1. Sprint Objective

The objective of Sprint FR-3 is to stabilize the core **Billing Engine** (`billingService.ts`), **Payment Engine** (`paymentService.ts`), and **Balance Engine** (`balanceEngine.ts`) within the RPGMS 2.0 Finance Domain.

Following the successful completion of **FR-1** (Settlement Core & DI Stabilization) and **FR-2** (Admission & Rent Billing Integration), Sprint **FR-3** focuses on:

1. **Dependency Injection Refactoring**: Refactoring `billingService.ts` and `paymentService.ts` to use constructor dependency injection for `StayRepository` and `FinanceRepository`, eliminating hardcoded `new InMemoryStayRepository()` instantiations.
2. **Comprehensive Vitest Unit Test Suites**: Creating dedicated unit test suites for `billingService`, `paymentService`, and `balanceEngine` to achieve 100% test coverage over payment recording, bill generation, payment allocation, overpayment advance handling, and dynamic balance calculations.
3. **Governance & Registry Synchronization**: Updating `CAPABILITY_REGISTER.md` and `docs/MODULE_STATUS.md` to reflect `FR-2` = Completed and `FR-3` = Active.
4. **ADR Documentation**: Recording **ADR-019 — Payment Processing & Billing Core Stabilization** in `docs/DECISIONS.md`.

---

## 2. Business Problem & Context

- **Current State**:
  - `billingService.ts` instantiates `new InMemoryStayRepository()` directly inside `generateMonthlyRentBill()`. This prevents mock repository injection during unit testing and breaks architectural inversion of control.
  - `paymentService.ts` and `billingService.ts` lack dedicated Vitest unit test suites in `src/features/finance/services/__tests__/`.
  - While integration tests in `AdmissionFinanceIntegration.test.ts` and `settlementService.test.ts` touch billing and settlement, direct unit tests for payment recording, overpayment advance credits, and bill pro-ration/allocation remain missing.
- **Target State**:
  - `BillingApplicationService` and `PaymentApplicationService` receive `FinanceRepository` and `StayRepository` via constructor dependency injection (with optional default parameters for backward compatibility).
  - Dedicated Vitest test files (`billingService.test.ts`, `paymentService.test.ts`, `balanceEngine.test.ts`) verify all payment, billing, and balance derivation logic.
  - All 26 existing test suites remain 100% green.

---

## 3. Governing Documents

- `README.md`
- `ROADMAP.md`
- `PROJECT_RULES.md`
- `CAPABILITY_REGISTER.md`
- `docs/MODULE_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `BUSINESS_RULES.md`
- `BUSINESS_CONSTITUTION.md`
- `DOMAIN_MODEL.md`
- `docs/finance/FINANCE_SPECIFICATION.md`
- `docs/finance/FINANCE_IMPLEMENTATION_PLAN.md`
- `docs/finance/FINANCIAL_POLICIES.md`
- `docs/finance/FINANCIAL_TRANSACTION_TYPES.md`
- `docs/finance/FR-0_FINANCE_ARCHITECTURE_READINESS.md`
- `docs/finance/FR-1_FINANCE_CORE_TEST_STABILIZATION_PLAN.md`
- `docs/finance/FR-2_ADMISSION_FINANCE_INTEGRATION_PLAN.md`

---

## 4. Exact Scope of Sprint FR-3

### Included Scope:
1. **Refactor `BillingApplicationService` (`billingService.ts`)**:
   - Add optional `stayRepository: StayRepository` to `BillingApplicationService` constructor (defaults to `new InMemoryStayRepository()`).
   - Replace internal `new InMemoryStayRepository().findByIdSync(stayId)` with `this.stayRepository.findByIdSync(stayId)` (or `(this.stayRepository as InMemoryStayRepository).findByIdSync(stayId)`).
2. **Refactor `PaymentApplicationService` (`paymentService.ts`)**:
   - Add optional `stayRepository: StayRepository` to `PaymentApplicationService` constructor (defaults to `new InMemoryStayRepository()`).
3. **Create Vitest Unit Test Suites**:
   - `src/features/finance/services/__tests__/billingService.test.ts`
     - Test `createBill()` with line items, issue/due dates, double-entry ledger postings (`Debit ACCOUNTS_RECEIVABLE`, `Credit RENT_REVENUE`).
     - Test `generateMonthlyRentBill()` with duplicate period checks and agreed rent lookup.
     - Test `generateLaundryChargeBill()` and charge bill variants.
     - Test `allocatePaymentToBills()` updating bill status (`UNPAID` -> `PARTIALLY_PAID` -> `PAID`).
   - `src/features/finance/services/__tests__/paymentService.test.ts`
     - Test `recordPayment()` with `CASH` debit vs `BANK` debit routing.
     - Test payment against receivable balance (`Credit ACCOUNTS_RECEIVABLE`).
     - Test overpayment handling (`Credit ADVANCE_CREDIT`).
     - Test allocation across multiple open bills.
     - Test validation failures (invalid stayId, negative/zero payment amounts, missing dates).
   - `src/features/finance/services/__tests__/balanceEngine.test.ts`
     - Test dynamic balance derivations for `ACCOUNTS_RECEIVABLE`, `SECURITY_DEPOSIT_LIABILITY`, `ADVANCE_CREDIT`, `CASH`, `BANK`, `RENT_REVENUE`, `DAMAGE_RECOVERY`.
4. **Governance Updates**:
   - Update `CAPABILITY_REGISTER.md` to reflect `FR-2` = Completed, `FR-3` = Active.
   - Update `docs/MODULE_STATUS.md` to reflect `FR-2` = Completed, `FR-3` = Active.
   - Document **ADR-019 — Payment Processing & Billing Core Stabilization** in `docs/DECISIONS.md`.

### Explicit Non-Scope:
- No UI component modifications or React page changes.
- No Supabase integration or database schema creation.
- No change to existing `AdmissionFinanceService` or `AdmissionCoordinator` contract.

---

## 5. Domain, Application, and Infrastructure Architecture

### Application Layer (`src/features/finance/services/`)

```typescript
export class BillingApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = new InMemoryStayRepository()
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
  }
  ...
}

export class PaymentApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = new InMemoryStayRepository()
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
  }
  ...
}
```

---

## 6. Test Strategy & Verification Plan

### Test Files to Create:
1. `src/features/finance/services/__tests__/billingService.test.ts` (~10 test scenarios)
2. `src/features/finance/services/__tests__/paymentService.test.ts` (~10 test scenarios)
3. `src/features/finance/services/__tests__/balanceEngine.test.ts` (~6 test scenarios)

### Verification Commands:
1. `npm run test` (All 29+ test files / 246+ tests passed)
2. `npx tsc -b` (0 TypeScript errors)
3. `npm run build` (Clean Vite production bundle)

---

## 7. File-by-File Change Plan

| File Path | Action | Description |
|---|:---:|---|
| `docs/finance/FR-3_PAYMENT_AND_BILLING_CORE_PLAN.md` | **Create** | Sprint FR-3 planning blueprint document. |
| `src/features/finance/services/billingService.ts` | **Modify** | Add constructor DI for `StayRepository`; replace internal hardcoded `new InMemoryStayRepository()`. |
| `src/features/finance/services/paymentService.ts` | **Modify** | Add constructor DI for `StayRepository`. |
| `src/features/finance/services/__tests__/billingService.test.ts` | **Create** | Vitest unit test suite for BillingApplicationService. |
| `src/features/finance/services/__tests__/paymentService.test.ts` | **Create** | Vitest unit test suite for PaymentApplicationService. |
| `src/features/finance/services/__tests__/balanceEngine.test.ts` | **Create** | Vitest unit test suite for BalanceEngine. |
| `CAPABILITY_REGISTER.md` | **Modify** | Mark `FR-2` = Completed, `FR-3` = Active. |
| `docs/MODULE_STATUS.md` | **Modify** | Mark `FR-2` = Completed, `FR-3` = Active. |
| `docs/DECISIONS.md` | **Modify** | Document ADR-019. |

---

## 8. Definition of Done

Sprint FR-3 is complete when:
1. `billingService.ts` and `paymentService.ts` receive `StayRepository` via constructor DI.
2. `billingService.test.ts`, `paymentService.test.ts`, and `balanceEngine.test.ts` exist and pass with 100% coverage.
3. All existing test suites (RA-5, RA-7, FR-1, FR-2) pass cleanly.
4. `npx tsc -b` and `npm run build` pass with 0 errors.
5. Governance registers (`CAPABILITY_REGISTER.md`, `MODULE_STATUS.md`, `DECISIONS.md`) are updated.
