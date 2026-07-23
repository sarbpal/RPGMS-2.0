import type { AccountType } from '../valueObjects/AccountType';
import type { LedgerReferenceType } from '../valueObjects/LedgerReferenceType';

export interface LedgerEntry {
  id: string;
  stayId: string;
  postingDate: string;
  effectiveDate: string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  account: AccountType;
  debit: number;
  credit: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
}
