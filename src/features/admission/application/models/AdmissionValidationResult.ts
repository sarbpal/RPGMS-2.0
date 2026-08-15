/**
 * Diagnostic validation error produced by Pre-Commit Validation Gate.
 * Enforces non-negotiable system invariants immediately before transaction commit.
 */
export interface AdmissionValidationError {
  readonly code: string;
  readonly field?: string;
  readonly message: string;
}

/**
 * Authoritative Pre-Commit Validation Result.
 * Answers exclusively: "Can this Admission legally and operationally commit to the system?"
 */
export interface AdmissionValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly AdmissionValidationError[];
}
