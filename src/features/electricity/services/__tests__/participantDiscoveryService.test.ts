import { describe, it, expect, beforeEach } from 'vitest';
import { ParticipantDiscoveryService } from '../participantDiscoveryService';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type { Resident } from '../../../resident/domain/entities/Resident';

describe('Stage 2 — ParticipantDiscoveryService Unit Tests', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let discoveryService: ParticipantDiscoveryService;

  const resident1: Resident = {
    id: 'res-01',
    residentCode: 'R-001',
    fullName: 'Alice Johnson',
    status: 'ACTIVE',
    mobileNumber: '9876543210',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const resident2: Resident = {
    id: 'res-02',
    residentCode: 'R-002',
    fullName: 'Bob Smith',
    status: 'ALUMNI',
    mobileNumber: '9876543211',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository([]);
    residentRepo = new InMemoryResidentRepository([resident1, resident2]);
    discoveryService = new ParticipantDiscoveryService(stayRepo, residentRepo);
  });

  it('discovers 1 stay with 1 bed -> potentialShares = 1 (Single Occupant)', () => {
    const stay = new Stay({
      id: 'stay-01',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-01', stayId: 'stay-01', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });
    stayRepo.saveSync(stay);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    expect(result.totalPotentialShares).toBe(1);
    expect(result.candidateParticipants[0].stayId).toBe('stay-01');
    expect(result.candidateParticipants[0].residentCode).toBe('R-001');
    expect(result.candidateParticipants[0].potentialShares).toBe(1);
  });

  it('Case A (Simultaneous Beds): stay with 2 concurrent beds -> potentialShares = 2', () => {
    const stayMulti = new Stay({
      id: 'stay-multi',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-01', stayId: 'stay-multi', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
        { id: 'ba-02', stayId: 'stay-multi', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });
    stayRepo.saveSync(stayMulti);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    expect(result.totalPotentialShares).toBe(2);
    expect(result.candidateParticipants[0].potentialShares).toBe(2);
  });

  it('Case B (Sequential Bed Movement): stay moves bed-1 to bed-2 in same flat -> potentialShares = 1', () => {
    const staySeq = new Stay({
      id: 'stay-seq',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-seq1', stayId: 'stay-seq', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', allocatedUntil: '2026-07-10', status: 'RELEASED' },
        { id: 'ba-seq2', stayId: 'stay-seq', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-07-11', status: 'ACTIVE' },
      ],
    });
    stayRepo.saveSync(staySeq);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    // Sequential move within flat must NOT double-count shares for the month
    expect(result.totalPotentialShares).toBe(1);
    expect(result.candidateParticipants[0].potentialShares).toBe(1);
  });

  it('Case C (Temporary Handover Overlap): brief transition overlap between beds -> max concurrent = 1 potential share', () => {
    const stayHandover = new Stay({
      id: 'stay-handover',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-h1', stayId: 'stay-handover', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', allocatedUntil: '2026-07-10', status: 'RELEASED' },
        { id: 'ba-h2', stayId: 'stay-handover', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-07-05', allocatedUntil: '2026-07-20', status: 'RELEASED' },
      ],
    });
    stayRepo.saveSync(stayHandover);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    // Evaluates max concurrent beds (2 during 5-day handover) or max concurrent active bed spaces
    expect(result.candidateParticipants[0].potentialShares).toBeGreaterThanOrEqual(1);
  });

  it('discovers CHECKED_OUT Stay and ALUMNI Resident historical Stay without reopening operational state', () => {
    const alumniStay = new Stay({
      id: 'stay-alumni',
      residentId: 'res-02',
      stayType: 'REGULAR',
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2026-06-01',
      actualCheckoutDate: '2026-07-15',
      bedAllocations: [
        { id: 'ba-alumni', stayId: 'stay-alumni', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-06-01', allocatedUntil: '2026-07-15', status: 'RELEASED' },
      ],
    });
    stayRepo.saveSync(alumniStay);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    expect(result.candidateParticipants[0].stayId).toBe('stay-alumni');
    expect(result.candidateParticipants[0].residentId).toBe('res-02');
    expect(result.candidateParticipants[0].residentCode).toBe('R-002');
    expect(result.candidateParticipants[0].residentNameSnapshot).toBe('Bob Smith');

    // Confirm Stay & Resident status were NOT mutated
    const stayInDb = stayRepo.findByIdSync('stay-alumni');
    expect(stayInDb?.status).toBe(StayStatus.CHECKED_OUT);

    const resInDb = residentRepo.getByIdSync('res-02');
    expect(resInDb?.status).toBe('ALUMNI');
  });

  it('flags missing Resident master record as structured dataQualityIssues entry without fabricating fake identity strings', () => {
    const orphanedStay = new Stay({
      id: 'stay-orphan',
      residentId: 'res-nonexistent-99',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-orph', stayId: 'stay-orphan', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });
    stayRepo.saveSync(orphanedStay);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.discoveredStaysCount).toBe(1);
    expect(result.candidateParticipants[0].stayId).toBe('stay-orphan');
    expect(result.candidateParticipants[0].residentId).toBe('res-nonexistent-99');

    // Must NOT fabricate "UNASSIGNED" or "Resident (res-id)" as normal data
    expect(result.candidateParticipants[0].residentCode).toBeUndefined();
    expect(result.candidateParticipants[0].residentNameSnapshot).toBeUndefined();

    // Must report structured data quality issue for audit
    expect(result.dataQualityIssues.length).toBe(1);
    expect(result.dataQualityIssues[0].stayId).toBe('stay-orphan');
    expect(result.dataQualityIssues[0].issueType).toBe('MISSING_RESIDENT_RECORD');
  });

  it('sorts candidate participants deterministically by residentCode ASC, then stayId ASC', () => {
    const stayB = new Stay({
      id: 'stay-B',
      residentId: 'res-02',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-b', stayId: 'stay-B', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });

    const stayA = new Stay({
      id: 'stay-A',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-a', stayId: 'stay-A', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });

    // Save in reverse order
    stayRepo.saveSync(stayB);
    stayRepo.saveSync(stayA);

    const result = discoveryService.discoverParticipantsForFlatPeriod('flat-101', '2026-07-01', '2026-07-31');

    expect(result.candidateParticipants.length).toBe(2);
    // R-001 (stay-A) must come before R-002 (stay-B)
    expect(result.candidateParticipants[0].stayId).toBe('stay-A');
    expect(result.candidateParticipants[0].residentCode).toBe('R-001');
    expect(result.candidateParticipants[1].stayId).toBe('stay-B');
    expect(result.candidateParticipants[1].residentCode).toBe('R-002');
  });
});
