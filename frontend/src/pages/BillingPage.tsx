function BillingPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Billing & Subscription</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Manage your plan and invoices</h1>
          </div>
          <button className="rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary">Upgrade plan</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Current plan</p>
          <div className="mt-6 space-y-3">
            <p className="text-3xl font-semibold text-slate-900">Professional</p>
            <p className="text-slate-500">$99 / month</p>
            <p className="text-sm text-slate-600">Includes priority support, advanced analytics, and 5 integrations.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Usage</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Monthly orders scanned</p>
              <p className="text-2xl font-semibold text-slate-900">17.4K</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Fraud claims processed</p>
              <p className="text-2xl font-semibold text-slate-900">3.4K</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Payment method</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Visa ending in 4321</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Exp 08/26</p>
            </div>
            <button className="w-full rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary">Update payment</button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent invoices</p>
        <div className="mt-6 space-y-4">
          {['INV-2024-01', 'INV-2024-02', 'INV-2024-03'].map((invoice) => (
            <div key={invoice} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{invoice}</p>
                <p className="text-sm text-slate-500">Paid</p>
              </div>
              <p className="font-semibold text-slate-900">$99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BillingPage;
