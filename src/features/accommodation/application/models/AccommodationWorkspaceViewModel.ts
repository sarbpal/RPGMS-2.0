import type { AccommodationStats } from '../../components/AccommodationSummary';
import type { Flat } from '../../types';

export interface AccommodationWorkspaceViewModel {
  stats: AccommodationStats;
  flats: Flat[];
  filteredFlats: Flat[];
}
