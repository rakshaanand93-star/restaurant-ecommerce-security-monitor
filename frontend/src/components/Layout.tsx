import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navItems } from './ui/navigation';
import { BellIcon, Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';

function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <div className="lg:flex">
        <aside className="hidden lg:flex lg:w-80 shrink-0 flex-col bg-sidebar p-6 text-slate-100">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="mb-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-semibold text-white shadow-glow">
                SecureGuard AI
              </div>
              <p className="text-sm text-slate-400">E-Commerce Security Monitoring</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-slate-800 ${
                  location.pathname === item.path ? 'bg-slate-900 text-white' : 'text-slate-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Need help?</p>
            <p className="mt-3 text-sm text-slate-200">Get 24/7 fraud protection support and onboarding.</p>
            <button className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-secondary">
              Contact Sales
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 lg:px-8">
          <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/5 px-4 py-4 shadow-glow backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-slate-200 transition hover:border-primary hover:text-white">
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <h1 className="text-xl font-semibold text-white">SecureGuard AI Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900/80 px-4 text-sm text-slate-200 transition hover:bg-slate-800">
                <BellIcon className="h-5 w-5" />
                Notifications
              </button>
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-white shadow-glow transition hover:opacity-95">
                <UserCircleIcon className="h-5 w-5" />
                Account
              </button>
            </div>
          </div>

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="mt-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
