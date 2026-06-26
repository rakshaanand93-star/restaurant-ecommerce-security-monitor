import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function PerformancePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <Activity className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Health</h1>
            <p className="text-sm text-gray-500">Monitor your seller performance and compliance.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-green-50 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Status: Healthy</h2>
              <p className="text-sm text-gray-600 mt-1">Thank you for maintaining a great customer experience.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-600">0</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Policy Violations</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-900">Customer Service Performance</h3>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Order Defect Rate</span>
                <span className="font-bold text-green-600">0.00%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '5%' }}></div>
              </div>
              <p className="text-xs text-gray-500">Target: under 1%</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-900">Policy Compliance</h3>
            </div>
            <div>
              <div className="flex items-start bg-gray-50 p-3 rounded-md border border-gray-100">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 shrink-0" />
                <p className="text-sm text-gray-600">Zero policy violations on record. Your account complies with all selling policies.</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-900">Shipping Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Late Dispatch Rate</span>
                  <span className="font-bold text-green-600">0.24%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-xs text-gray-500">Target: under 4%</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Valid Tracking Rate</span>
                  <span className="font-bold text-green-600">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-gray-500">Target: over 95%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
