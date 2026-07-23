import type { SettlementType, SettlementOutcome, SettlementPreview } from '../valueObjects/SettlementValueObjects';
import type { PaymentMethod } from '../valueObjects/PaymentValueObjects';

export interface Settlement {
  id: string;
  stayId: string;
  settlementNumber: string;
  settlementDate: string;
  settlementType: SettlementType;
  previewSnapshot: SettlementPreview;
  finalAmount: number;
  outcome: SettlementOutcome;
  paymentMethod: PaymentMethod;
  remarks?: string;
  ledgerReferences: string[];
  createdBy: string;
  status: 'DRAFT' | 'SETTLED' | 'CANCELLED';
  createdAt: string;
}
