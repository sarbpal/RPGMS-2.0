import type { Reservation, ReservationAuditEntry } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/interfaces/ReservationRepository';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';
import {
  formatReservationNumber,
  validateReservationDraft,
  checkDuplicateMobile as domainCheckDuplicateMobile,
  canEditReservation,
  canCancelReservation,
  isReservationFollowUpRequired,
} from '../../domain/rules/reservationRules';
import { InMemoryReservationRepository } from '../../infrastructure/repositories/InMemoryReservationRepository';
import type { ReservationDraft } from '../models/ReservationDraft';
import type { ReservationWorkspaceViewModel, ReservationStats } from '../models/ReservationWorkspaceViewModel';

export class ReservationWorkspaceCoordinator {
  private repository: ReservationRepository;

  constructor(repository: ReservationRepository = new InMemoryReservationRepository()) {
    this.repository = repository;
  }

  /**
   * Load reservations from repository and construct ViewModel.
   * Pure read-only operation with zero synthetic status mutations.
   */
  public loadWorkspace(searchQuery: string = '', statusFilter: string = 'ALL'): ReservationWorkspaceViewModel {
    const allReservations = this.repository.findAllSync();
    return this.createViewModel(allReservations, searchQuery, statusFilter);
  }

  /**
   * Decision Support check for duplicate active reservation by mobile number (BR-RESV-006).
   */
  public checkDuplicateMobile(mobileNumber: string): {
    hasDuplicate: boolean;
    existingReservation?: Reservation;
    warning?: string;
  } {
    const existing = this.repository.findActiveByMobileSync(mobileNumber);
    if (existing) {
      const check = domainCheckDuplicateMobile(existing);
      return {
        hasDuplicate: true,
        existingReservation: existing,
        warning: check.warning,
      };
    }
    return { hasDuplicate: false };
  }

  /**
   * Saves a new or updated reservation entity with business-friendly audit logs and automatic status recovery.
   */
  public saveReservation(draft: ReservationDraft, reservationToEdit?: Reservation, operatorReason?: string): Reservation {
    // 1. Validate required inputs
    const validation = validateReservationDraft(
      draft.prospectName,
      draft.mobileNumber,
      draft.expectedJoiningDate
    );
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(' ');
      throw new Error(`Reservation validation failed: ${errorMsg}`);
    }

    const nowIso = new Date().toISOString();

    if (reservationToEdit) {
      // Enforce read-only domain guard for CONVERTED and CANCELLED reservations
      const editCheck = canEditReservation(reservationToEdit.status);
      if (!editCheck.allowed) {
        throw new Error(editCheck.reason);
      }

      // Track audit entries generated during edit
      const newAuditEntries: ReservationAuditEntry[] = [];

      // Check joining date update
      const isDateChanged = draft.expectedJoiningDate !== reservationToEdit.expectedJoiningDate;
      if (isDateChanged) {
        newAuditEntries.push({
          timestamp: nowIso,
          action: 'Joining Date Updated',
          performedBy: 'System Operator',
          details: `Joining date updated from ${reservationToEdit.expectedJoiningDate} to ${draft.expectedJoiningDate}${
            operatorReason ? `. Reason: ${operatorReason}` : ''
          }`,
        });
      }

      // Check commercial terms update
      const isRentChanged = draft.expectedMonthlyRent !== reservationToEdit.expectedMonthlyRent;
      if (isRentChanged) {
        newAuditEntries.push({
          timestamp: nowIso,
          action: 'Expected Rent Updated',
          performedBy: 'System Operator',
          details: typeof draft.expectedMonthlyRent === 'number'
            ? `Expected monthly rent updated to ₹${draft.expectedMonthlyRent.toLocaleString('en-IN')}`
            : 'Expected monthly rent cleared',
        });
      }

      const isDepositChanged = draft.expectedSecurityDeposit !== reservationToEdit.expectedSecurityDeposit;
      if (isDepositChanged) {
        newAuditEntries.push({
          timestamp: nowIso,
          action: 'Expected Deposit Updated',
          performedBy: 'System Operator',
          details: typeof draft.expectedSecurityDeposit === 'number'
            ? `Expected security deposit updated to ₹${draft.expectedSecurityDeposit.toLocaleString('en-IN')}`
            : 'Expected security deposit cleared',
        });
      }

      // Check token update (Refinement #3)
      const isTokenChanged =
        draft.tokenAmount !== reservationToEdit.tokenAmount ||
        draft.tokenReceivedOn !== reservationToEdit.tokenReceivedOn ||
        draft.tokenRemarks !== reservationToEdit.tokenRemarks;

      if (isTokenChanged) {
        newAuditEntries.push({
          timestamp: nowIso,
          action: 'Token Updated', // Refinement #3
          performedBy: 'System Operator',
          details: draft.tokenAmount && draft.tokenAmount > 0
            ? `Token amount updated to ₹${draft.tokenAmount.toLocaleString('en-IN')}`
            : 'Token waived or reset to 0',
        });
      }

      // Generic update entry if no specific field event generated
      if (newAuditEntries.length === 0) {
        newAuditEntries.push({
          timestamp: nowIso,
          action: 'Reservation Updated',
          performedBy: 'System Operator',
          details: operatorReason ? `Details updated. Reason: ${operatorReason}` : 'Reservation details updated',
        });
      }

      const updatedReservation: Reservation = {
        ...reservationToEdit,
        prospectName: draft.prospectName.trim(),
        mobileNumber: draft.mobileNumber.trim().replace(/\D/g, ''),
        expectedJoiningDate: draft.expectedJoiningDate,
        expectedMonthlyRent: typeof draft.expectedMonthlyRent === 'number' ? draft.expectedMonthlyRent : undefined,
        expectedSecurityDeposit: typeof draft.expectedSecurityDeposit === 'number' ? draft.expectedSecurityDeposit : undefined,
        accommodationPreference: draft.accommodationPreference?.trim() || undefined,
        tokenAmount: typeof draft.tokenAmount === 'number' ? draft.tokenAmount : undefined,
        tokenReceivedOn: draft.tokenReceivedOn || undefined,
        tokenRemarks: draft.tokenRemarks?.trim() || undefined,
        notes: draft.notes?.trim() || undefined,
        status: reservationToEdit.status,
        auditLog: [...reservationToEdit.auditLog, ...newAuditEntries],
        updatedAt: nowIso,
      };

      return this.repository.saveSync(updatedReservation);
    } else {
      // Creating new reservation
      const allReservations = this.repository.findAllSync();
      const sequenceNumber = allReservations.length + 1;
      const reservationNumber = formatReservationNumber(sequenceNumber);

      const auditEntry: ReservationAuditEntry = {
        timestamp: nowIso,
        action: 'Reservation Created',
        performedBy: 'System Operator',
        details: draft.tokenAmount && draft.tokenAmount > 0
          ? `Reservation created with ₹${draft.tokenAmount.toLocaleString('en-IN')} token`
          : 'Reservation created',
      };

      const newReservation: Reservation = {
        id: `resv-${String(sequenceNumber).padStart(6, '0')}`,
        reservationNumber,
        prospectName: draft.prospectName.trim(),
        mobileNumber: draft.mobileNumber.trim().replace(/\D/g, ''),
        expectedJoiningDate: draft.expectedJoiningDate,
        expectedMonthlyRent: typeof draft.expectedMonthlyRent === 'number' ? draft.expectedMonthlyRent : undefined,
        expectedSecurityDeposit: typeof draft.expectedSecurityDeposit === 'number' ? draft.expectedSecurityDeposit : undefined,
        accommodationPreference: draft.accommodationPreference?.trim() || undefined,
        tokenAmount: typeof draft.tokenAmount === 'number' ? draft.tokenAmount : undefined,
        tokenReceivedOn: draft.tokenReceivedOn || undefined,
        tokenRemarks: draft.tokenRemarks?.trim() || undefined,
        notes: draft.notes?.trim() || undefined,
        status: ReservationStatus.ACTIVE,
        auditLog: [auditEntry],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      return this.repository.saveSync(newReservation);
    }
  }

