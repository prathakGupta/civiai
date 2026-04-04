import dotenv from "dotenv";

dotenv.config();

function parseBoolean(value, fallback = true) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  AUTH_ENABLED: parseBoolean(process.env.AUTH_ENABLED, true),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || process.env.AUTH_API_KEY,
  UPLOAD_MAX_FILE_MB: parseInteger(process.env.UPLOAD_MAX_FILE_MB, 8),
  UPLOAD_RATE_LIMIT_WINDOW_MS: parseInteger(
    process.env.UPLOAD_RATE_LIMIT_WINDOW_MS,
    60_000
  ),
  UPLOAD_RATE_LIMIT_MAX: parseInteger(process.env.UPLOAD_RATE_LIMIT_MAX, 20),
  JWT_SECRET: process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret"
};
