import { NavLink, Outlet } from 'react-router-dom';
import { CircleDollarSign, LayoutDashboard, Moon, Shield, Sun, User } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { BRAND } from '../config';
import Toasts from './Toasts.jsx';

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
    isActive
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`;

export default function Layout() {
  const { theme, toggleTheme, isAdmin } = useApp();

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg dark:focus:bg-slate-900"
      >
        Bỏ qua điều hướng
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <CircleDollarSign size={19} aria-hidden="true" />
            </span>
            <div>
              <span className="block text-sm font-semibold tracking-tight sm:text-lg">{BRAND}</span>
              <span className="hidden text-[10px] text-slate-400 sm:block">
                {isAdmin ? 'Trang quản trị' : 'Cổng đóng quỹ thành viên'}
              </span>
            </div>
          </div>

          <nav aria-label="Điều hướng chính" className="flex items-center gap-1">
            <NavLink to="/app" className={linkClass}>
              <User size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Thành viên</span>
            </NavLink>
            <NavLink to="/admin" className={linkClass}>
              <Shield size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          </nav>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-10 text-xs text-slate-400">
        <LayoutDashboard size={14} aria-hidden="true" /> Hệ thống đóng quỹ CLB
      </footer>
      <Toasts />
    </div>
  );
}
