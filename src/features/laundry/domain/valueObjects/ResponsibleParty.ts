export const ResponsibleParty = {
  VENDOR: 'VENDOR',
  RESIDENT: 'RESIDENT',
  RPGMS: 'RPGMS',
  UNKNOWN: 'UNKNOWN',
  NONE: 'NONE',
  OTHER: 'OTHER',
} as const;

export type ResponsibleParty = (typeof ResponsibleParty)[keyof typeof ResponsibleParty];
