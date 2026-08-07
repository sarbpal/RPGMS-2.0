import { Meter, MeterReading, ConsumptionAllocation } from '../domain';
import { validateMeterReadingMonotonicity, calculateOccupantEqualSplit } from '../domain/rules/meterRules';
import type { ElectricityRepository } from '../domain/interfaces/ElectricityRepository';
import { defaultElectricityRepository } from '../infrastructure';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { AccommodationRepository } from '../../accommodation/domain/interfaces/AccommodationRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BillingApplicationService } from '../../finance/services/billingService';
import { defaultFinanceRepository } from '../../finance/infrastructure';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';
import type { Stay } from '../../stay/domain/entities/Stay';

export interface MeterReadingPreviewResult {
  success: boolean;
  meter: Meter | null;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  totalBillAmount: number;
  eligibleStays: Array<{ stayId: string; residentId?: string; residentName: string; allocatedAmount: number; allocatedUnits: number }>;
  errors: string[];
}

export interface RecordMeterReadingResult {
  success: boolean;
  reading: MeterReading | null;
  allocations: ConsumptionAllocation[];
  billedStaysCount: number;
  errors: string[];
}

export class ElectricityApplicationService {
  private electricityRepo: ElectricityRepository;
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;
  private billingService: BillingApplicationService;

  constructor(
    electricityRepo: ElectricityRepository = defaultElectricityRepository,
    stayRepo: StayRepository = new InMemoryStayRepository(),
    accommodationRepo: AccommodationRepository = new InMemoryAccommodationRepository(),
    billingService?: BillingApplicationService
  ) {
    this.electricityRepo = electricityRepo;
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
    this.billingService =
      billingService ?? new BillingApplicationService(defaultFinanceRepository, stayRepo);
  }

  /**
   * Use Case: Generate Stage 1 Meter Reading & Allocation Preview.
   */
  public generateReadingPreview(
    meterId: string,
    currentReading: number,
    _readingPeriod: string
  ): MeterReadingPreviewResult {
    const meter = this.electricityRepo.getMeterById(meterId);
    if (!meter) {
      return {
        success: false,
        meter: null,
        previousReading: 0,
        currentReading,
        unitsConsumed: 0,
        totalBillAmount: 0,
        eligibleStays: [],
        errors: [`Meter with ID '${meterId}' not found.`],
      };
    }

    const previousReading = meter.lastReadingValue;
    const validation = validateMeterReadingMonotonicity(previousReading, currentReading);
    if (!validation.valid) {
      return {
        success: false,
        meter,
        previousReading,
        currentReading,
        unitsConsumed: 0,
        totalBillAmount: 0,
        eligibleStays: [],
        errors: validation.errors,
      };
    }

    const tariff = this.electricityRepo.getActiveTariff();
    if (!tariff) {
      return {
        success: false,
        meter,
        previousReading,
        currentReading,
        unitsConsumed: 0,
        totalBillAmount: 0,
        eligibleStays: [],
        errors: ['No active electricity tariff configured.'],
      };
    }

    const unitsConsumed = Number((currentReading - previousReading).toFixed(2));
    const totalBillAmount = tariff.calculateCost(unitsConsumed);

    // Resolve eligible stays in the flat (ACTIVE or ON_NOTICE)
    const activeStays = this.getEligibleFlatStays(meter.flatId);
    const stayIds = activeStays.map((s: Stay) => s.id);
    const splits = calculateOccupantEqualSplit(totalBillAmount, unitsConsumed, stayIds);

    const eligibleStays = splits.map((sp) => {
      const stayObj = activeStays.find((s: Stay) => s.id === sp.stayId);
      return {
        stayId: sp.stayId,
        residentId: stayObj ? stayObj.residentId : undefined,
        residentName: stayObj ? `Resident (${stayObj.residentId})` : 'Flat Resident',
        allocatedAmount: sp.allocatedAmount,
        allocatedUnits: sp.allocatedUnits,
      };
    });

    return {
      success: true,
      meter,
      previousReading,
      currentReading,
      unitsConsumed,
      totalBillAmount,
      eligibleStays,
      errors: [],
    };
  }

