import { describe, expect, it } from 'vitest';
import { stayWorkflowComposition } from '../stayWorkflowComposition';
import { defaultResidentRepository } from '../../../features/resident/infrastructure/repositories/InMemoryResidentRepository';
import { defaultStayRepository } from '../../../features/stay/infrastructure/repositories/InMemoryStayRepository';
import { defaultAccommodationRepository } from '../../../features/accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultReservationRepository } from '../../../features/reservation/infrastructure/repositories/InMemoryReservationRepository';

import { ResidentsListCoordinator } from '../../../features/resident/application/coordinator/ResidentsListCoordinator';
import { ResidentWorkspaceCoordinator } from '../../../features/resident/application/coordinator/ResidentWorkspaceCoordinator';
import { StayWorkspaceCoordinator } from '../../../features/stay/application/coordinator/StayWorkspaceCoordinator';
import { FinanceWorkspaceCoordinator } from '../../../features/finance/application/coordinator/FinanceWorkspaceCoordinator';
import { BillingWorkspaceCoordinator } from '../../../features/billing/application/coordinator/BillingWorkspaceCoordinator';
import { ReservationStatus } from '../../../features/reservation/domain/valueObjects/ReservationStatus';
import { TokenDisposition } from '../../../features/admission/domain/valueObjects/TokenDisposition';

