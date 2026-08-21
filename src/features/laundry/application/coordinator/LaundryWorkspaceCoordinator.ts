import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import type { LaundryMasterRepository } from '../../domain/interfaces/LaundryMasterRepository';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { defaultLaundryRepository } from '../../infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { defaultStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { defaultResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import {
  defaultLaundryPostingService,
  LaundryPostingService,
  type LaundryChargeEventPayload,
} from '../../../finance/services/laundryPostingService';
import { LaundryCollectionService } from '../services/LaundryCollectionService';
import { LaundryProcessingService } from '../services/LaundryProcessingService';
import { LaundryDeliveryService } from '../services/LaundryDeliveryService';
import { LaundryExceptionService } from '../services/LaundryExceptionService';
import { LaundryEvidenceService, defaultLaundryEvidenceService } from '../services/LaundryEvidenceService';

import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../../domain/valueObjects/LaundryExceptionStatus';
import { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';

import type {
  LaundryWorkspaceViewModel,
  LaundryTransactionSummaryViewModel,
  LaundryTransactionDetailViewModel,
  LaundryWorkspaceMetricsViewModel,
  LaundryMasterCatalogViewModel,
  SelectableLaundryStayItem,
  PostChargesResultViewModel,
  GarmentLineViewModel,
  ServiceAllocationViewModel,
  ConditionObservationViewModel,
  ReturnRecordViewModel,
  DeliveryRecordViewModel,
  ExceptionViewModel,
  LaundryTimelineEventViewModel,
  PostedChargeRecordViewModel,
} from '../models/LaundryWorkspaceViewModel';

import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
  RecordReturnDTO,
  RecordDeliveryDTO,
  RaiseExceptionDTO,
  RecordInvestigationDTO,
  ResolveExceptionDTO,
  PostChargesDTO,
  LaundryWorkspaceFilters,
} from '../dtos/laundryDTOs';

export class LaundryWorkspaceCoordinator {
  private readonly laundryRepo: LaundryRepository;
  private readonly masterRepo: LaundryMasterRepository;
  private readonly stayRepo: StayRepository;
  private readonly residentRepo: ResidentRepository;
  private readonly accommodationRepo: AccommodationRepository;
  private readonly laundryPostingService: LaundryPostingService;

  private readonly collectionService: LaundryCollectionService;
  private readonly processingService: LaundryProcessingService;
  private readonly deliveryService: LaundryDeliveryService;
  private readonly exceptionService: LaundryExceptionService;
  private readonly evidenceService: LaundryEvidenceService;

  constructor(
    laundryRepo: LaundryRepository = defaultLaundryRepository,
    masterRepo: LaundryMasterRepository = defaultLaundryMasterRepository,
    stayRepo: StayRepository = defaultStayRepository,
    residentRepo: ResidentRepository = defaultResidentRepository,
    accommodationRepo: AccommodationRepository = defaultAccommodationRepository,
    laundryPostingService: LaundryPostingService = defaultLaundryPostingService,
    collectionService?: LaundryCollectionService,
    processingService?: LaundryProcessingService,
    deliveryService?: LaundryDeliveryService,
    exceptionService?: LaundryExceptionService,
    evidenceService?: LaundryEvidenceService
  ) {
    this.laundryRepo = laundryRepo;
    this.masterRepo = masterRepo;
    this.stayRepo = stayRepo;
    this.residentRepo = residentRepo;
    this.accommodationRepo = accommodationRepo;
    this.laundryPostingService = laundryPostingService;

    this.evidenceService = evidenceService || defaultLaundryEvidenceService;
    this.collectionService = collectionService || new LaundryCollectionService(this.laundryRepo, this.masterRepo);
    this.processingService = processingService || new LaundryProcessingService(this.laundryRepo);
    this.deliveryService = deliveryService || new LaundryDeliveryService(this.laundryRepo, this.evidenceService);
    this.exceptionService = exceptionService || new LaundryExceptionService(this.laundryRepo, this.evidenceService);
  }

  // --- Workspace Queries ---

  /**
   * Constructs the complete Laundry Workspace presentation ViewModel.
   */
  public async getWorkspaceViewModel(filters: LaundryWorkspaceFilters = {}): Promise<LaundryWorkspaceViewModel> {
    const allTransactions = await this.laundryRepo.getAll();
    const metrics = this.calculateMetrics(allTransactions);
    const masterCatalog = await this.getMasterCatalog();

    const residentMap = await this.buildResidentMap();
    const stayMap = await this.buildStayMap();
    const flatMap = this.buildFlatMap();

    const filtered = this.applyFilters(allTransactions, filters);
    const summaries = filtered.map((tx) => this.toSummaryViewModel(tx, residentMap, stayMap, flatMap));

    return {
      metrics,
      transactions: Object.freeze(summaries),
      masterCatalog,
      filters,
      totalCount: summaries.length,
    };
  }

