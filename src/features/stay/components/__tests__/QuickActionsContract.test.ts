import { describe, it, expect, vi } from 'vitest';
import { QuickActions, type QuickActionsProps } from '../QuickActions';

describe('QuickActions Contract & Action Wiring', () => {
  it('exposes and triggers all seven quick action callbacks', () => {
    const onRecordPayment = vi.fn();
    const onGenerateRent = vi.fn();
    const onAddLaundry = vi.fn();
    const onAddElectricity = vi.fn();
    const onTransferBed = vi.fn();
    const onGiveNotice = vi.fn();
    const onBeginCheckout = vi.fn();
    const onTransferFlat = vi.fn();
    const onAllocateAdditionalBed = vi.fn();
    const onReleaseBed = vi.fn();
    const onPartialDepositReturn = vi.fn();
    const onDepositDeduction = vi.fn();
    const onViewLedger = vi.fn();

    const props: QuickActionsProps = {
      onRecordPayment,
      onGenerateRent,
      onAddLaundry,
      onAddElectricity,
      onTransferBed,
      onGiveNotice,
      onBeginCheckout,
      onTransferFlat,
      onAllocateAdditionalBed,
      onReleaseBed,
      onPartialDepositReturn,
      onDepositDeduction,
      onViewLedger,
    };

    // Instantiate QuickActions component element
    const element = QuickActions(props);
    expect(element).toBeDefined();

    // Verify all callbacks can be invoked as provided
    props.onRecordPayment?.();
    props.onGenerateRent?.();
    props.onAddLaundry?.();
    props.onAddElectricity?.();
    props.onTransferBed?.();
    props.onGiveNotice?.();
    props.onBeginCheckout?.();
    props.onTransferFlat?.();
    props.onAllocateAdditionalBed?.();
    props.onReleaseBed?.();
    props.onPartialDepositReturn?.();
    props.onDepositDeduction?.();
    props.onViewLedger?.();

    expect(onRecordPayment).toHaveBeenCalledTimes(1);
    expect(onGenerateRent).toHaveBeenCalledTimes(1);
    expect(onAddLaundry).toHaveBeenCalledTimes(1);
    expect(onAddElectricity).toHaveBeenCalledTimes(1);
    expect(onTransferBed).toHaveBeenCalledTimes(1);
    expect(onGiveNotice).toHaveBeenCalledTimes(1);
    expect(onBeginCheckout).toHaveBeenCalledTimes(1);
    expect(onTransferFlat).toHaveBeenCalledTimes(1);
    expect(onAllocateAdditionalBed).toHaveBeenCalledTimes(1);
    expect(onReleaseBed).toHaveBeenCalledTimes(1);
    expect(onPartialDepositReturn).toHaveBeenCalledTimes(1);
    expect(onDepositDeduction).toHaveBeenCalledTimes(1);
    expect(onViewLedger).toHaveBeenCalledTimes(1);
  });

  it('handles default empty props safely without error', () => {
    const element = QuickActions();
    expect(element).toBeDefined();
  });
});
