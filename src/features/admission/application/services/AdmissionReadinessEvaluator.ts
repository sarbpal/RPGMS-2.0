import type { AdmissionDraft } from '../models/AdmissionDraft';
import type {
  AdmissionReadinessAssessment,
  AdmissionSection,
  ReadinessCategory,
  ReadinessObservation,
  SectionAssessment,
} from '../models/AdmissionReadinessAssessment';
import type { Reservation } from '../../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../../reservation/domain/valueObjects/ReservationStatus';
import { canEditReservation } from '../../../reservation/domain/rules/reservationRules';
import type { Resident } from '../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../resident/domain/valueObjects/ResidentStatus';
import { isDocumentNumberRequired } from '../../../resident/domain/valueObjects/IdentityDocumentType';
import type { Flat } from '../../../accommodation/domain/entities/Flat';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../../domain/valueObjects/TokenDisposition';

/**
 * Pure Application Service: Evaluates advisory Admission Readiness during Preparation.
 * Implements SPEC-ADM-001 Section 10 (Readiness Philosophy) & DESIGN-ADM-002.
 *
 * Important:
 * - Readiness is advisory and informs human judgment.
 * - This evaluator NEVER mutates domain state.
 * - This evaluator NEVER contains transaction commit authority.
 */
export class AdmissionReadinessEvaluator {
  /**
   * Evaluates current admission draft against expected truth, accommodation state, and resident state.
   */
  public evaluateReadiness(
    draft: AdmissionDraft,
    reservation?: Reservation | null,
    flats: Flat[] = [],
    residents: Resident[] = []
  ): AdmissionReadinessAssessment {
    const observations: ReadinessObservation[] = [];
    const activeSourceType = draft.sourceType || (reservation ? 'RESERVATION' : 'WALK_IN');

    // =========================================================================
    // 1. SOURCE ASSESSMENT
    // =========================================================================
    if (activeSourceType === 'WALK_IN' || !reservation) {
      observations.push({
        code: 'ADM_OBS_SOURCE_WALK_IN',
        severity: 'INFO',
        section: 'SOURCE',
        message: 'Direct Walk-in Admission Entry (No reservation associated).',
      });
    } else {
      // Reservation Source Verification
      if (reservation.status === ReservationStatus.CONVERTED) {
        observations.push({
          code: 'ADM_OBS_SOURCE_RESERVATION_CONVERTED',
          severity: 'INCOMPLETE_DATA',
          section: 'SOURCE',
          message: `Reservation ${reservation.reservationNumber} has already been CONVERTED into an active admission.`,
          guidance: 'A converted reservation cannot be admitted again.',
        });
      } else if (reservation.status === ReservationStatus.CANCELLED) {
        observations.push({
          code: 'ADM_OBS_SOURCE_RESERVATION_CANCELLED',
          severity: 'INCOMPLETE_DATA',
          section: 'SOURCE',
          message: `Reservation ${reservation.reservationNumber} is CANCELLED.`,
          guidance: 'Only ACTIVE reservations can be admitted.',
        });
      } else {
        const editCheck = canEditReservation(reservation.status);
        const isValidStatus = reservation.status === ReservationStatus.ACTIVE;

        if (!isValidStatus || !editCheck.allowed) {
          observations.push({
            code: 'ADM_OBS_SOURCE_RESERVATION_INVALID_STATUS',
            severity: 'INCOMPLETE_DATA',
            section: 'SOURCE',
            message: `Reservation ${reservation.reservationNumber} must be ACTIVE and editable.`,
            guidance: editCheck.reason || 'Verify reservation status before proceeding.',
          });
        }
      }

      // Joining Date Revision Observation
      if (
        draft.checkInDate &&
        reservation.expectedJoiningDate &&
        draft.checkInDate !== reservation.expectedJoiningDate
      ) {
        observations.push({
          code: 'ADM_OBS_SOURCE_JOINING_DATE_REVISED',
          severity: 'REVIEW_WARNING',
          section: 'SOURCE',
          message: `Proposed check-in date (${draft.checkInDate}) differs from reservation expected joining date (${reservation.expectedJoiningDate}).`,
          guidance: 'Review date adjustment with the prospective resident.',
        });
      }
    }

    // =========================================================================
    // 2. IDENTITY ASSESSMENT
    // =========================================================================
    const nameValid = Boolean(draft.residentName && draft.residentName.trim().length > 0);
    if (!nameValid) {
      observations.push({
        code: 'ADM_OBS_IDENTITY_NAME_REQUIRED',
        severity: 'INCOMPLETE_DATA',
        section: 'IDENTITY',
        message: 'Resident full name is required.',
        guidance: 'Enter the resident full legal name.',
      });
    }

    const cleanedMobile = draft.mobileNumber ? draft.mobileNumber.trim().replace(/\D/g, '') : '';
    const mobileValid = cleanedMobile.length === 10;

    if (!mobileValid) {
      observations.push({
        code: 'ADM_OBS_IDENTITY_MOBILE_INVALID',
        severity: 'INCOMPLETE_DATA',
        section: 'IDENTITY',
        message: 'Valid 10-digit primary mobile number is required.',
        guidance: 'Enter a valid 10-digit Indian mobile number.',
      });
    } else {
      // Check duplicate mobile in existing residents
      const existingMatch = residents.find((r) => r.mobileNumber.replace(/\D/g, '') === cleanedMobile);
      if (existingMatch) {
        if (existingMatch.status === ResidentStatus.ACTIVE) {
          observations.push({
            code: 'ADM_OBS_IDENTITY_DUPLICATE_ACTIVE',
            severity: 'INCOMPLETE_DATA',
            section: 'IDENTITY',
            message: `Resident ${existingMatch.fullName} (${existingMatch.residentCode}) already has an active stay.`,
            guidance: 'A second active stay cannot be created for the same individual.',
          });
        } else if (existingMatch.status === ResidentStatus.ON_NOTICE) {
          observations.push({
            code: 'ADM_OBS_IDENTITY_DUPLICATE_ON_NOTICE',
            severity: 'INCOMPLETE_DATA',
            section: 'IDENTITY',
            message: `Resident ${existingMatch.fullName} (${existingMatch.residentCode}) has an active stay on notice.`,
            guidance: 'Checkout must be completed before readmission.',
          });
        } else {
          // CHECKED_OUT or ALUMNI -> Soft Review
          observations.push({
            code: 'ADM_OBS_IDENTITY_ALUMNI_REUSE',
            severity: 'REVIEW_WARNING',
            section: 'IDENTITY',
            message: `Existing resident record found (${existingMatch.fullName} - ${existingMatch.residentCode}). Resident record will be reused for new Stay.`,
            guidance: 'Confirm returning resident profile details before approval.',
          });
        }
      }
    }

    // Identity Document Observations (Minimum Operational Admission Dataset - Spec Section 7.5)
    const docType = draft.idProofType?.trim();
    if (!docType) {
      observations.push({
        code: 'ADM_OBS_IDENTITY_DOC_TYPE_REQUIRED',
        severity: 'INCOMPLETE_DATA',
        section: 'IDENTITY',
        message: 'Identity Document Type is required.',
        guidance: 'Select a valid identity document type (e.g. Aadhaar, PAN, Passport).',
      });
    } else {
      const normalizedDocType = docType.toUpperCase().replace(/[\s-]+/g, '_');
      if (normalizedDocType === 'OTHER') {
        const customType = draft.customIdProofType?.trim();
        if (!customType) {
          observations.push({
            code: 'ADM_OBS_IDENTITY_CUSTOM_DOC_TYPE_REQUIRED',
            severity: 'INCOMPLETE_DATA',
            section: 'IDENTITY',
            message: 'Custom Document Type is required when Document Type is Other.',
            guidance: 'Specify the custom document type name.',
          });
        }
      }

      const numberRequired = isDocumentNumberRequired(docType);
      const docNumber = draft.idProofNumber?.trim();
      if (numberRequired && !docNumber) {
        observations.push({
          code: 'ADM_OBS_IDENTITY_DOC_NUMBER_REQUIRED',
          severity: 'INCOMPLETE_DATA',
          section: 'IDENTITY',
          message: `Document Number is required for ${docType}.`,
          guidance: 'Enter the valid document identification number.',
        });
      } else if (!numberRequired && !docNumber) {
        observations.push({
          code: 'ADM_OBS_IDENTITY_DOC_NUMBER_OPTIONAL',
          severity: 'INFO',
          section: 'IDENTITY',
          message: `Document Number is optional for ${docType}.`,
        });
      }
    }

    // Progressive Profile Observations (Non-blocking INFO)
    if (!draft.emergencyContactName || draft.emergencyContactName.trim().length === 0) {
      observations.push({
        code: 'ADM_OBS_IDENTITY_EMERGENCY_CONTACT_MISSING',
        severity: 'INFO',
        section: 'IDENTITY',
        message: 'Emergency contact details not provided.',
        guidance: 'Can be captured progressively in Resident Profile post-admission.',
      });
    }

    if (!draft.permanentAddress || draft.permanentAddress.trim().length === 0) {
      observations.push({
        code: 'ADM_OBS_IDENTITY_ADDRESS_MISSING',
        severity: 'INFO',
        section: 'IDENTITY',
        message: 'Permanent address not provided.',
        guidance: 'Can be captured progressively in Resident Profile post-admission.',
      });
    }

    // =========================================================================
    // 3. COMMERCIAL ASSESSMENT
    // =========================================================================
    const isDateValid = Boolean(draft.checkInDate && !isNaN(Date.parse(draft.checkInDate)));
    if (!isDateValid) {
      observations.push({
        code: 'ADM_OBS_COMMERCIAL_DATE_INVALID',
        severity: 'INCOMPLETE_DATA',
        section: 'COMMERCIAL',
        message: 'Valid check-in date is required.',
        guidance: 'Specify the intended commencement date.',
      });
    }

    const rentNumber = typeof draft.agreedRent === 'number' ? draft.agreedRent : NaN;
    const isRentValid = !isNaN(rentNumber) && rentNumber > 0;
    if (!isRentValid) {
      observations.push({
        code: 'ADM_OBS_COMMERCIAL_RENT_INVALID',
        severity: 'INCOMPLETE_DATA',
        section: 'COMMERCIAL',
        message: 'Agreed monthly rent must be a positive number greater than 0.',
        guidance: 'Specify the agreed monthly rent amount.',
      });
    }

    const depositNumber = typeof draft.agreedDeposit === 'number' ? draft.agreedDeposit : NaN;
    const isDepositValid = !isNaN(depositNumber) && depositNumber >= 0;
    if (!isDepositValid) {
      observations.push({
        code: 'ADM_OBS_COMMERCIAL_DEPOSIT_INVALID',
        severity: 'INCOMPLETE_DATA',
        section: 'COMMERCIAL',
        message: 'Agreed security deposit must be a non-negative number.',
        guidance: 'Specify the agreed security deposit (0 or greater).',
      });
    }

    // Commercial Terms Deviations (Soft Warnings)
    let standardRent = 0;
    let standardDeposit = 0;
    let hasStandardTerms = false;

    if (draft.flatId && Array.isArray(draft.bedIds) && draft.bedIds.length > 0) {
      const targetFlat = flats.find((f) => f.id === draft.flatId || f.name === draft.flatId);
      if (targetFlat) {
        let foundBeds = 0;
        draft.bedIds.forEach((bId) => {
          for (const area of targetFlat.areas) {
            const bed = area.beds.find((b) => b.id === bId);
            if (bed) {
              const r = bed.defaultRent !== undefined ? bed.defaultRent : (area.defaultRent ?? 0);
              const d = bed.defaultDeposit !== undefined ? bed.defaultDeposit : (area.defaultDeposit ?? 0);
              standardRent += r;
              standardDeposit += d;
              foundBeds++;
              break;
            }
          }
        });
        if (foundBeds === draft.bedIds.length) {
          hasStandardTerms = true;
        }
      }
    }

    if (hasStandardTerms && isRentValid && standardRent > 0 && rentNumber !== standardRent) {
      observations.push({
        code: 'ADM_OBS_COMMERCIAL_RENT_DEVIATION',
        severity: 'REVIEW_WARNING',
        section: 'COMMERCIAL',
        message: `Agreed monthly rent (₹${rentNumber.toLocaleString('en-IN')}) differs from standard default rent (₹${standardRent.toLocaleString('en-IN')}).`,
        guidance: 'Review commercial concession or premium before approving.',
      });
    }

    if (hasStandardTerms && isDepositValid && standardDeposit > 0 && depositNumber !== standardDeposit) {
      observations.push({
        code: 'ADM_OBS_COMMERCIAL_DEPOSIT_DEVIATION',
        severity: 'REVIEW_WARNING',
        section: 'COMMERCIAL',
        message: `Agreed security deposit (₹${depositNumber.toLocaleString('en-IN')}) differs from standard default deposit (₹${standardDeposit.toLocaleString('en-IN')}).`,
        guidance: 'Review commercial deposit adjustment before approving.',
      });
    }

    // =========================================================================
    // 4. ACCOMMODATION ASSESSMENT
    // =========================================================================
    const hasFlat = Boolean(draft.flatId && draft.flatId.trim().length > 0);
    const hasBeds = Boolean(Array.isArray(draft.bedIds) && draft.bedIds.length > 0);

    if (!hasFlat) {
      observations.push({
        code: 'ADM_OBS_ACCOM_FLAT_REQUIRED',
        severity: 'INCOMPLETE_DATA',
        section: 'ACCOMMODATION',
        message: 'Flat selection is required.',
        guidance: 'Select a flat from available inventory.',
      });
    }

    if (!hasBeds) {
      observations.push({
        code: 'ADM_OBS_ACCOM_BED_REQUIRED',
        severity: 'INCOMPLETE_DATA',
        section: 'ACCOMMODATION',
        message: 'At least one bed selection is required.',
        guidance: 'Select at least one vacant bed to allocate.',
      });
    }

    if (hasFlat && hasBeds) {
      const targetFlat = flats.find((f) => f.id === draft.flatId || f.name === draft.flatId);
      if (!targetFlat) {
        observations.push({
          code: 'ADM_OBS_ACCOM_FLAT_NOT_FOUND',
          severity: 'INCOMPLETE_DATA',
          section: 'ACCOMMODATION',
          message: `Flat with ID "${draft.flatId}" not found in inventory.`,
          guidance: 'Select an existing flat from inventory.',
        });
      } else {
        const flatBeds = targetFlat.areas.flatMap((a) => a.beds);
        const selectedBedObjects: Array<{ id: string; name: string; status: BedStatus }> = [];

        draft.bedIds!.forEach((bId) => {
          const bed = flatBeds.find((b) => b.id === bId);
          if (!bed) {
            observations.push({
              code: 'ADM_OBS_ACCOM_BED_NOT_FOUND',
              severity: 'INCOMPLETE_DATA',
              section: 'ACCOMMODATION',
              message: `Bed "${bId}" does not belong to Flat ${targetFlat.name}.`,
              guidance: 'Select beds belonging to the chosen flat.',
            });
          } else {
            selectedBedObjects.push(bed);
            if (bed.status === BedStatus.OCCUPIED) {
              observations.push({
                code: 'ADM_OBS_ACCOM_BED_UNAVAILABLE',
                severity: 'INCOMPLETE_DATA',
                section: 'ACCOMMODATION',
                message: `Bed ${bed.name} is currently OCCUPIED (${bed.residentName || 'Another resident'}).`,
                guidance: 'Select a vacant bed for admission.',
              });
            } else if (bed.status === BedStatus.BLOCKED || bed.status === BedStatus.MAINTENANCE) {
              observations.push({
                code: 'ADM_OBS_ACCOM_BED_UNAVAILABLE',
                severity: 'INCOMPLETE_DATA',
                section: 'ACCOMMODATION',
                message: `Bed ${bed.name} is currently in ${bed.status} status and unavailable for allocation.`,
                guidance: 'Unblock or complete maintenance before allocating.',
              });
            }
          }
        });

        // Accommodation Preference Mismatch Check (Soft Warning)
        if (
          reservation &&
          reservation.accommodationPreference &&
          reservation.accommodationPreference.trim().length > 0 &&
          selectedBedObjects.length > 0
        ) {
          const pref = reservation.accommodationPreference.toLowerCase();
          const flatDesc = (targetFlat.description || '').toLowerCase();
          const flatFloor = (targetFlat.floor || '').toLowerCase();
          const flatName = targetFlat.name.toLowerCase();
          const areaNames = targetFlat.areas.map((a) => a.name.toLowerCase()).join(' ');

          const combinedAccommodationText = `${flatName} ${flatFloor} ${flatDesc} ${areaNames}`;

          const stopWords = new Set(['room', 'flat', 'sharing', 'bed', 'floor', 'the', 'and', 'with', 'for', 'any']);
          const prefTokens = pref
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length >= 2 && !stopWords.has(t));

          const hasTokenMatch = prefTokens.length === 0 || prefTokens.every((token) => combinedAccommodationText.includes(token));

          if (!hasTokenMatch) {
            const bedNamesStr = selectedBedObjects.map((b) => b.name).join(', ');
            observations.push({
              code: 'ADM_OBS_ACCOM_PREFERENCE_MISMATCH',
              severity: 'REVIEW_WARNING',
              section: 'ACCOMMODATION',
              message: `Selected accommodation (Flat ${targetFlat.name} / Bed ${bedNamesStr}) differs from prospect preference ("${reservation.accommodationPreference}").`,
              guidance: 'Verify that the resident has agreed to this accommodation selection.',
            });
          }
        }
      }
    }

