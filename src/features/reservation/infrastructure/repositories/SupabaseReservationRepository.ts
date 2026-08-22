import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import type { Reservation } from '../../domain/entities/Reservation';
import type { ReservationRepository } from '../../domain/interfaces/ReservationRepository';
import { ReservationMappers } from '../mappers/ReservationMappers';

export class SupabaseReservationRepository implements ReservationRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  public async findById(id: string): Promise<Reservation | null> {
    const { data, error } = await this.client
      .from('reservations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find reservation by ID ${id} in Supabase: ${error.message}`);
    }

    return data ? ReservationMappers.toDomain(data) : null;
  }

  public findByIdSync(_id: string): Reservation | null {
    throw new Error('Synchronous findByIdSync is not supported on SupabaseReservationRepository.');
  }

  public async findByReservationNumber(reservationNumber: string): Promise<Reservation | null> {
    const { data, error } = await this.client
      .from('reservations')
      .select('*')
      .ilike('reservation_number', reservationNumber)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to find reservation by number ${reservationNumber} in Supabase: ${error.message}`
      );
    }

    return data ? ReservationMappers.toDomain(data) : null;
  }

  public findByReservationNumberSync(_reservationNumber: string): Reservation | null {
    throw new Error(
      'Synchronous findByReservationNumberSync is not supported on SupabaseReservationRepository.'
    );
  }

  public async findActiveByMobile(mobileNumber: string): Promise<Reservation | null> {
    const cleanedMobile = mobileNumber.trim().replace(/\D/g, '');
    const { data, error } = await this.client
      .from('reservations')
      .select('*')
      .eq('mobile_number', cleanedMobile)
      .in('status', ['CONFIRMED', 'PENDING'])
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to find active reservation by mobile ${mobileNumber} in Supabase: ${error.message}`
      );
    }

    return data ? ReservationMappers.toDomain(data) : null;
  }

  public findActiveByMobileSync(_mobileNumber: string): Reservation | null {
    throw new Error(
      'Synchronous findActiveByMobileSync is not supported on SupabaseReservationRepository.'
    );
  }

  public async findAll(): Promise<Reservation[]> {
    const { data, error } = await this.client
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all reservations from Supabase: ${error.message}`);
    }

    return (data || []).map((row) => ReservationMappers.toDomain(row));
  }

  public findAllSync(): Reservation[] {
    throw new Error('Synchronous findAllSync is not supported on SupabaseReservationRepository.');
  }

  public async save(reservation: Reservation): Promise<Reservation> {
    const row = ReservationMappers.toRow(reservation);
    const { data, error } = await this.client
      .from('reservations')
      .upsert(row as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save reservation ${reservation.id} in Supabase: ${error.message}`);
    }

    return data ? ReservationMappers.toDomain(data) : reservation;
  }

  public saveSync(_reservation: Reservation): Reservation {
    throw new Error('Synchronous saveSync is not supported on SupabaseReservationRepository.');
  }

  public async delete(id: string): Promise<void> {
    const { error } = await this.client.from('reservations').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete reservation ${id} in Supabase: ${error.message}`);
    }
  }

  public deleteSync(_id: string): void {
    throw new Error('Synchronous deleteSync is not supported on SupabaseReservationRepository.');
  }
}
