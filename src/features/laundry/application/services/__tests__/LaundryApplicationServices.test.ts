import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryLaundryRepository } from '../../../infrastructure/repositories/InMemoryLaundryRepository';
import { InMemoryLaundryMasterRepository } from '../../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryEvidenceService } from '../LaundryEvidenceService';
import { LaundryCollectionService } from '../LaundryCollectionService';
import { LaundryProcessingService } from '../LaundryProcessingService';
import { LaundryDeliveryService } from '../LaundryDeliveryService';
import { LaundryExceptionService } from '../LaundryExceptionService';
import { LaundryTransactionStatus } from '../../../domain/valueObjects/LaundryTransactionStatus';
import { ProcessingRoute } from '../../../domain/valueObjects/ProcessingRoute';
import { DeliveryHandoverMethod } from '../../../domain/valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../../../domain/valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../../../domain/valueObjects/LaundryExceptionStatus';
import { ResolutionOutcome } from '../../../domain/valueObjects/ResolutionOutcome';
import { laundryStorage } from '../../../infrastructure/storage/laundryStorage';

describe('Laundry Application Services', () => {
  let laundryRepo: InMemoryLaundryRepository;
  let masterRepo: InMemoryLaundryMasterRepository;
  let evidenceService: LaundryEvidenceService;
  let collectionService: LaundryCollectionService;
  let processingService: LaundryProcessingService;
  let deliveryService: LaundryDeliveryService;
  let exceptionService: LaundryExceptionService;

  beforeEach(() => {
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();
    laundryRepo = new InMemoryLaundryRepository([], false);
    masterRepo = new InMemoryLaundryMasterRepository();
    evidenceService = new LaundryEvidenceService();
    evidenceService.clearAll();

    collectionService = new LaundryCollectionService(laundryRepo, masterRepo);
    processingService = new LaundryProcessingService(laundryRepo);
    deliveryService = new LaundryDeliveryService(laundryRepo, evidenceService);
    exceptionService = new LaundryExceptionService(laundryRepo, evidenceService);
  });

  afterEach(() => {
    evidenceService.clearAll();
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();
  });

  describe('LaundryEvidenceService', () => {
    it('saves, retrieves, checks, and removes evidence through application gateway', () => {
      const uri = 'evidence://app-test-photo-01.jpg';
      const data = 'data:image/jpeg;base64,12345';

      expect(evidenceService.hasEvidence(uri)).toBe(false);
      evidenceService.saveEvidence(uri, data, { staffId: 'STAFF-001' });

      expect(evidenceService.hasEvidence(uri)).toBe(true);
      const item = evidenceService.getEvidence(uri);
      expect(item).not.toBeNull();
      expect(item?.uri).toBe(uri);
      expect(item?.data).toBe(data);
      expect(item?.metadata?.staffId).toBe('STAFF-001');

      evidenceService.removeEvidence(uri);
      expect(evidenceService.hasEvidence(uri)).toBe(false);
    });
  });

  describe('LaundryCollectionService', () => {
    it('creates a collection draft with grouped garment lines and requested services', async () => {
      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [
          {
            itemId: 'LITM-001',
            physicalQuantity: 2,
            serviceIds: ['LSRV-001', 'LSRV-002'],
            notes: 'Two collared shirts',
          },
        ],
        notes: 'Initial test collection draft',
      });

      expect(draft.id).toMatch(/^LTX-\d{4}-\d{4}$/);
      expect(draft.status).toBe(LaundryTransactionStatus.DRAFT);
      expect(draft.garmentLines).toHaveLength(1);
      expect(draft.garmentLines[0].physicalQuantity).toBe(2);
      expect(draft.garmentLines[0].itemName).toBe('Shirt');
      expect(draft.garmentLines[0].serviceAllocations).toHaveLength(2);

      const saved = await laundryRepo.findById(draft.id);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(draft.id);
    });

    it('confirms collection and captures immutable RateSnapshots from master catalog', async () => {
      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [
          {
            itemId: 'LITM-001',
            physicalQuantity: 1,
            serviceIds: ['LSRV-001'],
          },
        ],
      });

      const confirmed = await collectionService.confirmCollection({
        transactionId: draft.id,
        staffId: 'STAFF-001',
        collectionTimestamp: '2026-08-15T09:00:00.000Z',
        bagCount: 1,
        bagTagNumbers: ['TAG-101'],
        photoUris: ['evidence://photo-conf-01.jpg'],
        residentVerified: true,
      });

      expect(confirmed.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(confirmed.collectionEvidence).toBeDefined();
      expect(confirmed.collectionEvidence?.bagCount).toBe(1);
      expect(confirmed.garmentLines[0].serviceAllocations[0].rateSnapshot).toBeDefined();
      expect(confirmed.garmentLines[0].serviceAllocations[0].rateSnapshot?.unitRate).toBe(20);
    });
  });

  describe('LaundryProcessingService', () => {
    it('records inspection with condition observations', async () => {
      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 1, serviceIds: ['LSRV-001'] }],
      });
      const confirmed = await collectionService.confirmCollection({
        transactionId: draft.id,
        staffId: 'STAFF-001',
      });

      const inspected = await processingService.recordInspection({
        transactionId: confirmed.id,
        staffId: 'STAFF-002',
        inspectedAt: '2026-08-15T10:00:00.000Z',
        conditionObservations: [
          {
            garmentLineId: confirmed.garmentLines[0].id,
            observationType: 'STAIN',
            description: 'Coffee stain on collar',
            affectedQuantity: 1,
            photoUris: ['evidence://photo-stain-01.jpg'],
          },
        ],
      });

      expect(inspected.isInspected).toBe(true);
      expect(inspected.inspectedByStaffId).toBe('STAFF-002');
      expect(inspected.conditionObservations).toHaveLength(1);
      expect(inspected.conditionObservations[0].observationType).toBe('STAIN');
    });

    it('releases processing to in-house route', async () => {
      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 1, serviceIds: ['LSRV-001'] }],
      });
      await collectionService.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-001' });
      await processingService.recordInspection({ transactionId: draft.id, staffId: 'STAFF-002' });

      const released = await processingService.releaseProcessing({
        transactionId: draft.id,
        route: ProcessingRoute.IN_HOUSE,
        staffId: 'STAFF-001',
      });

      expect(released.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(released.processingRoute).toBe(ProcessingRoute.IN_HOUSE);
    });
  });

  describe('LaundryDeliveryService', () => {
    it('records physical return and physical delivery, triggering evidence cleanup at completion', async () => {
      const photoUri = 'evidence://photo-deliv-01.jpg';
      evidenceService.saveEvidence(photoUri, 'imageData');

      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 1, serviceIds: ['LSRV-001'] }],
      });
      await collectionService.confirmCollection({
        transactionId: draft.id,
        staffId: 'STAFF-001',
        photoUris: [photoUri],
      });
      await processingService.recordInspection({ transactionId: draft.id, staffId: 'STAFF-002' });
      await processingService.releaseProcessing({
        transactionId: draft.id,
        route: ProcessingRoute.IN_HOUSE,
        staffId: 'STAFF-001',
      });

      const lineId = draft.garmentLines[0].id;

      // Record return
      const returned = await deliveryService.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-003',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 1 }],
      });

      expect(returned.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
      expect(returned.totalReturnedPieces).toBe(1);

      // Record delivery -> reaches physical completion
      const delivered = await deliveryService.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-001',
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 1 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        residentPresent: true,
        residentVerified: true,
      });

      expect(delivered.status).toBe(LaundryTransactionStatus.COMPLETED);
      expect(delivered.totalOutstandingPhysicalPieces).toBe(0);

      // Ephemeral evidence cleaned up automatically upon physical completion
      expect(evidenceService.hasEvidence(photoUri)).toBe(false);
    });
  });

  describe('LaundryExceptionService', () => {
    it('raises, investigates, and resolves an exception, updating physical reconciliation', async () => {
      const excPhotoUri = 'evidence://photo-exc-01.jpg';
      evidenceService.saveEvidence(excPhotoUri, 'excData');

      const draft = await collectionService.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 1, serviceIds: ['LSRV-001'] }],
      });
      await collectionService.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-001' });

      // Raise Exception
      const withException = await exceptionService.raiseException({
        transactionId: draft.id,
        garmentLineId: draft.garmentLines[0].id,
        type: LaundryExceptionType.MISSING,
        description: 'Shirt missing after sorting',
        affectedQuantity: 1,
        staffId: 'STAFF-002',
        photoUris: [excPhotoUri],
      });

      expect(withException.exceptions).toHaveLength(1);
      const excId = withException.exceptions[0].id;
      expect(withException.exceptions[0].status).toBe(LaundryExceptionStatus.OPEN);

      // Record Investigation
      const investigated = await exceptionService.recordInvestigation({
        transactionId: draft.id,
        exceptionId: excId,
        investigatorStaffId: 'STAFF-001',
        findings: 'Verified lost at sorting area',
      });
      expect(investigated.exceptions[0].status).toBe(LaundryExceptionStatus.UNDER_INVESTIGATION);

      // Resolve Exception
      const resolved = await exceptionService.resolveException({
        transactionId: draft.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.PERMANENTLY_LOST,
        resolverStaffId: 'STAFF-001',
        resolvedQuantity: 1,
        notes: 'Full value reimbursement approved',
      });

      expect(resolved.exceptions[0].status).toBe(LaundryExceptionStatus.RESOLVED);
      expect(resolved.totalResolvedPieces).toBe(1);
      expect(resolved.totalOutstandingPhysicalPieces).toBe(0);

      // Physical completion achieved -> evidence cleaned up
      expect(evidenceService.hasEvidence(excPhotoUri)).toBe(false);
    });
  });
});
