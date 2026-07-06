import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserManagement } from '../components/UserManagement';
import { ActivityFeed } from '../components/ActivityFeed';
import DeviceRequestsPanel from '../components/DeviceRequestsPanel';
import { SettingsModal } from '../components/SettingsModal';
import { NotificationCenter } from '../components/NotificationCenter';

import { useAuth } from '../components/AuthContext';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  Menu, User, LogOut, ChevronDown, 
  TrendingUp, Users, AlertTriangle, DollarSign, 
  Package, Activity, Search, ShieldAlert, ShoppingBag, Truck, Star, Play,
  Settings, Bell, MessageSquare, Info, HelpCircle, BookOpen, ExternalLink, MessageCircle, BarChart3, Tag, Briefcase, Zap, Store
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

export default function ZomatoDashboard() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [amazonWarehouse, setAmazonWarehouse] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [restaurantName, setRestaurantName] = useState<string>('Restaurant');
  
  const { logout, currentUser, role } = useAuth();
  const isAdmin = role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
  
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = tab?.toLowerCase() || 'orders';
  
  const company = localStorage.getItem('company') || 'zomato';

  const [restaurants, setRestaurants] = useState<number>(0);
  const [customers, setCustomers] = useState<number>(0);
  const [employees, setEmployees] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const fetchMetrics = async () => {
    try {
      const activeCompany = localStorage.getItem('company')?.toLowerCase() || 'zomato';
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
      setWeeklyData(data.weeklyOrders || []);
    } catch (err) {
      console.error("Failed to fetch metrics from MongoDB", err);
    }
  };

  const handleUserChange = () => {
    fetchMetrics();
    setActivityRefresh(prev => prev + 1);
  };

  const fetchRestaurantProfile = () => {
    if (currentUser?.email && !isAdmin) {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${backendUrl}/api/users/by-email/${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.displayName) {
            setRestaurantName(data.displayName);
          }
        })
        .catch(err => console.error("Failed to fetch restaurant profile", err));
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchRestaurantProfile();
    
    // Listen for cross-tab updates instead of polling
    const bc = new BroadcastChannel('dashboard_updates');
    bc.onmessage = (event) => {
      if (event.data.type === 'ORDER_COMPLETED' || event.data.type === 'ORDER_UPDATED') {
        fetchMetrics();
      }
    };
    
    return () => {
      bc.close();
    };
  }, [currentUser, isAdmin]);

  const restaurantMenuItems = [
    { name: 'Orders', icon: Package, id: 'orders' },
    { name: 'Menu', icon: Menu, id: 'menu' },
    { name: 'Order history', icon: Truck, id: 'history' },
    { name: 'Reporting', icon: BarChart3, id: 'reporting' },
    { name: 'Offers', icon: Tag, id: 'offers' },
    { name: 'Hyperpure', icon: ShoppingBag, id: 'hyperpure' },
    { name: 'Ads', icon: TrendingUp, id: 'ads' },
    { name: 'Finance', icon: Briefcase, id: 'finance', hasSub: true },
    { name: 'Outlet info', icon: Store, id: 'outlet' },
    { name: 'Customer complaints', icon: AlertTriangle, id: 'complaints' },
    { name: 'Reviews', icon: Star, id: 'reviews' },
    { name: 'Help centre', icon: HelpCircle, id: 'help' },
    { name: 'Learning centre', icon: BookOpen, id: 'learning' },
    { name: 'Expansion hub', icon: Zap, id: 'expansion' }
  ];

  const adminMenuItems = [
    { name: 'Overview', icon: Activity, id: 'overview' },
    { name: 'Live Orders', icon: Package, id: 'orders' },
    { name: 'Restaurants', icon: Store, id: 'restaurants' },
    { name: 'Delivery Fleet', icon: Truck, id: 'delivery' },
    { name: 'Customers', icon: Users, id: 'customers' },
    { name: 'Marketing', icon: TrendingUp, id: 'marketing' },
    { name: 'Finance', icon: Briefcase, id: 'finance' },
    { name: 'Reports', icon: BarChart3, id: 'reports' },
    { name: 'Analytics', icon: Activity, id: 'analytics' },
    { name: 'Settings', icon: Settings, id: 'settings' }
  ];

  const menuItems = isAdmin ? adminMenuItems : restaurantMenuItems;

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-gray-900 flex">
      {/* LEFT SIDEBAR (Only for Restaurant View) */}
      {!isAdmin && (
        <aside className={`w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 transition-all z-20`}>
          <div className="p-6 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-black italic tracking-tighter text-[#E23744]">zomato</span>
            </div>
          </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map(item => {
            const isActive = activeTab === item.id || (!activeTab && item.id === (isAdmin ? 'overview' : 'orders'));
            return (
              <Link 
                key={item.name} 
                to={`/zomato/dashboard/${item.id}`} 
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-[15px] transition-all ${
                  isActive 
                    ? 'bg-[#FFF1F2] text-[#E23744]' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon size={18} className={`mr-3 ${isActive ? 'text-[#E23744]' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {(item as any).hasSub && <ChevronDown size={16} className={isActive ? 'text-[#E23744]' : 'text-gray-400'} />}
              </Link>
            )
          })}
          </nav>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVIGATION */}
        <header className="bg-transparent h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 pt-2">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
            <span className="text-2xl font-black italic tracking-tighter text-[#E23744] ml-2">zomato</span>
          </div>

          {/* Logo and Nav for Admin */}
          {isAdmin ? (
            <div className="flex-1 flex items-center h-full">
              <div className="flex items-center space-x-2 mr-8">
                <span className="text-3xl font-black italic tracking-tighter text-[#E23744] hidden md:block">zomato</span>
              </div>
              <nav className="hidden xl:flex items-center space-x-1 flex-1">
                {adminMenuItems.map(item => {
                  const isActive = activeTab === item.id || (!activeTab && item.id === 'overview');
                  return (
                    <Link 
                      key={item.name} 
                      to={`/zomato/dashboard/${item.id}`} 
                      className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
                        isActive 
                          ? 'bg-[#E23744] text-white shadow-md shadow-red-500/20' 
                          : 'text-gray-500 hover:bg-[#FFF8F8] hover:text-[#E23744]'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : (
            <div className="hidden md:block">
              {/* Empty space for left side of topnav since sidebar has logo */}
            </div>
          )}

          <div className="flex items-center space-x-5 shrink-0">
            {!isAdmin && (
              <>
                {/* Blue Icon */}
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow-sm">
                  <Star size={16} fill="currentColor" />
                </div>
                
                {/* Settings */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Settings size={20} />
                </button>

                {/* Share Feedback */}
                <button className="text-[14px] font-semibold text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 hidden sm:block">
                  Share feedback
                </button>

                {/* Online Status Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-full bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                </div>
              </>
            )}

            {/* Notifications */}
            {isAdmin && <NotificationCenter />}

            {/* Restaurant Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-1 py-1 pr-3 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E23744] to-pink-500 flex items-center justify-center text-white">
                  <Store size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                  {isAdmin ? 'AdminHQ' : restaurantName}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Select Restaurant</div>
                  <button className="w-full text-left px-4 py-2 text-sm font-semibold text-[#E23744] bg-[#FFF1F2] flex justify-between items-center">
                    {isAdmin ? 'AdminHQ' : restaurantName}
                    <span className="text-[#E23744]">✓</span>
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm font-semibold text-[#E23744] border-t border-gray-100 hover:bg-gray-50 flex items-center mt-2 transition-colors">
                    <span className="text-lg mr-2 font-light">+</span> Add New Restaurant
                  </button>
                  <div className="px-4 py-2 border-t border-gray-100 mt-1">
                    <button onClick={logout} className="w-full text-left text-sm font-semibold text-gray-600 hover:text-[#E23744] flex items-center">
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 pt-0">
          {isAdmin ? (
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Admin UI remains unchanged functionally, just visually shifted */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFF1F2] rounded-xl text-[#E23744]"><Store size={24}/></div>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{restaurants}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase">Restaurants</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFF1F2] rounded-xl text-[#E23744]"><User size={24}/></div>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{customers}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase">Customers</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFF1F2] rounded-xl text-[#E23744]"><Users size={24}/></div>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{employees}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase">Staff</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#FFF1F2] rounded-xl text-[#E23744]"><ShoppingBag size={24}/></div>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{totalOrders}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase">Live Orders</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center"><TrendingUp className="mr-2 text-[#E23744]" size={20}/> Order Trends</h2>
                  <div className="h-64 flex items-end justify-between space-x-2 pt-4">
                    {weeklyData.length > 0 ? weeklyData.map((dayData, i) => {
                      const maxOrders = Math.max(...weeklyData.map(d => d.orders), 1);
                      const height = (dayData.orders / maxOrders) * 100;
                      return (
                        <div key={i} title={`Orders: ${dayData.orders} | Revenue: ₹${dayData.revenue}`} className="w-full bg-red-50 rounded-lg relative group h-full flex items-end overflow-hidden cursor-pointer">
                          <div style={{ height: `${Math.max(height, 5)}%` }} className="w-full bg-gradient-to-t from-[#E23744] to-pink-400 rounded-lg group-hover:opacity-80 transition-opacity duration-300"></div>
                        </div>
                      )
                    }) : [40, 70, 45, 90, 65, 30, 85].map((height, i) => (
                      <div key={i} className="w-full bg-red-50 rounded-lg relative group h-full flex items-end overflow-hidden">
                        <div style={{ height: `${height}%` }} className="w-full bg-gradient-to-t from-[#E23744] to-pink-400 rounded-lg group-hover:opacity-80 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs mt-4 font-bold uppercase">
                    {weeklyData.length > 0 
                      ? weeklyData.map((d, i) => <span key={i}>{d.day}</span>)
                      : <><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></>
                    }
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-4 [&_h2]:pb-4 [&_h2]:border-b [&_h2]:border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">User Management</h2>
                  <UserManagement onUserChange={handleUserChange} />
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:hidden">
                  <h2 className="text-lg font-bold text-[#E23744] mb-4 pb-4 border-b border-gray-100 flex items-center"><ShieldAlert className="mr-2" size={20}/> Device Quarantine</h2>
                  <DeviceRequestsPanel />
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:hidden">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center"><Activity className="mr-2 text-[#E23744]" size={20}/> Operations Log</h2>
                  <ActivityFeed key={activityRefresh} />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto">
              <OrdersPage isRestaurantView={true} restaurantId={currentUser?.uid} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center space-x-2 mb-8">
              <span className="text-3xl font-black italic tracking-tighter text-[#E23744]">zomato</span>
            </div>
            <nav className="space-y-1">
              {menuItems.map(item => {
                const isActive = activeTab === item.id || (!activeTab && item.id === (isAdmin ? 'overview' : 'orders'));
                return (
                  <Link 
                    key={item.name} 
                    to={`/zomato/dashboard/${item.id}`} 
                    className={`flex items-center px-4 py-3 rounded-xl font-semibold text-[15px] ${
                      isActive ? 'bg-[#FFF1F2] text-[#E23744]' : 'text-gray-600'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={18} className={`mr-3 ${isActive ? 'text-[#E23744]' : 'text-gray-400'}`} />
                    {item.name}
                    {(item as any).hasSub && <ChevronDown size={16} className={`ml-auto ${isActive ? 'text-[#E23744]' : 'text-gray-400'}`} />}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUser={currentUser}
        onUpdateSuccess={() => {
          fetchRestaurantProfile();
        }}
      />
    </div>
  );
}