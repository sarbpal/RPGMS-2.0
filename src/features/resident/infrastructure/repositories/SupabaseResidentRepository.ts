import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { ResidentMappers } from '../mappers/ResidentMappers';

export class SupabaseResidentRepository implements ResidentRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  public async getById(id: string): Promise<Resident | null> {
    const { data, error } = await this.client
      .from('residents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }
    return ResidentMappers.toDomain(data as Database['public']['Tables']['residents']['Row']);
  }

  public async getAll(): Promise<Resident[]> {
    const { data, error } = await this.client
      .from('residents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return (data as Database['public']['Tables']['residents']['Row'][]).map(ResidentMappers.toDomain);
  }

  public async search(query: string): Promise<Resident[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return this.getAll();
    }

    const { data, error } = await this.client
      .from('residents')
      .select('*')
      .or(
        `full_name.ilike.%${cleanQuery}%,mobile_number.ilike.%${cleanQuery}%,resident_code.ilike.%${cleanQuery}%`
      );

    if (error || !data) {
      return [];
    }
    return (data as Database['public']['Tables']['residents']['Row'][]).map(ResidentMappers.toDomain);
  }

  public async save(resident: Resident): Promise<Resident> {
    const row = ResidentMappers.toRow(resident);
    await this.client.from('residents').upsert(row as any);
    return resident;
  }

  public async update(resident: Resident): Promise<Resident> {
    return this.save(resident);
  }

  public async delete(id: string): Promise<void> {
    await this.client.from('residents').delete().eq('id', id);
  }

  public getByIdSync(_id: string): Resident | null {
    return null;
  }

  public getAllSync(): Resident[] {
    return [];
  }
}
