import { integrations } from '../lib/data';

function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Integrations</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Connect your commerce stack</h1>
          </div>
          <button className="rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary">Manage connections</button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item) => (
          <div key={item.name} className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                <p className="mt-2 text-sm text-slate-500">Secure integration with real-time monitoring</p>
              </div>
              <span className={`rounded-full px-3 py-2 text-sm font-semibold ${item.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {item.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Connect</button>
              <button className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntegrationsPage;
