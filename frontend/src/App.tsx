import AmazonDashboard from "./pages/AmazonDashboard";
import ZomatoDashboard from "./pages/ZomatoDashboard";
import UserDashboard from "./pages/UserDashboard";
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
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
              <ZomatoDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/zomato/dashboard/:tab" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
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
              <UserDashboard />
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