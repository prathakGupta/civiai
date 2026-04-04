# API Contract

Base URL (local): `http://localhost:5000/api/v1`

Frontend route mapping note:
- UI detail route: `/complaint/:id`
- API detail route: `/complaints/:id`

## Auth (Minimal Role Gating)

Admin actions require both headers when `AUTH_ENABLED=true`:
- `x-user-role: ADMIN`
- `x-admin-password: <ADMIN_PASSWORD from server/.env>`

If role is not admin -> `403`.
If admin password is missing/invalid -> `401`.

Worker progress actions require:
- `x-user-role: WORKER` (or `ADMIN`)
- optional `x-worker-name: <display name>` (stored in audit metadata)

## Health

### `GET /health`

Response:

```json
{
  "success": true,
  "message": "CiviAI API running"
}
```

## Uploads

### `POST /uploads/image`

Multipart form-data:
- `image` (file, required)

Upload guards:
- MIME whitelist: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/heic`, `image/heif`
- Max size controlled by `UPLOAD_MAX_FILE_MB`
- Rate limiting controlled by:
  - `UPLOAD_RATE_LIMIT_WINDOW_MS`
  - `UPLOAD_RATE_LIMIT_MAX`

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "publicId": "civiai/...",
    "mimeType": "image/jpeg"
  }
}
```

## AI Test

### `POST /ai-test/classify`

Request body:

```json
{
  "imageUrl": "https://...",
  "imageMimeType": "image/jpeg"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "issueType": "POTHOLE",
    "severity": "HIGH",
    "department": "Roads Department",
    "summary": "Large pothole near intersection",
    "confidence": 0.91
  }
}
```

## Complaints

### `POST /complaints`

Creates a complaint and runs AI classification before storing.

Request body:

```json
{
  "imageUrl": "https://...",
  "imagePublicId": "civiai/example",
  "imageMimeType": "image/jpeg",
  "locationText": "MG Road, Bengaluru",
  "latitude": 12.972,
  "longitude": 77.593,
  "description": "Water leak near bus stop",
  "reportedByName": "Rahul",
  "reportedByEmail": "rahul@example.com"
}
```

Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "locationText": "MG Road, Bengaluru",
    "issueType": "WATER_LEAK",
    "severity": "MEDIUM",
    "status": "PENDING"
  }
}
```

### `GET /complaints`

Query params (optional):
- `status`: `PENDING | IN_REVIEW | ASSIGNED | RESOLVED | REJECTED`
- `issueType`: `GARBAGE | POTHOLE | WATER_LEAK | STREETLIGHT | DRAINAGE | ROAD_DAMAGE | UNKNOWN`
- `severity`: `LOW | MEDIUM | HIGH | CRITICAL`
- `page`: number (default `1`)
- `limit`: number (default `20`, max `100`)

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 1
  }
}
```

### `GET /complaints/:id`

Returns complaint details including verification and audit logs.

### `PATCH /complaints/:id/status`

Auth required: `ADMIN` role + valid `x-admin-password`

Request body:

```json
{
  "status": "IN_REVIEW"
}
```

### `POST /complaints/:id/verify`

Auth required: `ADMIN` role + valid `x-admin-password`

Runs before/after AI verification and upserts complaint verification.

Request body:

```json
{
  "afterImageUrl": "https://...",
  "afterImagePublicId": "civiai/after-example",
  "afterImageMimeType": "image/jpeg"
}
```

If verification is `RESOLVED`, complaint status is auto-updated to `RESOLVED`.

### `POST /complaints/:id/progress`

Auth required:
- `WORKER` role, or
- `ADMIN` role with valid `x-admin-password`

Request body:

```json
{
  "progressNote": "Visited location and marked damaged area for repair",
  "status": "IN_REVIEW"
}
```

`status` is optional and can be `ASSIGNED | IN_REVIEW | RESOLVED`.

Behavior:
- Accepts progress updates only when complaint status is `ASSIGNED` or `IN_REVIEW`.
- Writes worker progress into audit log (`WORKER_PROGRESS_SUBMITTED`).
- If `status` changes, also writes a `STATUS_UPDATED` audit entry.

## Impact Insights

### `GET /insights/overview`

Query params:
- `windowDays` (optional, integer `7` to `180`, default `30`)

Purpose:
- Returns high-signal intelligence for operations and executive reporting.
- Includes summary metrics, top hotspots, department load, and urgency-ranked queue.

Response:

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 48,
      "open": 19,
      "resolved": 25,
      "rejected": 4,
      "criticalOpen": 3,
      "resolutionRate": 52.08,
      "avgResolutionHours": 19.4,
      "verificationRate": 41.7,
      "avgVerificationConfidence": 0.81,
      "complaintsLastWindow": 31,
      "windowDays": 30
    },
    "hotspots": [
      { "label": "Central Market", "total": 8, "open": 5, "critical": 2 }
    ],
    "departmentLoad": [
      { "department": "Roads", "total": 14, "open": 7, "resolved": 6 }
    ],
    "priorityQueue": [
      {
        "id": "cm123",
        "locationText": "MG Road",
        "issueType": "POTHOLE",
        "severity": "CRITICAL",
        "status": "PENDING",
        "urgencyScore": 154,
        "ageHours": 52,
        "department": "Roads"
      }
    ],
    "narrative": {
      "headline": "Civic Impact Pulse",
      "criticalLine": "3 critical incidents are still unresolved.",
      "hotspotLine": "Highest pressure zone is Central Market with 5 open complaints.",
      "queueLine": "Top priority is POTHOLE at MG Road (urgency 154)."
    }
  }
}
```

## Error Shape

```json
{
  "success": false,
  "message": "Validation error message"
}
```
