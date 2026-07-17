import { createBrowserRouter, Outlet } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { AccommodationPage } from '../features/accommodation';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ElectricityPage } from '../features/electricity';
import { FinancePage } from '../features/finance';
import { MaintenancePage } from '../features/maintenance';
import { ReportsPage } from '../features/reports';
import { ResidentProfilePage, ResidentsPage } from '../features/residents';
import { SettingsPage } from '../features/settings';

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
      { path: 'residents/:id', element: <ResidentProfilePage /> },
      { path: 'accommodation', element: <AccommodationPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'electricity', element: <ElectricityPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
