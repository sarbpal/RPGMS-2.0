export const ResolutionOutcome = {
  ITEM_RECOVERED: 'ITEM_RECOVERED',
  SERVICE_CORRECTED: 'SERVICE_CORRECTED',
  VENDOR_CORRECTED: 'VENDOR_CORRECTED',
  RESIDENT_ACCEPTED: 'RESIDENT_ACCEPTED',
  PERMANENTLY_LOST: 'PERMANENTLY_LOST',
  NO_ACTION_REQUIRED: 'NO_ACTION_REQUIRED',
  OTHER: 'OTHER',
} as const;

export type ResolutionOutcome = (typeof ResolutionOutcome)[keyof typeof ResolutionOutcome];
