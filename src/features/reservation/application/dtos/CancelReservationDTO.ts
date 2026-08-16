import type { TokenCancellationDisposition } from '../../domain/entities/Reservation';

export interface CancelReservationDTO {
  reason: string;
  tokenDisposition?: TokenCancellationDisposition;
}
