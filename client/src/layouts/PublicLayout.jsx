import { useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function topNavClass(isActive) {
  const base =
    "text-[0.72rem] uppercase tracking-[0.18em] font-semibold transition-all duration-300 pb-1";
  if (isActive) {
    return `${base} text-blue-800 border-b-2 border-blue-700`;
  }
  return `${base} text-slate-500 hover:text-blue-700`;
}

function mobileNavClass(isActive) {
  return `flex flex-col items-center gap-1 transition-all ${
    isActive ? "text-blue-800 font-bold -translate-y-0.5" : "text-slate-500"
  }`;
}

export default function PublicLayout() {
  const navigate = useNavigate();

  const handleAmbientMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty("--civiai-cursor-x", `${Math.max(0, Math.min(100, x))}%`);
    event.currentTarget.style.setProperty("--civiai-cursor-y", `${Math.max(0, Math.min(100, y))}%`);
  }, []);

  const resetAmbientMove = useCallback((event) => {
    event.currentTarget.style.setProperty("--civiai-cursor-x", "50%");
    event.currentTarget.style.setProperty("--civiai-cursor-y", "24%");
  }, []);

  return (
    <div
      className="app-canvas bg-background text-on-surface flex min-h-screen overflow-hidden font-body"
      onMouseMove={handleAmbientMove}
      onMouseLeave={resetAmbientMove}
    >
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-orb ambient-orb-c" />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-50 px-4 md:px-6 pt-4 md:pt-5">
          <div className="glass-panel rounded-2xl px-5 md:px-6 py-3.5 flex justify-between items-center max-w-[1440px] mx-auto shadow-sm">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="material-symbols-outlined text-white text-sm">shield</span>
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900 font-headline hidden sm:inline-block">
                  CiviAI
                </span>
              </div>
              <nav className="hidden md:flex gap-6 border-l border-slate-200 pl-8">
                <NavLink to="/" end className={({ isActive }) => topNavClass(isActive)}>
                  Impact Center
                </NavLink>
                <NavLink to="/report" className={({ isActive }) => topNavClass(isActive)}>
                  Report Issue
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/login")}
                className="px-4 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
              >
                Staff Login
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative pb-20 md:pb-0 page-reveal max-w-[1440px] mx-auto w-full">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-3 left-3 right-3 glass-panel rounded-2xl border border-outline-variant/20 px-10 py-3 flex justify-between items-center z-[60] shadow-xl">
        <NavLink to="/" end className={({ isActive }) => mobileNavClass(isActive)}>
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.12em]">Impact</span>
        </NavLink>
        <NavLink to="/report" className={({ isActive }) => mobileNavClass(isActive)}>
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.12em]">Report</span>
        </NavLink>
      </nav>
    </div>
  );
}
