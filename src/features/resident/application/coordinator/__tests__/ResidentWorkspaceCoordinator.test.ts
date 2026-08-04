import { describe, it, expect } from 'vitest';
import { ResidentWorkspaceCoordinator } from '../ResidentWorkspaceCoordinator';

describe('ResidentWorkspaceCoordinator', () => {
  it('should create view model for resident with active stay projection', () => {
    const coordinator = new ResidentWorkspaceCoordinator();
    const vm = coordinator.createViewModel('RES-00124');

    expect(vm.header.fullName).toBe('Rajesh Kumar');
    expect(vm.header.residentCode).toBe('R000124');
    expect(vm.currentStay.hasActiveStay).toBe(true);
    expect(vm.currentStay.monthlyRent).toBeGreaterThan(0);
    expect(vm.currentStay.securityDeposit).toBeGreaterThan(0);
    expect(vm.personalInformation.fullName).toBe('Rajesh Kumar');
    expect(vm.address.city).toBe('Bangalore');
  });

  it('should handle non-existent resident gracefully', () => {
    const coordinator = new ResidentWorkspaceCoordinator();
    const vm = coordinator.createViewModel('NON_EXISTENT_ID');

    expect(vm.header.fullName).toBe('Unknown Resident');
    expect(vm.currentStay.hasActiveStay).toBe(false);
  });
});
