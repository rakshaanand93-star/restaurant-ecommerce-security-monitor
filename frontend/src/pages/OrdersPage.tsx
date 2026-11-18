import { useMemo, useState, useEffect } from 'react';
import { Clock, Phone, UserCheck, Bike, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

const normalizeStatus = (status?: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'picked up' || s === 'shipped') return 'out_for_delivery';
  if (s === 'completed') return 'delivered';
  return s;
};

const getNextStatus = (current: string) => {
  const norm = normalizeStatus(current);
  const flow = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const idx = flow.indexOf(norm);
  if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
  return null;
};

const getActionLabel = (status: string, nextStatus: string) => {
  const norm = normalizeStatus(status);
  if (norm === 'pending') return 'Accept Order';
  if (norm === 'accepted') return 'Start Preparing';
  if (norm === 'preparing') return 'Mark as Ready';
  if (norm === 'ready') return 'Out for Delivery';
  if (norm === 'out_for_delivery') return 'Mark as Delivered';
  return `Mark as ${nextStatus.replace(/_/g, ' ')}`;
};

interface OrdersPageProps {
  isRestaurantView?: boolean;
  isAdmin?: boolean;
  restaurantId?: string;
  userEmail?: string;
  company?: string;
}

export default function OrdersPage({ isRestaurantView, isAdmin, restaurantId, userEmail, company }: OrdersPageProps) {
  const [filter, setFilter] = useState('pending');
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const activeCompany = company || 'zomato';

  const fetchOrders = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      let url = `${backendUrl}/api/orders?company=${activeCompany}`;
      if (restaurantId) url += `&restaurantId=${encodeURIComponent(restaurantId)}`;
      if (userEmail) url += `&userEmail=${encodeURIComponent(userEmail)}`;
      if (isAdmin) url += `&admin=true`;
      
      let fetched: any[] = [];
      try {
        const res = await fetch(url);
        if (res.ok) {
          fetched = await res.json();
        }
      } catch (beErr) {
        console.warn("Backend unavailable, fetching from Firestore/localStorage:", beErr);
      }

      if (!fetched || fetched.length === 0) {
        try {
          const snap = await getDocs(collection(db, 'orders'));
          const firestoreOrders = snap.docs.map(d => d.data());
          const localSaved = JSON.parse(localStorage.getItem('saved_orders') || '[]');
          const combined = [...firestoreOrders];
          for (const s of localSaved) {
            if (!combined.some(o => o.orderId === s.orderId)) combined.push(s);
          }

          fetched = combined.filter((o: any) => (o.company || 'zomato').toLowerCase() === activeCompany.toLowerCase());
          
          if (!isAdmin && (restaurantId || userEmail)) {
            const emailLower = (userEmail || '').toLowerCase();
            const restTarget = emailLower.includes('restaurant1') || emailLower.includes('resturant1') ? 'REST-1001'
              : emailLower.includes('restaurant2') || emailLower.includes('resturant2') ? 'REST-1002'
              : emailLower.includes('restaurant3') || emailLower.includes('resturant3') ? 'REST-1003'
              : (restaurantId || '');

            if (restTarget) {
              fetched = fetched.filter((o: any) => 
                o.restaurantId === restTarget ||
                o.restaurantName?.toLowerCase()?.includes(restTarget.toLowerCase().replace('rest-', 'restaurant ')) ||
                (Array.isArray(o.items) && o.items.some((i: any) => i.restaurantId === restTarget))
              );
            }
          }
        } catch (fsErr) {
          console.warn("Firestore fetch error:", fsErr);
        }
      }

      setLiveOrders(fetched);
    } catch (err) {
      console.error("Failed to fetch live orders", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/users?company=${activeCompany}`);
      if (res.ok) {
        const data = await res.json();
        const staff = data.filter((u: any) => 
          u.role === 'employee' || 
          u.role === 'delivery' || 
          u.role === 'restaurant' || 
          u.role === 'warehouse' || 
          (u.email && (u.email.includes('delivery') || u.email.includes('employee') || u.email.includes('rider') || u.email.includes('driver')))
        );
        setEmployees(staff.length > 0 ? staff : data);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
    
    // Real-time Firestore sync so new orders appear immediately
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const firestoreOrders = snapshot.docs.map(d => d.data());
        const localSaved = JSON.parse(localStorage.getItem('saved_orders') || '[]');
        const combined = [...firestoreOrders];
        for (const s of localSaved) {
          if (!combined.some(o => o.orderId === s.orderId)) combined.push(s);
        }

        let filtered = combined.filter((o: any) => (o.company || 'zomato').toLowerCase() === activeCompany.toLowerCase());
        if (!isAdmin && (restaurantId || userEmail)) {
          const emailLower = (userEmail || '').toLowerCase();
          const restTarget = emailLower.includes('restaurant1') || emailLower.includes('resturant1') ? 'REST-1001'
            : emailLower.includes('restaurant2') || emailLower.includes('resturant2') ? 'REST-1002'
            : emailLower.includes('restaurant3') || emailLower.includes('resturant3') ? 'REST-1003'
            : (restaurantId || '');

          if (restTarget) {
            filtered = filtered.filter((o: any) => 
              o.restaurantId === restTarget ||
              o.restaurantName?.toLowerCase()?.includes(restTarget.toLowerCase().replace('rest-', 'restaurant ')) ||
              (Array.isArray(o.items) && o.items.some((i: any) => i.restaurantId === restTarget))
            );
          }
        }
        setLiveOrders(filtered);
      });
    } catch (e) {}

    // Cross-tab real-time updates
    const bc = new BroadcastChannel('dashboard_updates');
    bc.onmessage = (event) => {
      if (event.data.type === 'ORDER_COMPLETED' || event.data.type === 'ORDER_UPDATED') {
        fetchOrders();
      }
    };
    
    return () => {
      unsub();
      bc.close();
    };
  }, [restaurantId, userEmail, isRestaurantView, isAdmin, activeCompany]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    // 1. Direct Firestore & local state update
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
    } catch (fsErr) {
      try {
        const savedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
        const updated = savedOrders.map((o: any) => o.orderId === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem('saved_orders', JSON.stringify(updated));
      } catch (e) {}
    }

    setLiveOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));

    // 2. Also notify backend if reachable
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, employeeId: restaurantId })
      });
    } catch (err) {}

    const bc = new BroadcastChannel('dashboard_updates');
    bc.postMessage({ type: newStatus === 'delivered' || newStatus === 'completed' ? 'ORDER_COMPLETED' : 'ORDER_UPDATED' });
    bc.close();
    window.dispatchEvent(new Event('mongo-notification-updated'));
  };

  const handleAssignOrder = async (orderId: string) => {
    if (!selectedEmployee) return;
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee })
      });
      if (res.ok) {
        setAssigningOrder(null);
        setSelectedEmployee('');
        fetchOrders();
        const bc = new BroadcastChannel('dashboard_updates');
        bc.postMessage({ type: 'ORDER_UPDATED' });
        bc.close();
      }
    } catch (err) {
      console.error("Failed to assign order", err);
    }
  };

  const currentData = liveOrders.map(o => {
    const d = new Date(o.createdAt);
    return {
      id: o.orderId,
      customer: o.customerEmail || 'Guest Customer',
      amount: o.amount || 0,
      status: o.status || 'pending',
      date: isNaN(d.getTime()) ? 'Today' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: isNaN(d.getTime()) ? 'Just now' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      items: o.items || [],
      address: o.shippingAddress 
        ? (typeof o.shippingAddress === 'string' ? o.shippingAddress : [o.shippingAddress.street, o.shippingAddress.city].filter(Boolean).join(', ')) 
        : 'Indiranagar, Bengaluru, Karnataka 560038',
      employeeName: o.employeeName,
      employeeId: o.employeeId,
      createdAt: o.createdAt
    };
  });

  const tabMapping = [
    { id: 'pending', label: 'New Orders' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' }
  ];

  // Get counts for each status
  const counts = tabMapping.reduce((acc, tab) => {
    acc[tab.id] = currentData.filter(o => normalizeStatus(o.status) === tab.id).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredOrders = useMemo(() => {
    return currentData.filter((order) => normalizeStatus(order.status) === filter.toLowerCase());
  }, [filter, currentData]);

  const getTimeElapsed = (createdAt?: string) => {
    if (!createdAt) return 'Just now';
    const diff = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
    return diff < 1 ? 'Just now' : `${diff} mins ago`;
  };

  const brandPrimary = activeCompany === 'amazon' ? 'bg-[#FF9900] hover:bg-[#F3A847] text-black' : 'bg-[#E23744] hover:bg-[#D22B38] text-white';
  const brandPill = activeCompany === 'amazon' ? 'bg-[#FF9900] text-black' : 'bg-[#E23744] text-white';

  return (
    <div className="w-full pb-10">
      
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {tabMapping.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                isActive 
                  ? `${brandPill} shadow-md` 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-2 flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black ${
                isActive 
                  ? 'bg-white/90 text-black' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {counts[tab.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order, idx) => {
          const nextStatus = getNextStatus(order.status);
          const isDone = normalizeStatus(order.status) === 'delivered';
          return (
            <div key={order.id + idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6 lg:gap-8">
              
              {/* Col 1: Order Info */}
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Order ID</p>
                <p className="text-2xl font-black text-gray-900 mb-2 font-mono">{order.id}</p>
                <p className="text-xs font-semibold text-gray-500 mb-3">{order.time} · {order.date}</p>
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
                  Cash on Delivery (COD)
                </span>
                {order.employeeName && (
                  <p className="mt-3 text-xs font-bold text-blue-600 flex items-center">
                    <Bike size={14} className="mr-1" />
                    Delivery: {order.employeeName}
                  </p>
                )}
              </div>

              {/* Col 2: Customer Info */}
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Customer Details</p>
                <div className="flex items-center space-x-2 mb-3">
                  <p className="text-base font-bold text-gray-900 truncate">{order.customer}</p>
                  <div className="w-6 h-6 rounded-full bg-red-50 text-[#E23744] flex items-center justify-center shrink-0">
                    <Phone size={12} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Delivery Address</p>
                <p className="text-xs font-medium text-gray-700 leading-relaxed max-w-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {order.address}
                </p>
              </div>

              {/* Col 3: Items */}
              <div className="flex-[1.2] min-w-[250px]">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Items Ordered ({order.items.length})</p>
                <ul className="space-y-2 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                  {order.items.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between text-xs font-semibold text-gray-800">
                      <span className="flex items-start">
                        <span className="text-[#E23744] mr-2">•</span> 
                        {item.name || item.menuName}
                      </span>
                      <span className="text-gray-500 ml-3 whitespace-nowrap">
                        x{item.qty || item.quantity || 1} (₹{item.price})
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Grand Total</span>
                  <span className="text-xl font-black text-gray-900">₹{order.amount}</span>
                </div>
              </div>

              {/* Col 4: Workflow Actions */}
              <div className="flex-1 min-w-[220px] flex flex-col items-end justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                <p className="text-xs font-bold text-gray-400 mb-4 flex items-center">
                  <Clock size={14} className="mr-1 text-gray-400" />
                  {getTimeElapsed(order.createdAt)}
                </p>
                
                <div className="w-full flex flex-col gap-2 mt-auto">
                  {assigningOrder === order.id ? (
                    <div className="flex flex-col gap-2 w-full bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-900 flex items-center">
                        <Bike size={14} className="mr-1" /> Select Delivery Partner
                      </p>
                      <select 
                        className="w-full p-2 bg-white border border-blue-200 rounded text-xs font-medium"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                      >
                        <option value="">Choose partner...</option>
                        {employees.map(e => (
                          <option key={e._id} value={e.firebaseUid || e._id}>
                            {e.displayName ? `${e.displayName} (${e.email})` : e.email}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAssignOrder(order.id)} 
                          className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setAssigningOrder(null)} 
                          className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {nextStatus && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, nextStatus)}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition ${brandPrimary}`}
                    >
                      {getActionLabel(order.status, nextStatus)}
                    </button>
                  )}

                  {/* Assign Delivery Partner button */}
                  {assigningOrder !== order.id && !isDone && (
                    <button 
                      onClick={() => setAssigningOrder(order.id)}
                      className="w-full py-2 bg-white border border-blue-200 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
                    >
                      <Bike size={14} />
                      {order.employeeName ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
                    </button>
                  )}

                  {normalizeStatus(order.status) === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      className="w-full py-2 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                    >
                      Reject Order
                    </button>
                  )}

                  {isDone && (
                    <div className="w-full py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} /> Completed & Delivered
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
        
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3 text-gray-400">
              <Clock size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800 capitalize">No {filter.replace(/_/g, ' ')} orders</h3>
            <p className="text-gray-400 text-xs mt-1">Incoming customer orders will appear here automatically in real time.</p>
          </div>
        )}
      </div>

    </div>
  );
}
