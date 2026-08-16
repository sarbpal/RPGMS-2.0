import { describe, it, expect, beforeEach } from 'vitest';
import { RentDiscoveryAdapter } from '../RentDiscoveryAdapter';
import { Stay } from '../../../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../../../stay/domain/valueObjects/CommercialAgreement';
import type { StayRepository } from '../../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../../../resident/domain/entities/Resident';

describe('RentDiscoveryAdapter (Authoritative Rent & Anniversary Cycle Discovery)', () => {
  let mockStays: Map<string, Stay>;
  let mockResidents: Map<string, Resident>;
  let mockStayRepo: StayRepository;
  let mockResidentRepo: ResidentRepository;
  let adapter: RentDiscoveryAdapter;

  beforeEach(() => {
    mockStays = new Map();
    mockResidents = new Map();

    mockStayRepo = {
      findById: async (id: string) => mockStays.get(id) || null,
      findByIdSync: (id: string) => mockStays.get(id) || null,
      getAllSync: () => Array.from(mockStays.values()),
      findByResidentId: async (resId: string) =>
        Array.from(mockStays.values()).filter((s) => s.residentId === resId),
      findActiveByResidentId: async (resId: string) =>
        Array.from(mockStays.values()).find((s) => s.residentId === resId && s.status === 'ACTIVE') || null,
      save: async (stay: Stay) => {
        mockStays.set(stay.id, stay);
        return stay;
      },
      update: async (stay: Stay) => {
        mockStays.set(stay.id, stay);
        return stay;
      },
      delete: async () => {},
      findStaysByFlatAndPeriodOverlap: async () => [],
      findStaysByFlatAndPeriodOverlapSync: () => [],
    };

    mockResidentRepo = {
      getById: async (id: string) => mockResidents.get(id) || null,
      getByIdSync: (id: string) => mockResidents.get(id) || null,
      getAll: async () => Array.from(mockResidents.values()),
      getAllSync: () => Array.from(mockResidents.values()),
      search: async () => [],
      save: async (r: Resident) => {
        mockResidents.set(r.id, r);
        return r;
      },
      update: async (r: Resident) => {
        mockResidents.set(r.id, r);
        return r;
      },
      delete: async () => {},
    };

    adapter = new RentDiscoveryAdapter(mockStayRepo, mockResidentRepo);
  });

  it('discovers rent obligation using authoritative agreedRent and billingAnchorDay from Stay', async () => {
    const stay = new Stay({
      id: 'STAY-101',
      residentId: 'RES-101',
      stayType: 'REGULAR',
      status: 'ACTIVE',
      checkInDate: '2026-08-15',
      billingAnchorDay: 15,
      commercialAgreements: [
        new CommercialAgreement({
          id: 'CA-101',
          stayId: 'STAY-101',
          rent: 14000,
          securityDeposit: 28000,
          effectiveFrom: '2026-08-15',
          amendmentReason: 'Admission Agreement',
          status: 'ACTIVE',
        }),
      ],
    });
    mockStays.set(stay.id, stay);

    mockResidents.set('RES-101', {
      id: 'RES-101',
      residentCode: 'RC-101',
      fullName: 'Rahul Sharma',
      status: 'ACTIVE',
      mobileNumber: '9876543210',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
    });

    const obligations = await adapter.discoverObligations(
      ['STAY-101'],
      '2026-08-01',
      '2026-08-31',
      '2026-08-31T23:59:59.000Z'
    );

    expect(obligations).toHaveLength(1);
    expect(obligations[0].obligationKey).toBe('RENT:STAY-101:2026-08-15');
    expect(obligations[0].amount).toBe(14000);
    expect(obligations[0].chargeType).toBe('RENT');
    expect(obligations[0].category).toBe('RENT');
    expect(obligations[0].commitmentStatus).toBe('UNCOMMITTED');
    expect(obligations[0].businessDate).toBe('2026-08-15');
  });

  it('discovers historical rent obligations for CHECKED_OUT Stays if anniversary date falls before actual checkout', async () => {
    const historicalStay = new Stay({
      id: 'STAY-HIST-1',
      residentId: 'RES-HIST-1',
      stayType: 'REGULAR',
      status: 'CHECKED_OUT',
      checkInDate: '2026-06-10',
      actualCheckoutDate: '2026-08-20',
      billingAnchorDay: 10,
      agreedRent: 12500,
    });
    mockStays.set(historicalStay.id, historicalStay);

    const obligations = await adapter.discoverObligations(
      ['STAY-HIST-1'],
      '2026-08-01',
      '2026-08-31',
      '2026-08-31T23:59:59.000Z'
    );

    expect(obligations).toHaveLength(1);
    expect(obligations[0].obligationKey).toBe('RENT:STAY-HIST-1:2026-08-10');
    expect(obligations[0].businessDate).toBe('2026-08-10');
  });

  it('does NOT discover rent after actualCheckoutDate for checked out stays', async () => {
    const historicalStay = new Stay({
      id: 'STAY-HIST-2',
      residentId: 'RES-HIST-2',
      stayType: 'REGULAR',
      status: 'CHECKED_OUT',
      checkInDate: '2026-06-10',
      actualCheckoutDate: '2026-08-05', // Checked out before 10th August
      billingAnchorDay: 10,
      agreedRent: 12500,
    });
    mockStays.set(historicalStay.id, historicalStay);

    const obligations = await adapter.discoverObligations(
      ['STAY-HIST-2'],
      '2026-08-01',
      '2026-08-31',
      '2026-08-31T23:59:59.000Z'
    );

    expect(obligations).toHaveLength(0);
  });
});
