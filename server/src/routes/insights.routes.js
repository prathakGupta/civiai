import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getImpactOverview } from "../controllers/insights.controller.js";

const router = Router();

router.get("/overview", asyncHandler(getImpactOverview));

export default router;
