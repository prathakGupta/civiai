import { ApiError } from "../utils/ApiError.js";

export function createMemoryRateLimiter({
  windowMs = 60_000,
  max = 20,
  keyBuilder
} = {}) {
  const hits = new Map();

  return function memoryRateLimiter(req, res, next) {
    const now = Date.now();
    const key = keyBuilder ? keyBuilder(req) : req.ip || "anonymous";
    const timestamps = hits.get(key) || [];
    const recentTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (recentTimestamps.length >= max) {
      return next(
        new ApiError(
          429,
          `Too many requests. Try again in ${Math.ceil(windowMs / 1000)} seconds.`
        )
      );
    }

    recentTimestamps.push(now);
    hits.set(key, recentTimestamps);
    return next();
  };
}
