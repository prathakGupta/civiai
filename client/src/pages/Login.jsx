import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUserRole, setAdminPassword, setWorkerName } from "../lib/auth";
import { loginAdmin } from "../api/authApi";
import { Hexagon, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [role, setRole] = useState("ADMIN");
  const [password, setPassword] = useState("");
  const [workerName, setWorkerNameInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (role === "ADMIN") {
      try {
        const res = await loginAdmin(password);
        if (res.success) {
          setUserRole("ADMIN");
          setAdminPassword(res.token);
          navigate("/dashboard");
        } else {
          setError(res.message || "Invalid admin password.");
        }
      } catch {
        setError("Network error. Could not reach the server.");
      }
    } else if (role === "WORKER") {
      if (!workerName.trim()) {
        setError("Worker name is required.");
        setLoading(false);
        return;
      }
      setUserRole("WORKER");
      setWorkerName(workerName);
      navigate("/worker");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-body">
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />

      <div className="glass-panel p-8 md:p-12 rounded-3xl w-full max-w-md shadow-2xl relative z-10 border border-white/50">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Hexagon size={32} strokeWidth={2.5} className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-headline">CiviAI Staff Portal</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Please sign in to access operational controls.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">I am a...</label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  role === "ADMIN" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setRole("ADMIN")}
              >
                Admin
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  role === "WORKER" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setRole("WORKER")}
              >
                Field Worker
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {role === "ADMIN" ? "Admin Password" : "Worker Name / ID"}
            </label>
            {role === "ADMIN" ? (
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            ) : (
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                placeholder="e.g. John Doe (ID: 104)"
                value={workerName}
                onChange={(e) => setWorkerNameInput(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            &larr; Return to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
}
