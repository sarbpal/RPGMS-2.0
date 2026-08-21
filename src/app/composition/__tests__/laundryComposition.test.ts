import { describe, it, expect } from 'vitest';
import { stayWorkflowComposition } from '../stayWorkflowComposition';
import { defaultLaundryRepository, InMemoryLaundryRepository } from '../../../features/laundry/infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository, InMemoryLaundryMasterRepository } from '../../../features/laundry/infrastructure/repositories/InMemoryLaundryMasterRepository';
import { defaultLaundryPostingService, LaundryPostingService } from '../../../features/finance/services/laundryPostingService';

describe('Laundry Composition Root Registration & Singleton Identity', () => {
  it('Test 18 — Singleton Identity: composition root provides canonical Laundry repository singleton', () => {
    expect(stayWorkflowComposition.laundryRepository).toBeDefined();
    expect(stayWorkflowComposition.defaultLaundryRepository).toBeDefined();

    // Strict reference identity (===)
    expect(stayWorkflowComposition.laundryRepository).toBe(defaultLaundryRepository);
    expect(stayWorkflowComposition.defaultLaundryRepository).toBe(defaultLaundryRepository);
    expect(stayWorkflowComposition.laundryRepository instanceof InMemoryLaundryRepository).toBe(true);
  });

  it('Test 19 — Master Repository Identity: composition root exposes canonical Laundry Master repository', () => {
    expect(stayWorkflowComposition.laundryMasterRepository).toBeDefined();
    expect(stayWorkflowComposition.defaultLaundryMasterRepository).toBeDefined();

    // Strict reference identity (===)
    expect(stayWorkflowComposition.laundryMasterRepository).toBe(defaultLaundryMasterRepository);
    expect(stayWorkflowComposition.defaultLaundryMasterRepository).toBe(defaultLaundryMasterRepository);
    expect(stayWorkflowComposition.laundryMasterRepository instanceof InMemoryLaundryMasterRepository).toBe(true);
  });

  it('Test 20 — Finance Integration Identity: composition root exposes canonical Laundry Finance integration service', () => {
    expect(stayWorkflowComposition.laundryFinanceIntegrationService).toBeDefined();
    expect(stayWorkflowComposition.defaultLaundryPostingService).toBeDefined();

    // Strict reference identity (===)
    expect(stayWorkflowComposition.laundryFinanceIntegrationService).toBe(defaultLaundryPostingService);
    expect(stayWorkflowComposition.defaultLaundryPostingService).toBe(defaultLaundryPostingService);
    expect(stayWorkflowComposition.laundryFinanceIntegrationService instanceof LaundryPostingService).toBe(true);
  });

  it('Test 21 — Cross-Workspace Population: shared singletons prevent divergent repository instances', () => {
    // When an entity is saved to the composition root repository, it is immediately available
    const tx = stayWorkflowComposition.laundryRepository.saveSync({
      id: 'LTX-COMP-001',
      stayId: 'STAY-COMP-001',
      residentId: 'RES-COMP-001',
    });
    expect(tx.id).toBe('LTX-COMP-001');

    const foundFromExport = defaultLaundryRepository.findByIdSync('LTX-COMP-001');
    expect(foundFromExport).not.toBeNull();
    expect(foundFromExport?.id).toBe('LTX-COMP-001');

    // Clean up
    defaultLaundryRepository.deleteSync('LTX-COMP-001');
  });
});
