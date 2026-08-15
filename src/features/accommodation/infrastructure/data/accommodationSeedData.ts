import type { Flat } from '../../domain/entities/Flat';
import { BedStatus } from '../../domain/valueObjects/BedStatus';

export const accommodationSeedData: Flat[] = [
  {
    id: '101',
    name: '101',
    floor: '1st Floor',
    description: '2 BHK Premium Flat',
    areas: [
      {
        id: '101-hall',
        name: 'Hall',
        bedPrefix: 'H',
        defaultRent: 6000,
        defaultDeposit: 6000,
        beds: [
          { id: '101-H1', name: 'H1', status: BedStatus.VACANT, defaultRent: 6000, defaultDeposit: 6000 },
          { id: '101-H2', name: 'H2', status: BedStatus.VACANT, defaultRent: 6000, defaultDeposit: 6000 },
        ],
      },
      {
        id: '101-bedroom',
        name: 'Bedroom',
        bedPrefix: 'B',
        defaultRent: 6500,
        defaultDeposit: 6500,
        beds: [
          { id: '101-B1', name: 'B1', status: BedStatus.OCCUPIED, residentName: 'Rajesh Kumar', defaultRent: 6500, defaultDeposit: 6500 },
          { id: '101-B2', name: 'B2', status: BedStatus.VACANT, defaultRent: 6500, defaultDeposit: 6500 },
        ],
      },
    ],
  },
  {
    id: '102',
    name: '102',
    floor: '1st Floor',
    description: '1 BHK Executive Flat',
    areas: [
      {
        id: '102-bedroom',
        name: 'Master Bedroom',
        bedPrefix: 'B',
        defaultRent: 6000,
        defaultDeposit: 6000,
        beds: [
          { id: '102-B1', name: 'B1', status: BedStatus.ON_NOTICE, residentName: 'Amit Sharma', defaultRent: 6000, defaultDeposit: 6000 },
          { id: '102-B2', name: 'B2', status: BedStatus.ON_NOTICE, residentName: 'Amit Sharma', defaultRent: 6000, defaultDeposit: 6000 },
        ],
      },
    ],
  },
  {
    id: '103',
    name: '103',
    floor: '2nd Floor',
    description: '3 BHK Shared Flat',
    areas: [
      {
        id: '103-bedroom-1',
        name: 'Bedroom 1',
        bedPrefix: 'B',
        defaultRent: 7000,
        defaultDeposit: 7000,
        beds: [
          { id: '103-B1', name: 'B1', status: BedStatus.VACANT, defaultRent: 7000, defaultDeposit: 7000 },
          { id: '103-B2', name: 'B2', status: BedStatus.VACANT, defaultRent: 7000, defaultDeposit: 7000 },
        ],
      },
    ],
  },
];
