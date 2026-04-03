import { getRuntimeDeps } from "../lib/runtime-deps.js";
import {
  complaintIdParamSchema,
  createComplaintSchema,
  listComplaintsQuerySchema,
  updateStatusSchema,
  verifyComplaintSchema,
  workerProgressSchema
} from "../validators/complaint.validator.js";
import { ApiError } from "../utils/ApiError.js";

const ISSUE_TYPES = new Set([
  "GARBAGE",
  "POTHOLE",
  "WATER_LEAK",
  "STREETLIGHT",
  "DRAINAGE",
  "ROAD_DAMAGE",
  "UNKNOWN"
]);

const SEVERITY_LEVELS = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const VERIFICATION_STATUSES = new Set(["RESOLVED", "UNRESOLVED", "UNCLEAR"]);
const WORKER_PROGRESS_ELIGIBLE_STATUSES = new Set(["ASSIGNED", "IN_REVIEW"]);
const TX_OPTIONS = {
  maxWait: 15_000,
  timeout: 30_000
};

function parseOrThrow(schema, input) {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const key = issue.path.length > 0 ? issue.path.join(".") : "input";
        return `${key}: ${issue.message}`;
      })
      .join("; ");

    throw new ApiError(400, message);
  }

  return parsed.data;
}

function normalizeEnum(value, allowedValues, fallback) {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toUpperCase();
  return allowedValues.has(normalized) ? normalized : fallback;
}

function normalizeOptionalText(value) {
  if (typeof value !== "string") return null;

  const text = value.trim();
  return text.length > 0 ? text : null;
}

function normalizeConfidence(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(1, numeric));
}

export async function createComplaint(req, res) {
  const { prisma, classifyComplaintImage } = getRuntimeDeps();
  const payload = parseOrThrow(createComplaintSchema, req.body);

  const aiResult = await classifyComplaintImage(
    payload.imageUrl,
    payload.imageMimeType || "image/jpeg"
  );

  const issueType = normalizeEnum(aiResult?.issueType, ISSUE_TYPES, "UNKNOWN");
  const severity = normalizeEnum(aiResult?.severity, SEVERITY_LEVELS, "MEDIUM");
  const department = normalizeOptionalText(aiResult?.department);
  const aiSummary = normalizeOptionalText(aiResult?.summary);
  const aiConfidence = normalizeConfidence(aiResult?.confidence);

  const complaint = await prisma.$transaction(
    async (tx) => {
      const created = await tx.complaint.create({
        data: {
          ...payload,
          issueType,
          severity,
          department,
          aiSummary,
          aiConfidence,
          aiRawJson: aiResult
        }
      });

      await tx.complaintAuditLog.create({
        data: {
          complaintId: created.id,
          action: "COMPLAINT_CREATED",
          newValue: {
            status: created.status,
            issueType: created.issueType,
            severity: created.severity
          }
        }
      });

      return created;
    },
    TX_OPTIONS
  );

  res.status(201).json({
    success: true,
    data: complaint
  });
}

export async function listComplaints(req, res) {
  const { prisma } = getRuntimeDeps();
  const query = parseOrThrow(listComplaintsQuerySchema, req.query);
  const { page, limit, status, severity, issueType } = query;

  const where = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (issueType) where.issueType = issueType;

  const skip = (page - 1) * limit;

  const complaintsPromise = prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit
  });
  const totalPromise = prisma.complaint.count({ where });

  const [complaints, total] = await Promise.all([
    complaintsPromise,
    totalPromise
  ]);

  res.json({
    success: true,
    data: complaints,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

export async function getComplaintById(req, res) {
  const { prisma } = getRuntimeDeps();
  const { id } = parseOrThrow(complaintIdParamSchema, req.params);

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      verification: true,
      auditLogs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  res.json({
    success: true,
    data: complaint
  });
}

export async function updateComplaintStatus(req, res) {
  const { prisma } = getRuntimeDeps();
  const { id } = parseOrThrow(complaintIdParamSchema, req.params);
  const { status } = parseOrThrow(updateStatusSchema, req.body);

  const existing = await prisma.complaint.findUnique({
    where: { id },
    select: { id: true, status: true }
  });

  if (!existing) {
    throw new ApiError(404, "Complaint not found");
  }

  if (existing.status === status) {
    const complaint = await prisma.complaint.findUnique({ where: { id } });

    res.json({
      success: true,
      data: complaint,
      message: "Status is already set to requested value"
    });
    return;
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: { status }
      });

      await tx.complaintAuditLog.create({
        data: {
          complaintId: id,
          action: "STATUS_UPDATED",
          oldValue: { status: existing.status },
          newValue: { status }
        }
      });

      return complaint;
    },
    TX_OPTIONS
  );

  res.json({
    success: true,
    data: updated
  });
}

