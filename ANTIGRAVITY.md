# ANTIGRAVITY.md - Vibe Code Development Instructions

> **Project:** YShvydak Job Screener - AI-powered job matching automation
> **Type:** Open Source (Personal Job Search Automation)
> **Stack:** Express + React + SQLite + SerpAPI + Glassdoor API + Google Gemini AI
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

### 2. External APIs (Multi-Provider Strategy)

**Primary: SerpAPI (Google Jobs)**

- Location: `packages/server/src/providers/serpapi.provider.ts`
- Status: **Stable, Production Ready**

**Secondary: Glassdoor (OpenWeb Ninja)**

- Location: `packages/server/src/providers/glassdoor.provider.ts`
- Status: **ALPHA / TESTING**. Use with caution.
- _Strictly type-safe via `IJobSearchProvider` interface._

**AI Analysis: Gemini AI**

- Location: `packages/server/src/services/ai.service.ts`
- Status: **Stable**

### 3. Job Deduplication & Storage

**Strategy:**

- Jobs are identified by `provider` + `provider_job_id`.
- `serpapi_job_id` is deprecated (mapped to `provider_job_id`).
- **ALWAYS** check for existence using `jobRepository.findByProviderId(provider, id)` before insert.

### 4. Context7-MCP Integration - MANDATORY

**ALWAYS check Context7-MCP before:**

- Adding/Updating packages
- Changing configuration
- _Why:_ Prevents dependency hell and breaking changes.

---

## Project Structure (Current State)

### Backend (Express + SQLite)

```plaintext
packages/server/src/
├── index.ts
├── config/environment.config.ts    # Env validation (SerpAPI, Glassdoor, Gemini)
├── providers/                      # New Provider Layer
│   ├── index.ts                    # Registry
│   ├── serpapi.provider.ts
│   └── glassdoor.provider.ts
├── services/                       # Business Logic (Provider-agnostic)
├── repositories/                   # Data Access
├── database/
│   ├── database.manager.ts         # Robust Schema+Migration loader
│   ├── schema.sql
│   └── migrations/                 # SQL migrations (Shipped to Prod)
└── ...
```

### Frontend (React + Zustand)

- `packages/web/src/pages/` - UI Pages
- `packages/web/src/stores/` - State Management

---

## Development Workflow

### Essential Commands

```bash
npm run dev              # Start dev server (server:3001 + web:3000)
npm run type-check       # Validate types
npm run lint:fix         # Fix linting
```

### Deployment (Raspberry Pi)

- **CI/CD:** GitHub Actions → Self-hosted Runner.
- **Build Process:** Copies `schema.sql` AND `migrations/` to `dist/`.
- **Database:** Auto-migrates on startup. **Do not manually touch the DB file.**

---

## Known Issues (Vibe Coding Focus)

| Issue              | Status   | Note                                                            |
| ------------------ | -------- | --------------------------------------------------------------- |
| **Glassdoor API**  | ⚠️ Alpha | Integration is basic. Verify data quality before relying on it. |
| **Schema Changes** | ✅ Fixed | Race condition fixed in `database.manager.ts`.                  |
| **Migrations**     | ✅ Fixed | Now included in production build artifact.                      |

---

## Anti-Patterns (NEVER DO)

### ❌ Hardcoding API Keys

```typescript
// WRONG: const key = "123"
// RIGHT: const key = env.GLASSDOOR_API_KEY
```

### ❌ Bypassing Provider Abstraction

```typescript
// WRONG: new SerpAPIProvider().search(...) inside controller
// RIGHT: searchService.search(...) -> delegates to registered providers
```

### ❌ Ignoring Duplicate Checks

```typescript
// WRONG: jobRepository.create(job)
// RIGHT: if (!exists) jobRepository.create(job)
```

---

## Database Schema (Key Tables)

### jobs

- `id` (PK)
- `provider` (TEXT) - 'serpapi' | 'glassdoor'
- `provider_job_id` (TEXT) - External ID
- `profile_id` (FK)
- `status` (new/applied/saved/rejected)

### search_profiles

- `preferred_provider` (TEXT) - Optional override

---

**Last Updated:** 2026-01-26
**Optimized for:** Antigravity IDE (Vibe Code Mode)
