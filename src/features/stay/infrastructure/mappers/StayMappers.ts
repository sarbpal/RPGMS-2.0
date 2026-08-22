import { Stay } from '../../domain/entities/Stay';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import type { StayType } from '../../domain/valueObjects/StayType';
import type { Database } from '../../../../infrastructure/supabase/database.types';

type StayRow = Database['public']['Tables']['stays']['Row'];
type AllocationRow = Database['public']['Tables']['stay_bed_allocations']['Row'];

export class StayMappers {
  public static toDomain(row: StayRow, allocationRows: AllocationRow[] = []): Stay {
    const allocatedBedIds = allocationRows
      .filter((a) => a.status === 'ALLOCATED')
      .map((a) => a.bed_id);

    return new Stay({
      id: row.id,
      residentId: row.resident_id,
      stayType: row.stay_type as StayType,
      status: row.status as StayStatus,
      checkInDate: row.check_in_date,
      expectedCheckoutDate: row.expected_check_out_date || undefined,
      actualCheckoutDate: row.actual_check_out_date || undefined,
      flatId: row.flat_id,
      allocatedBedIds,
      agreedRent: Number(row.agreed_rent),
      agreedDeposit: Number(row.agreed_deposit),
      billingAnchorDay: row.billing_cycle_anchor_day,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  public static toRow(stay: Stay): Database['public']['Tables']['stays']['Insert'] {
    return {
      id: stay.id,
      resident_id: stay.residentId,
      flat_id: stay.flatId || 'FLAT-101',
      stay_type: (stay.stayType as 'REGULAR' | 'TEMPORARY') || 'REGULAR',
      status: stay.status as 'PLANNED' | 'ACTIVE' | 'ON_NOTICE' | 'CHECKED_OUT' | 'CLOSED',
      check_in_date: stay.checkInDate,
      expected_check_out_date: stay.expectedCheckoutDate || null,
      actual_check_out_date: stay.actualCheckoutDate || null,
      notice_date: null,
      agreed_rent: stay.agreedRent || 0,
      agreed_deposit: stay.agreedDeposit || 0,
      billing_cycle_anchor_day: stay.billingAnchorDay || 1,
      current_commercial_period_start: null,
      created_at: stay.createdAt || new Date().toISOString(),
      updated_at: stay.updatedAt || new Date().toISOString(),
    };
  }
}
