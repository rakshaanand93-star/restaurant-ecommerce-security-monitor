import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserManagement } from '../components/UserManagement';
import { ActivityFeed } from '../components/ActivityFeed';
import DeviceRequestsPanel from '../components/DeviceRequestsPanel';
import { NotificationCenter } from '../components/NotificationCenter';
import { useAuth } from '../components/AuthContext';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  Menu, User, LogOut, ChevronDown, 
  TrendingUp, Users, AlertTriangle, DollarSign, 
  Package, Activity, Search, ShieldAlert, ShoppingBag, Truck, Star, Play
} from 'lucide-react';

// Import subpages
import OrdersPage from './OrdersPage';
import CustomersPage from './CustomersPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import ProductsPage from './ProductsPage';
import PricingPage from './PricingPage';
import PaymentsPage from './PaymentsPage';
import PerformancePage from './PerformancePage';

export default function AmazonDashboard() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [amazonWarehouse, setAmazonWarehouse] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activityRefresh, setActivityRefresh] = useState(0);
  
  const { logout, currentUser } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = tab?.toLowerCase() || 'overview';
  
  const company = localStorage.getItem('company') || 'amazon';

  const [restaurants, setRestaurants] = useState<number>(0);
  const [customers, setCustomers] = useState<number>(0);
  const [employees, setEmployees] = useState<number>(0);
  
  const fetchMetrics = async () => {
    try {
      const activeCompany = localStorage.getItem('company')?.toLowerCase() || 'amazon';
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/dashboard/kpis?company=${activeCompany}`);
      const data = await res.json();
      
      setTotalUsers(data.totalUsers || 0);
      setAmazonWarehouse(data.amazonWarehouse || 0);
      setRestaurants(data.restaurants || 0);
      setCustomers(data.customers || 0);
      setEmployees(data.employees || 0);
      
      setTotalOrders(data.totalOrders || 0);
      setRevenue(data.revenue || 0);
      setUnresolvedAlerts(data.unresolvedAlerts || 0);
    } catch (err) {
      console.error("Failed to fetch metrics from MongoDB", err);
    }
  };

  const handleUserChange = () => {
    fetchMetrics();
    setActivityRefresh(prev => prev + 1);
  };

  useEffect(() => {
    fetchMetrics();
    console.log("Logged in email:", currentUser?.email);
    console.log("Company from MongoDB:", company);
    console.log("Dashboard component being rendered:", "AmazonDashboard");
  }, []);

  return (
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
        {/* Amazon Top Navigation */}
        <header className="bg-[#131921] text-white sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-2xl font-bold tracking-tight">amazon <span className="text-[#FF9900] text-sm align-top font-normal tracking-normal hidden sm:inline">seller central</span></span>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-4 shrink-0">
              <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Secondary Nav Bar */}
          <div className="bg-[#232F3E] px-4 lg:px-6 flex items-center space-x-6 text-sm font-medium overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-[#131921]">
            {['Overview', 'Orders', 'Products', 'Customers', 'Pricing', 'Reports', 'Payments', 'Performance', 'Settings'].map(item => {
              const tabId = item.toLowerCase();
              const isActive = activeTab === tabId || (activeTab === 'overview' && item === 'Overview');
              return (
                <Link 
                  key={item} 
                  to={`/admin/dashboard/${tabId === 'overview' ? '' : tabId}`} 
                  className={`py-2.5 border-b-2 hover:text-white transition-colors ${isActive ? 'border-[#FF9900] text-white' : 'border-transparent text-gray-300 hover:border-gray-400'} whitespace-nowrap`}
                >
                  {item}
                </Link>
              );
            })}
            <div className="flex items-center ml-2 border-b-2 border-transparent py-2.5 text-gray-300 hover:text-white transition-colors">
              <NotificationCenter />
            </div>
            <button onClick={logout} className="py-2.5 border-b-2 border-transparent text-gray-300 hover:text-white hover:border-gray-400 transition-colors flex items-center whitespace-nowrap ml-2">
              <LogOut size={16} className="mr-1.5" /> Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {activeTab === 'overview' ? (
              <>
                {/* Amazon Hero Banner */}
                <div className="bg-[#131921] rounded-lg p-8 shadow-md border border-gray-300 relative overflow-hidden flex justify-between items-center">
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Business Performance Center</h1>
                    <p className="text-gray-300 text-sm">Monitor sales, inventory, fraud detection, user activity and platform health.</p>
                  </div>
                  <div className="hidden md:block relative z-10 opacity-20"><Activity size={80} className="text-[#FF9900]" /></div>
                  <div className="absolute right-0 top-0 w-64 h-64 bg-[#FF9900] blur-[100px] opacity-10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
                </div>

                {/* Amazon KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border-t-4 border-t-[#232F3E] shadow-sm border-x border-b border-gray-200 rounded p-6 hover:shadow-md transition-shadow">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Warehouse</p>
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-3xl font-bold text-gray-900">{amazonWarehouse}</h3>
                      <Users size={24} className="text-[#FF9900]" />
                    </div>
                    <p className="text-sm text-green-600 mt-3 flex items-center font-medium"><TrendingUp size={14} className="mr-1"/> +12.5% vs last month</p>
                  </div>

                  <div className="bg-white border-t-4 border-t-[#232F3E] shadow-sm border-x border-b border-gray-200 rounded p-6 hover:shadow-md transition-shadow">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Fulfilled Orders</p>
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-3xl font-bold text-gray-900">{totalOrders}</h3>
                      <Package size={24} className="text-[#FF9900]" />
                    </div>
                    <p className="text-sm text-green-600 mt-3 flex items-center font-medium"><TrendingUp size={14} className="mr-1"/> +8.2% vs last month</p>
                  </div>

                  <div className="bg-white border-t-4 border-t-[#232F3E] shadow-sm border-x border-b border-gray-200 rounded p-6 hover:shadow-md transition-shadow">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Security Alerts</p>
                    <div className="flex items-center justify-between mt-2">
                      <h3 className={`text-3xl font-bold ${unresolvedAlerts > 0 ? 'text-[#CC0000]' : 'text-gray-900'}`}>{unresolvedAlerts}</h3>
                      <ShieldAlert size={24} className={unresolvedAlerts > 0 ? 'text-[#CC0000]' : 'text-gray-400'} />
                    </div>
                    <p className="text-sm text-[#CC0000] mt-3 flex items-center font-medium">Requires immediate review</p>
                  </div>

                  <div className="bg-white border-t-4 border-t-[#232F3E] shadow-sm border-x border-b border-gray-200 rounded p-6 hover:shadow-md transition-shadow">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Revenue</p>
                    <div className="flex items-center justify-between mt-2">
                      <h3 className="text-3xl font-bold text-gray-900">${revenue.toFixed(2)}</h3>
                      <DollarSign size={24} className="text-[#FF9900]" />
                    </div>
                    <p className="text-sm text-green-600 mt-3 flex items-center font-medium"><TrendingUp size={14} className="mr-1"/> +24.1% vs last month</p>
                  </div>
                </div>

                {/* Amazon Enterprise Charts & Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fake Enterprise Chart for visual fidelity */}
                  <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl w-full">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center"><Activity className="mr-2 text-[#FF9900]" size={20}/> Infrastructure Load & Revenue Trends</h2>
                    <div className="h-64 flex items-end justify-between space-x-2 pt-4">
                      {[40, 70, 45, 90, 65, 30, 85].map((height, i) => (
                        <div key={i} className="w-full bg-gray-800 rounded-t relative group h-full flex items-end overflow-hidden">
                          <div style={{ height: `${height}%` }} className="w-full bg-[#FF9900] rounded-t group-hover:bg-[#FFB84D] transition-colors duration-300"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs mt-3 font-medium uppercase tracking-wider">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>

                  {/* Identity Access Management */}
                  <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:text-white [&_table]:text-gray-300 [&_th]:bg-gray-800 [&_th]:text-gray-400 [&_td]:border-gray-800 [&_input]:bg-gray-800 [&_input]:border-gray-700 [&_input]:text-white">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-4">Identity Access Management</h2>
                    <UserManagement onUserChange={handleUserChange} />
                  </div>
                </div>

                {/* Full Width Enterprise Tables */}
                <div className="space-y-6 pt-2">
                  <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:text-white [&_p]:text-gray-400 [&_div.bg-white]:bg-gray-800 [&_div.bg-white]:border-gray-700">
                    <h2 className="text-lg font-bold text-[#FF9900] mb-4 border-b border-gray-800 pb-4 flex items-center"><ShieldAlert className="mr-2" size={20}/> Device Quarantine</h2>
                    <DeviceRequestsPanel />
                  </div>
                  
                  <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl w-full overflow-hidden [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:text-white [&_p]:text-gray-400">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-4">Warehouse Audit Logs</h2>
                    <ActivityFeed key={activityRefresh} />
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                {activeTab === 'orders' && <OrdersPage />}
                {activeTab === 'customers' && <CustomersPage />}
                {activeTab === 'reports' && <ReportsPage />}
                {activeTab === 'settings' && <SettingsPage />}
                {activeTab === 'products' && <ProductsPage />}
                {activeTab === 'pricing' && <PricingPage />}
                {activeTab === 'payments' && <PaymentsPage />}
                {activeTab === 'performance' && <PerformancePage />}
              </div>
            )}

          </div>
        </main>
      </div>
    );
}