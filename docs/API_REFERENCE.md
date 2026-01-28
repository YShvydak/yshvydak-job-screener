# API Reference

REST API documentation for YShvydak Job Screener.

**Base URL:** `http://localhost:3001/api` (development)

**Note:** This document will be updated as endpoints are implemented during development.

---

## Authentication

All API endpoints (except listed below) are **protected** and require a valid JWT token.

**Header:** `Authorization: Bearer <token>`

### Auth Endpoints (Public)

#### Register User

```http
POST /api/auth/register
```

**Body:** `{ "email": "user@example.com", "password": "securePass123" }`

#### Login

```http
POST /api/auth/login
```

**Body:** `{ "email": "user@example.com", "password": "securePass123" }`
**Response:** `{ "token": "jwt_token_string", "user": { "id": "...", "email": "..." } }`

#### Get Current User (Protected)

```http
GET /api/auth/me
```

**Header:** `Authorization: Bearer <token>`

---

## Response Format

### Success Response

```json
{
    "success": true,
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "error": "Error message here"
}
```

---

## Jobs Endpoints

### Get All Jobs

```http
GET /api/jobs
```

**Query Parameters:**

| Parameter   | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| status      | string  | Filter by status (new/applied/saved/rejected) |
| minScore    | number  | Minimum match score (0-100)                   |
| profileId   | string  | Filter by search profile ID                   |
| hasAnalysis | boolean | Filter by AI analysis presence (true/false)   |

