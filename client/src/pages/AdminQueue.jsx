import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchComplaints, getErrorMessage, patchComplaintStatus } from "../api/complaints";
import { getUserRole } from "../lib/auth";

const STATUS_OPTIONS = ["PENDING", "IN_REVIEW", "ASSIGNED", "RESOLVED", "REJECTED"];

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function statusDotClass(value) {
  if (value === "PENDING") return "bg-amber-500";
  if (value === "ASSIGNED") return "bg-blue-500";
  if (value === "IN_REVIEW") return "bg-purple-500";
  if (value === "RESOLVED") return "bg-emerald-500";
  if (value === "REJECTED") return "bg-red-500";
  return "bg-slate-400";
}

export default function AdminQueue() {
  const userRole = getUserRole();
  const isAdmin = userRole === "ADMIN";

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkStatus, setBulkStatus] = useState("ASSIGNED");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadQueue() {
      setIsLoading(true);
      setError("");
      setMessage("");
      try {
        const payload = await fetchComplaints({ page: 1, limit: 100 });
        if (!mounted) return;
        setItems(payload.items);
      } catch (requestError) {
        if (!mounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadQueue();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.PENDING += item.status === "PENDING" ? 1 : 0;
        acc.ASSIGNED += item.status === "ASSIGNED" ? 1 : 0;
        acc.IN_REVIEW += item.status === "IN_REVIEW" ? 1 : 0;
        acc.RESOLVED += item.status === "RESOLVED" ? 1 : 0;
        return acc;
      },
      { PENDING: 0, ASSIGNED: 0, IN_REVIEW: 0, RESOLVED: 0 }
    );
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((item) => item.id));
    });
  }

  async function applySingleStatus(id, status) {
    if (!isAdmin) return;
    setMessage("");
    setError("");
    try {
      await patchComplaintStatus(id, status);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      setMessage(`Updated ${id} to ${status}.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function applyBulkStatus() {
    if (!isAdmin || selectedIds.size === 0) return;

    setIsApplyingBulk(true);
    setMessage("");
    setError("");

    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((itemId) => patchComplaintStatus(itemId, bulkStatus)));
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(item.id)
            ? {
                ...item,
                status: bulkStatus
              }
            : item
        )
      );
      setSelectedIds(new Set());
      setMessage(`Updated ${ids.length} complaints to ${bulkStatus}.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsApplyingBulk(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto h-full relative">
      <main className="p-6 md:p-8 space-y-8 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 enter-up">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
              Admin Queue
            </h2>
            <p className="text-secondary font-medium mt-1">
              Resolve reported civic issues with deliberate, high-confidence actions.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <div className="premium-card card-hover-lift rounded-xl px-4 py-3 min-w-[130px] border-l-4 border-amber-500">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary mb-1">Pending</p>
              <p className="text-2xl font-black font-headline text-on-surface leading-tight">{counts.PENDING}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-xl px-4 py-3 min-w-[130px] border-l-4 border-blue-500">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary mb-1">Assigned</p>
              <p className="text-2xl font-black font-headline text-on-surface leading-tight">{counts.ASSIGNED}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-xl px-4 py-3 min-w-[130px] border-l-4 border-purple-500">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary mb-1">In-Review</p>
              <p className="text-2xl font-black font-headline text-on-surface leading-tight">{counts.IN_REVIEW}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-xl px-4 py-3 min-w-[130px] border-l-4 border-emerald-500">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary mb-1">Resolved</p>
              <p className="text-2xl font-black font-headline text-on-surface leading-tight">{counts.RESOLVED}</p>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="premium-card rounded-xl p-4 text-amber-800 text-sm font-semibold border border-amber-200/70 bg-amber-50/85">
            You are in {userRole} mode. Switch to ADMIN and provide admin password to run queue
            actions.
          </div>
        )}

        {message && (
          <div className="premium-card rounded-xl p-4 text-emerald-700 text-sm font-semibold border border-emerald-200/70 bg-emerald-50/80">
            {message}
          </div>
        )}
        {error && (
          <div className="premium-card rounded-xl p-4 text-red-700 text-sm font-semibold border border-red-200/70 bg-red-50/80">
            {error}
          </div>
        )}

        <div className="glass-panel rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 enter-up">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 pr-4 border-r border-outline-variant/40">
              <input className="rounded w-4 h-4" type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.14em]">Select All</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl text-xs font-semibold px-3 py-2"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value)}
                disabled={!isAdmin || isApplyingBulk}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                className="btn-premium text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60"
                disabled={!isAdmin || selectedIds.size === 0 || isApplyingBulk}
                onClick={applyBulkStatus}
                type="button"
              >
                {isApplyingBulk ? "Applying..." : "Apply To Selected"}
              </button>
            </div>
          </div>
          <p className="text-xs font-semibold text-secondary">Selected: {selectedIds.size} / {items.length}</p>
        </div>

        <div className="table-shell enter-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-outline-variant/15">
                  <th className="py-4 px-4 w-10" />
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">Case ID</th>
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">Issue Type</th>
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">Department</th>
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">Reported</th>
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary">Status</th>
                  <th className="py-4 px-4 text-[0.65rem] uppercase tracking-[0.16em] font-black text-secondary text-right">Fast Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10">
                {isLoading && (
                  <tr>
                    <td className="py-4 px-4 text-sm text-secondary" colSpan={7}>
                      Loading queue...
                    </td>
                  </tr>
                )}

                {!isLoading && !items.length && (
                  <tr>
                    <td className="py-4 px-4 text-sm text-secondary" colSpan={7}>
                      No complaints in queue.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  items.map((item) => (
                    <tr className="row-hover-3d" key={item.id}>
                      <td className="py-3 px-4">
                        <input
                          className="rounded w-4 h-4"
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-bold text-on-surface">{item.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.issueType}</p>
                          <p className="text-[0.65rem] text-secondary">{item.locationText}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-md text-[0.6rem] font-bold uppercase tracking-wider">
                          {item.department || "UNASSIGNED"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-on-surface-variant font-medium">{formatDate(item.createdAt)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusDotClass(item.status)}`} />
                          <span className="text-xs font-bold text-on-surface">{item.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-60"
                            title="Assign"
                            disabled={!isAdmin}
                            onClick={() => applySingleStatus(item.id, "ASSIGNED")}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                          </button>
                          <button
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-60"
                            title="Resolve"
                            disabled={!isAdmin}
                            onClick={() => applySingleStatus(item.id, "RESOLVED")}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">done_all</span>
                          </button>
                          <Link
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors inline-flex"
                            title="Open Detail"
                            to={`/complaint/${item.id}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
