import type { ProcessingRoute } from '../../domain/valueObjects/ProcessingRoute';
import type { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import type { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import type { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';
import type { ResponsibleParty } from '../../domain/valueObjects/ResponsibleParty';

export interface GarmentLineDraftDTO {
  readonly itemId: string;
  readonly physicalQuantity: number;
  readonly serviceIds: readonly string[];
  readonly notes?: string;
}

export interface CreateCollectionDraftDTO {
  readonly stayId: string;
  readonly residentId: string;
  readonly garmentLines: readonly GarmentLineDraftDTO[];
  readonly notes?: string;
}

export interface ConfirmCollectionDTO {
  readonly transactionId: string;
  readonly staffId: string;
  readonly collectionTimestamp?: string;
  readonly bagCount?: number;
  readonly bagTagNumbers?: readonly string[];
  readonly photoUris?: readonly string[];
  readonly residentVerified?: boolean;
  readonly notes?: string;
}

export interface CancelCollectionDTO {
  readonly transactionId: string;
  readonly staffId: string;
  readonly reason: string;
  readonly cancelledAt?: string;
}

export interface ConditionObservationInputDTO {
  readonly garmentLineId: string;
  readonly observationType: string;
  readonly description: string;
  readonly affectedQuantity: number;
  readonly photoUris?: readonly string[];
}

export interface RecordInspectionDTO {
  readonly transactionId: string;
  readonly staffId: string;
  readonly inspectedAt?: string;
  readonly conditionObservations?: readonly ConditionObservationInputDTO[];
  readonly notes?: string;
}

export interface ReleaseProcessingDTO {
  readonly transactionId: string;
  readonly route: ProcessingRoute;
  readonly vendorId?: string;
  readonly staffId: string;
  readonly releasedAt?: string;
  readonly notes?: string;
}

export interface ReturnedLineDTO {
  readonly garmentLineId: string;
  readonly returnedQuantity: number;
}

export interface RecordReturnDTO {
  readonly transactionId: string;
  readonly staffId: string;
  readonly returnedAt?: string;
  readonly returnedLines: readonly ReturnedLineDTO[];
  readonly notes?: string;
}

export interface DeliveredLineDTO {
  readonly garmentLineId: string;
  readonly deliveredQuantity: number;
}

export interface RecordDeliveryDTO {
  readonly transactionId: string;
  readonly staffId: string;
  readonly deliveredAt?: string;
  readonly deliveredLines: readonly DeliveredLineDTO[];
  readonly handoverMethod: DeliveryHandoverMethod;
  readonly residentPresent?: boolean;
  readonly residentVerified?: boolean;
  readonly roomNumber?: string;
  readonly photoUris?: readonly string[];
  readonly notes?: string;
}

export interface RaiseExceptionDTO {
  readonly transactionId: string;
  readonly garmentLineId?: string;
  readonly serviceId?: string;
  readonly type: LaundryExceptionType;
  readonly description: string;
  readonly affectedQuantity: number;
  readonly isBlocking?: boolean;
  readonly staffId: string;
  readonly photoUris?: readonly string[];
}

export interface RecordInvestigationDTO {
  readonly transactionId: string;
  readonly exceptionId: string;
  readonly investigatorStaffId: string;
  readonly findings: string;
  readonly responsibleParty?: ResponsibleParty;
  readonly photoUris?: readonly string[];
}

export interface ResolveExceptionDTO {
  readonly transactionId: string;
  readonly exceptionId: string;
  readonly outcome: ResolutionOutcome;
  readonly resolverStaffId: string;
  readonly resolvedQuantity: number;
  readonly responsibleParty?: ResponsibleParty;
  readonly notes?: string;
}

export interface PostChargesDTO {
  readonly transactionId: string;
  readonly staffId: string;
}

export interface LaundryWorkspaceFilters {
  readonly searchQuery?: string;
  readonly status?: string;
  readonly processingRoute?: string;
  readonly hasExceptions?: boolean;
  readonly stayId?: string;
  readonly residentId?: string;
}
