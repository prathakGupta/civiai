import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { uploadImage } from "../controllers/upload.controller.js";
import { createMemoryRateLimiter } from "../middleware/rateLimit.middleware.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

const uploadRateLimiter = createMemoryRateLimiter({
  windowMs: env.UPLOAD_RATE_LIMIT_WINDOW_MS,
  max: env.UPLOAD_RATE_LIMIT_MAX,
  keyBuilder: (req) => req.ip || "anonymous"
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(1, env.UPLOAD_MAX_FILE_MB) * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, HEIC, HEIF.`
      )
    );
  }
});

router.post("/image", uploadRateLimiter, upload.single("image"), uploadImage);

export default router;
