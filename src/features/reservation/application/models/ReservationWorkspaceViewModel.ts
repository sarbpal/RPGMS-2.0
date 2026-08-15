import type { Reservation } from '../../domain/entities/Reservation';

export interface ReservationStats {
  totalActive: number;
  totalFollowUp: number;
  arrivingToday: number;
  totalConverted: number;
  totalCancelled: number;
}

export type ReservationPortfolioFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'ARRIVING_TODAY'
  | 'TODAY'
  | 'FOLLOW_UP_REQUIRED'
  | 'CONVERTED'
  | 'CANCELLED';

export interface ReservationWorkspaceViewModel {
  stats: ReservationStats;
  reservations: Reservation[];
  filteredReservations: Reservation[];
}
