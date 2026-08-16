import type { Reservation, ReservationTokenDisposition, ReservationAuditEntry } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/interfaces/ReservationRepository';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';
import {
  formatReservationNumber,
  validateReservationDraft,
  canEditReservation,
  canConvertReservation,
  canTransitionStatus,
  validateReservationCancellation,
} from '../../domain/rules/reservationRules';

import { defaultReservationRepository } from '../../infrastructure/repositories/InMemoryReservationRepository';
import type { CreateReservationDTO } from '../dtos/CreateReservationDTO';
import type { UpdateReservationDTO } from '../dtos/UpdateReservationDTO';
import type { CancelReservationDTO } from '../dtos/CancelReservationDTO';

export class ReservationUseCases {
  private repository: ReservationRepository;

  constructor(repository: ReservationRepository = defaultReservationRepository) {
    this.repository = repository;
  }


  /**
   * Application Use Case: Checks for an active reservation with the given mobile number.
   * Belongs in Application Layer because it requires repository access.
   */
  public checkDuplicateMobileSync(mobileNumber: string): {
    hasDuplicate: boolean;
    existingReservation?: Reservation;
    warning?: string;
  } {
    const existing = this.repository.findActiveByMobileSync(mobileNumber);
    if (existing) {
      return {
        hasDuplicate: true,
        existingReservation: existing,
        warning: `An ACTIVE reservation (${existing.reservationNumber} for ${existing.prospectName}) already exists for mobile number ${existing.mobileNumber}.`,
      };
    }
    return { hasDuplicate: false };
  }

  public async checkDuplicateMobile(mobileNumber: string): Promise<{
    hasDuplicate: boolean;
    existingReservation?: Reservation;
    warning?: string;
  }> {
    return this.checkDuplicateMobileSync(mobileNumber);
  }

  /**
   * Application Use Case: Create a new Reservation.
   */
  public createReservationSync(dto: CreateReservationDTO): Reservation {
    const validation = validateReservationDraft(
      dto.prospectName,
      dto.mobileNumber,
      dto.expectedJoiningDate
    );
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(' ');
      throw new Error(`Reservation creation failed: ${errorMsg}`);
    }

    const all = this.repository.findAllSync();
    const sequenceNumber = all.length + 1;
    const reservationNumber = formatReservationNumber(sequenceNumber);
    const nowIso = new Date().toISOString();

    const newReservation: Reservation = {
      id: `resv-${String(sequenceNumber).padStart(6, '0')}`,
      reservationNumber,
      prospectName: dto.prospectName.trim(),
      mobileNumber: dto.mobileNumber.trim().replace(/\D/g, ''),
      expectedJoiningDate: dto.expectedJoiningDate,
      expectedMonthlyRent: dto.expectedMonthlyRent,
      expectedSecurityDeposit: dto.expectedSecurityDeposit,
      accommodationPreference: dto.accommodationPreference?.trim() || undefined,
      tokenAmount: typeof dto.tokenAmount === 'number' ? dto.tokenAmount : undefined,
      tokenReceivedOn: dto.tokenReceivedOn || undefined,
      tokenRemarks: dto.tokenRemarks?.trim() || undefined,
      status: ReservationStatus.ACTIVE,
      notes: dto.notes?.trim() || undefined,
      auditLog: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return this.repository.saveSync(newReservation);
  }

  public async createReservation(dto: CreateReservationDTO): Promise<Reservation> {
    return this.createReservationSync(dto);
  }

  /**
   * Application Use Case: Update an existing Reservation.
   */
  public updateReservationSync(id: string, dto: UpdateReservationDTO): Reservation {
    const existing = this.repository.findByIdSync(id);
    if (!existing) {
      throw new Error(`Reservation with ID ${id} not found.`);
    }

    const editCheck = canEditReservation(existing.status);
    if (!editCheck.allowed) {
      throw new Error(editCheck.reason);
    }

    const prospectName = dto.prospectName !== undefined ? dto.prospectName : existing.prospectName;
    const mobileNumber = dto.mobileNumber !== undefined ? dto.mobileNumber : existing.mobileNumber;
    const expectedJoiningDate = dto.expectedJoiningDate !== undefined ? dto.expectedJoiningDate : existing.expectedJoiningDate;

    const validation = validateReservationDraft(prospectName, mobileNumber, expectedJoiningDate);
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(' ');
      throw new Error(`Reservation update failed: ${errorMsg}`);
    }

