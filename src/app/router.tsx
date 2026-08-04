import { createBrowserRouter, Outlet } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { AccommodationWorkspacePage } from '../features/accommodation';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ElectricityPage } from '../features/electricity';
import { FinanceWorkspacePage } from '../features/finance';
import { MaintenancePage } from '../features/maintenance';
import { ReportsPage } from '../features/reports';
import { ResidentsPage, ResidentWorkspacePage } from '../features/resident';
import { SettingsPage } from '../features/settings';
import { StayWorkspacePage } from '../features/stay';
import { ReservationWorkspace } from '../features/reservation';

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
      { path: 'stay/:stayId', element: <StayWorkspacePage /> },
      { path: 'accommodation', element: <AccommodationWorkspacePage /> },
      { path: 'reservations', element: <ReservationWorkspace /> },
      { path: 'finance', element: <FinanceWorkspacePage /> },
      { path: 'electricity', element: <ElectricityPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
