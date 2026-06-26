import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fraudTrendData, trustedLogs } from '../lib/data';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';

function LandingPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-slate-50 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between pb-8 text-sm text-slate-300">
        <div className="font-semibold text-white">SecureGuard AI</div>
        <div className="flex items-center gap-4">
          <Link className="hover:text-white" to="/company-login">Login</Link>
          <Link className="rounded-2xl border border-slate-600 px-4 py-2 text-white transition hover:border-primary hover:bg-slate-900/80" to="/signup">Get Started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary">AI-Powered Fraud Protection</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">Stop E-Commerce Fraud Before It Happens</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">Real-time monitoring, AI-powered fraud detection, risk scoring, and transaction protection for online stores.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-white shadow-glow transition hover:bg-secondary" to="/signup">Start Free Trial</Link>
            <Link className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-sm font-semibold text-slate-100 transition hover:border-primary" to="/signup">Book Demo</Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {['Total Orders', 'High Risk Orders', 'Blocked Orders', 'Revenue Protected'].map((label) => (
              <div key={label} className="rounded-3xl bg-white/95 p-6 text-slate-900 shadow-lg shadow-slate-900/10">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{label === 'Revenue Protected' ? '$15,450' : label === 'Total Orders' ? '12,500' : label === 'High Risk Orders' ? '85' : '22'}</p>
                <p className="mt-2 text-sm text-slate-500">Last 30 days</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-slate-900/95 p-8 shadow-glow sm:p-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Fraud Trend</p>
                <h2 className="text-xl font-semibold text-white">Monitor risky orders at a glance</h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">Realt-time</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fraudTrendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="safe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: 16, border: 'none' }} />
                  <Area type="monotone" dataKey="fraud" stroke="#EF4444" fillOpacity={1} fill="url(#fraud)" />
                  <Area type="monotone" dataKey="safe" stroke="#22C55E" fillOpacity={1} fill="url(#safe)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8 rounded-[2rem] bg-slate-900/90 p-8 shadow-glow backdrop-blur-xl sm:p-10">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Trusted by 2,000+ online stores</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {trustedLogs.map((platform) => (
                <div key={platform} className="rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm text-slate-200">{platform}</div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/95 p-6 text-slate-900 shadow-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Featured capabilities</p>
            <div className="mt-6 grid gap-3">
              {[
                'AI Fraud Detection',
                'Real-Time Monitoring',
                'Risk Scoring',
                'Revenue Protection',
                'Customer Behavior Analysis',
                'Chargeback Prevention',
              ].map((feature) => (
                <div key={feature} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900">{feature}</div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950/90 p-6 text-slate-200 shadow-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Enterprise-grade pricing</p>
            <div className="mt-6 space-y-4">
              {[
                { title: 'Starter', price: '$49/mo', benefits: ['Basic alerts', '2 integrations', 'Email support'] },
                { title: 'Professional', price: '$99/mo', benefits: ['Advanced risk scoring', '5 integrations', 'Priority support'] },
                { title: 'Enterprise', price: 'Custom', benefits: ['Unlimited integrations', 'Dedicated onboarding', 'Custom SLAs'] },
              ].map((plan) => (
                <div key={plan.title} className="rounded-3xl border border-slate-800 bg-slate-900/95 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{plan.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{plan.price}</p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-primary">Popular</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl space-y-8 rounded-[2rem] bg-white/5 p-10 shadow-glow backdrop-blur-xl sm:p-14">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">SecureGuard AI</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">All your e-commerce security intelligence in one dashboard.</h2>
          </div>
          <div className="text-slate-300">
            <p className="text-lg font-medium">Interactive risk charts, real-time alerts, and easy integrations help teams stop fraud faster while maintaining throughput.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['Fast onboarding', 'AI-driven alerts', 'Detailed reports', 'Secure workflows'].map((item) => (
              <div key={item} className="rounded-3xl bg-slate-900/90 px-5 py-4 text-sm text-slate-100">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
