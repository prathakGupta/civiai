import { Hexagon } from "lucide-react";

export default function AppLogo({ className = "", iconSize = 20, isStaff = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <Hexagon strokeWidth={2.5} size={iconSize} className="text-white drop-shadow-md" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight text-slate-900 font-headline leading-none">
          CiviAI
        </span>
        {isStaff && (
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold mt-1 leading-none">
            Staff Portal
          </span>
        )}
      </div>
    </div>
  );
}