  /**
   * Retrieves complete operational detail for a specific Laundry Transaction.
   */
  public async getTransactionDetail(transactionId: string): Promise<LaundryTransactionDetailViewModel | null> {
    if (!transactionId) return null;
    const tx = await this.laundryRepo.findById(transactionId);
    if (!tx) return null;

    return this.toDetailViewModel(tx);
  }

  /**
   * Retrieves operational dashboard metrics.
   */
  public async getDashboardMetrics(filters: LaundryWorkspaceFilters = {}): Promise<LaundryWorkspaceMetricsViewModel> {
    const allTransactions = await this.laundryRepo.getAll();
    const filtered = this.applyFilters(allTransactions, filters);
    return this.calculateMetrics(filtered);
  }

  /**
   * Retrieves active items, services, and charge rates for UI dropdowns.
   */
  public async getMasterCatalog(): Promise<LaundryMasterCatalogViewModel> {
    const items = this.masterRepo.getItems();
    const services = this.masterRepo.getServices();
    const rates = this.masterRepo.getRates();

    const itemMap = new Map(items.map((i) => [i.id, i.name]));
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));

    const itemsVm = items.map((i) => ({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category,
      isActive: i.isActive,
    }));

    const servicesVm = services.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      isActive: s.isActive,
    }));

    const ratesVm = rates.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      itemName: itemMap.get(r.itemId) || r.itemId,
      serviceId: r.serviceId,
      serviceName: serviceMap.get(r.serviceId) || r.serviceId,
      rate: r.rate,
      rateFormatted: this.formatCurrency(r.rate),
      effectiveFrom: r.effectiveFrom,
      isActive: r.isActive,
    }));

    return {
      items: Object.freeze(itemsVm),
      services: Object.freeze(servicesVm),
      chargeRates: Object.freeze(ratesVm),
    };
  }

  /**
   * Retrieves all active/on-notice stays enriched with resident and accommodation data for collection initiation.
   */
  public async getSelectableStays(): Promise<readonly SelectableLaundryStayItem[]> {
    const stays =
      typeof (this.stayRepo as any).getAll === 'function'
        ? await (this.stayRepo as any).getAll()
        : this.stayRepo.getAllSync();
    const residents =
      typeof (this.residentRepo as any).getAll === 'function'
        ? await (this.residentRepo as any).getAll()
        : this.residentRepo.getAllSync();
    const flats = this.accommodationRepo.findAll();

    const residentMap = new Map<string, any>(residents.map((r: any) => [r.id, r]));
    const flatMap = new Map<string, any>(flats.map((f: any) => [f.id, f]));

    const selectable: SelectableLaundryStayItem[] = [];

    for (const stay of stays) {
      if (stay.status !== 'ACTIVE' && stay.status !== 'ON_NOTICE') {
        continue;
      }

      const resident = residentMap.get(stay.residentId);
      if (!resident) continue;

      const flat = stay.flatId ? flatMap.get(stay.flatId) || null : null;
      const flatName = flat
        ? (flat.name.startsWith('Flat ') ? flat.name : `Flat ${flat.name}`)
        : (stay.flatId && stay.flatId !== 'Unassigned'
            ? (stay.flatId.startsWith('Flat ') ? stay.flatId : `Flat ${stay.flatId}`)
            : 'Unassigned');

      const bedNumber =
        stay.allocatedBedIds && stay.allocatedBedIds.length > 0
          ? stay.allocatedBedIds.map((b: string) => b.replace(/^BED-/i, '')).join(', ')
          : undefined;

      const locationSummary = bedNumber ? `${flatName} / Bed ${bedNumber}` : flatName;

      selectable.push({
        stayId: stay.id,
        residentId: resident.id,
        residentName: resident.fullName,
        residentCode: resident.residentCode,
        flatId: stay.flatId || '',
        flatName,
        bedNumber,
        locationSummary,
        status: stay.status,
        checkInDate: stay.checkInDate,
      });
    }

    return Object.freeze(selectable);
  }

  // --- Command Operations ---

  public async createCollectionDraft(dto: CreateCollectionDraftDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.collectionService.createCollectionDraft(dto);
    return this.toDetailViewModel(tx);
  }

  public async confirmCollection(dto: ConfirmCollectionDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.collectionService.confirmCollection(dto);
    return this.toDetailViewModel(tx);
  }

  public async recordInspection(dto: RecordInspectionDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.processingService.recordInspection(dto);
    return this.toDetailViewModel(tx);
  }

  public async releaseProcessing(dto: ReleaseProcessingDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.processingService.releaseProcessing(dto);
    return this.toDetailViewModel(tx);
  }

  public async recordReturn(dto: RecordReturnDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.deliveryService.recordReturn(dto);
    return this.toDetailViewModel(tx);
  }

  public async recordDelivery(dto: RecordDeliveryDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.deliveryService.recordDelivery(dto);
    return this.toDetailViewModel(tx);
  }

  public async raiseException(dto: RaiseExceptionDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.exceptionService.raiseException(dto);
    return this.toDetailViewModel(tx);
  }

  public async recordInvestigation(dto: RecordInvestigationDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.exceptionService.recordInvestigation(dto);
    return this.toDetailViewModel(tx);
  }

  public async resolveException(dto: ResolveExceptionDTO): Promise<LaundryTransactionDetailViewModel> {
    const tx = await this.exceptionService.resolveException(dto);
    return this.toDetailViewModel(tx);
  }

  /**
   * Evaluates newly chargeable service allocations and posts charges to Finance through LaundryPostingService.
   */
  public async evaluateAndPostCharges(dto: PostChargesDTO): Promise<PostChargesResultViewModel> {
    if (!dto.transactionId) {
      throw new Error('Cannot post charges: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot post charges: Staff ID is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot post charges: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    try {
      // Re-evaluate chargeability across all lines in case tranches were not evaluated
      transaction.evaluateChargeability();

      const postedCharges: PostedChargeRecordViewModel[] = [];
      let postedCount = 0;
      let totalPosted = 0;
      const errors: string[] = [];

      for (const line of transaction.garmentLines) {
        for (const sa of line.serviceAllocations) {
          for (const charge of sa.charges) {
            if (charge.status === 'PENDING_POSTING') {
              const payload: LaundryChargeEventPayload = {
                stayId: transaction.stayId,
                residentId: transaction.residentId,
                businessChargeId: charge.businessChargeId,
                transactionId: transaction.id,
                garmentLineId: line.id,
                serviceId: sa.serviceId,
                chargeableQuantity: charge.quantity,
                unitRate: charge.unitRate,
                totalAmount: charge.totalAmount,
                currency: charge.currency,
                calculatedAt: charge.calculatedAt,
                description: `Laundry Service - ${sa.serviceName || sa.serviceId} (${charge.quantity} pcs @ ₹${charge.unitRate})`,
              };

              const postResult = this.laundryPostingService.postLaundryCharge(payload, charge);
              if (postResult.success) {
                postedCount++;
              } else {
                errors.push(...postResult.errors);
              }
            }

            if (charge.status === 'POSTED') {
              totalPosted += charge.totalAmount;
              postedCharges.push({
                businessChargeId: charge.businessChargeId,
                garmentLineId: charge.garmentLineId,
                serviceId: charge.serviceId,
                quantity: charge.quantity,
                unitRate: charge.unitRate,
                totalAmount: charge.totalAmount,
                currency: charge.currency,
                status: charge.status,
                financeBillId: charge.financeBillId,
                postedAt: charge.postedAt,
              });
            }
          }
        }
      }

      await this.laundryRepo.save(transaction);

      return {
        transactionId: transaction.id,
        success: errors.length === 0,
        postedChargesCount: postedCount,
        totalAmountPosted: totalPosted,
        totalAmountPostedFormatted: this.formatCurrency(totalPosted),
        charges: Object.freeze(postedCharges),
        failureReason: errors.length > 0 ? errors.join('; ') : undefined,
      };
    } catch (err: any) {
      return {
        transactionId: transaction.id,
        success: false,
        postedChargesCount: 0,
        totalAmountPosted: 0,
        totalAmountPostedFormatted: this.formatCurrency(0),
        charges: [],
        failureReason: err?.message || 'Unknown Finance posting error',
      };
    }
  }

  // --- Projection & Mapping Helpers ---

  private calculateMetrics(transactions: readonly LaundryTransaction[]): LaundryWorkspaceMetricsViewModel {
    let totalActive = 0;
    let awaitingCollectionConfirmation = 0;
    let awaitingInspection = 0;
    let inProcessExternal = 0;
    let inProcessInHouse = 0;
    let returnedAwaitingDelivery = 0;
    let partiallyDelivered = 0;
    let openExceptionsCount = 0;
    let unpostedChargesCount = 0;

    for (const tx of transactions) {
      if (tx.status !== LaundryTransactionStatus.COMPLETED && tx.status !== LaundryTransactionStatus.CANCELLED) {
        totalActive++;
      }

      if (tx.status === LaundryTransactionStatus.DRAFT) {
        awaitingCollectionConfirmation++;
      } else if (tx.status === LaundryTransactionStatus.COLLECTED && !tx.isInspected) {
        awaitingInspection++;
      } else if (tx.status === LaundryTransactionStatus.IN_PROCESS) {
        if (tx.processingRoute === 'EXTERNAL_VENDOR') {
          inProcessExternal++;
        } else {
          inProcessInHouse++;
        }
      } else if (
        tx.status === LaundryTransactionStatus.RETURNED_FULL ||
        tx.status === LaundryTransactionStatus.RETURNED_PARTIAL
      ) {
        returnedAwaitingDelivery++;
      } else if (tx.status === LaundryTransactionStatus.DELIVERED_PARTIAL) {
        partiallyDelivered++;
      }

      // Count open exceptions
      for (const exc of tx.exceptions) {
        if (exc.status === LaundryExceptionStatus.OPEN || exc.status === LaundryExceptionStatus.UNDER_INVESTIGATION) {
          openExceptionsCount++;
        }
      }

      // Count unposted charges
      for (const line of tx.garmentLines) {
        for (const sa of line.serviceAllocations) {
          for (const charge of sa.charges) {
            if (charge.status === 'PENDING_POSTING') {
              unpostedChargesCount++;
            }
          }
        }
      }
    }

    return {
      totalActive,
      awaitingCollectionConfirmation,
      awaitingInspection,
      inProcessExternal,
      inProcessInHouse,
      returnedAwaitingDelivery,
      partiallyDelivered,
      openExceptionsCount,
      unpostedChargesCount,
    };
  }

  private applyFilters(
    transactions: readonly LaundryTransaction[],
    filters: LaundryWorkspaceFilters
  ): readonly LaundryTransaction[] {
    const q = filters.searchQuery ? filters.searchQuery.trim().toLowerCase() : '';

    return transactions.filter((tx) => {
      if (filters.status && filters.status !== 'ALL' && tx.status !== filters.status) {
        return false;
      }
      if (filters.processingRoute && filters.processingRoute !== 'ALL' && tx.processingRoute !== filters.processingRoute) {
        return false;
      }
      if (filters.stayId && tx.stayId !== filters.stayId) {
        return false;
      }
      if (filters.residentId && tx.residentId !== filters.residentId) {
        return false;
      }
      if (filters.hasExceptions !== undefined) {
        const hasOpen = tx.exceptions.some(
          (e) => e.status === LaundryExceptionStatus.OPEN || e.status === LaundryExceptionStatus.UNDER_INVESTIGATION
        );
        if (filters.hasExceptions !== hasOpen) {
          return false;
        }
      }

      if (q) {
        const idMatch = tx.id.toLowerCase().includes(q);
        const stayMatch = tx.stayId.toLowerCase().includes(q);
        const residentMatch = tx.residentId.toLowerCase().includes(q);
        if (!idMatch && !stayMatch && !residentMatch) {
          return false;
        }
      }

      return true;
    });
  }

  private toSummaryViewModel(
    tx: LaundryTransaction,
    residentMap: Map<string, any>,
    stayMap: Map<string, any>,
    flatMap: Map<string, any>
  ): LaundryTransactionSummaryViewModel {
    const resident = residentMap.get(tx.residentId);
    const residentName = resident?.fullName || `Resident ${tx.residentId}`;
    const residentCode = resident?.residentCode || tx.residentId;

    const stay = stayMap.get(tx.stayId);
    const flat = stay?.flatId ? flatMap.get(stay.flatId) || null : null;
    const flatName = flat
      ? (flat.name.startsWith('Flat ') ? flat.name : `Flat ${flat.name}`)
      : (stay?.flatId && stay.flatId !== 'Unassigned'
          ? (stay.flatId.startsWith('Flat ') ? stay.flatId : `Flat ${stay.flatId}`)
          : 'Unassigned');

    const bedNumber =
      stay?.allocatedBedIds && stay.allocatedBedIds.length > 0
        ? stay.allocatedBedIds.map((b: string) => b.replace(/^BED-/i, '')).join(', ')
        : undefined;

    const locationSummary = bedNumber ? `${flatName} / Bed ${bedNumber}` : flatName;

    const openExceptions = tx.exceptions.filter(
      (e) => e.status === LaundryExceptionStatus.OPEN || e.status === LaundryExceptionStatus.UNDER_INVESTIGATION
    );

    let totalEstAmount = 0;
    let totalPostedAmount = 0;
    let hasCharges = false;

    for (const line of tx.garmentLines) {
      for (const sa of line.serviceAllocations) {
        if (sa.rateSnapshot) {
          totalEstAmount += sa.requestedQuantity * sa.rateSnapshot.unitRate;
        }
        for (const charge of sa.charges) {
          hasCharges = true;
          if (charge.status === 'POSTED') {
            totalPostedAmount += charge.totalAmount;
          }
        }
      }
    }

    const isFullyChargedAndPosted =
      tx.status === LaundryTransactionStatus.COMPLETED &&
      hasCharges &&
      totalPostedAmount >= totalEstAmount;

    return {
      id: tx.id,
      stayId: tx.stayId,
      residentId: tx.residentId,
      residentName,
      residentCode,
      locationSummary,
      status: tx.status,
      statusLabel: this.formatStatusLabel(tx.status),
      processingRoute: tx.processingRoute,
      processingRouteLabel: tx.processingRoute ? this.formatRouteLabel(tx.processingRoute) : undefined,
      processingVendorId: tx.processingVendorId,
      totalPhysicalPieces: tx.totalPhysicalPieces,
      totalReturnedPieces: tx.totalReturnedPieces,
      totalDeliveredPieces: tx.totalDeliveredPieces,
      totalResolvedPieces: tx.totalResolvedPieces,
      totalOutstandingPieces: tx.totalOutstandingPhysicalPieces,
      hasOpenExceptions: openExceptions.length > 0,
      openExceptionsCount: openExceptions.length,
      totalEstimatedAmount: totalEstAmount,
      totalEstimatedAmountFormatted: this.formatCurrency(totalEstAmount),
      totalPostedAmount: totalPostedAmount,
      totalPostedAmountFormatted: this.formatCurrency(totalPostedAmount),
      isFullyChargedAndPosted,
      collectedAt: tx.collectedAt,
      collectedAtFormatted: this.formatDate(tx.collectedAt),
      createdAt: tx.createdAt,
      createdAtFormatted: this.formatDate(tx.createdAt) || tx.createdAt,
    };
  }

  private async toDetailViewModel(tx: LaundryTransaction): Promise<LaundryTransactionDetailViewModel> {
    const residentMap = await this.buildResidentMap();
    const stayMap = await this.buildStayMap();
    const flatMap = this.buildFlatMap();

    const summary = this.toSummaryViewModel(tx, residentMap, stayMap, flatMap);

    const items = this.masterRepo.getItems();
    const services = this.masterRepo.getServices();
    const itemMap = new Map(items.map((i) => [i.id, i.name]));
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));

    const garmentLines: GarmentLineViewModel[] = tx.garmentLines.map((line) => {
      const serviceAllocations: ServiceAllocationViewModel[] = line.serviceAllocations.map((sa) => {
        let saTotalCharge = 0;
        let saPostedCount = 0;

        for (const c of sa.charges) {
          saTotalCharge += c.totalAmount;
          if (c.status === 'POSTED') saPostedCount++;
        }

        return {
          id: sa.id,
          garmentLineId: sa.garmentLineId,
          serviceId: sa.serviceId,
          serviceName: serviceMap.get(sa.serviceId) || sa.serviceName || sa.serviceId,
          requestedQuantity: sa.requestedQuantity,
          fulfilledQuantity: sa.fulfilledQuantity,
          fulfillmentStatus: sa.fulfillmentStatus,
          unitRate: sa.rateSnapshot?.unitRate,
          unitRateFormatted: sa.rateSnapshot ? this.formatCurrency(sa.rateSnapshot.unitRate) : undefined,
          isRateCaptured: sa.rateSnapshot !== undefined,
          totalChargesCount: sa.charges.length,
          postedChargesCount: saPostedCount,
          totalChargeAmount: saTotalCharge,
          totalChargeAmountFormatted: this.formatCurrency(saTotalCharge),
        };
      });

      const conditionObservations: ConditionObservationViewModel[] = line.conditionObservations.map((obs) => ({
        id: obs.id,
        garmentLineId: obs.garmentLineId,
        observationType: obs.observationType,
        description: obs.description,
        affectedQuantity: obs.affectedQuantity,
        evidenceUris: obs.evidenceUris,
        observedByStaffId: obs.observedByStaffId,
        observedAt: obs.observedAt,
        observedAtFormatted: this.formatDate(obs.observedAt) || obs.observedAt,
      }));

      return {
        id: line.id,
        transactionId: line.transactionId,
        itemId: line.itemId,
        itemName: itemMap.get(line.itemId) || line.itemName || line.itemId,
        physicalQuantity: line.physicalQuantity,
        returnedQuantity: line.returnedQuantity,
        deliveredQuantity: line.deliveredQuantity,
        outstandingQuantity: line.physicalQuantity - line.deliveredQuantity,
        serviceAllocations: Object.freeze(serviceAllocations),
        conditionObservations: Object.freeze(conditionObservations),
        notes: line.notes,
      };
    });

    const returns: ReturnRecordViewModel[] = tx.returns.map((ret) => ({
      id: ret.id,
      transactionId: ret.transactionId,
      returnedAt: ret.returnedAt,
      returnedAtFormatted: this.formatDate(ret.returnedAt) || ret.returnedAt,
      returnedByStaffId: ret.returnedByStaffId,
      totalReturnedPieces: ret.totalReturnedQuantity,
      returnedLines: ret.returnedLines.map((rl) => {
        const matchingLine = tx.garmentLines.find((gl) => gl.id === rl.garmentLineId);
        const itemName = matchingLine ? itemMap.get(matchingLine.itemId) || matchingLine.itemId : rl.garmentLineId;
        return {
          garmentLineId: rl.garmentLineId,
          itemName,
          returnedQuantity: rl.returnedQuantity,
        };
      }),
      notes: ret.notes,
    }));

    const deliveries: DeliveryRecordViewModel[] = tx.deliveries.map((del) => ({
      id: del.id,
      transactionId: del.transactionId,
      deliveredAt: del.deliveredAt,
      deliveredAtFormatted: this.formatDate(del.deliveredAt) || del.deliveredAt,
      deliveredByStaffId: del.deliveredByStaffId,
      totalDeliveredPieces: del.totalDeliveredQuantity,
      handoverMethod: del.handoverMethod,
      handoverMethodLabel: this.formatHandoverLabel(del.handoverMethod),
      residentPresent: del.residentPresent,
      residentVerified: del.residentVerified,
      roomNumber: del.roomNumber,
      deliveredLines: del.deliveredLines.map((dl) => {
        const matchingLine = tx.garmentLines.find((gl) => gl.id === dl.garmentLineId);
        const itemName = matchingLine ? itemMap.get(matchingLine.itemId) || matchingLine.itemId : dl.garmentLineId;
        return {
          garmentLineId: dl.garmentLineId,
          itemName,
          deliveredQuantity: dl.deliveredQuantity,
        };
      }),
      evidenceUris: del.evidenceUris,
      notes: del.notes,
    }));

    const exceptions: ExceptionViewModel[] = tx.exceptions.map((exc) => {
      const matchingLine = tx.garmentLines.find((gl) => gl.id === exc.garmentLineId);
      const itemName = matchingLine ? itemMap.get(matchingLine.itemId) || matchingLine.itemId : undefined;
      const serviceName = exc.serviceId ? serviceMap.get(exc.serviceId) || exc.serviceId : undefined;

      return {
        id: exc.id,
        transactionId: exc.transactionId,
        garmentLineId: exc.garmentLineId,
        itemName,
        serviceId: exc.serviceId,
        serviceName,
        type: exc.type,
        typeLabel: this.formatExceptionTypeLabel(exc.type),
        status: exc.status,
        statusLabel: this.formatExceptionStatusLabel(exc.status),
        description: exc.description,
        affectedQuantity: exc.affectedQuantity,
        isBlocking: exc.isBlocking,
        raisedByStaffId: exc.raisedByStaffId,
        raisedAt: exc.raisedAt,
        raisedAtFormatted: this.formatDate(exc.raisedAt) || exc.raisedAt,
        investigations: exc.investigations.map((inv) => ({
          id: inv.id,
          investigatorStaffId: inv.investigatorStaffId,
          startedAt: inv.startedAt,
          startedAtFormatted: this.formatDate(inv.startedAt) || inv.startedAt,
          findings: inv.findings,
          responsibleParty: inv.responsibleParty,
          completedAt: inv.completedAt,
          completedAtFormatted: this.formatDate(inv.completedAt),
          evidenceUris: inv.evidenceUris,
        })),
        resolution: exc.resolution
          ? {
              id: exc.resolution.id,
              outcome: exc.resolution.outcome,
              outcomeLabel: this.formatOutcomeLabel(exc.resolution.outcome),
              resolverStaffId: exc.resolution.resolverStaffId,
              resolvedAt: exc.resolution.resolvedAt,
              resolvedAtFormatted: this.formatDate(exc.resolution.resolvedAt) || exc.resolution.resolvedAt,
              resolvedQuantity: exc.resolution.resolvedQuantity,
              responsibleParty: exc.resolution.responsibleParty,
              notes: exc.resolution.notes,
            }
          : undefined,
        evidenceUris: exc.evidenceUris,
      };
    });

    const timeline = this.mapBusinessEventsToTimeline(tx);

    return {
      ...summary,
      collectionEvidence: tx.collectionEvidence
        ? {
            photoUris: tx.collectionEvidence.photoUris || [],
            collectedByStaffId: tx.collectionEvidence.collectedByStaffId,
            bagCount: tx.collectionEvidence.bagCount,
            bagTagNumbers: tx.collectionEvidence.bagTagNumbers,
            residentVerified: tx.collectionEvidence.residentVerified,
            capturedAt: tx.collectionEvidence.capturedAt,
            notes: tx.collectionEvidence.notes,
          }
        : undefined,
      isInspected: tx.isInspected,
      inspectedAt: tx.inspectedAt,
      inspectedAtFormatted: this.formatDate(tx.inspectedAt),
      inspectedByStaffId: tx.inspectedByStaffId,
      processingReleasedAt: tx.processingReleasedAt,
      processingReleasedAtFormatted: this.formatDate(tx.processingReleasedAt),
      processingReleasedByStaffId: tx.processingReleasedByStaffId,
      garmentLines: Object.freeze(garmentLines),
      returns: Object.freeze(returns),
      deliveries: Object.freeze(deliveries),
      exceptions: Object.freeze(exceptions),
      timeline: Object.freeze(timeline),
      notes: tx.notes,
    };
  }

  private mapBusinessEventsToTimeline(tx: LaundryTransaction): LaundryTimelineEventViewModel[] {
    if (!tx.businessEvents || tx.businessEvents.length === 0) {
      return [
        {
          id: `evt-${tx.id}-created`,
          title: 'Transaction Initialized',
          description: `Created for Stay ${tx.stayId}`,
          timestamp: tx.createdAt,
          timestampFormatted: this.formatDate(tx.createdAt) || tx.createdAt,
          eventType: 'TRANSACTION_CREATED',
          badgeColor: 'info',
        },
      ];
    }

    return tx.businessEvents
      .map((be, idx) => {
        let badgeColor: 'info' | 'success' | 'warning' | 'error' = 'info';
        let title = be.eventType.replace(/([A-Z])/g, ' $1').trim();

        switch (be.eventType) {
          case 'LaundryCollectionConfirmed':
            title = 'Collection Confirmed';
            badgeColor = 'info';
            break;
          case 'LaundryConditionObserved':
            title = 'Condition Observed';
            badgeColor = 'info';
            break;
          case 'LaundryProcessingReleased':
            title = 'Released to Processing';
            badgeColor = 'info';
            break;
          case 'LaundryReturned':
            title = 'Return Verified & Received';
            badgeColor = 'info';
            break;
          case 'LaundryDelivered':
            title = 'Delivery Handover Completed';
            badgeColor = 'success';
            break;
          case 'LaundryExceptionRaised':
            title = 'Operational Exception Raised';
            badgeColor = 'warning';
            break;
          case 'LaundryExceptionResolved':
            title = 'Exception Resolved';
            badgeColor = 'success';
            break;
          case 'LaundryChargeRaised':
            title = 'Charge Raised';
            badgeColor = 'info';
            break;
          case 'LaundryTransactionCompleted':
            title = 'Transaction Completed';
            badgeColor = 'success';
            break;
          case 'LaundryTransactionCancelled':
            title = 'Transaction Cancelled';
            badgeColor = 'error';
            break;
          default:
            badgeColor = 'info';
        }

        return {
          id: be.id || `evt-${tx.id}-${idx + 1}`,
          title,
          description: be.description,
          timestamp: be.timestamp,
          timestampFormatted: this.formatDate(be.timestamp) || be.timestamp,
          eventType: be.eventType,
          badgeColor,
        };
      })
      .reverse();
  }

  // --- Formatting & Cross-Domain Helpers ---

  private async buildResidentMap(): Promise<Map<string, any>> {
    const residents: any[] =
      typeof (this.residentRepo as any).getAll === 'function'
        ? await (this.residentRepo as any).getAll()
        : this.residentRepo.getAllSync();
    return new Map(residents.map((r: any) => [r.id, r]));
  }

  private async buildStayMap(): Promise<Map<string, any>> {
    const stays: any[] =
      typeof (this.stayRepo as any).getAll === 'function'
        ? await (this.stayRepo as any).getAll()
        : this.stayRepo.getAllSync();
    return new Map(stays.map((s: any) => [s.id, s]));
  }

  private buildFlatMap(): Map<string, any> {
    const flats = this.accommodationRepo.findAll();
    return new Map(flats.map((f) => [f.id, f]));
  }

  private formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  private formatDate(isoDate?: string): string | undefined {
    if (!isoDate) return undefined;
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  }

  private formatStatusLabel(status: LaundryTransactionStatus): string {
    switch (status) {
      case LaundryTransactionStatus.DRAFT:
        return 'Draft / Pending Confirmation';
      case LaundryTransactionStatus.COLLECTED:
        return 'Collected / Awaiting Inspection';
      case LaundryTransactionStatus.IN_PROCESS:
        return 'In Process';
      case LaundryTransactionStatus.RETURNED_PARTIAL:
        return 'Partially Returned';
      case LaundryTransactionStatus.RETURNED_FULL:
        return 'Returned (Full) / Ready for Delivery';
      case LaundryTransactionStatus.DELIVERED_PARTIAL:
        return 'Partially Delivered';
      case LaundryTransactionStatus.COMPLETED:
        return 'Completed';
      case LaundryTransactionStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  private formatRouteLabel(route: string): string {
    return route === 'IN_HOUSE' ? 'In-House' : 'External Vendor';
  }

  private formatHandoverLabel(method: DeliveryHandoverMethod): string {
    return method === DeliveryHandoverMethod.DIRECT_HANDOVER ? 'Direct Handover' : 'Room Placement';
  }

  private formatExceptionTypeLabel(type: LaundryExceptionType): string {
    switch (type) {
      case LaundryExceptionType.DAMAGED:
        return 'Damaged Garment';
      case LaundryExceptionType.MISSING:
        return 'Missing Garment';
      case LaundryExceptionType.EXISTING_CONDITION_DISPUTE:
        return 'Existing Condition Dispute';
      case LaundryExceptionType.WRONG_ITEM_RETURNED:
        return 'Wrong Item Returned';
      case LaundryExceptionType.IDENTITY_DISPUTE:
        return 'Identity Dispute';
      case LaundryExceptionType.SERVICE_NOT_PERFORMED:
        return 'Service Not Performed';
      case LaundryExceptionType.SERVICE_NOT_PERFORMED_AS_REQUESTED:
        return 'Service Not Performed As Requested';
      case LaundryExceptionType.QUALITY_ISSUE:
        return 'Quality Issue';
      case LaundryExceptionType.QUANTITY_DISCREPANCY:
        return 'Quantity Discrepancy';
      case LaundryExceptionType.OTHER:
        return 'Operational Exception';
      default:
        return type;
    }
  }

  private formatExceptionStatusLabel(status: LaundryExceptionStatus): string {
    switch (status) {
      case LaundryExceptionStatus.OPEN:
        return 'Open';
      case LaundryExceptionStatus.UNDER_INVESTIGATION:
        return 'Under Investigation';
      case LaundryExceptionStatus.RESOLVED:
        return 'Resolved';
      default:
        return status;
    }
  }

  private formatOutcomeLabel(outcome: ResolutionOutcome): string {
    switch (outcome) {
      case ResolutionOutcome.ITEM_RECOVERED:
        return 'Item Recovered';
      case ResolutionOutcome.SERVICE_CORRECTED:
        return 'Service Corrected / Reworked';
      case ResolutionOutcome.VENDOR_CORRECTED:
        return 'Vendor Corrected';
      case ResolutionOutcome.RESIDENT_ACCEPTED:
        return 'Resident Accepted';
      case ResolutionOutcome.PERMANENTLY_LOST:
        return 'Permanently Lost (Accounted)';
      case ResolutionOutcome.NO_ACTION_REQUIRED:
        return 'No Action Required';
      case ResolutionOutcome.OTHER:
        return 'Other';
      default:
        return outcome;
    }
  }
}

export const defaultLaundryWorkspaceCoordinator = new LaundryWorkspaceCoordinator();
