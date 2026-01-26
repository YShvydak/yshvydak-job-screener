# ANTIGRAVITY.md - Vibe Code Development Instructions

> **Project:** YShvydak Job Screener - AI-powered job matching automation
> **Type:** Open Source (Personal Job Search Automation)
> **Stack:** Express + React + SQLite + SerpAPI + Google Gemini AI
> **IDE:** Antigravity (Vibe Code Mode)

---

## CRITICAL CONTEXT (Read First)

### 1. Layered Architecture - NEVER Bypass

**Mandatory Flow:** Controller → Service → Repository → Database

```plaintext
packages/server/src/
├── controllers/     # HTTP handlers (thin layer)
├── services/        # Business logic + External API calls
└── repositories/    # Data access (SQL only)
```

**Rules:**

- ✅ ALWAYS: Full layered chain for all operations
- ❌ NEVER: Direct database calls from services
- ❌ NEVER: Business logic in controllers

### 2. External APIs - SerpAPI + Gemini AI

**SerpAPI:** Job search integration (google_jobs engine)

- Location: `packages/server/src/services/search.service.ts`
- API key in `.env` (NEVER hardcode)

**Gemini AI:** Job matching analysis (match score, strengths, gaps)

- Location: `packages/server/src/services/ai.service.ts`
- API key in `.env` (NEVER hardcode)

### 3. Job Deduplication - ALWAYS Check

**Strategy:** Prevent duplicate jobs using `serpapi_job_id`

```typescript
// ALWAYS check before insert
const existing = await jobRepository.findBySerpAPIId(result.job_id)
if (!existing) {
    await jobRepository.create(jobData)
}
```

- Database UNIQUE constraint on `serpapi_job_id`
- Location: `packages/server/src/repositories/job.repository.ts`

### 4. Search Profiles - Location is OPTIONAL

**Configuration:**

- Keywords: **required**
- Location: **optional** (empty = global search)
- date_posted: **required** (today, 3days, week, month)
- Radius: optional (only with location)

**SerpAPI params:**

```typescript
{
    engine: 'google_jobs',
    q: profile.keywords,        // required
    hl: 'en',                   // always English
    location: profile.location, // optional
    lrad: radiusMiles,          // only with location
    chips: `date_posted:${profile.date_posted}` // required
}
```

### 5. Context7-MCP Integration - MANDATORY for Dependencies

**ALWAYS check before dependency changes:**

- Adding package? → Check Context7-MCP first
- Updating package? → Check Context7-MCP first
- Changing config? → Check Context7-MCP first

**Why:** Context7-MCP provides package documentation and compatibility info to prevent breaking changes.

---

## Project Structure

### Backend (Express + SQLite)

```plaintext
packages/server/src/
├── index.ts                    # Entry point + Express setup
├── config/
│   └── environment.config.ts   # Environment variables
├── controllers/                # HTTP handlers
│   ├── job.controller.ts
│   ├── profile.controller.ts
│   ├── search.controller.ts
│   ├── settings.controller.ts
│   └── ai.controller.ts
├── services/                   # Business logic
│   ├── job.service.ts
│   ├── profile.service.ts
│   ├── search.service.ts       # SerpAPI integration
│   └── ai.service.ts           # Gemini AI integration
├── repositories/               # Data access
│   ├── job.repository.ts
│   ├── profile.repository.ts
│   ├── settings.repository.ts
│   └── analysis.repository.ts
├── routes/                     # Route definitions
├── database/
│   ├── database.manager.ts
│   └── schema.sql
└── utils/
    ├── Logger.ts
    └── ResponseHelper.ts
```

### Frontend (React + Zustand)

```plaintext
packages/web/src/
├── App.tsx                     # Main app with routing
├── main.tsx                    # Entry point
├── pages/                      # Page components
│   ├── Dashboard.tsx
│   ├── Jobs.tsx
│   ├── Profiles.tsx
│   └── Settings.tsx
├── stores/                     # Zustand state management
│   ├── jobStore.ts
│   ├── profileStore.ts
│   └── settingsStore.ts
├── components/
│   └── Layout.tsx
└── api/
    └── client.ts               # API client
```

### Shared Types

```plaintext
shared/src/
├── index.ts
└── types/
    ├── job.types.ts
    ├── profile.types.ts
    └── api.types.ts
```

---

## Development Workflow

### Essential Commands

```bash
# Start all packages (server:3001 + web:3000)
npm run dev

# TypeScript validation
npm run type-check

# Auto-fix linting issues
npm run lint:fix
```

### URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Production Deployment

Project is deployed on **Raspberry Pi** with auto-deploy on push to `main`.

**Key Info:**

- CI/CD: GitHub Actions → Raspberry Pi
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
    - Production URLs
    - Deployment troubleshooting
    - SSH access
    - Service management

---

## Concept Flow

```plaintext
User clicks "Run Search" on profile
  ↓ Frontend: POST /api/search/run
  ↓ SearchController → SearchService
  ↓ ProfileRepository.findById() → Get search criteria
  ↓ SerpAPI fetch:
  │   - q: keywords (required)
  │   - hl: 'en' (always)
  │   - location: only if provided (optional)
  │   - lrad: radius in miles (only with location)
  │   - chips: date_posted filter (required)
  ↓ JobRepository.create() → Save jobs (prevent duplicates)
  ↓ Optional: AIService.analyzeJobs()
  ↓ Frontend redirects to /jobs
  ↓ JobsList displays jobs with AI match scores
```

**Key Dependencies:**

