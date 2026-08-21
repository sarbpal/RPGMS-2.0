import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import { defaultLaundryRepository } from '../../infrastructure/repositories/InMemoryLaundryRepository';
import { LaundryEvidenceService, defaultLaundryEvidenceService } from './LaundryEvidenceService';
import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import type { RecordReturnDTO, RecordDeliveryDTO } from '../dtos/laundryDTOs';

export class LaundryDeliveryService {
  private readonly laundryRepo: LaundryRepository;
  private readonly evidenceService: LaundryEvidenceService;

  constructor(
    laundryRepo: LaundryRepository = defaultLaundryRepository,
    evidenceService: LaundryEvidenceService = defaultLaundryEvidenceService
  ) {
    this.laundryRepo = laundryRepo;
    this.evidenceService = evidenceService;
  }

  /**
   * Records physical return of garments from processing into RPGMS custody, updating custody counts.
   */
  public async recordReturn(dto: RecordReturnDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot record return: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot record return: Staff ID is required.');
    }
    if (!dto.returnedLines || dto.returnedLines.length === 0) {
      throw new Error('Cannot record return: At least one returned line must be specified.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot record return: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.recordReturn({
      returnedLines: [...dto.returnedLines],
      returnedByStaffId: dto.staffId,
      returnedAt: dto.returnedAt || new Date().toISOString(),
      notes: dto.notes,
    });

    // Fulfill services on returned lines up to returned quantity
    for (const returnedLine of dto.returnedLines) {
      const line = transaction.getGarmentLine(returnedLine.garmentLineId);
      if (line) {
        for (const sa of line.serviceAllocations) {
          const remainingToFulfill = line.returnedQuantity - sa.fulfilledQuantity;
          if (remainingToFulfill > 0) {
            transaction.recordServiceFulfillment(
              line.id,
              sa.serviceId,
              remainingToFulfill,
              line.returnedQuantity >= line.physicalQuantity ? 'FULFILLED' : 'PENDING'
            );
          }
        }
      }
    }

    await this.laundryRepo.save(transaction);
    return transaction;
  }

  /**
   * Records physical handover/delivery to resident and evaluates chargeability.
   * Cleans up ephemeral evidence if physical completion is reached without active exceptions.
   */
  public async recordDelivery(dto: RecordDeliveryDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot record delivery: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot record delivery: Staff ID is required.');
    }
    if (!dto.handoverMethod) {
      throw new Error('Cannot record delivery: Handover method is required.');
    }
    if (!dto.deliveredLines || dto.deliveredLines.length === 0) {
      throw new Error('Cannot record delivery: At least one delivered line must be specified.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot record delivery: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.recordDelivery({
      deliveredLines: [...dto.deliveredLines],
      handoverMethod: dto.handoverMethod,
      deliveredByStaffId: dto.staffId,
      deliveredAt: dto.deliveredAt || new Date().toISOString(),
      residentPresent: dto.residentPresent,
      residentVerified: dto.residentVerified,
      roomNumber: dto.roomNumber,
      evidenceUris: dto.photoUris ? [...dto.photoUris] : undefined,
      notes: dto.notes,
    });

    await this.laundryRepo.save(transaction);

    // Coordinate ephemeral evidence cleanup if physical completion is achieved
    if (transaction.totalOutstandingPhysicalPieces === 0) {
      this.evidenceService.cleanupEvidenceForCompletedTransaction(transaction);
    }

    return transaction;
  }
}

export const defaultLaundryDeliveryService = new LaundryDeliveryService();
