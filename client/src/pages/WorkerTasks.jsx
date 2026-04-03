import { useEffect, useMemo, useState } from "react";
import {
  fetchComplaints,
  getErrorMessage,
  submitWorkerProgress
} from "../api/complaints";
import { getUserRole, getWorkerName } from "../lib/auth";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function statusClass(value) {
  if (value === "ASSIGNED") return "bg-blue-100 text-blue-800";
  if (value === "IN_REVIEW") return "bg-purple-100 text-purple-800";
  if (value === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}

export default function WorkerTasks() {
  const role = getUserRole();
  const workerName = getWorkerName();
  const canSubmitProgress = role === "WORKER" || role === "ADMIN";

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [noteById, setNoteById] = useState({});
  const [statusById, setStatusById] = useState({});
  const [savingId, setSavingId] = useState("");

  async function loadWorkerTasks() {
    setIsLoading(true);
    setError("");

    try {
      const [assigned, inReview] = await Promise.all([
        fetchComplaints({ status: "ASSIGNED", page: 1, limit: 100 }),
        fetchComplaints({ status: "IN_REVIEW", page: 1, limit: 100 })
      ]);

      const seen = new Set();
      const merged = [...assigned.items, ...inReview.items].filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      setItems(merged);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkerTasks();
  }, []);

  const grouped = useMemo(() => {
    return {
      assigned: items.filter((item) => item.status === "ASSIGNED"),
      inReview: items.filter((item) => item.status === "IN_REVIEW")
    };
  }, [items]);

  async function handleSubmitProgress(complaintId) {
    if (!canSubmitProgress) return;

    const progressNote = (noteById[complaintId] || "").trim();
    const nextStatus = statusById[complaintId] || "IN_REVIEW";

    setMessage("");
    setError("");

    if (!progressNote) {
      setError("Please add a progress note before submitting.");
      return;
    }

    setSavingId(complaintId);

    try {
      const updated = await submitWorkerProgress(complaintId, {
        progressNote,
        status: nextStatus
      });

      setItems((prev) =>
        prev
          .map((item) => (item.id === complaintId ? updated : item))
          .filter((item) => item.status === "ASSIGNED" || item.status === "IN_REVIEW")
      );

      setNoteById((prev) => ({ ...prev, [complaintId]: "" }));
      setMessage(`Progress submitted for ${complaintId}.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8">
      <div className="max-w-[1320px] mx-auto space-y-6">
        <section className="premium-card rounded-3xl p-6 md:p-7 enter-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-headline">
                Worker Taskboard
              </h1>
              <p className="text-secondary mt-1">
                Track assigned field tasks and submit on-ground progress updates.
              </p>
            </div>
            <div className="premium-card rounded-xl px-4 py-2 text-xs uppercase tracking-[0.16em] text-secondary font-bold">
              Worker: {workerName || "Unnamed Worker"}
            </div>
          </div>
        </section>

        {!canSubmitProgress && (
          <section className="premium-card rounded-xl p-4 text-amber-800 text-sm font-semibold border border-amber-200/70 bg-amber-50/85">
            Switch role to WORKER (or ADMIN) from the top bar to submit task progress.
          </section>
        )}

        {message && (
          <section className="premium-card rounded-xl p-4 text-emerald-700 text-sm font-semibold border border-emerald-200/70 bg-emerald-50/80">
            {message}
          </section>
        )}

        {error && (
          <section className="premium-card rounded-xl p-4 text-red-700 text-sm font-semibold border border-red-200/70 bg-red-50/80">
            {error}
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card card-hover-lift rounded-2xl p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary">
              Assigned Tasks
            </p>
            <p className="text-3xl font-black font-headline mt-1">
              {grouped.assigned.length}
            </p>
          </div>
          <div className="premium-card card-hover-lift rounded-2xl p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.16em] font-bold text-secondary">
              In Review
            </p>
            <p className="text-3xl font-black font-headline mt-1">
              {grouped.inReview.length}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {isLoading && (
            <div className="premium-card rounded-2xl p-6 text-sm text-secondary">
              Loading worker tasks...
            </div>
          )}

          {!isLoading && !items.length && (
            <div className="premium-card rounded-2xl p-6 text-sm text-secondary">
              No assigned tasks right now.
            </div>
          )}

          {!isLoading &&
            items.map((item) => (
              <article
                className="premium-card card-hover-lift rounded-2xl p-5 space-y-4"
                key={item.id}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-on-surface">{item.issueType}</p>
                    <p className="text-xs text-secondary mt-1">
                      {item.id} | {item.locationText}
                    </p>
                    <p className="text-xs text-secondary mt-1">
                      Reported {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${statusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.14em] font-bold text-secondary">
                      Progress Note
                    </span>
                    <textarea
                      className="mt-2 block w-full rounded-xl p-2.5 text-sm min-h-[90px]"
                      placeholder="Add what was completed on-ground and what is pending."
                      value={noteById[item.id] || ""}
                      onChange={(event) =>
                        setNoteById((prev) => ({
                          ...prev,
                          [item.id]: event.target.value
                        }))
                      }
                      disabled={!canSubmitProgress || savingId === item.id}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.14em] font-bold text-secondary">
                      Next Status
                    </span>
                    <select
                      className="mt-2 rounded-xl p-2.5 text-sm min-w-[160px]"
                      value={statusById[item.id] || "IN_REVIEW"}
                      onChange={(event) =>
                        setStatusById((prev) => ({
                          ...prev,
                          [item.id]: event.target.value
                        }))
                      }
                      disabled={!canSubmitProgress || savingId === item.id}
                    >
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </label>

                  <button
                    className="btn-premium px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                    type="button"
                    onClick={() => handleSubmitProgress(item.id)}
                    disabled={!canSubmitProgress || savingId === item.id}
                  >
                    {savingId === item.id ? "Submitting..." : "Submit Progress"}
                  </button>
                </div>
              </article>
            ))}
        </section>
      </div>
    </div>
  );
}
