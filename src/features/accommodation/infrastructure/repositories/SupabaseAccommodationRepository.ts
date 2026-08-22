import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import type { Flat } from '../../domain/entities/Flat';
import type { AccommodationRepository } from '../../domain/interfaces/AccommodationRepository';
import { AccommodationMappers } from '../mappers/AccommodationMappers';

export class SupabaseAccommodationRepository implements AccommodationRepository {
  private client: SupabaseClient<Database>;
  private cache: Flat[] = [];

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  public findAll(): Flat[] {
    return this.cache;
  }

  public findById(id: string): Flat | null {
    const flat = this.cache.find((f) => f.id === id || f.name === id);
    return flat ? JSON.parse(JSON.stringify(flat)) : null;
  }

  public save(flat: Flat): Flat {
    const idx = this.cache.findIndex((f) => f.id === flat.id);
    if (idx >= 0) {
      this.cache[idx] = JSON.parse(JSON.stringify(flat));
    } else {
      this.cache.push(JSON.parse(JSON.stringify(flat)));
    }
    this.saveAsync(flat).catch(() => {});
    return flat;
  }

  public saveAll(flats: Flat[]): Flat[] {
    for (const flat of flats) {
      this.save(flat);
    }
    return flats;
  }

  public delete(id: string): void {
    this.cache = this.cache.filter((f) => f.id !== id);
    this.deleteAsync(id).catch(() => {});
  }

  // --- Async Methods ---

  public async findAllAsync(): Promise<Flat[]> {
    const { data: flatRows, error: flatErr } = await this.client
      .from('flats')
      .select('*')
      .order('name');

    if (flatErr || !flatRows) {
      return [];
    }

    const { data: areaRows } = await this.client.from('areas').select('*');
    const { data: bedRows } = await this.client.from('beds').select('*');

    const loaded = (flatRows as Database['public']['Tables']['flats']['Row'][]).map((flatRow) =>
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

    this.cache = loaded;
    return loaded;
  }

  public async findByIdAsync(id: string): Promise<Flat | null> {
    const { data: flatRow, error } = await this.client
      .from('flats')
      .select('*')
      .or(`id.eq.${id},name.eq.${id}`)
      .single();

    if (error || !flatRow) {
      return null;
    }

    const { data: areaRows } = await this.client
      .from('areas')
      .select('*')
      .eq('flat_id', (flatRow as Database['public']['Tables']['flats']['Row']).id);

    const { data: bedRows } = await this.client
      .from('beds')
      .select('*')
      .eq('flat_id', (flatRow as Database['public']['Tables']['flats']['Row']).id);

    return AccommodationMappers.toDomain(
      flatRow as Database['public']['Tables']['flats']['Row'],
      (areaRows || []) as Database['public']['Tables']['areas']['Row'][],
      (bedRows || []) as Database['public']['Tables']['beds']['Row'][]
    );
  }

  public async saveAsync(flat: Flat): Promise<Flat> {
    const flatInsert = AccommodationMappers.toFlatInsert(flat);
    await this.client.from('flats').upsert(flatInsert as any);

    for (const area of flat.areas) {
      const areaInsert = AccommodationMappers.toAreaInsert(area, flat.id);
      await this.client.from('areas').upsert(areaInsert as any);

      for (const bed of area.beds) {
        const bedInsert = AccommodationMappers.toBedInsert(bed, area.id, flat.id);
        await this.client.from('beds').upsert(bedInsert as any);
      }
    }

    return flat;
  }

  public async deleteAsync(id: string): Promise<void> {
    await this.client.from('beds').delete().eq('flat_id', id);
    await this.client.from('areas').delete().eq('flat_id', id);
    await this.client.from('flats').delete().eq('id', id);
  }
}
