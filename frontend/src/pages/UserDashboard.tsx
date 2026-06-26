import React from 'react';
import { useAuth } from '../components/AuthContext';
import { LogOut, User as UserIcon, Settings, History } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/activityLogger';

export default function UserDashboard() {
  const { currentUser, role, logout } = useAuth();

  const handleLogout = async () => {
    if (currentUser) {
      await logActivity(currentUser.uid, currentUser.email || 'unknown', 'LOGOUT');
    }
    await logout();
  };

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
          {/* Profile Information */}
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

          {/* Personal Activity History */}
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
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Yesterday, 3:45 PM</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Updated profile settings</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Success</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Oct 12, 1:15 PM</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password reset requested</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Account Settings */}
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
