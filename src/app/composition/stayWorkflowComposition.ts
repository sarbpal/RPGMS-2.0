import { AdmissionCoordinator } from '../../features/admission/application/coordinator/AdmissionCoordinator';
import { AccommodationWorkspaceCoordinator } from '../../features/accommodation/application/coordinator/AccommodationWorkspaceCoordinator';
import { ResidentWorkspaceCoordinator } from '../../features/resident/application/coordinator/ResidentWorkspaceCoordinator';
import { ResidentsListCoordinator } from '../../features/resident/application/coordinator/ResidentsListCoordinator';
import { StayWorkspaceCoordinator } from '../../features/stay/application/coordinator/StayWorkspaceCoordinator';
import { ReservationWorkspaceCoordinator } from '../../features/reservation/application/coordinator/ReservationWorkspaceCoordinator';
import { defaultLaundryRepository } from '../../features/laundry/infrastructure/repositories/InMemoryLaundryRepository';
import { defaultLaundryMasterRepository } from '../../features/laundry/infrastructure/repositories/InMemoryLaundryMasterRepository';
import { defaultLaundryPostingService } from '../../features/finance/services/laundryPostingService';
import { defaultLaundryWorkspaceCoordinator } from '../../features/laundry/application/coordinator/LaundryWorkspaceCoordinator';
import { repositoryRegistry } from '../../infrastructure/repositoryFactory';

import { balanceEngine as defaultBalanceEngine } from '../../features/finance/services/balanceEngine';
import { defaultBillingService } from '../../features/finance/services/billingService';
import { paymentService as defaultPaymentService } from '../../features/finance/services/paymentService';

export const stayWorkflowComposition = {
  stayRepository: repositoryRegistry.stayRepository,
  accommodationRepository: repositoryRegistry.accommodationRepository,
  residentRepository: repositoryRegistry.residentRepository,
  reservationRepository: repositoryRegistry.reservationRepository,
  financeRepository: repositoryRegistry.financeRepository,
  laundryRepository: defaultLaundryRepository,
  defaultLaundryRepository,
  laundryMasterRepository: defaultLaundryMasterRepository,
  defaultLaundryMasterRepository,
  laundryFinanceIntegrationService: defaultLaundryPostingService,
  defaultLaundryPostingService,
  laundryWorkspaceCoordinator: defaultLaundryWorkspaceCoordinator,
  defaultLaundryWorkspaceCoordinator,
  stayWorkspaceCoordinator: new StayWorkspaceCoordinator(
    repositoryRegistry.stayRepository,
    repositoryRegistry.residentRepository,
    repositoryRegistry.accommodationRepository,
    defaultBalanceEngine,
    defaultBillingService,
    defaultPaymentService
  ),
  accommodationWorkspaceCoordinator: new AccommodationWorkspaceCoordinator(
    repositoryRegistry.accommodationRepository,
    repositoryRegistry.stayRepository,
    repositoryRegistry.residentRepository
  ),
  residentWorkspaceCoordinator: new ResidentWorkspaceCoordinator(
    repositoryRegistry.residentRepository,
    repositoryRegistry.stayRepository
  ),
  residentsListCoordinator: new ResidentsListCoordinator(
    repositoryRegistry.residentRepository,
    repositoryRegistry.stayRepository
  ),
  admissionCoordinator: new AdmissionCoordinator(
    repositoryRegistry.reservationRepository,
    repositoryRegistry.residentRepository,
    repositoryRegistry.stayRepository,
    repositoryRegistry.accommodationRepository
  ),
  reservationWorkspaceCoordinator: new ReservationWorkspaceCoordinator(
    repositoryRegistry.reservationRepository
  ),
};