  /**
   * Cancels an active reservation (No deletion).
   */
  public cancelReservation(id: string, operatorReason?: string): Reservation {
    const reservation = this.repository.findByIdSync(id);
    if (!reservation) {
      throw new Error(`Reservation ${id} not found.`);
    }

    const cancelCheck = canCancelReservation(reservation.status);
    if (!cancelCheck.allowed) {
      throw new Error(cancelCheck.reason);
    }

    const nowIso = new Date().toISOString();
    const auditEntry: ReservationAuditEntry = {
      timestamp: nowIso,
      action: 'Reservation Cancelled',
      performedBy: 'System Operator',
      details: operatorReason ? `Cancelled. Reason: ${operatorReason}` : 'Reservation cancelled',
    };

    const cancelledReservation: Reservation = {
      ...reservation,
      status: ReservationStatus.CANCELLED,
      auditLog: [...reservation.auditLog, auditEntry],
      updatedAt: nowIso,
    };

    return this.repository.saveSync(cancelledReservation);
  }

  /**
   * Constructs the ViewModel with summary statistics and filtered reservation list.
   * Derived operational metrics cleanly separate operational attention from lifecycle truth.
   */
  public createViewModel(
    reservations: Reservation[],
    searchQuery: string = '',
    statusFilter: string = 'ALL'
  ): ReservationWorkspaceViewModel {
    const todayStr = new Date().toISOString().split('T')[0];

    let totalActive = 0;
    let totalFollowUp = 0;
    let arrivingToday = 0;
    let totalConverted = 0;
    let totalCancelled = 0;

    reservations.forEach((r) => {
      if (r.status === ReservationStatus.ACTIVE) {
        totalActive++;
        if (isReservationFollowUpRequired(r, todayStr)) {
          totalFollowUp++;
        }
        if (r.expectedJoiningDate === todayStr) {
          arrivingToday++;
        }
      } else if (r.status === ReservationStatus.CONVERTED) {
        totalConverted++;
      } else if (r.status === ReservationStatus.CANCELLED) {
        totalCancelled++;
      }
    });

    const stats: ReservationStats = {
      totalActive,
      totalFollowUp,
      arrivingToday,
      totalConverted,
      totalCancelled,
    };

    const q = searchQuery.trim().toLowerCase();

    const filteredReservations = reservations.filter((r) => {
      let matchesStatus = false;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'ACTIVE') {
        matchesStatus = r.status === ReservationStatus.ACTIVE;
      } else if (statusFilter === 'FOLLOW_UP_REQUIRED') {
        matchesStatus = isReservationFollowUpRequired(r, todayStr);
      } else if (statusFilter === 'TODAY') {
        matchesStatus = r.status === ReservationStatus.ACTIVE && r.expectedJoiningDate === todayStr;
      } else {
        matchesStatus = r.status === statusFilter;
      }

      let matchesSearch = true;
      if (q) {
        matchesSearch =
          r.reservationNumber.toLowerCase().includes(q) ||
          r.prospectName.toLowerCase().includes(q) ||
          r.mobileNumber.toLowerCase().includes(q);
      }

      return matchesStatus && matchesSearch;
    });

    return {
      stats,
      reservations,
      filteredReservations,
    };
  }
}
