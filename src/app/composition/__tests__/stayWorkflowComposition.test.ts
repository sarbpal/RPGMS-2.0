import { describe, expect, it } from 'vitest';
import { stayWorkflowComposition } from '../stayWorkflowComposition';

describe('stayWorkflowComposition', () => {
  it('makes a walk-in admission visible to the composed Stay and Accommodation workspaces', () => {
    const { admissionCoordinator, stayWorkspaceCoordinator, accommodationWorkspaceCoordinator, accommodationRepository } = stayWorkflowComposition;
    const flat = accommodationRepository.findAll().find((candidate) => candidate.areas.some((area) => area.beds.some((bed) => bed.status === 'VACANT')));
    const bed = flat?.areas.flatMap((area) => area.beds).find((candidate) => candidate.status === 'VACANT');
    expect(flat).toBeDefined();
    expect(bed).toBeDefined();

    const result = admissionCoordinator.confirmWalkInAdmission({
      sourceType: 'WALK_IN', residentName: 'Composition Test Resident', mobileNumber: '7012345678',
      idProofType: 'AADHAAR', idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-10', agreedRent: 10000, agreedDeposit: 20000,
      flatId: flat!.id, bedIds: [bed!.id],
    });

    const stay = stayWorkspaceCoordinator.findStay(result.stayId);
    expect(stay).toMatchObject({ id: result.stayId, residentId: result.residentId, status: 'ACTIVE', checkInDate: '2026-08-10' });
    const accommodationView = accommodationWorkspaceCoordinator.loadAndSynchronizeFlats();
    const composedBed = accommodationView.find((candidate) => candidate.id === flat!.id)?.areas.flatMap((area) => area.beds).find((candidate) => candidate.id === bed!.id);
    expect(composedBed?.status).toBe('OCCUPIED');
  });
});
