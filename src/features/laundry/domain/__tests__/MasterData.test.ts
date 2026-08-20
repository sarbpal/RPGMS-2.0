import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryItem } from '../entities/LaundryItem';
import { LaundryService } from '../entities/LaundryService';
import { LaundryChargeRate } from '../entities/LaundryChargeRate';
import { RateSnapshot } from '../valueObjects/RateSnapshot';
import { InMemoryLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';

describe('Laundry Master Data Domain (L-01 Foundation)', () => {
  describe('LaundryItem Entity', () => {
    it('successfully constructs a valid LaundryItem', () => {
      const item = new LaundryItem({
        id: 'LITM-001',
        code: 'shirt',
        name: 'Formal Shirt',
        category: 'CLOTHING',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      expect(item.id).toBe('LITM-001');
      expect(item.code).toBe('SHIRT'); // uppercase normalized
      expect(item.name).toBe('Formal Shirt');
      expect(item.category).toBe('CLOTHING');
      expect(item.isActive).toBe(true);
      expect(item.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(item.toJSON()).toEqual({
        id: 'LITM-001',
        code: 'SHIRT',
        name: 'Formal Shirt',
        category: 'CLOTHING',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: undefined,
      });
    });

    it('rejects empty id, code, name, or createdAt', () => {
      expect(
        () =>
          new LaundryItem({
            id: '',
            code: 'SHIRT',
            name: 'Shirt',
            category: 'CLOTHING',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryItem ID cannot be empty.');

      expect(
        () =>
          new LaundryItem({
            id: 'LITM-001',
            code: '   ',
            name: 'Shirt',
            category: 'CLOTHING',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryItem code cannot be empty.');

      expect(
        () =>
          new LaundryItem({
            id: 'LITM-001',
            code: 'SHIRT',
            name: '',
            category: 'CLOTHING',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryItem name cannot be empty.');

      expect(
        () =>
          new LaundryItem({
            id: 'LITM-001',
            code: 'SHIRT',
            name: 'Shirt',
            category: 'CLOTHING',
            isActive: true,
            createdAt: '',
          })
      ).toThrow('LaundryItem createdAt cannot be empty.');
    });

    it('validates allowed categories strictly (CLOTHING, BEDDING, OTHER)', () => {
      expect(
        () =>
          new LaundryItem({
            id: 'LITM-001',
            code: 'SHIRT',
            name: 'Shirt',
            category: 'INVALID' as any,
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('Invalid LaundryItem category: INVALID. Must be CLOTHING, BEDDING, or OTHER.');

      const clothing = new LaundryItem({
        id: 'LITM-001',
        code: 'SHIRT',
        name: 'Shirt',
        category: 'CLOTHING',
        isActive: true,
        createdAt: '2026-01-01',
      });
      const bedding = new LaundryItem({
        id: 'LITM-002',
        code: 'BEDSHEET',
        name: 'Bedsheet',
        category: 'BEDDING',
        isActive: true,
        createdAt: '2026-01-01',
      });
      const other = new LaundryItem({
        id: 'LITM-003',
        code: 'TOWEL',
        name: 'Towel',
        category: 'OTHER',
        isActive: true,
        createdAt: '2026-01-01',
      });

      expect(clothing.category).toBe('CLOTHING');
      expect(bedding.category).toBe('BEDDING');
      expect(other.category).toBe('OTHER');
    });
  });

  describe('LaundryService Entity', () => {
    it('successfully constructs a valid LaundryService', () => {
      const service = new LaundryService({
        id: 'LSRV-001',
        code: 'cleaning',
        name: 'Cleaning (Wash & Fold)',
        description: 'Standard washing and drying',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      expect(service.id).toBe('LSRV-001');
      expect(service.code).toBe('CLEANING'); // uppercase normalized
      expect(service.name).toBe('Cleaning (Wash & Fold)');
      expect(service.description).toBe('Standard washing and drying');
      expect(service.isActive).toBe(true);
      expect(service.toJSON()).toEqual({
        id: 'LSRV-001',
        code: 'CLEANING',
        name: 'Cleaning (Wash & Fold)',
        description: 'Standard washing and drying',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: undefined,
      });
    });

    it('rejects empty id, code, name, or createdAt', () => {
      expect(
        () =>
          new LaundryService({
            id: '',
            code: 'CLEANING',
            name: 'Cleaning',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryService ID cannot be empty.');

      expect(
        () =>
          new LaundryService({
            id: 'LSRV-001',
            code: ' ',
            name: 'Cleaning',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryService code cannot be empty.');

      expect(
        () =>
          new LaundryService({
            id: 'LSRV-001',
            code: 'CLEANING',
            name: '',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryService name cannot be empty.');

      expect(
        () =>
          new LaundryService({
            id: 'LSRV-001',
            code: 'CLEANING',
            name: 'Cleaning',
            isActive: true,
            createdAt: '',
          })
      ).toThrow('LaundryService createdAt cannot be empty.');
    });
  });

  describe('LaundryChargeRate Entity', () => {
    it('successfully constructs a valid LaundryChargeRate', () => {
      const rate = new LaundryChargeRate({
        id: 'LRATE-001',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 20,
        effectiveFrom: '2026-01-01',
        effectiveUntil: '2026-12-31',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      expect(rate.id).toBe('LRATE-001');
      expect(rate.itemId).toBe('LITM-001');
      expect(rate.serviceId).toBe('LSRV-001');
      expect(rate.rate).toBe(20);
      expect(rate.effectiveFrom).toBe('2026-01-01');
      expect(rate.effectiveUntil).toBe('2026-12-31');
      expect(rate.isActive).toBe(true);
    });

    it('rejects invalid inputs (negative rate, NaN, empty foreign keys, effectiveUntil < effectiveFrom)', () => {
      expect(
        () =>
          new LaundryChargeRate({
            id: 'LRATE-001',
            itemId: 'LITM-001',
            serviceId: 'LSRV-001',
            rate: -5,
            effectiveFrom: '2026-01-01',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryChargeRate rate must be a non-negative number.');

      expect(
        () =>
          new LaundryChargeRate({
            id: 'LRATE-001',
            itemId: '',
            serviceId: 'LSRV-001',
            rate: 20,
            effectiveFrom: '2026-01-01',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryChargeRate itemId cannot be empty.');

      expect(
        () =>
          new LaundryChargeRate({
            id: 'LRATE-001',
            itemId: 'LITM-001',
            serviceId: '',
            rate: 20,
            effectiveFrom: '2026-01-01',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('LaundryChargeRate serviceId cannot be empty.');

      expect(
        () =>
          new LaundryChargeRate({
            id: 'LRATE-001',
            itemId: 'LITM-001',
            serviceId: 'LSRV-001',
            rate: 20,
            effectiveFrom: '2026-06-01',
            effectiveUntil: '2026-01-01',
            isActive: true,
            createdAt: '2026-01-01',
          })
      ).toThrow('effectiveUntil (2026-01-01) cannot be before effectiveFrom (2026-06-01).');
    });

    it('correctly checks isEffectiveAt across dates', () => {
      const activeBoundedRate = new LaundryChargeRate({
        id: 'LRATE-001',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 20,
        effectiveFrom: '2026-01-01',
        effectiveUntil: '2026-06-30',
        isActive: true,
        createdAt: '2026-01-01',
      });

      expect(activeBoundedRate.isEffectiveAt('2025-12-31')).toBe(false); // before
      expect(activeBoundedRate.isEffectiveAt('2026-01-01')).toBe(true); // start boundary
      expect(activeBoundedRate.isEffectiveAt('2026-03-15T12:00:00.000Z')).toBe(true); // inside
      expect(activeBoundedRate.isEffectiveAt('2026-06-30')).toBe(true); // end boundary
      expect(activeBoundedRate.isEffectiveAt('2026-07-01')).toBe(false); // after

      const openEndedRate = new LaundryChargeRate({
        id: 'LRATE-002',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 25,
        effectiveFrom: '2026-07-01',
        isActive: true,
        createdAt: '2026-01-01',
      });

      expect(openEndedRate.isEffectiveAt('2026-06-30')).toBe(false);
      expect(openEndedRate.isEffectiveAt('2026-07-01')).toBe(true);
      expect(openEndedRate.isEffectiveAt('2028-12-31')).toBe(true);

      const inactiveRate = new LaundryChargeRate({
        id: 'LRATE-003',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 20,
        effectiveFrom: '2026-01-01',
        isActive: false, // inactive
        createdAt: '2026-01-01',
      });

      expect(inactiveRate.isEffectiveAt('2026-03-15')).toBe(false);
    });
  });

  describe('RateSnapshot Immutable Value Object', () => {
    it('successfully constructs a RateSnapshot with valid parameters', () => {
      const snapshot = new RateSnapshot({
        unitRate: 20,
        capturedAt: '2026-08-20T10:00:00.000Z',
        chargeMasterRateId: 'LRATE-001',
        currency: 'INR',
      });

      expect(snapshot.unitRate).toBe(20);
      expect(snapshot.capturedAt).toBe('2026-08-20T10:00:00.000Z');
      expect(snapshot.chargeMasterRateId).toBe('LRATE-001');
      expect(snapshot.currency).toBe('INR');
      expect(snapshot.toJSON()).toEqual({
        unitRate: 20,
        capturedAt: '2026-08-20T10:00:00.000Z',
        chargeMasterRateId: 'LRATE-001',
        currency: 'INR',
      });
    });

    it('rejects invalid construction values', () => {
      expect(
        () =>
          new RateSnapshot({
            unitRate: -10,
            capturedAt: '2026-08-20',
            chargeMasterRateId: 'LRATE-001',
          })
      ).toThrow('RateSnapshot unitRate must be a non-negative number.');

      expect(
        () =>
          new RateSnapshot({
            unitRate: 20,
            capturedAt: '',
            chargeMasterRateId: 'LRATE-001',
          })
      ).toThrow('RateSnapshot capturedAt cannot be empty.');

      expect(
        () =>
          new RateSnapshot({
            unitRate: 20,
            capturedAt: '2026-08-20',
            chargeMasterRateId: '',
          })
      ).toThrow('RateSnapshot chargeMasterRateId cannot be empty.');
    });

    it('proves strict runtime immutability (Object.isFrozen)', () => {
      const snapshot = new RateSnapshot({
        unitRate: 20,
        capturedAt: '2026-08-20T10:00:00.000Z',
        chargeMasterRateId: 'LRATE-001',
      });

      expect(Object.isFrozen(snapshot)).toBe(true);

      // Attempting mutation in strict mode throws TypeError
      expect(() => {
        (snapshot as any).unitRate = 50;
      }).toThrow();

      expect(() => {
        (snapshot as any).currency = 'USD';
      }).toThrow();

      expect(snapshot.unitRate).toBe(20);
    });

    it('demonstrates historical pricing protection: master pricing changes do NOT alter captured RateSnapshot', () => {
      const repo = new InMemoryLaundryMasterRepository();

      // Original rate lookup at collection time
      const initialRate = repo.getEffectiveRate('LITM-001', 'LSRV-001', '2026-01-15');
      expect(initialRate?.rate).toBe(20);

      // Freeze into snapshot
      const snapshot = new RateSnapshot({
        unitRate: initialRate!.rate,
        capturedAt: '2026-01-15T10:00:00.000Z',
        chargeMasterRateId: initialRate!.id,
      });

      // Master pricing is later updated in repository to ₹30
      repo.saveRate(
        new LaundryChargeRate({
          id: initialRate!.id,
          itemId: initialRate!.itemId,
          serviceId: initialRate!.serviceId,
          rate: 30, // rate increased
          effectiveFrom: initialRate!.effectiveFrom,
          isActive: true,
          createdAt: initialRate!.createdAt,
          updatedAt: '2026-02-01T00:00:00.000Z',
        })
      );

      // The repository returns the new rate
      const updatedRate = repo.getEffectiveRate('LITM-001', 'LSRV-001', '2026-02-05');
      expect(updatedRate?.rate).toBe(30);

      // The historical snapshot remains permanently 20
      expect(snapshot.unitRate).toBe(20);
    });
  });

  describe('InMemoryLaundryMasterRepository', () => {
    let repo: InMemoryLaundryMasterRepository;

    beforeEach(() => {
      repo = new InMemoryLaundryMasterRepository();
    });

    it('initializes with default seed data', () => {
      const items = repo.getItems();
      const services = repo.getServices();
      const rates = repo.getRates();

      expect(items.length).toBeGreaterThanOrEqual(7);
      expect(services.length).toBeGreaterThanOrEqual(3);
      expect(rates.length).toBeGreaterThanOrEqual(15);
    });

    it('retrieves items by ID, Code, and active status', () => {
      const shirt = repo.getItemById('LITM-001');
      expect(shirt).not.toBeNull();
      expect(shirt?.code).toBe('SHIRT');

      const byCode = repo.getItemByCode('shirt'); // case insensitive
      expect(byCode?.id).toBe('LITM-001');

      // Test active filtering
      const inactiveItem = new LaundryItem({
        id: 'LITM-999',
        code: 'OBSOLETE',
        name: 'Obsolete Garment',
        category: 'OTHER',
        isActive: false,
        createdAt: '2026-01-01',
      });
      repo.saveItem(inactiveItem);

      expect(repo.getItems(false).find((i) => i.id === 'LITM-999')).toBeUndefined();
      expect(repo.getItems(true).find((i) => i.id === 'LITM-999')).toBeDefined();
    });

    it('retrieves services by ID, Code, and active status', () => {
      const cleaning = repo.getServiceById('LSRV-001');
      expect(cleaning?.code).toBe('CLEANING');

      const byCode = repo.getServiceByCode('ironing');
      expect(byCode?.id).toBe('LSRV-002');

      const inactiveService = new LaundryService({
        id: 'LSRV-999',
        code: 'SPECIAL',
        name: 'Special Polish',
        isActive: false,
        createdAt: '2026-01-01',
      });
      repo.saveService(inactiveService);

      expect(repo.getServices(false).find((s) => s.id === 'LSRV-999')).toBeUndefined();
      expect(repo.getServices(true).find((s) => s.id === 'LSRV-999')).toBeDefined();
    });

    it('retrieves effective rates accurately by item, service, and date', () => {
      // Shirt + Cleaning = ₹20
      const rate1 = repo.getEffectiveRate('LITM-001', 'LSRV-001', '2026-01-10');
      expect(rate1).not.toBeNull();
      expect(rate1?.rate).toBe(20);

      // Shirt + Dry Cleaning = ₹80
      const rate2 = repo.getEffectiveRate('LITM-001', 'LSRV-003', '2026-01-10');
      expect(rate2).not.toBeNull();
      expect(rate2?.rate).toBe(80);

      // Trouser + Ironing = ₹15
      const rate3 = repo.getEffectiveRate('LITM-002', 'LSRV-002', '2026-01-10');
      expect(rate3).not.toBeNull();
      expect(rate3?.rate).toBe(15);

      // Non-existent combination returns null
      const nonExistent = repo.getEffectiveRate('LITM-999', 'LSRV-999', '2026-01-10');
      expect(nonExistent).toBeNull();
    });

    it('supports saving and updating rates', () => {
      const customRate = new LaundryChargeRate({
        id: 'LRATE-CUSTOM-1',
        itemId: 'LITM-007',
        serviceId: 'LSRV-002',
        rate: 22,
        effectiveFrom: '2026-08-01',
        isActive: true,
        createdAt: '2026-08-01',
      });

      repo.saveRate(customRate);

      const retrieved = repo.getRateById('LRATE-CUSTOM-1');
      expect(retrieved?.rate).toBe(22);

      const effective = repo.getEffectiveRate('LITM-007', 'LSRV-002', '2026-08-15');
      expect(effective?.rate).toBe(22);
    });
  });
});
