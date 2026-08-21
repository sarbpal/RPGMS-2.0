import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import type { LaundryMasterRepository } from '../../domain/interfaces/LaundryMasterRepository';
import { defaultLaundryRepository } from '../../infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import { GarmentLine } from '../../domain/entities/GarmentLine';
import { ServiceAllocation } from '../../domain/entities/ServiceAllocation';
import { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';
import type { CreateCollectionDraftDTO, ConfirmCollectionDTO } from '../dtos/laundryDTOs';

export class LaundryCollectionService {
  private readonly laundryRepo: LaundryRepository;
  private readonly masterRepo: LaundryMasterRepository;

  constructor(
    laundryRepo: LaundryRepository = defaultLaundryRepository,
    masterRepo: LaundryMasterRepository = defaultLaundryMasterRepository
  ) {
    this.laundryRepo = laundryRepo;
    this.masterRepo = masterRepo;
  }

  /**
   * Creates a new draft Laundry Transaction with grouped GarmentLines and requested Services.
   */
  public async createCollectionDraft(dto: CreateCollectionDraftDTO): Promise<LaundryTransaction> {
    if (!dto.stayId || dto.stayId.trim() === '') {
      throw new Error('Cannot create collection draft: Stay ID is required.');
    }
    if (!dto.residentId || dto.residentId.trim() === '') {
      throw new Error('Cannot create collection draft: Resident ID is required.');
    }
    if (!dto.garmentLines || dto.garmentLines.length === 0) {
      throw new Error('Cannot create collection draft: At least one Garment Line is required.');
    }

    const nowIso = new Date().toISOString();
    const allTransactions = await this.laundryRepo.getAll();
    const seq = allTransactions.length + 1;
    const year = new Date().getFullYear();
    const transactionId = `LTX-${year}-${String(seq).padStart(4, '0')}`;

    const items = this.masterRepo.getItems();
    const services = this.masterRepo.getServices();
    const itemMap = new Map(items.map((i) => [i.id, i.name]));
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));

    const garmentLines: GarmentLine[] = dto.garmentLines.map((lineDto, lineIdx) => {
      const lineId = `GL-${transactionId}-${lineIdx + 1}`;
      const itemName = itemMap.get(lineDto.itemId) || lineDto.itemId;

      const serviceAllocations: ServiceAllocation[] = (lineDto.serviceIds || []).map((serviceId, srvIdx) => {
        const srvId = `SA-${lineId}-${srvIdx + 1}`;
        const serviceName = serviceMap.get(serviceId) || serviceId;

        return new ServiceAllocation({
          id: srvId,
          garmentLineId: lineId,
          serviceId,
          serviceName,
          requestedQuantity: lineDto.physicalQuantity,
          fulfilledQuantity: 0,
          fulfillmentStatus: 'PENDING',
          createdAt: nowIso,
        });
      });

      return new GarmentLine({
        id: lineId,
        transactionId,
        itemId: lineDto.itemId,
        itemName,
        physicalQuantity: lineDto.physicalQuantity,
        returnedQuantity: 0,
        deliveredQuantity: 0,
        serviceAllocations,
        notes: lineDto.notes,
        createdAt: nowIso,
      });
    });

    const transaction = new LaundryTransaction({
      id: transactionId,
      stayId: dto.stayId.trim(),
      residentId: dto.residentId.trim(),
      status: LaundryTransactionStatus.DRAFT,
      garmentLines,
      notes: dto.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }

  /**
   * Confirms collection, establishing the baseline piece counts and capturing immutable RateSnapshots.
   */
  public async confirmCollection(dto: ConfirmCollectionDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot confirm collection: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot confirm collection: Staff ID is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot confirm collection: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.confirmCollection({
      masterRepository: this.masterRepo,
      collectedByStaffId: dto.staffId,
      collectionTimestamp: dto.collectionTimestamp || new Date().toISOString(),
      bagCount: dto.bagCount,
      bagTagNumbers: dto.bagTagNumbers ? [...dto.bagTagNumbers] : undefined,
      photoUris: dto.photoUris ? [...dto.photoUris] : undefined,
      residentVerified: dto.residentVerified,
      notes: dto.notes,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }
}

export const defaultLaundryCollectionService = new LaundryCollectionService();
