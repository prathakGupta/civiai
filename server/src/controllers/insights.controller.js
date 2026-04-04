import { z } from "zod";
import { getRuntimeDeps } from "../lib/runtime-deps.js";
import { ApiError } from "../utils/ApiError.js";
import { buildImpactInsights } from "../services/insights.service.js";

const insightsQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(7).max(180).default(30)
});

export async function getImpactOverview(req, res) {
  const { prisma } = getRuntimeDeps();
  const parsed = insightsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new ApiError(400, message || "Invalid query parameters");
  }

  const { windowDays } = parsed.data;

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      verification: {
        select: {
          verificationConfidence: true,
          verificationStatus: true
        }
      }
    }
  });

  const data = buildImpactInsights(complaints, windowDays);

  res.json({
    success: true,
    data
  });
}
