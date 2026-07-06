import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Bell, Check, X, AlertTriangle, Info, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { logActivity } from '../lib/activityLogger';
import { createPortal } from 'react-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'critical' | 'security';
  userEmail: string;
  createdAt: any;
  read: boolean;
  severity?: string;
  relatedOrderId?: string;
  employeeName?: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const company = localStorage.getItem('company') || 'Zomato';
  const isAmazon = company === 'Amazon';

  useEffect(() => {
    const fetchMongoNotifications = async () => {
      try {
        const activeCompany = company.toLowerCase();
        console.log(`Current company: ${activeCompany}`);
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        console.log(`API URL being called: ${backendUrl}/api/notifications?company=${activeCompany}`);
        const res = await fetch(`${backendUrl}/api/notifications?company=${activeCompany}`);
        const data = await res.json();
        console.log(`Notifications returned for ${company}:`, data);
        const fetched = data.map((n: any) => ({
           id: n._id,
           title: n.title,
           message: n.message,
           type: n.type,
           userEmail: n.userEmail,
           createdAt: { toDate: () => new Date(n.createdAt) }, 
           read: n.read,
           severity: n.severity,
           relatedOrderId: n.relatedOrderId,
           employeeName: n.employeeName
        }));
        console.log(`Notification bell received ${fetched.length} notifications`);
        setNotifications(fetched);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications from Mongo:", error);
        setLoading(false);
      }
    };

    fetchMongoNotifications();

    const handleMongoUpdate = () => {
      fetchMongoNotifications();
    };
    
    window.addEventListener('mongo-notification-updated', handleMongoUpdate);
    return () => {
      window.removeEventListener('mongo-notification-updated', handleMongoUpdate);
    };
  }, [company]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleApproveLogin = async (notif: Notification) => {
    const uidMatch = notif.message.match(/UID: ([a-zA-Z0-9_-]+)/);
    const ipMatch = notif.message.match(/IP: ([^,]+)/);
    const deviceMatch = notif.message.match(/Device: ([^,]+)/);
    const locationMatch = notif.message.match(/Location: ([^\s]+)/); 

    const targetUid = uidMatch ? uidMatch[1] : null;

    if (targetUid && ipMatch && deviceMatch) {
      try {
        const updatePayload: any = {
          trusted_ips: arrayUnion(ipMatch[1].trim()),
          trusted_devices: arrayUnion(deviceMatch[1].trim())
        };
        if (locationMatch) {
          updatePayload.trusted_locations = arrayUnion(locationMatch[1].trim());
        }

        await updateDoc(doc(db, 'users', targetUid), updatePayload);
        await logActivity(targetUid, notif.userEmail || 'System', 'ADMIN_APPROVED', `Admin approved IP: ${ipMatch[1]}`);
      } catch (err) {
        console.error("Failed to whitelist:", err);
      }
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (notif: Notification) => {
    const uidMatch = notif.message.match(/UID: ([a-zA-Z0-9_-]+)/);
    if (uidMatch) {
       await logActivity(uidMatch[1], notif.userEmail || 'System', 'ADMIN_REJECTED', `Admin rejected access request.`);
    }
    
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const activeCompany = company.toLowerCase();
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: activeCompany })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getRelativeTime = (dateStr: any) => {
    if (!dateStr?.toDate) return 'Just now';
    const date = dateStr.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': 
      case 'security': return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning': return <AlertCircle size={16} className="text-yellow-500" />;
      case 'success': return <Check size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 transition-colors relative ${isAmazon ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-[#E03C42]'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 ${isAmazon ? 'border-[#232F3E]' : 'border-white'}`}></span>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-80 max-h-[400px] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 z-[9999]"
          style={{ top: position.top, right: position.right }}
        >
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 size={12} /> Mark all read
                </button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">You're all caught up!</div>
            ) : (
              console.log(`Number of notifications rendered: ${notifications.length}`),
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 transition-colors ${!n.read ? (n.type === 'critical' || n.type === 'security' ? 'bg-red-50' : 'bg-gray-50') : 'opacity-75'} ${!n.read ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold text-gray-900">{n.title}</h4>
                        <button 
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{n.message}</p>
                      
                      {(n.relatedOrderId || n.employeeName) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {n.relatedOrderId && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">Order: {n.relatedOrderId}</span>}
                          {n.employeeName && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">{n.employeeName}</span>}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-2">
                        {getRelativeTime(n.createdAt)}
                      </p>
                      
                      {!n.read && n.title.includes('Login Blocked') && (
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApproveLogin(n); }}
                            className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReject(n); }}
                            className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
