import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../src/config/env.js";
import {
  requireAuth,
  requireAuthIfAdmin,
  requireRole
} from "../src/middleware/auth.middleware.js";

function runMiddleware(middleware, req = {}) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error || null));
  });
}

test("requireAuth allows request when auth is disabled", async (t) => {
  const originalAuthEnabled = env.AUTH_ENABLED;

  t.after(() => {
    env.AUTH_ENABLED = originalAuthEnabled;
  });

  env.AUTH_ENABLED = false;

  const error = await runMiddleware(requireAuth, {
    auth: { adminPassword: "" }
  });

  assert.equal(error, null);
});

test("requireAuth rejects when ADMIN_PASSWORD is missing", async (t) => {
  const originalAuthEnabled = env.AUTH_ENABLED;
  const originalAdminPassword = env.ADMIN_PASSWORD;

  t.after(() => {
    env.AUTH_ENABLED = originalAuthEnabled;
    env.ADMIN_PASSWORD = originalAdminPassword;
  });

  env.AUTH_ENABLED = true;
  env.ADMIN_PASSWORD = "";

  const error = await runMiddleware(requireAuth, {
    auth: { adminPassword: "anything" }
  });

  assert.ok(error);
  assert.equal(error.statusCode, 401);
  assert.match(error.message, /Admin login disabled/i);
});

test("requireAuth rejects invalid admin password", async (t) => {
  const originalAuthEnabled = env.AUTH_ENABLED;
  const originalAdminPassword = env.ADMIN_PASSWORD;

  t.after(() => {
    env.AUTH_ENABLED = originalAuthEnabled;
    env.ADMIN_PASSWORD = originalAdminPassword;
  });

  env.AUTH_ENABLED = true;
  env.ADMIN_PASSWORD = "correct-password";

  const error = await runMiddleware(requireAuth, {
    auth: { adminPassword: "wrong-password" }
  });

  assert.ok(error);
  assert.equal(error.statusCode, 401);
  assert.match(error.message, /invalid admin password/i);
});

test("requireAuthIfAdmin skips auth for non-admin roles", async (t) => {
  const originalAuthEnabled = env.AUTH_ENABLED;
  const originalAdminPassword = env.ADMIN_PASSWORD;

  t.after(() => {
    env.AUTH_ENABLED = originalAuthEnabled;
    env.ADMIN_PASSWORD = originalAdminPassword;
  });

  env.AUTH_ENABLED = true;
  env.ADMIN_PASSWORD = "correct-password";

  const error = await runMiddleware(requireAuthIfAdmin, {
    auth: { role: "WORKER", adminPassword: "" }
  });

  assert.equal(error, null);
});

test("requireAuthIfAdmin enforces password for admin role", async (t) => {
  const originalAuthEnabled = env.AUTH_ENABLED;
  const originalAdminPassword = env.ADMIN_PASSWORD;

  t.after(() => {
    env.AUTH_ENABLED = originalAuthEnabled;
    env.ADMIN_PASSWORD = originalAdminPassword;
  });

  env.AUTH_ENABLED = true;
  env.ADMIN_PASSWORD = "correct-password";

  const error = await runMiddleware(requireAuthIfAdmin, {
    auth: { role: "ADMIN", adminPassword: "wrong-password" }
  });

  assert.ok(error);
  assert.equal(error.statusCode, 401);
});

test("requireRole allows configured roles and blocks others", async () => {
  const workerOrAdminOnly = requireRole("WORKER", "ADMIN");

  const allowedError = await runMiddleware(workerOrAdminOnly, {
    auth: { role: "WORKER" }
  });
  const deniedError = await runMiddleware(workerOrAdminOnly, {
    auth: { role: "CITIZEN" }
  });

  assert.equal(allowedError, null);
  assert.ok(deniedError);
  assert.equal(deniedError.statusCode, 403);
  assert.match(deniedError.message, /insufficient role/i);
});
