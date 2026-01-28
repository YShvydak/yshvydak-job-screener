# Architecture Documentation

## Overview

YShvydak Job Screener follows a **Simplified Layered Architecture** pattern with clear separation of concerns across all components.

The system is designed to:

- Automate job search using SerpAPI
- Analyze job matches using Google Gemini AI
- Track application status
- Provide a clean, intuitive user interface

---

## Monorepo Structure

```
yshvydak-job-screener/
├── packages/
│   ├── server/    # Express API + Business Logic + SQLite
│   └── web/       # React + Vite UI
├── shared/        # Shared TypeScript types
├── docs/          # Documentation
├── .claude/       # Claude Code configuration
├── turbo.json     # Turborepo configuration
└── package.json   # Root package.json with workspaces
```

**Why Simplified?**

- No separate `core` package (types in `shared/`)
- No `reporter` package (not applicable)
- Easier to maintain
- Faster to develop

---

## Server Layered Architecture

```
packages/server/src/
├── app.ts, server.ts                    # Application setup and startup
├── config/                              # Environment config and constants
├── types/                               # TypeScript interfaces for all layers
├── utils/                               # Helpers (ResponseHelper, Logger, FileUtil)
├── middleware/                          # Service injection, CORS, error handling
├── controllers/                         # HTTP request handlers (thin layer)
├── services/                           # Business logic (SearchService, AIService)
├── repositories/                       # Data access layer (JobRepository, etc.)
├── routes/                             # Route definitions with dependency injection
├── database/                           # DatabaseManager and schema
└── external/                           # External API clients (SerpAPI, Gemini)
```

## Layered Architecture Pattern

The server follows a clean **Layered Architecture** with clear separation of concerns:

- **Controllers** (`*.controller.ts`) - HTTP request/response handling only
- **Services** (`*.service.ts`) - Business logic and orchestration
- **Repositories** (`*.repository.ts`) - Data access and database operations
- **Middleware** - Cross-cutting concerns (error handling, logging, dependency injection)

### Architecture Flow

```
HTTP Request
    ↓
Controller (thin layer)
    ├─ Validate request
    ├─ Extract parameters
    └─ Delegate to Service
    ↓
Service (business logic)
    ├─ Orchestrate workflow
    ├─ Call external APIs (SerpAPI, Gemini)
    ├─ Call repositories for data
    └─ Business validation
    ↓
Repository (data access)
    ├─ SQL queries only
    ├─ Data mapping
    └─ Return domain models
    ↓
DatabaseManager (SQLite wrapper)
    ├─ Execute queries
    ├─ Connection management
    └─ Transaction support
    ↓
SQLite Database
```

**Example:**

```typescript
// 1. Controller (thin)
export class SearchController {
    async runSearch(req: Request, res: Response) {
        const { profileId, analyzeWithAI } = req.body;
        const result = await req.services.searchService.runSearch(profileId, analyzeWithAI);
        ResponseHelper.success(res, result);
    }
}

// 2. Service (business logic)
export class SearchService {
    async runSearch(profileId: string, analyzeWithAI: boolean) {
        // Get profile
        const profile = await this.profileRepository.findById(profileId);

        // Fetch jobs from SerpAPI
        const serpResults = await this.fetchFromSerpAPI(profile);

        // Save jobs (prevent duplicates)
        const savedJobs = await this.saveJobs(serpResults, profileId);

        // Optionally analyze with AI
        if (analyzeWithAI) {
            await this.aiService.analyzeJobs(savedJobs.map(j => j.id));
        }

        return { jobsFound: serpResults.length, newJobs: savedJobs.length };
    }
}

// 3. Repository (data access)
export class JobRepository {
    async findBySerpAPIId(serpApiId: string): Promise<Job | null> {
        return this.db.get("SELECT * FROM jobs WHERE serpapi_job_id = ?", [serpApiId]);
    }

    async create(job: JobInput): Promise<Job> {
        const result = await this.db.run(
            "INSERT INTO jobs (...) VALUES (...)",
            [...]
        );
        return this.findById(result.lastID);
    }
}
```

---

## Key Components

### Service Layer

#### SearchService

- **Purpose:** Job search orchestration via providers
- **Key Methods:**
    - `runSearch()` - Main search workflow
    - `executeSearch()` - Execute search using specific or default provider
    - `saveJobs()` - Save jobs preventing duplicates across providers

#### Provider Layer (Strategy Pattern)

- **Purpose:** Abstract fetching logic for different job sources
- **Components:**
    - `ProviderRegistry` - Manages and selects providers
    - `BaseProvider` - Interface for all providers
    - `SerpAPIProvider` - Google Jobs integration
    - `GlassdoorProvider` - Glassdoor integration

#### AIService

- **Purpose:** Google Gemini AI integration for job matching analysis
- **Key Methods:**
    - `analyzeJobs()` - Batch analyze jobs
    - `analyzeJob()` - Single job analysis with CV
    - `buildPrompt()` - Build Gemini prompt
    - `parseAIResponse()` - Parse Gemini JSON response

