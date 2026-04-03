import { z } from "zod";

const complaintStatusEnum = z.enum([
  "PENDING",
  "IN_REVIEW",
  "ASSIGNED",
  "RESOLVED",
  "REJECTED"
]);

const issueTypeEnum = z.enum([
  "GARBAGE",
  "POTHOLE",
  "WATER_LEAK",
  "STREETLIGHT",
  "DRAINAGE",
  "ROAD_DAMAGE",
  "UNKNOWN"
]);

const severityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const nonEmptyOptionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export const createComplaintSchema = z.object({
  imageUrl: z.string().url(),
  imagePublicId: nonEmptyOptionalString,
  imageMimeType: nonEmptyOptionalString,
  locationText: z.string().trim().min(2),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  description: nonEmptyOptionalString,
  reportedByName: nonEmptyOptionalString,
  reportedByEmail: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().email().optional())
});

export const updateStatusSchema = z.object({
  status: complaintStatusEnum
});

export const complaintIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const listComplaintsQuerySchema = z.object({
  status: complaintStatusEnum.optional(),
  issueType: issueTypeEnum.optional(),
  severity: severityEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const verifyComplaintSchema = z.object({
  afterImageUrl: z.string().url(),
  afterImagePublicId: nonEmptyOptionalString,
  afterImageMimeType: nonEmptyOptionalString
});

export const workerProgressSchema = z.object({
  progressNote: z.string().trim().min(3).max(1000),
  status: complaintStatusEnum
    .refine((value) => value === "ASSIGNED" || value === "IN_REVIEW" || value === "RESOLVED", {
      message: "status must be ASSIGNED, IN_REVIEW, or RESOLVED"
    })
    .optional()
});
