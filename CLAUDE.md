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

### 2. External APIs - Job Search Providers + Gemini AI

**Job Search:** Strategy Pattern via `ProviderRegistry` (SerpAPI, Glassdoor)
**Gemini AI:** Job matching analysis (match score, strengths, gaps)

- API keys in `.env` (NEVER hardcode)
- Check Context7-MCP BEFORE installing/updating dependencies
- Location: `packages/server/src/services/ai.service.ts` & `providers/`

### 3. Job Deduplication & Data Isolation - ALWAYS Check

**Strategy:** Prevent duplicate jobs per user + Isolate all data

- **CRITICAL:** ALWAYS filter queries by `user_id`
- ALWAYS check `jobRepository.findByProviderJobId(provider, id, userId)`
- Database UNIQUE constraint on `user_id` + `provider` + `provider_job_id`
- Location: `packages/server/src/repositories/`

### 4. Authentication - JWT & Middleware

- **Protected Routes:** All API endpoints require `Authorization: Bearer <token>`
- **Auth Flow:** `authFetch` (Frontend) → `AuthMiddleware` (Backend) → `req.user`
- **Frontend State:** `authStore` manages session and token refresh
- Location: `packages/server/src/middleware/auth.middleware.ts` & `docs/AUTHENTICATION.md`

### 5. Search Profiles - Location OPTIONAL, date_posted REQUIRED

- **Empty location = Global search**
- **date_posted mandatory**: today, 3days, week, month
- Location: `packages/server/src/services/search.service.ts`

### 5. Manual Data Entry Support

**Glassdoor & Providers without Descriptions:**

- Some providers (Glassdoor) only return job metadata effectively.
- **Solution:** `PATCH /api/jobs/:id/description` allows manual description entry.
- **Workflow:** User copies text from external site → Paste in UI → Save → Enable AI analysis.

### 6. Context7-MCP Integration - MANDATORY for Dependencies

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
  ↓ ProviderRegistry → Select Provider (default: 'serpapi')
  ↓ ProviderSearch:
  │   - Convert profile to provider-specific params
  │   - Fetch jobs from external source
  ↓ JobRepository.create() → Save jobs (pre-check via findByProviderJobId)
  ↓ Optional: AIService.analyzeJobs() (Requires description)
    → If no description: UI prompts user to past manual description
  ↓ Frontend redirects to /jobs
  ↓ JobsList displays jobs with AI match scores
```

**Key Dependencies:**

- Job Deduplication ← provider + provider_job_id uniqueness
- AI Analysis ← CV content from settings
- Match Score ← Gemini AI integration
- Search Profiles ← Provider parameters

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
│   └── ...
├── services/                # Business logic
│   ├── job.service.ts
│   └── ...
├── repositories/            # Data access (SQL only)
│   ├── job.repository.ts
│   └── ...
├── routes/                  # Route definitions (e.g., job.routes.ts)
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
│   ├── Jobs.tsx             # Job list + Manual Description Logic
│   └── ...
├── stores/                  # Zustand state management
│   ├── jobStore.ts          # State + API calls
│   └── ...
└── api/
    └── client.ts            # API client
```

---

## Development Workflow

### Essential Commands

```bash
npm run dev              # All packages (server:3001 + web:3000)
npm run type-check       # TypeScript validation
npm run lint:fix         # Auto-fix issues
npm test                 # Run all tests (unit + integration)
```

### Browser Testing

```bash
claude --chrome          # Claude with browser testing
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

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
const existing = await this.jobRepository.findByProviderJobId(provider, jobId)
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

---

## Quick Fixes

| Issue                   | Solution                                        |
| ----------------------- | ----------------------------------------------- |
| Duplicate jobs          | Check `provider_job_id` before insert           |
| Missing CV for AI       | Upload CV in Settings                           |
| **Missing Description** | **Use 'Paste description manually' in UI**      |
| AI analysis fails (API) | Verify `GEMINI_API_KEY` in `.env`               |
| Switch AI method        | Settings page or use dropdown on Analyze button |
| Port conflict           | Kill process: `lsof -ti:3001 \| xargs kill -9`  |

---

## Documentation

- [QUICKSTART.md](docs/QUICKSTART.md) - 5 minutes setup
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [API_REFERENCE.md](docs/API_REFERENCE.md) - API endpoints
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment (Raspberry Pi, CI/CD, troubleshooting)
- [docs/ai/](docs/ai/) - AI-specific documentation
- [docs/features/](docs/features/) - Feature deep dives

---

**Last Updated:** January 2026
