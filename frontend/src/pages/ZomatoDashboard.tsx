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

export default function ZomatoDashboard() {
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
  
  const company = localStorage.getItem('company') || 'zomato';

  const [restaurants, setRestaurants] = useState<number>(0);
  const [customers, setCustomers] = useState<number>(0);
  const [employees, setEmployees] = useState<number>(0);
  
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
    console.log("Dashboard component being rendered:", "ZomatoDashboard");
  }, []);

  // --- ZOMATO THEME ---
  return (
    <div className="min-h-screen bg-[#FFF8F8] font-sans text-gray-900 flex flex-col">
      {/* Zomato Top Navigation */}
      <header className="bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 lg:px-10 h-20">
          
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E23744] to-[#FF5A6E] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-500/20">Z</div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">zomato<span className="text-[#E23744]">.biz</span></span>
          </div>
          
          <nav className="hidden xl:flex items-center space-x-1 flex-1 justify-center px-8">
            {['Overview', 'Live Orders', 'Restaurants', 'Delivery Fleet', 'Customers', 'Marketing', 'Finance', 'Reports', 'Analytics', 'Settings'].map(item => (
              <Link 
                key={item} 
                to="#" 
                className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all ${item === 'Overview' ? 'bg-[#E23744] text-white shadow-md shadow-red-500/20' : 'text-gray-500 hover:bg-[#FFF8F8] hover:text-[#E23744]'}`}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-6 shrink-0">
            <NotificationCenter />
            
            <div className="w-px h-8 bg-gray-100"></div>
            
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-extrabold text-gray-900 leading-none">AdminHQ</p>
                <p className="text-xs font-bold text-gray-400 mt-1">Platform Owner</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E23744] to-pink-500 shadow-md flex items-center justify-center text-white font-bold border-2 border-white">
                <User size={20} />
              </div>
            </div>

            <button onClick={logout} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#E23744] hover:bg-red-50 rounded-full transition-colors">
              <LogOut size={20}/>
            </button>
            <button className="xl:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Zomato KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFCDD2]/30 hover:-translate-y-1.5 transition-transform duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-[#FFF8F8] rounded-2xl text-[#E23744] group-hover:bg-[#E23744] group-hover:text-white transition-colors shadow-sm"><Users size={28}/></div>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">Live</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-2">{restaurants}</h3>
              <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Restaurants</p>
            </div>

            <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFCDD2]/30 hover:-translate-y-1.5 transition-transform duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-[#FFF8F8] rounded-2xl text-[#E23744] group-hover:bg-[#E23744] group-hover:text-white transition-colors shadow-sm"><User size={28}/></div>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">Active</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-2">{customers}</h3>
              <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Customers</p>
            </div>

            <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFCDD2]/30 hover:-translate-y-1.5 transition-transform duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-[#FFF8F8] rounded-2xl text-[#E23744] group-hover:bg-[#E23744] group-hover:text-white transition-colors shadow-sm"><Users size={28}/></div>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">Staff</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-2">{employees}</h3>
              <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Employees</p>
            </div>

            <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFCDD2]/30 hover:-translate-y-1.5 transition-transform duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-[#FFF8F8] rounded-2xl text-[#E23744] group-hover:bg-[#E23744] group-hover:text-white transition-colors shadow-sm"><ShoppingBag size={28}/></div>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-xl text-sm font-bold shadow-sm">Live</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-2">{totalOrders}</h3>
              <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Live Orders</p>
            </div>
          </div>

          {/* Zomato Food Tech Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Fake Analytics Chart */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/40 border border-gray-100 w-full">
              <h2 className="text-xl font-extrabold text-gray-900 mb-8 flex items-center"><TrendingUp className="mr-3 text-[#E23744]" size={24}/> Order Velocity Trends</h2>
              <div className="h-72 flex items-end justify-between space-x-3 pt-4">
                {[40, 70, 45, 90, 65, 30, 85].map((height, i) => (
                  <div key={i} className="w-full bg-red-50 rounded-2xl relative group h-full flex items-end overflow-hidden">
                    <div style={{ height: `${height}%` }} className="w-full bg-gradient-to-t from-[#E23744] to-pink-400 rounded-2xl group-hover:opacity-80 transition-opacity duration-300 shadow-md"></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-gray-400 text-sm mt-5 font-bold uppercase tracking-wider px-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/40 border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:text-gray-900 [&_h2]:font-extrabold [&_h2]:text-xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6 pb-6 border-b border-gray-100">Platform Users & Restaurants</h2>
              <UserManagement onUserChange={handleUserChange} />
            </div>
          </div>

          {/* Full Width Zomato Tables */}
          <div className="space-y-8 pt-2">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/40 border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:hidden">
              <h2 className="text-xl font-extrabold text-[#E23744] mb-6 pb-6 border-b border-gray-100 flex items-center"><ShieldAlert className="mr-3" size={24}/> Device Quarantine</h2>
              <DeviceRequestsPanel />
            </div>
            
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full [&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-none [&_h2]:hidden">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6 pb-6 border-b border-gray-100 flex items-center"><Activity className="mr-3 text-[#E23744]" size={24}/> Live Operations Log</h2>
              <ActivityFeed key={activityRefresh} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}