import type { ProcessingRoute } from '../../domain/valueObjects/ProcessingRoute';
import type { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';
import type { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import type { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import type { LaundryExceptionStatus } from '../../domain/valueObjects/LaundryExceptionStatus';
import type { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';
import type { ResponsibleParty } from '../../domain/valueObjects/ResponsibleParty';
import type { LaundryWorkspaceFilters } from '../dtos/laundryDTOs';

export interface LaundryWorkspaceMetricsViewModel {
  readonly totalActive: number;
  readonly awaitingCollectionConfirmation: number;
  readonly awaitingInspection: number;
  readonly inProcessExternal: number;
  readonly inProcessInHouse: number;
  readonly returnedAwaitingDelivery: number;
  readonly partiallyDelivered: number;
  readonly openExceptionsCount: number;
  readonly unpostedChargesCount: number;
}

export interface LaundryItemViewModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly isActive: boolean;
}

export interface LaundryServiceViewModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
}

export interface LaundryRateViewModel {
  readonly id: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly rate: number;
  readonly rateFormatted: string;
  readonly effectiveFrom: string;
  readonly isActive: boolean;
}

export interface LaundryMasterCatalogViewModel {
  readonly items: readonly LaundryItemViewModel[];
  readonly services: readonly LaundryServiceViewModel[];
  readonly chargeRates: readonly LaundryRateViewModel[];
}

export interface SelectableLaundryStayItem {
  readonly stayId: string;
  readonly residentId: string;
  readonly residentName: string;
  readonly residentCode: string;
  readonly flatId: string;
  readonly flatName: string;
  readonly bedNumber?: string;
  readonly roomNumber?: string;
  readonly locationSummary: string;
  readonly status: string;
  readonly checkInDate: string;
}

export interface CollectionEvidenceViewModel {
  readonly photoUris: readonly string[];
  readonly collectedByStaffId: string;
  readonly bagCount?: number;
  readonly bagTagNumbers?: readonly string[];
  readonly residentVerified?: boolean;
  readonly capturedAt: string;
  readonly notes?: string;
}

export interface ConditionObservationViewModel {
  readonly id: string;
  readonly garmentLineId: string;
  readonly observationType?: string;
  readonly description: string;
  readonly affectedQuantity: number;
  readonly evidenceUris?: readonly string[];
  readonly observedByStaffId: string;
  readonly observedAt: string;
  readonly observedAtFormatted: string;
}

export interface LaundryChargeRecordViewModel {
  readonly id: string;
  readonly businessChargeId: string;
  readonly transactionId: string;
  readonly garmentLineId: string;
  readonly itemName?: string;
  readonly serviceId: string;
  readonly serviceName?: string;
  readonly bracketIndex: number;
  readonly quantity: number;
  readonly unitRate: number;
  readonly unitRateFormatted: string;
  readonly totalAmount: number;
  readonly totalAmountFormatted: string;
  readonly currency: string;
  readonly calculatedAt: string;
  readonly calculatedAtFormatted: string;
  readonly status: 'PENDING_POSTING' | 'POSTED';
  readonly statusLabel: string;
  readonly financeBillId?: string;
  readonly postedAt?: string;
  readonly postedAtFormatted?: string;
}

export interface ServiceAllocationViewModel {
  readonly id: string;
  readonly garmentLineId: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly requestedQuantity: number;
  readonly fulfilledQuantity: number;
  readonly fulfillmentStatus: string;
  readonly unitRate?: number;
  readonly unitRateFormatted?: string;
  readonly isRateCaptured: boolean;
  readonly totalChargesCount: number;
  readonly postedChargesCount: number;
  readonly totalChargeAmount: number;
  readonly totalChargeAmountFormatted: string;
  readonly charges: readonly LaundryChargeRecordViewModel[];
}

export interface GarmentLineViewModel {
  readonly id: string;
  readonly transactionId: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly physicalQuantity: number;
  readonly returnedQuantity: number;
  readonly deliveredQuantity: number;
  readonly outstandingQuantity: number;
  readonly serviceAllocations: readonly ServiceAllocationViewModel[];
  readonly conditionObservations: readonly ConditionObservationViewModel[];
  readonly notes?: string;
}

export interface ReturnRecordViewModel {
  readonly id: string;
  readonly transactionId: string;
  readonly returnedAt: string;
  readonly returnedAtFormatted: string;
  readonly returnedByStaffId: string;
  readonly totalReturnedPieces: number;
  readonly returnedLines: readonly {
    readonly garmentLineId: string;
    readonly itemName: string;
    readonly returnedQuantity: number;
  }[];
  readonly notes?: string;
}

export interface DeliveryRecordViewModel {
  readonly id: string;
  readonly transactionId: string;
  readonly deliveredAt: string;
  readonly deliveredAtFormatted: string;
  readonly deliveredByStaffId: string;
  readonly totalDeliveredPieces: number;
  readonly handoverMethod: DeliveryHandoverMethod;
  readonly handoverMethodLabel: string;
  readonly residentPresent: boolean;
  readonly residentVerified: boolean;
  readonly roomNumber?: string;
  readonly deliveredLines: readonly {
    readonly garmentLineId: string;
    readonly itemName: string;
    readonly deliveredQuantity: number;
  }[];
  readonly evidenceUris?: readonly string[];
  readonly notes?: string;
}

export interface ExceptionInvestigationViewModel {
  readonly id: string;
  readonly investigatorStaffId: string;
  readonly startedAt: string;
  readonly startedAtFormatted: string;
  readonly findings: string;
  readonly responsibleParty?: ResponsibleParty;
  readonly completedAt?: string;
  readonly completedAtFormatted?: string;
  readonly evidenceUris?: readonly string[];
}

export interface ExceptionResolutionViewModel {
  readonly id: string;
  readonly outcome: ResolutionOutcome;
  readonly outcomeLabel: string;
  readonly resolverStaffId: string;
  readonly resolvedAt: string;
  readonly resolvedAtFormatted: string;
  readonly resolvedQuantity?: number;
  readonly responsibleParty?: ResponsibleParty;
  readonly notes?: string;
}

export interface ExceptionViewModel {
  readonly id: string;
  readonly transactionId: string;
  readonly garmentLineId?: string;
  readonly itemName?: string;
  readonly serviceId?: string;
  readonly serviceName?: string;
  readonly type: LaundryExceptionType;
  readonly typeLabel: string;
  readonly status: LaundryExceptionStatus;
  readonly statusLabel: string;
  readonly description: string;
  readonly affectedQuantity: number;
  readonly isBlocking: boolean;
  readonly raisedByStaffId: string;
  readonly raisedAt: string;
  readonly raisedAtFormatted: string;
  readonly investigations: readonly ExceptionInvestigationViewModel[];
  readonly resolution?: ExceptionResolutionViewModel;
  readonly evidenceUris?: readonly string[];
}

export interface LaundryTimelineEventViewModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly timestampFormatted: string;
  readonly eventType: string;
  readonly badgeColor: 'info' | 'success' | 'warning' | 'error';
}

export interface LaundryTransactionSummaryViewModel {
  readonly id: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentName: string;
  readonly residentCode: string;
  readonly locationSummary: string;
  readonly status: LaundryTransactionStatus;
  readonly statusLabel: string;
  readonly processingRoute?: ProcessingRoute;
  readonly processingRouteLabel?: string;
  readonly processingVendorId?: string;
  readonly totalPhysicalPieces: number;
  readonly totalReturnedPieces: number;
  readonly totalDeliveredPieces: number;
  readonly totalResolvedPieces: number;
  readonly totalOutstandingPieces: number;
  readonly hasOpenExceptions: boolean;
  readonly openExceptionsCount: number;
  readonly totalEstimatedAmount: number;
  readonly totalEstimatedAmountFormatted: string;
  readonly totalPostedAmount: number;
  readonly totalPostedAmountFormatted: string;
  readonly unpostedChargesCount: number;
  readonly hasUnpostedCharges: boolean;
  readonly isFullyChargedAndPosted: boolean;
  readonly collectedAt?: string;
  readonly collectedAtFormatted?: string;
  readonly createdAt: string;
  readonly createdAtFormatted: string;
}

export interface LaundryTransactionDetailViewModel extends LaundryTransactionSummaryViewModel {
  readonly collectionEvidence?: CollectionEvidenceViewModel;
  readonly isInspected: boolean;
  readonly inspectedAt?: string;
  readonly inspectedAtFormatted?: string;
  readonly inspectedByStaffId?: string;
  readonly processingReleasedAt?: string;
  readonly processingReleasedAtFormatted?: string;
  readonly processingReleasedByStaffId?: string;
  readonly garmentLines: readonly GarmentLineViewModel[];
  readonly charges: readonly LaundryChargeRecordViewModel[];
  readonly returns: readonly ReturnRecordViewModel[];
  readonly deliveries: readonly DeliveryRecordViewModel[];
  readonly exceptions: readonly ExceptionViewModel[];
  readonly timeline: readonly LaundryTimelineEventViewModel[];
  readonly notes?: string;
}

export interface PostedChargeRecordViewModel {
  readonly businessChargeId: string;
  readonly garmentLineId: string;
  readonly serviceId: string;
  readonly serviceName?: string;
  readonly quantity: number;
  readonly unitRate: number;
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: string;
  readonly financeBillId?: string;
  readonly postedAt?: string;
}

export interface PostChargesResultViewModel {
  readonly transactionId: string;
  readonly success: boolean;
  readonly postedChargesCount: number;
  readonly totalAmountPosted: number;
  readonly totalAmountPostedFormatted: string;
  readonly charges: readonly PostedChargeRecordViewModel[];
  readonly failureReason?: string;
}

export interface LaundryWorkspaceViewModel {
  readonly metrics: LaundryWorkspaceMetricsViewModel;
  readonly transactions: readonly LaundryTransactionSummaryViewModel[];
  readonly masterCatalog: LaundryMasterCatalogViewModel;
  readonly filters: LaundryWorkspaceFilters;
  readonly totalCount: number;
}
