import test from "node:test";
import assert from "node:assert/strict";
import { buildImpactInsights, calculateUrgencyScore } from "../src/services/insights.service.js";

function complaintFixture(overrides = {}) {
  return {
    id: `c_${Math.random().toString(36).slice(2)}`,
    locationText: "MG Road, Bengaluru",
    latitude: 12.9716,
    longitude: 77.5946,
    issueType: "POTHOLE",
    severity: "MEDIUM",
    status: "PENDING",
    department: "Roads",
    aiConfidence: 0.8,
    createdAt: "2026-03-20T12:00:00.000Z",
    updatedAt: "2026-03-20T12:00:00.000Z",
    verification: null,
    ...overrides
  };
}

test("calculateUrgencyScore increases with severity and age", () => {
  const now = new Date("2026-04-03T12:00:00.000Z");
  const low = complaintFixture({
    severity: "LOW",
    createdAt: "2026-04-03T06:00:00.000Z"
  });
  const critical = complaintFixture({
    severity: "CRITICAL",
    createdAt: "2026-04-01T06:00:00.000Z"
  });

  const lowScore = calculateUrgencyScore(low, now);
  const criticalScore = calculateUrgencyScore(critical, now);

  assert.ok(criticalScore.score > lowScore.score);
});

test("buildImpactInsights returns top hotspots and priority queue", () => {
  const complaints = [
    complaintFixture({
      id: "one",
      locationText: "Central Market, Zone A",
      severity: "CRITICAL",
      status: "PENDING",
      createdAt: "2026-03-30T12:00:00.000Z"
    }),
    complaintFixture({
      id: "two",
      locationText: "Central Market, Zone A",
      severity: "HIGH",
      status: "IN_REVIEW",
      createdAt: "2026-03-28T12:00:00.000Z"
    }),
    complaintFixture({
      id: "three",
      locationText: "Lake Road, Sector 4",
      severity: "LOW",
      status: "RESOLVED",
      createdAt: "2026-03-20T12:00:00.000Z",
      updatedAt: "2026-03-22T12:00:00.000Z",
      verification: { verificationConfidence: 0.82, verificationStatus: "RESOLVED" }
    })
  ];

  const insights = buildImpactInsights(complaints, 30, new Date("2026-04-03T12:00:00.000Z"));

  assert.equal(insights.summary.total, 3);
  assert.equal(insights.summary.open, 2);
  assert.equal(insights.hotspots.length > 0, true);
  assert.equal(insights.priorityQueue.length > 0, true);
  assert.equal(insights.narrative.headline, "Civic Impact Pulse");
});
