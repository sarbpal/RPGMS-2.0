import type { Reservation } from '../../../reservation/domain/entities/Reservation';
import type { ReservationRepository } from '../../../reservation/domain/interfaces/ReservationRepository';
import { ReservationStatus } from '../../../reservation/domain/valueObjects/ReservationStatus';
import { canEditReservation } from '../../../reservation/domain/rules/reservationRules';
import { InMemoryReservationRepository } from '../../../reservation/infrastructure/repositories/InMemoryReservationRepository';

import type { Resident } from '../../../resident/domain/entities/Resident';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { ResidentStatus } from '../../../resident/domain/valueObjects/ResidentStatus';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';

import { Stay } from '../../../stay/domain/entities/Stay';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { CommercialAgreement } from '../../../stay/domain/valueObjects/CommercialAgreement';
import { BedAllocation } from '../../../stay/domain/valueObjects/BedAllocation';
import { BusinessEvent } from '../../../stay/domain/valueObjects/BusinessEvent';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';

import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { InMemoryAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

import { TokenDisposition, formatTokenDispositionLabel } from '../../domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../models/AdmissionDraft';
import { defaultFinanceRepository } from '../../../finance/infrastructure';
import type { AdmissionReadiness } from '../models/AdmissionReadiness';
import type { AdmissionResult } from '../models/AdmissionResult';

import { AdmissionFinanceService } from '../services/admissionFinanceService';

export class AdmissionCoordinator {
  private reservationRepo: ReservationRepository;
  private residentRepo: ResidentRepository;
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;
  private financeService: AdmissionFinanceService;

  constructor(
    reservationRepo: ReservationRepository = new InMemoryReservationRepository(),
    residentRepo: ResidentRepository = new InMemoryResidentRepository(),
    stayRepo: StayRepository = new InMemoryStayRepository(),
    accommodationRepo: AccommodationRepository = new InMemoryAccommodationRepository(),
    financeService?: AdmissionFinanceService
  ) {
    this.reservationRepo = reservationRepo;
    this.residentRepo = residentRepo;
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
    this.financeService = financeService ?? new AdmissionFinanceService(defaultFinanceRepository, stayRepo);
  }

  /**
   * Decision Support / Governance: Checks if mobile number exists in Resident repository
   * according to mandatory duplicate resident rules:
   * - ACTIVE resident -> BLOCK
   * - ON_NOTICE resident -> BLOCK
   * - CHECKED_OUT or ALUMNI resident -> REUSE ALLOW
   * - No match -> NEW
   */
  public checkDuplicateResidentMobile(mobileNumber: string): {
    status: 'ACTIVE_BLOCK' | 'ON_NOTICE_BLOCK' | 'REUSE_ALLOW' | 'NEW';
    existingResident?: Resident;
    message?: string;
  } {
    const cleaned = mobileNumber.trim().replace(/\D/g, '');
    if (cleaned.length !== 10) return { status: 'NEW' };

    const inMemResidentRepo = this.residentRepo as InMemoryResidentRepository;
    const residents = inMemResidentRepo.getAllSync ? inMemResidentRepo.getAllSync() : [];
    const match = residents.find((r) => r.mobileNumber.replace(/\D/g, '') === cleaned);

    if (!match) {
      return { status: 'NEW' };
    }

    if (match.status === ResidentStatus.ACTIVE) {
      return {
        status: 'ACTIVE_BLOCK',
        existingResident: match,
        message: `Resident ${match.fullName} (${match.residentCode}) already has an active stay. A second active stay cannot be created.`,
      };
    }

    if (match.status === ResidentStatus.ON_NOTICE) {
      return {
        status: 'ON_NOTICE_BLOCK',
        existingResident: match,
        message: `Resident ${match.fullName} (${match.residentCode}) has an active stay on notice. Checkout must be completed before readmission.`,
      };
    }

    return {
      status: 'REUSE_ALLOW',
      existingResident: match,
      message: `Existing resident record found (${match.fullName} - ${match.residentCode}). Resident record will be reused for new Stay.`,
    };
  }

  /**
   * Retrieves default commercial terms (monthly rent & security deposit) for one or multiple beds in a flat.
   * Checks each bed's defaultRent / defaultDeposit with fallback to the containing area's defaults,
   * summing monthly rents and security deposits when multiple beds are specified.
   */
  public getBedCommercialTerms(
    flatId: string,
    bedIdOrIds: string | string[]
  ): { defaultRent: number; defaultDeposit: number } | null {
    const flat = this.accommodationRepo.findById(flatId);
    if (!flat) return null;
    const targetBedIds = Array.isArray(bedIdOrIds) ? bedIdOrIds : [bedIdOrIds];
    if (targetBedIds.length === 0) return null;

    let totalRent = 0;
    let totalDeposit = 0;
    let foundCount = 0;

    for (const bedId of targetBedIds) {
      for (const area of flat.areas) {
        const bed = area.beds.find((b) => b.id === bedId);
        if (bed) {
          const rent = bed.defaultRent !== undefined ? bed.defaultRent : (area.defaultRent ?? 0);
          const deposit = bed.defaultDeposit !== undefined ? bed.defaultDeposit : (area.defaultDeposit ?? 0);
          totalRent += (rent ?? 0);
          totalDeposit += (deposit ?? 0);
          foundCount++;
          break;
        }
      }
    }

    if (foundCount === 0) return null;

    return {
      defaultRent: totalRent,
      defaultDeposit: totalDeposit,
    };
  }

  /**
   * Reordered Readiness Evaluation Pipeline (Refinement #6 & RA-7 Walk-in Support)
   * Evaluates readiness across 5 sequential sections:
   * Admission Source -> Resident Details -> Commercial Terms -> Accommodation -> Token Decision
   */
  public evaluateReadiness(
    draft: AdmissionDraft,
    reservation?: Reservation | null,
    sourceType?: 'RESERVATION' | 'WALK_IN'
  ): AdmissionReadiness {
    const activeSourceType = sourceType || draft.sourceType || (reservation ? 'RESERVATION' : 'WALK_IN');
    const validationMessages: string[] = [];

    // 1. Admission Source Verification
    let isReservationValid = false;
    if (activeSourceType === 'WALK_IN') {
      isReservationValid = true; // Direct walk-in is a valid admission source
    } else if (reservation) {
      const editCheck = canEditReservation(reservation.status);
      if (
        (reservation.status === ReservationStatus.ACTIVE ||
          (reservation.status as string) === 'ACTIVE' ||
          (reservation.status as string) === 'FOLLOW_UP_REQUIRED') &&
        editCheck.allowed
      ) {
        isReservationValid = true;
      } else {
        validationMessages.push(`Reservation ${reservation.reservationNumber} must be ACTIVE or FOLLOW_UP_REQUIRED and editable.`);
      }
    } else {
      validationMessages.push('Active reservation is required.');
    }

    // 2. Resident Details Verification (Progressive Data Capture: Name & 10-digit Mobile + Duplicate Check)
    let isResidentDetailsValid = false;
    const nameValid = Boolean(draft.residentName && draft.residentName.trim().length > 0);
    const cleanedMobile = draft.mobileNumber ? draft.mobileNumber.trim().replace(/\D/g, '') : '';
    const mobileValid = cleanedMobile.length === 10;

    if (nameValid && mobileValid) {
      // Check duplicate policy
      const dupCheck = this.checkDuplicateResidentMobile(cleanedMobile);
      if (dupCheck.status === 'ACTIVE_BLOCK' || dupCheck.status === 'ON_NOTICE_BLOCK') {
        validationMessages.push(dupCheck.message || 'Duplicate resident mobile numbers with active stay are blocked.');
      } else {
        isResidentDetailsValid = true;
      }
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
    const flatValid = Boolean(draft.flatId && typeof draft.flatId === 'string' && draft.flatId.trim().length > 0);
    const bedsValid = Array.isArray(draft.bedIds) && draft.bedIds.length > 0;

    if (flatValid && bedsValid) {
      const flat = this.accommodationRepo.findById(draft.flatId!);
      if (!flat) {
        validationMessages.push(`Flat ${draft.flatId} not found.`);
      } else {
        const flatBeds = flat.areas.flatMap((area) => area.beds);
        let allBedsAvailable = true;
        for (const bedId of draft.bedIds!) {
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
    if (activeSourceType === 'WALK_IN') {
      isTokenDecisionValid = true; // Walk-in admission has no reservation token to disposition
    } else {
      const hasTokenAmount = Boolean(reservation?.tokenAmount && reservation.tokenAmount > 0);
      if (!hasTokenAmount) {
        isTokenDecisionValid = true;
      } else if (draft.tokenDisposition) {
        isTokenDecisionValid = true;
      } else {
        validationMessages.push('Token disposition choice must be selected.');
      }
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
   * Returns repository-driven available flats and vacant beds for dynamic UI selection (CR-3.2).
   */
  public getAvailableFlats(): Array<{
    id: string;
    name: string;
    vacantBeds: Array<{ id: string; name: string }>;
  }> {
    const flats = this.accommodationRepo.findAll ? this.accommodationRepo.findAll() : [];
    return flats.map((flat) => {
      const vacantBeds = flat.areas
        .flatMap((area) => area.beds)
        .filter((bed) => bed.status === BedStatus.VACANT)
        .map((bed) => ({ id: bed.id, name: bed.name }));

      return {
        id: flat.id,
        name: flat.name,
        vacantBeds,
      };
    });
  }

  /**
   * Executes atomic Reserved Admission conversion with Compensating Cleanup Strategy (MVP).
   * Note: Compensating cleanup is an MVP in-memory strategy. Real DB transactions will replace this when migrating to Supabase/PostgreSQL.
   */
  public confirmReservedAdmission(
    draft: AdmissionDraft,
    reservation: Reservation,
    _flatNumber?: string,
    _bedNumbers?: string[]
  ): AdmissionResult {
    const readiness = this.evaluateReadiness(draft, reservation);
    if (!readiness.isReadyToConfirm) {
      throw new Error(`Admission readiness check failed: ${readiness.validationMessages.join(' ')}`);
    }

    const nowIso = new Date().toISOString();

    // Compensating Cleanup Strategy (MVP): Take Pre-Commit Snapshots
    const reservationSnapshot = JSON.parse(JSON.stringify(reservation));
    const targetFlat = this.accommodationRepo.findById(draft.flatId || '');
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
            customType: draft.idProofType === 'OTHER' && draft.customIdProofType ? draft.customIdProofType.trim() : undefined,
          }
        ] : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const savedResident = inMemResidentRepo.save ? inMemResidentRepo.save(newResident) as any : newResident;
      createdResidentId = savedResident.id || newResident.id;

      // Step 2: Explicitly Create Stay Aggregate with CommercialAgreement, BedAllocation, and BusinessEvent
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

      // Explicit Initial Commercial Agreement
      const initialCommercialAgreement = new CommercialAgreement({
        id: `CA-${stayId}-1`,
        stayId,
        rent: Number(draft.agreedRent),
        securityDeposit: preview.adjustedDepositBalance,
        effectiveFrom: draft.checkInDate,
        amendmentReason: 'Admission Initial Agreement',
        status: 'ACTIVE',
        createdAt: nowIso,
      });

      // Explicit Initial Bed Allocations
      const initialBedAllocations = (draft.bedIds || []).map(
        (bedId, index) =>
          new BedAllocation({
            id: `BA-${stayId}-${index + 1}`,
            stayId,
            flatId: draft.flatId || '',
            bedId,
            allocatedFrom: draft.checkInDate,
            status: 'ACTIVE',
            createdAt: nowIso,
          })
      );

      // Explicit Initial Business Event
      const resolvedFlatName = targetFlat ? targetFlat.name : (draft.flatId || 'Unknown');
      const initialBusinessEvent = new BusinessEvent({
        id: `BE-${stayId}-1`,
        stayId,
        eventType: 'ADMISSION',
        timestamp: draft.checkInDate,
        description: `Resident checked in and allocated to Flat ${resolvedFlatName} / Bed(s) ${(draft.bedIds || []).join(', ')}`,
        metadata: {
          reservationId: reservation.id,
          reservationNumber: reservation.reservationNumber,
        },
      });

      const newStay: Stay = new Stay({
        id: stayId,
        residentId: createdResidentId || newResident.id,
        stayType: 'REGULAR' as any,
        status: 'ACTIVE' as any,
        checkInDate: draft.checkInDate,
        commercialAgreements: [initialCommercialAgreement],
        bedAllocations: initialBedAllocations,
        businessEvents: [initialBusinessEvent],
        notes: draft.notes ? `Admission Note: ${draft.notes}. ${preview.summaryText}` : preview.summaryText,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const savedStay = inMemStayRepo.save ? inMemStayRepo.save(newStay) as any : newStay;
      createdStayId = savedStay.id || stayId;

      // Step 3: Finalize and Cleanup - Save updated reservation immutably with traceability references
      const updatedReservation: Reservation = {
        ...reservation,
        status: ReservationStatus.CONVERTED,
        convertedResidentId: createdResidentId || newResident.id,
        convertedStayId: createdStayId || stayId,
        auditLog: [
          ...reservation.auditLog,
          {
            timestamp: nowIso,
            action: 'Status Updated',
            performedBy: 'Admission Coordinator',
            details: `Converted to Admission. Generated ${residentCode}, Stay ${stayId}.`,
          },
        ],
        updatedAt: nowIso,
      };
      this.reservationRepo.saveSync(updatedReservation);

      // Step 4: Update Bed Status in Accommodation Aggregate
      if (targetFlat) {
        draft.bedIds?.forEach((bedId) => {
          const bed = targetFlat.areas.flatMap((a) => a.beds).find((b) => b.id === bedId);
          if (bed) bed.status = BedStatus.OCCUPIED;
        });
        this.accommodationRepo.save(targetFlat);
      }

      const admissionResult: AdmissionResult = {
        success: true,
        residentCode,
        residentName: newResident.fullName,
        residentId: createdResidentId || newResident.id,
        stayId: createdStayId || stayId,
        reservationNumber: reservation.reservationNumber,
        allocatedFlatNumber: resolvedFlatName,
        allocatedBedNumbers: draft.bedIds || [],
        agreedRent: Number(draft.agreedRent),
        agreedDeposit: Number(draft.agreedDeposit),
        appliedTokenDisposition: preview.dispositionLabel,
        tokenAmount,
        adjustedDepositBalance: preview.adjustedDepositBalance,
        adjustedRentBalance: preview.adjustedRentBalance,
        timestamp: nowIso,
      };

      // Step 5 (FR-2): Synchronous Admission -> Finance Initialization
      const financeInitResult = this.financeService.initializeAdmissionFinance(admissionResult, draft);
      if (!financeInitResult.success) {
        throw new Error(`Admission financial initialization failed: ${financeInitResult.errors.join(' ')}`);
      }

      return admissionResult;
    } catch (error) {
      // Compensating Cleanup Strategy (MVP)
      if (createdStayId) {
        this.financeService.rollbackAdmissionFinance(createdStayId);
        (this.stayRepo as any).delete?.(createdStayId);
      }
      if (createdResidentId) (this.residentRepo as any).delete?.(createdResidentId);
      this.reservationRepo.saveSync(reservationSnapshot);
      if (targetFlat && flatSnapshot) this.accommodationRepo.save(flatSnapshot);
      throw error;
    }
  }

  /**
   * Executes atomic Walk-in Admission with Compensating Cleanup Strategy (MVP).
   * Supports resident creation for new prospects OR resident reuse for returning checked-out/alumni residents.
   * No Reservation involvement.
   */
  public confirmWalkInAdmission(draft: AdmissionDraft): AdmissionResult {
    const readiness = this.evaluateReadiness(draft, null, 'WALK_IN');
    if (!readiness.isReadyToConfirm) {
      throw new Error(`Walk-in admission readiness check failed: ${readiness.validationMessages.join(' ')}`);
    }

    const nowIso = new Date().toISOString();
    const targetFlat = this.accommodationRepo.findById(draft.flatId || '');
    const flatSnapshot: Flat | null = targetFlat ? JSON.parse(JSON.stringify(targetFlat)) : null;

    let createdResidentId: string | null = null;
    let isResidentReused = false;
    let residentSnapshot: Resident | null = null;
    let createdStayId: string | null = null;

    try {
      const inMemResidentRepo = this.residentRepo as InMemoryResidentRepository;
      const dupCheck = this.checkDuplicateResidentMobile(draft.mobileNumber);

      let resident: Resident;

      if (dupCheck.status === 'REUSE_ALLOW' && dupCheck.existingResident) {
        // Reuse existing CHECKED_OUT / ALUMNI Resident
        isResidentReused = true;
        residentSnapshot = JSON.parse(JSON.stringify(dupCheck.existingResident));
        const updatedResident: Resident = {
          ...dupCheck.existingResident,
          fullName: draft.residentName.trim(),
          status: ResidentStatus.ACTIVE,
          permanentAddress: draft.permanentAddress?.trim() || dupCheck.existingResident.permanentAddress,
          updatedAt: nowIso,
        };
        resident = inMemResidentRepo.saveSync ? inMemResidentRepo.saveSync(updatedResident) : updatedResident;
        createdResidentId = resident.id;
      } else {
        // Create brand new Resident
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
              customType: draft.idProofType === 'OTHER' && draft.customIdProofType ? draft.customIdProofType.trim() : undefined,
            }
          ] : undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        resident = inMemResidentRepo.saveSync ? inMemResidentRepo.saveSync(newResident) : newResident;
        createdResidentId = resident.id;
      }

      // Step 2: Create Stay Aggregate
      const inMemStayRepo = this.stayRepo as InMemoryStayRepository;
      const allStays = inMemStayRepo.getAllSync ? inMemStayRepo.getAllSync() : [];
      const staySeq = allStays.length + 1;
      const stayId = `stay-${String(staySeq).padStart(6, '0')}`;

      const initialCommercialAgreement = new CommercialAgreement({
        id: `CA-${stayId}-1`,
        stayId,
        rent: Number(draft.agreedRent),
        securityDeposit: Number(draft.agreedDeposit),
        effectiveFrom: draft.checkInDate,
        amendmentReason: 'Walk-in Admission Initial Agreement',
        status: 'ACTIVE',
        createdAt: nowIso,
      });

      const initialBedAllocations = (draft.bedIds || []).map(
        (bedId, index) =>
          new BedAllocation({
            id: `BA-${stayId}-${index + 1}`,
            stayId,
            flatId: draft.flatId || '',
            bedId,
            allocatedFrom: draft.checkInDate,
            status: 'ACTIVE',
            createdAt: nowIso,
          })
      );

      const resolvedFlatName = targetFlat ? targetFlat.name : (draft.flatId || 'Unknown');
      const initialBusinessEvent = new BusinessEvent({
        id: `BE-${stayId}-1`,
        stayId,
        eventType: 'ADMISSION',
        timestamp: draft.checkInDate,
        description: `Walk-in Resident checked in and allocated to Flat ${resolvedFlatName} / Bed(s) ${(draft.bedIds || []).join(', ')}`,
        metadata: {
          admissionSource: 'WALK_IN',
        },
      });

      const newStay: Stay = new Stay({
        id: stayId,
        residentId: resident.id,
        stayType: 'REGULAR' as any,
        status: 'ACTIVE' as any,
        checkInDate: draft.checkInDate,
        commercialAgreements: [initialCommercialAgreement],
        bedAllocations: initialBedAllocations,
        businessEvents: [initialBusinessEvent],
        notes: draft.notes ? `Walk-in Admission Note: ${draft.notes}` : 'Direct Walk-in Admission Check-in',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const savedStay = (inMemStayRepo.save ? (inMemStayRepo.save(newStay) as any) : newStay);
      createdStayId = savedStay.id || stayId;

      // Step 3: Update Bed Status in Accommodation Aggregate
      if (targetFlat) {
        draft.bedIds?.forEach((bedId) => {
          const bed = targetFlat.areas.flatMap((a) => a.beds).find((b) => b.id === bedId);
          if (bed) bed.status = BedStatus.OCCUPIED;
        });
        this.accommodationRepo.save(targetFlat);
      }

      const admissionResult: AdmissionResult = {
        success: true,
        residentCode: resident.residentCode,
        residentName: resident.fullName,
        residentId: resident.id,
        stayId: createdStayId || stayId,
        reservationNumber: 'N/A (Walk-in)',
        allocatedFlatNumber: resolvedFlatName,
        allocatedBedNumbers: draft.bedIds || [],
        agreedRent: Number(draft.agreedRent),
        agreedDeposit: Number(draft.agreedDeposit),
        appliedTokenDisposition: 'None (Walk-in)',
        tokenAmount: 0,
        adjustedDepositBalance: Number(draft.agreedDeposit),
        adjustedRentBalance: Number(draft.agreedRent),
        timestamp: nowIso,
      };

      // Step 4 (FR-2): Synchronous Admission -> Finance Initialization
      const financeInitResult = this.financeService.initializeAdmissionFinance(admissionResult, draft);
      if (!financeInitResult.success) {
        throw new Error(`Walk-in admission financial initialization failed: ${financeInitResult.errors.join(' ')}`);
      }

      return admissionResult;
    } catch (error) {
      // Compensating Cleanup Strategy (MVP)
      if (createdStayId) {
        this.financeService.rollbackAdmissionFinance(createdStayId);
        (this.stayRepo as any).delete?.(createdStayId);
      }
      if (createdResidentId) {
        if (isResidentReused && residentSnapshot) {
          (this.residentRepo as any).save?.(residentSnapshot);
        } else {
          (this.residentRepo as any).delete?.(createdResidentId);
        }
      }
      if (targetFlat && flatSnapshot) this.accommodationRepo.save(flatSnapshot);
      throw error;
    }
  }
}
