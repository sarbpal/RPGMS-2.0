import { createBrowserRouter, Outlet } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { AccommodationWorkspacePage } from '../features/accommodation';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ElectricityPage } from '../features/electricity';
import { FinancePage } from '../features/finance';
import { MaintenancePage } from '../features/maintenance';
import { ReportsPage } from '../features/reports';
import { ResidentOnboardingPage, ResidentProfilePage, ResidentsPage } from '../features/residents';
import { ResidentWorkspacePage } from '../features/resident';
import { SettingsPage } from '../features/settings';
import { StayWorkspacePage } from '../features/stay';

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
      { path: 'residents/new', element: <ResidentOnboardingPage /> },
      { path: 'residents/:id', element: <ResidentProfilePage /> },
      { path: 'resident/:residentId', element: <ResidentWorkspacePage /> },
      { path: 'stay/:stayId', element: <StayWorkspacePage /> },
      { path: 'accommodation', element: <AccommodationWorkspacePage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'electricity', element: <ElectricityPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

