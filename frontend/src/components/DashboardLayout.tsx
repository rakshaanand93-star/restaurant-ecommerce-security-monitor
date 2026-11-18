import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ChevronDown, User, LogOut, Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from './AuthContext';

interface LayoutProps {
  children: ReactNode;
  userRole?: 'Admin' | 'User';
}

export default function DashboardLayout({ children, userRole = 'Admin' }: LayoutProps) {
  const [showEmployeeMenu, setShowEmployeeMenu] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const activeCompany = localStorage.getItem('company')?.toLowerCase() || 'zomato';
  const dashboardPath = userRole === 'Admin' ? `/${activeCompany}/dashboard` : "/user-dashboard";

  const navItems = [
    { title: "Dashboard", path: dashboardPath },
    { title: "Fraud Alerts", path: "/app/alerts" },
    { title: "Orders", path: "/app/orders" },
    // Employee Monitoring is handled separately
    { title: "Reports & Analytics", path: "/app/reports" },
    { title: "Integrations", path: "/app/integrations" },
    { title: "Settings", path: "/app/settings" },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] font-sans text-[#111827]">
      {/* Top Mega Navigation Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href="/"}>
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#E03C42] to-[#BD1F25] flex items-center justify-center text-white shadow-md">
              <Shield size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SecureGuard<span className="text-[#E03C42]">AI</span></span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.slice(0, 3).map(item => (
              <Link 
                key={item.title} 
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === item.path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.title}
              </Link>
            ))}

            {/* Mega Dropdown: Employee Monitoring */}
            <div 
              className="relative"
              onMouseEnter={() => setShowEmployeeMenu(true)}
              onMouseLeave={() => setShowEmployeeMenu(false)}
            >
              <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                showEmployeeMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                Employee Monitoring
                <ChevronDown size={14} className={`transition-transform duration-200 ${showEmployeeMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Panel */}
              {showEmployeeMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 pt-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <Link to={dashboardPath} className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">Employees</Link>
                    <Link to="/app/security-audit" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">Security Audit</Link>
                    <Link to="/app/activity-logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">Activity Logs</Link>
                    <Link to="/app/login-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">Login History</Link>
                    <Link to="/app/risk-analysis" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">Risk Analysis</Link>
                  </div>
                </div>
              )}
            </div>

            {navItems.slice(3).map(item => (
              <Link 
                key={item.title} 
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === item.path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="hidden md:block text-sm text-right mr-2">
                <p className="font-semibold text-gray-900 leading-none mb-1 capitalize">{userRole}</p>
                <p className="text-xs text-gray-500 leading-none">System Owner</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shadow-md cursor-pointer">
                <User size={14} />
              </div>
              <button 
                onClick={logout}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}