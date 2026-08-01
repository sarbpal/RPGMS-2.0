export const TokenDisposition = {
  ADJUST_TO_SECURITY_DEPOSIT: 'ADJUST_TO_SECURITY_DEPOSIT',
  ADJUST_TO_FIRST_RENT: 'ADJUST_TO_FIRST_RENT',
  LEAVE_PENDING: 'LEAVE_PENDING',
} as const;

export type TokenDisposition = (typeof TokenDisposition)[keyof typeof TokenDisposition];

export function formatTokenDispositionLabel(disposition: TokenDisposition): string {
  switch (disposition) {
    case TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT:
      return 'Adjust to Security Deposit';
    case TokenDisposition.ADJUST_TO_FIRST_RENT:
      return 'Adjust to First Month Rent';
    case TokenDisposition.LEAVE_PENDING:
      return 'Leave Pending / No Adjustment';
    default:
      return disposition;
  }
}
