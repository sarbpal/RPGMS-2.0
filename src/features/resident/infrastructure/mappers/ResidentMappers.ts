import type { Resident, EmergencyContact } from '../../domain/entities/Resident';
import type { ResidentStatus } from '../../domain/valueObjects/ResidentStatus';
import type { Database, Json } from '../../../../infrastructure/supabase/database.types';

type ResidentRow = Database['public']['Tables']['residents']['Row'];

export class ResidentMappers {
  public static toDomain(row: ResidentRow): Resident {
    const details = (row.identification_details as Record<string, unknown>) || {};
    const emergencyRaw = row.emergency_contacts as unknown as EmergencyContact | null;

    const statusMap: Record<string, ResidentStatus> = {
      ACTIVE: 'ACTIVE',
      ON_NOTICE: 'ON_NOTICE',
      CHECKED_OUT: 'CHECKED_OUT',
      ALUMNI: 'ALUMNI',
      INACTIVE: 'CHECKED_OUT',
    };

    return {
      id: row.id,
      residentCode: row.resident_code,
      fullName: row.full_name,
      mobileNumber: row.mobile_number,
      email: row.email || undefined,
      status: statusMap[row.status] || 'ACTIVE',
      gender: details.gender as Resident['gender'],
      dateOfBirth: details.dateOfBirth as string | undefined,
      alternateMobileNumber: details.alternateMobileNumber as string | undefined,
      occupation: details.occupation as string | undefined,
      organizationName: details.organizationName as string | undefined,
      bloodGroup: details.bloodGroup as string | undefined,
      motherName: details.motherName as string | undefined,
      permanentAddress: details.permanentAddress as string | undefined,
      correspondenceAddress: details.correspondenceAddress as string | undefined,
      city: details.city as string | undefined,
      state: details.state as string | undefined,
      pinCode: details.pinCode as string | undefined,
      documents: details.documents as Resident['documents'],
      emergencyContact: emergencyRaw || undefined,
      vehicles: details.vehicles as Resident['vehicles'],
      devices: details.devices as Resident['devices'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public static toRow(resident: Resident): Database['public']['Tables']['residents']['Insert'] {
    const identificationDetails: Record<string, unknown> = {
      gender: resident.gender,
      dateOfBirth: resident.dateOfBirth,
      alternateMobileNumber: resident.alternateMobileNumber,
      occupation: resident.occupation,
      organizationName: resident.organizationName,
      bloodGroup: resident.bloodGroup,
      motherName: resident.motherName,
      permanentAddress: resident.permanentAddress,
      correspondenceAddress: resident.correspondenceAddress,
      city: resident.city,
      state: resident.state,
      pinCode: resident.pinCode,
      documents: resident.documents,
      vehicles: resident.vehicles,
      devices: resident.devices,
    };

    const statusForDb: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' =
      resident.status === 'ALUMNI'
        ? 'ALUMNI'
        : resident.status === 'CHECKED_OUT' || resident.status === 'ON_NOTICE'
        ? 'INACTIVE'
        : 'ACTIVE';

    return {
      id: resident.id,
      resident_code: resident.residentCode,
      full_name: resident.fullName,
      mobile_number: resident.mobileNumber,
      email: resident.email || null,
      status: statusForDb,
      identification_details: identificationDetails as Json,
      emergency_contacts: (resident.emergencyContact as unknown as Json) || null,
      created_at: resident.createdAt || new Date().toISOString(),
      updated_at: resident.updatedAt || new Date().toISOString(),
    };
  }
}
