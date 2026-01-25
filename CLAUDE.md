# CLAUDE.md - Quick Reference for AI Development

> **Project:** YShvydak Job Screener - AI-powered job matching automation
> **Type:** Open Source (Personal Job Search Automation)
> **Stack:** Express + React + SQLite + SerpAPI + Google Gemini AI

---

## CRITICAL CONTEXT (30 seconds to read)

### 1. Layered Architecture - NEVER Bypass

**Mandatory Flow:** Controller → Service → Repository → Database

- NEVER: Direct database calls from services
- ALWAYS: Full layered chain for all operations
- Location: `packages/server/src/{controllers,services,repositories}/`

### 2. External APIs - SerpAPI + Gemini AI

**SerpAPI:** Job search integration (google_jobs engine)
**Gemini AI:** Job matching analysis (match score, strengths, gaps)

- API keys in `.env` (NEVER hardcode)
- Check Context7-MCP BEFORE installing/updating dependencies
- Location: `packages/server/src/services/{search,ai}.service.ts`

### 3. Job Deduplication - ALWAYS Check

**Strategy:** Prevent duplicate jobs using `serpapi_job_id`

- ALWAYS check `jobRepository.findBySerpAPIId()` before insert
- Database UNIQUE constraint on `serpapi_job_id`
- Location: `packages/server/src/repositories/job.repository.ts`

### 4. Search Profiles - Location is OPTIONAL, date_posted is REQUIRED

**Configuration:** Keywords (required), location (optional), date_posted (required), radius

- **Empty location = Global search** (worldwide results)
- **date_posted is mandatory** (today, 3days, week, month)
- SerpAPI params: `q`, `hl='en'`, optional `location` + `lrad`, `chips: date_posted:...`
- "No results" from SerpAPI is valid response (returns 0 jobs)
- Location: `packages/server/src/services/search.service.ts`

### 5. Context7-MCP Integration - MANDATORY for Dependencies

**ALWAYS check before dependency changes:**

- Adding package? → Check Context7-MCP first
- Updating package? → Check Context7-MCP first
- Changing config? → Check Context7-MCP first

---

## Concept Flow (30 seconds)

```
User clicks "Search Now" on profile
  ↓ Frontend: POST /api/search/run
  ↓ SearchController → SearchService
  ↓ ProfileRepository.findById() → Get search criteria
  ↓ SerpAPI fetch:
  │   - q: keywords (required)
  │   - hl: 'en' (always)
  │   - location: only if provided (optional)
  │   - lrad: radius in miles (only with location)
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

## Project Structure (Actual)

### Backend (Layered Architecture)

```
packages/server/src/
├── index.ts                 # Entry point + Express setup
├── config/
│   └── environment.config.ts
├── controllers/             # HTTP handlers (thin layer)
│   ├── job.controller.ts
│   ├── profile.controller.ts
│   ├── search.controller.ts
│   ├── settings.controller.ts
│   └── ai.controller.ts
├── services/                # Business logic
│   ├── job.service.ts
│   ├── profile.service.ts
│   ├── search.service.ts    # SerpAPI integration
│   └── ai.service.ts        # Gemini AI integration
├── repositories/            # Data access (SQL only)
│   ├── job.repository.ts
│   ├── profile.repository.ts
│   ├── settings.repository.ts
│   └── analysis.repository.ts
├── routes/                  # Route definitions
├── database/
│   ├── database.manager.ts
│   └── schema.sql
└── utils/
    ├── Logger.ts
    └── ResponseHelper.ts
```

### Frontend (Pages + Stores)

```
packages/web/src/
├── App.tsx                  # Main app with routing
├── main.tsx                 # Entry point
├── pages/                   # Page components
│   ├── Dashboard.tsx
│   ├── Jobs.tsx
│   ├── Profiles.tsx
│   └── Settings.tsx
├── stores/                  # Zustand state management
│   ├── jobStore.ts
│   ├── profileStore.ts
│   └── settingsStore.ts
├── components/
│   └── Layout.tsx
└── api/
    └── client.ts            # API client
