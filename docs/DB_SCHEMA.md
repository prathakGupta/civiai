# Database Schema

## Main Tables

### Complaint
Stores all reported civic complaints.

Fields:
- id
- title
- description
- locationText
- latitude
- longitude
- imageUrl
- imagePublicId
- imageMimeType
- issueType
- severity
- status
- department
- aiSummary
- aiConfidence
- aiRawJson
- reportedByName
- reportedByEmail
- createdAt
- updatedAt

Enums used:
- `ComplaintStatus`: `PENDING | IN_REVIEW | ASSIGNED | RESOLVED | REJECTED`
- `SeverityLevel`: `LOW | MEDIUM | HIGH | CRITICAL`
- `IssueType`: `GARBAGE | POTHOLE | WATER_LEAK | STREETLIGHT | DRAINAGE | ROAD_DAMAGE | UNKNOWN`

Indexes:
- status
- severity
- issueType
- createdAt

### ComplaintVerification
Stores before/after verification results.

Key fields:
- complaintId (unique)
- beforeImageUrl
- afterImageUrl
- afterImagePublicId
- afterImageMimeType
- verificationStatus (RESOLVED | UNRESOLVED | UNCLEAR)
- verificationSummary
- verificationConfidence
- aiRawJson

Enum used:
- `VerificationStatus`: `RESOLVED | UNRESOLVED | UNCLEAR`

### ComplaintAuditLog
Stores important complaint changes such as status updates.

Key fields:
- complaintId
- action
- oldValue (json)
- newValue (json)
- createdAt

## Relations

- `Complaint` 1:1 `ComplaintVerification` (`complaintId` unique)
- `Complaint` 1:N `ComplaintAuditLog`
