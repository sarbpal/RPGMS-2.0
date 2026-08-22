import { describe, it, expect, beforeEach } from 'vitest';
import { ResidentLifecycleService } from '../ResidentLifecycleService';
import { InMemoryResidentRepository } from '../../infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryFinanceRepository } from '../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import type { Resident } from '../../domain/entities/Resident';
import { ResidentStatus } from '../../domain/valueObjects/ResidentStatus';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { StayType } from '../../../stay/domain/valueObjects/StayType';
import type { Settlement } from '../../../finance/domain/entities/Settlement';

import { financeStorage } from '../../../finance/storage/financeStorage';

describe('ResidentLifecycleService Unit Test Suite (FC-05 Invariants)', () => {
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let financeRepo: InMemoryFinanceRepository;
  let service: ResidentLifecycleService;

  const sampleResident: Resident = {
    id: 'res-101',
    residentCode: 'R-101',
    fullName: 'Aditya Verma',
    mobileNumber: '9876543210',
    email: 'aditya@example.com',
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const createStay = (id: string, residentId: string, status: StayStatus) =>
    new Stay({
      id,
      residentId,
      stayType: StayType.REGULAR,
      status,
      checkInDate: '2026-01-01',
      actualCheckoutDate: status === StayStatus.CHECKED_OUT || status === StayStatus.CLOSED ? '2026-06-30' : undefined,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-101-a'],
      agreedRent: 8000,
      agreedDeposit: 6500,
    });

  const createSettlement = (id: string, stayId: string): Settlement => ({
    id,
    stayId,
    settlementNumber: `STL-202606-0001`,
    settlementDate: '2026-06-30',
    settlementType: 'CHECKOUT',
    previewSnapshot: {} as any,
    finalAmount: 0,
    outcome: 'BALANCED_NO_ACTION',
    paymentMethod: 'BANK_TRANSFER',
    remarks: 'Full settlement',
    ledgerReferences: [],
    createdBy: 'TEST',
    status: 'SETTLED',
    createdAt: '2026-06-30T00:00:00Z',
  });

  beforeEach(() => {
    financeStorage.saveStoredSettlements([]);
    residentRepo = new InMemoryResidentRepository([sampleResident]);
    stayRepo = new InMemoryStayRepository();
    financeRepo = new InMemoryFinanceRepository();
    service = new ResidentLifecycleService(residentRepo, stayRepo, financeRepo);
  });

  it('CASE A: Settlement first on ACTIVE stay leaves resident ACTIVE; subsequent checkout converts to ALUMNI', () => {
    const stay = createStay('stay-1', 'res-101', StayStatus.ACTIVE);
    stayRepo.saveSync(stay);

    // 1. Settlement confirmed while stay is still ACTIVE
    financeRepo.saveSettlement(createSettlement('stl-1', 'stay-1'));
    let res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ACTIVE);

    // 2. Operational Checkout subsequently completed
    stay.processCheckout({ actualCheckoutDate: '2026-06-30' });
    stayRepo.saveSync(stay);

    res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ALUMNI);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ALUMNI);
  });

  it('CASE B: Checkout first on ACTIVE stay leaves resident ACTIVE; subsequent settlement converts to ALUMNI', () => {
    const stay = createStay('stay-1', 'res-101', StayStatus.ACTIVE);
    stayRepo.saveSync(stay);

    // 1. Operational Checkout completed (settlement pending)
    stay.processCheckout({ actualCheckoutDate: '2026-06-30' });
    stayRepo.saveSync(stay);

    let res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ACTIVE);

    // 2. Settlement subsequently confirmed
    financeRepo.saveSettlement(createSettlement('stl-1', 'stay-1'));
    res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ALUMNI);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ALUMNI);
  });

  it('CASE C: Multi-Stay Resident with one settled checkout and another active stay MUST remain ACTIVE', () => {
    const stay1 = createStay('stay-1', 'res-101', StayStatus.CHECKED_OUT);
    const stay2 = createStay('stay-2', 'res-101', StayStatus.ACTIVE);
    stayRepo.saveSync(stay1);
    stayRepo.saveSync(stay2);

    financeRepo.saveSettlement(createSettlement('stl-1', 'stay-1'));

    // Stay 1 is settled and checked out, but Stay 2 is ACTIVE
    let res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ACTIVE);

    // Now checkout and settle stay2
    stay2.processCheckout({ actualCheckoutDate: '2026-08-31' });
    stayRepo.saveSync(stay2);
    financeRepo.saveSettlement(createSettlement('stl-2', 'stay-2'));

    res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ALUMNI);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ALUMNI);
  });

  it('CASE D: Financial settlement only on ACTIVE stay preserves ACTIVE status', () => {
    const stay = createStay('stay-1', 'res-101', StayStatus.ACTIVE);
    stayRepo.saveSync(stay);
    financeRepo.saveSettlement(createSettlement('stl-1', 'stay-1'));

    const res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
  });

  it('CASE E: Checkout only without financial settlement preserves ACTIVE status', () => {
    const stay = createStay('stay-1', 'res-101', StayStatus.CHECKED_OUT);
    stayRepo.saveSync(stay);

    const res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
  });

  it('Readmission: Returning Alumni admitted to new ACTIVE stay transitions status back to ACTIVE', () => {
    // Resident was ALUMNI
    const alumniResident: Resident = { ...sampleResident, status: ResidentStatus.ALUMNI };
    residentRepo.saveSync(alumniResident);

    const stay1 = createStay('stay-1', 'res-101', StayStatus.CHECKED_OUT);
    stayRepo.saveSync(stay1);
    financeRepo.saveSettlement(createSettlement('stl-1', 'stay-1'));

    // Admitted to new stay
    const stay2 = createStay('stay-2', 'res-101', StayStatus.ACTIVE);
    stayRepo.saveSync(stay2);

    const res = service.evaluateAndSyncResidentStatus('res-101');
    expect(res?.status).toBe(ResidentStatus.ACTIVE);
    expect(residentRepo.getByIdSync('res-101')?.status).toBe(ResidentStatus.ACTIVE);
  });
});
