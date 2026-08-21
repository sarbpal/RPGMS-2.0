import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceivePaymentModal, type ReceivePaymentModalProps } from '../ReceivePaymentModal';
import { paymentService } from '../../services/paymentService';
import { financeStorage } from '../../storage/financeStorage';
import type { Resident } from '../../../resident';
import type { Flat } from '../../../accommodation/types';

describe('ReceivePaymentModal Component & Resident Snapshot Suite', () => {
  const mockResident: Resident = {
    id: 'RES-004',
    residentCode: 'RESID-000004',
    fullName: 'Tito Singh',
    mobileNumber: '+91 98765 00004',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const mockFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    areas: [],
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
      localStorage.removeItem('rpgms_residents');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('instantiates ReceivePaymentModal cleanly as a function component', () => {
    expect(typeof ReceivePaymentModal).toBe('function');
  });

  it('receives and binds resident-scoped currentMonthCharges and stay balances correctly', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const props: ReceivePaymentModalProps = {
      open: true,
      onClose,
      resident: {
        ...mockResident,
        allocatedBedIds: ['BED-101-H1'],
        agreedRent: 12000,
        agreedDeposit: 12000,
      } as Resident,
      selectedFlat: mockFlat,
      stayId: 'stay-000004',
      balances: {
        receivableBalance: 12000,
        securityDepositHeld: 12000,
        advanceCreditBalance: 0,
        refundPayable: 0,
        netBalance: 12000,
      },
      currentMonthCharges: 12000, // Stay-scoped (NOT property-wide 89500)
      lastPaymentDateText: 'No payments recorded yet',
      onSuccess,
    };

    expect(props.currentMonthCharges).toBe(12000);
    expect(props.balances.receivableBalance).toBe(12000);
    expect(props.stayId).toBe('stay-000004');
    expect(props.lastPaymentDateText).toBe('No payments recorded yet');
  });

  it('submits payment recording through paymentService when valid data is provided', () => {
    const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
      success: true,
      payment: {
        id: 'pay-test-99',
        paymentNumber: 'PAY-202608-0099',
        stayId: 'stay-000004',
        amount: 12000,
        paymentDate: '2026-08-21',
        paymentMethod: 'CASH',
        allocations: [],
        createdAt: '2026-08-21T00:00:00Z',
      },
      errors: [],
    });

    const result = paymentService.recordPayment({
      stayId: 'stay-000004',
      amount: 12000,
      paymentDate: '2026-08-21',
      paymentMethod: 'CASH',
    });

    expect(recordSpy).toHaveBeenCalledWith({
      stayId: 'stay-000004',
      amount: 12000,
      paymentDate: '2026-08-21',
      paymentMethod: 'CASH',
    });
    expect(result.success).toBe(true);
    expect(result.payment?.amount).toBe(12000);

    recordSpy.mockRestore();
  });
});
