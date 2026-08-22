import type { AdmissionDraft } from '../models/AdmissionDraft';
import type { AdmissionValidationError, AdmissionValidationResult } from '../models/AdmissionValidationResult';
import type { Reservation } from '../../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../../reservation/domain/valueObjects/ReservationStatus';
import { canEditReservation } from '../../../reservation/domain/rules/reservationRules';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { ResidentStatus } from '../../../resident/domain/valueObjects/ResidentStatus';
import { isDocumentNumberRequired } from '../../../resident/domain/valueObjects/IdentityDocumentType';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';

/**
 * Authoritative Application Service: Pre-Commit Validation Gate.
 * Enforces hard operational invariants immediately before Admission Transaction commitment.
 *
 * Rules:
 * - Read-only: never mutates any aggregate or repository.
 * - Live-state: inspects current state of Accommodation and Resident repositories at invocation time.
 * - Authoritative: does not check soft advisory concerns (rent deviation, preference match, progressive profile).
 */
export class AdmissionValidationService {
  /**
   * Evaluates mandatory pre-commit invariants for an admission transaction.
   */
  public validate(
    draft: AdmissionDraft,
    reservation: Reservation | null | undefined,
    sourceType: 'RESERVATION' | 'WALK_IN',
    accommodationRepo: AccommodationRepository,
    residentRepo: ResidentRepository
  ): AdmissionValidationResult {
    const errors: AdmissionValidationError[] = [];

    // =========================================================================
    // 1. SOURCE / RESERVATION INVARIANTS
    // =========================================================================
    if (sourceType === 'RESERVATION') {
      if (!reservation) {
        errors.push({
          code: 'ADM_VAL_RESERVATION_REQUIRED',
          field: 'reservationId',
          message: 'Active reservation is required.',
        });
      } else {
        if (reservation.status === ReservationStatus.CONVERTED) {
          errors.push({
            code: 'ADM_VAL_RESERVATION_ALREADY_CONVERTED',
            field: 'reservationStatus',
            message: `Reservation ${reservation.reservationNumber} has already been converted.`,
          });
        } else if (reservation.status === ReservationStatus.CANCELLED) {
          errors.push({
            code: 'ADM_VAL_RESERVATION_CANCELLED',
            field: 'reservationStatus',
            message: `Reservation ${reservation.reservationNumber} is cancelled.`,
          });
        } else {
          const editCheck = canEditReservation(reservation.status);
          const isValidStatus = reservation.status === ReservationStatus.ACTIVE;

          if (!isValidStatus || !editCheck.allowed) {
            errors.push({
              code: 'ADM_VAL_RESERVATION_INVALID_STATUS',
              field: 'reservationStatus',
              message: `Reservation ${reservation.reservationNumber} must be ACTIVE and editable.`,
            });
          }
        }
      }
    }

    // =========================================================================
    // 2. IDENTITY INVARIANTS
    // =========================================================================
    const nameValid = Boolean(draft.residentName && draft.residentName.trim().length > 0);
    if (!nameValid) {
      errors.push({
        code: 'ADM_VAL_NAME_REQUIRED',
        field: 'residentName',
        message: 'Resident full name is required.',
      });
    }

    const cleanedMobile = draft.mobileNumber ? draft.mobileNumber.trim().replace(/\D/g, '') : '';
    const mobileValid = cleanedMobile.length === 10;

    if (!mobileValid) {
      errors.push({
        code: 'ADM_VAL_MOBILE_INVALID',
        field: 'mobileNumber',
        message: 'Valid 10-digit mobile number is required.',
      });
    } else {
      // Live duplicate check against Resident repository
      const inMemResidentRepo = residentRepo as InMemoryResidentRepository;
      const allResidents = inMemResidentRepo.getAllSync ? inMemResidentRepo.getAllSync() : [];
      const match = allResidents.find((r) => r.mobileNumber.replace(/\D/g, '') === cleanedMobile);

      if (match) {
        if (match.status === ResidentStatus.ACTIVE) {
          errors.push({
            code: 'ADM_VAL_DUPLICATE_ACTIVE_RESIDENT',
            field: 'mobileNumber',
            message: `Resident ${match.fullName} (${match.residentCode}) already has an active stay. A second active stay cannot be created.`,
          });
        } else if (match.status === ResidentStatus.ON_NOTICE) {
          errors.push({
            code: 'ADM_VAL_DUPLICATE_ON_NOTICE_RESIDENT',
            field: 'mobileNumber',
            message: `Resident ${match.fullName} (${match.residentCode}) has an active stay on notice. Checkout must be completed before readmission.`,
          });
        }
        // Note: CHECKED_OUT or ALUMNI reuse is allowed and valid.
      }
    }

    // Identity Document Requirements (Minimum Operational Admission Dataset - Spec Section 7.5)
    const docType = draft.idProofType?.trim();
    if (!docType) {
      errors.push({
        code: 'ADM_VAL_DOC_TYPE_REQUIRED',
        field: 'idProofType',
        message: 'Identity Document Type is required.',
      });
    } else {
      const normalizedDocType = docType.toUpperCase().replace(/[\s-]+/g, '_');
      if (normalizedDocType === 'OTHER') {
        const customType = draft.customIdProofType?.trim();
        if (!customType) {
          errors.push({
            code: 'ADM_VAL_CUSTOM_DOC_TYPE_REQUIRED',
            field: 'customIdProofType',
            message: 'Custom Document Type is required when Document Type is Other.',
          });
        }
      }

      const numberRequired = isDocumentNumberRequired(docType);
      const docNumber = draft.idProofNumber?.trim();
      if (numberRequired && !docNumber) {
        errors.push({
          code: 'ADM_VAL_DOC_NUMBER_REQUIRED',
          field: 'idProofNumber',
          message: `Document Number is required for ${docType}.`,
        });
      }
    }

    // =========================================================================
    // 3. COMMERCIAL INVARIANTS
    // =========================================================================
    const dateValid = Boolean(draft.checkInDate && !isNaN(Date.parse(draft.checkInDate)));
    if (!dateValid) {
      errors.push({
        code: 'ADM_VAL_CHECK_IN_DATE_INVALID',
        field: 'checkInDate',
        message: 'Valid check-in date is required.',
      });
    }

    const rentNumber = typeof draft.agreedRent === 'number' ? draft.agreedRent : NaN;
    const rentValid = !isNaN(rentNumber) && rentNumber > 0;
    if (!rentValid) {
      errors.push({
        code: 'ADM_VAL_RENT_INVALID',
        field: 'agreedRent',
        message: 'Agreed monthly rent must be greater than 0.',
      });
    }

    const depositNumber = typeof draft.agreedDeposit === 'number' ? draft.agreedDeposit : NaN;
    const depositValid = !isNaN(depositNumber) && depositNumber >= 0;
    if (!depositValid) {
      errors.push({
        code: 'ADM_VAL_DEPOSIT_INVALID',
        field: 'agreedDeposit',
        message: 'Agreed security deposit must be specified.',
      });
    }

    // =========================================================================
    // 4. ACCOMMODATION INVARIANTS (LIVE STATE RE-READ)
    // =========================================================================
    const flatValid = Boolean(draft.flatId && typeof draft.flatId === 'string' && draft.flatId.trim().length > 0);
    const bedsValid = Array.isArray(draft.bedIds) && draft.bedIds.length > 0;

    if (!flatValid) {
      errors.push({
        code: 'ADM_VAL_FLAT_REQUIRED',
        field: 'flatId',
        message: 'Flat must be selected.',
      });
    }

    if (!bedsValid) {
      errors.push({
        code: 'ADM_VAL_BED_REQUIRED',
        field: 'bedIds',
        message: 'At least 1 vacant bed must be selected.',
      });
    }

    if (flatValid && bedsValid) {
      // Re-read live flat state from repository immediately before commit.
      // AccommodationRepository.findById() is async (Promise<Flat|null>).
      // AdmissionValidationService.validate() is synchronous.
      // Synchronous access is required to perform live T2 bed vacancy validation.
      // Use the *Sync helper when available (in-memory mode).
      // If unavailable (Supabase mode), do NOT silently skip validation —
      // admission persistence migration is deferred; Supabase mode must fail explicitly.
      const inMemAccomRepo = accommodationRepo as any;
      if (typeof inMemAccomRepo.findByIdSync === 'function') {
        const flat = inMemAccomRepo.findByIdSync(draft.flatId!) as ReturnType<typeof inMemAccomRepo.findByIdSync>;
        if (!flat) {
          errors.push({
            code: 'ADM_VAL_FLAT_NOT_FOUND',
            field: 'flatId',
            message: `Flat ${draft.flatId} not found.`,
          });
        } else {
          const flatBeds = flat.areas.flatMap((area: any) => area.beds);
          for (const bedId of draft.bedIds!) {
            const bed = flatBeds.find((b: any) => b.id === bedId);
            if (!bed) {
              errors.push({
                code: 'ADM_VAL_BED_NOT_FOUND',
                field: 'bedIds',
                message: `Bed ${bedId} does not belong to Flat ${flat.name}.`,
              });
            } else if (bed.status === BedStatus.OCCUPIED) {
              errors.push({
                code: 'ADM_VAL_BED_OCCUPIED',
                field: 'bedIds',
                message: `Bed ${bed.name} is already OCCUPIED.`,
              });
            } else if (bed.status === BedStatus.BLOCKED || bed.status === BedStatus.MAINTENANCE) {
              errors.push({
                code: 'ADM_VAL_BED_UNAVAILABLE',
                field: 'bedIds',
                message: `Bed ${bed.name} is currently in ${bed.status} status and unavailable for allocation.`,
              });
            }
          }
        }
      } else {
        // Synchronous accommodation access unavailable (Supabase mode).
        // Admission synchronous validation cannot proceed without synchronous flat access.
        // Block the admission explicitly rather than silently skipping T2 bed vacancy checks.
        errors.push({
          code: 'ADM_VAL_SYNC_ACCOM_UNAVAILABLE',
          field: 'flatId',
          message: 'Accommodation validation requires synchronous repository access. Supabase admission migration is deferred.',
        });
      }
    }

    // =========================================================================
    // 5. TOKEN INVARIANTS
    // =========================================================================
    if (sourceType === 'RESERVATION' && reservation) {
      const tokenAmount = reservation.tokenAmount || 0;
      if (tokenAmount > 0 && !draft.tokenDisposition) {
        errors.push({
          code: 'ADM_VAL_TOKEN_DISPOSITION_REQUIRED',
          field: 'tokenDisposition',
          message: 'Token disposition choice must be selected.',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
