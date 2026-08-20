import { GarmentLine, type GarmentLineProps } from './GarmentLine';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';
import { LaundryBusinessEvent, type LaundryBusinessEventProps } from '../valueObjects/LaundryBusinessEvent';
import { CollectionEvidence, type CollectionEvidenceProps } from '../valueObjects/CollectionEvidence';
import { ProcessingRoute } from '../valueObjects/ProcessingRoute';
import { ConditionObservation, type ConditionObservationProps } from './ConditionObservation';
import { LaundryReturn, type LaundryReturnProps } from './LaundryReturn';
import { ReturnLine, type ReturnLineProps } from './ReturnLine';
import { RateSnapshot } from '../valueObjects/RateSnapshot';
import { LaundryChargeRecord } from './LaundryChargeRecord';
import type { ServiceFulfillmentStatus } from './ServiceAllocation';
import type { LaundryMasterRepository } from '../interfaces/LaundryMasterRepository';

export interface LaundryTransactionProps {
  id: string;
  stayId: string;
  residentId: string;
  status?: LaundryTransactionStatus;
  collectedAt?: string;
  collectionEvidence?: CollectionEvidence | CollectionEvidenceProps;
  isInspected?: boolean;
  inspectedAt?: string;
  inspectedByStaffId?: string;
  processingRoute?: ProcessingRoute;
  processingVendorId?: string;
  processingReleasedAt?: string;
  processingReleasedByStaffId?: string;
  returns?: (LaundryReturn | LaundryReturnProps)[];
  garmentLines?: (GarmentLine | GarmentLineProps)[];
  businessEvents?: (LaundryBusinessEvent | LaundryBusinessEventProps)[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfirmCollectionParams {
  masterRepository: LaundryMasterRepository;
  collectedByStaffId: string;
  collectionTimestamp?: string;
  photoUris?: string[];
  bagCount?: number;
  bagTagNumbers?: string[];
  residentVerified?: boolean;
  notes?: string;
}

export interface CompleteInspectionParams {
  inspectedByStaffId: string;
  inspectedAt?: string;
  notes?: string;
}

export interface ReleaseProcessingParams {
  route?: ProcessingRoute;
  vendorId?: string;
  releasedByStaffId: string;
  releasedAt?: string;
  notes?: string;
}

export interface RecordReturnParams {
  returnId?: string;
  returnedLines: (ReturnLineProps | ReturnLine)[];
  returnedByStaffId: string;
  returnedAt?: string;
  vendorId?: string;
  notes?: string;
}

export interface CustodyReconciliationResult {
  totalCollected: number;
  totalReturned: number;
  totalOutstanding: number;
  isFullyReconciled: boolean;
  hasDiscrepancy: boolean;
  status: 'PENDING_RETURN' | 'PARTIALLY_RECONCILED' | 'FULLY_RECONCILED';
  lineReconciliations: Array<{
    garmentLineId: string;
    itemId: string;
    itemName?: string;
    expectedQuantity: number;
    returnedQuantity: number;
    outstandingQuantity: number;
    isReconciled: boolean;
  }>;
}

/**
 * LaundryTransaction is the Aggregate Root representing one operational laundry relationship
 * for a resident's Stay.
 *
 * Invariants:
 * 1. Belongs to exactly one Stay and one Resident.
 * 2. Owns GarmentLine entities and controls all child state mutations.
 * 3. Physical pieces are counted once across GarmentLines.
 * 4. Collection confirmation captures immutable RateSnapshots from active master rates at collection time.
 * 5. Pre-processing inspection records immutable ConditionObservations and must precede processing release.
 * 6. Processing Route (IN_HOUSE or EXTERNAL_VENDOR) is an operational routing decision independent of pricing.
 * 7. Records physical returns, enforces piece count reconciliation, and preserves receipt history.
 * 8. Records immutable LaundryBusinessEvent audit facts.
 * 9. Evaluates BR-L-012 chargeability deterministically across ServiceAllocations.
 */
export class LaundryTransaction {
  public readonly id: string;
  public readonly stayId: string;
  public readonly residentId: string;
  private _status: LaundryTransactionStatus;
  private _collectedAt?: string;
  private _collectionEvidence?: CollectionEvidence;
  private _isInspected: boolean;
  private _inspectedAt?: string;
  private _inspectedByStaffId?: string;
  private _processingRoute?: ProcessingRoute;
  private _processingVendorId?: string;
  private _processingReleasedAt?: string;
  private _processingReleasedByStaffId?: string;
  private _returns: LaundryReturn[];
  private _garmentLines: GarmentLine[];
  private _businessEvents: LaundryBusinessEvent[];
  public readonly notes?: string;
  public readonly createdAt: string;
  private _updatedAt?: string;

  constructor(props: LaundryTransactionProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryTransaction ID cannot be empty.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('LaundryTransaction stayId cannot be empty.');
    }
    if (!props.residentId || props.residentId.trim() === '') {
      throw new Error('LaundryTransaction residentId cannot be empty.');
    }

    this.id = props.id.trim();
    this.stayId = props.stayId.trim();
    this.residentId = props.residentId.trim();
    this._status = props.status ?? LaundryTransactionStatus.DRAFT;
    this._collectedAt = props.collectedAt;
    if (props.collectionEvidence) {
      this._collectionEvidence =
        props.collectionEvidence instanceof CollectionEvidence
          ? props.collectionEvidence
          : new CollectionEvidence(props.collectionEvidence);
    }
    this._isInspected = props.isInspected ?? false;
    this._inspectedAt = props.inspectedAt;
    this._inspectedByStaffId = props.inspectedByStaffId;
    this._processingRoute = props.processingRoute;
    this._processingVendorId = props.processingVendorId;
    this._processingReleasedAt = props.processingReleasedAt;
    this._processingReleasedByStaffId = props.processingReleasedByStaffId;
    this.notes = props.notes?.trim();
    this.createdAt = props.createdAt ?? new Date().toISOString();
    this._updatedAt = props.updatedAt;

    // Initialize GarmentLines
    this._garmentLines = [];
    if (props.garmentLines && props.garmentLines.length > 0) {
      for (const gl of props.garmentLines) {
        const line = gl instanceof GarmentLine ? gl : new GarmentLine(gl);
        this.addGarmentLine(line);
      }
    }

    // Initialize Returns
    this._returns = [];
    if (props.returns && props.returns.length > 0) {
      for (const ret of props.returns) {
        const returnRecord = ret instanceof LaundryReturn ? ret : new LaundryReturn(ret);
        this._returns.push(returnRecord);
      }
    }

    // Initialize BusinessEvents
    this._businessEvents = [];
    if (props.businessEvents && props.businessEvents.length > 0) {
      for (const be of props.businessEvents) {
        const event = be instanceof LaundryBusinessEvent ? be : new LaundryBusinessEvent(be);
        this._businessEvents.push(event);
      }
    } else {
      // Record the authoritative creation event
      this.recordBusinessEvent({
        id: `EVT-${this.id}-CREATED`,
        transactionId: this.id,
        eventType: 'LaundryTransactionCreated',
        timestamp: this.createdAt,
        description: `Laundry transaction ${this.id} created for Stay ${this.stayId} in ${this._status} status.`,
        metadata: {
          stayId: this.stayId,
          residentId: this.residentId,
          initialStatus: this._status,
          initialGarmentLineCount: this._garmentLines.length,
        },
      });
    }
  }

  get status(): LaundryTransactionStatus {
    return this._status;
  }

  get collectedAt(): string | undefined {
    return this._collectedAt;
  }

  get collectionEvidence(): CollectionEvidence | undefined {
    return this._collectionEvidence;
  }

  get isInspected(): boolean {
    return this._isInspected;
  }

  get inspectedAt(): string | undefined {
    return this._inspectedAt;
  }

  get inspectedByStaffId(): string | undefined {
    return this._inspectedByStaffId;
  }

  get processingRoute(): ProcessingRoute | undefined {
    return this._processingRoute;
  }

  get processingVendorId(): string | undefined {
    return this._processingVendorId;
  }

  get processingReleasedAt(): string | undefined {
    return this._processingReleasedAt;
  }

  get processingReleasedByStaffId(): string | undefined {
    return this._processingReleasedByStaffId;
  }

  get garmentLines(): readonly GarmentLine[] {
    return [...this._garmentLines];
  }

  get returns(): readonly LaundryReturn[] {
    return [...this._returns];
  }

  get businessEvents(): readonly LaundryBusinessEvent[] {
    return [...this._businessEvents];
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  /**
   * Calculates the total physical piece count across all garment lines.
   * A physical garment is counted exactly once regardless of how many services apply to it.
   */
  get totalPhysicalPieces(): number {
    return this._garmentLines.reduce((sum, line) => sum + line.physicalQuantity, 0);
  }

  get totalCollectedPieces(): number {
    return this.totalPhysicalPieces;
  }

  get totalReturnedPieces(): number {
    return this._garmentLines.reduce((sum, line) => sum + line.returnedQuantity, 0);
  }

  get totalOutstandingReturnPieces(): number {
    return Math.max(0, this.totalCollectedPieces - this.totalReturnedPieces);
  }

  /**
   * Retrieves all authoritative LaundryChargeRecords across all GarmentLines and ServiceAllocations.
   */
  get charges(): readonly LaundryChargeRecord[] {
    const allCharges: LaundryChargeRecord[] = [];
    for (const line of this._garmentLines) {
      for (const alloc of line.serviceAllocations) {
        allCharges.push(...alloc.charges);
      }
    }
    return allCharges;
  }

  /**
   * Retrieves all ConditionObservations recorded across all GarmentLines.
   */
  get conditionObservations(): readonly ConditionObservation[] {
    const observations: ConditionObservation[] = [];
    for (const line of this._garmentLines) {
      observations.push(...line.conditionObservations);
    }
    return observations;
  }

  /**
   * Confirms physical collection of laundry into RPGMS custody (L-04).
   */
  public confirmCollection(params: ConfirmCollectionParams): void {
    if (this._status !== LaundryTransactionStatus.DRAFT) {
      throw new Error(
        `Cannot confirm collection for transaction (${this.id}) in ${this._status} status. Collection can only be confirmed from DRAFT status.`
      );
    }
    if (this._garmentLines.length === 0) {
      throw new Error(`Cannot confirm collection for transaction (${this.id}) without any GarmentLines.`);
    }

    const collectionTimestamp = params.collectionTimestamp ?? new Date().toISOString();

    // Pre-flight validation: Ensure effective rates exist for ALL service allocations
    const resolvedSnapshots: Array<{
      garmentLineId: string;
      serviceId: string;
      snapshot: RateSnapshot;
    }> = [];

    for (const line of this._garmentLines) {
      if (line.serviceAllocations.length === 0) {
        throw new Error(
          `GarmentLine (${line.id}) has no requested ServiceAllocations. Cannot confirm collection.`
        );
      }

      for (const alloc of line.serviceAllocations) {
        const effectiveRate = params.masterRepository.getEffectiveRate(
          line.itemId,
          alloc.serviceId,
          collectionTimestamp
        );

        if (!effectiveRate || !effectiveRate.isActive) {
          throw new Error(
            `Cannot confirm collection: No active effective LaundryChargeRate found for Item (${line.itemId}) and Service (${alloc.serviceId}) at timestamp (${collectionTimestamp}).`
          );
        }

        const snapshot = new RateSnapshot({
          unitRate: effectiveRate.rate,
          capturedAt: collectionTimestamp,
          chargeMasterRateId: effectiveRate.id,
          currency: 'INR',
        });

        resolvedSnapshots.push({
          garmentLineId: line.id,
          serviceId: alloc.serviceId,
          snapshot,
        });
      }
    }

    // Atomic application: Attach all resolved snapshots
    for (const item of resolvedSnapshots) {
      const line = this.getGarmentLine(item.garmentLineId)!;
      const alloc = line.getServiceAllocation(item.serviceId)!;
      alloc.attachRateSnapshot(item.snapshot);
    }

    // Attach CollectionEvidence
    this._collectionEvidence = new CollectionEvidence({
      photoUris: params.photoUris,
      collectedByStaffId: params.collectedByStaffId,
      bagCount: params.bagCount,
      bagTagNumbers: params.bagTagNumbers,
      notes: params.notes,
      residentVerified: params.residentVerified,
      capturedAt: collectionTimestamp,
    });

    this._collectedAt = collectionTimestamp;
    this._status = LaundryTransactionStatus.COLLECTED;
    this._updatedAt = collectionTimestamp;

    // Record canonical business event
    this.recordBusinessEvent({
      id: `EVT-${this.id}-COLLECTED`,
      transactionId: this.id,
      eventType: 'LaundryCollectionConfirmed',
      timestamp: collectionTimestamp,
      description: `Physical collection confirmed for transaction ${this.id} (${this.totalPhysicalPieces} piece(s) across ${this._garmentLines.length} garment line(s)).`,
      metadata: {
        stayId: this.stayId,
        residentId: this.residentId,
        collectedAt: collectionTimestamp,
        collectedByStaffId: params.collectedByStaffId,
        totalPhysicalPieces: this.totalPhysicalPieces,
        garmentLineCount: this._garmentLines.length,
        hasPhotoEvidence: Boolean(params.photoUris && params.photoUris.length > 0),
        residentVerified: params.residentVerified ?? false,
      },
    });
  }

  /**
   * Records an immutable pre-processing ConditionObservation on a specific GarmentLine (L-05).
   */
  public recordConditionObservation(props: ConditionObservationProps | ConditionObservation): ConditionObservation {
    if (this._status !== LaundryTransactionStatus.COLLECTED) {
      throw new Error(
        `Cannot record condition observation: Transaction (${this.id}) is in ${this._status} status. Pre-processing inspection can only be performed on COLLECTED transactions.`
      );
    }

    const line = this.getGarmentLine(props.garmentLineId);
    if (!line) {
      throw new Error(
        `Cannot record condition observation: GarmentLine (${props.garmentLineId}) not found on LaundryTransaction (${this.id}).`
      );
    }

    const observation = props instanceof ConditionObservation ? props : new ConditionObservation(props);
    line.addConditionObservation(observation);
    this._updatedAt = new Date().toISOString();

    // Emit canonical event
    this.recordBusinessEvent({
      id: `EVT-${this.id}-OBS-${observation.id}`,
      transactionId: this.id,
      eventType: 'LaundryConditionObserved',
      timestamp: observation.observedAt,
      description: `Condition observation recorded for GarmentLine ${observation.garmentLineId}: ${observation.description} (Affected: ${observation.affectedQuantity}).`,
      metadata: {
        stayId: this.stayId,
        residentId: this.residentId,
        observationId: observation.id,
        garmentLineId: observation.garmentLineId,
        observationType: observation.observationType,
        description: observation.description,
        affectedQuantity: observation.affectedQuantity,
        observedByStaffId: observation.observedByStaffId,
        hasEvidence: Boolean(observation.evidenceUris && observation.evidenceUris.length > 0),
      },
    });

    return observation;
  }

  /**
   * Marks pre-processing inspection as completed for the transaction (L-05).
   */
  public completeInspection(params: CompleteInspectionParams): void {
    if (this._status !== LaundryTransactionStatus.COLLECTED) {
      throw new Error(
        `Cannot complete inspection: Transaction (${this.id}) is in ${this._status} status. Inspection can only be performed on COLLECTED transactions.`
      );
    }
    if (!params.inspectedByStaffId || params.inspectedByStaffId.trim() === '') {
      throw new Error('Inspection inspectedByStaffId cannot be empty.');
    }

    this._isInspected = true;
    this._inspectedByStaffId = params.inspectedByStaffId.trim();
    this._inspectedAt = params.inspectedAt ?? new Date().toISOString();
    this._updatedAt = this._inspectedAt;
  }

  /**
   * Selects or updates the operational processing route (IN_HOUSE or EXTERNAL_VENDOR) (L-05).
   */
  public selectProcessingRoute(route: ProcessingRoute, vendorId?: string): void {
    if (this._status !== LaundryTransactionStatus.COLLECTED) {
      throw new Error(
        `Cannot select processing route: Transaction (${this.id}) is in ${this._status} status. Processing route can only be selected prior to processing release.`
      );
    }
    if (route !== ProcessingRoute.IN_HOUSE && route !== ProcessingRoute.EXTERNAL_VENDOR) {
      throw new Error(`Invalid processing route (${route}). Allowed routes: IN_HOUSE, EXTERNAL_VENDOR.`);
    }
    if (route === ProcessingRoute.EXTERNAL_VENDOR && (!vendorId || vendorId.trim() === '')) {
      throw new Error('Vendor ID is required when selecting EXTERNAL_VENDOR processing route.');
    }

    this._processingRoute = route;
    this._processingVendorId = route === ProcessingRoute.EXTERNAL_VENDOR ? vendorId?.trim() : undefined;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Releases the collected and inspected LaundryTransaction for processing (L-05).
   */
  public releaseProcessing(params: ReleaseProcessingParams): void {
    if (this._status !== LaundryTransactionStatus.COLLECTED) {
      throw new Error(
        `Cannot release processing: Transaction (${this.id}) is in ${this._status} status. Processing can only be released from COLLECTED status.`
      );
    }
    if (!this._isInspected) {
      throw new Error(
        `Cannot release processing for transaction (${this.id}) without completing pre-processing inspection.`
      );
    }

    if (params.route) {
      this.selectProcessingRoute(params.route, params.vendorId);
    }

    if (!this._processingRoute) {
      throw new Error(
        `Cannot release processing for transaction (${this.id}) without selecting a processing route (IN_HOUSE or EXTERNAL_VENDOR).`
      );
    }
    if (this._processingRoute === ProcessingRoute.EXTERNAL_VENDOR && !this._processingVendorId) {
      throw new Error(
        `Cannot release processing for transaction (${this.id}): External vendor must be specified for EXTERNAL_VENDOR route.`
      );
    }
    if (!params.releasedByStaffId || params.releasedByStaffId.trim() === '') {
      throw new Error('Processing release releasedByStaffId cannot be empty.');
    }

    const releaseTimestamp = params.releasedAt ?? new Date().toISOString();

    this._processingReleasedAt = releaseTimestamp;
    this._processingReleasedByStaffId = params.releasedByStaffId.trim();
    this._status = LaundryTransactionStatus.IN_PROCESS;
    this._updatedAt = releaseTimestamp;

    // Emit canonical business event
    this.recordBusinessEvent({
      id: `EVT-${this.id}-RELEASED`,
      transactionId: this.id,
      eventType: 'LaundryProcessingReleased',
      timestamp: releaseTimestamp,
      description: `Laundry transaction ${this.id} released for ${this._processingRoute} processing.`,
      metadata: {
        stayId: this.stayId,
        residentId: this.residentId,
        processingRoute: this._processingRoute,
        vendorId: this._processingVendorId,
        releasedByStaffId: this._processingReleasedByStaffId,
        releasedAt: releaseTimestamp,
        totalPhysicalPieces: this.totalPhysicalPieces,
        garmentLineCount: this._garmentLines.length,
        conditionObservationCount: this.conditionObservations.length,
      },
    });
  }

  /**
   * Records a physical return receipt of processed laundry into RPGMS custody (L-06).
   *
   * Invariants:
   * 1. Transaction must be in post-processing state (IN_PROCESS, RETURNED_PARTIAL, RETURNED_FULL).
   * 2. Cannot record duplicate return with identical return ID.
   * 3. Prevents over-return beyond line physical expected count.
   * 4. Updates transaction status (RETURNED_PARTIAL or RETURNED_FULL).
   * 5. Emits LaundryReturned canonical business event.
   */
  public recordReturn(params: RecordReturnParams): LaundryReturn {
    if (
      this._status !== LaundryTransactionStatus.IN_PROCESS &&
      this._status !== LaundryTransactionStatus.RETURNED_PARTIAL &&
      this._status !== LaundryTransactionStatus.RETURNED_FULL
    ) {
      throw new Error(
        `Cannot record return: Transaction (${this.id}) is in ${this._status} status. Return can only be recorded after processing release (IN_PROCESS, RETURNED_PARTIAL, or RETURNED_FULL).`
      );
    }

    const returnId = params.returnId ?? `RET-${this.id}-${String(this._returns.length + 1).padStart(2, '0')}`;

    // Idempotency: Reject duplicate return receipt ID
    if (this._returns.some((r) => r.id === returnId)) {
      throw new Error(`Return with ID (${returnId}) has already been recorded for transaction (${this.id}).`);
    }

    if (!params.returnedLines || params.returnedLines.length === 0) {
      throw new Error('Return must contain at least one returned garment line.');
    }

    // Atomic validation: Ensure all lines exist and no over-return occurs
    for (const item of params.returnedLines) {
      const line = this.getGarmentLine(item.garmentLineId);
      if (!line) {
        throw new Error(`GarmentLine (${item.garmentLineId}) not found on LaundryTransaction (${this.id}).`);
      }
      if (
        typeof item.returnedQuantity !== 'number' ||
        isNaN(item.returnedQuantity) ||
        item.returnedQuantity <= 0 ||
        !Number.isInteger(item.returnedQuantity)
      ) {
        throw new Error(`Return quantity for GarmentLine (${item.garmentLineId}) must be a positive integer.`);
      }
      if (line.returnedQuantity + item.returnedQuantity > line.physicalQuantity) {
        throw new Error(
          `Cannot return ${item.returnedQuantity} piece(s) for GarmentLine (${item.garmentLineId}). Cumulative returned quantity (${line.returnedQuantity + item.returnedQuantity}) would exceed expected physical quantity (${line.physicalQuantity}).`
        );
      }
    }

    // Apply returned quantities to GarmentLines
    for (const item of params.returnedLines) {
      const line = this.getGarmentLine(item.garmentLineId)!;
      line.recordReturnQuantity(item.returnedQuantity);
    }

    const returnTimestamp = params.returnedAt ?? new Date().toISOString();

    const returnRecord = new LaundryReturn({
      id: returnId,
      transactionId: this.id,
      returnedLines: params.returnedLines,
      returnedByStaffId: params.returnedByStaffId,
      vendorId: params.vendorId ?? this._processingVendorId,
      returnedAt: returnTimestamp,
      notes: params.notes,
    });

    this._returns.push(returnRecord);

    // Update aggregate status
    if (this.totalReturnedPieces === this.totalCollectedPieces) {
      this._status = LaundryTransactionStatus.RETURNED_FULL;
    } else {
      this._status = LaundryTransactionStatus.RETURNED_PARTIAL;
    }

    this._updatedAt = returnTimestamp;

    // Emit canonical business event
    this.recordBusinessEvent({
      id: `EVT-${this.id}-RET-${returnRecord.id}`,
      transactionId: this.id,
      eventType: 'LaundryReturned',
      timestamp: returnTimestamp,
      description: `Physical return recorded for transaction ${this.id}: ${returnRecord.totalReturnedQuantity} piece(s) received into RPGMS custody (Cumulative returned: ${this.totalReturnedPieces}/${this.totalCollectedPieces}).`,
      metadata: {
        stayId: this.stayId,
        residentId: this.residentId,
        returnId: returnRecord.id,
        returnedByStaffId: params.returnedByStaffId,
        returnedAt: returnTimestamp,
        returnedPiecesInThisReceipt: returnRecord.totalReturnedQuantity,
        cumulativeReturnedPieces: this.totalReturnedPieces,
        totalCollectedPieces: this.totalCollectedPieces,
        outstandingPieces: this.totalOutstandingReturnPieces,
        isFullyReturned: this.totalReturnedPieces === this.totalCollectedPieces,
        vendorId: params.vendorId ?? this._processingVendorId,
      },
    });

    return returnRecord;
  }

  /**
   * Evaluates and returns custody reconciliation facts comparing collected vs returned physical piece counts (L-06).
   */
  public reconcileCustody(): CustodyReconciliationResult {
    const lineReconciliations = this._garmentLines.map((line) => ({
      garmentLineId: line.id,
      itemId: line.itemId,
      itemName: line.itemName,
      expectedQuantity: line.physicalQuantity,
      returnedQuantity: line.returnedQuantity,
      outstandingQuantity: line.outstandingReturnQuantity,
      isReconciled: line.returnedQuantity === line.physicalQuantity,
    }));

    const totalCollected = this.totalCollectedPieces;
    const totalReturned = this.totalReturnedPieces;
    const totalOutstanding = this.totalOutstandingReturnPieces;
    const isFullyReconciled = totalCollected > 0 && totalReturned === totalCollected;
    const hasDiscrepancy = totalReturned > 0 && totalReturned < totalCollected;

    let status: 'PENDING_RETURN' | 'PARTIALLY_RECONCILED' | 'FULLY_RECONCILED' = 'PENDING_RETURN';
    if (isFullyReconciled) {
      status = 'FULLY_RECONCILED';
    } else if (totalReturned > 0) {
      status = 'PARTIALLY_RECONCILED';
    }

    return {
      totalCollected,
      totalReturned,
      totalOutstanding,
      isFullyReconciled,
      hasDiscrepancy,
      status,
      lineReconciliations,
    };
  }

  /**
   * Adds a GarmentLine child entity to the transaction.
   */
  public addGarmentLine(line: GarmentLine): void {
    if (line.transactionId !== this.id) {
      throw new Error(
        `GarmentLine (${line.id}) transactionId (${line.transactionId}) does not match LaundryTransaction ID (${this.id}).`
      );
    }
    const duplicate = this._garmentLines.find((gl) => gl.id === line.id);
    if (duplicate) {
      throw new Error(`GarmentLine with ID (${line.id}) already exists on LaundryTransaction (${this.id}).`);
    }
    this._garmentLines.push(line);
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Removes a GarmentLine from the transaction.
   */
  public removeGarmentLine(lineId: string): void {
    const idx = this._garmentLines.findIndex((gl) => gl.id === lineId);
    if (idx >= 0) {
      this._garmentLines.splice(idx, 1);
      this._updatedAt = new Date().toISOString();
    }
  }

  /**
   * Retrieves a specific GarmentLine by ID.
   */
  public getGarmentLine(lineId: string): GarmentLine | undefined {
    return this._garmentLines.find((gl) => gl.id === lineId);
  }

  /**
   * Records operational service fulfillment for a specific GarmentLine and Service,
   * then immediately re-evaluates BR-L-012 chargeability.
   */
  public recordServiceFulfillment(
    garmentLineId: string,
    serviceId: string,
    quantityToFulfill: number,
    status?: ServiceFulfillmentStatus
  ): LaundryChargeRecord | null {
    const line = this.getGarmentLine(garmentLineId);
    if (!line) {
      throw new Error(`GarmentLine (${garmentLineId}) not found on LaundryTransaction (${this.id}).`);
    }
    const alloc = line.getServiceAllocation(serviceId);
    if (!alloc) {
      throw new Error(
        `ServiceAllocation for service (${serviceId}) not found on GarmentLine (${garmentLineId}).`
      );
    }

    alloc.recordFulfillment(quantityToFulfill, status);
    const chargeRecord = alloc.evaluateChargeability(line.deliveredQuantity, this.id);

    if (chargeRecord) {
      this.emitChargeRaisedEvent(chargeRecord, alloc.serviceName || serviceId);
    }

    this._updatedAt = new Date().toISOString();
    return chargeRecord;
  }

  /**
   * Records physical delivery quantity for a GarmentLine,
   * then immediately re-evaluates BR-L-012 chargeability across all services on that line.
   */
  public recordDeliveryQuantity(garmentLineId: string, quantity: number): LaundryChargeRecord[] {
    const line = this.getGarmentLine(garmentLineId);
    if (!line) {
      throw new Error(`GarmentLine (${garmentLineId}) not found on LaundryTransaction (${this.id}).`);
    }

    line.recordDeliveryQuantity(quantity);
    const newCharges = line.evaluateChargeability(this.id);

    for (const chargeRecord of newCharges) {
      const alloc = line.getServiceAllocation(chargeRecord.serviceId);
      this.emitChargeRaisedEvent(chargeRecord, alloc?.serviceName || chargeRecord.serviceId);
    }

    this._updatedAt = new Date().toISOString();
    return newCharges;
  }

  /**
   * Re-evaluates BR-L-012 chargeability across all GarmentLines and ServiceAllocations.
   * Useful for periodic or event-driven aggregate reconciliation.
   */
  public evaluateChargeability(): LaundryChargeRecord[] {
    const generatedCharges: LaundryChargeRecord[] = [];
    for (const line of this._garmentLines) {
      const lineCharges = line.evaluateChargeability(this.id);
      for (const chargeRecord of lineCharges) {
        const alloc = line.getServiceAllocation(chargeRecord.serviceId);
        this.emitChargeRaisedEvent(chargeRecord, alloc?.serviceName || chargeRecord.serviceId);
        generatedCharges.push(chargeRecord);
      }
    }

    if (generatedCharges.length > 0) {
      this._updatedAt = new Date().toISOString();
    }
    return generatedCharges;
  }

  /**
   * Appends an immutable LaundryBusinessEvent to the transaction history.
   */
  public recordBusinessEvent(eventProps: LaundryBusinessEventProps): void {
    const event = new LaundryBusinessEvent(eventProps);
    if (event.transactionId !== this.id) {
      throw new Error(
        `BusinessEvent (${event.id}) transactionId (${event.transactionId}) does not match LaundryTransaction ID (${this.id}).`
      );
    }
    this._businessEvents.push(event);
    this._updatedAt = new Date().toISOString();
  }

  private emitChargeRaisedEvent(chargeRecord: LaundryChargeRecord, serviceDisplayName: string): void {
    this.recordBusinessEvent({
      id: `EVT-${this.id}-CHG-${chargeRecord.businessChargeId}`,
      transactionId: this.id,
      eventType: 'LaundryChargeRaised',
      timestamp: chargeRecord.calculatedAt,
      description: `Charge raised for ${serviceDisplayName}: ${chargeRecord.quantity} unit(s) at rate ₹${chargeRecord.unitRate} (Total: ₹${chargeRecord.totalAmount}).`,
      metadata: {
        stayId: this.stayId,
        residentId: this.residentId,
        businessChargeId: chargeRecord.businessChargeId,
        garmentLineId: chargeRecord.garmentLineId,
        serviceId: chargeRecord.serviceId,
        bracketIndex: chargeRecord.bracketIndex,
        chargeableQuantity: chargeRecord.quantity,
        unitRate: chargeRecord.unitRate,
        totalAmount: chargeRecord.totalAmount,
        currency: chargeRecord.currency,
      },
    });
  }

  public toJSON(): LaundryTransactionProps {
    return {
      id: this.id,
      stayId: this.stayId,
      residentId: this.residentId,
      status: this._status,
      collectedAt: this._collectedAt,
      collectionEvidence: this._collectionEvidence?.toJSON(),
      isInspected: this._isInspected,
      inspectedAt: this._inspectedAt,
      inspectedByStaffId: this._inspectedByStaffId,
      processingRoute: this._processingRoute,
      processingVendorId: this._processingVendorId,
      processingReleasedAt: this._processingReleasedAt,
      processingReleasedByStaffId: this._processingReleasedByStaffId,
      returns: this._returns.map((r) => r.toJSON()),
      garmentLines: this._garmentLines.map((gl) => gl.toJSON()),
      businessEvents: this._businessEvents.map((be) => be.toJSON()),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
