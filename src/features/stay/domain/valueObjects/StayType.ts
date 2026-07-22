export const StayType = {
  REGULAR: 'REGULAR',
  SHORT_TERM: 'SHORT_TERM',
  TRANSITIONAL: 'TRANSITIONAL',
  GUEST: 'GUEST',
} as const;

export type StayType = (typeof StayType)[keyof typeof StayType];
