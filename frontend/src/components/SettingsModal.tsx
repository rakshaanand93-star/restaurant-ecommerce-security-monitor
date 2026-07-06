import React, { useState, useEffect } from 'react';
import { X, Save, Lock, User, Image as ImageIcon, MapPin, Phone, Bell } from 'lucide-react';
import { auth } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdateSuccess: () => void;
}

export function SettingsModal({ isOpen, onClose, currentUser, onUpdateSuccess }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: '',
    photoURL: '',
    phone: '',
    address: '',
    notificationsEnabled: true
  });
  
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen && currentUser?.email) {
      const fetchUserData = async () => {
        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const res = await fetch(`${backendUrl}/api/users/by-email/${encodeURIComponent(currentUser.email)}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              displayName: data.displayName || '',
              photoURL: data.photoURL || '',
              phone: data.profile?.phone || '',
              address: data.profile?.address || '',
              notificationsEnabled: data.settings?.notificationsEnabled ?? true
            });
          }
        } catch (err) {
          console.error("Failed to fetch user settings", err);
        }
      };
      fetchUserData();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Fetch user ID first to update via /api/users/:id
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const userRes = await fetch(`${backendUrl}/api/users/by-email/${encodeURIComponent(currentUser.email)}`);
      const userData = await userRes.json();
      const userId = userData._id;

      if (!userId) throw new Error("Could not find user ID.");

      // Update backend profile
      const updateRes = await fetch(`${backendUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          photoURL: formData.photoURL,
          profile: { phone: formData.phone, address: formData.address },
          settings: { notificationsEnabled: formData.notificationsEnabled }
        })
      });

      if (!updateRes.ok) throw new Error("Failed to update profile settings.");

      // Update password via Firebase if provided
      if (password && auth.currentUser) {
        await updatePassword(auth.currentUser, password);
      }

      setSuccessMsg('Settings saved successfully!');
      onUpdateSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 2000);
      
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <User className="mr-2 text-[#E23744]" size={24} />
            Restaurant Settings
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl font-medium border border-green-200">{successMsg}</div>}
          {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-200">{errorMsg}</div>}

          <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">General Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} required className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#E23744] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input type="email" value={currentUser?.email || ''} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#E23744] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="url" name="photoURL" value={formData.photoURL} onChange={handleChange} placeholder="https://..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#E23744] text-sm" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#E23744] text-sm" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Notifications & Security */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Preferences & Security</h3>
              
              <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Bell className="text-gray-500" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive alerts for new orders and platform updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="notificationsEnabled" checked={formData.notificationsEnabled} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E23744]"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Change Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="password" placeholder="Enter new password to change" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#E23744] text-sm" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current password.</p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" form="settings-form" disabled={loading} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#E23744] hover:bg-[#D22B38] flex items-center transition-colors shadow-md shadow-red-500/20 disabled:opacity-70">
            {loading ? 'Saving...' : (
              <>
                <Save size={16} className="mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
