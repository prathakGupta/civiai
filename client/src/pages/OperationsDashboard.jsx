import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchComplaints, getErrorMessage } from "../api/complaints";

const STATUS_OPTIONS = ["", "PENDING", "IN_REVIEW", "ASSIGNED", "RESOLVED", "REJECTED"];
const ISSUE_OPTIONS = [
  "",
  "GARBAGE",
  "POTHOLE",
  "WATER_LEAK",
  "STREETLIGHT",
  "DRAINAGE",
  "ROAD_DAMAGE",
  "UNKNOWN"
];
const SEVERITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

function severityClass(value) {
  if (value === "CRITICAL") return "bg-red-100 text-red-700";
  if (value === "HIGH") return "bg-orange-100 text-orange-700";
  if (value === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
}

function statusClass(value) {
  if (value === "PENDING") return "bg-amber-100 text-amber-800 border-amber-200";
  if (value === "ASSIGNED") return "bg-blue-100 text-blue-800 border-blue-200";
  if (value === "IN_REVIEW") return "bg-purple-100 text-purple-800 border-purple-200";
  if (value === "RESOLVED") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (value === "REJECTED") return "bg-red-100 text-red-800 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

export default function OperationsDashboard() {
  const [filters, setFilters] = useState({
    status: "",
    issueType: "",
    severity: "",
    page: 1,
    limit: 10
  });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadComplaints() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchComplaints(filters);
        if (!mounted) return;
        setItems(payload.items);
        setMeta(payload.meta);
      } catch (requestError) {
        if (!mounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadComplaints();
    return () => {
      mounted = false;
    };
  }, [filters]);

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.pending += item.status === "PENDING" ? 1 : 0;
        acc.critical += item.severity === "CRITICAL" ? 1 : 0;
        acc.resolved += item.status === "RESOLVED" ? 1 : 0;
        return acc;
      },
      { pending: 0, critical: 0, resolved: 0 }
    );
  }, [items]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  }

  function goToPage(nextPage) {
    setFilters((prev) => ({ ...prev, page: nextPage }));
  }

  return (
    <div className="flex-1 overflow-y-auto h-full relative">
      <section className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 enter-up">
            <div>
              <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
                Operations Dashboard
              </h2>
              <p className="text-secondary mt-1 max-w-md">
                Command surface for triage, routing, and execution.
              </p>
            </div>
            <div className="premium-card rounded-xl px-4 py-2 text-xs uppercase tracking-[0.18em] text-secondary font-bold">
              Total Cases: {meta.total}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="premium-card card-hover-lift rounded-2xl p-6 enter-up">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary">
                Pending In View
              </span>
              <div className="text-3xl font-black font-headline mt-2">{stats.pending}</div>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-6 enter-up">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary">
                Critical In View
              </span>
              <div className="text-3xl font-black font-headline mt-2">{stats.critical}</div>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-6 enter-up">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary">
                Resolved In View
              </span>
              <div className="text-3xl font-black font-headline mt-2">{stats.resolved}</div>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-6 enter-up">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary">
                Current Page
              </span>
              <div className="text-3xl font-black font-headline mt-2">
                {meta.page}/{meta.totalPages}
              </div>
            </div>
          </div>

          <div className="glass-panel sticky top-4 z-40 p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4 enter-up">
            <label className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary px-1">
                Status
              </span>
              <select
                className="text-sm rounded-xl py-2 px-3"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All Statuses"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary px-1">
                Issue Type
              </span>
              <select
                className="text-sm rounded-xl py-2 px-3"
                value={filters.issueType}
                onChange={(event) => updateFilter("issueType", event.target.value)}
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All Issues"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-bold text-secondary px-1">
                Severity
              </span>
              <select
                className="text-sm rounded-xl py-2 px-3"
                value={filters.severity}
                onChange={(event) => updateFilter("severity", event.target.value)}
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All Severity"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="table-shell enter-up relative">
            {error && (
              <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[400px]">
                 <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 float-soft">cloud_off</span>
                 <h3 className="text-lg font-bold text-slate-700 font-headline mb-2">Network Disconnected</h3>
                 <p className="text-sm max-w-sm mb-6">{error}</p>
                 <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
                 >
                   Retry Connection
                 </button>
              </div>
            )}
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70">
                    <th className="px-6 py-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">
                      Issue &amp; ID
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">
                      Location
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {isLoading && !error && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <span className="material-symbols-outlined animate-spin text-3xl text-blue-500/50 mb-2">progress_activity</span>
                        <p className="text-sm text-secondary font-medium">Loading complaints data...</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !items.length && !error && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                         <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
                         <h4 className="text-slate-700 font-bold mb-1">No Complaints Found</h4>
                         <p className="text-sm text-secondary">Try adjusting your filters or checking back later.</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    items.map((complaint) => (
                      <tr className="row-hover-3d" key={complaint.id}>
                        <td className="px-6 py-5">
                          <p className="font-bold text-sm text-on-surface">
                            {complaint.issueType || "UNKNOWN"}
                          </p>
                          <p className="text-[0.65rem] text-secondary font-mono tracking-tight">
                            {complaint.id} | {formatDate(complaint.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusClass(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${severityClass(
                              complaint.severity
                            )}`}
                          >
                            {complaint.severity}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-secondary">{complaint.locationText}</td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            to={`/complaint/${complaint.id}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward_ios</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/80">
              <p className="text-xs text-secondary font-medium">
                Showing page <span className="text-on-surface font-bold">{meta.page}</span> of{" "}
                <span className="text-on-surface font-bold">{meta.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-xl border border-slate-300/80 hover:bg-slate-100 transition-colors disabled:opacity-40 text-xs font-bold"
                  disabled={meta.page <= 1 || isLoading}
                  onClick={() => goToPage(meta.page - 1)}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1.5 rounded-xl border border-slate-300/80 hover:bg-slate-100 transition-colors disabled:opacity-40 text-xs font-bold"
                  disabled={meta.page >= meta.totalPages || isLoading}
                  onClick={() => goToPage(meta.page + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
