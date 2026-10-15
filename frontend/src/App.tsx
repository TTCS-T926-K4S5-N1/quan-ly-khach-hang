import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage';
import {
  Layers,
  Users,
  LayoutDashboard,
  CheckCircle,
  HelpCircle,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & CRM Brand */}
          <div className="flex items-center gap-6">
            <Link to="/opportunities" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                C
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Corporate CRM
                </span>
                <span className="text-[10px] text-sky-700 font-bold block leading-none">
                  POINT 76 — ĐÓNG CƠ HỘI
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
              <a
                href="dashboard.html"
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard size={15} />
                <span>Tổng quan</span>
              </a>
              <a
                href="customers.html"
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                <Users size={15} />
                <span>Khách hàng</span>
              </a>
              <Link
                to="/opportunities"
                className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith('/opportunities')
                    ? 'bg-sky-50 text-sky-700 font-bold'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Briefcase size={15} />
                <span>Cơ hội (Point 76)</span>
              </Link>
              <a
                href="pipeline.html"
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                <Layers size={15} />
                <span>Pipeline Kanban</span>
              </a>
            </nav>
          </div>

          {/* Quick info status */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hệ thống CRM Hoạt động</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CRM System — Point 76: Đóng Cơ hội Kinh doanh Thắng / Thua (ReactJS + TypeScript)</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>React 18</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>React Hook Form & Zod</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/opportunities" replace />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="*" element={<Navigate to="/opportunities" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
