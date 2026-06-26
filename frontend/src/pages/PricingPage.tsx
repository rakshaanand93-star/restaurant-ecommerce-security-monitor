import React from 'react';
import { Tag, Search, Plus, Filter, RefreshCcw } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <Tag className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Pricing</h1>
            <p className="text-sm text-gray-500">Update prices, run promotions, and manage Buy Box eligibility.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button className="flex items-center px-4 py-2 bg-[#FF9900] border border-[#A88734] rounded-md shadow-sm text-sm font-medium text-gray-900 hover:bg-[#F3A847] transition-colors">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Automate Pricing
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or ASIN..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] w-full"
            />
          </div>
        </div>

        <div className="p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No active pricing rules</h3>
          <p className="text-sm text-gray-500 mt-1">Create automated pricing rules to stay competitive.</p>
          <button className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#007185] hover:bg-gray-50 transition-colors">
            Learn about Automate Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