**Note:** Jobs are sorted by `fetched_at` DESC (newest first). AI analysis does not affect sort order.

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "title": "QA Automation Engineer",
            "company": "Company A",
            "location": "Tel Aviv, Israel",
            "description": "Job description...",
            "apply_link": "https://...",
            "status": "new",
            "posted_date": "2026-01-15",
            "source": "LinkedIn",
            "provider": "serpapi",
            "fetched_at": "2026-01-20T10:00:00.000Z",
            "analysis": {
                "match_score": 85,
                "recommendation": "APPLY",
                "strengths": ["Playwright experience", "CI/CD automation"],
                "gaps": ["Cypress mentioned"],
                "reasoning": "Strong match. Your skills align perfectly..."
            }
        }
    ]
}
```

---

### Get Job by ID

```http
GET /api/jobs/:id
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "title": "QA Automation Engineer",
        ... (same as above)
    }
}
```

---

### Update Job Status

```http
PATCH /api/jobs/:id/status
```

**Request Body:**

```json
{
    "status": "applied" // new, applied, saved, rejected
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "status": "applied",
        "updated_at": "2026-01-20T11:00:00.000Z"
    }
}
```

---

### Update Job Description

```http
PATCH /api/jobs/:id/description
```

**Description:** Manually update job description. Useful for jobs from providers (e.g., Glassdoor) that don't include descriptions in search results.

**Request Body:**

```json
{
    "description": "Full job description text pasted from employer's website..."
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "description": "Full job description text...",
        "updated_at": "2026-01-20T11:00:00.000Z"
    }
}
```

**Use Case:** When a job is fetched without a description (common with Glassdoor API), users can manually copy the description from the job posting page and paste it via this endpoint to enable AI analysis.

---

## Search Profiles Endpoints

### Get All Profiles

```http
GET /api/profiles
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "QA Automation - Tel Aviv",
            "keywords": "QA Automation Engineer, SDET",
            "location": "Tel Aviv, Israel",
            "date_posted": "week",
            "radius": 50,
            "active": 1,
            "created_at": "2026-01-15T10:00:00.000Z"
        }
    ]
}
```

---

### Create Profile

```http
POST /api/profiles
```

**Request Body:**

```json
{
    "name": "QA Automation - Tel Aviv",
    "keywords": "QA Automation Engineer, SDET, Test Automation",
    "location": "Tel Aviv, Israel",
    "date_posted": "week", // REQUIRED: today, 3days, week, month
    "radius": 50, // km (optional)
    "preferred_provider": "serpapi" // optional: serpapi, glassdoor (null = auto)
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "QA Automation - Tel Aviv",
        ... (same as above)
    }
}
```

---

### Update Profile

```http
PUT /api/profiles/:id
```

**Request Body:** Same as Create Profile

---

### Delete Profile

```http
DELETE /api/profiles/:id
```

**Response:**

```json
{
    "success": true,
    "data": {
        "deleted": true
    }
}
```

---

### Toggle Profile Active

```http
PATCH /api/profiles/:id/toggle
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "active": 0 // or 1
    }
}
```

---

## Search Execution Endpoints

### Run Manual Search

```http
POST /api/search/run
```

**Request Body:**

```json
{
    "profileId": "uuid",
    "analyzeWithAI": true, // optional, default: false
    "provider": "glassdoor" // optional override
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "jobsFound": 25, // Total from SerpAPI
        "newJobs": 12, // Actually saved (not duplicates)
        "analyzed": true // Whether AI analysis was run
    }
}
```

**Process:**

1. Fetches jobs from SerpAPI using profile criteria
2. Saves jobs to database (prevents duplicates)
3. Optionally runs AI analysis on new jobs
4. Returns summary statistics

---

## Settings Endpoints

### Get All Settings

```http
GET /api/settings
```

**Response:**

```json
{
    "success": true,
    "data": {
        "cv_uploaded": true,
        "cv_size": 12345,
        "last_updated": "2026-01-15T10:00:00.000Z"
    }
}
```

---

### Upload CV

```http
POST /api/settings/cv
```

**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Description         |
| ----- | ---- | ------------------- |
| cv    | file | CV file (.md, .txt) |

**Response:**

```json
{
    "success": true,
    "data": {
        "uploaded": true,
        "size": 12345,
        "format": "md"
    }
}
```

---

### Download CV

```http
GET /api/settings/cv
```

**Response:** CV file content (text/plain)

---

### Get API Status

```http
GET /api/settings/api-status
```

**Description:** Check if external API keys (SerpAPI, Gemini) are configured.

**Response:**

```json
{
    "success": true,
    "data": {
        "status": {
            "serpapi": {
                "configured": true,
                "name": "SerpAPI",
                "description": "Job search API"
            },
            "gemini": {
                "configured": true,
                "name": "Google Gemini",
                "description": "AI job analysis"
            }
        }
    }
}
```

**Note:** This endpoint checks if API keys are present in the server's environment variables. It does not validate if the keys are valid or have remaining quota.

---

## Dashboard Endpoints

### Get Dashboard Stats

```http
GET /api/dashboard/stats
```

**Response:**

```json
{
    "success": true,
    "data": {
        "total_jobs": 127,
        "new_jobs": 12,
        "applied_jobs": 8,
        "saved_jobs": 15,
        "rejected_jobs": 92,
        "high_match_jobs": 23, // Match score > 80
        "avg_match_score": 67
    }
}
```

---

## Error Codes

| HTTP Status | Error Code          | Description                |
| ----------- | ------------------- | -------------------------- |
| 400         | BAD_REQUEST         | Invalid request parameters |
| 404         | NOT_FOUND           | Resource not found         |
| 500         | INTERNAL_ERROR      | Server error               |
| 503         | SERVICE_UNAVAILABLE | External API unavailable   |

**Example Error:**

```json
{
    "success": false,
    "error": "Job not found",
    "code": "NOT_FOUND"
}
```

---

## Rate Limiting

**SerpAPI:** Free tier has 100 searches/month

**Gemini AI:** Free tier has usage limits

**Recommendation:** Don't trigger too many searches in quick succession.

---

## Future Endpoints (MVP+)

### Job Notes

```http
POST /api/jobs/:id/notes
GET /api/jobs/:id/notes
DELETE /api/jobs/:id/notes
```

### Export

```http
GET /api/jobs/export?format=csv
```

---

**Note:** This API reference will be updated as development progresses.

**Last Updated:** January 2026
**Status:** Planned endpoints (pre-development)
