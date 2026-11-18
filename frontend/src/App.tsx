import AmazonDashboard from "./pages/AmazonDashboard";
import ZomatoDashboard from "./pages/ZomatoDashboard";
import UserDashboard from "./pages/UserDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import EmployeeDetails from './pages/EmployeeDetails';
import { AnimatePresence } from "framer-motion";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import AlertsPage from "./pages/AlertsPage";
import CustomersPage from "./pages/CustomersPage";
import ReportsPage from "./pages/ReportsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import BillingPage from "./pages/BillingPage";
import SettingsPage from "./pages/SettingsPage";
import CompanyLoginPage from "./pages/CompanyLoginPage";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AdminDashboardRouter = () => {
  const company = localStorage.getItem('company')?.toLowerCase();
  return company === 'amazon' ? <AmazonDashboard /> : <ZomatoDashboard />;
};

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/company-login"
          element={<CompanyLoginPage />}
        />

        {/* Protected Routes */}
        {/* General Admin Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <AdminDashboardRouter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard/:tab" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <AdminDashboardRouter />
            </ProtectedRoute>
          } 
        />

        {/* Amazon Protected Routes */}
        <Route 
          path="/amazon/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <AmazonDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/amazon/dashboard/:tab" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <AmazonDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Zomato Protected Routes */}
        <Route 
          path="/zomato/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN', 'employee', 'EMPLOYEE', 'restaurant', 'RESTAURANT']}>
              <ZomatoDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/zomato/dashboard/:tab" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN', 'employee', 'EMPLOYEE', 'restaurant', 'RESTAURANT']}>
              <ZomatoDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['manager', 'MANAGER']}>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/employee/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['employee', 'EMPLOYEE']}>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/customer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['customer', 'CUSTOMER']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/user-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user', 'USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Still keeping this if admin needs it, wrapped with admin protection */}
        <Route 
          path="/employee-details/:uid" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <EmployeeDetails />
            </ProtectedRoute>
          } 
        />

        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

export default App;