    // =========================================================================
    // 5. TOKEN ASSESSMENT
    // =========================================================================
    if (activeSourceType === 'WALK_IN' || !reservation) {
      observations.push({
        code: 'ADM_OBS_TOKEN_NOT_APPLICABLE',
        severity: 'INFO',
        section: 'TOKEN',
        message: 'No reservation token for direct walk-in admission.',
      });
    } else {
      const tokenAmount = reservation.tokenAmount || 0;
      if (tokenAmount <= 0) {
        observations.push({
          code: 'ADM_OBS_TOKEN_ZERO',
          severity: 'INFO',
          section: 'TOKEN',
          message: 'No token deposit paid on source reservation.',
        });
      } else {
        if (!draft.tokenDisposition) {
          observations.push({
            code: 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED',
            severity: 'DECISION_REQUIRED',
            section: 'TOKEN',
            message: `Token disposition choice required for ₹${tokenAmount.toLocaleString('en-IN')} token deposit.`,
            guidance: 'Select whether to adjust to Security Deposit, First Rent, or Leave Pending.',
          });
        } else if (draft.tokenDisposition === TokenDisposition.LEAVE_PENDING) {
          observations.push({
            code: 'ADM_OBS_TOKEN_HELD_PENDING',
            severity: 'INFO',
            section: 'TOKEN',
            message: `Token amount ₹${tokenAmount.toLocaleString('en-IN')} will be held pending as unadjusted advance credit.`,
          });
        }
      }
    }

