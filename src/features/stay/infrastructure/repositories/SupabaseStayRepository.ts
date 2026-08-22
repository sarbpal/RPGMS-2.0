import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import { Stay } from '../../domain/entities/Stay';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { StayMappers } from '../mappers/StayMappers';

export class SupabaseStayRepository implements StayRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  public async findById(id: string): Promise<Stay | null> {
    const { data: stayRow, error } = await this.client
      .from('stays')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !stayRow) {
      return null;
    }

    const { data: allocRows } = await this.client
      .from('stay_bed_allocations')
      .select('*')
      .eq('stay_id', id);

    return StayMappers.toDomain(
      stayRow as Database['public']['Tables']['stays']['Row'],
      (allocRows || []) as Database['public']['Tables']['stay_bed_allocations']['Row'][]
    );
  }

  public findByIdSync(_id: string): Stay | null {
    return null;
  }

  public getAllSync(): Stay[] {
    return [];
  }

  public async findByResidentId(residentId: string): Promise<Stay[]> {
    const { data: stayRows, error } = await this.client
      .from('stays')
      .select('*')
      .eq('resident_id', residentId)
      .order('check_in_date', { ascending: false });

    if (error || !stayRows) {
      return [];
    }

    const stays: Stay[] = [];
    for (const row of stayRows as Database['public']['Tables']['stays']['Row'][]) {
      const { data: allocRows } = await this.client
        .from('stay_bed_allocations')
        .select('*')
        .eq('stay_id', row.id);
      stays.push(
        StayMappers.toDomain(
          row,
          (allocRows || []) as Database['public']['Tables']['stay_bed_allocations']['Row'][]
        )
      );
    }
    return stays;
  }

  public async findActiveByResidentId(residentId: string): Promise<Stay | null> {
    const { data: stayRow, error } = await this.client
      .from('stays')
      .select('*')
      .eq('resident_id', residentId)
      .in('status', [StayStatus.ACTIVE, StayStatus.ON_NOTICE])
      .order('check_in_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !stayRow) {
      return null;
    }

    const { data: allocRows } = await this.client
      .from('stay_bed_allocations')
      .select('*')
      .eq('stay_id', (stayRow as Database['public']['Tables']['stays']['Row']).id);

    return StayMappers.toDomain(
      stayRow as Database['public']['Tables']['stays']['Row'],
      (allocRows || []) as Database['public']['Tables']['stay_bed_allocations']['Row'][]
    );
  }

  public async save(stay: Stay): Promise<Stay> {
    const row = StayMappers.toRow(stay);
    await this.client.from('stays').upsert(row as any);

    if (stay.allocatedBedIds && stay.allocatedBedIds.length > 0) {
      for (const bedId of stay.allocatedBedIds) {
        await this.client.from('stay_bed_allocations').upsert({
          id: `alloc_${stay.id}_${bedId}`,
          stay_id: stay.id,
          bed_id: bedId,
          status: 'ALLOCATED',
          allocated_at: new Date().toISOString(),
        } as any);
      }
    }

    return stay;
  }

  public async update(stay: Stay): Promise<Stay> {
    return this.save(stay);
  }

  public async delete(id: string): Promise<void> {
    await this.client.from('stay_bed_allocations').delete().eq('stay_id', id);
    await this.client.from('stays').delete().eq('id', id);
  }

  public async findStaysByFlatAndPeriodOverlap(
    flatId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Stay[]> {
    const { data: stayRows, error } = await this.client
      .from('stays')
      .select('*')
      .eq('flat_id', flatId)
      .lte('check_in_date', periodEnd);

    if (error || !stayRows) {
      return [];
    }

    const typedRows = stayRows as Database['public']['Tables']['stays']['Row'][];
    const overlapping = typedRows.filter((row) => {
      const checkout = row.actual_check_out_date || row.expected_check_out_date || '9999-12-31';
      return checkout >= periodStart;
    });

    const result: Stay[] = [];
    for (const row of overlapping) {
      const { data: allocRows } = await this.client
        .from('stay_bed_allocations')
        .select('*')
        .eq('stay_id', row.id);
      result.push(
        StayMappers.toDomain(
          row,
          (allocRows || []) as Database['public']['Tables']['stay_bed_allocations']['Row'][]
        )
      );
    }
    return result;
  }

  public findStaysByFlatAndPeriodOverlapSync(
    _flatId: string,
    _periodStart: string,
    _periodEnd: string
  ): Stay[] {
    return [];
  }
}
