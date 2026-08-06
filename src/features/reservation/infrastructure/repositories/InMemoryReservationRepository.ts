import type { Reservation } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/interfaces/ReservationRepository';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';
import { reservationSeedData } from '../data/reservationSeedData';

export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Reservation[];

  constructor(initialData: Reservation[] = reservationSeedData) {
    this.reservations = initialData.map((r) => ({ ...r }));
  }

  public findByIdSync(id: string): Reservation | null {
    const reservation = this.reservations.find((r) => r.id === id);
    return reservation ? { ...reservation } : null;
  }

  public async findById(id: string): Promise<Reservation | null> {
    return this.findByIdSync(id);
  }

  public findByReservationNumberSync(reservationNumber: string): Reservation | null {
    const reservation = this.reservations.find(
      (r) => r.reservationNumber.toLowerCase() === reservationNumber.toLowerCase()
    );
    return reservation ? { ...reservation } : null;
  }

  public async findByReservationNumber(reservationNumber: string): Promise<Reservation | null> {
    return this.findByReservationNumberSync(reservationNumber);
  }

  public findActiveByMobileSync(mobileNumber: string): Reservation | null {
    const cleanedMobile = mobileNumber.trim().replace(/\D/g, '');
    const found = this.reservations.find(
      (r) =>
        r.mobileNumber.replace(/\D/g, '') === cleanedMobile &&
        r.status === ReservationStatus.ACTIVE
    );
    return found ? { ...found } : null;
  }

  public async findActiveByMobile(mobileNumber: string): Promise<Reservation | null> {
    return this.findActiveByMobileSync(mobileNumber);
  }

  public findAllSync(): Reservation[] {
    return this.reservations.map((r) => ({ ...r }));
  }

  public async findAll(): Promise<Reservation[]> {
    return this.findAllSync();
  }

  public saveSync(reservation: Reservation): Reservation {
    const existingIndex = this.reservations.findIndex((r) => r.id === reservation.id);
    if (existingIndex >= 0) {
      this.reservations[existingIndex] = { ...reservation };
    } else {
      this.reservations.push({ ...reservation });
    }
    return { ...reservation };
  }

  public async save(reservation: Reservation): Promise<Reservation> {
    return this.saveSync(reservation);
  }

  public deleteSync(id: string): void {
    this.reservations = this.reservations.filter((r) => r.id !== id);
  }

  public async delete(id: string): Promise<void> {
    this.deleteSync(id);
  }
}
