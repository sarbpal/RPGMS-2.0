import type { ChargeDiscoveryProvider } from '../../domain/interfaces/ChargeDiscoveryProvider';
import type { ChargeType } from '../../domain/valueObjects/BillingTypes';
import { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';
import { ObligationKey } from '../../domain/valueObjects/ObligationKey';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { Stay } from '../../../stay/domain/entities/Stay';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';

/**
 * Rent Discovery Adapter.
 *
 * Boundary Guarantee:
 * - Consumes authoritative rent from Stay.agreedRent (Active CommercialAgreement).
 * - Consumes authoritative billingAnchorDay from Stay.
 * - Does NOT own, calculate, or alter rent amounts or commercial terms.
 */
export class RentDiscoveryAdapter implements ChargeDiscoveryProvider {
  readonly providerKey = 'RENT_DISCOVERY_ADAPTER';
  readonly chargeType: ChargeType = 'RENT';

  private readonly stayRepository: StayRepository;
  private readonly residentRepository: ResidentRepository;

  constructor(stayRepository: StayRepository, residentRepository: ResidentRepository) {
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
  }

  async discoverObligations(
    stayIds: string[] | undefined,
    periodStart: string,
    periodEnd: string,
    _cutoffTimestamp: string
  ): Promise<DiscoveredObligation[]> {
    const obligations: DiscoveredObligation[] = [];

    // If explicit stayIds provided, evaluate only those; otherwise discover across all candidate Stays in repository
    let targetStays: Stay[];
    if (stayIds && stayIds.length > 0) {
      const fetched = await Promise.all(stayIds.map((id) => this.stayRepository.findById(id)));
      targetStays = fetched.filter((s): s is Stay => s !== null);
    } else {
      targetStays = this.stayRepository.getAllSync();
    }

    for (const stay of targetStays) {
      // Authoritative commercial agreement check
      const rentAmount = stay.agreedRent;
      if (typeof rentAmount !== 'number' || rentAmount <= 0) continue;

      const resident = await this.residentRepository.getById(stay.residentId);
      const residentCode = resident?.residentCode || 'UNASSIGNED';

      // Determine anniversary cycle dates within the [periodStart, periodEnd] range
      const anchorDay = stay.billingAnchorDay;
      const anniversaryDates = this.getAnniversaryDatesInRange(
        stay.checkInDate,
        stay.actualCheckoutDate,
        anchorDay,
        periodStart,
        periodEnd
      );

      for (const anniversaryDate of anniversaryDates) {
        const obligation = new DiscoveredObligation({
          obligationKey: ObligationKey.forRent(stay.id, anniversaryDate).value,
          stayId: stay.id,
          residentId: stay.residentId,
          residentCode,
          chargeType: 'RENT',
          amount: rentAmount,
          businessDate: anniversaryDate,
          entryDate: stay.createdAt || `${anniversaryDate}T00:00:00.000Z`,
          description: `Monthly Rent (${anniversaryDate})`,
          category: 'RENT',
          commitmentStatus: 'UNCOMMITTED',
          sourcePeriodLabel: anniversaryDate.substring(0, 7),
          metadata: {
            billingAnchorDay: anchorDay,
            checkInDate: stay.checkInDate,
            stayStatus: stay.status,
          },
        });

        obligations.push(obligation);
      }
    }

    return obligations;
  }

  /**
   * Computes the authoritative anniversary dates for a Stay falling within the requested period.
   */
  private getAnniversaryDatesInRange(
    checkInDate: string,
    actualCheckoutDate: string | undefined,
    anchorDay: number,
    periodStart: string,
    periodEnd: string
  ): string[] {
    const dates: string[] = [];
    const [startYear, startMonth] = periodStart.split('-').map(Number);
    const [endYear, endMonth] = periodEnd.split('-').map(Number);

    const normalizedCheckIn = this.normalizeToIsoDate(checkInDate);
    const normalizedCheckout = actualCheckoutDate ? this.normalizeToIsoDate(actualCheckoutDate) : undefined;

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      // Find days in the current month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const clampedDay = Math.min(anchorDay, daysInMonth);
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;

      // Check boundaries
      const isAfterOrOnCheckIn = dateStr >= normalizedCheckIn;
      const isBeforeOrOnCheckout = !normalizedCheckout || dateStr <= normalizedCheckout;
      const isInPeriod = dateStr >= periodStart && dateStr <= periodEnd;

      if (isAfterOrOnCheckIn && isBeforeOrOnCheckout && isInPeriod) {
        dates.push(dateStr);
      }

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return dates;
  }

  private normalizeToIsoDate(dateStr: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }
}
