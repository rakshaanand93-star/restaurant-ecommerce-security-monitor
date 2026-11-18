import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { 
  LogOut, User as UserIcon, Settings, History, Package, Grid, 
  ShoppingCart, ChevronDown, CheckCircle, Truck, PackageCheck, PlayCircle, Menu, X,
  MoreVertical, ChevronRight, Star, IndianRupee, ClipboardList, TrendingUp
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/activityLogger';

// -------------------------------------------------------------
// EXISTING GENERIC PROFILE VIEW (For non-Amazon / non-User roles)
// -------------------------------------------------------------
function GenericProfileView({ currentUser, role, handleLogout }: any) {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserIcon className="w-8 h-8 text-blue-600" />
              User Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Welcome back, {currentUser?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-1">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
              <UserIcon className="w-5 h-5 text-gray-400" />
              Profile Information
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-medium bg-gray-50 p-2 rounded">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
                <p className="font-medium bg-blue-50 text-blue-700 p-2 rounded capitalize inline-block">{role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded text-gray-600 overflow-hidden text-ellipsis">{currentUser?.uid}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
              <History className="w-5 h-5 text-gray-400" />
              Personal Activity History
            </h2>
            <div className="text-gray-600 border border-gray-100 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today, 10:00 AM</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Logged in from new device</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Success</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-3">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Settings className="w-5 h-5 text-gray-400" />
              Account Settings
            </h2>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">Notification Preferences</h3>
                <p className="text-sm text-gray-500">Manage how you receive alerts and updates.</p>
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm font-medium">
                Manage
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// NEW AMAZON WAREHOUSE USER DASHBOARD
// -------------------------------------------------------------
export default function UserDashboard() {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeOrderTab, setHomeOrderTab] = useState('New Orders');
  const [historyFilter, setHistoryFilter] = useState('Today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats for home page
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, completed: 0, tasks: 0 });

  const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
  const isAmazon = activeCompany === 'amazon';

  const handleLogout = async () => {
    if (currentUser) {
      await logActivity(currentUser.uid, currentUser.email || 'unknown', 'LOGOUT');
    }
    await logout();
  };

  useEffect(() => {
    // Redirection Logic
    if (!currentUser || !role) return;

    if (activeCompany !== 'amazon') {
      navigate(`/${activeCompany}/dashboard`);
    } else if (role !== 'user' && role !== 'USER') {
      if (role.toLowerCase() === 'admin') navigate('/amazon/dashboard');
      if (role.toLowerCase() === 'manager') navigate('/manager/dashboard');
      if (role.toLowerCase() === 'employee') navigate('/employee/dashboard');
    }
  }, [currentUser, role, activeCompany, navigate]);

  const fetchData = async (isBackground = false) => {
    if (!currentUser?.uid) return;
    if (!isBackground) setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = await currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [ordersRes, prodRes, catRes] = await Promise.all([
        fetch(`${backendUrl}/api/orders?employeeId=${currentUser.uid}&company=amazon`, { headers }),
        fetch(`${backendUrl}/api/products?employeeId=${currentUser.uid}&company=amazon`, { headers }),
        fetch(`${backendUrl}/api/categories?company=amazon`, { headers })
      ]);

      const [ordersData, prodData, catData] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : [],
        prodRes.ok ? prodRes.json() : [],
        catRes.ok ? catRes.json() : []
      ]);

      setOrders(ordersData);
      setProducts(prodData);
      setCategories(catData);

      // Compute stats
      const assigned = ordersData.filter((o: any) => o.status === 'pending' || o.status === 'assigned' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready').length;
      const inProgress = ordersData.filter((o: any) => o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready').length;
      const completed = ordersData.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length;
      
      setStats({
        assigned,
        inProgress,
        completed,
        tasks: assigned // using assigned as total active tasks
      });
      
    } catch (err) {
      console.error("Failed to fetch amazon user data", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany === 'amazon') {
      fetchData();
      
      const bc = new BroadcastChannel('dashboard_updates');
      bc.onmessage = (event) => {
        if (event.data.type === 'ORDER_COMPLETED' || event.data.type === 'ORDER_UPDATED') {
          fetchData(true);
        }
      };
      
      return () => bc.close();
    }
  }, [currentUser, role, activeCompany]);

  // If not Amazon, render old UI to avoid breaking generic dashboards
  if (activeCompany !== 'amazon') {
    return <GenericProfileView currentUser={currentUser} role={role} handleLogout={handleLogout} />;
  }

  // Handle workflow updates
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = await currentUser?.getIdToken();
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchData(); // refresh instantly
        const bc = new BroadcastChannel('dashboard_updates');
        bc.postMessage({ type: newStatus === 'completed' ? 'ORDER_COMPLETED' : 'ORDER_UPDATED' });
        bc.close();
        window.dispatchEvent(new Event('mongo-notification-updated'));
      }
    } catch (err) {
      console.error("Error updating order status", err);
    }
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Grid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'history', label: 'Order History', icon: History },
  ];

  // Map backend status to tab categories
  const getOrdersForTab = (tab: string) => {
    switch (tab) {
      case 'Pending': return orders.filter(o => o.status === 'pending' || o.status === 'assigned');
      case 'Accepted': return orders.filter(o => o.status === 'accepted');
      case 'Preparing': return orders.filter(o => o.status === 'preparing');
      case 'Ready': return orders.filter(o => o.status === 'ready');
      case 'Packed': return orders.filter(o => o.status === 'packed' || (isAmazon && (o.status === 'ready' || o.status === 'preparing')));
      case 'Out for Delivery': return orders.filter(o => o.status === 'out_for_delivery' || o.status === 'shipped');
      case 'Completed': return orders.filter(o => o.status === 'completed' || o.status === 'delivered');
      case 'Rejected': return orders.filter(o => o.status === 'cancelled' || o.status === 'rejected');
      default: return [];
    }
  };

  const currentOrdersList = getOrdersForTab(homeOrderTab);

  const dashboardTabs = isAmazon
    ? ['Pending', 'Accepted', 'Packed', 'Out for Delivery', 'Completed', 'Rejected']
    : ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Rejected'];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'pending':
      case 'assigned': return 'bg-orange-50 text-[#FF9900] border border-orange-100';
      case 'accepted': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'preparing': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'ready': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'out_for_delivery': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'delivered':
      case 'completed': return 'bg-green-50 text-green-600 border border-green-100';
      case 'rejected':
      case 'cancelled': return 'bg-red-50 text-red-600 border border-red-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending':
      case 'assigned': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out_for_delivery':
      case 'shipped': return 'Out for Delivery';
      case 'delivered':
      case 'completed': return 'Completed';
      case 'rejected':
      case 'cancelled': return 'Rejected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans flex text-[#232F3E]">
      
      {/* LEFT SIDEBAR */}
      <aside className={`w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 z-20`}>
        <nav className="flex-1 px-4 py-6 space-y-2 mt-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-[#FFF6ED] text-[#FF9900] border-l-4 border-[#FF9900]' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-[#FF9900]' : 'text-gray-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-6 bg-[#131921] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">amazon</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white"><X size={24} /></button>
             </div>
             <nav className="flex-1 px-4 py-4 space-y-2">
               {navItems.map(item => (
                 <button
                   key={item.id}
                   onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                   className={`w-full flex items-center px-4 py-3 rounded-lg font-medium ${
                     activeTab === item.id ? 'bg-[#FFF6ED] text-[#FF9900]' : 'text-gray-600'
                   }`}
                 >
                   <item.icon className="w-5 h-5 mr-3" />
                   {item.label}
                 </button>
               ))}
             </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVIGATION (DARK THEME) */}
        <header className="bg-[#131921] h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              amazon<span className="text-[#FF9900]">.in</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className="flex items-center space-x-2 px-3 py-1.5 border border-gray-600 rounded-full hover:bg-[#232F3E] transition-colors bg-transparent"
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-sm font-medium text-white">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="flex items-center space-x-3 sm:border-l sm:border-gray-600 sm:pl-4">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">
                <UserIcon size={18} />
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{currentUser?.email?.split('@')[0] || 'WarehouseUser'}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors ml-2" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {loading && orders.length === 0 ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#232F3E]">Welcome back, {currentUser?.email?.split('@')[0]}! 👋</h2>
                    <p className="text-sm text-gray-500 mt-1">Here's an overview of your store performance.</p>
                  </div>
                  
                  {/* OVERVIEW CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">Assigned Orders</p>
                        <h3 className="text-3xl font-bold">{stats.assigned}</h3>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <ShoppingCart size={28} />
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">Orders In Progress</p>
                        <h3 className="text-3xl font-bold">{stats.inProgress}</h3>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-[#FF9900] shrink-0">
                        <Package size={28} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">Completed Orders</p>
                        <h3 className="text-3xl font-bold">{stats.completed}</h3>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                        <CheckCircle size={28} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">Today's Tasks</p>
                        <h3 className="text-3xl font-bold">{stats.tasks}</h3>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                        <Grid size={28} />
                      </div>
                    </div>
                  </div>

                  {/* RECENT ORDERS TABLE (ON HOME DASHBOARD) */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#232F3E]">Recent Orders</h3>
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-sm text-blue-600 font-medium flex items-center hover:underline"
                      >
                        View all orders <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="flex space-x-6 border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar">
                      {dashboardTabs.map((tabName) => {
                         const count = getOrdersForTab(tabName).length;
                         return (
                           <button 
                             key={tabName}
                             onClick={() => setHomeOrderTab(tabName)}
                             className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                               homeOrderTab === tabName 
                               ? 'text-[#FF9900] border-b-2 border-[#FF9900]' 
                               : 'text-gray-500 hover:text-gray-800'
                             }`}
                           >
                             {tabName} {count > 0 && `(${count})`}
                           </button>
                         )
                      })}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white text-gray-800 text-xs font-bold border-b border-gray-100">
                              <th className="p-4">Order ID</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Products</th>
                              <th className="p-4 text-center">Quantity</th>
                              <th className="p-4 text-right">Amount</th>
                              <th className="p-4 text-center">Current Status</th>
                              <th className="p-4 text-center">Assigned Time</th>
                              <th className="p-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentOrdersList.length > 0 ? 
                             currentOrdersList.slice(0, 5).map((o, i) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-sm text-blue-600 font-medium">{o.orderId}</td>
                                <td className="p-4 text-sm text-gray-800 flex items-center gap-2">
                                  <UserIcon size={14} className="text-gray-400" />
                                  {o.customerEmail?.split('@')[0] || 'Guest'}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                      {o.items?.[0]?.imageUrl ? <img src={o.items[0].imageUrl} className="w-full h-full object-cover"/> : <Package size={20} className="text-gray-400" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{o.items?.[0]?.name || 'Unknown Product'}</p>
                                      <p className="text-xs text-gray-500 line-clamp-1">Category / General</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-sm text-gray-800 font-medium text-center">{o.items?.[0]?.qty || 1}</td>
                                <td className="p-4 text-sm text-gray-800 font-bold">₹{o.amount?.toLocaleString() || '0'}</td>
                                <td className="p-4 text-center">
                                  <span className={`px-3 py-1 text-[11px] rounded font-bold uppercase tracking-wider ${getStatusStyle(o.status)}`}>
                                    {getStatusLabel(o.status)}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500 text-center">
                                  {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2">
                                    {(o.status === 'pending' || o.status === 'assigned') && (
                                      <>
                                        <button onClick={() => updateOrderStatus(o.orderId, 'accepted')} className="px-4 py-1.5 bg-[#FF9900] text-white text-xs font-bold rounded hover:bg-[#F3A847] transition-colors shadow-sm">
                                          Accept
                                        </button>
                                        <button onClick={() => updateOrderStatus(o.orderId, 'rejected')} className="px-4 py-1.5 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded hover:bg-gray-50 transition-colors shadow-sm">
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    {o.status === 'accepted' && (
                                      <button onClick={() => updateOrderStatus(o.orderId, 'preparing')} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm">
                                        Mark as Preparing
                                      </button>
                                    )}
                                    {o.status === 'preparing' && (
                                      <button onClick={() => updateOrderStatus(o.orderId, 'ready')} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors shadow-sm">
                                        Mark as Ready
                                      </button>
                                    )}
                                    {o.status === 'ready' && (
                                      <button onClick={() => updateOrderStatus(o.orderId, 'out_for_delivery')} className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 transition-colors shadow-sm">
                                        Out for Delivery
                                      </button>
                                    )}
                                    {o.status === 'out_for_delivery' && (
                                      <button onClick={() => updateOrderStatus(o.orderId, 'completed')} className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors shadow-sm">
                                        Complete
                                      </button>
                                    )}
                                    {(o.status === 'delivered' || o.status === 'completed') && (
                                      <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded hover:bg-gray-50 transition-colors">
                                        View
                                      </button>
                                    )}
                                    <button className="text-gray-400 hover:text-gray-600">
                                      <MoreVertical size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )) : (
                              <tr><td colSpan={8} className="p-12 text-center text-gray-400 font-medium">No orders in this category.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 text-center border-t border-gray-100">
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-sm text-blue-600 font-medium flex items-center justify-center w-full hover:underline"
                        >
                          View all orders <ChevronDown size={16} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#232F3E]">Assigned Orders</h2>
                  </div>

                  {/* TABS */}
                  <div className="flex space-x-6 border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar">
                    {dashboardTabs.map((tabName) => {
                       const count = getOrdersForTab(tabName).length;
                       return (
                         <button 
                           key={tabName}
                           onClick={() => setHomeOrderTab(tabName)}
                           className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                             homeOrderTab === tabName 
                             ? 'text-[#FF9900] border-b-2 border-[#FF9900]' 
                             : 'text-gray-500 hover:text-gray-800'
                           }`}
                         >
                           {tabName} {count > 0 && `(${count})`}
                         </button>
                       )
                    })}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-gray-800 text-xs font-bold border-b border-gray-100">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Products</th>
                            <th className="p-4 text-center">Quantity</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Current Status</th>
                            <th className="p-4 text-center">Assigned Time</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentOrdersList.length > 0 ? 
                           currentOrdersList.map((o, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-sm text-blue-600 font-medium">{o.orderId}</td>
                              <td className="p-4 text-sm text-gray-800 flex items-center gap-2">
                                <UserIcon size={14} className="text-gray-400" />
                                {o.customerEmail?.split('@')[0] || 'Guest'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                    <Package size={20} className="text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{o.items?.[0]?.name || 'Unknown Product'}</p>
                                    <p className="text-xs text-gray-500 line-clamp-1">Category / General</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-gray-800 font-medium text-center">{o.items?.[0]?.qty || 1}</td>
                              <td className="p-4 text-sm text-gray-800 font-bold">₹{o.amount?.toLocaleString() || '0'}</td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 text-[11px] rounded font-bold uppercase tracking-wider ${getStatusStyle(o.status)}`}>
                                  {getStatusLabel(o.status)}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-500 text-center">
                                {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-end gap-2">
                                  {(o.status === 'pending' || o.status === 'assigned') && (
                                    <>
                                      <button onClick={() => updateOrderStatus(o.orderId, 'accepted')} className="px-4 py-1.5 bg-[#FF9900] text-white text-xs font-bold rounded hover:bg-[#F3A847] transition-colors shadow-sm">
                                        Accept
                                      </button>
                                      <button onClick={() => updateOrderStatus(o.orderId, 'rejected')} className="px-4 py-1.5 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded hover:bg-gray-50 transition-colors shadow-sm">
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {o.status === 'accepted' && (
                                    <button onClick={() => updateOrderStatus(o.orderId, 'preparing')} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm">
                                      Mark as Preparing
                                    </button>
                                  )}
                                  {o.status === 'preparing' && (
                                    <button onClick={() => updateOrderStatus(o.orderId, 'ready')} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors shadow-sm">
                                      Mark as Ready
                                    </button>
                                  )}
                                  {o.status === 'ready' && (
                                    <button onClick={() => updateOrderStatus(o.orderId, 'out_for_delivery')} className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 transition-colors shadow-sm">
                                      Out for Delivery
                                    </button>
                                  )}
                                  {o.status === 'out_for_delivery' && (
                                    <button onClick={() => updateOrderStatus(o.orderId, 'completed')} className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors shadow-sm">
                                      Complete
                                    </button>
                                  )}
                                  {(o.status === 'delivered' || o.status === 'completed') && (
                                    <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded hover:bg-gray-50 transition-colors">
                                      View
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={8} className="p-12 text-center text-gray-400 font-medium">No orders in this category.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#232F3E]">Products {selectedCategory && `- ${selectedCategory}`}</h2>
                    <div className="flex space-x-3">
                      {selectedCategory && (
                        <button 
                          onClick={() => setSelectedCategory(null)}
                          className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 shadow-sm"
                        >
                          Clear Filter
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 shadow-sm">
                        Filter
                      </button>
                      <button onClick={() => fetchData()} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 shadow-sm">
                        Refresh
                      </button>
                      <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 shadow-sm">
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-gray-800 text-xs font-bold border-b border-gray-100">
                            <th className="p-4">Product Image</th>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Quantity</th>
                            <th className="p-4 text-center">Availability</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.filter(p => !selectedCategory || p.category === selectedCategory).length > 0 ? 
                           products.filter(p => !selectedCategory || p.category === selectedCategory).map((p, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="p-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={24} className="text-gray-400" />
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-bold text-sm text-[#232F3E]">
                                {p.name}
                              </td>
                              <td className="p-4 text-gray-500 text-sm font-medium">{p.category}</td>
                              <td className="p-4 text-right font-bold text-[#FF9900] text-sm">{p.quantity}</td>
                              <td className="p-4 text-center">
                                <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-green-50 text-green-700 uppercase tracking-wider">{p.availability || 'In Stock'}</span>
                              </td>
                              <td className="p-4 text-gray-500 text-sm font-bold text-center uppercase tracking-wide">{p.status || 'Active'}</td>
                              <td className="p-4 text-right">
                                <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-medium">No products found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#232F3E]">Categories</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.length > 0 ? categories.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => { setSelectedCategory(c.name); setActiveTab('products'); }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</h4>
                          <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700 tracking-wider">{c.status}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm font-medium">
                          <Grid size={16} className="mr-2 text-gray-400" />
                          <span>{c.productCount} Products</span>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-3 text-center p-12 text-gray-400 font-medium bg-white rounded-xl border border-gray-100">No categories found.</div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#232F3E]">Order History</h2>
                    <div className="flex items-center space-x-3">
                      <select 
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded bg-white outline-none font-bold text-sm text-gray-700 shadow-sm"
                      >
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Custom Date">Custom Date</option>
                      </select>
                      <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 shadow-sm">
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-gray-800 text-xs font-bold border-b border-gray-100">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Products</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4">Completed Date</th>
                          <th className="p-4 text-center">Delivery Status</th>
                          <th className="p-4 text-center">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const now = new Date();
                          const filteredOrders = orders.filter(o => {
                            if (o.status !== 'delivered' && o.status !== 'completed') return false;
                            
                            const completedDate = new Date(o.deliveredAt || o.updatedAt || o.createdAt);
                            const diffDays = (now.getTime() - completedDate.getTime()) / (1000 * 3600 * 24);
                            
                            if (historyFilter === 'Today') return diffDays < 1;
                            if (historyFilter === 'This Week') return diffDays < 7;
                            if (historyFilter === 'This Month') return diffDays < 30;
                            return true;
                          });

                          return filteredOrders.length > 0 ? filteredOrders.map((o, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="p-4 font-mono text-sm text-blue-600 font-medium">{o.orderId}</td>
                            <td className="p-4 text-sm text-gray-800 font-medium flex items-center gap-2">
                              <UserIcon size={14} className="text-gray-400" />
                              {o.customerEmail?.split('@')[0] || 'Guest'}
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {o.items?.length || 1} items
                            </td>
                            <td className="p-4 text-right text-sm font-bold text-gray-800">₹{o.amount?.toLocaleString() || '0'}</td>
                            <td className="p-4 text-sm text-gray-500 font-medium">
                              {o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString() : new Date(o.updatedAt || o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-green-50 text-green-700 uppercase tracking-wider">
                                Delivered
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-blue-50 text-blue-700 uppercase tracking-wider">
                                Paid
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-medium">No completed orders found for {historyFilter}.</td></tr>
                        )})()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
          )}
        </main>
      </div>
    </div>
  );
}
