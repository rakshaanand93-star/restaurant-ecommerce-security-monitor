import { BarChart, Bar, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Download, FileText, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Activity } from 'lucide-react';

const fraudReasons = [
  { name: 'Account takeover', value: 32 },
  { name: 'Chargeback fraud', value: 23 },
  { name: 'Payment abuse', value: 18 },
  { name: 'VPN usage', value: 12 },
  { name: 'Other', value: 15 },
];

const metrics = [
  { title: 'Fraud Rate', value: '0.99%', delta: '+0.05%', icon: AlertTriangle, color: 'text-[#CC0000]' },
  { title: 'Revenue Protected', value: '$145,250', delta: '+12.3%', icon: ShieldCheck, color: 'text-green-600' },
  { title: 'Growth', value: '14.2%', delta: '+1.4%', icon: TrendingUp, color: 'text-[#007185]' },
];

function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-md">
            <PieChart className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Monitor fraud performance metrics and generate reports.</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button className="flex items-center px-4 py-2 bg-[#FF9900] border border-[#A88734] rounded-md shadow-sm text-sm font-medium text-gray-900 hover:bg-[#F3A847] transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{metric.title}</p>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className="flex items-end justify-between gap-4">
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className={`text-sm font-bold ${metric.delta.startsWith('+') ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {metric.delta}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <Activity className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Fraud by Country</h2>
          </div>
          <div className="space-y-3">
            {[
              { country: 'United States', percentage: '34%', barWidth: '100%' },
              { country: 'Germany', percentage: '19%', barWidth: '60%' },
              { country: 'Brazil', percentage: '15%', barWidth: '45%' },
              { country: 'India', percentage: '12%', barWidth: '30%' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <span>{item.country}</span>
                  <span>{item.percentage}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-[#FF9900] h-2 rounded-full" style={{ width: item.barWidth }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Fraud Reasons</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudReasons} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#232F3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
