import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  uid: string;
  email: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: any;
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersRoleMap, setUsersRoleMap] = useState<Record<string, string>>({});
  const rowsPerPage = 10;

  const fetchLogsFromMongo = async () => {
    try {
      console.log("Loading login history from MongoDB");
      const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/login-history?company=${activeCompany}`);
      const data = await res.json();
      
      console.log(`Records returned from MongoDB: ${data.length}`);
      
      const mappedLogs = data.map((d: any) => ({
        id: d._id || d.id || `unknown-${Math.random()}`,
        uid: d.userId || d.uid || '-',
        email: d.userEmail || d.email || '-',
        action: d.action || '-',
        details: d.details || '-',
        ipAddress: d.ipAddress || '-',
        timestamp: d.createdAt || d.timestamp || ''
      }));
      setLogs(mappedLogs);
    } catch (err) {
      console.error("Failed to load logs from MongoDB", err);
    }
  };

  useEffect(() => {
    const fetchUsersMap = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
        const res = await fetch(`${backendUrl}/api/users?company=${activeCompany}`);
        const users = await res.json();
        
        const map: Record<string, string> = {};
        users.forEach((data: any) => {
          if (data.email && data.role) {
            map[data.email.toLowerCase()] = data.role.toLowerCase();
          }
        });
        setUsersRoleMap(map);
      } catch (err) {
        console.error('Failed to fetch users map for ActivityFeed', err);
      }
    };
    fetchUsersMap();
    fetchLogsFromMongo();
  }, []);

  const clearedAtRef = React.useRef<number>(0);

  const handleClearHistory = async () => {
    const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
    if (!window.confirm("Are you sure you want to delete all login history for this company?")) return;

    console.log(`Before delete: ${logs.length} records`);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/login-history/clear/${activeCompany}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (res.ok) {
        // Clear local state
        setLogs([]);
        clearedAtRef.current = Date.now();
        
        console.log(`MongoDB deleted: ${data.deletedMongo}`);
        
        // Re-fetch from backend to verify
        const fetchRes = await fetch(`${backendUrl}/api/login-history?company=${activeCompany}`);
        const refetchData = await fetchRes.json();
        
        console.log(`Refetch completed`);
        console.log(`Records rendered after refresh: ${refetchData.length}`);
        
        alert("Login history cleared successfully.");
      } else {
        alert("Failed to clear login history.");
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
      alert("Failed to clear login history.");
    }
  };

  const getStatusBadge = (action?: string) => {
    const value = (action || "").toLowerCase();
    if (value.includes('success')) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Success</span>;
    if (value.includes('approved')) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Success</span>;
    if (value.includes('failed') || value.includes('suspicious') || value.includes('rejected')) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">Warning</span>;
    return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">Info</span>;
  };

  const getActionLabel = (action?: string) => {
    const val = action || "-";
    switch (val) {
      case 'LOGIN_SUCCESS': return 'Logged In';
      case 'LOGIN_FAILED': return 'Login Failed';
      case 'LOGOUT': return 'Logged Out';
      case 'SUSPICIOUS_LOGIN': return 'Suspicious Login';
      case 'ADMIN_APPROVED': return 'Admin Approved';
      case 'ADMIN_REJECTED': return 'Admin Rejected';
      default: return val;
    }
  };

  let filtered = logs;

  // IMPORTANT: Filter out admin, superadmin, platform_owner, owner to completely remove them from Activity Feed
  const adminRoles = ['admin', 'superadmin', 'platform_owner', 'owner'];
  filtered = filtered.filter(l => {
    const emailLower = l.email.toLowerCase();
    const role = usersRoleMap[emailLower];
    
    if (role && adminRoles.includes(role)) return false;
    if (emailLower === 'admin@secureguard.com') return false;
    
    return true;
  });

  console.log("Records before filter", filtered.length);

  if (filter !== 'All') {
     if (filter === 'Success') filtered = filtered.filter(l => (l.action || "").toUpperCase().includes('SUCCESS'));
     else if (filter === 'Warning') filtered = filtered.filter(l => {
       const a = (l.action || "").toUpperCase();
       return a.includes('FAILED') || a.includes('SUSPICIOUS') || a.includes('REJECTED');
     });
     else if (filter === 'Info') filtered = filtered.filter(l => {
       const a = (l.action || "").toUpperCase();
       return !a.includes('SUCCESS') && !a.includes('FAILED') && !a.includes('SUSPICIOUS') && !a.includes('REJECTED');
     });
  }
  console.log("After status filter", filtered.length);

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(l => 
      (l.email || "").toLowerCase().includes(s) || 
      (l.ipAddress || "").toLowerCase().includes(s) ||
      (l.details || "").toLowerCase().includes(s)
    );
  }
  console.log("After search filter", filtered.length);
  console.log("Final rendered", filtered.length);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="bg-white" style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Controls Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white rounded-t-[12px]">
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Logs, IPs or Details..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter size={16} className="text-gray-400 mr-1 shrink-0" />
          {['All', 'Success', 'Warning', 'Info'].map(f => (
            <button 
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors shrink-0 ${filter === f ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {f}
            </button>
          ))}
          <div className="border-l border-gray-200 h-6 mx-1"></div>
          <button 
            onClick={handleClearHistory}
            className="px-4 py-1.5 text-sm font-medium rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors shrink-0"
          >
            Clear Login History
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 shadow-sm border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">User Email</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Action Event</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">IP Address</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Details</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">{getStatusBadge(log.action)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{log.email ?? '-'}</td>
                <td className="px-6 py-4 font-bold text-gray-700">{getActionLabel(log.action)}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600 bg-gray-50/50 rounded">{log.ipAddress ?? '-'}</td>
                <td className="px-6 py-4 text-gray-600 truncate max-w-xs" title={log.details ?? '-'}>{log.details ?? '-'}</td>
                <td className="px-6 py-4 text-gray-500 text-right">
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                  No activity logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-[12px]">
          <span className="text-sm text-gray-600 font-medium">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-gray-700 px-3 py-1 bg-white border border-gray-200 rounded">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
