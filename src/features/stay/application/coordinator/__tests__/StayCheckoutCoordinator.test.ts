import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StayCheckoutCoordinator } from '../StayCheckoutCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { ResidentLifecycleService } from '../../../../resident/services/ResidentLifecycleService';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../../resident/domain/valueObjects/ResidentStatus';
import type { Settlement } from '../../../../finance/domain/entities/Settlement';
import { financeStorage } from '../../../../finance/storage/financeStorage';

describe('StayCheckoutCoordinator Comprehensive Suite (FC-05 Operational Checkout)', () => {
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let residentRepo: InMemoryResidentRepository;
  let financeRepo: InMemoryFinanceRepository;
  let residentLifecycleService: ResidentLifecycleService;
  let coordinator: StayCheckoutCoordinator;

  const sampleFlat101: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: '1st Floor Double Sharing',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.ON_NOTICE, residentName: 'Rohan Sharma', defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleResident: Resident = {
    id: 'res-000001',
    residentCode: 'R000001',
    fullName: 'Rohan Sharma',
    mobileNumber: '9876543210',
    email: 'rohan@example.com',
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const createSampleStay = (status: StayStatus = StayStatus.ACTIVE) =>
    new Stay({
      id: 'stay-000001',
      residentId: 'res-000001',
      stayType: StayType.REGULAR,
      status,
      checkInDate: '2026-01-01',
      flatId: 'flat-101',
      allocatedBedIds: ['bed-101-a'],
      agreedRent: 8000,
      agreedDeposit: 6500,
    });

  const createSettlement = (stayId: string): Settlement => ({
    id: `stl-${stayId}`,
    stayId,
    settlementNumber: 'STL-202605-0001',
    settlementDate: '2026-05-01',
    settlementType: 'CHECKOUT',
    previewSnapshot: {} as any,
    finalAmount: 0,
    outcome: 'BALANCED_NO_ACTION',
    paymentMethod: 'BANK_TRANSFER',
    remarks: 'Settlement confirmed',
    ledgerReferences: [],
    createdBy: 'TEST',
    status: 'SETTLED',
    createdAt: '2026-05-01T00:00:00Z',
  });

  beforeEach(() => {
    financeStorage.saveStoredSettlements([]);
    stayRepo = new InMemoryStayRepository([createSampleStay()]);
    accommodationRepo = new InMemoryAccommodationRepository([JSON.parse(JSON.stringify(sampleFlat101))]);
    residentRepo = new InMemoryResidentRepository([sampleResident]);
    financeRepo = new InMemoryFinanceRepository();
    residentLifecycleService = new ResidentLifecycleService(residentRepo, stayRepo, financeRepo);
    coordinator = new StayCheckoutCoordinator(stayRepo, accommodationRepo, residentRepo, residentLifecycleService);
  });

  describe('1. Checkout Success', () => {
    it('1. ACTIVE -> CHECKED_OUT: completes operational checkout directly from ACTIVE state', () => {
      const projection = coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
        reason: 'Immediate departure',
      });

      expect(projection.status).toBe(StayStatus.CHECKED_OUT);
      expect(projection.actualCheckoutDate).toBe('2026-05-01');
      expect(projection.activeBedIds).toEqual([]);

      const persisted = stayRepo.findByIdSync('stay-000001');
      expect(persisted?.status).toBe(StayStatus.CHECKED_OUT);
      expect(persisted?.activeBedAllocations).toHaveLength(0);
      expect(persisted?.actualCheckoutDate).toBe('2026-05-01');

      // Physical bed released to VACANT
      const flat = accommodationRepo.findById('flat-101');
      const bed = flat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
      expect(bed?.status).toBe(BedStatus.VACANT);
      expect(bed?.residentName).toBeUndefined();
      expect(bed?.stayId).toBeUndefined();
    });

    it('2. ON_NOTICE -> CHECKED_OUT: completes operational checkout from ON_NOTICE state', () => {
      const stay = stayRepo.findByIdSync('stay-000001')!;
      stay.giveNotice({ noticeDate: '2026-04-01', expectedCheckoutDate: '2026-05-01' });
      stayRepo.saveSync(stay);

      const projection = coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
        reason: 'End of notice period',
      });

      expect(projection.status).toBe(StayStatus.CHECKED_OUT);
      expect(projection.actualCheckoutDate).toBe('2026-05-01');

      const flat = accommodationRepo.findById('flat-101');
      const bed = flat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
      expect(bed?.status).toBe(BedStatus.VACANT);
    });

    it('3. Allocation history preserved in Stay aggregate', () => {
      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
      });

      const persisted = stayRepo.findByIdSync('stay-000001')!;
      expect(persisted.bedAllocations.length).toBeGreaterThan(0);
      expect(persisted.bedAllocations[0].status).toBe('RELEASED');
      expect(persisted.bedAllocations[0].allocatedUntil).toBe('2026-05-01');
    });
  });

  describe('2. Invalid States', () => {
    it('throws when stay does not exist', () => {
      expect(() =>
        coordinator.processCheckout({
          stayId: 'unknown-stay',
          actualCheckoutDate: '2026-05-01',
        })
      ).toThrow('Stay with ID unknown-stay not found');
    });

    it('rejects checkout on PLANNED stay', () => {
      const stay = new Stay({ ...createSampleStay(StayStatus.PLANNED) as any, status: StayStatus.PLANNED });
      stayRepo.saveSync(stay);

      expect(() =>
        coordinator.processCheckout({
          stayId: 'stay-000001',
          actualCheckoutDate: '2026-05-01',
        })
      ).toThrow('Only ACTIVE or ON_NOTICE Stays may be operationally checked out. Current status is PLANNED');
    });

    it('rejects checkout on already CHECKED_OUT stay', () => {
      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
      });

      expect(() =>
        coordinator.processCheckout({
          stayId: 'stay-000001',
          actualCheckoutDate: '2026-05-02',
        })
      ).toThrow('Only ACTIVE or ON_NOTICE Stays may be operationally checked out. Current status is CHECKED_OUT');
    });

    it('rejects checkout when actualCheckoutDate precedes checkInDate', () => {
      expect(() =>
        coordinator.processCheckout({
          stayId: 'stay-000001',
          actualCheckoutDate: '2025-12-31',
        })
      ).toThrow('cannot precede check-in date');
    });
  });

  describe('3. Multi-Bed Checkout', () => {
    it('releases all active beds when a stay occupies multiple beds', () => {
      const multiBedFlat: Flat = {
        id: 'flat-102',
        name: '102',
        floor: '1',
        description: 'Multi-Bed Flat',
        areas: [
          {
            id: 'area-102',
            name: 'Bedroom',
            defaultRent: 12000,
            defaultDeposit: 10000,
            beds: [
              { id: 'bed-102-a', name: '102-A', status: BedStatus.OCCUPIED, residentName: 'Rohan', defaultRent: 6000, defaultDeposit: 5000 },
              { id: 'bed-102-b', name: '102-B', status: BedStatus.OCCUPIED, residentName: 'Rohan', defaultRent: 6000, defaultDeposit: 5000 },
            ],
          },
        ],
      };
      accommodationRepo.save(multiBedFlat);

      const multiBedStay = new Stay({
        id: 'stay-multi',
        residentId: 'res-000001',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'flat-102',
        allocatedBedIds: ['bed-102-a', 'bed-102-b'],
        agreedRent: 12000,
        agreedDeposit: 10000,
      });
      stayRepo.saveSync(multiBedStay);

      coordinator.processCheckout({
        stayId: 'stay-multi',
        actualCheckoutDate: '2026-05-01',
      });

      const flatAfter = accommodationRepo.findById('flat-102')!;
      expect(flatAfter.areas[0].beds[0].status).toBe(BedStatus.VACANT);
      expect(flatAfter.areas[0].beds[1].status).toBe(BedStatus.VACANT);
    });
  });

  describe('4. Identifier Normalization', () => {
    it('normalizes Flat ID (FLAT-101 vs 101) and Bed ID (BED-101-A vs 101-A)', () => {
      const normalizedFlat: Flat = {
        id: '101',
        name: '101',
        floor: '1',
        description: 'Test Flat',
        areas: [
          {
            id: 'area-1',
            name: 'Room',
            defaultRent: 8000,
            defaultDeposit: 6500,
            beds: [
              { id: '101-A', name: '101-A', status: BedStatus.OCCUPIED, residentName: 'Rohan', defaultRent: 8000, defaultDeposit: 6500 },
            ],
          },
        ],
      };
      accommodationRepo.save(normalizedFlat);

      const stay = new Stay({
        id: 'stay-prefix',
        residentId: 'res-000001',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-101-A'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });
      stayRepo.saveSync(stay);

      coordinator.processCheckout({
        stayId: 'stay-prefix',
        actualCheckoutDate: '2026-05-01',
      });

      const flat = accommodationRepo.findById('101');
      expect(flat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });
  });

  describe('5. Failure Compensation & Rollback', () => {
    it('reverts Stay state if accommodation persistence throws an error', () => {
      const failingAccommodationRepo = {
        findById: vi.fn().mockReturnValue(sampleFlat101),
        save: vi.fn().mockImplementation(() => {
          throw new Error('Accommodation DB Write Failure');
        }),
      };

      const failingCoordinator = new StayCheckoutCoordinator(
        stayRepo,
        failingAccommodationRepo as any,
        residentRepo,
        residentLifecycleService
      );

      expect(() =>
        failingCoordinator.processCheckout({
          stayId: 'stay-000001',
          actualCheckoutDate: '2026-05-01',
        })
      ).toThrow('Accommodation DB Write Failure');

      // Stay is cleanly rolled back to ACTIVE
      const stayAfter = stayRepo.findByIdSync('stay-000001')!;
      expect(stayAfter.status).toBe(StayStatus.ACTIVE);
      expect(stayAfter.activeBedAllocations.length).toBe(1);
    });
  });

  describe('6. Concurrency Protection', () => {
    it('rejects re-entrant checkout attempt for the same stay while lock is held', () => {
      // Manually set lock
      (StayCheckoutCoordinator as any).activeStayLocks.add('stay-000001');

      try {
        expect(() =>
          coordinator.processCheckout({
            stayId: 'stay-000001',
            actualCheckoutDate: '2026-05-01',
          })
        ).toThrow('Operational checkout is currently in progress for stay stay-000001');
      } finally {
        (StayCheckoutCoordinator as any).activeStayLocks.delete('stay-000001');
      }
    });
  });

  describe('7. Resident Lifecycle Integration (Alumni Invariant)', () => {
    it('leaves Resident ACTIVE when checkout completes on unsettled stay', () => {
      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
      });

      const res = residentRepo.getByIdSync('res-000001')!;
      expect(res.status).toBe(ResidentStatus.ACTIVE);
    });

    it('transitions Resident to ALUMNI when checkout completes on previously settled stay', () => {
      // Pre-seed settlement for this stay
      financeRepo.saveSettlement(createSettlement('stay-000001'));

      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
      });

      const res = residentRepo.getByIdSync('res-000001')!;
      expect(res.status).toBe(ResidentStatus.ALUMNI);
    });
  });

  describe('8. Financial Isolation', () => {
    it('creates ZERO ledger entries, ZERO settlements, and ZERO deposit mutations during checkout', () => {
      const initialLedgerCount = financeRepo.getLedgerEntries().length;
      const initialSettlementCount = financeRepo.getSettlements().length;
      const initialDepositCount = financeRepo.getDepositTransactions().length;

      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2026-05-01',
      });

      expect(financeRepo.getLedgerEntries().length).toBe(initialLedgerCount);
      expect(financeRepo.getSettlements().length).toBe(initialSettlementCount);
      expect(financeRepo.getDepositTransactions().length).toBe(initialDepositCount);
    });
  });
});
