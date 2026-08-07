# Sprint FR-6 / OS-1 — Electricity Operations & Financial Integration Plan

**Project:** RPGMS 2.0  
**Capability Release:** CR-4 — Operational Services  
**Sprint:** FR-6 / OS-1 — Electricity Operations, Metering & Financial Integration  
**Document:** `docs/finance/FR-6_ELECTRICITY_IMPLEMENTATION_PLAN.md`  
**Status:** Official Technical Implementation Plan (Sealed)  
**Date:** August 2026  
**Author:** RPGMS 2.0 Architectural Committee  

---

## 1. Sprint Objective

Following the successful completion and closure of **Capability Release 3 (CR-3 — Financial Operations)** in Sprint FR-5 (HEAD `0b7c9cb`), RPGMS 2.0 is transitioning to **Capability Release 4 (CR-4 — Operational Services)**.

The objective of **Sprint FR-6 / OS-1** is to design and implement the **Electricity Operations & Utility Allocation** capability. This includes:
1. Modeling Electricity meters, periodic meter readings, tariff structures, and flat/stay consumption allocations in `src/features/electricity/domain/`.
2. Implementing `electricityService.ts` to validate meter reading monotonicity, calculate unit consumption and tariff charges, allocate split utility amounts across active flat occupants, and delegate bill generation directly to `billingService.generateRecurringChargeBill()` in the Finance domain.
3. Building an interactive workspace at `src/features/electricity/ElectricityPage.tsx` supported by custom presentation hook `useElectricityWorkspace.ts` and meter reading dialogs.
4. Establishing automated Vitest unit, integration, and E2E test coverage (`meterRules.test.ts`, `electricityService.test.ts`, `ElectricityPage.test.tsx`, `ElectricityE2EJourney.test.ts`).
5. Recording **`ADR-022 — Electricity Consumption Allocation & Financial Ledger Billing Integration`** and updating governance matrices.

---

## 2. Current Repository Baseline

- **Git HEAD**: `0b7c9cb feat(fr-5): integrate finance workspace` on branch `feature/application-shell` (synchronized with `origin/feature/application-shell`, clean working tree).
- **TypeScript Baseline**: `npx tsc -b` passes cleanly with **0 errors**.
- **Production Build**: `npm run build` succeeds cleanly.
- **Automated Test Baseline**: 35 test files, 245 tests passing (**100% green**).
- **Existing Scaffolding**: Feature directory `src/features/electricity/` contains skeleton page `ElectricityPage.tsx` and empty `components`, `hooks`, `services`, `types` folders.

---

## 3. Electricity Domain Model

The Electricity domain will be located in `src/features/electricity/domain/`:

```text
Domain Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                        Electricity Domain                              │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   Meter (Entity)  │ MeterReading      │ ElectricityTariff (ValueObj)   │
│   - id            │ (Entity)          │ - ratePerUnit                  │
│   - meterNumber   │ - id              │ - fixedCharge                  │
│   - flatId        │ - meterId         │ - slabs: TariffSlab[]          │
│   - bedId         │ - readingDate     │                                │
│   - meterType     │ - previousReading │ ConsumptionAllocation          │
│   - status        │ - currentReading  │ (ValueObj)                     │
│                   │ - unitsConsumed   │ - allocatedUnits               │
│                   │                   │ - allocatedAmount              │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### Key Entities & Value Objects:

1. **`Meter` (Entity)**:
   - *Fields*: `id`, `meterNumber`, `flatId`, `bedId?`, `meterType: 'FLAT_SHARED' | 'BED_DEDICATED'`, `status: 'ACTIVE' | 'INACTIVE'`, `lastReadingDate?`, `lastReadingValue`.
   - *Invariants*: Every meter must belong to a valid `flatId`. Shared meters belong to the flat; dedicated meters specify `bedId`.

2. **`MeterReading` (Entity)**:
   - *Fields*: `id`, `meterId`, `readingDate`, `readingPeriod: string` (`YYYY-MM`), `previousReading`, `currentReading`, `unitsConsumed`, `recordedBy`, `createdAt`.
   - *Invariants*: `currentReading >= previousReading` (monotonicity). `unitsConsumed = currentReading - previousReading`.

3. **`ElectricityTariff` (Value Object)**:
   - *Fields*: `ratePerUnit`, `fixedCharge`, `effectiveFrom`, `effectiveUntil?`, `slabs?: TariffSlab[]`.

4. **`ConsumptionAllocation` (Value Object)**:
   - *Fields*: `flatId`, `stayId`, `residentId`, `readingPeriod`, `allocatedUnits`, `allocatedAmount`, `allocationMethod: 'EQUAL_SPLIT' | 'OCCUPANCY_WEIGHTED'`.

---

## 4. Meter Reading Workflow

```text
Meter Reading Entry (UI / Service)
   │
   ▼
1. Fetch Meter & Previous Reading (lastReadingValue)
   │
   ▼
