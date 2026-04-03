import express from "express";
import crypto from "crypto";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes.js";
import aiTestRoutes from "./routes/ai-test.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { attachAuthContext } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Add request ID and logging
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  console.log(`[${new Date().toISOString()}] [ReqID: ${req.id}] ${req.method} ${req.url}`);
  next();
});

app.use(attachAuthContext);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/ai-test", aiTestRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/insights", insightsRoutes);
app.get("/health", (req, res) => {
  res.json({ success: true, message: "CiviAI API running" });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
