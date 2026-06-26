import React from 'react';
import { DollarSign, Download, CreditCard, ChevronRight, FileText } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <DollarSign className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments Dashboard</h1>
            <p className="text-sm text-gray-500">View statement views, transactions, and manage disbursements.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Download Reports
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Current Statement</h2>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Open</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Statement period</p>
              <p className="text-sm font-medium text-gray-900">Oct 12, 2024 - Oct 26, 2024</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total balance</p>
              <p className="text-3xl font-bold text-gray-900">$12,450.00</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button className="w-full flex justify-center items-center px-4 py-2 bg-[#FF9900] border border-[#A88734] rounded-md shadow-sm text-sm font-medium text-gray-900 hover:bg-[#F3A847] transition-colors">
                Request Transfer
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Disbursements</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-gray-400 mr-3 group-hover:text-[#FF9900] transition-colors" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Transfer to Bank Account ending in 1234</p>
                  <p className="text-xs text-gray-500">Oct 12, 2024</p>
                </div>
              </div>
              <div className="flex items-center text-sm font-bold text-gray-900">
                $8,240.50
                <ChevronRight className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-700" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-gray-400 mr-3 group-hover:text-[#FF9900] transition-colors" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Transfer to Bank Account ending in 1234</p>
                  <p className="text-xs text-gray-500">Sep 28, 2024</p>
                </div>
              </div>
              <div className="flex items-center text-sm font-bold text-gray-900">
                $10,150.00
                <ChevronRight className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-700" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button className="text-sm font-medium text-[#007185] hover:text-[#C45500] hover:underline">
              View All Disbursements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