#### JobService

- **Purpose:** Job management and status tracking
- **Key Methods:**
    - `getJobs()` - Get jobs with filters
    - `getJobById()` - Get job with AI analysis
    - `updateJobStatus()` - Update job status

#### ProfileService

- **Purpose:** Search profile management
- **Key Methods:**
    - `getProfiles()` - Get all profiles
    - `createProfile()` - Create new profile
    - `updateProfile()` - Update profile
    - `toggleProfileActive()` - Toggle active/inactive

#### CVService

- **Purpose:** CV parsing and storage
- **Key Methods:**
    - `uploadCV()` - Upload and parse CV
    - `getCV()` - Get CV content
    - `parseCV()` - Parse CV from file

### Repository Layer

#### JobRepository

- **Purpose:** Job CRUD operations
- **Key Methods:**
    - `findBySerpAPIId()` - ⚠️ CRITICAL: Check for duplicates
    - `findByFilters()` - Filter jobs by status/score/profile
    - `create()` - Insert new job
    - `updateStatus()` - Update job status

#### ProfileRepository

- **Purpose:** Profile CRUD operations
- **Methods:** Standard CRUD + `toggleActive()`

#### AIAnalysisRepository

- **Purpose:** AI analysis CRUD operations
- **Methods:** `findByJobId()`, `create()`, `update()`

#### SettingsRepository

- **Purpose:** Settings CRUD operations (key-value store)
- **Methods:** `get()`, `set()`, `getAll()`

### External API Clients

#### SerpAPI Client

- **Purpose:** Google Jobs search API integration
- **Configuration:** `google_jobs` engine
- **Response:** Array of job results

#### Gemini AI Client

- **Purpose:** Google Gemini AI integration
- **Model:** `gemini-pro`
- **Response:** JSON analysis (match score, strengths, gaps, reasoning)

### Dependency Injection

- **ServiceContainer** - Manages all service instances
- **injectServices** middleware - Provides services to request objects
- All services injected into `req.services`

---

## Database Architecture

### Strategy: INSERT-only for History

**Philosophy:** Track all job applications over time

- Jobs table: Job listings from SerpAPI
- Status tracking: `new → applied/saved/rejected`
- No UPDATE operations on job content (INSERT new if changed)
- One AI analysis per job (UNIQUE constraint on `job_id`)

### Schema

```sql
-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Search Profiles (user-defined search criteria)
CREATE TABLE search_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ...
);

-- Jobs (fetched from SerpAPI)
CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    profile_id TEXT REFERENCES search_profiles(id),
    ...
    UNIQUE(user_id, provider, provider_job_id) -- ⚠️ Prevent duplicates per user
);
...
```

### Authentication & Authorization

The system implements a secure **JWT-based authentication** system:

1. **Auth Service:** Handles registration, login, password hashing (bcrypt), and token generation.
2. **Auth Middleware:** Intercepts requests, validates JWT tokens, and attaches `req.user`.
3. **Data Isolation:** All repositories automatically filter data by `userId`.

### Key Database Decisions

1. **User Ownership:** All major entities (`jobs`, `search_profiles`, `settings`) belong to a user.
2. **Job Deduplication:** UNIQUE constraint on `user_id` + `provider` + `provider_job_id`
    - Prevents duplicates for the _same user_.
    - Allows different users to have the same job (independent tracking).

3. **One Analysis Per Job:** UNIQUE constraint on `job_id` in ai_analyses
    - Only one AI analysis per job
    - Can be updated if job is re-analyzed

4. **Settings as Key-Value Store:**
    - Flexible configuration storage
    - CV content stored as text
    - Easy to extend

5. **Status Tracking:**
    - Simple enum: `new`, `applied`, `saved`, `rejected`
    - Updated via PATCH `/api/jobs/:id/status`

---

## API Architecture

### RESTful Endpoints

#### Jobs

```
GET    /api/jobs                      # List all jobs with filters
GET    /api/jobs/:id                  # Get job details + AI analysis
PATCH  /api/jobs/:id/status           # Update job status
POST   /api/jobs/:id/notes            # Add note to job (MVP+)
```

#### Search Profiles

```
GET    /api/profiles                  # List all profiles
POST   /api/profiles                  # Create new profile
GET    /api/profiles/:id              # Get profile details
PUT    /api/profiles/:id              # Update profile
DELETE /api/profiles/:id              # Delete profile
PATCH  /api/profiles/:id/toggle       # Toggle active/inactive
```

#### Search Execution

```
POST   /api/search/run                # Trigger manual search
                                      # Body: { profileId, analyzeWithAI }
```

#### Dashboard

```
GET    /api/dashboard/stats           # Get statistics
```

#### Settings

```
GET    /api/settings                  # Get all settings
PUT    /api/settings                  # Update settings
POST   /api/settings/cv               # Upload CV (multipart/form-data)
GET    /api/settings/cv               # Download CV
```

