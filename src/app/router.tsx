import { createBrowserRouter, Outlet } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { AccommodationWorkspacePage } from '../features/accommodation';
import { AdmissionWorkspacePage } from '../features/admission';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ElectricityPage } from '../features/electricity';
import { FinanceWorkspacePage } from '../features/finance';
import { MaintenancePage } from '../features/maintenance';
import { ReportsPage } from '../features/reports';
import { ResidentsPage, ResidentWorkspacePage } from '../features/resident';
import { SettingsPage } from '../features/settings';
import { StayWorkspacePage, StaysRegistryPage } from '../features/stay';
import { ReservationsPage, ReservationWorkspacePage } from '../features/reservation';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MainLayout>
        <Outlet />
      </MainLayout>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'residents', element: <ResidentsPage /> },
      { path: 'resident/:residentId', element: <ResidentWorkspacePage /> },
      { path: 'stays', element: <StaysRegistryPage /> },
      { path: 'stays/:stayId', element: <StayWorkspacePage /> },
      { path: 'stay/:stayId', element: <StayWorkspacePage /> },
      { path: 'accommodation', element: <AccommodationWorkspacePage /> },
      { path: 'reservations', element: <ReservationsPage /> },
      { path: 'reservations/:id', element: <ReservationWorkspacePage /> },
      { path: 'admission/from-reservation/:id', element: <AdmissionWorkspacePage /> },
      { path: 'admission/walk-in', element: <AdmissionWorkspacePage /> },
      { path: 'finance', element: <FinanceWorkspacePage /> },
      { path: 'electricity', element: <ElectricityPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
