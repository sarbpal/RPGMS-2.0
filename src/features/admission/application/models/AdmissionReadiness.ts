export interface AdmissionReadiness {
  // Reordered validation sequence (Refinement #6)
  isReservationValid: boolean;
  isResidentDetailsValid: boolean;
  isCommercialTermsValid: boolean;
  isAccommodationValid: boolean;
  isTokenDecisionValid: boolean;
  isReadyToConfirm: boolean;
  validationMessages: string[];
}
