# Development Guidelines

Best practices and workflows for developing YShvydak Job Screener.

---

## Development Commands

### Root Level Commands (using Turborepo)

```bash
npm run dev              # Start all packages (server + web)
npm run build            # Build all packages
npm test                 # Run all tests across packages
npm run type-check       # TypeScript validation
npm run lint             # Lint all packages
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
npm run clean            # Clean build artifacts
```

### Individual Package Development

**Server Package (API):**

```bash
cd packages/server
npm run dev          # Start with auto-reload
npm run build        # Build for production
npm run type-check   # TypeScript validation
npm test             # Run tests
```

**Web Package (React app):**

```bash
cd packages/web
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
npm test             # Run tests
```

---

## Development Workflow with /feature-dev

**Primary Skill:** `/feature-dev` (built-in)

Use this skill for all feature development:

```bash
/feature-dev add search profiles management
/feature-dev implement AI job analysis
/feature-dev fix job duplication bug
```

**Automatic Workflow:**

1. 🔍 Code exploration
2. 📋 Architecture planning
3. 💻 Implementation
4. 🧪 Testing
5. 🤖 Code review

---

## Project-Specific Rules (MANDATORY)

When using `/feature-dev`, YOU MUST follow these rules:

### 1. Layered Architecture

**Flow:** Controller → Service → Repository → Database

**Wrong:**

```typescript
// In service - NEVER do direct database access
const jobs = await this.db.query('SELECT * FROM jobs')
```

**Right:**

```typescript
// ALWAYS use repository layer
const jobs = await this.jobRepository.findAll()
```

### 2. Job Deduplication

**Always check `serpapi_job_id` before inserting:**

```typescript
const existing = await this.jobRepository.findBySerpAPIId(result.job_id)
if (!existing) {
    await this.jobRepository.create(jobData)
}
```

### 3. Context7-MCP for Dependencies

**ALWAYS check Context7-MCP before adding/updating dependencies:**

```bash
# WRONG
npm install @google/generative-ai

# RIGHT
# 1. Check Context7-MCP first
# 2. Read latest docs and breaking changes
# 3. Then install
npm install @google/generative-ai
```

---

## Adding New Features

### Backend Features (Server)

**1. Create Controller:**

```typescript
// packages/server/src/controllers/job.controller.ts
export class JobController {
    async getJobs(req: Request, res: Response) {
        const jobs = await req.services.jobService.getJobs()
        ResponseHelper.success(res, jobs)
    }
}
```

**2. Create Service:**

```typescript
// packages/server/src/services/job.service.ts
export class JobService {
    async getJobs() {
        return await this.jobRepository.findAll()
    }
}
```

**3. Create Repository:**

```typescript
// packages/server/src/repositories/job.repository.ts
export class JobRepository {
    async findAll() {
        return this.db.all('SELECT * FROM jobs')
    }
}
```

**4. Add Route:**

```typescript
// packages/server/src/routes/job.routes.ts
router.get('/jobs', jobController.getJobs)
```

### Frontend Features (Web)

Follow **Feature-Based Architecture:**

**1. Create feature directory:**

```bash
packages/web/src/features/{feature-name}/
├── components/       # Feature-specific components
├── hooks/           # Custom hooks
├── store/           # Zustand store
├── types/           # TypeScript types
├── utils/           # Helper functions
└── constants/       # Constants and enums
```

**2. Add components:**

- Keep components under 200 lines
- Split large components into smaller ones
- Use Atomic Design for shared components

**3. Add Zustand store:**

```typescript
// features/jobs/store/jobsStore.ts
export const useJobsStore = create<JobsState>()(
    devtools((set, get) => ({
        jobs: [],
        fetchJobs: async () => { ... }
    }))
);
```

**4. Export public API:**

```typescript
// features/jobs/index.ts
export * from './components'
export * from './hooks'
export * from './store/jobsStore'
```

---

## Code Quality Standards

### TypeScript

