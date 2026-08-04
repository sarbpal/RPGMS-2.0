import { describe, it, expect } from 'vitest';
import { ResidentWorkspaceCoordinator } from '../ResidentWorkspaceCoordinator';

describe('ResidentWorkspaceCoordinator', () => {
  it('should create view model for resident with active stay projection and Phase 2B models', () => {
    const coordinator = new ResidentWorkspaceCoordinator();
    const vm = coordinator.createViewModel('RES-00124');

    expect(vm.header.fullName).toBe('Rajesh Kumar');
    expect(vm.header.residentCode).toBe('R000124');
    expect(vm.currentStay.hasActiveStay).toBe(true);
    expect(vm.currentStay.monthlyRent).toBeGreaterThan(0);
    expect(vm.currentStay.securityDeposit).toBeGreaterThan(0);
    expect(vm.personalInformation.fullName).toBe('Rajesh Kumar');
    expect(vm.address.city).toBe('Bangalore');

    // Phase 2B Assertions
    expect(vm.profileCompletion.percentage).toBeGreaterThan(0);
    expect(vm.operationalReadiness.isReady).toBe(true);
    expect(vm.operationalReadiness.statusLabel).toBe('Operationally Ready');
    expect(vm.vehicles.length).toBeGreaterThan(0);
    expect(vm.vehicles[0].registrationNumber).toBe('KA 01 AB 1234');
    expect(vm.devices.length).toBeGreaterThan(0);
    expect(vm.devices[0].deviceName).toBe('MacBook Pro');
  });

  it('should handle non-existent resident gracefully', () => {
    const coordinator = new ResidentWorkspaceCoordinator();
    const vm = coordinator.createViewModel('NON_EXISTENT_ID');

    expect(vm.header.fullName).toBe('Unknown Resident');
    expect(vm.currentStay.hasActiveStay).toBe(false);
    expect(vm.operationalReadiness.isReady).toBe(false);
    expect(vm.operationalReadiness.statusLabel).toBe('Attention Required');
  });
});
