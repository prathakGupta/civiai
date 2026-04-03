# Project TODO (Re-Audit: 2026-04-03)

## Audit Snapshot

- Active frontend routes are live and API-wired: `/`, `/dashboard`, `/queue`, `/worker`, `/report`, `/complaint/:id`.
- Backend role gating and upload guards are implemented:
  - admin-only status/verify actions
  - upload MIME whitelist
  - max file size
  - in-memory rate limiting
- Automated checks currently passing:
  - `npm run test:ci` (root)
  - frontend lint/build
  - backend unit + integration tests (create/list/detail/status/verify/insights)

## Critical

- Fix deployment auth env parity in hosted environments:
  - Ensure `AUTH_ENABLED` and `ADMIN_PASSWORD` are explicitly configured in deployment settings.
  - Prevent admin actions from returning 500 when auth is enabled but admin password env is missing.
- Replace demo-style shared password pattern for admin actions:
  - Current UX stores admin password in frontend local storage and sends it in request headers.
  - Move to session/JWT/admin login flow (or secure backend-only admin proxy) before production use.
- Add frontend runtime error boundary + global fallback UI:
  - Prevent blank-screen failures on unexpected rendering/runtime errors.

## High Priority

- Expand backend API integration tests to include upload guard scenarios:
  - invalid MIME type rejection
  - max file size rejection
  - rate limit `429` response behavior
- Add end-to-end browser smoke tests for the full user journey:
  - report issue -> appears on dashboard -> open detail -> admin status update -> verify -> impact refresh.
- Remove unused backend dependencies:
  - `openai`
  - `@google/generative-ai`
- Add CI workflow (GitHub Actions or equivalent):
  - run root `npm run test:ci` on pull requests
  - fail fast on regressions

## Medium Priority

- Improve mobile admin usability:
  - role/auth controls are currently desktop-first in top navigation.
- Add stronger client-side input validation UX:
  - coordinate bounds validation
  - friendly file-size hint before upload
  - email and required-field helper messaging
- Add structured request logging with request IDs for easier backend debugging.
- Add seed script for realistic demo data and repeatable local QA runs.

## Product / UX Enhancements

- Add map preview in complaint detail when latitude/longitude are present.
- Add search + sorting in dashboard and queue tables.
- Add toast system for status updates, verify actions, and upload outcomes.
- Add image compression/resizing before upload to improve speed on mobile networks.
- Add CSV export for filtered admin queue views.

## Nice-to-Have (Hackathon Differentiators)

- SLA breach alerts and department performance leaderboard in Impact Center.
- Before/after verification gallery with confidence trendline.
- Public transparency summary panel (resolved rate by area and issue type).
