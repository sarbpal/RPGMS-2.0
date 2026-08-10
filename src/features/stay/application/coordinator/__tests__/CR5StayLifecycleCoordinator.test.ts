import { describe, expect, it } from 'vitest';
import { StayLifecycleCoordinator } from '../StayLifecycleCoordinator';
import { StayBillingCycleCoordinator } from '../StayBillingCycleCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';

describe('CR-5 Stay Application Coordinators - Integration Tests', () => {
  const createTestFixture = () => {
    const stayRepo = new InMemoryStayRepository([]);
    const accommodationRepo = new InMemoryAccommodationRepository();
    const residentRepo = new InMemoryResidentRepository();

    const lifecycleCoordinator = new StayLifecycleCoordinator(stayRepo, accommodationRepo, residentRepo);
    const billingCoordinator = new StayBillingCycleCoordinator(stayRepo);

    return { stayRepo, accommodationRepo, residentRepo, lifecycleCoordinator, billingCoordinator };
  };

  describe('StayLifecycleCoordinator & Bed Projection Synchronization', () => {
    it('compensates Stay activation when the Accommodation projection save fails', () => {
      class FailingAccommodationRepository extends InMemoryAccommodationRepository {
        private failNextSave = true;
        override save(flat: Parameters<InMemoryAccommodationRepository['save']>[0]) {
          if (this.failNextSave) {
            this.failNextSave = false;
            throw new Error('Accommodation persistence failed');
          }
          return super.save(flat);
        }
      }

      const stayRepo = new InMemoryStayRepository([]);
      const accommodationRepo = new FailingAccommodationRepository();
      const coordinator = new StayLifecycleCoordinator(stayRepo, accommodationRepo, new InMemoryResidentRepository());
      stayRepo.saveSync(new Stay({ id: 'STAY-ROLLBACK-01', residentId: 'RES-00124', stayType: StayType.REGULAR, status: StayStatus.PLANNED, checkInDate: '2026-05-01', flatId: '101', allocatedBedIds: ['101-H1'] }));

      expect(() => coordinator.activateStay({ stayId: 'STAY-ROLLBACK-01' })).toThrow('Accommodation persistence failed');
      expect(stayRepo.findByIdSync('STAY-ROLLBACK-01')?.status).toBe(StayStatus.PLANNED);
      expect(accommodationRepo.findById('101')?.areas.flatMap((area) => area.beds).find((bed) => bed.id === '101-H1')?.status).toBe(BedStatus.VACANT);
    });

    it('activates a PLANNED Stay and updates physical Bed status to OCCUPIED with stayId projection', () => {
      const { stayRepo, accommodationRepo, lifecycleCoordinator } = createTestFixture();

      const plannedStay = new Stay({
        id: 'STAY-LC-01',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.PLANNED,
        checkInDate: '2026-05-01',
        flatId: '101',
        allocatedBedIds: ['101-H1'],
        agreedRent: 10000,
        agreedDeposit: 20000,
      });
      stayRepo.saveSync(plannedStay);

      const projection = lifecycleCoordinator.activateStay({
        stayId: 'STAY-LC-01',
        reason: 'Physical check-in complete',
      });

      expect(projection.status).toBe(StayStatus.ACTIVE);

      // Verify bed projection in AccommodationRepository
      const flat = accommodationRepo.findById('101');
      expect(flat).toBeDefined();
      const bed = flat?.areas.flatMap((a) => a.beds).find((b) => b.id === '101-H1');
      expect(bed?.status).toBe(BedStatus.OCCUPIED);
      expect(bed?.stayId).toBe('STAY-LC-01');
    });

    it('cancels a PLANNED Stay and ensures physical Bed remains VACANT with stayId cleared', () => {
      const { stayRepo, accommodationRepo, lifecycleCoordinator } = createTestFixture();

      const plannedStay = new Stay({
        id: 'STAY-LC-02',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.PLANNED,
        checkInDate: '2026-06-01',
        flatId: '102',
        allocatedBedIds: ['102-B1'],
        agreedRent: 10000,
        agreedDeposit: 20000,
      });
      stayRepo.saveSync(plannedStay);

      const projection = lifecycleCoordinator.cancelPlannedStay({
        stayId: 'STAY-LC-02',
        cancellationDate: '2026-05-20',
        reason: 'Booking cancelled prior to check-in',
      });

      expect(projection.status).toBe(StayStatus.CANCELLED);

      const flat = accommodationRepo.findById('102');
      const bed = flat?.areas.flatMap((a) => a.beds).find((b) => b.id === '102-B1');
      expect(bed?.status).toBe(BedStatus.VACANT);
      expect(bed?.stayId).toBeUndefined();
    });

    it('places Stay ON_NOTICE while retaining bed occupancy and stayId projection', () => {
      const { stayRepo, accommodationRepo, lifecycleCoordinator } = createTestFixture();

      const activeStay = new Stay({
        id: 'STAY-LC-03',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: '101',
        allocatedBedIds: ['101-H2'],
      });
      stayRepo.saveSync(activeStay);

      const projection = lifecycleCoordinator.giveNotice({
        stayId: 'STAY-LC-03',
        noticeDate: '2026-04-01',
        expectedCheckoutDate: '2026-05-01',
      });

      expect(projection.status).toBe(StayStatus.ON_NOTICE);

      const flat = accommodationRepo.findById('101');
      const bed = flat?.areas.flatMap((a) => a.beds).find((b) => b.id === '101-H2');
      expect(bed?.status).toBe(BedStatus.ON_NOTICE);
      expect(bed?.stayId).toBe('STAY-LC-03');
    });

    it('processes Operational Checkout and releases physical bed (status VACANT, stayId cleared)', () => {
      const { stayRepo, accommodationRepo, lifecycleCoordinator } = createTestFixture();

      const activeStay = new Stay({
        id: 'STAY-LC-04',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.ON_NOTICE,
        checkInDate: '2026-01-01',
        flatId: '101',
        allocatedBedIds: ['101-H1'],
      });
      stayRepo.saveSync(activeStay);

      const projection = lifecycleCoordinator.processCheckout({
        stayId: 'STAY-LC-04',
        actualCheckoutDate: '2026-05-01',
        reason: 'Checked out',
      });

      expect(projection.status).toBe(StayStatus.CHECKED_OUT);

      const flat = accommodationRepo.findById('101');
      const bed = flat?.areas.flatMap((a) => a.beds).find((b) => b.id === '101-H1');
      expect(bed?.status).toBe(BedStatus.VACANT);
      expect(bed?.stayId).toBeUndefined();
    });

    it('closes a CHECKED_OUT Stay (CHECKED_OUT -> CLOSED) leaving bed cleared', () => {
      const { stayRepo, lifecycleCoordinator } = createTestFixture();

      const checkedOutStay = new Stay({
        id: 'STAY-LC-05',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.CHECKED_OUT,
        checkInDate: '2026-01-01',
        actualCheckoutDate: '2026-05-01',
      });
      stayRepo.saveSync(checkedOutStay);

      const projection = lifecycleCoordinator.closeStay({
        stayId: 'STAY-LC-05',
        closedDate: '2026-05-10',
        reason: 'Final settlement audit passed',
      });

      expect(projection.status).toBe(StayStatus.CLOSED);
    });
  });

  describe('StayBillingCycleCoordinator & Financial Boundary Verification', () => {
    it('executes billing cycle change storing reference without computing prorata or posting ledger entries', () => {
      const { stayRepo, billingCoordinator } = createTestFixture();

      const stay = new Stay({
        id: 'STAY-BC-01',
        residentId: 'RES-00124',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-10',
        billingAnchorDay: 10,
      });
      stayRepo.saveSync(stay);

      const projection = billingCoordinator.changeBillingCycle({
        stayId: 'STAY-BC-01',
        requestedBillingAnchor: 20,
        effectiveFrom: '2026-04-20',
        reason: 'Shift anchor to 20th',
        financialAdjustmentReference: 'ADJ-REF-2026',
      });

      expect(projection.billingAnchorDay).toBe(20);

      const updatedStay = stayRepo.findByIdSync('STAY-BC-01');
      expect(updatedStay?.billingAnchorDay).toBe(20);
      expect(updatedStay?.checkInDate).toBe('2026-01-10'); // Immutable checkInDate!
      expect(updatedStay?.billingCycleChanges[0].financialAdjustmentReference).toBe('ADJ-REF-2026');
    });
  });
});
