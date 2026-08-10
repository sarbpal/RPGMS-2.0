import { describe, expect, it } from 'vitest';
import { maintenanceRules } from '../maintenanceRules';

describe('maintenanceRules', () => {
  it('validates title and description', () => {
    expect(() => maintenanceRules.validateTitle('')).toThrow('title is required');
    expect(() => maintenanceRules.validateDescription('  ')).toThrow('description is required');
    expect(() => maintenanceRules.validateTitle('Leaking Tap')).not.toThrow();
  });

  it('validates resident reporter stay requirement', () => {
    expect(() =>
      maintenanceRules.validateReporter('RESIDENT', 'John Doe', undefined)
    ).toThrow('associated with a valid Stay');

    expect(() =>
      maintenanceRules.validateReporter('RESIDENT', 'John Doe', 'stay-123')
    ).not.toThrow();

    expect(() =>
      maintenanceRules.validateReporter('STAFF', 'Staff Admin', undefined)
    ).not.toThrow();

    expect(() =>
      maintenanceRules.validateReporter('OTHER', 'Visitor', undefined)
    ).not.toThrow();
  });

  it('handles state machine transitions correctly', () => {
    expect(maintenanceRules.canTransitionStatus('OPEN', 'IN_PROGRESS')).toBe(true);
    expect(maintenanceRules.canTransitionStatus('OPEN', 'RESOLVED')).toBe(true);
    expect(maintenanceRules.canTransitionStatus('OPEN', 'CANCELLED')).toBe(true);
    expect(maintenanceRules.canTransitionStatus('IN_PROGRESS', 'OPEN')).toBe(true);
    expect(maintenanceRules.canTransitionStatus('IN_PROGRESS', 'RESOLVED')).toBe(true);

    // Terminal state transitions forbidden
    expect(maintenanceRules.canTransitionStatus('RESOLVED', 'OPEN')).toBe(false);
    expect(maintenanceRules.canTransitionStatus('RESOLVED', 'IN_PROGRESS')).toBe(false);
    expect(maintenanceRules.canTransitionStatus('CANCELLED', 'OPEN')).toBe(false);
  });

  it('validates resolution notes and cancellation reasons', () => {
    expect(() =>
      maintenanceRules.validateStatusTransition('IN_PROGRESS', {
        status: 'RESOLVED',
        resolutionNotes: '',
        actorId: 'usr-1',
        actorName: 'Admin',
      })
    ).toThrow('Resolution notes are required');

    expect(() =>
      maintenanceRules.validateStatusTransition('OPEN', {
        status: 'CANCELLED',
        cancellationReason: '',
        actorId: 'usr-1',
        actorName: 'Admin',
      })
    ).toThrow('Cancellation reason is required');

    expect(() =>
      maintenanceRules.validateStatusTransition('IN_PROGRESS', {
        status: 'RESOLVED',
        resolutionNotes: 'Replaced rubber washer',
        actualCost: -10,
        actorId: 'usr-1',
        actorName: 'Admin',
      })
    ).toThrow('Actual cost cannot be negative');
  });
});