describe('Cross-Workspace Operational Population Unification Integration Suite', () => {
  // --------------------------------------------------------------------------
  // TEST C: CANONICAL OBJECT IDENTITY VERIFICATION
  // --------------------------------------------------------------------------
  describe('Test C — Canonical Repository Object Identity', () => {
    it('proves strict object identity (===) for ResidentRepository across all coordinators and composition root', () => {
      const admissionCoordinator = stayWorkflowComposition.admissionCoordinator;
      const residentsListCoordinator = new ResidentsListCoordinator();
      const residentWorkspaceCoordinator = new ResidentWorkspaceCoordinator();
      const financeCoordinator = new FinanceWorkspaceCoordinator();
      const billingCoordinator = new BillingWorkspaceCoordinator();

      expect(admissionCoordinator.residentRepository).toBe(defaultResidentRepository);
      expect(admissionCoordinator.residentRepo).toBe(defaultResidentRepository);
      expect(residentsListCoordinator.repository).toBe(defaultResidentRepository);
      expect(residentsListCoordinator.residentRepository).toBe(defaultResidentRepository);
      expect(residentWorkspaceCoordinator.repository).toBe(defaultResidentRepository);
      expect(residentWorkspaceCoordinator.residentRepository).toBe(defaultResidentRepository);
      expect(financeCoordinator.residentRepository).toBe(defaultResidentRepository);
      expect(billingCoordinator.residentRepository).toBe(defaultResidentRepository);
      expect(stayWorkflowComposition.residentRepository).toBe(defaultResidentRepository);
      expect(stayWorkflowComposition.residentsListCoordinator.repository).toBe(defaultResidentRepository);
      expect(stayWorkflowComposition.residentWorkspaceCoordinator.repository).toBe(defaultResidentRepository);
    });

    it('proves strict object identity (===) for StayRepository across all coordinators and composition root', () => {
      const admissionCoordinator = stayWorkflowComposition.admissionCoordinator;
      const stayWorkspaceCoordinator = new StayWorkspaceCoordinator();
      const residentsListCoordinator = new ResidentsListCoordinator();
      const financeCoordinator = new FinanceWorkspaceCoordinator();
      const billingCoordinator = new BillingWorkspaceCoordinator();

      expect(admissionCoordinator.stayRepository).toBe(defaultStayRepository);
      expect(admissionCoordinator.stayRepo).toBe(defaultStayRepository);
      expect(stayWorkspaceCoordinator.stayRepository).toBe(defaultStayRepository);
      expect(residentsListCoordinator.stayRepository).toBe(defaultStayRepository);
      expect(financeCoordinator.stayRepository).toBe(defaultStayRepository);
      expect(billingCoordinator.stayRepository).toBe(defaultStayRepository);
      expect(stayWorkflowComposition.stayRepository).toBe(defaultStayRepository);
      expect(stayWorkflowComposition.stayWorkspaceCoordinator.stayRepository).toBe(defaultStayRepository);
    });

    it('proves strict object identity (===) for AccommodationRepository and ReservationRepository', () => {
      const admissionCoordinator = stayWorkflowComposition.admissionCoordinator;
      const stayWorkspaceCoordinator = new StayWorkspaceCoordinator();
      const financeCoordinator = new FinanceWorkspaceCoordinator();

      expect(admissionCoordinator.accommodationRepository).toBe(defaultAccommodationRepository);
      expect(stayWorkspaceCoordinator.accommodationRepository).toBe(defaultAccommodationRepository);
      expect(financeCoordinator.accommodationRepository).toBe(defaultAccommodationRepository);
      expect(stayWorkflowComposition.accommodationRepository).toBe(defaultAccommodationRepository);

      expect(admissionCoordinator.reservationRepository).toBe(defaultReservationRepository);
      expect(stayWorkflowComposition.reservationRepository).toBe(defaultReservationRepository);
    });
  });

  // --------------------------------------------------------------------------
  // TEST D: BASELINE SEED DATA INTEGRITY
  // --------------------------------------------------------------------------
  describe('Test D — Baseline Seed Data Integrity', () => {
    it('preserves legitimate resident seed records without synthetic placeholders', () => {
      const residents = defaultResidentRepository.getAllSync();
      const residentIds = residents.map((r) => r.id);

      expect(residentIds).toContain('RES-00124'); // Rajesh Kumar (Active)
      expect(residentIds).toContain('RES-00125'); // Amit Sharma (On Notice)
      expect(residentIds).toContain('RES-00101'); // Suresh Patel (Checked Out)

      // Ensure no synthetic placeholder resident exists
      expect(residentIds).not.toContain('RES-GLOBAL');
      expect(residentIds).not.toContain('res_global');
    });

    it('preserves legitimate stay seed records', () => {
      const stays = defaultStayRepository.getAllSync();
      const stayIds = stays.map((s) => s.id);

      expect(stayIds).toContain('STAY-2026-00041');
      expect(stayIds).toContain('STAY-2026-00042');
      expect(stayIds).toContain('STAY-2026-00010');
    });

    it('preserves legitimate reservation seed records', () => {
      const reservations = defaultReservationRepository.findAllSync();
      const resNumbers = reservations.map((r) => r.reservationNumber);

      expect(resNumbers).toContain('RES-000001');
      expect(resNumbers).toContain('RES-000002');
      expect(resNumbers).toContain('RES-000003');
      expect(resNumbers).toContain('RES-000004');
    });
  });

  // --------------------------------------------------------------------------
  // TEST A: WALK-IN ADMISSION CROSS-WORKSPACE VISIBILITY
  // --------------------------------------------------------------------------
  describe('Test A — Walk-In Admission Cross-Workspace Visibility', () => {
    it('makes a newly admitted walk-in resident immediately visible across Residents List, Resident Detail, Stay Workspace, Finance Stay Selector, and Billing Discovery', async () => {
      const admissionCoordinator = stayWorkflowComposition.admissionCoordinator;
      const residentsListCoordinator = stayWorkflowComposition.residentsListCoordinator;
      const residentWorkspaceCoordinator = stayWorkflowComposition.residentWorkspaceCoordinator;
      const stayWorkspaceCoordinator = stayWorkflowComposition.stayWorkspaceCoordinator;
      const financeCoordinator = new FinanceWorkspaceCoordinator();
      const billingCoordinator = new BillingWorkspaceCoordinator();

      // Find a vacant bed in accommodation inventory
      const flats = defaultAccommodationRepository.findAll();
      const targetFlat = flats.find((f) => f.areas.some((a) => a.beds.some((b) => b.status === 'VACANT')));
      expect(targetFlat).toBeDefined();
      const targetBed = targetFlat!.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT');
      expect(targetBed).toBeDefined();

      const initialResidentsVm = residentsListCoordinator.createViewModel();
      const initialTotalCount = initialResidentsVm.summary.totalCount;

      // Execute Walk-in Admission
      const walkInResult = admissionCoordinator.confirmWalkInAdmission({
        sourceType: 'WALK_IN',
        residentName: 'Arjun Venkatesh',
        mobileNumber: '9887766554',
        idProofType: 'AADHAAR',
        idProofNumber: '5566-7788-9900',
        checkInDate: '2026-08-01',
        agreedRent: 14000,
        agreedDeposit: 28000,
        flatId: targetFlat!.id,
        bedIds: [targetBed!.id],
      });

      expect(walkInResult.success).toBe(true);
      expect(walkInResult.residentId).toBeDefined();
      expect(walkInResult.stayId).toBeDefined();

      const { residentId, stayId } = walkInResult;

      // 1. Verify in Residents List Workspace
      const updatedResidentsVm = residentsListCoordinator.createViewModel();
      expect(updatedResidentsVm.summary.totalCount).toBe(initialTotalCount + 1);
      const listEntry = updatedResidentsVm.residents.find((r) => r.id === residentId);
      expect(listEntry).toBeDefined();
      expect(listEntry?.fullName).toBe('Arjun Venkatesh');
      expect(listEntry?.status).toBe('ACTIVE');
      expect(listEntry?.bed).toBe(targetBed!.id.split('-').slice(1).join('-') || targetBed!.id);

      // 2. Verify in Resident Detail Workspace
      const residentVm = residentWorkspaceCoordinator.createViewModel(residentId!);
      expect(residentVm).toBeDefined();
      expect(residentVm.header.fullName).toBe('Arjun Venkatesh');
      expect(residentVm.personalInformation.fullName).toBe('Arjun Venkatesh');
      expect(residentVm.contactInformation.primaryMobile).toBe('9887766554');
      expect(residentVm.currentStay?.stayId).toBe(stayId);

      // 3. Verify in Stay Workspace
      const stay = stayWorkspaceCoordinator.findStay(stayId);
      expect(stay).not.toBeNull();
      expect(stay?.residentId).toBe(residentId);
      expect(stay?.status).toBe('ACTIVE');
      expect(stay?.allocatedBedIds).toContain(targetBed!.id);
      expect(stay?.activeCommercialAgreement?.rent).toBe(14000);
      expect(stay?.activeCommercialAgreement?.securityDeposit).toBe(28000);

      // 4. Verify in Finance Workspace Stay Selector
      const selectableStays = financeCoordinator.getActiveStaysForSelection();
      const financeStayItem = selectableStays.find((s) => s.stayId === stayId);
      expect(financeStayItem).toBeDefined();
      expect(financeStayItem?.residentName).toBe('Arjun Venkatesh');
      expect(financeStayItem?.agreedRent).toBe(14000);
      expect(financeStayItem?.agreedDeposit).toBe(28000);
      expect(financeStayItem?.flatId).toBe(targetFlat!.id);

      // 5. Verify in Finance Stay Metrics
      const stayFinanceVm = financeCoordinator.getStayFinanceViewModel(stayId);
      expect(stayFinanceVm.balances.securityDepositHeld).toBe(28000);
      expect(stayFinanceVm.balances.receivableBalance).toBe(42000); // 14000 rent + 28000 deposit liability

      // 6. Verify in Billing Property-Wide Discovery
      const billingPreview = await billingCoordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-TEST-ADMIN',
      });
      const discoveredStay = billingPreview.stays.find((s) => s.stayId === stayId);
      expect(discoveredStay).toBeDefined();
      expect(discoveredStay?.residentName).toBe('Arjun Venkatesh');
      expect(discoveredStay?.totalDiscoveredAmount).toBe(14000);
    });
  });

  // --------------------------------------------------------------------------
  // TEST B: RESERVATION CONVERSION CROSS-WORKSPACE VISIBILITY
  // --------------------------------------------------------------------------
  describe('Test B — Reservation Conversion Cross-Workspace Visibility', () => {
    it('converts an active reservation to admission and propagates the converted Resident and Stay cross-workspace', async () => {
      const admissionCoordinator = stayWorkflowComposition.admissionCoordinator;
      const reservationCoordinator = stayWorkflowComposition.reservationWorkspaceCoordinator;
      const residentsListCoordinator = stayWorkflowComposition.residentsListCoordinator;
      const stayWorkspaceCoordinator = stayWorkflowComposition.stayWorkspaceCoordinator;
      const financeCoordinator = new FinanceWorkspaceCoordinator();
      const billingCoordinator = new BillingWorkspaceCoordinator();

      // Create a fresh active reservation with future date
      const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const todayDate = new Date().toISOString().split('T')[0];

      const newReservation = reservationCoordinator.saveReservation({
        prospectName: 'Meera Iyer',
        mobileNumber: '9776655443',
        expectedJoiningDate: futureDate,
        accommodationPreference: 'Double Sharing',
        tokenAmount: 3000,
        tokenReceivedOn: todayDate,
        tokenRemarks: 'NEFT',
        notes: 'Reservation conversion test',
      });

      expect(newReservation.status).toBe(ReservationStatus.ACTIVE);

      // Find another vacant bed
      const flats = defaultAccommodationRepository.findAll();
      const targetFlat = flats.find((f) => f.areas.some((a) => a.beds.some((b) => b.status === 'VACANT')));
      expect(targetFlat).toBeDefined();
      const targetBed = targetFlat!.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT');
      expect(targetBed).toBeDefined();

      // Convert Reservation to Admission
      const conversionResult = admissionCoordinator.confirmReservedAdmission(
        {
          sourceType: 'RESERVATION',
          reservationId: newReservation.id,
          residentName: 'Meera Iyer',
          mobileNumber: '9776655443',
          idProofType: 'PAN',
          idProofNumber: 'ABCDE1234F',
          checkInDate: '2026-08-01',
          agreedRent: 12500,
          agreedDeposit: 25000,
          flatId: targetFlat!.id,
          bedIds: [targetBed!.id],
          tokenDisposition: TokenDisposition.ADJUST_TO_FIRST_RENT,
        },
        newReservation
      );

      expect(conversionResult.success).toBe(true);
      const { residentId, stayId } = conversionResult;

      // 1. Verify Reservation status is CONVERTED with lineage references
      const updatedReservation = defaultReservationRepository.findByIdSync(newReservation.id);
      expect(updatedReservation?.status).toBe(ReservationStatus.CONVERTED);
      expect(updatedReservation?.convertedResidentId).toBe(residentId);
      expect(updatedReservation?.convertedStayId).toBe(stayId);

      // 2. Verify Resident in Residents List
      const residentsVm = residentsListCoordinator.createViewModel();
      const residentCard = residentsVm.residents.find((r) => r.id === residentId);
      expect(residentCard).toBeDefined();
      expect(residentCard?.fullName).toBe('Meera Iyer');

      // 3. Verify Stay in Stay Workspace
      const stay = stayWorkspaceCoordinator.findStay(stayId);
      expect(stay).not.toBeNull();
      expect(stay?.residentId).toBe(residentId);
      expect(stay?.status).toBe('ACTIVE');

      // 4. Verify Stay in Finance Workspace
      const selectableStays = financeCoordinator.getActiveStaysForSelection();
      const financeItem = selectableStays.find((s) => s.stayId === stayId);
      expect(financeItem).toBeDefined();
      expect(financeItem?.residentName).toBe('Meera Iyer');
      expect(financeItem?.agreedRent).toBe(12500);
      expect(financeItem?.agreedDeposit).toBe(25000);

      // 5. Verify in Billing Discovery
      const billingPreview = await billingCoordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-TEST-ADMIN',
      });
      const discoveredStay = billingPreview.stays.find((s) => s.stayId === stayId);
      expect(discoveredStay).toBeDefined();
      expect(discoveredStay?.residentName).toBe('Meera Iyer');
      expect(discoveredStay?.totalDiscoveredAmount).toBe(12500);
    });
  });

  // --------------------------------------------------------------------------
  // TEST E: FINANCE GLOBAL ACTIONS CONTEXT INTEGRITY
  // --------------------------------------------------------------------------
  describe('Test E — Finance Global Actions Context Integrity', () => {
    it('returns only real active/on-notice stays and guarantees no RES-GLOBAL placeholder exists', () => {
      const financeCoordinator = new FinanceWorkspaceCoordinator();
      const selectableStays = financeCoordinator.getActiveStaysForSelection();

      expect(selectableStays.length).toBeGreaterThan(0);

      for (const item of selectableStays) {
        // Assert every stay item has concrete domain identity
        expect(item.stayId).toMatch(/^(STAY|stay)-/i);
        expect(item.residentId).toMatch(/^(RES|res)-/i);
        expect(item.residentName).not.toBe('');
        expect(item.residentName).not.toContain('Global');
        expect(item.residentCode).not.toBe('RES-GLOBAL');
        expect(item.residentCode).not.toBe('res_global');
        expect(item.flatName).not.toBe('No Flat');
        expect(item.allocatedBedsLabel).not.toBe('No Bed Allotted');
        expect(item.agreedRent).toBeGreaterThan(0);
        expect(item.agreedDeposit).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // TEST F: BILLING PROPERTY-WIDE DISCOVERY SEMANTICS
  // --------------------------------------------------------------------------
  describe('Test F — Billing Property-Wide Discovery Semantics', () => {
    it('preserves property-wide discovery semantics (undefined / empty stayIds) discovering all active stays in StayRepository', async () => {
      const billingCoordinator = new BillingWorkspaceCoordinator();

      // Property-wide discovery (stayIds undefined)
      const previewUndefined = await billingCoordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-TEST-ADMIN',
        stayIds: undefined,
      });

      // Property-wide discovery (stayIds empty array)
      const previewEmpty = await billingCoordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-TEST-ADMIN',
        stayIds: [],
      });

      expect(previewUndefined.stays.length).toBe(previewEmpty.stays.length);
      expect(previewUndefined.stays.length).toBeGreaterThanOrEqual(2);

      // Scoped discovery with single stay
      const targetStayId = previewUndefined.stays[0].stayId;
      const previewScoped = await billingCoordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-TEST-ADMIN',
        stayIds: [targetStayId],
      });

      expect(previewScoped.stays.length).toBe(1);
      expect(previewScoped.stays[0].stayId).toBe(targetStayId);
    });
  });
});
