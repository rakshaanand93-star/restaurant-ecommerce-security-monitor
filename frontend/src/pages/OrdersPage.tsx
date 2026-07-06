import { useMemo, useState, useEffect } from 'react';
import { Clock, Phone } from 'lucide-react';

const orderRows = [
  { id: '#16845', customer: 'Rahul Sharma', amount: 410, status: 'pending', date: '26 May 2026', time: '10:30 AM', items: [{name: 'Paneer Butter Masala', qty: 1}, {name: 'Butter Naan', qty: 2}], address: 'MG Road, Shivajinagar, Bengaluru, Karnataka 560001', createdAt: undefined },
  { id: '#16844', customer: 'Priya Mehta', amount: 365, status: 'pending', date: '26 May 2026', time: '10:28 AM', items: [{name: 'Veg Biryani', qty: 1}, {name: 'Raita', qty: 1}, {name: 'Coke (500ml)', qty: 1}], address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034', createdAt: undefined },
];

const getNextStatus = (current: string, isAmazon: boolean) => {
  const flow = isAmazon 
    ? ['pending', 'assigned', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed']
    : ['pending', 'accepted', 'preparing', 'ready', 'picked up', 'completed'];
  const idx = flow.indexOf(current?.toLowerCase());
  if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
  return null;
};

interface OrdersPageProps {
  isRestaurantView?: boolean;
  isAdmin?: boolean;
  restaurantId?: string;
  company?: string;
}

export default function OrdersPage({ isRestaurantView, isAdmin, restaurantId, company }: OrdersPageProps) {
  const [filter, setFilter] = useState('pending');
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const fetchOrders = async () => {
    if (!isRestaurantView && !isAdmin) return;
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      let url = `${backendUrl}/api/orders?company=${company || 'zomato'}`;
      if (restaurantId) url += `&restaurantId=${restaurantId}`;
      if (isAdmin) url += `&admin=true`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLiveOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch live orders", err);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin || company !== 'amazon') return;
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/users?company=amazon`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.filter((u: any) => u.role === 'employee'));
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
    
    // Listen for cross-tab updates instead of polling
    const bc = new BroadcastChannel('dashboard_updates');
    bc.onmessage = (event) => {
      if (event.data.type === 'ORDER_COMPLETED' || event.data.type === 'ORDER_UPDATED') {
        fetchOrders();
      }
    };
    
    return () => {
      bc.close();
    };
  }, [restaurantId, isRestaurantView, isAdmin, company]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders(); 
        const bc = new BroadcastChannel('dashboard_updates');
        bc.postMessage({ type: newStatus === 'completed' ? 'ORDER_COMPLETED' : 'ORDER_UPDATED' });
        bc.close();
        window.dispatchEvent(new Event('mongo-notification-updated'));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
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
      }
    } catch (err) {
      console.error("Failed to assign order", err);
    }
  };

  const currentData = (isRestaurantView || isAdmin)
    ? liveOrders.map(o => {
        const d = new Date(o.createdAt);
        return {
          id: o.orderId,
          customer: o.customerEmail || 'Guest',
          amount: o.amount || 0,
          status: o.status,
          date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          items: o.items || [],
          address: o.shippingAddress ? `${o.shippingAddress.street}, ${o.shippingAddress.city}` : 'Delivery Address Not Provided',
          createdAt: o.createdAt
        }
      })
    : orderRows;

  // Status mapping for tabs
  const isAmazon = company === 'amazon';
  const tabMapping = isAmazon 
    ? [
        { id: 'pending', label: 'New Orders' },
        { id: 'assigned', label: 'Assigned' },
        { id: 'accepted', label: 'Accepted' },
        { id: 'preparing', label: 'Preparing' },
        { id: 'ready', label: 'Ready' },
        { id: 'out_for_delivery', label: 'Out for Delivery' },
        { id: 'completed', label: 'Completed' }
      ]
    : [
        { id: 'pending', label: 'New Orders' },
        { id: 'accepted', label: 'Accepted' },
        { id: 'preparing', label: 'Preparing' },
        { id: 'ready', label: 'Ready' },
        { id: 'picked up', label: 'Picked Up' },
        { id: 'completed', label: 'Completed' }
      ];

  // Get counts for each status
  const counts = tabMapping.reduce((acc, tab) => {
    acc[tab.id] = currentData.filter(o => o.status?.toLowerCase() === tab.id).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredOrders = useMemo(() => {
    return currentData.filter((order) => order.status?.toLowerCase() === filter.toLowerCase());
  }, [filter, currentData]);

  const getTimeElapsed = (createdAt?: string) => {
    if (!createdAt) return '10 mins ago';
    const diff = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
    return diff < 1 ? 'Just now' : `${diff} mins ago`;
  };

  return (
    <div className="w-full pb-10">
      
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {tabMapping.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center px-5 py-2.5 rounded-full text-[15px] font-bold transition-all border ${
                isActive 
                  ? 'bg-[#E23744] text-white border-[#E23744] shadow-md shadow-red-500/20' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                isActive 
                  ? 'bg-white text-[#E23744]' 
                  : 'bg-[#FFF1F2] text-[#E23744]'
              }`}>
                {counts[tab.id] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order, idx) => {
          const nextStatus = getNextStatus(order.status, isAmazon);
          return (
            <div key={order.id + idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6 lg:gap-8">
              
              {/* Col 1: Order Info */}
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-gray-400 mb-1">Order ID</p>
                <p className="text-2xl font-black text-gray-900 mb-3">{order.id}</p>
                <p className="text-sm font-semibold text-gray-500 mb-4">{order.time} · {order.date}</p>
                <span className="inline-block px-3 py-1 bg-[#F0FDF4] text-[#16A34A] text-xs font-bold rounded-md">Online Payment</span>
              </div>

              {/* Col 2: Customer Info */}
              <div className="flex-1 min-w-[250px]">
                <p className="text-sm font-semibold text-gray-400 mb-1">Customer</p>
                <div className="flex items-center space-x-3 mb-4">
                  <p className="text-lg font-bold text-gray-900">{order.customer}</p>
                  <div className="w-7 h-7 rounded-full bg-[#FFF1F2] text-[#E23744] flex items-center justify-center">
                    <Phone size={14} />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-400 mb-1">Delivery Address</p>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed max-w-xs">{order.address}</p>
              </div>

              {/* Col 3: Items */}
              <div className="flex-[1.2] min-w-[250px]">
                <p className="text-sm font-semibold text-gray-400 mb-3">Items ({order.items.length})</p>
                <ul className="space-y-2 mb-4">
                  {order.items.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm font-semibold text-gray-800">
                      <span className="flex items-start"><span className="text-gray-400 mr-2">•</span> {item.name}</span>
                      <span className="text-gray-500 ml-4 whitespace-nowrap">x{item.qty || item.quantity || 1}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-6">
                  <span className="text-sm font-semibold text-gray-400">Total</span>
                  <span className="text-xl font-black text-[#E23744]">₹{order.amount}</span>
                </div>
              </div>

              {/* Col 4: Actions */}
              <div className="flex-1 min-w-[180px] flex flex-col items-end justify-start border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                <p className="text-sm font-bold text-[#E23744] mb-6 flex items-center">
                  <Clock size={16} className="mr-1.5" />
                  {getTimeElapsed(order.createdAt)}
                </p>
                
                <div className="w-full flex flex-col gap-3 mt-auto">
                  {isRestaurantView && nextStatus ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, nextStatus)}
                        className="w-full py-3 bg-[#E23744] text-white rounded-lg font-bold text-sm shadow-md shadow-red-500/20 hover:bg-[#D22B38] transition-colors capitalize"
                      >
                        {order.status === 'pending' ? 'Accept Order' : `Mark as ${nextStatus}`}
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                          Reject Order
                        </button>
                      )}
                    </>
                  ) : isAdmin ? (
                    <>
                      {order.status === 'pending' ? (
                        assigningOrder === order.id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <select 
                              className="w-full p-2 border rounded text-sm"
                              value={selectedEmployee}
                              onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                              <option value="">Select Employee...</option>
                              {employees.map(e => (
                                <option key={e._id} value={e.firebaseUid || e._id}>{e.email}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => handleAssignOrder(order.id)} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-bold">Save</button>
                              <button onClick={() => setAssigningOrder(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded text-sm font-bold">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setAssigningOrder(order.id)}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                          >
                            Assign to Employee
                          </button>
                        )
                      ) : (
                         <div className="w-full py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-bold text-sm text-center capitalize">
                           {order.status}
                         </div>
                      )}
                    </>
                  ) : (
                    <button className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                      Manage Order
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
        
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Clock size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No {filter} orders</h3>
            <p className="text-gray-500 font-medium">When you receive orders, they will appear here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