- Job Deduplication ← `serpapi_job_id` uniqueness
- AI Analysis ← CV content from settings
- Match Score ← Gemini AI integration
- Search Profiles ← SerpAPI parameters (location optional)

---

## Anti-Patterns (NEVER DO)

### ❌ Bypassing Repository Layer

```typescript
// WRONG
await this.db.query('SELECT * FROM jobs')

// RIGHT
await this.jobRepository.findAll()
```

### ❌ Not Preventing Job Duplicates

```typescript
// WRONG
await this.jobRepository.create(jobData)

// RIGHT
const existing = await this.jobRepository.findBySerpAPIId(result.job_id)
if (!existing) {
    await this.jobRepository.create(jobData)
}
```

### ❌ Hardcoding API Keys

```typescript
// WRONG
const apiKey = 'AIzaSyC...'

// RIGHT
const apiKey = process.env.GEMINI_API_KEY
```

### ❌ Requiring Location for Search

```typescript
// WRONG - location is now optional
if (!input.location) {
    throw new Error('Location is required')
}

// RIGHT - empty location = global search
if (profile.location && profile.location.trim()) {
    params.location = profile.location
}
```

### ❌ Missing date_posted Field

```typescript
// WRONG - date_posted is required
service.create({name: 'Test', keywords: 'react', location: ''})

// RIGHT - always provide date_posted
service.create({
    name: 'Test',
    keywords: 'react',
    location: '',
    date_posted: 'week',
})
```

---

## Vibe Code Development Rules

### DO

✅ Use Context7-MCP for all dependency lookups
✅ Follow Layered Architecture (Controller → Service → Repository)
✅ Check `serpapi_job_id` before job insert
✅ Use environment variables for API keys
✅ Handle empty location as global search
✅ Always provide `date_posted` in search profiles
✅ Use TypeScript types from `shared/src/types/`
✅ Update `updated_at` timestamps on modifications
✅ Use Logger utility for consistent logging
✅ Return proper HTTP status codes via ResponseHelper

### DON'T

❌ NEVER bypass repository layer
❌ NEVER hardcode API keys
❌ NEVER require location (it's optional)
❌ NEVER skip duplicate checking for jobs
❌ NEVER commit without explicit user request
❌ NEVER add dependencies without Context7-MCP check
❌ NEVER make database schema changes without migration plan

---

## Quick Fixes

| Issue                   | Solution                                       |
| ----------------------- | ---------------------------------------------- |
| Duplicate jobs          | Check `serpapi_job_id` before insert           |
| Missing CV for AI       | Upload CV in Settings page                     |
| AI analysis fails (API) | Verify `GEMINI_API_KEY` in `.env`              |
| AI analysis fails (CLI) | Run `gemini auth` to authenticate CLI          |
| Switch AI method        | Settings page or dropdown on Analyze button    |
| SerpAPI quota exceeded  | Check SerpAPI dashboard                        |
| 0 results returned      | Valid response, try different keywords         |
| Port conflict           | Kill process: `lsof -ti:3001 \| xargs kill -9` |

---

## Database Schema (Key Tables)

### search_profiles

- `id` (TEXT, PK)
- `name` (TEXT, required)
- `keywords` (TEXT, required)
- `location` (TEXT, optional - empty = global)
- `date_posted` (TEXT, required - today/3days/week/month)
- `radius` (INTEGER, optional - km)
- `active` (INTEGER, boolean 0/1)

### jobs

- `id` (TEXT, PK)
- `profile_id` (TEXT, FK)
- `serpapi_job_id` (TEXT, UNIQUE) ← **Prevents duplicates**
- `title` (TEXT, required)
- `company` (TEXT)
- `location` (TEXT)
- `description` (TEXT)
- `apply_link` (TEXT)
- `posted_date` (TEXT) ← **From SerpAPI**
- `source` (TEXT) ← LinkedIn, Indeed, etc.
- `status` (TEXT) ← new/applied/saved/rejected
- `fetched_at` (DATETIME)

### ai_analyses

- `id` (TEXT, PK)
- `job_id` (TEXT, FK, UNIQUE)
- `match_score` (INTEGER, 0-100)
- `recommendation` (TEXT) ← APPLY/MAYBE/SKIP
- `strengths` (TEXT) ← JSON array
- `gaps` (TEXT) ← JSON array
- `reasoning` (TEXT)

---

## Type Definitions Reference

### Job Types

```typescript
type JobStatus = 'new' | 'applied' | 'saved' | 'rejected'
type AIAnalysisMethod = 'api' | 'local'

interface Job {
    id: string
    profile_id: string
    serpapi_job_id: string
    title: string
    company: string | null
    location: string | null
    description: string | null
    apply_link: string | null
    posted_date: string | null
    source: string | null
    status: JobStatus
    fetched_at: string
    created_at: string
    updated_at: string
}

interface JobWithAnalysis extends Job {
    analysis?: AIAnalysis
}
```

### Profile Types

```typescript
type DatePosted = 'today' | '3days' | 'week' | 'month'

interface SearchProfile {
    id: string
    name: string
    keywords: string
    location: string // Empty string = global search
    date_posted: DatePosted // Required
    radius?: number // Optional, km
    active: number // 0 or 1
    created_at: string
    updated_at: string
}
```

---

## Documentation

- [QUICKSTART.md](docs/QUICKSTART.md) - 5 minutes setup
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [API_REFERENCE.md](docs/API_REFERENCE.md) - API endpoints
- [docs/ai/](docs/ai/) - AI-specific documentation
- [docs/features/](docs/features/) - Feature deep dives

---

**Last Updated:** January 2026
**Optimized for:** Antigravity IDE (Vibe Code Mode)
