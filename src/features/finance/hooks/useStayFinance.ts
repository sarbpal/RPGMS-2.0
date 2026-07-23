import { useState, useCallback, useMemo } from 'react';
import type { Bill, Payment, Settlement, StayBalance } from '../types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';
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
  const [refreshCount, setRefreshCount] = useState(0);
  const coordinator = useMemo(() => new FinanceWorkspaceCoordinator(), []);

  const data = useMemo(() => {
    void refreshCount;
    if (!stayId) {

      return {
        balances: {
          receivableBalance: 0,
          securityDepositHeld: 0,
          advanceCreditBalance: 0,
          refundPayable: 0,
          netBalance: 0,
        },
        bills: [],
        payments: [],
        settlement: null,
      };
    }
    const vm = coordinator.getStayFinanceViewModel(stayId);
    return {
      balances: vm.balances,
      bills: billingService.getBillsByStayId(stayId),
      payments: paymentService.getPaymentsByStayId(stayId),
      settlement: settlementService.getSettlementByStayId(stayId),
    };
  }, [stayId, coordinator, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  return {
    balances: data.balances,
    bills: data.bills,
    payments: data.payments,
    settlement: data.settlement,
    loading: false,
    refresh,
  };
}
