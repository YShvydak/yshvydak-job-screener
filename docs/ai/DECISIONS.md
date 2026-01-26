# Architecture Decision Records (ADR)

This document captures key architectural decisions made during development, including context, rationale, and consequences.

---

## ADR-001: SQLite for Data Storage

**Date:** January 2026
**Status:** Accepted

### Context

Need a database for storing jobs, profiles, AI analyses, and settings. Options considered:

- PostgreSQL (full-featured, requires server)
- MySQL (similar to PostgreSQL)
- SQLite (file-based, zero-config)
- MongoDB (NoSQL, document-based)

### Decision

Use **SQLite** via `better-sqlite3` package.

### Rationale

1. **Self-hosted on Raspberry Pi** - Minimal resource requirements
2. **Single user application** - No concurrent write needs
3. **Zero configuration** - No database server to manage
4. **Portable** - Single file (`jobs.db`) for backup/migration
5. **Fast reads** - Excellent performance for read-heavy workloads

### Consequences

- (+) Simple deployment
- (+) Easy backups (copy single file)
- (+) Fast local queries
- (-) No concurrent writes
- (-) Limited query features vs PostgreSQL

---

## ADR-002: SerpAPI for Job Search

**Date:** January 2026
**Status:** Accepted

### Context

Need to fetch job listings from multiple sources. Options considered:

- Direct scraping (brittle, legal issues)
- LinkedIn API (requires partnership)
- Indeed API (deprecated)
- SerpAPI (aggregator, google_jobs engine)

### Decision

Use **SerpAPI** with `google_jobs` engine.

### Rationale

1. **Google Jobs aggregation** - Jobs from LinkedIn, Indeed, Glassdoor in one API
2. **Structured data** - Clean JSON response
3. **Free tier** - 100 searches/month for personal use
4. **No scraping issues** - Legitimate API access

### Consequences

- (+) Multiple sources in one API call
- (+) Structured, reliable data
- (+) Legal and supported
- (-) 100 searches/month limit on free tier
- (-) Paid plans for heavy usage

---

## ADR-003: Google Gemini AI for Job Analysis

**Date:** January 2026
**Status:** Accepted

### Context

Need AI to analyze job-CV match. Options considered:

- OpenAI GPT-4 (powerful, expensive)
- Claude API (high quality, usage limits)
- Google Gemini (free tier, good quality)
- Local LLM (complex setup)

### Decision

Use **Google Gemini AI** (`gemini-pro` model).

### Rationale

1. **Free tier available** - Good for personal project
2. **Quality analysis** - Comparable to GPT-3.5
3. **JSON mode** - Can request structured output
4. **Fast response** - Good latency

### Consequences

- (+) Free for personal use
- (+) Good quality analysis
- (-) Less powerful than GPT-4
- (-) Google account required

---

## ADR-004: Location Parameter Made Optional

**Date:** January 2026
**Status:** Accepted

### Context

Initial implementation required location for search profiles. Testing revealed:

- SerpAPI works without location (global search)
- Users may want worldwide job search
- Specific location sometimes returns 0 results

### Decision

Make **location optional** in search profiles. Empty location = global search.

### Rationale

1. **Flexibility** - Users can search globally or locally
2. **SerpAPI support** - API works without location
3. **Better results** - Global search often returns more jobs
4. **User choice** - Let users decide scope

### Implementation

```typescript
// SerpAPI params
if (profile.location && profile.location.trim()) {
    params.location = profile.location
    if (profile.radius) {
        params.lrad = Math.round(profile.radius * 0.621371)
    }
}
// If no location, params.location is not added = global search
```

### Consequences

- (+) More flexibility for users
- (+) Better results for global roles
- (+) Simpler UX (location not required)
- (-) Database still has `location` column (can be empty string)

---

## ADR-005: Layered Architecture Pattern

**Date:** January 2026
**Status:** Accepted

### Context

Need to structure backend code for maintainability. Options considered:

- MVC (Model-View-Controller)
- Clean Architecture (complex for this project)
- Layered Architecture (simple, proven)
- Feature-based (more complex)

### Decision

Use **Layered Architecture**: Controller → Service → Repository → Database

### Rationale

1. **Clear separation** - Each layer has single responsibility
2. **Testability** - Can mock layers for testing
3. **Maintainability** - Easy to find code by layer
4. **Familiar pattern** - Well-known to most developers

### Implementation

```
Controller (HTTP handling)
    ↓
Service (Business logic)
    ↓
Repository (Data access)
    ↓
Database (SQLite)
```

### Consequences

