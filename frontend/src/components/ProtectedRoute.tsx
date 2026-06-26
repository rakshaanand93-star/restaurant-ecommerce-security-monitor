import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  console.log("PROTECTED ROUTE CHECK");
  console.log("CURRENT URL:", location.pathname);
  console.log("USER:", currentUser?.email);
  console.log("ROLE:", role);
  console.log("LOADING:", loading);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: 'gray' }}>Loading session...</p>
    </div>;
  }

  if (!currentUser) {
    console.log("REDIRECT REASON: No current user");
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: 'gray' }}>Fetching role...</p>
    </div>;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
    console.log("REDIRECT REASON: Role mismatch - user has " + role + " but route requires " + allowedRoles.join(', '));
    // If user is logged in but doesn't have the right role
    if (role.toLowerCase() === 'admin') {
      const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
      return <Navigate to={`/${activeCompany}/dashboard`} replace />;
    } else if (role.toLowerCase() === 'manager') {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (role.toLowerCase() === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    } else if (role.toLowerCase() === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  return <>{children}</>;
};
