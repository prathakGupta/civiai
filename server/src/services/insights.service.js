const OPEN_STATUSES = new Set(["PENDING", "IN_REVIEW", "ASSIGNED"]);
const SEVERITY_WEIGHTS = {
  LOW: 20,
  MEDIUM: 45,
  HIGH: 70,
  CRITICAL: 100
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hoursBetween(fromDate, toDate) {
  return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
}

function normalizeLocationLabel(complaint) {
  if (typeof complaint.latitude === "number" && typeof complaint.longitude === "number") {
    const latBucket = complaint.latitude.toFixed(2);
    const lonBucket = complaint.longitude.toFixed(2);
    return `Geo ${latBucket}, ${lonBucket}`;
  }

  const location = (complaint.locationText || "Unknown Location").trim();
  if (!location) return "Unknown Location";
  const [firstSegment] = location.split(",");
  return firstSegment.trim() || "Unknown Location";
}

export function calculateUrgencyScore(complaint, now = new Date()) {
  const severityBase = SEVERITY_WEIGHTS[complaint.severity] ?? 35;
  const ageHours = Math.max(0, hoursBetween(new Date(complaint.createdAt), now));
  const ageFactor = clamp(ageHours / 3, 0, 60);
  const statusBoost = complaint.status === "PENDING" ? 15 : complaint.status === "IN_REVIEW" ? 8 : 0;
  const confidenceBoost =
    typeof complaint.aiConfidence === "number"
      ? clamp((1 - complaint.aiConfidence) * 15, 0, 15)
      : 6;

  const score = Math.round(severityBase + ageFactor + statusBoost + confidenceBoost);

  return {
    score,
    ageHours: Math.round(ageHours)
  };
}

function buildHotspots(complaints) {
  const hotspotMap = new Map();

  for (const complaint of complaints) {
    const key = normalizeLocationLabel(complaint);

    if (!hotspotMap.has(key)) {
      hotspotMap.set(key, {
        label: key,
        total: 0,
        open: 0,
        critical: 0
      });
    }

    const bucket = hotspotMap.get(key);
    bucket.total += 1;
    bucket.open += OPEN_STATUSES.has(complaint.status) ? 1 : 0;
    bucket.critical += complaint.severity === "CRITICAL" ? 1 : 0;
  }

  return Array.from(hotspotMap.values())
    .sort((a, b) => b.open - a.open || b.total - a.total || b.critical - a.critical)
    .slice(0, 5);
}

function buildDepartmentLoad(complaints) {
  const departmentMap = new Map();

  for (const complaint of complaints) {
    const department = complaint.department?.trim() || "UNASSIGNED";
    if (!departmentMap.has(department)) {
      departmentMap.set(department, {
        department,
        total: 0,
        open: 0,
        resolved: 0
      });
    }

    const bucket = departmentMap.get(department);
    bucket.total += 1;
    bucket.open += OPEN_STATUSES.has(complaint.status) ? 1 : 0;
    bucket.resolved += complaint.status === "RESOLVED" ? 1 : 0;
  }

  return Array.from(departmentMap.values()).sort((a, b) => b.open - a.open || b.total - a.total);
}

function buildPriorityQueue(complaints, now) {
  return complaints
    .filter((complaint) => OPEN_STATUSES.has(complaint.status))
    .map((complaint) => {
      const urgency = calculateUrgencyScore(complaint, now);
      return {
        id: complaint.id,
        locationText: complaint.locationText,
        issueType: complaint.issueType,
        severity: complaint.severity,
        status: complaint.status,
        urgencyScore: urgency.score,
        ageHours: urgency.ageHours,
        department: complaint.department || "UNASSIGNED"
      };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore || b.ageHours - a.ageHours)
    .slice(0, 5);
}

function buildImpactNarrative(summary, topHotspot, priorityQueue) {
  const criticalLine =
    summary.criticalOpen > 0
      ? `${summary.criticalOpen} critical incidents are still unresolved.`
      : "No critical unresolved incidents right now.";

  const hotspotLine = topHotspot
    ? `Highest pressure zone is ${topHotspot.label} with ${topHotspot.open} open complaints.`
    : "Hotspot distribution is currently stable.";

  const queueLine = priorityQueue[0]
    ? `Top priority is ${priorityQueue[0].issueType} at ${priorityQueue[0].locationText} (urgency ${priorityQueue[0].urgencyScore}).`
    : "No active priority queue at the moment.";

  return {
    headline: "Civic Impact Pulse",
    criticalLine,
    hotspotLine,
    queueLine
  };
}

export function buildImpactInsights(complaints, windowDays = 30, now = new Date()) {
  const total = complaints.length;
  const open = complaints.filter((item) => OPEN_STATUSES.has(item.status)).length;
  const resolved = complaints.filter((item) => item.status === "RESOLVED").length;
  const rejected = complaints.filter((item) => item.status === "REJECTED").length;
  const criticalOpen = complaints.filter(
    (item) => OPEN_STATUSES.has(item.status) && item.severity === "CRITICAL"
  ).length;

  const resolvedComplaints = complaints.filter((item) => item.status === "RESOLVED");
  const avgResolutionHours =
    resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((acc, complaint) => {
          const createdAt = new Date(complaint.createdAt);
          const updatedAt = new Date(complaint.updatedAt);
          return acc + Math.max(0, hoursBetween(createdAt, updatedAt));
        }, 0) / resolvedComplaints.length
      : null;

  const verificationConfidenceValues = complaints
    .map((complaint) => complaint.verification?.verificationConfidence)
    .filter((value) => typeof value === "number");

  const verificationRate = total
    ? (complaints.filter((complaint) => Boolean(complaint.verification)).length / total) * 100
    : 0;

  const avgVerificationConfidence =
    verificationConfidenceValues.length > 0
      ? verificationConfidenceValues.reduce((a, b) => a + b, 0) / verificationConfidenceValues.length
      : null;

  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);
  const recentComplaints = complaints.filter(
    (complaint) => new Date(complaint.createdAt).getTime() >= windowStart.getTime()
  );

  const hotspots = buildHotspots(complaints);
  const departmentLoad = buildDepartmentLoad(complaints).slice(0, 6);
  const priorityQueue = buildPriorityQueue(complaints, now);
  const narrative = buildImpactNarrative(
    { criticalOpen },
    hotspots[0],
    priorityQueue
  );

  return {
    summary: {
      total,
      open,
      resolved,
      rejected,
      criticalOpen,
      resolutionRate: total ? (resolved / total) * 100 : 0,
      avgResolutionHours,
      verificationRate,
      avgVerificationConfidence,
      complaintsLastWindow: recentComplaints.length,
      windowDays
    },
    hotspots,
    departmentLoad,
    priorityQueue,
    narrative
  };
}
