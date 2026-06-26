import { Settings, Save, Shield, Bell, User, Lock, Mail, Globe, Monitor } from 'lucide-react';

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <Settings className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-sm text-gray-500">Manage your platform configuration and preferences.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-[#FF9900] border border-[#A88734] rounded-md shadow-sm text-sm font-medium text-gray-900 hover:bg-[#F3A847] transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Account Profile</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-500">admin@amazon.com</p>
                </div>
              </div>
              <button className="text-[#007185] hover:text-[#C45500] hover:underline text-sm font-medium">Edit</button>
            </div>
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Account Role</p>
                  <p className="text-sm text-gray-500">Platform Owner</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Step Verification (2SV)</p>
                  <p className="text-sm text-green-600 font-medium">Enabled</p>
                </div>
              </div>
              <button className="text-[#007185] hover:text-[#C45500] hover:underline text-sm font-medium">Manage</button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Monitor className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Language & Region</p>
                  <p className="text-sm text-gray-500">English (US)</p>
                </div>
              </div>
              <button className="text-[#007185] hover:text-[#C45500] hover:underline text-sm font-medium">Edit</button>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Notification Alerts</p>
                  <p className="text-sm text-gray-500">Email, SMS, Dashboard</p>
                </div>
              </div>
              <button className="text-[#007185] hover:text-[#C45500] hover:underline text-sm font-medium">Edit</button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Audit Logs & Telemetry</p>
                  <p className="text-sm text-gray-500">Detailed logging enabled</p>
                </div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" checked readOnly className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-[#FF9900] appearance-none cursor-pointer translate-x-5" style={{ zIndex: 1 }}/>
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-[#FF9900] cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
