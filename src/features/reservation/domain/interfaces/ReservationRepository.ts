import type { Reservation } from '../entities/Reservation';

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  findByIdSync(id: string): Reservation | null;
  findByReservationNumber(reservationNumber: string): Promise<Reservation | null>;
  findActiveByMobile(mobileNumber: string): Promise<Reservation | null>;
  findActiveByMobileSync(mobileNumber: string): Reservation | null;
  findAll(): Promise<Reservation[]>;
  findAllSync(): Reservation[];
  save(reservation: Reservation): Promise<Reservation>;
  saveSync(reservation: Reservation): Reservation;
  delete(id: string): Promise<void>;
}
