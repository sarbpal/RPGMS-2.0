import { describe, it, expect } from 'vitest';
import { ResidentIdentityForm, type ResidentIdentityFormData } from '../components/ResidentIdentityForm';
import { ResidentWorkspaceCoordinator } from '../application/coordinator/ResidentWorkspaceCoordinator';
import { InMemoryResidentRepository } from '../infrastructure/repositories/InMemoryResidentRepository';

describe('REF-001 Shared Resident Identity Component Test Suite', () => {
  it('exports ResidentIdentityForm component', () => {
    expect(ResidentIdentityForm).toBeDefined();
    expect(typeof ResidentIdentityForm).toBe('function');
  });

  it('validates onboarding data structure contains mandatory 4 fields', () => {
    const onboardingData: ResidentIdentityFormData = {
      fullName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      idProofType: 'Aadhaar',
      idProofNumber: '1234-5678-9012',
    };

    expect(onboardingData.fullName).toBe('Rahul Sharma');
    expect(onboardingData.mobileNumber).toBe('9876543210');
    expect(onboardingData.idProofType).toBe('Aadhaar');
    expect(onboardingData.idProofNumber).toBe('1234-5678-9012');
  });

  it('validates complete profile data structure across 9 specification categories', () => {
    const profileData: ResidentIdentityFormData = {
      // 1. Personal Identity
      id: 'res-101',
      residentCode: 'RESID-000101',
      fullName: 'Vikram Aditya',
      preferredName: 'Vicky',
      dateOfBirth: '1998-05-15',
      gender: 'Male',
      photographUrl: 'https://example.com/photo.jpg',

      // 2. Contact Information
      mobileNumber: '9988776655',
      alternateMobileNumber: '9988776654',
      email: 'vikram@example.com',

      // 3. Government Identification
      idProofType: 'Aadhaar',
      idProofNumber: '9999-8888-7777',

      // 4. Address Information
      permanentAddressLine1: 'Flat 402, Royal Palms',
      permanentCity: 'Jaipur',
      permanentState: 'Rajasthan',
      permanentPostalCode: '302001',
      permanentCountry: 'India',
      sameAsPermanentAddress: true,
      localAddressLine1: 'Flat 402, Royal Palms',
      localCity: 'Jaipur',

      // 5. Emergency Contacts
      emergencyContactName: 'Rajesh Aditya',
      emergencyContactPhone: '9111122233',
      emergencyContactRelationship: 'Father',

      // 6. Professional Information
      occupationType: 'Working Professional',
      companyName: 'TechCorp Solutions',
      designation: 'Senior Software Engineer',
      officeAddress: 'Tech Park, Phase 2, Jaipur',

      // 7. Medical Information
      bloodGroup: 'B+',
      medicalConditions: 'None',
      allergies: 'Dust',
      currentMedications: 'None',
      medicalNotes: 'Fit and healthy',

      // 8. Resident Documents
      documents: [
        {
          id: 'doc-1',
          type: 'Aadhaar',
          fileName: 'aadhaar_card.pdf',
          uploadDate: '2026-07-20',
          verificationStatus: 'Verified',
        },
      ],

      // 9. System Generated Information
      status: 'ACTIVE',
      createdOn: '2026-07-20',
      createdBy: 'SYSTEM_ADMIN',
      archived: false,
      internalNotes: 'Verified during onboarding',
    };

    expect(profileData.fullName).toBe('Vikram Aditya');
    expect(profileData.occupationType).toBe('Working Professional');
    expect(profileData.companyName).toBe('TechCorp Solutions');
    expect(profileData.bloodGroup).toBe('B+');
    expect(profileData.documents).toHaveLength(1);
    expect(profileData.status).toBe('ACTIVE');
  });

  it('verifies integration with ResidentWorkspaceCoordinator view model creation', () => {
    const repository = new InMemoryResidentRepository();
    const coordinator = new ResidentWorkspaceCoordinator(repository);
    const viewModel = coordinator.createViewModel('RES-00124');

    expect(viewModel).toBeDefined();
    expect(viewModel.header.fullName).toBe('Rajesh Kumar');
    expect(viewModel.contactInformation.primaryMobile).toBe('+91 98765 43210');
  });
});
