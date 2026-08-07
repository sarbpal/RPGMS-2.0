import { describe, it, expect, beforeEach } from 'vitest';
import { ElectricityApplicationService } from '../electricityService';
import { InMemoryElectricityRepository } from '../../infrastructure/repositories/InMemoryElectricityRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultFinanceRepository } from '../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { BillingApplicationService } from '../../../finance/services/billingService';
import { Meter } from '../../domain/entities/Meter';
import { ElectricityTariff } from '../../domain/valueObjects/ElectricityTariff';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

describe('Sprint FR-6 / OS-1 — ElectricityApplicationService Unit Tests', () => {
  let electricityRepo: InMemoryElectricityRepository;
  let stayRepo: InMemoryStayRepository;
  let accomRepo: InMemoryAccommodationRepository;
  let billingService: BillingApplicationService;
  let electricityService: ElectricityApplicationService;

  beforeEach(() => {
    const testMeter = new Meter({
      id: 'meter-test-01',
      meterNumber: 'MTR-TEST-01',
      flatId: 'flat-101',
      meterType: 'FLAT_SHARED',
      status: 'ACTIVE',
      lastReadingValue: 1000,
      lastReadingDate: '2026-07-01',
    });

    const testTariff = new ElectricityTariff({
      id: 'tariff-test-01',
      name: 'Test Commercial Tariff',
      ratePerUnit: 10,
      fixedCharge: 100,
      effectiveFrom: '2026-01-01',
    });

    const mockFlat: Flat = {
      id: 'flat-101',
      name: 'Flat 101',
      areas: [],
    };

    const stay1 = new Stay({
      id: 'stay-001',
      residentId: 'res-001',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-001'],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    const stay2 = new Stay({
      id: 'stay-002',
      residentId: 'res-002',
      stayType: 'REGULAR',
      status: StayStatus.ON_NOTICE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-002'],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    // Checked out stay should be excluded from utility split
    const checkedOutStay = new Stay({
      id: 'stay-003',
      residentId: 'res-003',
      stayType: 'REGULAR',
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2026-01-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-003'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });

    electricityRepo = new InMemoryElectricityRepository([testMeter], [], [testTariff]);
    stayRepo = new InMemoryStayRepository([stay1, stay2, checkedOutStay]);
    accomRepo = new InMemoryAccommodationRepository([mockFlat]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);

    electricityService = new ElectricityApplicationService(
      electricityRepo,
      stayRepo,
      accomRepo,
      billingService
    );
  });

  it('generates Stage 1 reading preview correctly', () => {
    const preview = electricityService.generateReadingPreview('meter-test-01', 1100, '2026-08');

    expect(preview.success).toBe(true);
    expect(preview.unitsConsumed).toBe(100);
    // Cost: 100 fixed + (100 * 10) = 1100
    expect(preview.totalBillAmount).toBe(1100);
    // 2 eligible active stays (stay-001 ACTIVE, stay-002 ON_NOTICE). Checked-out stay-003 is excluded.
    expect(preview.eligibleStays.length).toBe(2);
    expect(preview.eligibleStays[0].allocatedAmount).toBe(550);
    expect(preview.eligibleStays[1].allocatedAmount).toBe(550);
  });

  it('records meter reading and posts utility bills to Finance domain via billingService', () => {
    const result = electricityService.recordMeterReading(
      'meter-test-01',
      1100,
      '2026-08',
      '2026-08-01',
      'Manager Test'
    );

    expect(result.success).toBe(true);
    expect(result.reading?.unitsConsumed).toBe(100);
    expect(result.billedStaysCount).toBe(2);
    expect(result.allocations.length).toBe(2);

    // Verify meter state updated in repository
    const updatedMeter = electricityRepo.getMeterById('meter-test-01');
    expect(updatedMeter?.lastReadingValue).toBe(1100);

    // Verify Finance domain bills created via billingService
    const bills1 = billingService.getBillsByStayId('stay-001');
    expect(bills1.length).toBeGreaterThan(0);
    const elecBill1 = bills1.find((b) => b.remarks?.includes('Electricity'));
    expect(elecBill1).toBeDefined();
    expect(elecBill1?.totalAmount).toBe(550);
    expect(elecBill1?.billType).toBe('RECURRING_CHARGE');
  });

  it('rejects duplicate period meter reading', () => {
    electricityService.recordMeterReading('meter-test-01', 1100, '2026-08');
    const duplicateRes = electricityService.recordMeterReading('meter-test-01', 1200, '2026-08');

    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.errors[0]).toContain('already recorded');
  });

  it('executes compensating rollback if finance billing fails', () => {
    // Inject custom mock billingService that fails to test compensating rollback
    const failingBillingService = new BillingApplicationService(
      defaultFinanceRepository,
      stayRepo
    );
    failingBillingService.generateRecurringChargeBill = () => ({
      success: false,
      bill: null,
      errors: ['Simulated Finance ledger failure'],
    });

    const testService = new ElectricityApplicationService(
      electricityRepo,
      stayRepo,
      accomRepo,
      failingBillingService
    );

    const rollbackResult = testService.recordMeterReading('meter-test-01', 1100, '2026-08');

    expect(rollbackResult.success).toBe(false);
    expect(rollbackResult.errors[0]).toContain('Rollback executed');

    // Verify reading was deleted and meter lastReadingValue restored
    const readings = electricityRepo.getMeterReadingsByMeterId('meter-test-01');
    expect(readings.length).toBe(0);
    const restoredMeter = electricityRepo.getMeterById('meter-test-01');
    expect(restoredMeter?.lastReadingValue).toBe(1000);
  });

  it('preserves stayId and residentId identities independently in ConsumptionAllocation', () => {
    // Regression Test: Ensures residentId is populated with stay.residentId instead of stay.id
    const distinctStay = new Stay({
      id: 'stay-distinct-999',
      residentId: 'res-distinct-555',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-distinct-01'],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    const customStayRepo = new InMemoryStayRepository([distinctStay]);
    const customBillingService = new BillingApplicationService(defaultFinanceRepository, customStayRepo);
    const customService = new ElectricityApplicationService(
      electricityRepo,
      customStayRepo,
      accomRepo,
      customBillingService
    );

    const result = customService.recordMeterReading('meter-test-01', 1100, '2026-08');

    expect(result.success).toBe(true);
    expect(result.allocations.length).toBe(1);

    const allocation = result.allocations[0];
    expect(allocation.stayId).toBe('stay-distinct-999');
    expect(allocation.residentId).toBe('res-distinct-555');
    expect(allocation.stayId).not.toBe(allocation.residentId);
  });
});
