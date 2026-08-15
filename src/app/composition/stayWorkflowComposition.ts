import { AdmissionCoordinator } from '../../features/admission/application/coordinator/AdmissionCoordinator';
import { AccommodationWorkspaceCoordinator } from '../../features/accommodation/application/coordinator/AccommodationWorkspaceCoordinator';
import { InMemoryAccommodationRepository } from '../../features/accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryReservationRepository } from '../../features/reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../features/resident/infrastructure/repositories/InMemoryResidentRepository';
import { ResidentWorkspaceCoordinator } from '../../features/resident/application/coordinator/ResidentWorkspaceCoordinator';
import { InMemoryStayRepository } from '../../features/stay/infrastructure/repositories/InMemoryStayRepository';
import { StayWorkspaceCoordinator } from '../../features/stay/application/coordinator/StayWorkspaceCoordinator';
import { ReservationWorkspaceCoordinator } from '../../features/reservation/application/coordinator/ReservationWorkspaceCoordinator';

const stayRepository = new InMemoryStayRepository();
const accommodationRepository = new InMemoryAccommodationRepository();
const residentRepository = new InMemoryResidentRepository();
const reservationRepository = new InMemoryReservationRepository();

export const stayWorkflowComposition = {
  stayRepository,
  accommodationRepository,
  residentRepository,
  reservationRepository,
  stayWorkspaceCoordinator: new StayWorkspaceCoordinator(stayRepository, residentRepository, accommodationRepository),
  accommodationWorkspaceCoordinator: new AccommodationWorkspaceCoordinator(accommodationRepository, stayRepository, residentRepository),
  residentWorkspaceCoordinator: new ResidentWorkspaceCoordinator(residentRepository, stayRepository),
  admissionCoordinator: new AdmissionCoordinator(reservationRepository, residentRepository, stayRepository, accommodationRepository),
  reservationWorkspaceCoordinator: new ReservationWorkspaceCoordinator(reservationRepository),
};