    // =========================================================================
    // 6. CATEGORY AGGREGATION & SECTION ASSESSMENTS
    // =========================================================================
    const sections: AdmissionSection[] = ['SOURCE', 'IDENTITY', 'COMMERCIAL', 'ACCOMMODATION', 'TOKEN'];
    const sectionAssessments: Record<AdmissionSection, SectionAssessment> = {} as any;

    sections.forEach((sec) => {
      const secObs = observations.filter((o) => o.section === sec);
      const hasIncomplete = secObs.some((o) => o.severity === 'INCOMPLETE_DATA');
      const hasDecision = secObs.some((o) => o.severity === 'DECISION_REQUIRED');
      const isComplete = !hasIncomplete && !hasDecision;

      let summary = `${sec} is complete.`;
      if (hasIncomplete) {
        summary = `${sec} has incomplete required information.`;
      } else if (hasDecision) {
        summary = `${sec} requires an operator decision.`;
      } else if (secObs.some((o) => o.severity === 'REVIEW_WARNING')) {
        summary = `${sec} has items requiring review.`;
      }

      sectionAssessments[sec] = {
        section: sec,
        isComplete,
        observationCount: secObs.length,
        summary,
      };
    });

    const category = this.aggregateCategory(observations);
    const summary = this.generateOverallSummary(category, observations);

