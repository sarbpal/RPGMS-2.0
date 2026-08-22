import { getPersistenceMode } from './supabase/config';
import type { AccommodationRepository } from '../features/accommodation/domain/interfaces/AccommodationRepository';
import {
  defaultAccommodationRepository,
  SupabaseAccommodationRepository,
} from '../features/accommodation/infrastructure';
import type { ResidentRepository } from '../features/resident/domain/interfaces/ResidentRepository';
import {
  defaultResidentRepository,
  SupabaseResidentRepository,
} from '../features/resident/infrastructure';
import type { StayRepository } from '../features/stay/domain/interfaces/StayRepository';
import {
  defaultStayRepository,
  SupabaseStayRepository,
} from '../features/stay/infrastructure';
import type { FinanceRepository } from '../features/finance/domain/interfaces/FinanceRepository';
import {
  defaultFinanceRepository,
  SupabaseFinanceRepository,
} from '../features/finance/infrastructure';
import type { ReservationRepository } from '../features/reservation/domain/interfaces/ReservationRepository';
import {
  defaultReservationRepository,
  SupabaseReservationRepository,
} from '../features/reservation/infrastructure';

export interface RepositoryRegistry {
  accommodationRepository: AccommodationRepository;
  residentRepository: ResidentRepository;
  reservationRepository: ReservationRepository;
  stayRepository: StayRepository;
  financeRepository: FinanceRepository;
}

export function createRepositoryRegistry(): RepositoryRegistry {
  const mode = getPersistenceMode();

  if (mode === 'supabase') {
    return {
      accommodationRepository: new SupabaseAccommodationRepository(),
      residentRepository: new SupabaseResidentRepository(),
      reservationRepository: new SupabaseReservationRepository(),
      stayRepository: new SupabaseStayRepository(),
      financeRepository: new SupabaseFinanceRepository(),
    };
  }

  return {
    accommodationRepository: defaultAccommodationRepository,
    residentRepository: defaultResidentRepository,
    reservationRepository: defaultReservationRepository,
    stayRepository: defaultStayRepository,
    financeRepository: defaultFinanceRepository,
  };
}

export const repositoryRegistry = createRepositoryRegistry();
