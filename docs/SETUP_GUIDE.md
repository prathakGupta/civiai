# Setup Guide

## Prerequisites

- Node.js `>= 20`
- npm
- PostgreSQL database
- Cloudinary account
- Gemini API key

## 1. Clone and Install

From repo root:

```bash
cd client
npm install

cd ../server
npm install
```

## 2. Configure Environment Variables

Create `server/.env` (you can copy from `server/.env.example`):

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
AUTH_ENABLED=true
ADMIN_PASSWORD=your_admin_password
UPLOAD_MAX_FILE_MB=8
UPLOAD_RATE_LIMIT_WINDOW_MS=60000
UPLOAD_RATE_LIMIT_MAX=20
```

Optional frontend env (`client/.env`):

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_USER_ROLE=CITIZEN
VITE_ADMIN_PASSWORD=
VITE_WORKER_NAME=
```

You can copy from `client/.env.example`.

## 3. Run Prisma

From `server/`:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## 4. Start Servers

Backend (from `server/`):

```bash
npm run dev
```

Frontend (from `client/`):

```bash
npm run dev
```

Or from repo root:

```bash
npm run dev:server
npm run dev
```

## 5. Smoke Test

1. Open `GET http://localhost:5000/health`
2. Upload image via `POST /api/v1/uploads/image`
3. Create complaint via `POST /api/v1/complaints`
4. Fetch complaints via `GET /api/v1/complaints`
5. Open frontend and verify routes:
   - `/`
   - `/dashboard`
   - `/queue`
   - `/worker`
   - `/report`
   - `/complaint/:id` (from complaint list)
6. Switch frontend role to `ADMIN` and set admin password to test:
   - `PATCH /api/v1/complaints/:id/status`
   - `POST /api/v1/complaints/:id/verify`
7. Switch frontend role to `WORKER` and submit progress on worker taskboard:
   - `POST /api/v1/complaints/:id/progress`
