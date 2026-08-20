import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryItem } from '../entities/LaundryItem';
import { LaundryService } from '../entities/LaundryService';
import { LaundryChargeRate } from '../entities/LaundryChargeRate';
import { ConditionObservation } from '../entities/ConditionObservation';
import { ProcessingRoute } from '../valueObjects/ProcessingRoute';
import { InMemoryLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';

describe('Laundry Pre-processing Inspection & Processing Route (L-05)', () => {
  let masterRepo: InMemoryLaundryMasterRepository;

  beforeEach(() => {
    masterRepo = new InMemoryLaundryMasterRepository([], [], []);

    masterRepo.saveItem(
      new LaundryItem({
        id: 'LITM-001',
        code: 'SHIRT',
        name: 'Shirt',
        category: 'CLOTHING',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    masterRepo.saveService(
      new LaundryService({
        id: 'LSRV-001',
        code: 'CLEANING',
        name: 'Wash & Fold Cleaning',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    masterRepo.saveRate(
      new LaundryChargeRate({
        id: 'LRATE-001',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 30,
        effectiveFrom: '2026-08-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );
  });

  function createCollectedTransaction(): {
    tx: LaundryTransaction;
    line: GarmentLine;
    alloc: ServiceAllocation;
  } {
    const tx = new LaundryTransaction({
      id: 'LTX-2026-0005',
      stayId: 'STAY-105',
      residentId: 'RES-205',
    });

    const line = new GarmentLine({
      id: 'GL-001',
      transactionId: 'LTX-2026-0005',
      itemId: 'LITM-001',
      itemName: 'Shirt',
      physicalQuantity: 3,
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    const alloc = new ServiceAllocation({
      id: 'SA-001',
      garmentLineId: 'GL-001',
      serviceId: 'LSRV-001',
      serviceName: 'Wash & Fold Cleaning',
      requestedQuantity: 3,
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    line.addServiceAllocation(alloc);
    tx.addGarmentLine(line);

    tx.confirmCollection({
      masterRepository: masterRepo,
      collectedByStaffId: 'STAFF-COLLECT-01',
      collectionTimestamp: '2026-08-20T10:30:00.000Z',
    });

    return { tx, line, alloc };
  }

  describe('Mandatory Test Matrix', () => {
    it('Test 1 — Inspection Before Collection is rejected on DRAFT transaction', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-DRAFT',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-DRAFT',
        itemId: 'LITM-001',
        physicalQuantity: 2,
        createdAt: '2026-08-20',
      });
      tx.addGarmentLine(line);

      expect(() =>
        tx.recordConditionObservation({
          id: 'OBS-001',
          garmentLineId: 'GL-001',
          description: 'Torn collar',
          affectedQuantity: 1,
          observedByStaffId: 'STAFF-INSPECT-01',
          observedAt: '2026-08-20T11:00:00.000Z',
        })
      ).toThrow('Pre-processing inspection can only be performed on COLLECTED transactions.');

      expect(tx.conditionObservations).toHaveLength(0);
    });

    it('Test 2 — Successful Inspection records ConditionObservation and emits event', () => {
      const { tx } = createCollectedTransaction();

      const newObs = new ConditionObservation({
        id: 'OBS-001',
        garmentLineId: 'GL-001',
        observationType: 'STAIN',
        description: 'Ink stain on left pocket',
        affectedQuantity: 1,
        evidenceUris: ['https://storage.rpgms.internal/laundry/obs-01.jpg'],
        observedByStaffId: 'STAFF-INSPECT-01',
        observedAt: '2026-08-20T11:00:00.000Z',
      });

      const obs = tx.recordConditionObservation(newObs);

      expect(obs).toBeInstanceOf(ConditionObservation);
      expect(obs.id).toBe('OBS-001');
      expect(obs.affectedQuantity).toBe(1);
      expect(tx.conditionObservations).toHaveLength(1);
      expect(tx.conditionObservations[0].description).toBe('Ink stain on left pocket');
      expect(tx.status).toBe(LaundryTransactionStatus.COLLECTED);

      // Verify canonical event
      const obsEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryConditionObserved');
      expect(obsEvents).toHaveLength(1);
      expect(obsEvents[0].metadata).toEqual({
        stayId: 'STAY-105',
        residentId: 'RES-205',
        observationId: 'OBS-001',
        garmentLineId: 'GL-001',
        observationType: 'STAIN',
        description: 'Ink stain on left pocket',
        affectedQuantity: 1,
        observedByStaffId: 'STAFF-INSPECT-01',
        hasEvidence: true,
      });
    });

    it('Test 3 — Multiple Observations on same garment line preserve all historical findings', () => {
      const { tx } = createCollectedTransaction();

      tx.recordConditionObservation({
        id: 'OBS-001',
        garmentLineId: 'GL-001',
        description: 'Ink stain on left pocket',
        affectedQuantity: 1,
        observedByStaffId: 'STAFF-01',
        observedAt: '2026-08-20T11:00:00.000Z',
      });

      tx.recordConditionObservation({
        id: 'OBS-002',
        garmentLineId: 'GL-001',
        description: 'Missing button on front placket',
        affectedQuantity: 2,
        observedByStaffId: 'STAFF-01',
        observedAt: '2026-08-20T11:05:00.000Z',
      });

      expect(tx.conditionObservations).toHaveLength(2);
      expect(tx.conditionObservations[0].id).toBe('OBS-001');
      expect(tx.conditionObservations[1].id).toBe('OBS-002');
    });

    it('Test 4 — Observation Immutability is enforced at runtime', () => {
      const { tx } = createCollectedTransaction();

      const obs = tx.recordConditionObservation({
        id: 'OBS-001',
        garmentLineId: 'GL-001',
        description: 'Tear near cuff',
        affectedQuantity: 1,
        observedByStaffId: 'STAFF-01',
        observedAt: '2026-08-20T11:00:00.000Z',
      });

      expect(Object.isFrozen(obs)).toBe(true);
      expect(() => {
        (obs as any).description = 'Rewritten description';
      }).toThrow();
      expect(obs.description).toBe('Tear near cuff');
    });

    it('Test 5 — Invalid Observation is rejected', () => {
      const { tx } = createCollectedTransaction();

      // Empty description
      expect(() =>
        tx.recordConditionObservation({
          id: 'OBS-INV-1',
          garmentLineId: 'GL-001',
          description: '',
          affectedQuantity: 1,
          observedByStaffId: 'STAFF-01',
          observedAt: '2026-08-20',
        })
      ).toThrow('ConditionObservation description cannot be empty.');

      // Zero affected quantity
      expect(() =>
        tx.recordConditionObservation({
          id: 'OBS-INV-2',
          garmentLineId: 'GL-001',
          description: 'Defect',
          affectedQuantity: 0,
          observedByStaffId: 'STAFF-01',
          observedAt: '2026-08-20',
        })
      ).toThrow('ConditionObservation affectedQuantity must be a positive integer.');

      // Affected quantity exceeds physical piece count (3)
      expect(() =>
        tx.recordConditionObservation({
          id: 'OBS-INV-3',
          garmentLineId: 'GL-001',
          description: 'Defect',
          affectedQuantity: 5,
          observedByStaffId: 'STAFF-01',
          observedAt: '2026-08-20',
        })
      ).toThrow('cannot exceed GarmentLine physicalQuantity (3)');
    });

    it('Test 6 — Route Selection accepts IN_HOUSE and EXTERNAL_VENDOR', () => {
      const { tx } = createCollectedTransaction();

      tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE);
      expect(tx.processingRoute).toBe('IN_HOUSE');
      expect(tx.processingVendorId).toBeUndefined();

      tx.selectProcessingRoute(ProcessingRoute.EXTERNAL_VENDOR, 'VEND-001');
      expect(tx.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(tx.processingVendorId).toBe('VEND-001');
    });

    it('Test 7 — Invalid Route is rejected', () => {
      const { tx } = createCollectedTransaction();

      expect(() => tx.selectProcessingRoute('OUTSOURCED_UNKNOWN' as any)).toThrow(
        'Invalid processing route (OUTSOURCED_UNKNOWN)'
      );

      // EXTERNAL_VENDOR without vendor ID
      expect(() => tx.selectProcessingRoute(ProcessingRoute.EXTERNAL_VENDOR, '')).toThrow(
        'Vendor ID is required when selecting EXTERNAL_VENDOR'
      );
    });

    it('Test 8 — Route Change Before Release succeeds; after release is rejected', () => {
      const { tx } = createCollectedTransaction();

      tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE);
      expect(tx.processingRoute).toBe('IN_HOUSE');

      // Change route before release
      tx.selectProcessingRoute(ProcessingRoute.EXTERNAL_VENDOR, 'VEND-FAST-CLEAN');
      expect(tx.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(tx.processingVendorId).toBe('VEND-FAST-CLEAN');

      // Complete inspection and release
      tx.completeInspection({ inspectedByStaffId: 'STAFF-INSPECT-01' });
      tx.releaseProcessing({ releasedByStaffId: 'STAFF-RELEASE-01' });
      expect(tx.status).toBe(LaundryTransactionStatus.IN_PROCESS);

      // Attempt to change route after release
      expect(() => tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE)).toThrow(
        'Processing route can only be selected prior to processing release.'
      );
    });

    it('Test 9 — Release Without Inspection is rejected', () => {
      const { tx } = createCollectedTransaction();
      tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE);

      expect(() =>
        tx.releaseProcessing({
          releasedByStaffId: 'STAFF-RELEASE-01',
        })
      ).toThrow('without completing pre-processing inspection.');

      expect(tx.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryProcessingReleased')).toHaveLength(0);
    });

    it('Test 10 — Release Without Route is rejected', () => {
      const { tx } = createCollectedTransaction();
      tx.completeInspection({ inspectedByStaffId: 'STAFF-INSPECT-01' });

      expect(() =>
        tx.releaseProcessing({
          releasedByStaffId: 'STAFF-RELEASE-01',
        })
      ).toThrow('without selecting a processing route');

      expect(tx.status).toBe(LaundryTransactionStatus.COLLECTED);
    });

    it('Test 11 — Successful IN_HOUSE Release transitions to IN_PROCESS and emits event', () => {
      const { tx } = createCollectedTransaction();
      tx.completeInspection({
        inspectedByStaffId: 'STAFF-INSPECT-01',
        inspectedAt: '2026-08-20T11:00:00.000Z',
      });
      tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE);

      tx.releaseProcessing({
        releasedByStaffId: 'STAFF-RELEASE-01',
        releasedAt: '2026-08-20T11:30:00.000Z',
      });

      expect(tx.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(tx.processingRoute).toBe('IN_HOUSE');
      expect(tx.processingReleasedAt).toBe('2026-08-20T11:30:00.000Z');
      expect(tx.processingReleasedByStaffId).toBe('STAFF-RELEASE-01');

      // Verify canonical event
      const releaseEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryProcessingReleased');
      expect(releaseEvents).toHaveLength(1);
      expect(releaseEvents[0].metadata).toEqual({
        stayId: 'STAY-105',
        residentId: 'RES-205',
        processingRoute: 'IN_HOUSE',
        vendorId: undefined,
        releasedByStaffId: 'STAFF-RELEASE-01',
        releasedAt: '2026-08-20T11:30:00.000Z',
        totalPhysicalPieces: 3,
        garmentLineCount: 1,
        conditionObservationCount: 0,
      });
    });

    it('Test 12 — Successful EXTERNAL_VENDOR Release transitions to IN_PROCESS without execution side-effects', () => {
      const { tx } = createCollectedTransaction();
      tx.completeInspection({
        inspectedByStaffId: 'STAFF-INSPECT-01',
      });

      tx.releaseProcessing({
        route: ProcessingRoute.EXTERNAL_VENDOR,
        vendorId: 'VEND-EXPRESS',
        releasedByStaffId: 'STAFF-RELEASE-01',
        releasedAt: '2026-08-20T11:30:00.000Z',
      });

      expect(tx.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(tx.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(tx.processingVendorId).toBe('VEND-EXPRESS');

      const releaseEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryProcessingReleased');
      expect(releaseEvents).toHaveLength(1);
      expect(releaseEvents[0].metadata?.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(releaseEvents[0].metadata?.vendorId).toBe('VEND-EXPRESS');
    });

    it('Test 13 — Duplicate Release is rejected', () => {
      const { tx } = createCollectedTransaction();
      tx.completeInspection({ inspectedByStaffId: 'STAFF-INSPECT-01' });
      tx.selectProcessingRoute(ProcessingRoute.IN_HOUSE);

      tx.releaseProcessing({ releasedByStaffId: 'STAFF-RELEASE-01' });
      expect(tx.status).toBe(LaundryTransactionStatus.IN_PROCESS);

      expect(() =>
        tx.releaseProcessing({ releasedByStaffId: 'STAFF-RELEASE-01' })
      ).toThrow('Processing can only be released from COLLECTED status.');

      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryProcessingReleased')).toHaveLength(1);
    });

    it('Test 14 — RateSnapshot Integrity after inspection and processing release', () => {
      const { tx, alloc } = createCollectedTransaction();
      const initialSnapshot = alloc.rateSnapshot;
      expect(initialSnapshot?.unitRate).toBe(30);

      tx.recordConditionObservation({
        id: 'OBS-001',
        garmentLineId: 'GL-001',
        description: 'Minor stain',
        affectedQuantity: 1,
        observedByStaffId: 'STAFF-01',
        observedAt: '2026-08-20',
      });
      tx.completeInspection({ inspectedByStaffId: 'STAFF-01' });
      tx.releaseProcessing({ route: ProcessingRoute.IN_HOUSE, releasedByStaffId: 'STAFF-02' });

      expect(alloc.rateSnapshot).toBe(initialSnapshot);
      expect(alloc.rateSnapshot?.unitRate).toBe(30);
    });

    it('Test 15 — Chargeability Integrity after inspection and processing release', () => {
      const { tx } = createCollectedTransaction();

      tx.recordConditionObservation({
        id: 'OBS-001',
        garmentLineId: 'GL-001',
        description: 'Minor stain',
        affectedQuantity: 1,
        observedByStaffId: 'STAFF-01',
        observedAt: '2026-08-20',
      });
      tx.completeInspection({ inspectedByStaffId: 'STAFF-01' });
      tx.releaseProcessing({ route: ProcessingRoute.IN_HOUSE, releasedByStaffId: 'STAFF-02' });

      // Inspection and Release alone create ZERO charges
      expect(tx.charges).toHaveLength(0);
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryChargeRaised')).toHaveLength(0);
    });

    it('Test 16 — No Finance Mutation occurs during inspection and release', () => {
      const { tx } = createCollectedTransaction();

      tx.completeInspection({ inspectedByStaffId: 'STAFF-01' });
      tx.releaseProcessing({ route: ProcessingRoute.IN_HOUSE, releasedByStaffId: 'STAFF-02' });

      expect(tx.charges).toHaveLength(0);
    });
  });
});
