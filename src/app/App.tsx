import { MainLayout } from '../components/layout/MainLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';

function App() {
  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
}

export default App;
