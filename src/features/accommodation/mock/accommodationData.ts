import { BedStatus } from '../types';
import type { Flat } from '../types';

export const mockFlats: Flat[] = [
  {
    id: '101',
    name: '101',
    areas: [
      {
        id: '101-bedroom',
        name: 'Bedroom',
        beds: [
          { id: '101-B1', name: 'B1', status: BedStatus.OCCUPIED, residentName: 'John Doe' },
          { id: '101-B2', name: 'B2', status: BedStatus.VACANT },
        ],
      },
      {
        id: '101-hall',
        name: 'Hall',
        beds: [
          { id: '101-H1', name: 'H1', status: BedStatus.OCCUPIED, residentName: 'Alice Smith' },
          { id: '101-H2', name: 'H2', status: BedStatus.VACANT },
          { id: '101-H3', name: 'H3', status: BedStatus.VACANT },
        ],
      },
    ],
  },
  {
    id: '201',
    name: '201',
    areas: [
      {
        id: '201-bedroom',
        name: 'Bedroom',
        beds: [
          { id: '201-B1', name: 'B1', status: BedStatus.OCCUPIED, residentName: 'Bob Johnson' },
          { id: '201-B2', name: 'B2', status: BedStatus.OCCUPIED, residentName: 'Charlie Brown' },
        ],
      },
      {
        id: '201-small-bedroom',
        name: 'Small Bedroom',
        beds: [
          { id: '201-S1', name: 'S1', status: BedStatus.VACANT },
        ],
      },
      {
        id: '201-hall',
        name: 'Hall',
        beds: [
          { id: '201-H1', name: 'H1', status: BedStatus.VACANT },
          { id: '201-H2', name: 'H2', status: BedStatus.VACANT },
        ],
      },
    ],
  },
];
