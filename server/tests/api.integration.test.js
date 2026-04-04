import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createInMemoryPrisma } from "./helpers/inMemoryPrisma.js";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://user:pass@localhost:5432/civiai_test?schema=public";
process.env.AUTH_ENABLED = "true";
process.env.ADMIN_PASSWORD = "integration-test-password";

const [{ default: app }, runtimeDepsModule] = await Promise.all([
  import("../src/app.js"),
  import("../src/lib/runtime-deps.js")
]);

const { __setRuntimeDepsForTests, __resetRuntimeDepsForTests } = runtimeDepsModule;

test("integration: create, list, detail, status, worker progress, verify, insights", async (t) => {
  const { prisma, store } = createInMemoryPrisma();

  __setRuntimeDepsForTests({
    prisma,
    classifyComplaintImage: async () => ({
      issueType: "POTHOLE",
      severity: "HIGH",
      department: "Roads",
      summary: "Road surface failure detected near lane edge.",
      confidence: 0.91
    }),
    verifyBeforeAfter: async () => ({
      verificationStatus: "RESOLVED",
      summary: "After image indicates issue has been fixed.",
      confidence: 0.89
    })
  });

  t.after(() => {
    __resetRuntimeDepsForTests();
  });

  const createPayloadA = {
    imageUrl: "https://example.com/before-a.jpg",
    imageMimeType: "image/jpeg",
    locationText: "MG Road, Bengaluru",
    description: "Large pothole near bus stop",
    reportedByName: "Asha",
    reportedByEmail: "asha@example.com"
  };

  const createPayloadB = {
    imageUrl: "https://example.com/before-b.jpg",
    imageMimeType: "image/jpeg",
    locationText: "Church Street, Bengaluru",
    description: "Dangerous road damage",
    reportedByName: "Ravi",
    reportedByEmail: "ravi@example.com"
  };

  const createA = await request(app).post("/api/v1/complaints").send(createPayloadA);
  assert.equal(createA.status, 201);
  assert.equal(createA.body.success, true);
  assert.equal(createA.body.data.issueType, "POTHOLE");
  assert.equal(createA.body.data.severity, "HIGH");
  assert.equal(createA.body.data.status, "PENDING");

  const createB = await request(app).post("/api/v1/complaints").send(createPayloadB);
  assert.equal(createB.status, 201);
  assert.equal(createB.body.success, true);

  const complaintId = createA.body.data.id;
  assert.equal(store.complaints.length, 2);

  const listResponse = await request(app)
    .get("/api/v1/complaints")
    .query({ status: "PENDING", page: "1", limit: "10" });

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.success, true);
  assert.equal(listResponse.body.meta.total, 2);
  assert.equal(listResponse.body.data.length, 2);

  const detailResponse = await request(app).get(`/api/v1/complaints/${complaintId}`);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.success, true);
  assert.equal(detailResponse.body.data.id, complaintId);
  assert.equal(detailResponse.body.data.auditLogs.length, 1);
  assert.equal(detailResponse.body.data.auditLogs[0].action, "COMPLAINT_CREATED");

  const noAuthStatusUpdate = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .send({ status: "ASSIGNED" });
  assert.equal(noAuthStatusUpdate.status, 401);

  const wrongRoleStatusUpdate = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set("x-admin-password", "integration-test-password")
    .set("x-user-role", "CITIZEN")
    .send({ status: "ASSIGNED" });
  assert.equal(wrongRoleStatusUpdate.status, 403);

  const statusUpdate = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set("x-admin-password", "integration-test-password")
    .set("x-user-role", "ADMIN")
    .send({ status: "ASSIGNED" });

  assert.equal(statusUpdate.status, 200);
  assert.equal(statusUpdate.body.success, true);
  assert.equal(statusUpdate.body.data.status, "ASSIGNED");

  const workerProgress = await request(app)
    .post(`/api/v1/complaints/${complaintId}/progress`)
    .set("x-user-role", "WORKER")
    .set("x-worker-name", "Field Agent Asha")
    .send({
      progressNote: "Visited location and marked area for repair. Crew scheduled for tonight.",
      status: "IN_REVIEW"
    });

  assert.equal(workerProgress.status, 200);
  assert.equal(workerProgress.body.success, true);
  assert.equal(workerProgress.body.data.status, "IN_REVIEW");

  const verifyResponse = await request(app)
    .post(`/api/v1/complaints/${complaintId}/verify`)
    .set("x-admin-password", "integration-test-password")
    .set("x-user-role", "ADMIN")
    .send({
      afterImageUrl: "https://example.com/after-a.jpg",
      afterImageMimeType: "image/jpeg"
    });

  assert.equal(verifyResponse.status, 200);
  assert.equal(verifyResponse.body.success, true);
  assert.equal(
    verifyResponse.body.data.verification.verificationStatus,
    "RESOLVED"
  );
  assert.equal(verifyResponse.body.data.complaint.status, "RESOLVED");

  const detailAfterVerify = await request(app).get(`/api/v1/complaints/${complaintId}`);
  assert.equal(detailAfterVerify.status, 200);
  assert.equal(
    detailAfterVerify.body.data.verification.verificationStatus,
    "RESOLVED"
  );
  assert.ok(detailAfterVerify.body.data.auditLogs.length >= 3);

  const insights = await request(app)
    .get("/api/v1/insights/overview")
    .query({ windowDays: "30" });

  assert.equal(insights.status, 200);
  assert.equal(insights.body.success, true);
  assert.equal(insights.body.data.summary.total, 2);
  assert.ok(Array.isArray(insights.body.data.hotspots));
  assert.ok(Array.isArray(insights.body.data.priorityQueue));
  assert.equal(typeof insights.body.data.narrative.headline, "string");
});