- (+) Clean code organization
- (+) Easy to test
- (+) Easy to understand
- (-) Some boilerplate code
- (-) Need to create files in multiple folders

---

## ADR-006: Pages-based Frontend Architecture

**Date:** January 2026
**Status:** Accepted

### Context

Need to structure React frontend. Options considered:

- Feature-based (`features/{name}/components/`)
- Pages-based (`pages/`, `stores/`)
- Atomic Design (atoms, molecules, organisms)

### Decision

Use **Pages-based architecture** with Zustand stores.

### Rationale

1. **Simplicity** - MVP doesn't need complex structure
2. **Fast development** - Fewer files to create
3. **Clear routing** - One page = one route
4. **Zustand simplicity** - Simple state management

### Implementation

```
pages/           # Dashboard, Jobs, Profiles, Settings
stores/          # jobStore, profileStore, settingsStore
components/      # Shared components (Layout)
api/             # API client
```

### Consequences

- (+) Simple, fast to develop
- (+) Easy to understand
- (+) Works well for MVP
- (-) May need restructuring for larger scale
- (-) Pages can grow large (addressed by extracting components)

---

## ADR-007: Job Deduplication via serpapi_job_id

**Date:** January 2026
**Status:** Accepted

### Context

Running multiple searches can return same job multiple times. Need to prevent duplicates.

### Decision

Use `serpapi_job_id` with UNIQUE database constraint for deduplication.

### Rationale

1. **SerpAPI provides unique ID** - `job_id` in response
2. **Database-level safety** - UNIQUE constraint as backup
3. **Application-level check** - `findBySerpAPIId()` before insert
4. **Belt and suspenders** - Two layers of protection

### Implementation

```sql
CREATE TABLE jobs (
    ...
    serpapi_job_id TEXT,
    UNIQUE(serpapi_job_id)
);
```

```typescript
// Always check before insert
const existing = await this.jobRepository.findBySerpAPIId(job.job_id)
if (!existing) {
    await this.jobRepository.create(jobData)
}
```

### Consequences

- (+) No duplicate jobs
- (+) Safe even with race conditions
- (+) Clean database
- (-) Extra query per job (acceptable trade-off)

---

## ADR-008: English Results Default (hl='en')

**Date:** January 2026
**Status:** Accepted

### Context

SerpAPI returns results in different languages based on location. Need consistent results.

### Decision

Always include `hl: 'en'` parameter for English results.

### Rationale

1. **Consistency** - All results in English
2. **Global search** - English is common for tech jobs
3. **AI analysis** - Better with consistent language

### Implementation

```typescript
const params = {
    engine: 'google_jobs',
    q: profile.keywords,
    hl: 'en', // Always English
    // ...
}
```

### Consequences

- (+) Consistent results
- (+) Better AI analysis
- (-) May miss non-English jobs

---

## Future Decisions to Consider

### Pending: Automated Search Scheduling

- Cron job for automatic searches
- Not in MVP scope
- Will need ADR when implemented

### Pending: Multi-user Support

- Authentication and authorization
- Separate job databases per user
- Will need ADR if implemented

### Pending: Export Functionality

- Export jobs to CSV/PDF
- Export AI analyses
- Will need ADR when designed

---

**Last Updated:** January 2026
**Maintained by:** Development Team

---

## ADR-009: Multi-Provider Search Architecture

**Date:** January 2026
**Status:** Accepted

### Context

Need to support multiple job sources (SerpAPI, Glassdoor, etc.) instead of just one. Initial single-provider implementation was limiting.

### Decision

Implement **Strategy Pattern** for job providers with a centralized **ProviderRegistry**.
Update deduplication logic to be provider-aware.

### Rationale

1.  **Extensibility** - easily add new providers (Indeed, LinkedIn, etc.)
2.  **Abstraction** - `SearchService` doesn't need to know provider implementation details
3.  **Flexibility** - Users can choose preferred provider per profile
4.  **Fallback capabilities** - Future potential to fallback between providers

### Implementation

1.  **Provider Layer**:

    ```typescript
    interface BaseProvider {
        search(params: SearchParams): Promise<Job[]>
    }
    class SerpAPIProvider implements BaseProvider { ... }
    class GlassdoorProvider implements BaseProvider { ... }
    ```

2.  **Database Change**:
    - Add `provider` column
    - Add `provider_job_id` column
    - Unique constraint: `UNIQUE(provider, provider_job_id)`
    - Deprecate `serpapi_job_id` (keep for legacy compatibility)

### Consequences

- (+) scalable architecture
- (+) provider-agnostic core logic
- (-) slightly more complex initial setup
- (-) need to normalize data from different sources
