import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import { defaultLaundryRepository } from '../../infrastructure/repositories/InMemoryLaundryRepository';
import { LaundryEvidenceService, defaultLaundryEvidenceService } from './LaundryEvidenceService';
import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import type { RaiseExceptionDTO, RecordInvestigationDTO, ResolveExceptionDTO } from '../dtos/laundryDTOs';

export class LaundryExceptionService {
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
   * Raises a new operational Exception against a Laundry Transaction.
   */
  public async raiseException(dto: RaiseExceptionDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot raise exception: Transaction ID is required.');
    }
    if (!dto.staffId) {
      throw new Error('Cannot raise exception: Staff ID is required.');
    }
    if (!dto.description || dto.description.trim() === '') {
      throw new Error('Cannot raise exception: Description is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot raise exception: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.raiseException({
      garmentLineId: dto.garmentLineId,
      serviceId: dto.serviceId,
      type: dto.type,
      description: dto.description.trim(),
      affectedQuantity: dto.affectedQuantity,
      isBlocking: dto.isBlocking,
      raisedByStaffId: dto.staffId,
      evidenceUris: dto.photoUris ? [...dto.photoUris] : undefined,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }

  /**
   * Records an investigation into an active Exception.
   */
  public async recordInvestigation(dto: RecordInvestigationDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot record investigation: Transaction ID is required.');
    }
    if (!dto.exceptionId) {
      throw new Error('Cannot record investigation: Exception ID is required.');
    }
    if (!dto.investigatorStaffId) {
      throw new Error('Cannot record investigation: Investigator Staff ID is required.');
    }
    if (!dto.findings || dto.findings.trim() === '') {
      throw new Error('Cannot record investigation: Findings description is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot record investigation: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.addInvestigation(dto.exceptionId, {
      investigatorStaffId: dto.investigatorStaffId,
      findings: dto.findings.trim(),
      responsibleParty: dto.responsibleParty,
      evidenceUris: dto.photoUris ? [...dto.photoUris] : undefined,
    });

    await this.laundryRepo.save(transaction);
    return transaction;
  }

  /**
   * Resolves an active Exception with a formal outcome and accounts for resolved physical pieces.
   * Cleans up ephemeral evidence if physical completion is reached without active exceptions.
   */
  public async resolveException(dto: ResolveExceptionDTO): Promise<LaundryTransaction> {
    if (!dto.transactionId) {
      throw new Error('Cannot resolve exception: Transaction ID is required.');
    }
    if (!dto.exceptionId) {
      throw new Error('Cannot resolve exception: Exception ID is required.');
    }
    if (!dto.resolverStaffId) {
      throw new Error('Cannot resolve exception: Resolver Staff ID is required.');
    }
    if (!dto.outcome) {
      throw new Error('Cannot resolve exception: Resolution outcome is required.');
    }

    const transaction = await this.laundryRepo.findById(dto.transactionId);
    if (!transaction) {
      throw new Error(`Cannot resolve exception: Laundry Transaction '${dto.transactionId}' not found.`);
    }

    transaction.resolveException(dto.exceptionId, {
      outcome: dto.outcome,
      resolverStaffId: dto.resolverStaffId,
      resolvedQuantity: dto.resolvedQuantity,
      responsibleParty: dto.responsibleParty,
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

export const defaultLaundryExceptionService = new LaundryExceptionService();
