import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { stats, fraudTrendData, riskLevels, alerts } from '../lib/data';

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{stat.title}</p>
            <h3 className="mt-4 text-3xl font-semibold">{stat.value}</h3>
            <p className={`mt-3 text-sm ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Fraud Trend</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Risk movement last 30 days</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-500">Live</span>
          </div>
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fraudTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Line type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="safe" stroke="#22C55E" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Orders by Risk Level</p>
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskLevels} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {riskLevels.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent Alerts</p>
            <div className="mt-6 space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                      <p className="text-sm text-slate-500">{alert.details}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      alert.severity === 'High' ? 'bg-red-100 text-red-700' : alert.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{alert.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Top Risk Countries</p>
          <div className="mt-6 space-y-4">
            {['United States', 'Germany', 'Brazil', 'India'].map((country, index) => (
              <div key={country} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{country}</p>
                  <p className="text-sm text-slate-500">{[28, 19, 15, 12][index]}% of flagged activity</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-slate-200">
                  <div className={`h-2 rounded-full ${['w-4/5 bg-red-500', 'w-1/2 bg-amber-500', 'w-1/3 bg-green-500', 'w-1/4 bg-purple-500'][index]}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Activity Feed</p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            {['Order #1122 flagged for chargeback', 'VPN login detected', 'New integration connected: BigCommerce', 'Customer review requested for order #1098'].map((event) => (
              <div key={event} className="rounded-3xl bg-slate-50 px-4 py-4">{event}</div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Usage Summary</p>
          <div className="mt-6 space-y-5 text-slate-700">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Monthly API calls</p>
              <p className="mt-2 text-2xl font-semibold">1.2M</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Active integrations</p>
              <p className="mt-2 text-2xl font-semibold">4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
