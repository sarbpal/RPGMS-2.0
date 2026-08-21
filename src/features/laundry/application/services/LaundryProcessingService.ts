import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import { defaultLaundryRepository } from '../../infrastructure/repositories/InMemoryLaundryRepository';
import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import type { RecordInspectionDTO, ReleaseProcessingDTO } from '../dtos/laundryDTOs';

export class LaundryProcessingService {
  private readonly laundryRepo: LaundryRepository;

  constructor(laundryRepo: LaundryRepository = defaultLaundryRepository) {
    this.laundryRepo = laundryRepo;
  }

  /**
   * Records garment inspection and condition observations prior to processing release.
   */
  public async recordInspection(dto: RecordInspectionDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot record inspection: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot record inspection: Staff ID is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot record inspection: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    const timestamp = dto.inspectedAt || new Date().toISOString();

    if (dto.conditionObservations && dto.conditionObservations.length > 0) {
      for (let i = 0; i < dto.conditionObservations.length; i++) {
        const obsDto = dto.conditionObservations[i];
        const obsId = `OBS-${dto.transactionId}-${i + 1}`;
        transaction.recordConditionObservation({
          id: obsId,
          garmentLineId: obsDto.garmentLineId,
          observationType: obsDto.observationType,
          description: obsDto.description,
          affectedQuantity: obsDto.affectedQuantity,
          evidenceUris: obsDto.photoUris ? [...obsDto.photoUris] : undefined,
          observedByStaffId: dto.staffId,
          observedAt: timestamp,
        });
      }
    }

    transaction.completeInspection({
      inspectedByStaffId: dto.staffId,
      inspectedAt: timestamp,
      notes: dto.notes,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }

  /**
   * Selects processing route (In-House vs External Vendor) and releases transaction to processing.
   */
  public async releaseProcessing(dto: ReleaseProcessingDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot release processing: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot release processing: Staff ID is required.');
    }
    if (!dto.route) {
      throw new Error('Cannot release processing: Processing route is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot release processing: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.releaseProcessing({
      route: dto.route,
      vendorId: dto.vendorId,
      releasedByStaffId: dto.staffId,
      releasedAt: dto.releasedAt || new Date().toISOString(),
      notes: dto.notes,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }
}

export const defaultLaundryProcessingService = new LaundryProcessingService();
