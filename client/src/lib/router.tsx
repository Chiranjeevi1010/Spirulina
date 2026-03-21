import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PondsPage from '../pages/PondsPage';
import PondDetailPage from '../pages/PondDetailPage';
import WaterParametersPage from '../pages/WaterParametersPage';
import HarvestPage from '../pages/HarvestPage';
import ProductionPage from '../pages/ProductionPage';
import ChemicalsPage from '../pages/ChemicalsPage';
import DosingPage from '../pages/DosingPage';
import ExpensesPage from '../pages/ExpensesPage';
import CustomersPage from '../pages/CustomersPage';
import CustomerDetailPage from '../pages/CustomerDetailPage';
import LeadsPage from '../pages/LeadsPage';
import OrdersPage from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import InventoryPage from '../pages/InventoryPage';
import BatchDetailPage from '../pages/BatchDetailPage';
import MarketingPage from '../pages/MarketingPage';
import DemoFarmDetailPage from '../pages/DemoFarmDetailPage';
import AIAssistantPage from '../pages/AIAssistantPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import UserManagementPage from '../pages/UserManagementPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/ponds', element: <PondsPage /> },
          { path: '/ponds/:id', element: <PondDetailPage /> },
          { path: '/water-parameters', element: <WaterParametersPage /> },
          { path: '/harvest', element: <HarvestPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '/chemicals', element: <ChemicalsPage /> },
          { path: '/chemicals/dosing', element: <DosingPage /> },
          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/leads', element: <LeadsPage /> },
          { path: '/orders', element: <OrdersPage /> },
          { path: '/orders/:id', element: <OrderDetailPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/batches/:id', element: <BatchDetailPage /> },
          { path: '/marketing', element: <MarketingPage /> },
          { path: '/marketing/testimonials', element: <MarketingPage /> },
          { path: '/marketing/demo-farms/:id', element: <DemoFarmDetailPage /> },
          { path: '/ai-assistant', element: <AIAssistantPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/settings/users', element: <UserManagementPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default router;
