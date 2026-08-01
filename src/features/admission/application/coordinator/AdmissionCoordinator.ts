import type { Reservation } from '../../../reservation/domain/entities/Reservation';
import type { ReservationRepository } from '../../../reservation/domain/interfaces/ReservationRepository';
import { ReservationStatus } from '../../../reservation/domain/valueObjects/ReservationStatus';
import { canEditReservation } from '../../../reservation/domain/rules/reservationRules';
import { InMemoryReservationRepository } from '../../../reservation/infrastructure/repositories/InMemoryReservationRepository';

import type { Resident } from '../../../resident/domain/entities/Resident';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { ResidentStatus } from '../../../resident/domain/valueObjects/ResidentStatus';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';

import type { Stay } from '../../../stay/domain/entities/Stay';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { StayType } from '../../../stay/domain/valueObjects/StayType';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';

import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { InMemoryAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

import { TokenDisposition, formatTokenDispositionLabel } from '../../domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../models/AdmissionDraft';
import type { AdmissionReadiness } from '../models/AdmissionReadiness';
import type { AdmissionResult } from '../models/AdmissionResult';

export class AdmissionCoordinator {
  private reservationRepo: ReservationRepository;
  private residentRepo: ResidentRepository;
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;

  constructor(
    reservationRepo: ReservationRepository = new InMemoryReservationRepository(),
    residentRepo: ResidentRepository = new InMemoryResidentRepository(),
    stayRepo: StayRepository = new InMemoryStayRepository(),
    accommodationRepo: AccommodationRepository = new InMemoryAccommodationRepository()
  ) {
    this.reservationRepo = reservationRepo;
    this.residentRepo = residentRepo;
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
  }

  /**
   * Reordered Readiness Evaluation Pipeline (Refinement #6)
   * Evaluates readiness across 5 sequential sections:
   * Reservation -> Resident Details -> Commercial Terms -> Accommodation -> Token Decision
   */
  public evaluateReadiness(draft: AdmissionDraft, reservation?: Reservation | null): AdmissionReadiness {
    const validationMessages: string[] = [];

    // 1. Reservation Verification
    let isReservationValid = false;
    if (reservation) {
      const editCheck = canEditReservation(reservation.status);
      if ((reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && editCheck.allowed) {
        isReservationValid = true;
      } else {
        validationMessages.push(`Reservation ${reservation.reservationNumber} must be ACTIVE or FOLLOW_UP_REQUIRED and editable.`);
      }
    } else {
      validationMessages.push('Active reservation is required.');
    }

    // 2. Resident Details Verification (Progressive Data Capture: Name & 10-digit Mobile)
    let isResidentDetailsValid = false;
    const nameValid = Boolean(draft.residentName && draft.residentName.trim().length > 0);
    const cleanedMobile = draft.mobileNumber ? draft.mobileNumber.trim().replace(/\D/g, '') : '';
    const mobileValid = cleanedMobile.length === 10;

    if (nameValid && mobileValid) {
      isResidentDetailsValid = true;
    } else {
      if (!nameValid) validationMessages.push('Resident full name is required.');
      if (!mobileValid) validationMessages.push('Valid 10-digit mobile number is required.');
    }

    // 3. Commercial Terms Verification
    let isCommercialTermsValid = false;
    const rentValid = typeof draft.agreedRent === 'number' && draft.agreedRent > 0;
    const depositValid = typeof draft.agreedDeposit === 'number' && draft.agreedDeposit >= 0;
    const dateValid = Boolean(draft.checkInDate && !isNaN(Date.parse(draft.checkInDate)));

    if (rentValid && depositValid && dateValid) {
      isCommercialTermsValid = true;
    } else {
      if (!rentValid) validationMessages.push('Agreed monthly rent must be greater than 0.');
      if (!depositValid) validationMessages.push('Agreed security deposit must be specified.');
      if (!dateValid) validationMessages.push('Valid check-in date is required.');
    }

    // 4. Accommodation Verification
    let isAccommodationValid = false;
    const flatValid = Boolean(draft.flatId && draft.flatId.trim().length > 0);
    const bedsValid = Array.isArray(draft.bedIds) && draft.bedIds.length > 0;

    if (flatValid && bedsValid) {
      const flat = this.accommodationRepo.findById(draft.flatId);
      if (!flat) {
        validationMessages.push(`Flat ${draft.flatId} not found.`);
      } else {
        const flatBeds = flat.areas.flatMap((area) => area.beds);
        let allBedsAvailable = true;
        for (const bedId of draft.bedIds) {
          const bed = flatBeds.find((b) => b.id === bedId);
          if (!bed) {
            allBedsAvailable = false;
            validationMessages.push(`Bed ${bedId} does not belong to Flat ${flat.name}.`);
          } else if (bed.status === BedStatus.OCCUPIED) {
            allBedsAvailable = false;
            validationMessages.push(`Bed ${bed.name} is already OCCUPIED.`);
          }
        }
        if (allBedsAvailable) {
          isAccommodationValid = true;
        }
      }
    } else {
      if (!flatValid) validationMessages.push('Flat must be selected.');
      if (!bedsValid) validationMessages.push('At least 1 vacant bed must be selected.');
    }

    // 5. Token Decision Verification
    let isTokenDecisionValid = false;
    const hasTokenAmount = Boolean(reservation?.tokenAmount && reservation.tokenAmount > 0);
    if (!hasTokenAmount) {
      isTokenDecisionValid = true;
    } else if (draft.tokenDisposition) {
      isTokenDecisionValid = true;
    } else {
      validationMessages.push('Token disposition choice must be selected.');
    }

    const isReadyToConfirm =
      isReservationValid &&
      isResidentDetailsValid &&
      isCommercialTermsValid &&
      isAccommodationValid &&
      isTokenDecisionValid;

    return {
      isReadyToConfirm,
      isReservationValid,
      isResidentDetailsValid,
      isCommercialTermsValid,
      isAccommodationValid,
      isTokenDecisionValid,
      validationMessages,
    };
  }

  /**
   * Decision Support: Calculates token adjustment breakdown preview (Refinement #4)
   */
  public calculateTokenAdjustmentPreview(
    agreedRent: number,
    agreedDeposit: number,
    tokenAmount: number = 0,
    disposition?: TokenDisposition
  ): {
    tokenAmount: number;
    dispositionLabel: string;
    originalDeposit: number;
    adjustedDepositBalance: number;
    originalRent: number;
    adjustedRentBalance: number;
    summaryText: string;
  } {
    let adjustedDepositBalance = agreedDeposit;
    let adjustedRentBalance = agreedRent;
    let summaryText = 'No token adjustment applied.';

    if (tokenAmount > 0 && disposition) {
      if (disposition === TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT) {
        adjustedDepositBalance = Math.max(0, agreedDeposit - tokenAmount);
        summaryText = `Security Deposit ₹${agreedDeposit.toLocaleString('en-IN')} - Token ₹${tokenAmount.toLocaleString('en-IN')} = Payable Deposit ₹${adjustedDepositBalance.toLocaleString('en-IN')}`;
      } else if (disposition === TokenDisposition.ADJUST_TO_FIRST_RENT) {
        adjustedRentBalance = Math.max(0, agreedRent - tokenAmount);
        summaryText = `First Month Rent ₹${agreedRent.toLocaleString('en-IN')} - Token ₹${tokenAmount.toLocaleString('en-IN')} = Payable Rent ₹${adjustedRentBalance.toLocaleString('en-IN')}`;
      } else if (disposition === TokenDisposition.LEAVE_PENDING) {
        summaryText = `Token ₹${tokenAmount.toLocaleString('en-IN')} held pending / unadjusted.`;
      }
    }

    return {
      tokenAmount,
      dispositionLabel: disposition ? formatTokenDispositionLabel(disposition) : 'None',
      originalDeposit: agreedDeposit,
      adjustedDepositBalance,
      originalRent: agreedRent,
      adjustedRentBalance,
      summaryText,
    };
  }

  /**
   * Executes atomic Reserved Admission conversion with complete rollback on failure.
   * Reusable core architecture for future Walk-in Admission (Refinement #7).
   */
  public confirmReservedAdmission(
    draft: AdmissionDraft,
    reservation: Reservation,
    flatNumber?: string,
    bedNumbers?: string[]
  ): AdmissionResult {
    const readiness = this.evaluateReadiness(draft, reservation);
    if (!readiness.isReadyToConfirm) {
      throw new Error(`Admission readiness check failed: ${readiness.validationMessages.join(' ')}`);
    }

    const nowIso = new Date().toISOString();

    // Take Pre-Commit Snapshots for Atomic Rollback
    const reservationSnapshot = { ...reservation };
    const targetFlat = this.accommodationRepo.findById(draft.flatId);
    const flatSnapshot: Flat | null = targetFlat ? JSON.parse(JSON.stringify(targetFlat)) : null;

    let createdResidentId: string | null = null;
    let createdStayId: string | null = null;

    try {
      // Step 1: Create Resident (generates RESID-000001)
      const inMemResidentRepo = this.residentRepo as InMemoryResidentRepository;
      const allResidents = inMemResidentRepo.getAllSync ? inMemResidentRepo.getAllSync() : [];
      const nextSeq = allResidents.length + 1;
      const residentCode = `RESID-${String(nextSeq).padStart(6, '0')}`;

      const hasEmergencyContact = Boolean(draft.emergencyContactName && draft.emergencyContactName.trim().length > 0);

      const newResident: Resident = {
        id: `res-${String(nextSeq).padStart(6, '0')}`,
        residentCode,
        fullName: draft.residentName.trim(),
        status: ResidentStatus.ACTIVE,
        mobileNumber: draft.mobileNumber.trim().replace(/\D/g, ''),
        permanentAddress: draft.permanentAddress?.trim() || undefined,
        emergencyContact: hasEmergencyContact
          ? {
              name: draft.emergencyContactName!.trim(),
              relationship: draft.emergencyContactRelationship?.trim() || 'Other',
              phone: draft.emergencyContactPhone ? draft.emergencyContactPhone.trim().replace(/\D/g, '') : '',
            }
          : undefined,
        documents: draft.idProofType && draft.idProofNumber ? [
          {
            type: draft.idProofType as any,
            documentNumber: draft.idProofNumber.trim(),
            verificationStatus: 'Verified',
          }
        ] : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const savedResident = inMemResidentRepo.save ? inMemResidentRepo.save(newResident) as any : newResident;
      createdResidentId = savedResident.id || newResident.id;

      // Step 2: Create Stay & Commercial Agreement (status ACTIVE)
      const inMemStayRepo = this.stayRepo as InMemoryStayRepository;
      const allStays = inMemStayRepo.getAllSync ? inMemStayRepo.getAllSync() : [];
      const staySeq = allStays.length + 1;
      const stayId = `stay-${String(staySeq).padStart(6, '0')}`;

      const tokenAmount = reservation.tokenAmount || 0;
      const tokenDisposition = draft.tokenDisposition || TokenDisposition.LEAVE_PENDING;
      const preview = this.calculateTokenAdjustmentPreview(
        Number(draft.agreedRent),
        Number(draft.agreedDeposit),
        tokenAmount,
        tokenDisposition
      );

      const newStay: Stay = {
        id: stayId,
        residentId: newResident.id,
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: draft.checkInDate,
        flatId: draft.flatId,
        allocatedBedIds: [...draft.bedIds],
        agreedRent: Number(draft.agreedRent),
        agreedDeposit: Number(draft.agreedDeposit),
        notes: draft.notes ? `Admission Note: ${draft.notes}. ${preview.summaryText}` : preview.summaryText,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const savedStay = inMemStayRepo.save ? inMemStayRepo.save(newStay) as any : newStay;
      createdStayId = savedStay.id || stayId;

      // Step 3: Transition Allocated Bed Statuses to OCCUPIED
      if (targetFlat) {
        const updatedAreas = targetFlat.areas.map((area) => ({
          ...area,
          beds: area.beds.map((b) => {
            if (draft.bedIds.includes(b.id)) {
              return { ...b, status: BedStatus.OCCUPIED, residentName: newResident.fullName };
            }
            return b;
          }),
        }));
        const updatedFlat: Flat = { ...targetFlat, areas: updatedAreas };
        this.accommodationRepo.save(updatedFlat);
      }

      // Step 4: Transition Reservation status to CONVERTED
      const auditDetails = `Converted to Admission. Generated ${residentCode}, Stay ${stayId}. Token Disposition: ${preview.dispositionLabel} (${preview.summaryText})`;
      const updatedReservation: Reservation = {
        ...reservation,
        status: ReservationStatus.CONVERTED,
        auditLog: [
          ...reservation.auditLog,
          {
            timestamp: nowIso,
            action: 'Status Updated',
            performedBy: 'Admission Coordinator',
            details: `Status updated from ${reservation.status} to ${ReservationStatus.CONVERTED} (${auditDetails})`,
          },
        ],
        updatedAt: nowIso,
      };

      this.reservationRepo.saveSync(updatedReservation);

      // Determine display flat and bed labels
      const resolvedFlatNumber = flatNumber || (targetFlat ? targetFlat.name : 'Flat 101');
      const allFlatBeds = targetFlat ? targetFlat.areas.flatMap((a) => a.beds) : [];
      const resolvedBedNumbers = bedNumbers || (targetFlat ? allFlatBeds.filter((b) => draft.bedIds.includes(b.id)).map((b) => b.name) : ['Bed A']);

      return {
        success: true,
        residentCode,
        residentName: newResident.fullName,
        stayId,
        reservationNumber: reservation.reservationNumber,
        allocatedFlatNumber: resolvedFlatNumber,
        allocatedBedNumbers: resolvedBedNumbers,
        agreedRent: Number(draft.agreedRent),
        agreedDeposit: Number(draft.agreedDeposit),
        appliedTokenDisposition: preview.dispositionLabel,
        tokenAmount,
        adjustedDepositBalance: preview.adjustedDepositBalance,
        adjustedRentBalance: preview.adjustedRentBalance,
        timestamp: nowIso,
      };
    } catch (err: any) {
      // ROLLBACK SNAPSHOT: Revert memory state on failure
      const inMemResidentRepo = this.residentRepo as InMemoryResidentRepository;
      const inMemStayRepo = this.stayRepo as InMemoryStayRepository;

      if (createdResidentId && inMemResidentRepo.delete) {
        inMemResidentRepo.delete(createdResidentId);
      }
      if (createdStayId && inMemStayRepo.delete) {
        inMemStayRepo.delete(createdStayId);
      }
      if (flatSnapshot) {
        this.accommodationRepo.save(flatSnapshot);
      }
      this.reservationRepo.saveSync(reservationSnapshot);

      throw new Error(`Admission atomic execution failed and was completely rolled back: ${err.message}`);
    }
  }
}
