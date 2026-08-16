import { describe, it, expect, beforeEach } from 'vitest';
import FinanceWorkspacePage from '../FinanceWorkspacePage';
import { FinanceWorkspaceCoordinator } from '../../application/coordinator/FinanceWorkspaceCoordinator';
import { financeStorage } from '../../storage/financeStorage';

describe('FinanceWorkspacePage Component & Global Actions Flow Suite', () => {
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

  it('instantiates FinanceWorkspacePage cleanly as a function component', () => {
    expect(typeof FinanceWorkspacePage).toBe('function');
  });

  it('provides authentic selectable stays for global actions without RES-GLOBAL placeholder', () => {
    const coordinator = new FinanceWorkspaceCoordinator();
    const selectableStays = coordinator.getActiveStaysForSelection();

    // Verify real stays exist
    expect(selectableStays.length).toBeGreaterThanOrEqual(2);

    // Verify all selectable stays have valid stayIds and real resident codes
    selectableStays.forEach((item) => {
      expect(item.stayId).not.toBe('res_global');
      expect(item.stayId).not.toBe('GLOBAL');
      expect(item.residentCode).not.toBe('RES-GLOBAL');
      expect(item.residentName).not.toBe('Global Finance Account');
      expect(item.flatName).not.toBe('No Flat');
      expect(item.allocatedBedsLabel).not.toBe('No Bed Allocated');
      expect(['ACTIVE', 'ON_NOTICE']).toContain(item.status);
    });

    // Check specific Rajesh Kumar stay
    const rajeshStay = selectableStays.find((s) => s.residentId === 'RES-00124');
    expect(rajeshStay).toBeDefined();
    expect(rajeshStay?.residentName).toBe('Rajesh Kumar');
    expect(rajeshStay?.stayId).toBe('STAY-2026-00041');
    expect(rajeshStay?.flatName).toContain('101');
    expect(rajeshStay?.allocatedBedsLabel).toContain('101-B1');
    expect(rajeshStay?.agreedRent).toBe(8500);

    // Check specific Amit Sharma on-notice stay
    const amitStay = selectableStays.find((s) => s.residentId === 'RES-00125');
    expect(amitStay).toBeDefined();
    expect(amitStay?.residentName).toBe('Amit Sharma');
    expect(amitStay?.stayId).toBe('STAY-2026-00042');
    expect(amitStay?.status).toBe('ON_NOTICE');
    expect(amitStay?.flatName).toContain('102');
    expect(amitStay?.allocatedBedsLabel).toContain('102-B1');
  });
});
