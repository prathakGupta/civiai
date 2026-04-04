import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchImpactOverview, getErrorMessage } from "../api/complaints";
import { Sparkles } from "lucide-react";

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatHours(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}h`;
}

function severityClass(value) {
  if (value === "CRITICAL") return "bg-red-100 text-red-700";
  if (value === "HIGH") return "bg-orange-100 text-orange-700";
  if (value === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function ImpactCenter() {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchImpactOverview({ windowDays: 30 });
        if (!mounted) return;
        setInsights(payload);
      } catch (requestError) {
        if (!mounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const topPriority = useMemo(
    () => (insights?.priorityQueue || [])[0] || null,
    [insights]
  );

  return (
    <div className="flex-1 overflow-y-auto h-full relative p-6 md:p-8 space-y-8">
      <section className="hero-prism premium-card tilt-soft rounded-3xl text-white relative overflow-hidden px-8 py-9 md:px-10 md:py-10 enter-up">
        <div className="absolute -right-8 -top-10 w-44 h-44 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md rotate-[18deg] float-soft" />
        <div className="absolute right-20 bottom-5 w-20 h-20 rounded-2xl border border-white/20 bg-white/10 rotate-[24deg] float-soft" />
        <div className="absolute left-[-32px] bottom-[-38px] w-52 h-52 bg-cyan-300/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6 z-pop">
            <Sparkles className="text-blue-200" size={24} />
            <h3 className="text-[0.74rem] uppercase tracking-[0.24em] font-bold text-blue-100">
              Civic Impact Pulse
            </h3>
          </div>

          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-4/5 bg-white/20 rounded-lg" />
              <div className="h-4 w-full bg-white/15 rounded-lg" />
              <div className="h-4 w-11/12 bg-white/10 rounded-lg" />
            </div>
          )}

          {error && (
            <p className="bg-red-100/90 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {error}
            </p>
          )}

          {!isLoading && !error && insights && (
            <>
              <h4 className="text-2xl md:text-3xl font-semibold mb-4 leading-snug z-pop">
                {insights.narrative?.criticalLine || "Operational signal unavailable right now."}
              </h4>
              <p className="text-blue-100/90 text-[1.02rem] font-medium leading-relaxed mb-7 max-w-3xl">
                {insights.narrative?.hotspotLine} {insights.narrative?.queueLine}
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  className="btn-premium-soft px-6 py-2 rounded-xl text-sm font-semibold"
                  to="/dashboard"
                >
                  Analyze Operations
                </Link>
                <Link
                  className="btn-premium px-6 py-2 rounded-xl text-sm font-semibold"
                  to={topPriority ? `/complaint/${topPriority.id}` : "/queue"}
                >
                  {topPriority ? "Open Top Priority Case" : "Open Admin Queue"}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {!isLoading && !error && insights && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Total Reports</p>
              <p className="text-2xl font-black mt-2">{insights.summary?.total ?? 0}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Open Cases</p>
              <p className="text-2xl font-black mt-2">{insights.summary?.open ?? 0}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Critical Open</p>
              <p className="text-2xl font-black mt-2">{insights.summary?.criticalOpen ?? 0}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Resolution Rate</p>
              <p className="text-2xl font-black mt-2">{formatPercent(insights.summary?.resolutionRate)}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Avg Resolution</p>
              <p className="text-2xl font-black mt-2">{formatHours(insights.summary?.avgResolutionHours)}</p>
            </div>
            <div className="premium-card card-hover-lift rounded-2xl p-4 enter-up">
              <p className="text-xs uppercase tracking-[0.16em] text-secondary font-bold">Verification</p>
              <p className="text-2xl font-black mt-2">{formatPercent(insights.summary?.verificationRate)}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <article className="premium-card card-hover-lift rounded-2xl p-5 enter-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-xl font-black">Top Hotspots</h3>
                <span className="text-xs uppercase tracking-[0.18em] text-secondary font-bold">
                  Cluster Heat
                </span>
              </div>
              <div className="space-y-3">
                {(insights.hotspots || []).map((hotspot) => (
                  <div
                    className="premium-card rounded-xl p-3 border border-slate-200/70 card-hover-lift"
                    key={hotspot.label}
                  >
                    <p className="font-semibold text-on-surface">{hotspot.label}</p>
                    <p className="text-xs text-secondary mt-1">
                      Open: {hotspot.open} | Critical: {hotspot.critical} | Total: {hotspot.total}
                    </p>
                  </div>
                ))}
                {!insights.hotspots?.length && (
                  <p className="text-sm text-secondary">No hotspot data available yet.</p>
                )}
              </div>
            </article>

            <article className="premium-card card-hover-lift rounded-2xl p-5 enter-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-xl font-black">Priority Queue</h3>
                <span className="text-xs uppercase tracking-[0.18em] text-secondary font-bold">
                  Urgency Rank
                </span>
              </div>
              <div className="space-y-3">
                {(insights.priorityQueue || []).map((item) => (
                  <div
                    className="premium-card rounded-xl p-3 border border-slate-200/70 space-y-2 card-hover-lift"
                    key={item.id}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${severityClass(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {item.status}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        Urgency {item.urgencyScore}
                      </span>
                    </div>
                    <p className="font-semibold text-on-surface">{item.locationText}</p>
                    <p className="text-xs text-secondary">
                      {item.issueType} | {item.department} | {item.ageHours}h old
                    </p>
                    <Link className="text-sm text-primary font-semibold hover:underline" to={`/complaint/${item.id}`}>
                      Open detail
                    </Link>
                  </div>
                ))}
                {!insights.priorityQueue?.length && (
                  <p className="text-sm text-secondary">No active priority queue right now.</p>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
