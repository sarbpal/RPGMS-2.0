import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultFinanceRepository } from '../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../storage/financeStorage';
import { AdmissionCoordinator } from '../../admission/application/coordinator/AdmissionCoordinator';
import { ReservationStatus } from '../../reservation/domain/valueObjects/ReservationStatus';
import { TokenDisposition } from '../../admission/domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../../admission/application/models/AdmissionDraft';
import { paymentService } from '../services/paymentService';
import { billingService } from '../services/billingService';
import { SettlementApplicationService } from '../services/settlementService';
import { reportingService } from '../services/reportingService';
import { balanceEngine } from '../services/balanceEngine';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';
import { Stay } from '../../stay/domain/entities/Stay';
import type { PaymentMethod } from '../domain';

describe('Sprint FR-5 — End-to-End Complete Financial Lifecycle Journey', () => {
  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('executes complete 7-step financial lifecycle: Admission -> Rent Billing -> Payment -> Extra Charge -> Overpayment -> Settlement Preview -> Final Financial Closure', () => {
    // ----------------------------------------------------
    // STEP 1: Reserved Admission with Token Advance
    // ----------------------------------------------------
    const mockReservation = {
      id: 'resv-e2e-001',
      reservationNumber: 'RES-E2E-001',
      prospectName: 'Anand Verma',
      mobileNumber: '9988776655',
      expectedJoiningDate: '2026-08-01',
      expectedMonthlyRent: 10000,
      expectedSecurityDeposit: 10000,
      accommodationPreference: 'Single Sharing',
      tokenAmount: 2000,
      tokenReceivedOn: '2026-07-25',
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-07-25T10:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    };

    const resRepo = new InMemoryReservationRepository([mockReservation]);
    const residentRepo = new InMemoryResidentRepository();
    const stayRepo = new InMemoryStayRepository();
    const accomRepo = new InMemoryAccommodationRepository();

    const coordinator = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
    const reservation = resRepo.findByIdSync('resv-e2e-001')!;
    const flat = accomRepo.findAllSync()[0];
    const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

    const admissionDraft: AdmissionDraft = {
      reservationId: 'resv-e2e-001',
      residentName: 'Anand Verma',
      mobileNumber: '9988776655',
      idProofType: 'AADHAAR',
      idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: flat.id,
      bedIds: [vacantBed.id],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    };

    const admissionResult = coordinator.confirmReservedAdmission(admissionDraft, reservation);
    expect(admissionResult.success).toBe(true);
    const stayId = admissionResult.stayId!;
    expect(stayId).toBeDefined();

    // Instantiate SettlementApplicationService with test DI stayRepo
    const e2eSettlementService = new SettlementApplicationService(defaultFinanceRepository, stayRepo);

    // ----------------------------------------------------
    // STEP 2: Verify Initial Dashboard Metrics & Balances
    // ----------------------------------------------------
    const initialDashboard = reportingService.getFinanceDashboard();
    // Billed 1st month rent (10,000)
    expect(initialDashboard.totalMonthlyBilling).toBe(10000);
    const initialBalances = balanceEngine.calculateStayBalances(stayId);
    expect(initialBalances.receivableBalance).toBe(18000); // 10,000 rent + 8,000 net deposit receivable
    expect(initialBalances.securityDepositHeld).toBe(8000); // 8,000 net deposit liability created via token offset

    // ----------------------------------------------------
    // STEP 3: Record Rent & Deposit Payment Collection
    // ----------------------------------------------------
    const payment1 = paymentService.recordPayment({
      stayId,
      amount: 18000,
      paymentDate: '2026-08-02',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-REF-001',
      remarks: 'Full rent and deposit payment',
    });

    expect(payment1.success).toBe(true);
    expect(payment1.payment?.amount).toBe(18000);

    const postPaymentBalances = balanceEngine.calculateStayBalances(stayId);
    expect(postPaymentBalances.receivableBalance).toBe(0);

    // ----------------------------------------------------
    // STEP 4: Generate Ancillary Laundry Charge
    // ----------------------------------------------------
    const laundryResult = billingService.generateLaundryChargeBill(
      stayId,
      500,
      '2026-08-10',
      'Weekly Laundry Service',
      'Steam press included'
    );

    expect(laundryResult.success).toBe(true);
    expect(laundryResult.bill?.totalAmount).toBe(500);

    const postLaundryBalances = balanceEngine.calculateStayBalances(stayId);
    expect(postLaundryBalances.receivableBalance).toBe(500);

    // ----------------------------------------------------
    // STEP 5: Record Overpayment / Advance Credit
    // ----------------------------------------------------
    const payment2 = paymentService.recordPayment({
      stayId,
      amount: 1500, // 500 covers laundry, 1000 becomes Advance Credit
      paymentDate: '2026-08-12',
      paymentMethod: 'CASH',
      remarks: 'Overpayment for laundry + advance credit',
    });

    expect(payment2.success).toBe(true);
    const postOverpaymentBalances = balanceEngine.calculateStayBalances(stayId);
    expect(postOverpaymentBalances.receivableBalance).toBe(0);
    expect(postOverpaymentBalances.advanceCreditBalance).toBe(1000);

    // ----------------------------------------------------
    // STEP 6: Execute Stage 1 Checkout Settlement Preview
    // ----------------------------------------------------
    const previewResult = e2eSettlementService.generateSettlementPreview(
      stayId,
      1500, // 1,500 damage deduction
      'Wall painting damage'
    );

    expect(previewResult.success).toBe(true);
    const preview = previewResult.preview!;
    expect(preview.securityDepositHeld).toBe(8000);
    expect(preview.advanceCreditBalance).toBe(1000);
    expect(preview.damageDeductions).toBe(1500);
    // Total available credits: 8,000 deposit + 1,000 advance = 9,000. Dues: 1,500 damage.
    // Net refund to resident = 9,000 - 1,500 = 7,500.
    expect(preview.netSettlementAmount).toBe(7500);
    expect(preview.outcome).toBe('HOSTEL_REFUNDS_RESIDENT');

    // ----------------------------------------------------
    // STEP 7: Execute Stage 2 Settlement Commitment
    // ----------------------------------------------------
    // Transition Stay to CHECKED_OUT to permit final financial closure
    const currentStay = stayRepo.findByIdSync(stayId)!;
    const checkedOutStay = new Stay({ ...currentStay, status: StayStatus.CHECKED_OUT });
    stayRepo.saveSync(checkedOutStay);

    const settlementResult = e2eSettlementService.confirmSettlement(preview, 'BANK_TRANSFER' as PaymentMethod);

    expect(settlementResult.success).toBe(true);
    expect(settlementResult.settlement?.settlementNumber).toMatch(/^STL-/);

    // Verify Final Financial Closure & Dynamic Balances
    const finalBalances = balanceEngine.calculateStayBalances(stayId);
    expect(finalBalances.receivableBalance).toBe(0);
    expect(finalBalances.securityDepositHeld).toBe(0);
    expect(finalBalances.advanceCreditBalance).toBe(0);
    expect(finalBalances.netBalance).toBe(0);

    // Verify Stay status updated to CHECKED_OUT
    const updatedStay = stayRepo.findByIdSync(stayId);
    expect(updatedStay?.status).toBe(StayStatus.CHECKED_OUT);

    // Verify Completed Settlements Audit Report
    const settlementsReport = reportingService.getSettlementReport();
    expect(settlementsReport.length).toBeGreaterThan(0);
    const lastReport = settlementsReport.find((s) => s.stayId === stayId);
    expect(lastReport).toBeDefined();
    expect(lastReport?.damageRecovery).toBe(1500);
    expect(lastReport?.netRefundAmount).toBe(7500);
  });
});
