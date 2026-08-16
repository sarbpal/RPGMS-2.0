import type { ChargeDiscoveryProvider } from '../../domain/interfaces/ChargeDiscoveryProvider';
import type { ChargeType } from '../../domain/valueObjects/BillingTypes';
import { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';
import { ObligationKey } from '../../domain/valueObjects/ObligationKey';
import type { ElectricityRepository } from '../../../electricity/domain/interfaces/ElectricityRepository';

/**
 * Electricity Discovery Adapter (Architecture Section 12).
 *
 * Strict Read/Observe Boundary:
 * - Confirmed electricity allocations are always COMMITTED by the Electricity domain (BR-E-45).
 * - Billing strictly observes confirmed allocations and NEVER claims or reposts them.
 * - Exact participant.financeBillId is preserved when present without fabricating fallback strings.
 * - If financeBillId is absent on a CONFIRMED allocation, it remains COMMITTED (non-claimable) to protect
 *   Electricity domain ownership and prevent duplicate financial posting.
 * - Does NOT calculate electricity tariffs, shares, or meter readings.
 * - Does NOT perform electricity duplicate detection.
 */
export class ElectricityDiscoveryAdapter implements ChargeDiscoveryProvider {
  readonly providerKey = 'ELECTRICITY_DISCOVERY_ADAPTER';
  readonly chargeType: ChargeType = 'ELECTRICITY';

  private readonly electricityRepository: ElectricityRepository;

  constructor(electricityRepository: ElectricityRepository) {
    this.electricityRepository = electricityRepository;
  }

  async discoverObligations(
    stayIds: string[] | undefined,
    periodStart: string,
    periodEnd: string,
    _cutoffTimestamp: string
  ): Promise<DiscoveredObligation[]> {
    const obligations: DiscoveredObligation[] = [];
    const hasStayFilter = Boolean(stayIds && stayIds.length > 0);
    const targetStaySet = hasStayFilter ? new Set(stayIds) : null;

    // Read all allocations from the authoritative Electricity Repository
    const allAllocations = this.electricityRepository.getAllocations();

    // Filter confirmed allocations overlapping or within the selected period
    const confirmedAllocations = allAllocations.filter(
      (a) =>
        a.status === 'CONFIRMED' &&
        a.periodEnd >= periodStart &&
        a.periodStart <= periodEnd
    );

    for (const allocation of confirmedAllocations) {
      for (const participant of allocation.participants) {
        if (targetStaySet && !targetStaySet.has(participant.stayId)) continue;
        if (participant.allocatedAmount <= 0) continue;

        // Invariant: Confirmed Electricity allocations are domain-committed and cannot be claimed by Billing
        const obligation = new DiscoveredObligation({
          obligationKey: ObligationKey.forElectricity(participant.stayId, participant.id).value,
          stayId: participant.stayId,
          residentId: participant.residentId,
          residentCode: participant.residentCode || 'UNASSIGNED',
          chargeType: 'ELECTRICITY',
          amount: participant.allocatedAmount,
          businessDate: allocation.periodEnd,
          entryDate: allocation.confirmedAt || allocation.createdAt || `${allocation.periodEnd}T00:00:00.000Z`,
          description: `Electricity Allocation (${allocation.periodStart} to ${allocation.periodEnd})`,
          category: 'UTILITIES',
          commitmentStatus: 'COMMITTED',
          financialReferenceId: participant.financeBillId || undefined,
          sourcePeriodLabel: `${allocation.periodStart} to ${allocation.periodEnd}`,
          metadata: {
            allocationId: allocation.id,
            flatId: allocation.flatId,
            selectedShares: participant.selectedShares,
            potentialShares: participant.potentialShares,
            isMissingFinanceReference: !participant.financeBillId,
          },
        });

        obligations.push(obligation);
      }
    }

    return obligations;
  }
}
