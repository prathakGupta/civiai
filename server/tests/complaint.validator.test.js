import test from "node:test";
import assert from "node:assert/strict";
import {
  complaintIdParamSchema,
  createComplaintSchema,
  listComplaintsQuerySchema,
  updateStatusSchema,
  verifyComplaintSchema
} from "../src/validators/complaint.validator.js";

test("createComplaintSchema accepts valid complaint payload", () => {
  const payload = {
    imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    imagePublicId: "civiai/sample",
    imageMimeType: "image/jpeg",
    locationText: "MG Road, Bengaluru",
    latitude: "12.9716",
    longitude: "77.5946",
    description: "Water leakage near junction",
    reportedByName: "Ravi Kumar",
    reportedByEmail: "ravi@example.com"
  };

  const parsed = createComplaintSchema.parse(payload);

  assert.equal(parsed.locationText, "MG Road, Bengaluru");
  assert.equal(parsed.latitude, 12.9716);
  assert.equal(parsed.longitude, 77.5946);
});

test("createComplaintSchema rejects invalid email", () => {
  const payload = {
    imageUrl: "https://example.com/image.jpg",
    locationText: "Brigade Road",
    reportedByEmail: "not-an-email"
  };

  const result = createComplaintSchema.safeParse(payload);
  assert.equal(result.success, false);
});

test("complaintIdParamSchema requires non-empty id", () => {
  const valid = complaintIdParamSchema.safeParse({ id: "cm123" });
  const invalid = complaintIdParamSchema.safeParse({ id: "   " });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("updateStatusSchema allows only valid status values", () => {
  const valid = updateStatusSchema.safeParse({ status: "IN_REVIEW" });
  const invalid = updateStatusSchema.safeParse({ status: "DONE" });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("listComplaintsQuerySchema applies pagination defaults", () => {
  const parsed = listComplaintsQuerySchema.parse({});

  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
});

test("listComplaintsQuerySchema coerces query strings to numbers", () => {
  const parsed = listComplaintsQuerySchema.parse({ page: "2", limit: "10" });

  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 10);
});

test("verifyComplaintSchema requires a valid after image url", () => {
  const valid = verifyComplaintSchema.safeParse({
    afterImageUrl: "https://example.com/after.jpg"
  });
  const invalid = verifyComplaintSchema.safeParse({
    afterImageUrl: "invalid-url"
  });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});
