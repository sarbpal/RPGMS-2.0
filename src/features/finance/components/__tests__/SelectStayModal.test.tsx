import { describe, it, expect, vi } from 'vitest';
import { SelectStayModal, type SelectStayModalProps } from '../SelectStayModal';
import type { SelectableStayItem } from '../../application/coordinator/FinanceWorkspaceCoordinator';

describe('SelectStayModal Component Suite', () => {
  const mockStays: SelectableStayItem[] = [
    {
      stayId: 'STAY-101',
      residentId: 'RES-101',
      residentName: 'Rajesh Kumar',
      residentCode: 'R00124',
      phone: '9876543210',
      flatId: '101',
      flatName: 'Flat 101',
      allocatedBedsLabel: 'Bed 101-B1',
      status: 'ACTIVE',
      checkInDate: '2026-01-01',
      agreedRent: 8500,
      agreedDeposit: 17000,
      currentBalance: 8500,
      balances: {
        receivableBalance: 8500,
        securityDepositHeld: 17000,
        advanceCreditBalance: 0,
        refundPayable: 0,
        netBalance: 8500,
      },
      resident: {
        id: 'RES-101',
        residentCode: 'R00124',
        fullName: 'Rajesh Kumar',
        mobileNumber: '9876543210',
        status: 'ACTIVE',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      flat: null,
    },
    {
      stayId: 'STAY-102',
      residentId: 'RES-102',
      residentName: 'Amit Sharma',
      residentCode: 'R00125',
      phone: '9876543211',
      flatId: '102',
      flatName: 'Flat 102',
      allocatedBedsLabel: 'Bed 102-B1',
      status: 'ON_NOTICE',
      checkInDate: '2026-02-01',
      agreedRent: 9000,
      agreedDeposit: 18000,
      currentBalance: 0,
      balances: {
        receivableBalance: 0,
        securityDepositHeld: 18000,
        advanceCreditBalance: 0,
        refundPayable: 0,
        netBalance: 0,
      },
      resident: {
        id: 'RES-102',
        residentCode: 'R00125',
        fullName: 'Amit Sharma',
        mobileNumber: '9876543211',
        status: 'ACTIVE',
        createdAt: '2026-02-01',
        updatedAt: '2026-02-01',
      },
      flat: null,
    },
  ];

  it('instantiates SelectStayModal component cleanly', () => {
    expect(typeof SelectStayModal).toBe('function');
  });

  it('triggers onSelectStay when stay is chosen', () => {
    const onSelectStay = vi.fn();
    const onClose = vi.fn();

    const props: SelectStayModalProps = {
      open: true,
      actionType: 'GENERATE_RENT',
      stays: mockStays,
      onSelectStay,
      onClose,
    };

    props.onSelectStay(mockStays[0]);
    expect(onSelectStay).toHaveBeenCalledWith(mockStays[0]);
    expect(onSelectStay).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when cancelled', () => {
    const onSelectStay = vi.fn();
    const onClose = vi.fn();

    const props: SelectStayModalProps = {
      open: true,
      actionType: 'ADD_LAUNDRY',
      stays: mockStays,
      onSelectStay,
      onClose,
    };

    props.onClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
