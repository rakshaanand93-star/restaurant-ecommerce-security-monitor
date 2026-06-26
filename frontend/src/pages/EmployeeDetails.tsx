import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ShieldAlert, AlertTriangle, Clock, Activity, CheckCircle, XCircle, Package, Truck, TrendingUp, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

interface UserData {
  uid: string;
  name?: string;
  email: string;
  role: string;
  company?: string;
  location?: string;
  createdAt?: any;
  isDisabled?: boolean;
}

export default function EmployeeDetails() {
  const { uid } = useParams<{ uid: string }>();
  const [employee, setEmployee] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [performance, setPerformance] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [company, setCompany] = useState<string>('');

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!uid) return;
      try {
        const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
        setCompany(activeCompany);
        
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        
        console.log(`[EmployeeDetails] User clicked View for ID: ${uid}`);
        console.log(`[EmployeeDetails] API request: GET ${backendUrl}/api/users/${uid}`);

        // 1. Fetch User from MongoDB
        const userRes = await fetch(`${backendUrl}/api/users/${uid}`);
        if (!userRes.ok) {
          throw new Error(`User not found in MongoDB for ID: ${uid}`);
        }
        const uData = await userRes.json();
        
        console.log(`[EmployeeDetails] API response:`, uData);
        
        setEmployee({
          uid: uData.firebaseUid || uData._id,
          name: uData.displayName,
          email: uData.email,
          role: uData.role,
          company: uData.company,
          location: uData.location,
          createdAt: uData.createdAt,
          isDisabled: uData.status === 'suspended' || uData.status === 'inactive'
        });

        // 2. Fetch performance data from new backend endpoint
        const perfRes = await fetch(`${backendUrl}/api/users/${uData.firebaseUid || uData._id}/performance?company=${activeCompany}`);
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformance(perfData);
        }

        // 3. Fetch Activity Logs
        const actQ = query(collection(db, 'activity_logs'), where('email', '==', uData.email), where('company', '==', activeCompany));
        const actSnap = await getDocs(actQ);
        const logs: any[] = [];
        actSnap.forEach(d => logs.push({ id: d.id, ...d.data() }));
        logs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
        setActivityLogs(logs);

      } catch (err) {
        console.error("Error fetching employee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [uid]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading comprehensive performance profile...</div>;
  if (!employee) return <div className="p-8 text-center text-red-500">Employee not found.</div>;

  let breadcrumbTitle = "Employee Profile";
  let pageTitle = "Employee Performance Dashboard";

  const isAmazon = company === "amazon";
  const isZomato = company === "zomato";

  if (isAmazon) {
    breadcrumbTitle = "Warehouse Employee Profile";
    pageTitle = "Warehouse Performance Dashboard";
  } else if (isZomato) {
    breadcrumbTitle = "Restaurant Employee Profile";
    pageTitle = "Restaurant Performance Dashboard";
  }

  const metrics = performance?.metrics || {
    totalOrders: 0, successful: 0, failed: 0, pending: 0, late: 0,
    successRate: '0.0', failureRate: '0.0', totalAlerts: 0, avgDeliveryTime: '0m'
  };

  const chartData = performance?.charts?.weeklyPerformance || [];
  const recentOrders = performance?.recentOrders || [];
  const recentAlerts = performance?.recentAlerts || [];

  const pieData = [
    { name: 'Success', value: metrics.successful, color: '#10B981' },
    { name: 'Failed', value: metrics.failed, color: '#EF4444' },
    { name: 'Pending', value: metrics.pending, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  // If no data, show a placeholder in pie chart
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1, color: '#E5E7EB' });

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-2">
            <Link to={`/${company}/dashboard`} className="hover:text-indigo-600 font-medium">Dashboard</Link> / <span>{breadcrumbTitle}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Employee Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                {employee.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{employee.name || 'Not provided'}</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${employee.isDisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {employee.isDisabled ? 'DISABLED' : 'ACTIVE'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Firebase UID</span> <span className="font-mono text-xs bg-gray-100 p-1.5 rounded mt-1 break-all">{employee.uid}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Email Address</span> <span className="break-all">{employee.email}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Assigned Role</span> <span className="uppercase font-medium text-indigo-700">{employee.role}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Location</span> <span>{employee.location || 'Not Assigned'}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Company</span> <span className="capitalize">{employee.company || 'System'}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Date Joined</span> <span>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'Unknown'}</span></div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title={isZomato ? "Total Orders Assigned" : "Total Deliveries Assigned"} 
              value={metrics.totalOrders} 
              icon={<Package className="w-5 h-5 opacity-70 mb-1" />}
              color="blue" 
            />
            <StatCard 
              title={isZomato ? "Orders Delivered Successfully" : "Successful Deliveries"} 
              value={metrics.successful} 
              icon={<CheckCircle className="w-5 h-5 opacity-70 mb-1" />}
              color="green" 
            />
            <StatCard 
              title={isZomato ? "Failed Orders" : "Failed Deliveries"} 
              value={metrics.failed} 
              icon={<XCircle className="w-5 h-5 opacity-70 mb-1" />}
              color="red" 
            />
            <StatCard 
              title="Pending" 
              value={metrics.pending} 
              icon={<Clock className="w-5 h-5 opacity-70 mb-1" />}
              color="yellow" 
            />
            <StatCard 
              title="Late Deliveries" 
              value={metrics.late} 
              icon={<AlertTriangle className="w-5 h-5 opacity-70 mb-1" />}
              color="yellow" 
            />
            <StatCard 
              title="Success Rate" 
              value={`${metrics.successRate}%`} 
              icon={<TrendingUp className="w-5 h-5 opacity-70 mb-1" />}
              color={parseFloat(metrics.successRate) >= 80 ? 'green' : 'yellow'} 
            />
            <StatCard 
              title="Failure Rate" 
              value={`${metrics.failureRate}%`} 
              icon={<TrendingUp className="w-5 h-5 opacity-70 mb-1" />}
              color={parseFloat(metrics.failureRate) > 10 ? 'red' : 'green'} 
            />
            <StatCard 
              title="Security Alerts Generated" 
              value={metrics.totalAlerts} 
              icon={<ShieldAlert className="w-5 h-5 opacity-70 mb-1" />}
              color={metrics.totalAlerts > 0 ? 'red' : 'blue'} 
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{isZomato ? "Orders Completed per Day" : "Deliveries per Day"}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.substring(5)} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" name="Successful" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" name="Failed" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Success vs Failed Ratio</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3"><Truck size={18} className="text-gray-400"/> Recent Assignments</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {recentOrders.map((order: any) => (
                  <div key={order.orderId} className="flex justify-between items-center p-3 hover:bg-gray-50 border rounded-lg">
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-900">{order.orderId}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                ))}
                {recentOrders.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No recent assignments found.</p>}
              </div>
            </div>

            {/* Login Activity Logs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3"><Activity size={18} className="text-gray-400"/> Recent Activity</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {activityLogs.slice(0, 10).map((log, i) => (
                  <div key={log.id} className="relative pl-6">
                    <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${
                      log.action.includes('SUCCESS') ? 'bg-green-500' :
                      log.action.includes('FAILED') || log.action.includes('BLOCKED') ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></span>
                    <h4 className="text-sm font-bold text-gray-900">{log.action.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-gray-500 flex justify-between items-center mt-1">
                      <span className="font-mono">{log.ipAddress}</span>
                      <span>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}</span>
                    </p>
                  </div>
                ))}
                {activityLogs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No activity found.</p>}
              </div>
            </div>
            
            {/* Security Alerts generated by this user */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3"><AlertCircle size={18} className="text-red-500"/> Security Events Generated</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentAlerts.map((alert: any) => (
                  <div key={alert._id || alert.id} className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50">
                    <h4 className="text-sm font-bold text-gray-900">{alert.action || alert.title || 'Security Event'}</h4>
                    <p className="text-xs text-gray-700 mt-1">{alert.details || alert.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-mono">{alert.ipAddress} - {new Date(alert.timestamp || alert.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {recentAlerts.length === 0 && <div className="col-span-2"><p className="text-sm text-gray-500 text-center py-4">No security events triggered by this employee.</p></div>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
const StatCard = ({ title, value, color, icon }: { title: string, value: string|number, color: 'blue'|'green'|'red'|'yellow'|'purple', icon: React.ReactNode }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
  };
  return (
    <div className={`${colors[color]} p-4 rounded-xl border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow`}>
      {icon}
      <span className="text-xs font-bold uppercase opacity-80 leading-tight h-8 flex items-center justify-center">{title}</span>
      <span className="text-2xl font-black mt-2">{value}</span>
    </div>
  );
}