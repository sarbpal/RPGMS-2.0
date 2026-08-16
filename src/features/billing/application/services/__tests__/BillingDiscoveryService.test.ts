import { describe, it, expect } from 'vitest';
import { BillingDiscoveryService } from '../BillingDiscoveryService';
import type { ChargeDiscoveryProvider } from '../../../domain/interfaces/ChargeDiscoveryProvider';
import { DiscoveredObligation } from '../../../domain/valueObjects/DiscoveredObligation';

describe('BillingDiscoveryService Application Service', () => {
  const dummyRentProvider: ChargeDiscoveryProvider = {
    providerKey: 'DUMMY_RENT',
    chargeType: 'RENT',
    async discoverObligations(stayIds, _start, _end, _cutoff) {
      return (stayIds || []).map(
        (id) =>
          new DiscoveredObligation({
            obligationKey: `RENT:${id}:2026-08-15`,
            stayId: id,
            residentId: `RES-${id}`,
            residentCode: `RC-${id}`,
            chargeType: 'RENT',
            amount: 10000,
            businessDate: '2026-08-15',
            entryDate: '2026-08-15T00:00:00.000Z',
            description: 'Monthly Rent',
            category: 'RENT',
            commitmentStatus: 'UNCOMMITTED',
          })
      );
    },
  };

  const dummyUtilityProvider: ChargeDiscoveryProvider = {
    providerKey: 'DUMMY_UTILITY',
    chargeType: 'ELECTRICITY',
    async discoverObligations(stayIds, _start, _end, _cutoff) {
      return (stayIds || []).map(
        (id) =>
          new DiscoveredObligation({
            obligationKey: `ELECTRICITY:${id}:ALLOC-01`,
            stayId: id,
            residentId: `RES-${id}`,
            residentCode: `RC-${id}`,
            chargeType: 'ELECTRICITY',
            amount: 750,
            businessDate: '2026-08-10',
            entryDate: '2026-08-10T00:00:00.000Z',
            description: 'Electricity Share',
            category: 'UTILITIES',
            commitmentStatus: 'COMMITTED',
            financialReferenceId: `INV-ELEC-${id}`,
          })
      );
    },
  };

  it('registers providers and discovers obligations across all registered providers', async () => {
    const discoveryService = new BillingDiscoveryService([dummyRentProvider]);
    discoveryService.registerProvider(dummyUtilityProvider);

    expect(discoveryService.getProviders()).toHaveLength(2);

    const obligations = await discoveryService.discoverAll(
      ['STAY-1', 'STAY-2'],
      '2026-08-01',
      '2026-08-31'
    );

    expect(obligations).toHaveLength(4); // 2 stays * 2 providers
    expect(obligations.filter((o) => o.chargeType === 'RENT')).toHaveLength(2);
    expect(obligations.filter((o) => o.chargeType === 'ELECTRICITY')).toHaveLength(2);
  });

  it('delegates property-wide discovery to providers when stayIds is undefined or empty', async () => {
    const propertyWideProvider: ChargeDiscoveryProvider = {
      providerKey: 'ALL_STAYS_RENT',
      chargeType: 'RENT',
      async discoverObligations(stayIds, _start, _end, _cutoff) {
        if (!stayIds || stayIds.length === 0) {
          return [
            new DiscoveredObligation({
              obligationKey: 'RENT:ALL-1:2026-08-15',
              stayId: 'ALL-1',
              residentId: 'RES-ALL-1',
              residentCode: 'RC-1',
              chargeType: 'RENT',
              amount: 12000,
              businessDate: '2026-08-15',
              entryDate: '2026-08-15T00:00:00.000Z',
              description: 'Property-wide Rent',
              category: 'RENT',
              commitmentStatus: 'UNCOMMITTED',
            }),
          ];
        }
        return [];
      },
    };

    const discoveryService = new BillingDiscoveryService([propertyWideProvider]);
    const obligations = await discoveryService.discoverAll(undefined, '2026-08-01', '2026-08-31');
    expect(obligations).toHaveLength(1);
    expect(obligations[0].stayId).toBe('ALL-1');
  });

  it('returns empty array when no providers are registered', async () => {
    const discoveryService = new BillingDiscoveryService([]);
    const obligations = await discoveryService.discoverAll(['STAY-1'], '2026-08-01', '2026-08-31');
    expect(obligations).toEqual([]);
  });
});
