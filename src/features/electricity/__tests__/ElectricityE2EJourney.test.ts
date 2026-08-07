import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryElectricityRepository } from '../infrastructure/repositories/InMemoryElectricityRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../finance/storage/financeStorage';
import { ElectricityApplicationService } from '../services/electricityService';
import { BillingApplicationService } from '../../finance/services/billingService';
import { balanceEngine } from '../../finance/services/balanceEngine';
import { Meter } from '../domain/entities/Meter';
import { ElectricityTariff } from '../domain/valueObjects/ElectricityTariff';
import { Stay } from '../../stay/domain/entities/Stay';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';
import type { Flat } from '../../accommodation/domain/entities/Flat';

describe('Sprint FR-6 / OS-1 — End-to-End Electricity Utility Allocation Journey', () => {
  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('executes complete 5-step electricity lifecycle: Reading Ingestion -> Tariff Slab Calculation -> Occupant Split Allocation -> Finance Utility Bill -> Balanced Ledger Receivable Posting', () => {
    // ----------------------------------------------------
    // STEP 1: Setup Meter, Tariff, Accommodation & Stays
    // ----------------------------------------------------
    const meter = new Meter({
      id: 'meter-e2e-101',
      meterNumber: 'MTR-FLAT-101',
      flatId: 'flat-101',
      meterType: 'FLAT_SHARED',
      status: 'ACTIVE',
      lastReadingValue: 500,
      lastReadingDate: '2026-07-01',
    });

    const tariff = new ElectricityTariff({
      id: 'tariff-e2e',
      name: 'Commercial Slab Tariff',
      ratePerUnit: 8.5,
      fixedCharge: 100,
      effectiveFrom: '2026-01-01',
      slabs: [
        { fromUnits: 0, toUnits: 100, ratePerUnit: 6 },
        { fromUnits: 100, toUnits: 300, ratePerUnit: 8 },
        { fromUnits: 300, toUnits: null, ratePerUnit: 10 },
      ],
    });

    const flat: Flat = {
      id: 'flat-101',
      name: 'Flat 101 (DeLuxe)',
      floor: '1',
      areas: [],
    };

    const stayA = new Stay({
      id: 'stay-e2e-a',
      residentId: 'res-e2e-a',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-101-a'],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    const stayB = new Stay({
      id: 'stay-e2e-b',
      residentId: 'res-e2e-b',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-101-b'],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    const elecRepo = new InMemoryElectricityRepository([meter], [], [tariff]);
    const stayRepo = new InMemoryStayRepository([stayA, stayB]);
    const accomRepo = new InMemoryAccommodationRepository([flat]);
    const billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);

    const electricityService = new ElectricityApplicationService(
      elecRepo,
      stayRepo,
      accomRepo,
      billingService
    );

    // ----------------------------------------------------
    // STEP 2: Execute Stage 1 Preview Calculation
    // ----------------------------------------------------
    // Ingest reading: 500 -> 750 (250 units consumed)
    // Tariff calculation:
    // Fixed charge: 100
    // Slabs: 0-100 = 100 * 6 = 600
    //        100-250 (150 units) = 150 * 8 = 1200
    // Total flat bill = 100 + 600 + 1200 = 1900.
    // 2 active occupants (stayA & stayB) -> 1900 / 2 = 950 each.
    const preview = electricityService.generateReadingPreview('meter-e2e-101', 750, '2026-08');
    expect(preview.success).toBe(true);
    expect(preview.unitsConsumed).toBe(250);
    expect(preview.totalBillAmount).toBe(1900);
    expect(preview.eligibleStays.length).toBe(2);
    expect(preview.eligibleStays[0].allocatedAmount).toBe(950);
    expect(preview.eligibleStays[1].allocatedAmount).toBe(950);

    // ----------------------------------------------------
    // STEP 3: Execute Reading Ingestion & Utility Billing
    // ----------------------------------------------------
    const recordResult = electricityService.recordMeterReading(
      'meter-e2e-101',
      750,
      '2026-08',
      '2026-08-05',
      'Property Supervisor',
      'August monthly reading'
    );

    expect(recordResult.success).toBe(true);
    expect(recordResult.billedStaysCount).toBe(2);

    // ----------------------------------------------------
    // STEP 4: Verify Repository State Updates
    // ----------------------------------------------------
    const updatedMeter = elecRepo.getMeterById('meter-e2e-101');
    expect(updatedMeter?.lastReadingValue).toBe(750);
    expect(updatedMeter?.lastReadingDate).toBe('2026-08-05');

    // ----------------------------------------------------
    // STEP 5: Verify Finance Domain Ledger Postings & Balances
    // ----------------------------------------------------
    const billsA = billingService.getBillsByStayId('stay-e2e-a');
    expect(billsA.length).toBe(1);
    expect(billsA[0].totalAmount).toBe(950);
    expect(billsA[0].billType).toBe('RECURRING_CHARGE');

    const balancesA = balanceEngine.calculateStayBalances('stay-e2e-a');
    expect(balancesA.receivableBalance).toBe(950);

    const balancesB = balanceEngine.calculateStayBalances('stay-e2e-b');
    expect(balancesB.receivableBalance).toBe(950);
  });
});