2. Validate Monotonicity (currentReading >= previousReading)
   │
   ▼
3. Check Duplicate Period Reading (1 reading per period per meter)
   │
   ▼
4. Stage 1 Preview Calculation (Units = Current - Previous ➔ Apply Tariff ➔ Flat Split Preview)
   │
   ▼
5. User Confirmation / Execution
   │
   ▼
6. Save MeterReading & Update Meter lastReadingValue
   │
   ▼
7. Delegate Billing to Finance (billingService.generateRecurringChargeBill)
```

---

## 5. Consumption & Tariff Calculation

- **Consumption Calculation**: `unitsConsumed = currentReading - previousReading`.
- **Monotonicity Rule**: If `currentReading < previousReading`, submission is rejected with error `"Current reading (${currentReading}) cannot be less than previous reading (${previousReading})."`.
- **Tariff Slab Calculation**:
  - Base formula: `totalCost = fixedCharge + (unitsConsumed * ratePerUnit)`.
  - When slab structures exist (e.g. 0-100 units @ ₹6, 101-300 units @ ₹8), consumption is allocated progressively across slabs.
- **Zero Consumption**: If `unitsConsumed === 0`, `totalCost = fixedCharge`.

---

## 6. Occupancy & Utility Allocation Algorithm

### Occupant Qualification Rules:
1. **Eligible Stays**: Stays associated with the target `flatId` whose operational status is `ACTIVE` or `ON_NOTICE` during the reading period.
2. **Excluded Stays**: Stays that were `CHECKED_OUT` or `FINANCIALLY_CLOSED` prior to the start of the reading period.
3. **Split Calculation**:
   $$\text{allocatedAmountPerStay} = \frac{\text{totalFlatElectricityBill}}{\text{activeOccupantCount}}$$
4. **Rounding Remainder**: Remainder paise (e.g., ₹100 divided by 3 = ₹33.33 each, leaving ₹0.01) is added to the first stay allocation to guarantee the sum of allocated amounts equals `totalFlatElectricityBill`.

### Open Business Decision Handling (Vacant Bed Utility Costs):
- *Open Question*: *"Should unallocated utility portions (from vacant beds) be posted to a Property Expense account or held in suspense?"*
- *Resolution*: In the MVP architecture, active occupants in a flat share the total flat utility bill evenly (`POLICY_RESIDENTS_SHARE_VACANT_COST`). This satisfies financial delegation without creating unverified expense ledger accounts.

---

## 7. Finance Integration Contract

Electricity MUST respect the Finance domain boundary. It will NOT manipulate `financeStorage` or construct `LedgerEntry` objects directly.

```text
Electricity Application Service
   │
   ▼
billingService.generateRecurringChargeBill(
   stayId,
   readingPeriod,
   'Electricity',
   `Electricity Bill - Flat ${flatName} Meter #${meterNumber} (${readingPeriod})`,
   allocatedAmount
)
   │
   ▼
Finance Domain (billingService & ledgerService)
   │
   ├─ Creates Bill (billType: 'RECURRING_CHARGE', category: 'UTILITIES')
   └─ Posts Ledger Entries:
      - Debit: ACCOUNTS_RECEIVABLE
      - Credit: UTILITIES (Revenue / Utility Recovery)
```

---

## 8. Transaction & Rollback Strategy

- If meter reading creation succeeds but `billingService.generateRecurringChargeBill()` fails for any occupant in a flat split, the transaction executes a compensating rollback (deleting created `MeterReading` and reverting `Meter.lastReadingValue`), keeping the system consistent (aligned with **ADR-018**).

---

## 9. Repository & Dependency Injection Design

### Infrastructure Repository:
- `InMemoryElectricityRepository` backed by `electricityStorage.ts` (persisting meters, meter readings, and tariffs).

### Application Service DI:
```typescript
export class ElectricityApplicationService {
  constructor(
    private electricityRepo: ElectricityRepository = defaultElectricityRepository,
    private stayRepo: StayRepository = defaultStayRepository,
    private accommodationRepo: AccommodationRepository = defaultAccommodationRepository,
    private billingService: BillingApplicationService = defaultBillingService
  ) {}
}
```

---

## 10. UI / Workspace Design

### Workspace Page & Components (`src/features/electricity/`):
1. **`ElectricityPage.tsx`**: Main property-wide electricity workspace displaying meter cards, flat reading summary table, and reading entry actions.
2. **`useElectricityWorkspace.ts`**: Presentation hook managing meter lists, selected flat meters, preview calculations, and reactive refresh.
3. **`RecordMeterReadingModal.tsx`**: Form modal for selecting a flat meter, entering current reading, validating input in real time, and displaying Stage 1 allocation preview before confirmation.

---

## 11. Testing Strategy

1. **`meterRules.test.ts`**: Tests reading monotonicity (`currentReading >= previousReading`), negative reading rejection, and tariff slab calculations.
2. **`electricityService.test.ts`**: Tests meter reading ingestion, flat active stay resolution, split allocation calculation, and `billingService` integration.
3. **`ElectricityPage.test.tsx`**: Tests workspace rendering, meter card display, modal opening/closing, and reading submission.
4. **`ElectricityE2EJourney.test.ts`**: End-to-end integration test verifying meter creation -> reading recording -> split allocation -> Finance bill creation -> ledger receivable posting.

---

## 12. Governance & ADR Requirements

- **ADR Requirement**: **`ADR-022 — Electricity Consumption Allocation & Financial Ledger Billing Integration`** will be documented post-implementation in `docs/DECISIONS.md`.
- **Governance Updates**: Post-implementation update of `CAPABILITY_REGISTER.md` (CR-4 Operational Services ➔ `In Progress`) and `docs/MODULE_STATUS.md` (Electricity Module ➔ `🟢 MVP Complete`).

---

## 13. Implementation Sequence

```text
Phase 1: Domain Entities, Value Objects & Monotonicity Rules
   ├─ Create `src/features/electricity/domain/entities/Meter.ts`
   ├─ Create `src/features/electricity/domain/entities/MeterReading.ts`
   ├─ Create `src/features/electricity/domain/valueObjects/ElectricityTariff.ts`
   └─ Create `src/features/electricity/domain/rules/meterRules.ts`