    return {
      category,
      summary,
      observations,
      sectionAssessments,
    };
  }

  /**
   * Aggregates overall Readiness Category based on observation severities.
   * Priority: INCOMPLETE_DATA -> DECISION_REQUIRED -> REVIEW_WARNING -> READY_FOR_APPROVAL
   */
  private aggregateCategory(observations: ReadinessObservation[]): ReadinessCategory {
    if (observations.some((o) => o.severity === 'INCOMPLETE_DATA')) {
      return 'AWAITING_INFORMATION';
    }
    if (observations.some((o) => o.severity === 'DECISION_REQUIRED')) {
      return 'PENDING_OPERATOR_DECISION';
    }
    if (observations.some((o) => o.severity === 'REVIEW_WARNING')) {
      return 'REQUIRES_REVIEW';
    }
    return 'READY_FOR_APPROVAL';
  }

  private generateOverallSummary(category: ReadinessCategory, observations: ReadinessObservation[]): string {
    switch (category) {
      case 'AWAITING_INFORMATION': {
        const incompleteCount = observations.filter((o) => o.severity === 'INCOMPLETE_DATA').length;
        return `${incompleteCount} mandatory operational field(s) require completion before approval.`;
      }
      case 'PENDING_OPERATOR_DECISION': {
        return 'An operator decision is required (e.g. token disposition choice) before final approval.';
      }
      case 'REQUIRES_REVIEW': {
        const warningCount = observations.filter((o) => o.severity === 'REVIEW_WARNING').length;
        return `${warningCount} observation(s) differ from default standards and require operator review.`;
      }
      case 'READY_FOR_APPROVAL': {
        return 'All admission preparation criteria are satisfied and ready for approval.';
      }
    }
  }
}
