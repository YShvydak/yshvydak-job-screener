# File Location Reference

Complete file structure for quick navigation. This reflects the **actual implemented** structure.

---

## Backend Structure (Layered Architecture)

```
packages/server/src/
├── index.ts                     # Entry point + Express setup + all routes
│
├── config/
│   └── environment.config.ts    # Environment variables validation
│
├── utils/
│   ├── ResponseHelper.ts        # Standardized API responses
│   └── Logger.ts                # Centralized logging
│
├── controllers/                 # HTTP request handlers (thin layer)
│   ├── job.controller.ts        # GET /api/jobs, PATCH /api/jobs/:id/status
│   ├── profile.controller.ts    # CRUD /api/profiles
│   ├── search.controller.ts     # POST /api/search/run
│   ├── settings.controller.ts   # GET/PUT /api/settings, POST /api/settings/cv
│   └── ai.controller.ts         # POST /api/ai/analyze
│
├── services/                    # Business logic
│   ├── job.service.ts           # Job management, status updates
│   ├── profile.service.ts       # Profile CRUD, validation
│   ├── search.service.ts        # SerpAPI integration, job fetching
│   └── ai.service.ts            # Gemini AI analysis
│
├── repositories/                # Data access (SQL only)
│   ├── job.repository.ts        # Jobs CRUD + findBySerpAPIId()
│   ├── profile.repository.ts    # Profiles CRUD + toggleActive()
│   ├── settings.repository.ts   # Settings key-value store
│   └── analysis.repository.ts   # AI analyses CRUD
│
├── routes/                      # Route definitions
│   ├── job.routes.ts
│   ├── profile.routes.ts
│   ├── search.routes.ts
│   ├── settings.routes.ts
│   └── ai.routes.ts
│
└── database/
    ├── database.manager.ts      # SQLite wrapper (better-sqlite3)
    └── schema.sql               # Database schema definition
```

---

## Frontend Structure (Pages + Stores)

```
packages/web/src/
├── main.tsx                     # Application entry point
├── App.tsx                      # Main app with React Router
├── index.css                    # Tailwind imports
├── vite-env.d.ts               # Vite TypeScript declarations
│
├── pages/                       # Page components
│   ├── Dashboard.tsx            # Statistics and overview
│   ├── Jobs.tsx                 # Job listings with filters
│   ├── Profiles.tsx             # Search profiles management
│   └── Settings.tsx             # CV upload, settings
│
├── stores/                      # Zustand state management
│   ├── jobStore.ts              # Jobs state, filters, actions
│   ├── profileStore.ts          # Profiles state, CRUD actions
│   └── settingsStore.ts         # Settings state
│
├── components/
│   └── Layout.tsx               # Main layout with navigation
│
└── api/
    └── client.ts                # API client (fetch wrapper)
```

---

## Shared Types

```
shared/src/
├── index.ts                     # Re-exports all types
└── types/
    ├── job.types.ts             # Job, JobInput, JobStatus
    ├── profile.types.ts         # SearchProfile, SearchProfileInput
    └── api.types.ts             # ApiResponse, ApiError
```

---

## Configuration Files

```
Root:
├── package.json                 # Root with workspaces
├── turbo.json                   # Turborepo configuration
├── tsconfig.json                # Root TypeScript config
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Example environment file
├── .gitignore
├── CLAUDE.md                    # AI development reference
└── requirements.md              # Product specification

.claude/
├── settings.local.json          # Claude Code settings
└── rules/                       # Modular rules for Claude
    ├── backend.md               # Server-specific rules
    ├── frontend.md              # React-specific rules
    ├── serpapi.md               # SerpAPI integration rules
    └── database.md              # Database/repository rules

packages/server:
├── package.json
├── tsconfig.json
└── data/
    └── jobs.db                  # SQLite database (gitignored)

packages/web:
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Quick Find

| Need to... | Location |
|------------|----------|
| Add new API endpoint | `packages/server/src/controllers/` + `routes/` |
| Add business logic | `packages/server/src/services/` |
| Add database query | `packages/server/src/repositories/` |
| Add new page | `packages/web/src/pages/` |
| Add state management | `packages/web/src/stores/` |
| SerpAPI integration | `packages/server/src/services/search.service.ts` |
| Gemini AI integration | `packages/server/src/services/ai.service.ts` |
| Job deduplication | `packages/server/src/repositories/job.repository.ts` |
| Database schema | `packages/server/src/database/schema.sql` |
| Environment config | `packages/server/src/config/environment.config.ts` |
| Shared types | `shared/src/types/` |

---

## Architecture Flow

```
HTTP Request
    ↓
Controller (thin layer - request/response only)
    ↓
Service (business logic - orchestration)
    ↓
Repository (data access - SQL queries only)
    ↓
DatabaseManager (SQLite wrapper)
    ↓
Database (jobs.db)
```

---

**Last Updated:** January 2026
**Status:** Reflects actual implemented structure
