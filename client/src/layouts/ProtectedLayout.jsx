import { useCallback } from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { getUserRole, getAdminPassword } from "../lib/auth";

function navItemClass(isActive) {
  const base =
    "px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-300 border border-transparent";
  if (isActive) {
    return `${base} bg-blue-50/90 text-blue-800 font-bold border-blue-100 shadow-sm translate-x-1`;
  }
  return `${base} text-slate-600 hover:bg-white/70 hover:border-slate-200`;
}

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

export default function ProtectedLayout() {
  const role = getUserRole();
  const token = getAdminPassword(); // Assuming this is where it's stored conceptually
  
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

  if (role === "CITIZEN" || (!token && role === "ADMIN")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="app-canvas bg-background text-on-surface flex min-h-screen overflow-hidden font-body"
      onMouseMove={handleAmbientMove}
      onMouseLeave={resetAmbientMove}
    >
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-orb ambient-orb-c" />

      <aside className="hidden lg:flex flex-col h-screen w-72 glass-panel rounded-r-3xl border-r border-slate-200/70 shadow-[4px_0_24px_rgba(0,0,0,0.02)] py-6 px-4 shrink-0 z-10">
        <div className="flex items-center gap-3 px-2 mb-10 enter-up">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-white text-base">shield</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none font-headline">CiviAI</h1>
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold mt-1">
              Staff Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavLink to="/dashboard" className={({ isActive }) => navItemClass(isActive)}>
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-[0.74rem] uppercase tracking-[0.14em] font-semibold">Dashboard</span>
          </NavLink>
          {role === "ADMIN" && (
            <NavLink to="/queue" className={({ isActive }) => navItemClass(isActive)}>
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <span className="text-[0.74rem] uppercase tracking-[0.14em] font-semibold">Admin Queue</span>
            </NavLink>
          )}
          {(role === "WORKER" || role === "ADMIN") && (
            <NavLink to="/worker" className={({ isActive }) => navItemClass(isActive)}>
              <span className="material-symbols-outlined text-[20px]">engineering</span>
              <span className="text-[0.74rem] uppercase tracking-[0.14em] font-semibold">
                Worker Tasks
              </span>
            </NavLink>
          )}
        </nav>
        
        <div className="mt-auto px-4 py-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
           <div>
             <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Logged in as</div>
             <div className="text-sm font-bold text-blue-900">{role}</div>
           </div>
           
           <button 
             onClick={() => {
               import("../lib/auth").then(auth => {
                 auth.setUserRole("CITIZEN");
                 auth.setAdminPassword("");
                 auth.setWorkerName("");
                 window.location.href = "/";
               });
             }}
             className="w-full py-2 mt-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-800 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
           >
             <span className="material-symbols-outlined text-[16px]">logout</span>
             Log Out
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden sticky top-0 z-50 px-4 md:px-6 pt-4 md:pt-5">
           <div className="glass-panel rounded-2xl px-5 md:px-6 py-3.5 flex justify-between items-center max-w-[1440px] mx-auto shadow-sm">
             <span className="text-xl font-black tracking-tight text-slate-900 font-headline">
               CiviAI Staff
             </span>
             <button
               onClick={() => {
                 import("../lib/auth").then(auth => {
                   auth.setUserRole("CITIZEN");
                   auth.setAdminPassword("");
                   auth.setWorkerName("");
                   window.location.href = "/";
                 });
               }}
               className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 transition-colors"
               title="Log Out"
             >
               <span className="material-symbols-outlined text-[16px]">logout</span>
             </button>
           </div>
        </header>

        <div className="flex-1 overflow-auto relative pb-20 md:pb-0 page-reveal p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-3 left-3 right-3 glass-panel rounded-2xl border border-outline-variant/20 px-6 py-3 flex justify-evenly items-center z-[60] shadow-xl">
        <NavLink to="/dashboard" className={({ isActive }) => mobileNavClass(isActive)}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.12em]">Dashboard</span>
        </NavLink>
        {role === "ADMIN" && (
          <NavLink to="/queue" className={({ isActive }) => mobileNavClass(isActive)}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.12em]">Queue</span>
          </NavLink>
        )}
        <NavLink to="/worker" className={({ isActive }) => mobileNavClass(isActive)}>
          <span className="material-symbols-outlined">engineering</span>
          <span className="text-[10px] uppercase font-bold tracking-[0.12em]">Worker</span>
        </NavLink>
      </nav>
    </div>
  );
}
