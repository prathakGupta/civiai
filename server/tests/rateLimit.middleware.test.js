import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRateLimiter } from "../src/middleware/rateLimit.middleware.js";

test("memory rate limiter allows requests within threshold", () => {
  const limiter = createMemoryRateLimiter({
    windowMs: 1000,
    max: 2,
    keyBuilder: () => "same-client"
  });

  const req = { ip: "127.0.0.1" };
  const res = {};

  let calledWithError = null;

  limiter(req, res, (error) => {
    calledWithError = error || null;
  });
  limiter(req, res, (error) => {
    calledWithError = error || null;
  });

  assert.equal(calledWithError, null);
});

test("memory rate limiter blocks requests above threshold", () => {
  const limiter = createMemoryRateLimiter({
    windowMs: 60_000,
    max: 2,
    keyBuilder: () => "same-client"
  });

  const req = { ip: "127.0.0.1" };
  const res = {};

  let capturedError = null;

  limiter(req, res, () => {});
  limiter(req, res, () => {});
  limiter(req, res, (error) => {
    capturedError = error || null;
  });

  assert.ok(capturedError);
  assert.equal(capturedError.statusCode, 429);
  assert.match(capturedError.message, /Too many requests/i);
});
