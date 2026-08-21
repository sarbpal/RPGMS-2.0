import { describe, it, expect } from 'vitest';
import { stayWorkflowComposition } from '../stayWorkflowComposition';
import { defaultLaundryWorkspaceCoordinator, LaundryWorkspaceCoordinator } from '../../../features/laundry/application/coordinator/LaundryWorkspaceCoordinator';
import { defaultLaundryRepository } from '../../../features/laundry/infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository } from '../../../features/laundry/infrastructure/repositories/InMemoryLaundryMasterRepository';
import { defaultLaundryPostingService } from '../../../features/finance/services/laundryPostingService';

describe('Laundry Composition Coordinator Singletons', () => {
  it('registers and exposes laundryWorkspaceCoordinator as defaultLaundryWorkspaceCoordinator with strict identity', () => {
    expect(stayWorkflowComposition.laundryWorkspaceCoordinator).toBeDefined();
    expect(stayWorkflowComposition.defaultLaundryWorkspaceCoordinator).toBeDefined();
    expect(stayWorkflowComposition.laundryWorkspaceCoordinator).toBe(defaultLaundryWorkspaceCoordinator);
    expect(stayWorkflowComposition.defaultLaundryWorkspaceCoordinator).toBe(defaultLaundryWorkspaceCoordinator);
    expect(stayWorkflowComposition.laundryWorkspaceCoordinator).toBeInstanceOf(LaundryWorkspaceCoordinator);
  });

  it('maintains repository and service singletons in composition root', () => {
    expect(stayWorkflowComposition.laundryRepository).toBe(defaultLaundryRepository);
    expect(stayWorkflowComposition.defaultLaundryRepository).toBe(defaultLaundryRepository);
    expect(stayWorkflowComposition.laundryMasterRepository).toBe(defaultLaundryMasterRepository);
    expect(stayWorkflowComposition.defaultLaundryMasterRepository).toBe(defaultLaundryMasterRepository);
    expect(stayWorkflowComposition.laundryFinanceIntegrationService).toBe(defaultLaundryPostingService);
    expect(stayWorkflowComposition.defaultLaundryPostingService).toBe(defaultLaundryPostingService);
  });
});
