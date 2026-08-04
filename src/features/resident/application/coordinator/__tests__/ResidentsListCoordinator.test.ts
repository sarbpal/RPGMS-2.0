import { describe, it, expect } from 'vitest';
import { ResidentsListCoordinator } from '../ResidentsListCoordinator';

describe('ResidentsListCoordinator', () => {
  it('should initialize and create a view model with seed data summary stats', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('', 'ALL');

    expect(vm.summary.totalCount).toBeGreaterThan(0);
    expect(vm.activeFilter).toBe('ALL');
    expect(vm.searchQuery).toBe('');
    expect(vm.residents.length).toBe(vm.summary.totalCount);
  });

  it('should filter by ACTIVE status correctly', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('', 'ACTIVE');

    expect(vm.activeFilter).toBe('ACTIVE');
    expect(vm.residents.every((r) => r.status === 'ACTIVE')).toBe(true);
    expect(vm.residents.length).toBe(vm.summary.activeCount);
  });

  it('should filter by ON_NOTICE status correctly', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('', 'ON_NOTICE');

    expect(vm.activeFilter).toBe('ON_NOTICE');
    expect(vm.residents.every((r) => r.status === 'ON_NOTICE')).toBe(true);
    expect(vm.residents.length).toBe(vm.summary.onNoticeCount);
  });

  it('should filter by ALUMNI status correctly', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('', 'ALUMNI');

    expect(vm.activeFilter).toBe('ALUMNI');
    expect(vm.residents.every((r) => r.status === 'CHECKED_OUT' || r.status === 'ALUMNI')).toBe(true);
    expect(vm.residents.length).toBe(vm.summary.alumniCount);
  });

  it('should filter residents by search query using existing search logic', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('Rajesh', 'ALL');

    expect(vm.residents.length).toBe(1);
    expect(vm.residents[0].fullName).toBe('Rajesh Kumar');
  });

  it('should handle empty search results gracefully', () => {
    const coordinator = new ResidentsListCoordinator();
    const vm = coordinator.createViewModel('NonExistentResidentQuery', 'ALL');

    expect(vm.residents.length).toBe(0);
  });
});
