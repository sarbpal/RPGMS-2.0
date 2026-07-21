import { useState, useCallback, useMemo } from 'react';
import { type ResidentWithActiveStay, ResidentStatus } from '../types';
import type { Flat } from '../../accommodation/types';
import { residentService } from '../services/residentService';

export interface UseResidentsReturn {
  residents: ResidentWithActiveStay[];
  flats: Flat[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filteredResidents: ResidentWithActiveStay[];
  totalCount: number;
  activeCount: number;
  onNoticeCount: number;
  checkedOutCount: number;
  refresh: () => void;
  getFlatName: (flatId: string) => string;
  getBedsString: (allocatedBedIds: string[]) => string;
}

export function useResidents(): UseResidentsReturn {
  const [residents, setResidents] = useState<ResidentWithActiveStay[]>(() =>
    residentService.getResidentsWithActiveStay()
  );
  const [flats, setFlats] = useState<Flat[]>(() => residentService.getFlats());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const refresh = useCallback(() => {
    setResidents(residentService.getResidentsWithActiveStay());
    setFlats(residentService.getFlats());
  }, []);

  const getFlatName = useCallback((flatId: string) => {
    const flat = flats.find((f) => f.id === flatId);
    return flat ? `Flat ${flat.name}` : flatId;
  }, [flats]);

  const getBedsString = useCallback((allocatedBedIds: string[]) => {
    return allocatedBedIds
      .map((bedId) => {
        const match = bedId.match(/[^-]+$/);
        return match ? match[0] : bedId;
      })
      .join(', ');
  }, []);

  // Summary metrics calculations
  const totalCount = residents.length;
  const activeCount = useMemo(
    () => residents.filter((r) => r.status === ResidentStatus.ACTIVE).length,
    [residents]
  );
  const onNoticeCount = useMemo(
    () => residents.filter((r) => r.status === ResidentStatus.ON_NOTICE).length,
    [residents]
  );
  const checkedOutCount = useMemo(
    () => residents.filter((r) => r.status === ResidentStatus.CHECKED_OUT).length,
    [residents]
  );

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const flatName = getFlatName(r.flatId);
      const bedsString = getBedsString(r.allocatedBedIds);

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        r.fullName.toLowerCase().includes(query) ||
        r.mobileNumber.toLowerCase().includes(query) ||
        r.residentCode.toLowerCase().includes(query) ||
        flatName.toLowerCase().includes(query) ||
        bedsString.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [residents, searchQuery, statusFilter, getFlatName, getBedsString]);

  return {
    residents,
    flats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredResidents,
    totalCount,
    activeCount,
    onNoticeCount,
    checkedOutCount,
    refresh,
    getFlatName,
    getBedsString,
  };
}