✅ **DO:**

- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use type inference where possible

❌ **DON'T:**

- Use `any` unless absolutely necessary
- Ignore type errors
- Disable strict checks

### ESLint

```bash
# Fix linting issues
npm run lint:fix
```

**Rules:**

- No unused variables
- No console.log (use Logger)
- Consistent code style

### Prettier

```bash
# Format all files
npm run format
```

**Configuration:**

- 4 spaces indentation
- Single quotes
- Semicolons
- Trailing commas

---

## Testing

**Framework:** Vitest

**Run tests:**

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**Writing tests:**

```typescript
// packages/server/src/repositories/__tests__/job.repository.test.ts
import {describe, it, expect} from 'vitest'

describe('JobRepository', () => {
    it('should find job by SerpAPI ID', async () => {
        const job = await jobRepository.findBySerpAPIId('test-id')
        expect(job).toBeDefined()
    })
})
```

**Coverage Targets:**

- Repositories: 80%+
- Services: 70%+
- Controllers: 60%+

---

## Git Workflow

### Branching

```bash
main              # Production-ready code
└── feature/xyz   # Feature branches
```

### Commit Messages

**Format:**

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Example:**

```
feat: add SerpAPI job search integration

Implement SearchService to fetch jobs from SerpAPI.
Includes job deduplication logic.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Dependency Management

### Adding Dependencies

**1. Check Context7-MCP FIRST:**

```typescript
// Use Context7-MCP tools to check latest docs
mcp__plugin_context7_context7__resolve - library - id('package-name')
mcp__plugin_context7_context7__query - docs('How to use package-name')
```

**2. Then install:**

```bash
npm install package-name
```

### Updating Dependencies

**Check Context7-MCP for breaking changes:**

```bash
npm update package-name  # After checking docs
```

---

## Documentation Updates

**When to update docs:**

| Change           | Update File               |
| ---------------- | ------------------------- |
| New endpoint     | docs/API_REFERENCE.md     |
| File moved       | docs/ai/FILE_LOCATIONS.md |
| New anti-pattern | docs/ai/ANTI_PATTERNS.md  |
| New feature      | docs/features/FEATURE.md  |
| Flow changed     | docs/ai/CONCEPT_MAP.md    |

**See:** [docs/ai/DOCUMENTATION_UPDATE_RULES.md](ai/DOCUMENTATION_UPDATE_RULES.md)

---

## Common Tasks

### Add New API Endpoint

1. Create controller method
2. Create service method
3. Create repository method (if needed)
4. Add route definition
5. Update API_REFERENCE.md

### Add New React Component

1. Create component file
2. Keep under 200 lines
3. Add to feature's components/
4. Export from feature's index.ts

### Add Database Table

1. Update schema.sql
2. Create repository class
3. Add service methods
4. Update ARCHITECTURE.md

### Add Environment Variable

1. Add to .env.example
2. Add to config/environment.config.ts
3. Update CONFIGURATION.md

---

## Debugging

### Server

```bash
# Enable debug logs
DEBUG=* npm run dev
```

**Use Logger:**

```typescript
import {Logger} from '@/utils/Logger'

Logger.info('Job fetched', {jobId})
Logger.error('Failed to fetch jobs', {error})
```

### Frontend

**Use browser DevTools:**

- React DevTools
- Zustand DevTools
- Network tab for API calls

---

## Performance Tips

### Backend

- ✅ Use database indexes
- ✅ Efficient SQL queries
- ✅ Connection pooling (if needed)
- ✅ Caching where appropriate

### Frontend

- ✅ Code splitting (Vite does this automatically)
- ✅ Lazy loading routes
- ✅ Memoization where needed
- ✅ Efficient re-renders (Zustand helps)

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation
- [CONFIGURATION.md](CONFIGURATION.md) - Environment setup
- [docs/ai/README.md](ai/README.md) - AI assistant documentation

---

**Last Updated:** January 2026
