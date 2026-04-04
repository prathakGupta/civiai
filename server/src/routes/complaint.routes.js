import { Router } from "express";
import {
  createComplaint,
  getComplaintById,
  listComplaints,
  submitWorkerProgress,
  updateComplaintStatus,
  verifyComplaintResolution
} from "../controllers/complaint.controller.js";
import {
  requireAuth,
  requireAuthIfAdmin,
  requireRole
} from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createComplaint));
router.get("/", asyncHandler(listComplaints));
router.get("/:id", asyncHandler(getComplaintById));
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(updateComplaintStatus)
);
router.post(
  "/:id/verify",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(verifyComplaintResolution)
);
router.post(
  "/:id/progress",
  requireRole("WORKER", "ADMIN"),
  requireAuthIfAdmin,
  asyncHandler(submitWorkerProgress)
);

export default router;
