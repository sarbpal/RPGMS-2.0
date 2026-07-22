export const IdentityDocumentType = {
  AADHAAR: 'AADHAAR',
  PAN: 'PAN',
  PASSPORT: 'PASSPORT',
  DRIVING_LICENCE: 'DRIVING_LICENCE',
  VOTER_ID: 'VOTER_ID',
  GOVERNMENT_ID: 'GOVERNMENT_ID',
  OTHER: 'OTHER',
} as const;

export type IdentityDocumentType =
  (typeof IdentityDocumentType)[keyof typeof IdentityDocumentType];