Phase 2: Storage Infrastructure & Repository
   ├─ Create `src/features/electricity/storage/electricityStorage.ts`
   └─ Create `src/features/electricity/infrastructure/repositories/InMemoryElectricityRepository.ts`

Phase 3: Application Service & Finance Integration
   └─ Create `src/features/electricity/services/electricityService.ts`

Phase 4: Presentation Hook & UI Workspace
   ├─ Create `src/features/electricity/hooks/useElectricityWorkspace.ts`
   ├─ Create `src/features/electricity/components/RecordMeterReadingModal.tsx`
   ├─ Update `src/features/electricity/ElectricityPage.tsx`
   └─ Update `src/features/electricity/index.ts`

Phase 5: Automated Test Suite Creation
   ├─ Create `src/features/electricity/domain/rules/__tests__/meterRules.test.ts`
   ├─ Create `src/features/electricity/services/__tests__/electricityService.test.ts`
   ├─ Create `src/features/electricity/pages/__tests__/ElectricityPage.test.tsx`
   └─ Create `src/features/electricity/__tests__/ElectricityE2EJourney.test.ts`

Phase 6: Governance & ADR Documentation
   ├─ Update `CAPABILITY_REGISTER.md`
   ├─ Update `docs/MODULE_STATUS.md`
   └─ Record `ADR-022` in `docs/DECISIONS.md`
```

---

## 14. Sprint Scope Boundary

### IN SCOPE:
- Meter entities, readings, tariff calculations, and monotonicity rules.
- Flat/stay utility split allocation engine.
- Integration with `billingService.generateRecurringChargeBill()`.
- Interactive `ElectricityPage.tsx` workspace & `RecordMeterReadingModal.tsx`.
- Automated Vitest unit, integration, and E2E test suite.
- ADR-022 and governance updates.

### OUT OF SCOPE:
- Maintenance complaint tickets (deferred to **Sprint OS-2**).
- Automated IoT smart meter hardware API integrations.
- PostgreSQL / Supabase production database migration.

### DELIVERABLES:
- `src/features/electricity/domain/*`
- `src/features/electricity/infrastructure/*`
- `src/features/electricity/services/electricityService.ts`
- `src/features/electricity/hooks/useElectricityWorkspace.ts`
- `src/features/electricity/components/RecordMeterReadingModal.tsx`
- `src/features/electricity/ElectricityPage.tsx`
- Test suites in `src/features/electricity/**/__tests__/`

---

## 15. Open Business Decisions

1. **Vacant Bed Utility Cost Sharing**:
   - *Decision*: In MVP default implementation, active occupants in a flat share the total flat utility bill evenly (`POLICY_RESIDENTS_SHARE_VACANT_COST`), preserving financial delegation without creating unverified expense ledger accounts.

---

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|:---:|---|
| **Non-Monotonic Readings** | Medium | Domain rule `meterRules.ts` rejects any reading where `currentReading < previousReading`. |
| **Partial Allocation Ledger Failure** | High | Application service wraps allocation loop in compensating rollback (reverting meter reading if billing fails). |
| **Split Rounding Remainder** | Low | Remainder paise added to first stay allocation so sum equals total flat bill. |

---

## 17. Final Readiness Decision

### **`READY FOR IMPLEMENTATION`**

---

## 18. Git Verification

- **Current Branch**: `feature/application-shell`
- **HEAD Commit**: `0b7c9cb feat(fr-5): integrate finance workspace`
- **Working Tree Status**: Clean (0 production source files modified, 0 existing docs modified, 0 tests modified, 0 staged/committed/pushed).
