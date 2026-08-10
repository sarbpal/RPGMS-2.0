import { beforeEach, describe, expect, it } from 'vitest';
import { MaintenanceRequest } from '../../../domain/entities/MaintenanceRequest';
import { InMemoryMaintenanceRepository } from '../InMemoryMaintenanceRepository';

describe('InMemoryMaintenanceRepository', () => {
  let repository: InMemoryMaintenanceRepository;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    repository = new InMemoryMaintenanceRepository();
  });

  it('generates sequential ticket numbers correctly', async () => {
    const ticket1 = await repository.generateTicketNumber();
    expect(ticket1).toMatch(/^MNT-2026-\d{4}$/);
  });

  it('searches requests by combinable filters', async () => {
    const results = await repository.search({
      status: 'IN_PROGRESS',
      priority: 'URGENT',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].status).toBe('IN_PROGRESS');
    expect(results[0].priority).toBe('URGENT');
  });

  it('searches requests by ticket number exact/partial match', async () => {
    const results = await repository.search({
      ticketNumber: '0001',
    });

    expect(results.length).toBe(1);
    expect(results[0].ticketNumber).toBe('MNT-2026-0001');
  });

  it('filters requests by financial cost ranges (estimate and actual cost)', async () => {
    // Filter by estimate range (1000 - 2000)
    const estimateFiltered = await repository.search({
      estimateFrom: 1000,
      estimateTo: 2000,
    });
    expect(estimateFiltered.length).toBeGreaterThan(0);
    estimateFiltered.forEach((req) => {
      expect(req.estimateCost).toBeGreaterThanOrEqual(1000);
      expect(req.estimateCost).toBeLessThanOrEqual(2000);
    });

    // Filter by actual cost range (700 - 800)
    const actualFiltered = await repository.search({
      actualCostFrom: 700,
      actualCostTo: 800,
    });
    expect(actualFiltered.length).toBe(1);
    expect(actualFiltered[0].actualCost).toBe(750);
  });

  it('calculates analytics and period breakdowns correctly', async () => {
    const analytics = await repository.getAnalytics();

    expect(analytics.performance.totalTickets).toBeGreaterThan(0);
    expect(analytics.byPeriod.length).toBeGreaterThan(0);
    expect(analytics.financial.totalEstimatedCost).toBeGreaterThan(0);
  });

  it('calculates technician performance metrics', async () => {
    const techMetrics = await repository.getTechnicianMetrics('per-101');

    expect(techMetrics.personnelId).toBe('per-101');
    expect(techMetrics.totalAssigned).toBeGreaterThan(0);
    expect(techMetrics.personnelName).toBe('Ramesh Kumar');
  });

  it('saves new maintenance requests and persists them', async () => {
    const ticketNum = await repository.generateTicketNumber();
    const newReq = new MaintenanceRequest({
      id: 'mnt-test-1',
      ticketNumber: ticketNum,
      title: 'Broken Handle',
      description: 'Main door handle broke',
      category: 'CARPENTRY',
      priority: 'MEDIUM',
      status: 'OPEN',
      reporterType: 'STAFF',
      reporterName: 'Supervisor',
      flatId: 'flat-101',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await repository.save(newReq);

    const retrieved = await repository.findById('mnt-test-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Broken Handle');
  });
});
