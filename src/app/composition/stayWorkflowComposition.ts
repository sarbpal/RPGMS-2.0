import { AdmissionCoordinator } from '../../features/admission/application/coordinator/AdmissionCoordinator';
import { AccommodationWorkspaceCoordinator } from '../../features/accommodation/application/coordinator/AccommodationWorkspaceCoordinator';
import { defaultAccommodationRepository } from '../../features/accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultReservationRepository } from '../../features/reservation/infrastructure/repositories/InMemoryReservationRepository';
import { defaultResidentRepository } from '../../features/resident/infrastructure/repositories/InMemoryResidentRepository';
import { ResidentWorkspaceCoordinator } from '../../features/resident/application/coordinator/ResidentWorkspaceCoordinator';
import { ResidentsListCoordinator } from '../../features/resident/application/coordinator/ResidentsListCoordinator';
import { defaultStayRepository } from '../../features/stay/infrastructure/repositories/InMemoryStayRepository';
import { StayWorkspaceCoordinator } from '../../features/stay/application/coordinator/StayWorkspaceCoordinator';
import { ReservationWorkspaceCoordinator } from '../../features/reservation/application/coordinator/ReservationWorkspaceCoordinator';
import { defaultLaundryRepository } from '../../features/laundry/infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository } from '../../features/laundry/infrastructure/repositories/InMemoryLaundryMasterRepository';
import { defaultLaundryPostingService } from '../../features/finance/services/laundryPostingService';

export const stayWorkflowComposition = {
  stayRepository: defaultStayRepository,
  accommodationRepository: defaultAccommodationRepository,
  residentRepository: defaultResidentRepository,
  reservationRepository: defaultReservationRepository,
  laundryRepository: defaultLaundryRepository,
  defaultLaundryRepository,
  laundryMasterRepository: defaultLaundryMasterRepository,
  defaultLaundryMasterRepository,
  laundryFinanceIntegrationService: defaultLaundryPostingService,
  defaultLaundryPostingService,
  stayWorkspaceCoordinator: new StayWorkspaceCoordinator(defaultStayRepository, defaultResidentRepository, defaultAccommodationRepository),
  accommodationWorkspaceCoordinator: new AccommodationWorkspaceCoordinator(defaultAccommodationRepository, defaultStayRepository, defaultResidentRepository),
  residentWorkspaceCoordinator: new ResidentWorkspaceCoordinator(defaultResidentRepository, defaultStayRepository),
  residentsListCoordinator: new ResidentsListCoordinator(defaultResidentRepository, defaultStayRepository),
  admissionCoordinator: new AdmissionCoordinator(defaultReservationRepository, defaultResidentRepository, defaultStayRepository, defaultAccommodationRepository),
  reservationWorkspaceCoordinator: new ReservationWorkspaceCoordinator(defaultReservationRepository),
};
