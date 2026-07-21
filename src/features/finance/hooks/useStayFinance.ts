import { useState, useCallback, useEffect } from 'react';
import type { Bill, Payment, Settlement, StayBalance } from '../types';
import { balanceEngine } from '../services/balanceEngine';
import { billingService } from '../services/billingService';
import { paymentService } from '../services/paymentService';
import { settlementService } from '../services/settlementService';

export interface UseStayFinanceReturn {
  balances: StayBalance;
  bills: Bill[];
  payments: Payment[];
  settlement: Settlement | null;
  loading: boolean;
  refresh: () => void;
}

export function useStayFinance(stayId: string | undefined): UseStayFinanceReturn {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<StayBalance>({
    receivableBalance: 0,
    securityDepositHeld: 0,
    advanceCreditBalance: 0,
    refundPayable: 0,
    netBalance: 0,
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlement, setSettlement] = useState<Settlement | null>(null);

  const refresh = useCallback(() => {
    if (!stayId) return;
    setLoading(true);
    setBalances(balanceEngine.calculateStayBalances(stayId));
    setBills(billingService.getBillsByStayId(stayId));
    setPayments(paymentService.getPaymentsByStayId(stayId));
    setSettlement(settlementService.getSettlementByStayId(stayId));
    setLoading(false);
  }, [stayId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    balances,
    bills,
    payments,
    settlement,
    loading,
    refresh,
  };
}
