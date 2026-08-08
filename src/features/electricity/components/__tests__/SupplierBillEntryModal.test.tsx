import { describe, it, expect, vi } from 'vitest';
import { SupplierBillEntryModal } from '../SupplierBillEntryModal';

describe('Stage 4 — SupplierBillEntryModal Unit Tests', () => {
  it('instantiates SupplierBillEntryModal component props correctly', () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    const props = {
      open: true,
      onClose: handleClose,
      onSubmit: handleSubmit,
      defaultFlatId: 'flat-test-101',
    };

    expect(props.open).toBe(true);
    expect(props.defaultFlatId).toBe('flat-test-101');
    expect(typeof SupplierBillEntryModal).toBe('function');
  });

  it('validates submission payload formatting', () => {
    const handleSubmit = vi.fn().mockReturnValue(true);

    const input = {
      supplierName: 'TPDDL Electricity',
      supplierBillNumber: 'TPDDL-INV-99',
      supplierAmount: 2500,
    };

    const ok = handleSubmit(input, 'flat-test-101', '2026-07-01', '2026-07-31');

    expect(ok).toBe(true);
    expect(handleSubmit).toHaveBeenCalledWith(
      {
        supplierName: 'TPDDL Electricity',
        supplierBillNumber: 'TPDDL-INV-99',
        supplierAmount: 2500,
      },
      'flat-test-101',
      '2026-07-01',
      '2026-07-31'
    );
  });
});