### API Response Format

**Success:**

```json
{
    "success": true,
    "data": { ... }
}
```

**Error:**

```json
{
    "success": false,
    "error": "Error message"
}
```

---

## Frontend Pages-Based Architecture

The web package (`packages/web/`) follows a **Pages-Based Architecture** with Zustand for state management.

### Architecture Structure

```
packages/web/src/
├── pages/                          # Page components (one per route)
│   ├── Dashboard.tsx               # Statistics and overview
│   ├── Jobs.tsx                    # Job listings with filters
│   ├── Profiles.tsx                # Search profiles management
│   └── Settings.tsx                # CV upload, settings
├── stores/                         # Zustand state management
│   ├── jobStore.ts                 # Jobs state, actions
│   ├── profileStore.ts             # Profiles state, actions
│   └── settingsStore.ts            # Settings state
├── components/
│   └── Layout.tsx                  # Main layout with navigation
├── api/
│   └── client.ts                   # API client (fetch wrapper)
└── App.tsx                         # Main app with routing
```

### Key Principles

#### 1. Pages-Based Organization

- **One page = one route** - Simple mapping
- **Self-contained** - Each page handles its own logic
- **Components extracted** - Large pages split into components within same file or separate

#### 2. Zustand Store Organization

- **Domain-level stores:** One store per domain (jobs, profiles, settings)
- **API calls in stores:** Centralized data fetching
- **Simple actions:** Direct state updates

#### 3. Component Size Best Practice

- **Maximum 200 lines per file** - Extract if larger
- **Inline components OK** - For page-specific UI (ProfileForm, JobCard, etc.)

### Pages Breakdown

#### Jobs Page

- Job listings with status filters
- Job detail modal
- Status update actions
- AI analysis display

#### Profiles Page

- Profile list with CRUD
- Inline ProfileForm component
- Run search action
- Location is optional (global search)

#### Dashboard Page

- Statistics cards
- Recent jobs overview

#### Settings Page

- CV content textarea
- Save settings

---

## Technology Stack

### Frontend

- React 18 + TypeScript
- Vite 6 for development
- Tailwind CSS for styling
- Zustand for state management
- **Architecture:** Feature-Based + Atomic Design

### Backend (Layered Architecture)

- Express.js + TypeScript
- SQLite 3 for persistence
- Dependency Injection for service management
- Layered architecture (Controller → Service → Repository)

### External APIs

- **SerpAPI:** Google Jobs search
- **Google Gemini AI:** Job matching analysis

### Development

- Turborepo for monorepo management
- TypeScript 5 across all packages
- ESLint for code quality
- Prettier for code formatting
- Vitest for testing

---

## Security Considerations

### API Keys

- ❌ NEVER hardcode API keys
- ✅ ALWAYS use environment variables
- ✅ Keys in `.env` (gitignored)
- ✅ `.env.example` for documentation

### SQL Injection Prevention

- ✅ ALWAYS use parameterized queries
- ✅ NEVER concatenate user input into SQL
- Example: `db.run("SELECT * FROM jobs WHERE id = ?", [id])`

### Input Validation

- ✅ Validate all user inputs
- ✅ Sanitize before database insert
- ✅ Type checking with TypeScript

---

## Performance Considerations

### Database

- ✅ Indexes on frequently queried columns
- ✅ Efficient SQL queries
- ✅ Connection pooling (if needed)

### Frontend

- ✅ Code splitting (Vite)
- ✅ Lazy loading routes
- ✅ Memoization where needed
- ✅ Efficient re-renders (Zustand)

### External APIs

- ✅ Error handling and retries
- ✅ Rate limiting awareness
- ✅ Caching where appropriate

---

## Deployment Architecture (Raspberry Pi 5)

```
┌─────────────────────────────────────┐
│   Raspberry Pi 5 (8GB)              │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Node.js Process              │  │
│  │  ├─ Express API (port 3001)   │  │
│  │  └─ Vite Dev/Prod (port 3000) │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  SQLite Database              │  │
│  │  └─ ./data/jobs.db            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Environment                  │  │
│  │  └─ .env (API keys)           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         ↓ HTTP/HTTPS
    ┌─────────┐
    │ Internet│
    └─────────┘
         ↓
    ┌─────────────┬──────────────┐
    │   SerpAPI   │  Gemini AI   │
    └─────────────┴──────────────┘
```

**Production Setup:**

- PM2 for process management
- Nginx as reverse proxy (optional)
- Systemd service for auto-start
- Log rotation
- Backup strategy for SQLite

---

## Related Documentation

- [Development Guidelines](./DEVELOPMENT.md)
- [Configuration Details](./CONFIGURATION.md)
- [API Reference](./API_REFERENCE.md)
- [Quick Start Guide](./QUICKSTART.md)
- [AI Documentation](./ai/README.md)

---

**Last Updated:** January 2026
**Status:** Reflects actual implementation
