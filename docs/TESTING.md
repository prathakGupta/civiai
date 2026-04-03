# Testing Guide

## Current Coverage

- Frontend:
  - Lint checks for React code quality (`npm run lint`)
  - Production build verification (`npm run build`)
- Backend:
  - Unit tests for complaint validation schemas using Node test runner
  - Unit tests for impact insights scoring logic
  - Unit tests for auth middleware behavior
  - Unit tests for in-memory rate limiter behavior
  - API integration tests for lifecycle routes:
    - `POST /api/v1/complaints`
    - `GET /api/v1/complaints`
    - `GET /api/v1/complaints/:id`
    - `PATCH /api/v1/complaints/:id/status`
    - `POST /api/v1/complaints/:id/progress`
    - `POST /api/v1/complaints/:id/verify`
    - `GET /api/v1/insights/overview`
  - Upload guard tests:
    - missing file rejection
    - invalid MIME rejection
    - max file size rejection

Notes:
- Integration tests run with in-memory test doubles (no live DB/Cloudinary/Gemini calls).
- Admin-protected flows are validated using `x-user-role` and `x-admin-password` headers.
- Worker flows are validated using `x-user-role: WORKER` (+ optional `x-worker-name`).

## Test Files

- `server/tests/complaint.validator.test.js`
- `server/tests/insights.service.test.js`
- `server/tests/auth.middleware.test.js`
- `server/tests/rateLimit.middleware.test.js`
- `server/tests/upload.routes.test.js`
- `server/tests/api.integration.test.js`

## Run Frontend Checks

From `client/`:

```bash
npm run test
```

CI-style check (lint + production build):

```bash
npm run test:ci
```

## Run Backend Tests

From `server/`:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## Run From Repository Root

```bash
npm run test
npm run test:ci
```

## Recommended Manual Smoke Tests

1. Submit complaint from `/report` with image upload.
2. Confirm complaint appears on `/dashboard`.
3. Open `/complaint/:id` and review AI summary + metadata.
4. Switch to ADMIN role and update status.
5. Upload after-resolution image and run verification.
6. Switch to WORKER role and submit progress from `/worker`.
7. Confirm audit timeline and `/` impact metrics reflect updates.
