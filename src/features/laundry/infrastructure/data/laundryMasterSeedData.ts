import type { LaundryItemProps } from '../../domain/entities/LaundryItem';
import type { LaundryServiceProps } from '../../domain/entities/LaundryService';
import type { LaundryChargeRateProps } from '../../domain/entities/LaundryChargeRate';

export const initialLaundryItems: LaundryItemProps[] = [
  {
    id: 'LITM-001',
    code: 'SHIRT',
    name: 'Shirt',
    category: 'CLOTHING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-002',
    code: 'TROUSER',
    name: 'Trouser',
    category: 'CLOTHING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-003',
    code: 'JEANS',
    name: 'Jeans',
    category: 'CLOTHING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-004',
    code: 'SWEATER',
    name: 'Sweater',
    category: 'CLOTHING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-005',
    code: 'BLANKET',
    name: 'Blanket',
    category: 'BEDDING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-006',
    code: 'BEDSHEET',
    name: 'Bedsheet',
    category: 'BEDDING',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LITM-007',
    code: 'TOWEL',
    name: 'Towel',
    category: 'OTHER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const initialLaundryServices: LaundryServiceProps[] = [
  {
    id: 'LSRV-001',
    code: 'CLEANING',
    name: 'Cleaning (Wash & Fold)',
    description: 'Standard washing, drying, and folding service',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LSRV-002',
    code: 'IRONING',
    name: 'Ironing / Pressing',
    description: 'Steam press and ironing service',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LSRV-003',
    code: 'DRY_CLEANING',
    name: 'Dry Cleaning',
    description: 'Specialized chemical solvent garment cleaning',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const initialLaundryChargeRates: LaundryChargeRateProps[] = [
  // Shirt (LITM-001)
  {
    id: 'LRATE-001',
    itemId: 'LITM-001',
    serviceId: 'LSRV-001',
    rate: 20,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-002',
    itemId: 'LITM-001',
    serviceId: 'LSRV-002',
    rate: 10,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-003',
    itemId: 'LITM-001',
    serviceId: 'LSRV-003',
    rate: 80,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Trouser (LITM-002)
  {
    id: 'LRATE-004',
    itemId: 'LITM-002',
    serviceId: 'LSRV-001',
    rate: 25,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-005',
    itemId: 'LITM-002',
    serviceId: 'LSRV-002',
    rate: 15,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-006',
    itemId: 'LITM-002',
    serviceId: 'LSRV-003',
    rate: 90,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Jeans (LITM-003)
  {
    id: 'LRATE-007',
    itemId: 'LITM-003',
    serviceId: 'LSRV-001',
    rate: 30,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-008',
    itemId: 'LITM-003',
    serviceId: 'LSRV-002',
    rate: 15,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Sweater (LITM-004)
  {
    id: 'LRATE-009',
    itemId: 'LITM-004',
    serviceId: 'LSRV-001',
    rate: 35,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-010',
    itemId: 'LITM-004',
    serviceId: 'LSRV-003',
    rate: 120,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Blanket (LITM-005)
  {
    id: 'LRATE-011',
    itemId: 'LITM-005',
    serviceId: 'LSRV-001',
    rate: 100,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-012',
    itemId: 'LITM-005',
    serviceId: 'LSRV-003',
    rate: 250,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Bedsheet (LITM-006)
  {
    id: 'LRATE-013',
    itemId: 'LITM-006',
    serviceId: 'LSRV-001',
    rate: 40,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'LRATE-014',
    itemId: 'LITM-006',
    serviceId: 'LSRV-002',
    rate: 20,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // Towel (LITM-007)
  {
    id: 'LRATE-015',
    itemId: 'LITM-007',
    serviceId: 'LSRV-001',
    rate: 15,
    effectiveFrom: '2026-01-01',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
