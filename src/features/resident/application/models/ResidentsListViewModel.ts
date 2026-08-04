import type { ResidentStatus } from '../../domain/valueObjects/ResidentStatus';

export type ResidentListFilter = 'ALL' | 'ACTIVE' | 'ON_NOTICE' | 'ALUMNI';

export interface ResidentCardViewModel {
  id: string;
  residentCode: string;
  fullName: string;
  mobileNumber: string;
  status: ResidentStatus;
  statusLabel: string;
  flat?: string;
  bed?: string;
  doorId?: string;
}

export interface ResidentSummaryStatsViewModel {
  totalCount: number;
  activeCount: number;
  onNoticeCount: number;
  alumniCount: number;
}

export interface ResidentsListViewModel {
  summary: ResidentSummaryStatsViewModel;
  residents: ResidentCardViewModel[];
  activeFilter: ResidentListFilter;
  searchQuery: string;
}