```

### Shared Types

```
shared/src/
├── index.ts
└── types/
    ├── job.types.ts
    ├── profile.types.ts
    └── api.types.ts
```

---

## Development Workflow

### Primary Skills

| Task                              | Skill              | Why                 |
| --------------------------------- | ------------------ | ------------------- |
| UI components, pages, styling     | `/frontend-design` | High-quality design |
| Backend features, API, full-stack | `/feature-dev`     | Architecture focus  |
| Quick fixes, minor tweaks         | —                  | Direct editing      |

### Essential Commands

```bash
npm run dev              # All packages (server:3001 + web:3000)
npm run type-check       # TypeScript validation
npm run lint:fix         # Auto-fix issues
```

### Browser Testing

```bash
claude --chrome          # Claude with browser testing
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Production Deployment

Project is deployed on Raspberry Pi with auto-deploy on push to `main`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for URLs, CI/CD details, and troubleshooting.

---

## Anti-Patterns (NEVER DO)

### Bypassing Repository Layer

```typescript
// WRONG
await this.db.query('SELECT * FROM jobs')

// RIGHT
await this.jobRepository.findAll()
```

### Not Preventing Job Duplicates

```typescript
// WRONG
await this.jobRepository.create(jobData)

// RIGHT
const existing = await this.jobRepository.findBySerpAPIId(result.job_id)
if (!existing) {
    await this.jobRepository.create(jobData)
}
```

### Hardcoding API Keys

```typescript
// WRONG
const apiKey = 'AIzaSyC...'

// RIGHT
const apiKey = process.env.GEMINI_API_KEY
```

### Requiring Location for Search

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

### Missing date_posted Field

```typescript
// WRONG - date_posted is required
service.create({name: 'Test', keywords: 'react', location: ''})

// RIGHT - always provide date_posted
service.create({name: 'Test', keywords: 'react', location: '', date_posted: 'week'})
```

---

## Quick Fixes

| Issue                   | Solution                                        |
| ----------------------- | ----------------------------------------------- |
| Duplicate jobs          | Check `serpapi_job_id` before insert            |
| Missing CV for AI       | Upload CV in Settings                           |
| AI analysis fails (API) | Verify `GEMINI_API_KEY` in `.env`               |
| AI analysis fails (CLI) | Run `gemini auth` to authenticate CLI           |
| Switch AI method        | Settings page or use dropdown on Analyze button |
| SerpAPI quota exceeded  | Check SerpAPI dashboard                         |
| 0 results returned      | Valid response, try different keywords          |
| Port conflict           | Kill process: `lsof -ti:3001 \| xargs kill -9`  |

---

## Development Rules

### DO:

- Use Context7-MCP for all dependency lookups
- Follow Layered Architecture (Controller → Service → Repository)
- Check `serpapi_job_id` before job insert
- Use `/frontend-design` for UI, `/feature-dev` for backend

### DON'T:

- NEVER commit without explicit user request
- NEVER add dependencies without Context7-MCP check
- NEVER bypass repository layer
- NEVER hardcode API keys
- NEVER require location (it's optional)

---

## Documentation

- [QUICKSTART.md](docs/QUICKSTART.md) - 5 minutes setup
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [API_REFERENCE.md](docs/API_REFERENCE.md) - API endpoints
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment (Raspberry Pi, CI/CD, troubleshooting)
- [docs/ai/](docs/ai/) - AI-specific documentation
- [docs/ai/DECISIONS.md](docs/ai/DECISIONS.md) - Architecture decisions
- [docs/features/](docs/features/) - Feature deep dives
    - [AI_ANALYSIS.md](docs/features/AI_ANALYSIS.md) - AI job analysis (Cloud API / Local CLI)

---

**Total:** ~260 lines | **Read time:** 2-3 minutes
**Last Updated:** January 2026
