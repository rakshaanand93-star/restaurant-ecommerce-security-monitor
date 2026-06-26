import { alerts } from '../lib/data';

function AlertsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Fraud Alerts</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Monitor security events</h1>
          </div>
          <button className="rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary">Archive all</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-2 text-sm text-slate-500">{alert.details}</p>
              </div>
              <span className={`rounded-full px-3 py-2 text-xs font-semibold ${
                alert.severity === 'High' ? 'bg-red-100 text-red-700' : alert.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>{alert.severity}</span>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>{alert.date}</span>
              <div className="flex items-center gap-2 text-slate-900">
                <button className="rounded-2xl bg-slate-100 px-3 py-2 text-sm transition hover:bg-slate-200">View</button>
                <button className="rounded-2xl bg-slate-100 px-3 py-2 text-sm transition hover:bg-slate-200">Resolve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPage;
