import { describe, it, expect, beforeEach } from 'vitest';
import { StayCommercialCoordinator } from '../StayCommercialCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';

describe('StayCommercialCoordinator Integration Suite (CR-3.4)', () => {
  let stayRepo: InMemoryStayRepository;
  let coordinator: StayCommercialCoordinator;

  const sampleStay = new Stay({
    id: 'stay-000001',
    residentId: 'res-000001',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '2026-01-01',
    flatId: 'flat-101',
    allocatedBedIds: ['bed-101-a'],
    agreedRent: 8000,
    agreedDeposit: 6500,
  });

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository([sampleStay]);
    coordinator = new StayCommercialCoordinator(stayRepo);
  });

  describe('reviseRent', () => {
    it('orchestrates rent revision through Stay aggregate and persists updated StayRepository', () => {
      const projection = coordinator.reviseRent({
        stayId: 'stay-000001',
        newRent: 8800,
        effectiveDate: '2026-04-01',
        reason: 'Annual 10% rent escalation',
      });

      expect(projection.currentRent).toBe(8800);
      expect(projection.currentDeposit).toBe(6500);

      const persistedStay = stayRepo.findByIdSync('stay-000001');
      expect(persistedStay?.agreedRent).toBe(8800);
      expect(persistedStay?.commercialAgreements).toHaveLength(2);
      expect(persistedStay?.commercialAgreements[0].status).toBe('HISTORICAL');
      expect(persistedStay?.commercialAgreements[1].status).toBe('ACTIVE');
      expect(persistedStay?.commercialAgreements[1].rent).toBe(8800);
    });

    it('throws error if target Stay does not exist', () => {
      expect(() =>
        coordinator.reviseRent({
          stayId: 'non-existent-stay',
          newRent: 9000,
          effectiveDate: '2026-04-01',
          reason: 'Rent escalation',
        })
      ).toThrow('Stay with ID non-existent-stay not found');
    });
  });

  describe('reviseDeposit', () => {
    it('orchestrates deposit revision through Stay aggregate and persists updated StayRepository', () => {
      const projection = coordinator.reviseDeposit({
        stayId: 'stay-000001',
        newDeposit: 8000,
        effectiveDate: '2026-04-01',
        reason: 'Deposit top-up for AC room upgrade',
      });

      expect(projection.currentDeposit).toBe(8000);
      expect(projection.currentRent).toBe(8000);

      const persistedStay = stayRepo.findByIdSync('stay-000001');
      expect(persistedStay?.agreedDeposit).toBe(8000);
      expect(persistedStay?.commercialAgreements[1].securityDeposit).toBe(8000);
    });
  });

  describe('reviseCommercialTerms', () => {
    it('orchestrates simultaneous rent and deposit revision through Stay aggregate and persists StayRepository', () => {
      const projection = coordinator.reviseCommercialTerms({
        stayId: 'stay-000001',
        newRent: 10000,
        newDeposit: 10000,
        effectiveDate: '2026-05-01',
        reason: 'Room type upgrade to Executive Suite',
      });

      expect(projection.currentRent).toBe(10000);
      expect(projection.currentDeposit).toBe(10000);

      const persistedStay = stayRepo.findByIdSync('stay-000001');
      expect(persistedStay?.agreedRent).toBe(10000);
      expect(persistedStay?.agreedDeposit).toBe(10000);
    });

    it('rolls back StayRepository on invalid input exception', () => {
      expect(() =>
        coordinator.reviseCommercialTerms({
          stayId: 'stay-000001',
          newRent: -500,
          newDeposit: 8000,
          effectiveDate: '2026-05-01',
          reason: 'Invalid negative rent',
        })
      ).toThrow('Revised monthly rent must be a positive number greater than 0');

      const persistedStay = stayRepo.findByIdSync('stay-000001');
      expect(persistedStay?.agreedRent).toBe(8000);
      expect(persistedStay?.commercialAgreements).toHaveLength(1);
    });
  });
});
