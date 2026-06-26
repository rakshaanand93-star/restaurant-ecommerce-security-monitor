import React from 'react';
import { Link } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Online' | 'Offline';
  completedOrders: number;
  cancelledOrders: number;
  lateDeliveries: number;
}
const employees: Employee[] = [
  { id: 'EMP001', name: 'Rahul Sharma', email: 'rahul.s@secureguard.ai', company: 'Zomato', status: 'Online', completedOrders: 142, cancelledOrders: 2, lateDeliveries: 1 },
  { id: 'EMP002', name: 'Priya Singh', email: 'priya.s@secureguard.ai', company: 'Amazon', status: 'Offline', completedOrders: 89, cancelledOrders: 0, lateDeliveries: 0 },
  { id: 'EMP003', name: 'Arjun Mehta', email: 'arjun.m@secureguard.ai', company: 'Zomato', status: 'Online', completedOrders: 215, cancelledOrders: 6, lateDeliveries: 3 },
  { id: 'EMP004', name: 'Kavya Reddy', email: 'kavya.r@secureguard.ai', company: 'Amazon', status: 'Online', completedOrders: 310, cancelledOrders: 1, lateDeliveries: 2 },
  { id: 'EMP005', name: 'Rohit Kumar', email: 'rohit.k@secureguard.ai', company: 'Zomato', status: 'Offline', completedOrders: 45, cancelledOrders: 8, lateDeliveries: 5 },
];
const companyName = localStorage.getItem('company');

const filteredEmployees = employees.filter(
  (emp) =>
    emp.company.toLowerCase() ===
    companyName?.toLowerCase()
);
export const UsersActivityMonitoring: React.FC = () => {
  return (
    <div className="mt-8 bg-white shadow rounded-lg border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Users Activity Monitoring</h3>
        <p className="mt-1 text-sm text-gray-500">Real-time employee metrics and operational status.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-900">
                  <Link to="/employee-details">{emp.name}</Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{emp.company}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{emp.completedOrders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{emp.cancelledOrders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{emp.lateDeliveries}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to="/employee-details" className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition-colors duration-150">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};