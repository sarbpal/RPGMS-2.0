import { beforeEach, describe, expect, it } from 'vitest';
import { MaintenanceWorkspaceCoordinator } from '../MaintenanceWorkspaceCoordinator';

describe('MaintenanceWorkspaceCoordinator', () => {
  let coordinator: MaintenanceWorkspaceCoordinator;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    coordinator = new MaintenanceWorkspaceCoordinator();
  });

  it('creates workspace ViewModel with metrics and enriched items', async () => {
    const viewModel = await coordinator.createViewModel();

    expect(viewModel.metrics).toBeDefined();
    expect(viewModel.requests.length).toBeGreaterThan(0);
    expect(viewModel.personnelList.length).toBeGreaterThan(0);
    expect(viewModel.analytics).toBeDefined();

    const firstItem = viewModel.requests[0];
    expect(firstItem.locationSummary).toContain('Flat');
    expect(firstItem.createdAtFormatted).toBeDefined();
  });

  it('registers a new maintenance request and updates ViewModel', async () => {
    const newReq = await coordinator.registerRequest({
      title: 'Water Leak',
      description: 'Balcony tap leaking',
      category: 'PLUMBING',
      priority: 'HIGH',
      reporterType: 'STAFF',
      reporterName: 'Supervisor Vijay',
      flatId: 'flat-101',
      estimateCost: 1200,
      actorId: 'usr-1',
      actorName: 'Supervisor Vijay',
    });

    expect(newReq.ticketNumber).toMatch(/^MNT-2026-\d{4}$/);

    const viewModel = await coordinator.createViewModel({ searchQuery: 'Water Leak' });
    expect(viewModel.requests.length).toBe(1);
    expect(viewModel.requests[0].title).toBe('Water Leak');
  });

  it('updates status of a request with resolution notes', async () => {
    const newReq = await coordinator.registerRequest({
      title: 'Faulty Fan',
      description: 'Fan noisy',
      category: 'ELECTRICAL',
      priority: 'LOW',
      reporterType: 'OTHER',
      reporterName: 'Inspector',
      flatId: 'flat-102',
      actorId: 'usr-1',
      actorName: 'Inspector',
    });

    const resolved = await coordinator.updateStatus({
      requestId: newReq.id,
      targetStatus: 'RESOLVED',
      resolutionNotes: 'Capacitor replaced',
      actualCost: 250,
      actorId: 'tech-1',
      actorName: 'Suresh',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionNotes).toBe('Capacitor replaced');
    expect(resolved.actualCost).toBe(250);
  });

  it('creates and manages maintenance personnel', async () => {
    const personnel = await coordinator.createPersonnel({
      name: 'Karan Repairman',
      phone: '+91 99999 88888',
      type: 'EXTERNAL',
      notes: 'General Technician',
    });

    expect(personnel.name).toBe('Karan Repairman');
    expect(personnel.isActive).toBe(true);

    const toggled = await coordinator.togglePersonnelStatus(personnel.id);
    expect(toggled.isActive).toBe(false);
  });
});