  /**
   * Use Case: Ingest Meter Reading, Calculate Splits, Update Meter State, and Delegate Utility Bills to Finance.
   * Employs compensating rollback if financial billing fails for any occupant.
   */
  public recordMeterReading(
    meterId: string,
    currentReading: number,
    readingPeriod: string,
    readingDate?: string,
    recordedBy?: string,
    remarks?: string
  ): RecordMeterReadingResult {
    const preview = this.generateReadingPreview(meterId, currentReading, readingPeriod);
    if (!preview.success || !preview.meter) {
      return {
        success: false,
        reading: null,
        allocations: [],
        billedStaysCount: 0,
        errors: preview.errors,
      };
    }

    // Check duplicate reading for meter in period
    const existingReading = this.electricityRepo.getMeterReadingByMeterAndPeriod(meterId, readingPeriod);
    if (existingReading) {
      return {
        success: false,
        reading: null,
        allocations: [],
        billedStaysCount: 0,
        errors: [`Meter reading already recorded for meter '${preview.meter.meterNumber}' in period '${readingPeriod}'.`],
      };
    }

    const effectiveDate = readingDate || new Date().toISOString().split('T')[0];
    const readingId = `mr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newReading = new MeterReading({
      id: readingId,
      meterId,
      readingDate: effectiveDate,
      readingPeriod,
      previousReading: preview.previousReading,
      currentReading: preview.currentReading,
      recordedBy,
      remarks,
    });

    // 1. Save new reading and update meter state
    const originalMeterState = preview.meter;
    const updatedMeter = preview.meter.updateLastReading(preview.currentReading, effectiveDate);

    this.electricityRepo.saveMeterReading(newReading);
    this.electricityRepo.saveMeter(updatedMeter);

    // 2. Delegate Utility Billing to Finance domain for each eligible stay
    const allocations: ConsumptionAllocation[] = [];
    const billedStayIds: string[] = [];
    const billingErrors: string[] = [];

    const flatObj = this.accommodationRepo.findById(preview.meter.flatId);
    const flatLabel = flatObj ? flatObj.name : `Flat ${preview.meter.flatId}`;

    for (const stayItem of preview.eligibleStays) {
      if (stayItem.allocatedAmount <= 0) {
        continue;
      }

      const description = `Electricity Bill - ${flatLabel} Meter #${preview.meter.meterNumber} (${readingPeriod})`;
      const billResult = this.billingService.generateRecurringChargeBill(
        stayItem.stayId,
        readingPeriod,
        'Electricity',
        description,
        stayItem.allocatedAmount
      );

      if (billResult.success) {
        billedStayIds.push(stayItem.stayId);
        const residentId = stayItem.residentId || stayItem.stayId;

        allocations.push(
          new ConsumptionAllocation({
            flatId: preview.meter.flatId,
            stayId: stayItem.stayId,
            residentId,
            readingPeriod,
            allocatedUnits: stayItem.allocatedUnits,
            allocatedAmount: stayItem.allocatedAmount,
            allocationMethod: 'EQUAL_SPLIT',
            remarks,
          })
        );
      } else {
        billingErrors.push(
          `Billing failed for stay '${stayItem.stayId}': ${billResult.errors.join(', ')}`
        );
      }
    }

    // 3. Compensating Rollback if any billing failed when active stays were present
    if (preview.eligibleStays.length > 0 && billingErrors.length > 0) {
      // Revert reading & meter state
      this.electricityRepo.deleteMeterReading(newReading.id);
      this.electricityRepo.saveMeter(originalMeterState);

      return {
        success: false,
        reading: null,
        allocations: [],
        billedStaysCount: 0,
        errors: [
          `Electricity allocation aborted due to Finance billing failure. Rollback executed.`,
          ...billingErrors,
        ],
      };
    }

    return {
      success: true,
      reading: newReading,
      allocations,
      billedStaysCount: billedStayIds.length,
      errors: [],
    };
  }

  /**
   * Helper: Resolve active or on-notice stays associated with a flat.
   */
  private getEligibleFlatStays(flatId: string): Stay[] {
    const allStays = this.stayRepo.getAllSync();
    return allStays.filter(
      (s: Stay) =>
        s.flatId === flatId &&
        (s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE)
    );
  }
}

export const defaultElectricityService = new ElectricityApplicationService();
