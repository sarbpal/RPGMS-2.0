import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LaundryWorkspaceCoordinator } from '../LaundryWorkspaceCoordinator';
import { InMemoryLaundryRepository } from '../../../infrastructure/repositories/InMemoryLaundryRepository';
import { InMemoryLaundryMasterRepository } from '../../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { LaundryPostingService } from '../../../../finance/services/laundryPostingService';
import { BillingApplicationService } from '../../../../finance/services/billingService';
import { LaundryEvidenceService } from '../../services/LaundryEvidenceService';
import { laundryStorage } from '../../../infrastructure/storage/laundryStorage';

import { Stay } from '../../../../stay/domain/entities/Stay';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import { ProcessingRoute } from '../../../domain/valueObjects/ProcessingRoute';
import { DeliveryHandoverMethod } from '../../../domain/valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../../../domain/valueObjects/LaundryExceptionType';
import { ResolutionOutcome } from '../../../domain/valueObjects/ResolutionOutcome';
import { LaundryTransactionStatus } from '../../../domain/valueObjects/LaundryTransactionStatus';

describe('LaundryWorkspaceCoordinator', () => {
  let laundryRepo: InMemoryLaundryRepository;
  let masterRepo: InMemoryLaundryMasterRepository;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let financeRepo: InMemoryFinanceRepository;
  let postingService: LaundryPostingService;
  let evidenceService: LaundryEvidenceService;
  let coordinator: LaundryWorkspaceCoordinator;

  const mockResident: Resident = {
    id: 'RES-00124',
    residentCode: 'RESID-000124',
    fullName: 'Aditya Birla',
    mobileNumber: '9876543210',
    status: 'ACTIVE' as any,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const mockFlat: Flat = {
    id: 'flat-101',
    name: '101',
    areas: [
      {
        id: 'area-1',
        name: 'Bedroom 1',
        defaultRent: 10000,
        defaultDeposit: 20000,
        beds: [
          {
            id: 'BED-101-A',
            name: 'Bed A',
            status: BedStatus.OCCUPIED,
            residentName: 'Aditya Birla',
            stayId: 'STAY-2026-00041',
            defaultRent: 10000,
            defaultDeposit: 20000,
          },
        ],
      },
    ],
  };

  const mockStay = new Stay({
    id: 'STAY-2026-00041',
    residentId: 'RES-00124',
    stayType: 'REGULAR' as any,
    status: 'ACTIVE' as any,
    checkInDate: '2026-08-01',
    flatId: 'flat-101',
    allocatedBedIds: ['BED-101-A'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  });

  beforeEach(() => {
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();

    laundryRepo = new InMemoryLaundryRepository([], false);
    masterRepo = new InMemoryLaundryMasterRepository();
    stayRepo = new InMemoryStayRepository([mockStay]);
    residentRepo = new InMemoryResidentRepository([mockResident]);
    accommodationRepo = new InMemoryAccommodationRepository([mockFlat]);
    financeRepo = new InMemoryFinanceRepository();
    const billingService = new BillingApplicationService(financeRepo, stayRepo);
    postingService = new LaundryPostingService(billingService, financeRepo, stayRepo);
    evidenceService = new LaundryEvidenceService();
    evidenceService.clearAll();

    coordinator = new LaundryWorkspaceCoordinator(
      laundryRepo,
      masterRepo,
      stayRepo,
      residentRepo,
      accommodationRepo,
      postingService,
      undefined,
      undefined,
      undefined,
      undefined,
      evidenceService
    );
  });

  afterEach(() => {
    evidenceService.clearAll();
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();
  });

  describe('Construction & Dependency Injection', () => {
    it('initializes cleanly with default and injected dependencies', () => {
      const defaultCoord = new LaundryWorkspaceCoordinator();
      expect(defaultCoord).toBeDefined();
      expect(coordinator).toBeDefined();
    });
  });

  describe('Workspace Queries & Metrics', () => {
    it('retrieves empty workspace view model when no transactions exist', async () => {
      const vm = await coordinator.getWorkspaceViewModel();
      expect(vm.totalCount).toBe(0);
      expect(vm.transactions).toHaveLength(0);
      expect(vm.metrics.totalActive).toBe(0);
      expect(vm.metrics.awaitingCollectionConfirmation).toBe(0);
      expect(vm.masterCatalog.items.length).toBeGreaterThan(0);
      expect(vm.masterCatalog.services.length).toBeGreaterThan(0);
      expect(vm.masterCatalog.chargeRates.length).toBeGreaterThan(0);
    });

    it('calculates metrics and supports filtering and text search', async () => {
      const draft1 = await coordinator.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 2, serviceIds: ['LSRV-001'] }],
      });

      const draft2 = await coordinator.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-002', physicalQuantity: 1, serviceIds: ['LSRV-002'] }],
      });

      // Confirm draft1
      await coordinator.confirmCollection({
        transactionId: draft1.id,
        staffId: 'STAFF-001',
      });

      // Metrics
      const metrics = await coordinator.getDashboardMetrics();
      expect(metrics.totalActive).toBe(2);
      expect(metrics.awaitingCollectionConfirmation).toBe(1); // draft2
      expect(metrics.awaitingInspection).toBe(1); // draft1 (COLLECTED)

      // Filter by status DRAFT
      const draftList = await coordinator.getWorkspaceViewModel({ status: LaundryTransactionStatus.DRAFT });
      expect(draftList.totalCount).toBe(1);
      expect(draftList.transactions[0].id).toBe(draft2.id);

      // Search by transaction ID
      const searchRes = await coordinator.getWorkspaceViewModel({ searchQuery: draft1.id });
      expect(searchRes.totalCount).toBe(1);
      expect(searchRes.transactions[0].id).toBe(draft1.id);
    });
  });

  describe('Cross-Domain Enrichment', () => {
    it('enriches transaction summary and detail with resident, stay location, and master catalog names', async () => {
      const created = await coordinator.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [
          {
            itemId: 'LITM-001',
            physicalQuantity: 2,
            serviceIds: ['LSRV-001', 'LSRV-002'],
          },
        ],
      });

      const confirmed = await coordinator.confirmCollection({
        transactionId: created.id,
        staffId: 'STAFF-001',
      });

      expect(confirmed.residentName).toBe('Aditya Birla');
      expect(confirmed.residentCode).toBe('RESID-000124');
      expect(confirmed.locationSummary).toBe('Flat 101 / Bed 101-A');
      expect(confirmed.garmentLines[0].itemName).toBe('Shirt');
      expect(confirmed.garmentLines[0].serviceAllocations[0].serviceName).toBe('Cleaning (Wash & Fold)');
      expect(confirmed.garmentLines[0].serviceAllocations[0].unitRateFormatted).toBe('₹20');
      expect(confirmed.totalEstimatedAmountFormatted).toBe('₹60'); // (2*20) + (2*10) = 60
    });

    it('retrieves selectable stays enriched with resident and flat location information', async () => {
      const selectable = await coordinator.getSelectableStays();
      expect(selectable).toHaveLength(1);
      expect(selectable[0].stayId).toBe('STAY-2026-00041');
      expect(selectable[0].residentName).toBe('Aditya Birla');
      expect(selectable[0].residentCode).toBe('RESID-000124');
      expect(selectable[0].flatName).toBe('Flat 101');
      expect(selectable[0].locationSummary).toBe('Flat 101 / Bed 101-A');
    });
  });

  describe('Complete Operational Lifecycle via Coordinator', () => {
    it('executes collection, inspection, routing, return, delivery, and finance charge posting', async () => {
      // 1. Create Draft
      const draft = await coordinator.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [
          {
            itemId: 'LITM-001', // Shirt (Wash: 20, Iron: 15)
            physicalQuantity: 2,
            serviceIds: ['LSRV-001', 'LSRV-002'],
          },
        ],
        notes: 'Express laundry batch',
      });

      expect(draft.status).toBe(LaundryTransactionStatus.DRAFT);
      const lineId = draft.garmentLines[0].id;

      // 2. Confirm Collection -> captures RateSnapshot
      const confirmed = await coordinator.confirmCollection({
        transactionId: draft.id,
        staffId: 'STAFF-001',
        bagCount: 1,
        bagTagNumbers: ['TAG-001'],
        residentVerified: true,
      });

      expect(confirmed.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(confirmed.collectionEvidence?.bagCount).toBe(1);
      expect(confirmed.garmentLines[0].serviceAllocations[0].isRateCaptured).toBe(true);

      // 3. Pre-Processing Inspection
      const inspected = await coordinator.recordInspection({
        transactionId: draft.id,
        staffId: 'STAFF-002',
        conditionObservations: [
          {
            garmentLineId: lineId,
            observationType: 'LOOSE_BUTTON',
            description: 'Loose button on top shirt',
            affectedQuantity: 1,
          },
        ],
      });

      expect(inspected.isInspected).toBe(true);
      expect(inspected.garmentLines[0].conditionObservations).toHaveLength(1);

      // 4. Release to External Processing
      const released = await coordinator.releaseProcessing({
        transactionId: draft.id,
        route: ProcessingRoute.EXTERNAL_VENDOR,
        vendorId: 'VND-001',
        staffId: 'STAFF-001',
      });

      expect(released.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(released.processingRoute).toBe(ProcessingRoute.EXTERNAL_VENDOR);

      // 5. Record Return
      const returned = await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-003',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 2 }],
      });

      expect(returned.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
      expect(returned.totalReturnedPieces).toBe(2);

      // 6. Record Delivery
      const delivered = await coordinator.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-001',
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 2 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        residentPresent: true,
        residentVerified: true,
      });

      expect(delivered.status).toBe(LaundryTransactionStatus.COMPLETED);
      expect(delivered.totalDeliveredPieces).toBe(2);
      expect(delivered.totalOutstandingPieces).toBe(0);

      // 7. Finance Charge Posting via Coordinator
      const postResult = await coordinator.evaluateAndPostCharges({
        transactionId: draft.id,
        staffId: 'STAFF-001',
      });

      expect(postResult.success).toBe(true);
      expect(postResult.postedChargesCount).toBe(2); // Wash (2*20=40) + Iron (2*10=20)
      expect(postResult.totalAmountPosted).toBe(60);
      expect(postResult.totalAmountPostedFormatted).toBe('₹60');

      // Verify detail ViewModel after charge posting
      const updatedDetail = await coordinator.getTransactionDetail(draft.id);
      expect(updatedDetail).not.toBeNull();
      expect(updatedDetail?.isFullyChargedAndPosted).toBe(true);
      expect(updatedDetail?.totalPostedAmountFormatted).toBe('₹60');
      expect(updatedDetail?.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('Exception Handling via Coordinator', () => {
    it('manages exception lifecycle from raising to resolution', async () => {
      const draft = await coordinator.createCollectionDraft({
        stayId: 'STAY-2026-00041',
        residentId: 'RES-00124',
        garmentLines: [{ itemId: 'LITM-001', physicalQuantity: 1, serviceIds: ['LSRV-001'] }],
      });
      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-001' });

      // Raise Exception
      const withExc = await coordinator.raiseException({
        transactionId: draft.id,
        garmentLineId: draft.garmentLines[0].id,
        type: LaundryExceptionType.DAMAGED,
        description: 'Tear along seam',
        affectedQuantity: 1,
        staffId: 'STAFF-002',
      });

      expect(withExc.hasOpenExceptions).toBe(true);
      expect(withExc.openExceptionsCount).toBe(1);
      const excId = withExc.exceptions[0].id;

      // Investigate
      const investigated = await coordinator.recordInvestigation({
        transactionId: draft.id,
        exceptionId: excId,
        investigatorStaffId: 'STAFF-001',
        findings: 'Tear confirmed pre-existing before wash cycle',
      });
      expect(investigated.exceptions[0].status).toBe('UNDER_INVESTIGATION');

      // Resolve
      const resolved = await coordinator.resolveException({
        transactionId: draft.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.RESIDENT_ACCEPTED,
        resolverStaffId: 'STAFF-001',
        resolvedQuantity: 1,
        notes: 'Repaired by in-house tailor and accepted by resident',
      });

      expect(resolved.hasOpenExceptions).toBe(false);
      expect(resolved.exceptions[0].status).toBe('RESOLVED');
      expect(resolved.exceptions[0].resolution?.outcomeLabel).toBe('Resident Accepted');
    });
  });

  describe('Error Handling', () => {
    it('returns null for non-existent transaction detail', async () => {
      const res = await coordinator.getTransactionDetail('NON_EXISTENT');
      expect(res).toBeNull();
    });

    it('rejects invalid inputs with descriptive error messages', async () => {
      await expect(
        coordinator.createCollectionDraft({
          stayId: '',
          residentId: 'RES-00124',
          garmentLines: [],
        })
      ).rejects.toThrow(/Stay ID is required/i);

      await expect(
        coordinator.confirmCollection({
          transactionId: 'NON_EXISTENT',
          staffId: 'STAFF-001',
        })
      ).rejects.toThrow(/not found/i);
    });
  });
});