    const nowIso = new Date().toISOString();
    const updated: Reservation = {
      ...existing,
      prospectName: prospectName.trim(),
      mobileNumber: mobileNumber.trim().replace(/\D/g, ''),
      expectedJoiningDate,
      expectedMonthlyRent: dto.expectedMonthlyRent !== undefined ? dto.expectedMonthlyRent : existing.expectedMonthlyRent,
      expectedSecurityDeposit: dto.expectedSecurityDeposit !== undefined ? dto.expectedSecurityDeposit : existing.expectedSecurityDeposit,
      accommodationPreference: dto.accommodationPreference !== undefined ? dto.accommodationPreference?.trim() : existing.accommodationPreference,
      tokenAmount: dto.tokenAmount !== undefined ? dto.tokenAmount : existing.tokenAmount,
      tokenReceivedOn: dto.tokenReceivedOn !== undefined ? dto.tokenReceivedOn : existing.tokenReceivedOn,
      tokenRemarks: dto.tokenRemarks !== undefined ? dto.tokenRemarks?.trim() : existing.tokenRemarks,
      notes: dto.notes !== undefined ? dto.notes?.trim() : existing.notes,
      updatedAt: nowIso,
    };

    return this.repository.saveSync(updated);
  }

  public async updateReservation(id: string, dto: UpdateReservationDTO): Promise<Reservation> {
    return this.updateReservationSync(id, dto);
  }

  /**
   * Application Use Case: Cancel a Reservation.
   */
  public cancelReservationSync(id: string, dto?: CancelReservationDTO): Reservation {
    const existing = this.repository.findByIdSync(id);
    if (!existing) {
      throw new Error(`Reservation with ID ${id} not found.`);
    }

    const cancelValidation = validateReservationCancellation(
      existing,
      dto?.reason,
      dto?.tokenDisposition
    );
    if (!cancelValidation.isValid) {
      throw new Error(cancelValidation.error);
    }

    const transitionCheck = canTransitionStatus(existing.status, ReservationStatus.CANCELLED);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    const nowIso = new Date().toISOString();
    const hasToken = typeof existing.tokenAmount === 'number' && existing.tokenAmount > 0;

    let tokenDisposition: ReservationTokenDisposition | undefined = undefined;
    if (hasToken && dto?.tokenDisposition) {
      tokenDisposition = {
        outcome: dto.tokenDisposition,
        amount: existing.tokenAmount!,
        decidedOn: nowIso,
      };
    }


    const trimmedReason = dto!.reason.trim();
    let auditDetails = `Reservation cancelled. Reason: ${trimmedReason}.`;
    if (tokenDisposition) {
      auditDetails += ` Token disposition: ${tokenDisposition.outcome}. Token amount: ₹${tokenDisposition.amount.toLocaleString('en-IN')}.`;
    }

    const auditEntry: ReservationAuditEntry = {
      timestamp: nowIso,
      action: 'Reservation Cancelled',
      performedBy: 'System Operator',
      details: auditDetails,
    };

    const cancelled: Reservation = {
      ...existing,
      status: ReservationStatus.CANCELLED,
      cancelledAt: nowIso,
      cancellationReason: trimmedReason,
      tokenDisposition,
      auditLog: [...(existing.auditLog || []), auditEntry],
      updatedAt: nowIso,
    };

    return this.repository.saveSync(cancelled);
  }

  public async cancelReservation(id: string, dto?: CancelReservationDTO): Promise<Reservation> {
    return this.cancelReservationSync(id, dto);
  }


  /**
   * Application Use Case: Convert a Reservation upon Admission.
   */
  public convertReservationSync(id: string): Reservation {
    const existing = this.repository.findByIdSync(id);
    if (!existing) {
      throw new Error(`Reservation with ID ${id} not found.`);
    }

    const convertCheck = canConvertReservation(existing.status);
    if (!convertCheck.allowed) {
      throw new Error(convertCheck.reason);
    }

    const transitionCheck = canTransitionStatus(existing.status, ReservationStatus.CONVERTED);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    const nowIso = new Date().toISOString();
    const converted: Reservation = {
      ...existing,
      status: ReservationStatus.CONVERTED,
      updatedAt: nowIso,
    };

    return this.repository.saveSync(converted);
  }

  public async convertReservation(id: string): Promise<Reservation> {
    return this.convertReservationSync(id);
  }

  /**
   * Application Use Case: List all Reservations.
   */
  public listReservationsSync(): Reservation[] {
    return this.repository.findAllSync();
  }

  public async listReservations(): Promise<Reservation[]> {
    return this.repository.findAll();
  }

  /**
   * Application Use Case: Get Reservation by ID.
   */
  public getReservationByIdSync(id: string): Reservation | null {
    return this.repository.findByIdSync(id);
  }

  public async getReservationById(id: string): Promise<Reservation | null> {
    return this.repository.findById(id);
  }
}
