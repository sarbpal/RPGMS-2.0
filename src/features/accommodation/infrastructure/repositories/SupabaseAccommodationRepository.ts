import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import type { Flat } from '../../domain/entities/Flat';
import type { AccommodationRepository } from '../../domain/interfaces/AccommodationRepository';
import { AccommodationMappers } from '../mappers/AccommodationMappers';

export class SupabaseAccommodationRepository implements AccommodationRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  public async findAll(): Promise<Flat[]> {
    const { data: flatRows, error: flatErr } = await this.client
      .from('flats')
      .select('*')
      .order('name');

    if (flatErr) {
      throw new Error(`Failed to load flats from Supabase: ${flatErr.message}`);
    }

    if (!flatRows || flatRows.length === 0) {
      return [];
    }

    const { data: areaRows, error: areaErr } = await this.client.from('areas').select('*');
    if (areaErr) {
      throw new Error(`Failed to load areas from Supabase: ${areaErr.message}`);
    }

    const { data: bedRows, error: bedErr } = await this.client.from('beds').select('*');
    if (bedErr) {
      throw new Error(`Failed to load beds from Supabase: ${bedErr.message}`);
    }

    return (flatRows as Database['public']['Tables']['flats']['Row'][]).map((flatRow) =>
      AccommodationMappers.toDomain(
        flatRow,
        ((areaRows || []) as Database['public']['Tables']['areas']['Row'][]).filter(
          (a) => a.flat_id === flatRow.id
        ),
        ((bedRows || []) as Database['public']['Tables']['beds']['Row'][]).filter(
          (b) => b.flat_id === flatRow.id
        )
      )
    );
  }

  public async findById(id: string): Promise<Flat | null> {
    const { data: flatRow, error } = await this.client
      .from('flats')
      .select('*')
      .or(`id.eq.${id},name.eq.${id}`)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find flat by ID ${id} in Supabase: ${error.message}`);
    }

    if (!flatRow) {
      return null;
    }

    const { data: areaRows, error: areaErr } = await this.client
      .from('areas')
      .select('*')
      .eq('flat_id', (flatRow as Database['public']['Tables']['flats']['Row']).id);

    if (areaErr) {
      throw new Error(`Failed to load areas for flat ${id}: ${areaErr.message}`);
    }

    const { data: bedRows, error: bedErr } = await this.client
      .from('beds')
      .select('*')
      .eq('flat_id', (flatRow as Database['public']['Tables']['flats']['Row']).id);

    if (bedErr) {
      throw new Error(`Failed to load beds for flat ${id}: ${bedErr.message}`);
    }

    return AccommodationMappers.toDomain(
      flatRow as Database['public']['Tables']['flats']['Row'],
      (areaRows || []) as Database['public']['Tables']['areas']['Row'][],
      (bedRows || []) as Database['public']['Tables']['beds']['Row'][]
    );
  }

  public async save(flat: Flat): Promise<Flat> {
    const flatInsert = AccommodationMappers.toFlatInsert(flat);
    const { error: flatErr } = await this.client.from('flats').upsert(flatInsert as any);
    if (flatErr) {
      throw new Error(`Failed to upsert flat ${flat.id} in Supabase: ${flatErr.message}`);
    }

    for (const area of flat.areas) {
      const areaInsert = AccommodationMappers.toAreaInsert(area, flat.id);
      const { error: areaErr } = await this.client.from('areas').upsert(areaInsert as any);
      if (areaErr) {
        throw new Error(`Failed to upsert area ${area.id} in Supabase: ${areaErr.message}`);
      }

      for (const bed of area.beds) {
        const bedInsert = AccommodationMappers.toBedInsert(bed, area.id, flat.id);
        const { error: bedErr } = await this.client.from('beds').upsert(bedInsert as any);
        if (bedErr) {
          throw new Error(`Failed to upsert bed ${bed.id} in Supabase: ${bedErr.message}`);
        }
      }
    }

    return flat;
  }

  public async saveAll(flats: Flat[]): Promise<Flat[]> {
    for (const flat of flats) {
      await this.save(flat);
    }
    return flats;
  }

  public async delete(id: string): Promise<void> {
    const { error: bedErr } = await this.client.from('beds').delete().eq('flat_id', id);
    if (bedErr) throw new Error(`Failed to delete beds for flat ${id}: ${bedErr.message}`);

    const { error: areaErr } = await this.client.from('areas').delete().eq('flat_id', id);
    if (areaErr) throw new Error(`Failed to delete areas for flat ${id}: ${areaErr.message}`);

    const { error: flatErr } = await this.client.from('flats').delete().eq('id', id);
    if (flatErr) throw new Error(`Failed to delete flat ${id}: ${flatErr.message}`);
  }
}
