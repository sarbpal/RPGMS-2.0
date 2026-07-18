import { DocumentType, ResidentStatus } from '../types';
import type { Resident } from '../types';

export const mockResidents: Resident[] = [
  {
    id: 'res-001',
    residentCode: 'R000001',
    fullName: 'Arjun Sharma',
    mobileNumber: '9876543210',
    documentType: DocumentType.AADHAAR,
    documentNumber: '1234-5678-9012',
    joiningDate: '2026-01-15',
    flatId: '101',
    allocatedBedIds: ['101-B1'], // Single-bed allocation
    agreedRent: 6500,
    agreedDeposit: 6500,
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'res-002',
    residentCode: 'R000002',
    fullName: 'Priya Patel',
    mobileNumber: '9876543211',
    documentType: DocumentType.PAN,
    documentNumber: 'ABCDE1234F',
    joiningDate: '2026-02-01',
    flatId: '102',
    allocatedBedIds: ['102-B1', '102-B2'], // Multi-bed allocation (e.g. occupying 2 beds in double sharing area)
    agreedRent: 12000,
    agreedDeposit: 12000,
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-02-01T11:00:00.000Z',
    updatedAt: '2026-02-01T11:00:00.000Z',
  }
];
