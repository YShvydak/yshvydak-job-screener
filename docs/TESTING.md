# Testing Guide

> **Stack:** Vitest 3.2 + Supertest + React Testing Library
> **Total Tests:** 54 (51 server + 3 web)

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
│   │   └── job.repository.test.ts    # 24 tests
│   └── services/
│       └── search.service.test.ts    # 11 tests
└── integration/
    └── jobs.integration.test.ts      # 16 tests

packages/web/src/__tests__/
└── setup.test.ts                     # 3 tests (environment check)
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
3. **Component test** → `packages/web/src/__tests__/components/{Name}.test.tsx`

**Rules:**
- Use fixtures from `helpers/fixtures.ts`
- Mock external APIs (SerpAPI, Gemini)
- Clean database in `beforeEach`
- Follow existing test patterns in codebase

---

**Last Updated:** January 2026
