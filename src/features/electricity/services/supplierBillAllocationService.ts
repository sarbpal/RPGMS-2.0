import type { ElectricityRepository } from '../domain/interfaces/ElectricityRepository';
import { defaultElectricityRepository } from '../infrastructure/repositories/InMemoryElectricityRepository';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { BillingApplicationService, billingService as defaultBillingService } from '../../finance/services/billingService';
import { LedgerApplicationService, ledgerService as defaultLedgerService } from '../../finance/services/ledgerService';
import type { FinanceRepository } from '../../finance/domain/interfaces/FinanceRepository';
import { defaultFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { ParticipantDiscoveryService } from './participantDiscoveryService';
import { ElectricityBill } from '../domain/entities/ElectricityBill';
import { ElectricityAllocation, type AllocationDataQualityIssue } from '../domain/entities/ElectricityAllocation';
import { AllocationParticipant, type AllocationParticipantProps } from '../domain/valueObjects/AllocationParticipant';
import { calculateShareBasedAllocation } from '../domain/rules/allocationRules';

export interface CreateSupplierBillInput {
  supplierName: string;
  supplierBillNumber: string;
  supplierAmount: number;
  remarks?: string;
}

export interface ParticipantShareAdjustmentInput {
  stayId: string;
  selectedShares: number;
}

export interface SupplierBillAllocationServiceResult {
  success: boolean;
  bill: ElectricityBill | null;
  allocation: ElectricityAllocation | null;
  dataQualityIssues: AllocationDataQualityIssue[];
  errors: string[];
  warnings?: string[];
}

export class SupplierBillAllocationService {
  private electricityRepo: ElectricityRepository;
  private stayRepo: StayRepository;
  private residentRepo: ResidentRepository;
  private financeService: BillingApplicationService;
  private ledgerService: LedgerApplicationService;
  private financeRepo: FinanceRepository;
  private discoveryService: ParticipantDiscoveryService;

  constructor(
    electricityRepo: ElectricityRepository = defaultElectricityRepository,
    stayRepo: StayRepository = new InMemoryStayRepository(),
    residentRepo: ResidentRepository = new InMemoryResidentRepository(),
    financeService: BillingApplicationService = defaultBillingService,
    financeRepo: FinanceRepository = defaultFinanceRepository,
    discoveryService?: ParticipantDiscoveryService,
    ledgerService: LedgerApplicationService = defaultLedgerService
  ) {
    this.electricityRepo = electricityRepo;
    this.stayRepo = stayRepo;
    this.residentRepo = residentRepo;
    this.financeService = financeService;
    this.financeRepo = financeRepo;
    this.ledgerService = ledgerService;
    this.discoveryService =
      discoveryService || new ParticipantDiscoveryService(this.stayRepo, this.residentRepo);
  }

  public getStayRepository(): StayRepository {
    return this.stayRepo;
  }

  public getResidentRepository(): ResidentRepository {
    return this.residentRepo;
  }

  /**
   * Application Use Case: Create draft supplier bill and discover historical participants.
   * Runs integer-paise allocation math preview and persists DRAFT entities.
   */
  public createDraftAllocation(
    input: CreateSupplierBillInput,
    flatId: string,
    periodStart: string,
    periodEnd: string
  ): SupplierBillAllocationServiceResult {
    const errors: string[] = [];

    if (!input.supplierName || input.supplierName.trim() === '') {
      errors.push('Supplier name is required.');
    }
    if (!input.supplierBillNumber || input.supplierBillNumber.trim() === '') {
      errors.push('Supplier bill number is required.');
    }
    if (typeof input.supplierAmount !== 'number' || isNaN(input.supplierAmount) || input.supplierAmount <= 0) {
      errors.push('Supplier bill amount must be a positive number greater than zero.');
    }
    if (!flatId || flatId.trim() === '') {
      errors.push('Flat ID is required.');
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      errors.push(`Invalid billing period date range: [${periodStart}, ${periodEnd}].`);
    }

    if (errors.length > 0) {
      return { success: false, bill: null, allocation: null, dataQualityIssues: [], errors };
    }

    // 1. Discover historical participants & bed shares via Stage 2 discovery service
    const discoveryResult = this.discoveryService.discoverParticipantsForFlatPeriod(
      flatId,
      periodStart,
      periodEnd
    );

    const dataQualityIssues: AllocationDataQualityIssue[] = discoveryResult.dataQualityIssues.map(
      (issue) => ({
        stayId: issue.stayId,
        residentId: issue.residentId,
        issueType: issue.issueType,
        message: issue.message,
      })
    );

    // 2. Instantiate ElectricityBill in DRAFT status
    const billId = `ebill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bill = new ElectricityBill({
      id: billId,
      flatId,
      supplierName: input.supplierName.trim(),
      supplierBillNumber: input.supplierBillNumber.trim(),
      periodStart,
      periodEnd,
      supplierAmount: input.supplierAmount,
      status: 'DRAFT',
    });

    // 3. Prepare candidate AllocationParticipantProps
    const allocationId = `ealloc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const candidateProps: AllocationParticipantProps[] = discoveryResult.candidateParticipants.map(
      (cand) => ({
        id: `${allocationId}_${cand.stayId}`,
        allocationId,
        stayId: cand.stayId,
        residentId: cand.residentId,
        residentCode: cand.residentCode || '',
        residentNameSnapshot: cand.residentNameSnapshot || '',
        flatId,
        potentialShares: cand.potentialShares,
        selectedShares: cand.selectedShares,
        allocatedAmount: 0,
      })
    );

    // 4. Calculate integer-paise share distribution preview using Stage 1 allocation engine
    const mathResult = calculateShareBasedAllocation(input.supplierAmount, candidateProps);

    const participantPropsWithIds: AllocationParticipantProps[] = mathResult.participantShares.map((p) => ({
      id: `${allocationId}_${p.stayId}`,
      allocationId,
      stayId: p.stayId,
      residentId: p.residentId,
      residentCode: p.residentCode,
      residentNameSnapshot: p.residentNameSnapshot,
      flatId: p.flatId,
      potentialShares: p.potentialShares,
      selectedShares: p.selectedShares,
      allocatedAmount: p.allocatedAmount,
    }));

    // 5. Instantiate ElectricityAllocation in DRAFT status
    const allocation = new ElectricityAllocation({
      id: allocationId,
      billId,
      flatId,
      periodStart,
      periodEnd,
      totalSupplierAmount: input.supplierAmount,
      totalPotentialShares: discoveryResult.totalPotentialShares,
      totalSelectedShares: mathResult.totalSelectedShares,
      amountPerShare: mathResult.amountPerShare,
      remainderPaise: mathResult.remainderPaise,
      allocationMethod: 'SHARE_BASED',
      status: 'DRAFT',
      participants: participantPropsWithIds,
      dataQualityIssues,
    });

    // 6. Persist DRAFT entities to ElectricityRepository
    this.electricityRepo.saveBill(bill);
    this.electricityRepo.saveAllocation(allocation);

    const warnings: string[] = [];
    if (dataQualityIssues.length > 0) {
      warnings.push(
        `${dataQualityIssues.length} data quality issues identified during participant discovery.`
      );
    }
    if (discoveryResult.candidateParticipants.length === 0) {
      warnings.push('No historical Stays discovered for the billing period.');
    }

    return {
      success: true,
      bill,
      allocation,
      dataQualityIssues,
      errors: [],
      warnings,
    };
  }

  /**
   * Application Use Case: Operator updates candidate selected shares during draft review.
   * Recalculates exact share amounts using Stage 1 integer-paise math.
   */
  public updateDraftShares(
    allocationId: string,
    adjustments: ParticipantShareAdjustmentInput[]
  ): SupplierBillAllocationServiceResult {
    const allocation = this.electricityRepo.getAllocationById(allocationId);
    if (!allocation) {
      return {
        success: false,
        bill: null,
        allocation: null,
        dataQualityIssues: [],
        errors: [`ElectricityAllocation '${allocationId}' not found.`],
      };
    }
    if (allocation.status !== 'DRAFT') {
      return {
        success: false,
        bill: null,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [`Cannot update shares on an ElectricityAllocation that is already ${allocation.status}.`],
      };
    }

    const bill = this.electricityRepo.getBillById(allocation.billId);
    const updatedProps: AllocationParticipantProps[] = allocation.participants.map((p) => {
      const adj = adjustments.find((a) => a.stayId === p.stayId);
      const newSelectedShares = adj !== undefined ? adj.selectedShares : p.selectedShares;

      if (typeof newSelectedShares !== 'number' || newSelectedShares < 0) {
        throw new Error(`Invalid selectedShares '${newSelectedShares}' for stay '${p.stayId}'.`);
      }
      if (newSelectedShares > p.potentialShares) {
        throw new Error(
          `selectedShares (${newSelectedShares}) cannot exceed potentialShares (${p.potentialShares}) for stay '${p.stayId}'.`
        );
      }

      return {
        id: p.id,
        allocationId: p.allocationId,
        stayId: p.stayId,
        residentId: p.residentId,
        residentCode: p.residentCode,
        residentNameSnapshot: p.residentNameSnapshot,
        flatId: p.flatId,
        potentialShares: p.potentialShares,
        selectedShares: newSelectedShares,
        allocatedAmount: p.allocatedAmount,
        financeBillId: p.financeBillId,
        remarks: p.remarks,
      };
    });

    // Recalculate share allocation math
    const mathResult = calculateShareBasedAllocation(allocation.totalSupplierAmount, updatedProps);

    const updatedParticipantsProps: AllocationParticipantProps[] = mathResult.participantShares.map((p) => {
      const orig = updatedProps.find((op) => op.stayId === p.stayId);
      return {
        id: orig?.id || `${allocation.id}_${p.stayId}`,
        allocationId: allocation.id,
        stayId: p.stayId,
        residentId: p.residentId,
        residentCode: p.residentCode,
        residentNameSnapshot: p.residentNameSnapshot,
        flatId: p.flatId,
        potentialShares: p.potentialShares,
        selectedShares: p.selectedShares,
        allocatedAmount: p.allocatedAmount,
        financeBillId: orig?.financeBillId,
        remarks: orig?.remarks,
      };
    });

    const updatedAllocation = new ElectricityAllocation({
      id: allocation.id,
      billId: allocation.billId,
      flatId: allocation.flatId,
      periodStart: allocation.periodStart,
      periodEnd: allocation.periodEnd,
      totalSupplierAmount: allocation.totalSupplierAmount,
      totalPotentialShares: allocation.totalPotentialShares,
      totalSelectedShares: mathResult.totalSelectedShares,
      amountPerShare: mathResult.amountPerShare,
      remainderPaise: mathResult.remainderPaise,
      allocationMethod: 'SHARE_BASED',
      status: 'DRAFT',
      participants: updatedParticipantsProps,
      dataQualityIssues: [...allocation.dataQualityIssues],
      createdAt: allocation.createdAt,
    });

    this.electricityRepo.saveAllocation(updatedAllocation);

    return {
      success: true,
      bill,
      allocation: updatedAllocation,
      dataQualityIssues: [...updatedAllocation.dataQualityIssues],
      errors: [],
    };
  }

  /**
   * Application Use Case: Explicitly confirm Electricity Allocation.
   * Posts Finance utility bills for resident shares (>0) or records OWNER_ABSORBED outcome (shares = 0).
   * Employs compensating rollback if Finance billing fails for any participant.
   */
  public confirmAllocation(
    allocationId: string,
    confirmedBy: string,
    operatorNotes?: string
  ): SupplierBillAllocationServiceResult {
    if (!confirmedBy || confirmedBy.trim() === '') {
      return {
        success: false,
        bill: null,
        allocation: null,
        dataQualityIssues: [],
        errors: ['Operator identity (confirmedBy) is required to confirm an allocation.'],
      };
    }

    const allocation = this.electricityRepo.getAllocationById(allocationId);
    if (!allocation) {
      return {
        success: false,
        bill: null,
        allocation: null,
        dataQualityIssues: [],
        errors: [`ElectricityAllocation '${allocationId}' not found.`],
      };
    }
    if (allocation.status !== 'DRAFT') {
      return {
        success: false,
        bill: null,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [`Cannot confirm an ElectricityAllocation that is already ${allocation.status}.`],
      };
    }

    const bill = this.electricityRepo.getBillById(allocation.billId);
    if (!bill) {
      return {
        success: false,
        bill: null,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [`Linked ElectricityBill '${allocation.billId}' not found.`],
      };
    }

    // Branch A: Explicit OWNER_ABSORBED confirmation (totalSelectedShares === 0)
    if (allocation.totalSelectedShares === 0) {
      allocation.confirmOwnerAbsorbed(confirmedBy, operatorNotes);
      bill.confirm();

      this.electricityRepo.saveAllocation(allocation);
      this.electricityRepo.saveBill(bill);

      return {
        success: true,
        bill,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [],
      };
    }

    // Branch B: Standard RESIDENT_ALLOCATED confirmation (totalSelectedShares > 0)
    const createdFinanceBillIds: string[] = [];
    const billingErrors: string[] = [];
    const updatedParticipants: AllocationParticipant[] = [];
    const periodTag = allocation.periodStart.substring(0, 7); // e.g. '2026-07'

    for (const participant of allocation.participants) {
      if (participant.selectedShares <= 0 || participant.allocatedAmount <= 0) {
        updatedParticipants.push(participant);
        continue;
      }

      // Idempotency check: reuse existing Finance bill if already posted for participant
      const isDuplicate = this.financeService.hasDuplicateElectricityBill(participant.id);
      if (isDuplicate && participant.financeBillId) {
        updatedParticipants.push(participant);
        continue;
      }

      const description = `Electricity Bill Allocation (${allocation.periodStart} to ${allocation.periodEnd})`;
      const billPayload = {
        stayId: participant.stayId,
        billType: 'RECURRING_CHARGE' as const,
        period: periodTag,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        lineItems: [
          {
            id: `li_${participant.id}`,
            category: 'UTILITIES' as const,
            description,
            amount: participant.allocatedAmount,
          },
        ],
        totalAmount: participant.allocatedAmount,
        status: 'UNPAID' as const,
        remarks: `Electricity Allocation Bill (Participant ID: ${participant.id})`,
        customReferenceId: participant.id,
      };

      const billResult = this.financeService.createBill(billPayload);

      if (billResult.success && billResult.bill) {
        createdFinanceBillIds.push(billResult.bill.id);
        const participantWithBill = new AllocationParticipant({
          id: participant.id,
          allocationId: participant.allocationId,
          stayId: participant.stayId,
          residentId: participant.residentId,
          residentCode: participant.residentCode,
          residentNameSnapshot: participant.residentNameSnapshot,
          flatId: participant.flatId,
          potentialShares: participant.potentialShares,
          selectedShares: participant.selectedShares,
          allocatedAmount: participant.allocatedAmount,
          financeBillId: billResult.bill.id,
          remarks: participant.remarks,
        });
        updatedParticipants.push(participantWithBill);
      } else {
        billingErrors.push(
          `Finance billing failed for stay '${participant.stayId}': ${billResult.errors.join(', ')}`
        );
      }
    }

    // Application-Level Compensating Rollback if any Finance billing failed
    if (billingErrors.length > 0) {
      // Revert/delete all Finance bills created in this batch
      const currentBills = this.financeRepo.getBills();
      const cleanBills = currentBills.filter((b) => !createdFinanceBillIds.includes(b.id));
      this.financeRepo.saveBills(cleanBills);

      // Revert/delete all Ledger entries created for these participants
      const participantIds = allocation.participants.map((p) => p.id);
      const currentEntries = this.financeRepo.getLedgerEntries();
      const cleanEntries = currentEntries.filter(
        (e) => !(e.referenceType === 'ELECTRICITY_ALLOCATION' && participantIds.includes(e.referenceId))
      );
      this.financeRepo.saveLedgerEntries(cleanEntries);

      return {
        success: false,
        bill,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [
          'Electricity allocation confirmation aborted due to Finance billing failure. Application compensating rollback executed.',
          ...billingErrors,
        ],
      };
    }

    // All Finance postings succeeded: Transition allocation and bill to CONFIRMED
    const finalAllocationProps: AllocationParticipantProps[] = updatedParticipants.map((p) => ({
      id: p.id,
      allocationId: p.allocationId,
      stayId: p.stayId,
      residentId: p.residentId,
      residentCode: p.residentCode,
      residentNameSnapshot: p.residentNameSnapshot,
      flatId: p.flatId,
      potentialShares: p.potentialShares,
      selectedShares: p.selectedShares,
      allocatedAmount: p.allocatedAmount,
      financeBillId: p.financeBillId,
      remarks: p.remarks,
    }));

    const confirmedAllocation = new ElectricityAllocation({
      id: allocation.id,
      billId: allocation.billId,
      flatId: allocation.flatId,
      periodStart: allocation.periodStart,
      periodEnd: allocation.periodEnd,
      totalSupplierAmount: allocation.totalSupplierAmount,
      totalPotentialShares: allocation.totalPotentialShares,
      totalSelectedShares: allocation.totalSelectedShares,
      amountPerShare: allocation.amountPerShare,
      remainderPaise: allocation.remainderPaise,
      allocationMethod: 'SHARE_BASED',
      status: 'DRAFT',
      participants: finalAllocationProps,
      dataQualityIssues: [...allocation.dataQualityIssues],
      createdAt: allocation.createdAt,
    });

    confirmedAllocation.confirm(confirmedBy, operatorNotes);
    bill.confirm();

    this.electricityRepo.saveAllocation(confirmedAllocation);
    this.electricityRepo.saveBill(bill);

    return {
      success: true,
      bill,
      allocation: confirmedAllocation,
      dataQualityIssues: [...confirmedAllocation.dataQualityIssues],
      errors: [],
    };
  }

  /**
   * Application Use Case: Reverse a confirmed Electricity Allocation (BR-E-49).
   * Cancels associated resident Finance bills, counter-posts ledger entries,
   * handles OWNER_ABSORBED vs RESIDENT_ALLOCATED outcomes, and employs compensating rollback on failure.
   */
  public reverseAllocation(
    allocationId: string,
    reversedBy: string,
    reversalReason?: string
  ): SupplierBillAllocationServiceResult {
    if (!reversedBy || reversedBy.trim() === '') {
      return {
        success: false,
        bill: null,
        allocation: null,
        dataQualityIssues: [],
        errors: ['Operator identity (reversedBy) is required to reverse an allocation.'],
      };
    }

    const allocation = this.electricityRepo.getAllocationById(allocationId);
    if (!allocation) {
      return {
        success: false,
        bill: null,
        allocation: null,
        dataQualityIssues: [],
        errors: [`ElectricityAllocation '${allocationId}' not found.`],
      };
    }

    if (allocation.status !== 'CONFIRMED') {
      return {
        success: false,
        bill: null,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [`Cannot reverse an ElectricityAllocation that is ${allocation.status}. Only CONFIRMED allocations can be reversed.`],
      };
    }

    const bill = this.electricityRepo.getBillById(allocation.billId);
    if (!bill) {
      return {
        success: false,
        bill: null,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [`Linked ElectricityBill '${allocation.billId}' not found.`],
      };
    }

    const reversalReferenceId = `rev_${allocation.id}`;

    // Branch A: Explicit OWNER_ABSORBED reversal (no resident Finance bills were created)
    if (allocation.allocationOutcome === 'OWNER_ABSORBED' || allocation.totalSelectedShares === 0) {
      allocation.reverse(reversedBy, reversalReferenceId, reversalReason);

      this.electricityRepo.saveAllocation(allocation);

      return {
        success: true,
        bill,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [],
      };
    }

    // Branch B: Standard RESIDENT_ALLOCATED reversal
    // 1. Capture pre-reversal Finance state snapshot for compensating rollback
    const preReversalBillsSnapshot = JSON.parse(JSON.stringify(this.financeRepo.getBills()));
    const preReversalLedgerEntriesSnapshot = JSON.parse(JSON.stringify(this.financeRepo.getLedgerEntries()));

    const reversalErrors: string[] = [];

    try {
      const allBills = this.financeRepo.getBills();
      const updatedBills = [...allBills];

      for (const participant of allocation.participants) {
        if (!participant.financeBillId) continue;

        // Cancel the Finance bill using existing FinanceRepository.saveBill / saveBills
        const billIndex = updatedBills.findIndex((b) => b.id === participant.financeBillId);
        if (billIndex >= 0) {
          const targetBill = updatedBills[billIndex];
          updatedBills[billIndex] = {
            ...targetBill,
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
          };
        }

        // Counter-post ledger entries for the participant bill using existing ledgerService.reverseEntries
        const remarks = `Reversal of electricity allocation ${allocation.id} (Bill: ${participant.financeBillId})${reversalReason ? ` - ${reversalReason}` : ''}`;
        
        let revResult = this.ledgerService.reverseEntries(
          'ELECTRICITY_ALLOCATION',
          participant.financeBillId,
          remarks,
          reversedBy
        );

        if (!revResult.success) {
          // Fallback to checking by BILL reference type if ELECTRICITY_ALLOCATION wasn't found
          revResult = this.ledgerService.reverseEntries(
            'BILL',
            participant.financeBillId,
            remarks,
            reversedBy
          );
        }

        if (!revResult.success) {
          reversalErrors.push(
            `Failed to reverse ledger entries for participant stay '${participant.stayId}' (Bill ${participant.financeBillId}): ${revResult.errors.join(', ')}`
          );
        }
      }

      if (reversalErrors.length > 0) {
        throw new Error(reversalErrors.join('; '));
      }

      // Persist all cancelled bills
      this.financeRepo.saveBills(updatedBills);
    } catch (err: unknown) {
      // Application-Level Compensating Rollback: restore Finance state to pre-reversal snapshot
      this.financeRepo.saveBills(preReversalBillsSnapshot);
      this.financeRepo.saveLedgerEntries(preReversalLedgerEntriesSnapshot);

      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        bill,
        allocation,
        dataQualityIssues: [...allocation.dataQualityIssues],
        errors: [
          'Electricity allocation reversal aborted due to Finance processing failure. Application compensating rollback executed.',
          errorMessage,
        ],
      };
    }

    // All Finance reversals succeeded: Transition ElectricityAllocation to REVERSED
    allocation.reverse(reversedBy, reversalReferenceId, reversalReason);

    this.electricityRepo.saveAllocation(allocation);

    return {
      success: true,
      bill,
      allocation,
      dataQualityIssues: [...allocation.dataQualityIssues],
      errors: [],
    };
  }
}
