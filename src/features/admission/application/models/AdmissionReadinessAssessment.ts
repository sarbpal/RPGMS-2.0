/**
 * Four canonical Readiness Assessment categories defined by SPEC-ADM-001.
 * Represents the operator-facing posture during Admission Preparation.
 */
export type ReadinessCategory =
  | 'READY_FOR_APPROVAL'
  | 'REQUIRES_REVIEW'
  | 'AWAITING_INFORMATION'
  | 'PENDING_OPERATOR_DECISION';

/**
 * Severity level of an individual Readiness Observation.
 */
export type ObservationSeverity =
  | 'INFO'               // Progressive profile information or informational notice
  | 'REVIEW_WARNING'     // Soft operational/commercial divergence requiring review
  | 'DECISION_REQUIRED'  // Explicit operator choice needed (e.g. token disposition)
  | 'INCOMPLETE_DATA';   // Missing mandatory operational field

/**
 * Admission Preparation business section.
 */
export type AdmissionSection =
  | 'SOURCE'
  | 'IDENTITY'
  | 'COMMERCIAL'
  | 'ACCOMMODATION'
  | 'TOKEN';

/**
 * Diagnostic observation produced during Admission Preparation evaluation.
 */
export interface ReadinessObservation {
  readonly code: string;
  readonly severity: ObservationSeverity;
  readonly section: AdmissionSection;
  readonly message: string;
  readonly guidance?: string;
}

/**
 * Section-level assessment summary for workspace card decoration.
 */
export interface SectionAssessment {
  readonly section: AdmissionSection;
  readonly isComplete: boolean;
  readonly observationCount: number;
  readonly summary: string;
}

/**
 * Complete advisory Admission Readiness Assessment read-model.
 * Transient, calculated value object with NO transaction authority fields.
 */
export interface AdmissionReadinessAssessment {
  readonly category: ReadinessCategory;
  readonly summary: string;
  readonly observations: readonly ReadinessObservation[];
  readonly sectionAssessments: Readonly<Record<AdmissionSection, SectionAssessment>>;
}
