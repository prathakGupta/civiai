# Architecture

## High-Level Components

- `client/`: React + Vite + Tailwind frontend with API-wired pages
- `server/`: Express API with Prisma ORM
- PostgreSQL: source of truth for complaints, verifications, and audit logs
- Cloudinary: image storage
- Gemini: issue classification and before/after verification

## Core Backend Flow

1. Client uploads image using `POST /api/v1/uploads/image`
2. Server stores image in Cloudinary and returns hosted URL + public ID
3. Client sends complaint payload to `POST /api/v1/complaints`
4. Server classifies image via Gemini
5. Server persists complaint + AI metadata + audit log in PostgreSQL
6. Admin/user updates status via `PATCH /api/v1/complaints/:id/status`
7. Resolution can be verified via `POST /api/v1/complaints/:id/verify`
8. Worker submits on-ground updates via `POST /api/v1/complaints/:id/progress`
9. Impact intelligence can be fetched via `GET /api/v1/insights/overview`

## Frontend Route Contract

- `/` -> Impact Center
- `/dashboard` -> Operations dashboard list
- `/queue` -> Admin queue
- `/worker` -> Worker taskboard
- `/report` -> Report issue flow
- `/complaint/:id` -> Complaint detail view

Note:
- Frontend detail route is singular (`/complaint/:id`), while backend API resource remains plural (`/api/v1/complaints/:id`).

## Frontend UI Architecture

- Tailwind-first styling system (`tailwind.config.js` + `src/index.css`).
- One active route implementation set (duplicate legacy pages removed).
- Shared HTTP client interceptor injects role/auth headers (`x-user-role`, `x-admin-password`, `x-worker-name`).

## Security Layer (Minimal)

- Backend attaches auth context from headers (`x-user-role`, `x-admin-password`, `x-worker-name`).
- Admin-only endpoints (`status` update + `verify`) require:
  - valid admin password
  - `ADMIN` role
- Worker progress endpoint requires `WORKER` role (or `ADMIN` + password).
- Upload API is protected by MIME/type guard, max file size, and rate limiter.

## Data Model Summary

- `Complaint`: main complaint record and AI classification fields
- `ComplaintVerification`: before/after verification result for one complaint
- `ComplaintAuditLog`: immutable action log for status and verification events

## API Versioning

- Current API namespace: `/api/v1`

## Standout Layer (Hackathon)

- Impact intelligence engine computes:
  - Critical unresolved load
  - Resolution velocity
  - Verification confidence coverage
  - Hotspot clusters from geo/location data
  - Urgency-prioritized operational queue
- Dashboard surfaces this in a judge-friendly Impact Center to show measurable civic value.
