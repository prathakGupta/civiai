# Deployment

Quick deploy file included: `render.yaml` (API + frontend static site).

## Recommended Split

- Frontend (`client`) deployed as static app (Vercel/Netlify)
- Backend (`server`) deployed as Node.js API service (Render/Railway/Fly/VM)
- PostgreSQL managed database (Neon/Supabase/RDS/etc.)

## Backend Deployment Checklist

1. Set environment variables:
   - `PORT`
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `AUTH_ENABLED`
   - `ADMIN_PASSWORD`
   - `UPLOAD_MAX_FILE_MB`
   - `UPLOAD_RATE_LIMIT_WINDOW_MS`
   - `UPLOAD_RATE_LIMIT_MAX`
2. Install dependencies in `server/`
3. Run Prisma migrations against production DB:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

4. Start API:

```bash
npm run start
```

## Frontend Deployment Checklist

1. Set `VITE_API_BASE_URL` to deployed backend URL, for example:
   - `https://api.example.com/api/v1`
2. Optional frontend env:
   - `VITE_USER_ROLE` (default role shown in UI toggle)
   - `VITE_ADMIN_PASSWORD` (not recommended to expose in public production builds)
   - `VITE_WORKER_NAME`
3. Build and deploy:

```bash
npm run build
```

## Post-Deploy Validation

1. Check backend health endpoint: `/health`
2. Test upload endpoint: `POST /api/v1/uploads/image`
3. Test complaint creation: `POST /api/v1/complaints`
4. Test list endpoint: `GET /api/v1/complaints`
5. Test admin-gated status update and verification flow with valid headers
6. Test worker progress flow: `POST /api/v1/complaints/:id/progress`
7. Test impact endpoint: `GET /api/v1/insights/overview`

## Hackathon Demo Checklist

1. Open `/` and show Impact Center summary, hotspots, and priority queue.
2. Open `/report`, submit a complaint with image evidence.
3. Open `/dashboard` and show complaint appearing in operations list.
4. Switch to ADMIN role, update status/verify on `/complaint/:id`.
5. Open `/queue` and demonstrate bulk or fast admin actions.
6. Open `/worker` as WORKER role and submit task progress.
