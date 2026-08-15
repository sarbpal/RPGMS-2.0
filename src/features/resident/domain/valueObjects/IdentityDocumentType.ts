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

/**
 * Determines whether a document number is mandatory for the given document type.
 * Based on canonical Resident Workspace Specification Section 9.3.1.
 */
export function isDocumentNumberRequired(docType?: string): boolean {
  if (!docType) return false;
  const normalized = docType.toUpperCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'AADHAAR':
    case 'PAN':
    case 'PASSPORT':
    case 'DRIVING_LICENCE':
    case 'DRIVING_LICENSE':
    case 'VOTER_ID':
    case 'GOVERNMENT_ID':
      return true;
    case 'OTHER':
    default:
      return false;
  }
}
