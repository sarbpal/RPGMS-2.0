const BedStatus = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  ON_NOTICE: 'ON_NOTICE',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED',
};

const mockFlats = [
  {
    id: '101',
    name: '101',
    areas: [
      {
        id: '101-bedroom',
        name: 'Bedroom',
        beds: [
          { id: '101-B1', name: 'B1', status: BedStatus.OCCUPIED, residentName: 'John' },
          { id: '101-B2', name: 'B2', status: BedStatus.VACANT },
        ]
      }
    ]
  },
  {
    id: '102',
    name: '102',
    areas: [
      {
        id: '102-bedroom',
        name: 'Bedroom',
        beds: [
          { id: '102-B1', name: 'B1', status: BedStatus.ON_NOTICE, residentName: 'Jane' },
          { id: '102-B2', name: 'B2', status: BedStatus.VACANT },
        ]
      }
    ]
  },
  {
    id: '103',
    name: '103',
    areas: [
      {
        id: '103-bedroom',
        name: 'Bedroom',
        beds: [
          { id: '103-B1', name: 'B1', status: BedStatus.MAINTENANCE },
          { id: '103-B2', name: 'B2', status: BedStatus.BLOCKED },
        ]
      }
    ]
  }
];

function filterFlats(flats, statusFilter) {
  return flats.filter((flat) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      flat.areas.some((area) =>
        area.beds.some((bed) => {
          if (statusFilter === BedStatus.OCCUPIED) {
            return bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE;
          }
          return bed.status === statusFilter;
        })
      );
    return matchesStatus;
  });
}

console.log('ALL beds filter count:', filterFlats(mockFlats, 'ALL').length);
console.log('VACANT beds filter count:', filterFlats(mockFlats, BedStatus.VACANT).length);
console.log('OCCUPIED beds filter count:', filterFlats(mockFlats, BedStatus.OCCUPIED).length);
console.log('ON_NOTICE beds filter count:', filterFlats(mockFlats, BedStatus.ON_NOTICE).length);
console.log('MAINTENANCE beds filter count:', filterFlats(mockFlats, BedStatus.MAINTENANCE).length);
console.log('BLOCKED beds filter count:', filterFlats(mockFlats, BedStatus.BLOCKED).length);
