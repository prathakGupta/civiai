# CiviAI

CiviAI is an AI-assisted civic complaint platform for reporting public issues with image evidence, automatic issue classification, admin workflow routing, and resolution verification.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- AI: Gemini (`@google/genai`)
- Media: Cloudinary

## Current Implementation

- Complaint lifecycle APIs are implemented and wired end-to-end:
  - create complaint + AI classification
  - list/filter complaints with pagination
  - complaint detail with verification/audit timeline
  - admin status updates and verification actions
  - impact intelligence summary (`/api/v1/insights/overview`)
- Frontend active routes are production-wired:
  - `/` impact center
  - `/dashboard` operations dashboard
  - `/queue` admin queue
  - `/worker` worker taskboard
  - `/report` report flow
  - `/complaint/:id` complaint detail
- Security hardening is in place:
  - role-based access control with admin-password protection for admin actions
  - upload MIME whitelist + size limit + rate limiting
- Testing coverage includes:
  - frontend lint/build checks
  - backend unit tests
  - backend API integration tests for lifecycle endpoints

## Repo Layout

```txt
civiai/
  client/   React frontend
  server/   Express + Prisma backend
  docs/     setup, architecture, API, testing, deployment, backlog
```

## Quick Start

Follow [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md).

Root scripts:

- `npm run dev` -> starts client dev server
- `npm run dev:server` -> starts backend dev server
- `npm run test` -> client lint + backend tests
- `npm run test:ci` -> client lint/build + backend tests

## Documentation Index

- API contract: [docs/API_CONTRACT.md](./docs/API_CONTRACT.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Database schema summary: [docs/DB_SCHEMA.md](./docs/DB_SCHEMA.md)
- Testing: [docs/TESTING.md](./docs/TESTING.md)
- Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- Backlog: [docs/TODO.md](./docs/TODO.md)