export async function verifyComplaintResolution(req, res) {
  const { prisma, verifyBeforeAfter } = getRuntimeDeps();
  const { id } = parseOrThrow(complaintIdParamSchema, req.params);
  const payload = parseOrThrow(verifyComplaintSchema, req.body);

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      imageUrl: true,
      imageMimeType: true
    }
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  const aiResult = await verifyBeforeAfter({
    beforeImageUrl: complaint.imageUrl,
    beforeImageMimeType: complaint.imageMimeType || "image/jpeg",
    afterImageUrl: payload.afterImageUrl,
    afterImageMimeType: payload.afterImageMimeType || "image/jpeg"
  });

  const verificationStatus = normalizeEnum(
    aiResult?.verificationStatus,
    VERIFICATION_STATUSES,
    "UNCLEAR"
  );
  const verificationSummary = normalizeOptionalText(aiResult?.summary);
  const verificationConfidence = normalizeConfidence(aiResult?.confidence);

  const result = await prisma.$transaction(
    async (tx) => {
      const verification = await tx.complaintVerification.upsert({
        where: { complaintId: id },
        create: {
          complaintId: id,
          beforeImageUrl: complaint.imageUrl,
          afterImageUrl: payload.afterImageUrl,
          afterImagePublicId: payload.afterImagePublicId,
          afterImageMimeType: payload.afterImageMimeType || "image/jpeg",
          verificationStatus,
          verificationSummary,
          verificationConfidence,
          aiRawJson: aiResult
        },
        update: {
          beforeImageUrl: complaint.imageUrl,
          afterImageUrl: payload.afterImageUrl,
          afterImagePublicId: payload.afterImagePublicId,
          afterImageMimeType: payload.afterImageMimeType || "image/jpeg",
          verificationStatus,
          verificationSummary,
          verificationConfidence,
          aiRawJson: aiResult
        }
      });

      await tx.complaintAuditLog.create({
        data: {
          complaintId: id,
          action: "VERIFICATION_UPDATED",
          newValue: {
            verificationStatus,
            verificationSummary,
            verificationConfidence
          }
        }
      });

      let updatedComplaint = null;

      if (verificationStatus === "RESOLVED" && complaint.status !== "RESOLVED") {
        updatedComplaint = await tx.complaint.update({
          where: { id },
          data: { status: "RESOLVED" }
        });

        await tx.complaintAuditLog.create({
          data: {
            complaintId: id,
            action: "STATUS_UPDATED",
            oldValue: { status: complaint.status },
            newValue: { status: "RESOLVED" }
          }
        });
      } else {
        updatedComplaint = await tx.complaint.findUnique({ where: { id } });
      }

      return {
        complaint: updatedComplaint,
        verification
      };
    },
    TX_OPTIONS
  );

  res.json({
    success: true,
    data: result
  });
}

export async function submitWorkerProgress(req, res) {
  const { prisma } = getRuntimeDeps();
  const { id } = parseOrThrow(complaintIdParamSchema, req.params);
  const payload = parseOrThrow(workerProgressSchema, req.body);

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: {
      id: true,
      status: true
    }
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  if (!WORKER_PROGRESS_ELIGIBLE_STATUSES.has(complaint.status)) {
    throw new ApiError(
      400,
      "Worker progress can only be submitted for ASSIGNED or IN_REVIEW complaints"
    );
  }

  const nextStatus = payload.status || complaint.status;
  const workerName = req.auth?.workerName || "Worker";

  const updatedComplaint = await prisma.$transaction(
    async (tx) => {
      let currentComplaint = complaint;

      if (nextStatus !== complaint.status) {
        currentComplaint = await tx.complaint.update({
          where: { id },
          data: { status: nextStatus },
          select: { id: true, status: true }
        });

        await tx.complaintAuditLog.create({
          data: {
            complaintId: id,
            action: "STATUS_UPDATED",
            oldValue: { status: complaint.status },
            newValue: { status: nextStatus, source: "WORKER_PROGRESS" }
          }
        });
      }

      await tx.complaintAuditLog.create({
        data: {
          complaintId: id,
          action: "WORKER_PROGRESS_SUBMITTED",
          newValue: {
            workerName,
            note: payload.progressNote,
            status: currentComplaint.status
          }
        }
      });

      return tx.complaint.findUnique({
        where: { id },
        include: {
          verification: true,
          auditLogs: {
            orderBy: { createdAt: "desc" }
          }
        }
      });
    },
    TX_OPTIONS
  );

  res.json({
    success: true,
    data: updatedComplaint,
    message: "Worker progress submitted"
  });
}
