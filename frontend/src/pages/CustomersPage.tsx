import { useState } from 'react';
import { Users, Search, Download, AlertCircle, TrendingUp, ShieldAlert, CreditCard } from 'lucide-react';

const customers = [
  { id: 'JD', name: 'John Doe', risk: 88, orders: 15, spend: '$2,450.00', chargebacks: 1, failed: 3, lastActive: '2 hrs ago' },
  { id: 'AS', name: 'Alice Smith', risk: 42, orders: 9, spend: '$1,080.00', chargebacks: 0, failed: 1, lastActive: '1 day ago' },
  { id: 'RJ', name: 'Robert Johnson', risk: 61, orders: 18, spend: '$4,920.00', chargebacks: 2, failed: 4, lastActive: '5 mins ago' },
];

function CustomersPage() {
  const [selected, setSelected] = useState(customers[0]);
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <Users className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Customers</h1>
            <p className="text-sm text-gray-500">Review customer risk profiles and activity history.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Export List
          </button>
          <button className="px-4 py-2 bg-[#FF9900] border border-[#A88734] rounded-md shadow-sm text-sm font-medium text-gray-900 hover:bg-[#F3A847] transition-colors">
            Add Customer
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Left Column: Customer List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] w-full"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-white">
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => setSelected(customer)}
                className={`w-full text-left p-3 rounded-md border transition-all ${
                  selected.id === customer.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Active: {customer.lastActive}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    customer.risk > 80 ? 'bg-red-50 text-red-700 border-red-200' :
                    customer.risk > 50 ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    Risk: {customer.risk}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Customer Details */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-[600px] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Customer ID: {selected.id}100482</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
              selected.risk > 80 ? 'bg-red-50 text-red-700 border-red-200' :
              selected.risk > 50 ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
              'bg-green-50 text-green-700 border-green-200'
            }`}>
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Risk Score: {selected.risk}/100
            </span>
          </div>

          <div className="p-6 space-y-6 flex-1 bg-white">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Account Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{selected.orders}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-xs text-gray-500 font-medium">Total Spend</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{selected.spend}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-xs text-gray-500 font-medium">Chargebacks</p>
                <p className="mt-1 text-2xl font-bold text-[#CC0000]">{selected.chargebacks}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-xs text-gray-500 font-medium">Failed Payments</p>
                <p className="mt-1 text-2xl font-bold text-[#CC0000]">{selected.failed}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mt-8">Recent Activity History</h3>
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Order #1122 flagged for review</p>
                  <p className="text-xs text-gray-500 mt-1">Today, 10:42 AM</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Failed login attempt from new device</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday, 04:15 PM</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <CreditCard className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment declined by card issuer</p>
                  <p className="text-xs text-gray-500 mt-1">May 22, 09:30 AM</p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 mt-4 flex justify-end space-x-3 border-t border-gray-200">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Contact Customer
              </button>
              <button className="px-4 py-2 bg-white border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;
