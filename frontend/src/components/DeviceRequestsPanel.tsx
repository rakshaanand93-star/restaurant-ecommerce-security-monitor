import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { logActivity } from '../lib/activityLogger';
import { Check, X, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { createAdminNotification } from '../lib/securityLogger';

interface DeviceRequest {
  id: string;
  uid: string;
  userEmail: string;
  role?: string;
  oldIp: string;
  newIp: string;
  oldDevice: string;
  newDevice: string;
  status: string;
  requestedAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  approvedBy?: string;
  rejectedBy?: string;
}

export default function DeviceRequestsPanel() {
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const activeCompany = localStorage.getItem('company')?.toLowerCase() || '';
    console.log(`Current company: ${activeCompany}`);
    
    // TEMPORARY MIGRATION: Update old device requests that might be missing the company field
    const migrateRequests = async () => {
      try {
        const snap = await getDocs(collection(db, 'device_requests'));
        for (const document of snap.docs) {
          if (!document.data().company) {
            const { updateDoc, doc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'device_requests', document.id), { company: activeCompany });
          }
        }
      } catch (err) {}
    };
    migrateRequests();

    const q = query(
      collection(db, 'device_requests'), 
      where('company', '==', activeCompany)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: DeviceRequest[] = [];
      let pendingCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Company value of returned request ${doc.id}: ${data.company}`);
        if (data.company) {
          fetched.push({ id: doc.id, ...data } as DeviceRequest);
          if (data.status === 'PENDING') pendingCount++;
        }
      });
      // Sort in memory to avoid missing composite index error
      fetched.sort((a, b) => {
        const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
        const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
        return timeB - timeA;
      });
      console.log(`Number of pending requests returned: ${pendingCount}`);
      setRequests(fetched);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleApprove = async (req: DeviceRequest) => {
    try {
      await updateDoc(doc(db, 'user_devices', req.uid), {
        ipAddress: req.newIp,
        deviceInfo: req.newDevice,
        deviceId: (req as any).newDeviceId || 'Unknown',
        approved: true,
        approvedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'device_requests', req.id), {
        status: 'APPROVED',
        approvedAt: serverTimestamp(),
        approvedBy: 'Admin'
      });

      await logActivity(req.uid, req.userEmail, 'ADMIN_APPROVED', `Approved IP: ${req.newIp}, Device: ${req.newDevice}`);

      const currentCompany = localStorage.getItem('company') || 'Zomato';
      const notifData = {
        title: "Device Request Approved",
        message: `${req.userEmail}'s device request has been approved.`,
        type: "device_approval",
        company: currentCompany,
        userId: req.uid,
        email: req.userEmail,
        status: "approved",
        isRead: false,
      };

      await addDoc(collection(db, 'notifications'), {
        ...notifData,
        createdAt: serverTimestamp()
      });

      console.log("Notification written to Firebase");
      const res = await fetch('http://localhost:4000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notifData,
          userEmail: req.userEmail,
          read: false,
          company: currentCompany.toLowerCase()
        })
      });
      console.log("Notification written to MongoDB", res.status);
      window.dispatchEvent(new Event('mongo-notification-updated'));
    } catch (err) {
      console.error("Failed to approve device request:", err);
    }
  };

  const handleReject = async (req: DeviceRequest) => {
    try {
      await updateDoc(doc(db, 'device_requests', req.id), {
        status: 'REJECTED',
        rejectedAt: serverTimestamp(),
        rejectedBy: 'Admin'
      });

      await logActivity(req.uid, req.userEmail, 'ADMIN_REJECTED', `Rejected IP: ${req.newIp}, Device: ${req.newDevice}`);
      await createAdminNotification("Login Request Rejected", `Admin blocked login from IP: ${req.newIp}`, "critical", req.userEmail);

      const currentCompany = localStorage.getItem('company') || 'Zomato';
      const notifData = {
        title: "Device Request Rejected",
        message: `${req.userEmail}'s device request has been rejected.`,
        type: "device_rejection",
        company: currentCompany,
        userId: req.uid,
        email: req.userEmail,
        status: "rejected",
        isRead: false,
      };

      await addDoc(collection(db, 'notifications'), {
        ...notifData,
        createdAt: serverTimestamp()
      });

      console.log("Notification written to Firebase");
      const res = await fetch('http://localhost:4000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notifData,
          userEmail: req.userEmail,
          read: false,
          company: currentCompany.toLowerCase()
        })
      });
      console.log("Notification written to MongoDB", res.status);
      window.dispatchEvent(new Event('mongo-notification-updated'));
    } catch (err) {
      console.error("Failed to reject device request:", err);
    }
  };

  const handleDeleteHistory = async (req: DeviceRequest) => {
    if (!window.confirm("Are you sure you want to delete this request history?")) return;
    try {
      await deleteDoc(doc(db, 'device_requests', req.id));
      try {
        await fetch(`http://localhost:4000/api/device-requests/${req.id}`, { method: 'DELETE' });
      } catch (e) {
        // Ignored in case MongoDB sync endpoint doesn't exist
      }
      alert("Request history deleted successfully.");
    } catch (err) {
      console.error("Failed to delete request history:", err);
      alert("Failed to delete request history.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading requests...</div>;

  // Filter out any admin, superadmin, platform_owner, owner requests
  const adminRoles = ['admin', 'superadmin', 'platform_owner', 'owner'];
  let filtered = requests.filter(r => {
    const roleMatch = r.role && adminRoles.includes(r.role.toLowerCase());
    const emailMatch = r.userEmail && r.userEmail.toLowerCase() === 'admin@secureguard.com';
    return !roleMatch && !emailMatch;
  });

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(r => 
      r.userEmail.toLowerCase().includes(s) || 
      r.newIp.toLowerCase().includes(s) || 
      r.newDevice.toLowerCase().includes(s)
    );
  }

  const pendingRequests = filtered.filter(r => r.status === 'PENDING');
  const historyRequests = filtered.filter(r => r.status !== 'PENDING');

  const pendingTotalPages = Math.ceil(pendingRequests.length / rowsPerPage);
  const pendingPaginated = pendingRequests.slice((pendingPage - 1) * rowsPerPage, pendingPage * rowsPerPage);

  const historyTotalPages = Math.ceil(historyRequests.length / rowsPerPage);
  const historyPaginated = historyRequests.slice((historyPage - 1) * rowsPerPage, historyPage * rowsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Approved</span>;
    if (status === 'REJECTED') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">Rejected</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
  };

  return (
    <div className="space-y-8 w-full">
      {/* Global Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by Email, IP, or Device..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPendingPage(1); setHistoryPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E23744] shadow-sm transition-shadow"
        />
      </div>

      {/* Pending Device Approvals Table */}
      <div className="bg-white w-full" style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="p-5 border-b border-gray-100 bg-white rounded-t-[12px]">
          <h3 className="font-bold text-gray-900 text-lg flex items-center">
            <span className="flex h-2.5 w-2.5 relative mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            Pending Device Approvals
          </h3>
        </div>
        <div className="overflow-x-auto w-full relative">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">User Email</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Attempted IP</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs min-w-[200px]">Attempted Device</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs min-w-[200px]">Previous Approved</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Attempted Source</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Attempt Time</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right sticky right-0 bg-gray-50 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] z-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pendingPaginated.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-900 break-all">{req.userEmail}</td>
                  <td className="px-6 py-4 font-mono text-xs text-red-600">
                    <span className="bg-red-50 rounded border border-red-100 px-2 py-1 whitespace-nowrap">{req.newIp}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium break-words max-w-[300px]">{req.newDevice}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="font-mono text-xs mb-1 whitespace-nowrap">{req.oldIp}</div>
                    <div className="text-xs break-words max-w-[200px]">{req.oldDevice}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">Web Portal</td>
                  <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                    {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-gray-50 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button 
                        onClick={() => handleApprove(req)}
                        className="w-24 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={16}/> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(req)}
                        className="w-24 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={16}/> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingPaginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                    No pending device requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pendingTotalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-[12px]">
            <span className="text-sm text-gray-500">Page {pendingPage} of {pendingTotalPages}</span>
            <div className="flex gap-2">
              <button disabled={pendingPage === 1} onClick={() => setPendingPage(p => p - 1)} className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronLeft size={16} /></button>
              <button disabled={pendingPage === pendingTotalPages} onClick={() => setPendingPage(p => p + 1)} className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Request History Table */}
      <div className="bg-white w-full" style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="p-5 border-b border-gray-100 bg-white rounded-t-[12px]">
          <h3 className="font-bold text-gray-900 text-lg">Request History</h3>
        </div>
        <div className="overflow-x-auto w-full relative">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">User Email</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs min-w-[200px]">Attempted IP / Device</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Action By</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right whitespace-nowrap">Action Time</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {historyPaginated.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 break-all">{req.userEmail}</td>
                  <td className="px-6 py-4 break-words max-w-[300px]">
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded mr-2 whitespace-nowrap inline-block mb-1">{req.newIp}</span>
                    <span className="text-gray-600 text-xs block">{req.newDevice}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">{req.approvedBy || req.rejectedBy || 'System'}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium text-right whitespace-nowrap">
                    {req.status === 'APPROVED' 
                      ? (req.approvedAt?.toDate ? req.approvedAt.toDate().toLocaleString() : 'N/A')
                      : (req.rejectedAt?.toDate ? req.rejectedAt.toDate().toLocaleString() : 'N/A')}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button 
                      onClick={() => handleDeleteHistory(req)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1 border border-red-100"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {historyPaginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                    No history logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {historyTotalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-[12px]">
            <span className="text-sm text-gray-500">Page {historyPage} of {historyTotalPages}</span>
            <div className="flex gap-2">
              <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronLeft size={16} /></button>
              <button disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(p => p + 1)} className="p-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
