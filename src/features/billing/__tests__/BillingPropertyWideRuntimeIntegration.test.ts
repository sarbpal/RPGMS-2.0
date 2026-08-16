import { describe, it, expect, beforeEach } from 'vitest';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { defaultFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../finance/storage/financeStorage';
import { defaultElectricityRepository } from '../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { defaultBillingRunRepository } from '../infrastructure/repositories/InMemoryBillingRunRepository';
import { defaultBillingClaimRepository } from '../infrastructure/repositories/InMemoryBillingClaimRepository';
import { BillingWorkspaceCoordinator } from '../application/coordinator/BillingWorkspaceCoordinator';
import { ReportingApplicationService } from '../../finance/services/reportingService';
import { PaymentApplicationService } from '../../finance/services/paymentService';
import { Stay } from '../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../stay/domain/valueObjects/CommercialAgreement';
import type { Resident } from '../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../resident/domain/valueObjects/ResidentStatus';
import { Gender } from '../../resident/domain/valueObjects/Gender';
import { ElectricityAllocation } from '../../electricity/domain';

describe('Billing Property-Wide & Runtime Repository Integration', () => {
  let residentRepo: InMemoryResidentRepository;

  beforeEach(() => {
    residentRepo = new InMemoryResidentRepository();
    defaultBillingRunRepository.clear();
    defaultBillingClaimRepository.clear();
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('1. Cross-module repository visibility: Stay added to default repository is visible to Billing and Finance', async () => {
    const testStayId = `STAY-TEST-SHARED-${Date.now()}`;
    const testResidentId = `RES-TEST-SHARED-${Date.now()}`;

    const newResident: Resident = {
      id: testResidentId,
      residentCode: 'R-SHARED-01',
      fullName: 'Shared Test Resident',
      gender: Gender.MALE,
      dateOfBirth: '1995-05-10',
      status: ResidentStatus.ACTIVE,
      mobileNumber: '+91 9988776655',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    };
    await residentRepo.save(newResident);

    const newStay = new Stay({
      id: testStayId,
      residentId: testResidentId,
      stayType: 'REGULAR',
      status: 'ACTIVE',
      checkInDate: '2026-08-05',
      billingAnchorDay: 10,
      commercialAgreements: [
        new CommercialAgreement({
          id: `CA-${testStayId}`,
          stayId: testStayId,
          rent: 12000,
          securityDeposit: 24000,
          effectiveFrom: '2026-08-05',
          amendmentReason: 'Initial Agreement',
          status: 'ACTIVE',
        }),
      ],
    });
    await defaultStayRepository.save(newStay);

    // 1. Visible to Finance reporting service
    const reportingService = new ReportingApplicationService(
      defaultFinanceRepository,
      defaultStayRepository,
      residentRepo
    );
    const financialSummary = reportingService.getResidentFinancialSummary(testStayId);
    expect(financialSummary).not.toBeNull();
    expect(financialSummary?.residentName).toBe('Shared Test Resident');

    // 2. Visible to Billing coordinator in property-wide preview
    const billingCoordinator = new BillingWorkspaceCoordinator(
      defaultBillingRunRepository,
      defaultBillingClaimRepository,
      defaultStayRepository,
      residentRepo
    );
    const preview = await billingCoordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-ADMIN',
    });

    expect(preview.totalEligibleAmount).toBeGreaterThanOrEqual(12000);
    expect(preview.eligibleStaysCount).toBeGreaterThanOrEqual(1);
    const previewStay = preview.stays.find((s) => s.stayId === testStayId);
    expect(previewStay).toBeDefined();
    expect(previewStay?.eligibleAmount).toBe(12000);
    expect(previewStay?.residentName).toBe('Shared Test Resident');
  });

  it('2. Property-wide discovery (stayIds omitted) vs Explicit scoping (stayIds provided)', async () => {
    const coordinator = new BillingWorkspaceCoordinator(
      defaultBillingRunRepository,
      defaultBillingClaimRepository,
      defaultStayRepository,
      residentRepo
    );

    // Property-wide preview (no stayIds provided)
    const propertyWidePreview = await coordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-PROPERTY',
    });

    expect(propertyWidePreview.affectedStaysCount).toBeGreaterThan(1);
    expect(propertyWidePreview.totalEligibleAmount).toBeGreaterThan(0);

    // Explicit scoped preview (only STAY-2026-00041)
    const scopedPreview = await coordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-SCOPED',
      stayIds: ['STAY-2026-00041'],
    });

    expect(scopedPreview.affectedStaysCount).toBe(1);
    expect(scopedPreview.stays).toHaveLength(1);
    expect(scopedPreview.stays[0].stayId).toBe('STAY-2026-00041');
    expect(scopedPreview.totalEligibleAmount).toBe(8500);
  });

  it('3. Full end-to-end execution of property-wide run creates authoritative Finance bills and balanced ledger entries', async () => {
    const coordinator = new BillingWorkspaceCoordinator(
      defaultBillingRunRepository,
      defaultBillingClaimRepository,
      defaultStayRepository,
      residentRepo
    );

    // 1. Generate Property-wide Preview
    const preview = await coordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-E2E',
      notes: 'August 2026 Property-Wide Run',
    });

    expect(preview.canConfirm).toBe(true);
    expect(preview.eligibleStaysCount).toBeGreaterThan(0);

    // 2. Confirm and Start Run
    const executedRun = await coordinator.confirmAndStartRun(preview.runId);

    expect(executedRun.status).toBe('COMPLETED');
    expect(executedRun.failedOperationsCount).toBe(0);
    expect(executedRun.successfulOperationsCount).toBeGreaterThan(0);
    expect(executedRun.totalAmount).toBe(preview.totalEligibleAmount);

    // 3. Verify Finance contains the generated bills
    const financeBills = defaultFinanceRepository.getBills();
    expect(financeBills.length).toBeGreaterThanOrEqual(executedRun.successfulOperationsCount);

    // 4. Verify balanced ledger entries in Finance
    const ledgerEntries = defaultFinanceRepository.getLedgerEntries();
    expect(ledgerEntries.length).toBeGreaterThan(0);

    // Verify debits equal credits in ledger
    const totalDebits = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
    expect(totalDebits).toBe(totalCredits);

    // 5. Subsequent run for the same period acquires no new claims (idempotency / already claimed)
    const nextPreview = await coordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-E2E-2',
    });

    expect(nextPreview.totalEligibleAmount).toBe(0);
    expect(nextPreview.eligibleStaysCount).toBe(0);
  });

  it('4. Confirmed Electricity allocations are discovered as COMMITTED and not claimed by Billing', async () => {
    const allocId = `ELEC-ALLOC-${Date.now()}`;
    const elecAllocation = new ElectricityAllocation({
      id: allocId,
      billId: 'SUPPLIER-BILL-01',
      flatId: 'flat-1',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      status: 'CONFIRMED',
      totalSupplierAmount: 1500,
      totalPotentialShares: 2,
      totalSelectedShares: 2,
      amountPerShare: 750,
      remainderPaise: 0,
      allocationMethod: 'SHARE_BASED',
      confirmedAt: '2026-08-31T20:00:00Z',
      participants: [
        {
          id: 'PART-01',
          allocationId: allocId,
          stayId: 'STAY-2026-00041',
          residentId: 'RES-00124',
          residentCode: 'R000124',
          residentNameSnapshot: 'Rajesh Kumar',
          flatId: 'flat-1',
          potentialShares: 1,
          selectedShares: 1,
          allocatedAmount: 750,
          financeBillId: 'BILL-ELEC-001',
        },
      ],
    });
    defaultElectricityRepository.saveAllocation(elecAllocation);

    const coordinator = new BillingWorkspaceCoordinator(
      defaultBillingRunRepository,
      defaultBillingClaimRepository,
      defaultStayRepository,
      residentRepo
    );
    const preview = await coordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-ELEC',
      stayIds: ['STAY-2026-00041'],
    });

    // Rent obligation is eligible; Electricity allocation is committed (informative only)
    expect(preview.totalCommittedAmount).toBe(750);
    expect(preview.totalEligibleAmount).toBe(8500); // Rent only

    const stay1Summary = preview.stays.find((s) => s.stayId === 'STAY-2026-00041');
    expect(stay1Summary?.charges).toHaveLength(2); // 1 Rent (UNCOMMITTED) + 1 Electricity (COMMITTED)

    const elecCharge = stay1Summary?.charges.find((c) => c.chargeType === 'ELECTRICITY');
    expect(elecCharge?.commitmentStatus).toBe('COMMITTED');
    expect(elecCharge?.isEligible).toBe(false);
    expect(elecCharge?.amount).toBe(750);

    // Confirm and execute run
    const run = await coordinator.confirmAndStartRun(preview.runId);
    expect(run.status).toBe('COMPLETED');

    // Only Rent was billed (₹8,500), electricity was NOT billed again
    expect(run.totalAmount).toBe(8500);

    // Claims repository only contains the Rent claim, NO Electricity claim
    const claims = await defaultBillingClaimRepository.listAllClaims();
    const rentClaims = claims.filter((c) => c.obligationKey.startsWith('RENT:'));
    const elecClaims = claims.filter((c) => c.obligationKey.startsWith('ELECTRICITY:'));
    expect(rentClaims.length).toBeGreaterThan(0);
    expect(elecClaims.length).toBe(0);
  });

  it('5. Finance Workspace Row-Action: Billed stay populates outstanding dues report and allows recording payment for that stay', async () => {
    const billingCoordinator = new BillingWorkspaceCoordinator(
      defaultBillingRunRepository,
      defaultBillingClaimRepository,
      defaultStayRepository,
      residentRepo
    );
    const preview = await billingCoordinator.generatePreview({
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-ROW-ACTION',
      stayIds: ['STAY-2026-00041'],
    });

    await billingCoordinator.confirmAndStartRun(preview.runId);

    // Finance Reporting Service reflects outstanding dues for STAY-2026-00041
    const reportingService = new ReportingApplicationService(
      defaultFinanceRepository,
      defaultStayRepository,
      residentRepo
    );
    const outstandingReport = reportingService.getOutstandingResidents();
    const stay41Row = outstandingReport.find((r) => r.stayId === 'STAY-2026-00041');
    expect(stay41Row).toBeDefined();
    expect(stay41Row?.outstandingAmount).toBe(8500);

    // Record Payment using row stayId (simulating ReceivePaymentModal submission)
    const paymentService = new PaymentApplicationService();
    const paymentResult = paymentService.recordPayment({
      stayId: stay41Row!.stayId,
      amount: 8500,
      paymentDate: '2026-08-15',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-123456',
    });

    expect(paymentResult.success).toBe(true);
    expect(paymentResult.payment).toBeDefined();

    // After payment, outstanding dues is 0
    const updatedSummary = reportingService.getResidentFinancialSummary('STAY-2026-00041');
    expect(updatedSummary?.currentBalance).toBe(0);
  });
});
