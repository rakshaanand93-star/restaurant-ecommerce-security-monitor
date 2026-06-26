import { useMemo, useState } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Package } from 'lucide-react';

const orderRows = [
  { id: '#4501', customer: 'John Doe', amount: '$524.00', risk: 'High', status: 'Blocked', date: 'May 12, 2024', items: 3 },
  { id: '#4502', customer: 'Alice Smith', amount: '$320.00', risk: 'Low', status: 'Approved', date: 'May 12, 2024', items: 1 },
  { id: '#4503', customer: 'Robert Johnson', amount: '$750.00', risk: 'Medium', status: 'Review', date: 'May 11, 2024', items: 5 },
  { id: '#4504', customer: 'Michael Brown', amount: '$142.00', risk: 'High', status: 'Blocked', date: 'May 11, 2024', items: 2 },
];

const filters = ['All', 'Approved', 'Review', 'Blocked'];

function OrdersPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredOrders = useMemo(() => {
    return orderRows.filter((order) => {
      const matchesQuery = [order.id, order.customer, order.amount, order.risk, order.status, order.date].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter = filter === 'All' || order.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <Package className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-sm text-gray-500">View, manage, and process your recent customer orders.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all">
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by order ID, customer..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] w-full sm:w-80 bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-gray-500 mr-1" />
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  filter === item 
                    ? 'bg-[#FF9900] text-gray-900 border border-[#A88734]' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.risk}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      order.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                      order.status === 'Review' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs text-gray-700 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No orders found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredOrders.length ? 1 : 0}</span> to <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{filteredOrders.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
