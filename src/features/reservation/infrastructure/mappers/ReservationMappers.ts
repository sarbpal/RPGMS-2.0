import type { Database } from '../../../../infrastructure/supabase/database.types';
import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';

export class ReservationMappers {
  public static toRow(
    reservation: Reservation
  ): Database['public']['Tables']['reservations']['Insert'] {
    let dbStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED' = 'CONFIRMED';
    if (reservation.status === ReservationStatus.CONVERTED) {
      dbStatus = 'CONVERTED';
    } else if (reservation.status === ReservationStatus.CANCELLED) {
      dbStatus = 'CANCELLED';
    } else {
      dbStatus = 'CONFIRMED';
    }

    return {
      id: reservation.id,
      reservation_number: reservation.reservationNumber,
      guest_name: reservation.prospectName,
      mobile_number: reservation.mobileNumber,
      email: null,
      bed_id: null,
      flat_id: null,
      target_stay_type: 'REGULAR',
      expected_joining_date: reservation.expectedJoiningDate,
      status: dbStatus,
      agreed_rent: reservation.expectedMonthlyRent ?? 0,
      agreed_deposit: reservation.expectedSecurityDeposit ?? 0,
      notes: reservation.notes ?? null,
      created_at: reservation.createdAt,
      updated_at: reservation.updatedAt,
    };
  }

  public static toDomain(
    row: Database['public']['Tables']['reservations']['Row']
  ): Reservation {
    let domainStatus: ReservationStatus = ReservationStatus.ACTIVE;
    if (row.status === 'CONVERTED') {
      domainStatus = ReservationStatus.CONVERTED;
    } else if (row.status === 'CANCELLED') {
      domainStatus = ReservationStatus.CANCELLED;
    } else {
      domainStatus = ReservationStatus.ACTIVE;
    }

    return {
      id: row.id,
      reservationNumber: row.reservation_number,
      prospectName: row.guest_name,
      mobileNumber: row.mobile_number,
      expectedJoiningDate: row.expected_joining_date,
      expectedMonthlyRent: row.agreed_rent,
      expectedSecurityDeposit: row.agreed_deposit,
      status: domainStatus,
      notes: row.notes ?? undefined,
      auditLog: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
