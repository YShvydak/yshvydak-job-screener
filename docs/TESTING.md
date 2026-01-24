# Testing Guide

> **Stack:** Vitest 3.2 + Supertest + React Testing Library
> **Total Tests:** 176 (148 server + 28 web)

---

## Quick Commands

```bash
npm test                 # Run all tests (unified report)
npm run test:watch       # Watch mode
npm run test:ui          # Interactive UI
npm run test:coverage    # Coverage report
```

---

## Test Structure

```
packages/server/src/__tests__/
├── helpers/
│   ├── fixtures.ts      # Mock data (profiles, jobs, SerpAPI responses)
│   ├── database.ts      # seedProfile(), seedJob(), seedAnalysis()
│   └── testServer.ts    # setupTestServer(), teardownTestServer()
├── unit/
│   ├── repositories/
│   │   ├── job.repository.test.ts
│   │   ├── profile.repository.test.ts
│   │   ├── settings.repository.test.ts
│   │   └── analysis.repository.test.ts
│   └── services/
│       ├── search.service.test.ts
│       ├── job.service.test.ts
│       ├── profile.service.test.ts
│       └── ai.service.test.ts
└── integration/
    ├── jobs.integration.test.ts
    ├── profiles.integration.test.ts
    ├── settings.integration.test.ts
    ├── search.integration.test.ts
    └── ai.integration.test.ts

packages/web/src/__tests__/
├── setup.test.ts                     # environment check
├── jobStore.test.ts
├── profileStore.test.ts
├── settingsStore.test.ts
├── client.test.ts
├── Dashboard.test.tsx
├── Jobs.test.tsx
├── Profiles.test.tsx
└── Settings.test.tsx
```

---

## Key Patterns

### Unit Test (Repository)
```typescript
import Database from 'better-sqlite3'
import { JobRepository } from '../../../repositories/job.repository'

let db: Database.Database
let repository: JobRepository

beforeEach(() => {
  db = new Database(':memory:')
  db.exec(schema)  // Load schema.sql
  repository = new JobRepository(db)
})

afterEach(() => db.close())
```

### Unit Test (Service with Mocks)
```typescript
vi.mock('serpapi', () => ({ getJson: vi.fn() }))

const { getJson } = await import('serpapi')
vi.mocked(getJson).mockResolvedValue(fixtures.serpApiResponse)
```

### Integration Test (HTTP)
```typescript
import request from 'supertest'
import { setupTestServer, teardownTestServer } from '../helpers/testServer'

let server: TestServerInstance

beforeAll(async () => { server = await setupTestServer() })
afterAll(async () => { await teardownTestServer(server) })
beforeEach(() => { cleanTestDatabase(server) })

it('should return jobs', async () => {
  seedProfile(server.db)
  seedJob(server.db)

  const response = await request(server.app)
    .get('/api/jobs')
    .expect(200)

  expect(response.body.data.jobs).toHaveLength(1)
})
```

---

## Helpers Reference

### fixtures.ts
```typescript
fixtures.profile      // { id, name, keywords, location, ... }
fixtures.job          // { id, serpapi_job_id, title, company, ... }
fixtures.analysis     // { id, job_id, match_score, recommendation, ... }
fixtures.serpApiResponse      // { jobs_results: [...] }
fixtures.serpApiEmptyResponse // { jobs_results: [] }
```

### database.ts
```typescript
seedProfile(db, overrides?)   // Insert profile
seedJob(db, overrides?)       // Insert job (requires profile)
seedAnalysis(db, overrides?)  // Insert analysis (requires job)
```

### testServer.ts
```typescript
setupTestServer()      // Returns { app, db, dbPath }
teardownTestServer()   // Closes DB, removes temp files
cleanTestDatabase()    // Clears all tables
```

---

## Configuration

- **Server:** Node environment, sequential execution (DB isolation)
- **Web:** jsdom environment, React plugin
- **Root:** `vitest.config.ts` with `test.projects`

---

## Adding New Tests

1. **Unit test** → `packages/server/src/__tests__/unit/{layer}/{name}.test.ts`
2. **Integration test** → `packages/server/src/__tests__/integration/{name}.integration.test.ts`
3. **UI/Page test** → `packages/web/src/__tests__/{Name}.test.tsx`
4. **Store test** → `packages/web/src/__tests__/{storeName}.test.ts`

**Rules:**
- Use fixtures from `helpers/fixtures.ts`
- Mock external APIs (SerpAPI, Gemini)
- Clean database in `beforeEach`
- Follow existing test patterns in codebase

---

**Last Updated:** January 2026
