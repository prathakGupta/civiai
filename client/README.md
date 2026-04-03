# CiviAI Client

Frontend for the CiviAI platform.

## Route Contract

- `/` -> Impact Center (live insights)
- `/dashboard` -> Operations Dashboard (filters + pagination)
- `/queue` -> Admin Queue (bulk/single status actions)
- `/worker` -> Worker Taskboard (assigned tasks + progress updates)
- `/report` -> Report Issue (upload + create complaint)
- `/complaint/:id` -> Complaint Detail (status + verification)

## Implementation Notes

- API client modules:
  - `src/api/http.js`
  - `src/api/complaints.js`
- Styling system: Tailwind-first (`tailwind.config.js`, `src/index.css`)
- Legacy duplicate UI pages/components were removed to keep one active source of truth.
- Minimal admin auth headers are sent automatically:
  - `x-user-role` (`ADMIN` / `WORKER` / `CITIZEN`)
  - `x-admin-password` (required for admin-protected actions when auth is enabled)
  - `x-worker-name` (included for worker progress audit logs)

## Run Locally

```bash
npm install
npm run dev
```

## Environment

Create `.env` (optional):

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_USER_ROLE=CITIZEN
VITE_ADMIN_PASSWORD=
VITE_WORKER_NAME=
```

Notes:
- Use `VITE_USER_ROLE=ADMIN` + `VITE_ADMIN_PASSWORD=<value>` for local admin action testing.
- In production, avoid shipping admin passwords in public frontend env.
