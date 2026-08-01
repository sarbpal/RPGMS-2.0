import type { Reservation } from '../../domain/entities/Reservation';

export interface ReservationStats {
  totalActive: number;
  totalFollowUp: number;
  arrivingToday: number;
  totalConverted: number;
  totalCancelled: number;
}

export interface ReservationWorkspaceViewModel {
  stats: ReservationStats;
  reservations: Reservation[];
  filteredReservations: Reservation[];
}
