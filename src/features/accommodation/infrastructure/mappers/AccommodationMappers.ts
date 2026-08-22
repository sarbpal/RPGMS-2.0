import type { Flat } from '../../domain/entities/Flat';
import type { Area } from '../../domain/entities/Area';
import type { Bed } from '../../domain/entities/Bed';
import type { BedStatus } from '../../domain/valueObjects/BedStatus';
import type { Database } from '../../../../infrastructure/supabase/database.types';

type FlatRow = Database['public']['Tables']['flats']['Row'];
type AreaRow = Database['public']['Tables']['areas']['Row'];
type BedRow = Database['public']['Tables']['beds']['Row'];

export class AccommodationMappers {
  public static toDomain(
    flatRow: FlatRow,
    areaRows: AreaRow[] = [],
    bedRows: BedRow[] = []
  ): Flat {
    const areas: Area[] = areaRows.map((areaRow) => {
      const areaBeds: Bed[] = bedRows
        .filter((b) => b.area_id === areaRow.id)
        .map((b) => ({
          id: b.id,
          name: b.name,
          status: b.status as BedStatus,
          defaultRent: Number(b.base_rent),
          defaultDeposit: Number(b.base_deposit),
        }));

      return {
        id: areaRow.id,
        name: areaRow.name,
        beds: areaBeds,
        defaultRent: areaBeds[0]?.defaultRent || 0,
        defaultDeposit: areaBeds[0]?.defaultDeposit || 0,
      };
    });

    return {
      id: flatRow.id,
      name: flatRow.name,
      floor: flatRow.floor,
      description: flatRow.notes || undefined,
      areas,
    };
  }

  public static toFlatInsert(flat: Flat): Database['public']['Tables']['flats']['Insert'] {
    return {
      id: flat.id,
      name: flat.name,
      floor: flat.floor || '1st Floor',
      status: 'AVAILABLE',
      notes: flat.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public static toAreaInsert(area: Area, flatId: string): Database['public']['Tables']['areas']['Insert'] {
    return {
      id: area.id,
      flat_id: flatId,
      name: area.name,
      type: 'Room',
      created_at: new Date().toISOString(),
    };
  }

  public static toBedInsert(bed: Bed, areaId: string, flatId: string): Database['public']['Tables']['beds']['Insert'] {
    const validStatus =
      bed.status === 'ON_NOTICE' || bed.status === 'BLOCKED'
        ? 'OCCUPIED'
        : (bed.status as 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED');

    return {
      id: bed.id,
      flat_id: flatId,
      area_id: areaId,
      name: bed.name,
      status: validStatus,
      base_rent: bed.defaultRent,
      base_deposit: bed.defaultDeposit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
