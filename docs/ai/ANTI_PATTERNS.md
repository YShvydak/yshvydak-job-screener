# Anti-Patterns to Avoid

Common mistakes and how to fix them. This document will grow as development progresses.

---

## Backend Anti-Patterns

### ❌ 1. Bypassing Repository Layer

**Wrong:**

```typescript
// In job.service.ts
async getJobs(filters: JobFilters) {
    // NEVER do direct database access from service
    const jobs = await this.db.all("SELECT * FROM jobs WHERE status = ?", [filters.status]);
    return jobs;
}
```

**Right:**

```typescript
// In job.service.ts
async getJobs(filters: JobFilters) {
    // ALWAYS use repository layer
    const jobs = await this.jobRepository.findByFilters(filters);
    return jobs;
}
```

**Why This Matters:**

- Violates Layered Architecture
- Makes testing difficult
- Duplicates SQL logic across services
- Breaks separation of concerns

---

### ❌ 2. Not Preventing Job Duplicates

**Wrong:**

```typescript
// In search.service.ts
async saveJobs(serpResults: SerpAPIResult[], profileId: string) {
    for (const result of serpResults) {
        // WRONG - Always insert without checking
        await this.jobRepository.create({
            serpapi_job_id: result.job_id,
            title: result.title,
            // ...
        });
    }
}
```

**Right:**

```typescript
// In search.service.ts
async saveJobs(serpResults: SerpAPIResult[], profileId: string) {
    const savedJobs: Job[] = [];

    for (const result of serpResults) {
        // ALWAYS check for existing job first
        const existing = await this.jobRepository.findBySerpAPIId(result.job_id);

        if (!existing) {
            const job = await this.jobRepository.create({
                serpapi_job_id: result.job_id,
                title: result.title,
                // ...
            });
            savedJobs.push(job);
        }
    }

    return savedJobs;
}
```

**Why This Matters:**

- Prevents duplicate jobs in database
- Saves storage space
- Improves user experience (no duplicate listings)
- Relies on database UNIQUE constraint as safety net

---

### ❌ 3. Hardcoding API Keys

**Wrong:**

```typescript
// NEVER do this
const geminiKey = "AIzaSyC_your_api_key_here";
const serpApiKey = "abc123_your_serpapi_key";

const genAI = new GoogleGenerativeAI(geminiKey);
```

**Right:**

```typescript
// ALWAYS use environment variables
const geminiKey = process.env.GEMINI_API_KEY;
const serpApiKey = process.env.SERPAPI_KEY;

if (!geminiKey || !serpApiKey) {
    throw new Error("Missing required API keys in environment");
}

const genAI = new GoogleGenerativeAI(geminiKey);
```

**Why This Matters:**

- Security risk (keys exposed in code)
- Can't use different keys for dev/prod
- Keys visible in version control
- Violates 12-factor app principles

---

### ❌ 4. Skipping Context7-MCP for Dependencies

**Wrong:**

```bash
# WRONG - Installing without checking documentation
npm install @google/generative-ai
```

**Right:**

```bash
# 1. FIRST: Check Context7-MCP for latest docs
mcp__plugin_context7_context7__resolve-library-id "@google/generative-ai"
mcp__plugin_context7_context7__query-docs "How to use Gemini AI"

# 2. Read breaking changes and best practices

# 3. THEN: Install the package
npm install @google/generative-ai
```

**Why This Matters:**

- Avoid using deprecated APIs
- Learn best practices upfront
- Prevent breaking changes
- Context7-MCP has latest documentation

---

### ❌ 5. Not Validating External API Responses

**Wrong:**

```typescript
// In ai.service.ts
async analyzeJob(jobId: string, cvContent: string) {
    const result = await this.model.generateContent(prompt);

    // WRONG - Assuming response is valid JSON
    const analysis = JSON.parse(result.response.text());

    await this.aiAnalysisRepository.create(analysis);
}
```

**Right:**

```typescript
// In ai.service.ts
async analyzeJob(jobId: string, cvContent: string) {
    const result = await this.model.generateContent(prompt);

    // Extract JSON from response (may have markdown)
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error('Invalid AI response format - no JSON found');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!analysis.matchScore || !analysis.recommendation) {
        throw new Error('Invalid AI response - missing required fields');
    }

    await this.aiAnalysisRepository.create(analysis);
}
```

**Why This Matters:**

- AI responses can be unreliable
- Prevents database corruption
- Better error handling
- Improves debugging

---

## Frontend Anti-Patterns

### ❌ 6. Duplicating Constants Across Files

**Wrong:**

```typescript
// In JobCard.tsx
const statusColor = {
    new: 'bg-blue-500',
    applied: 'bg-green-500',
    saved: 'bg-yellow-500',
    rejected: 'bg-red-500'
}[status];

// In JobsList.tsx
const statusColor = {  // WRONG - Duplicate definition
    new: 'bg-blue-500',
    applied: 'bg-green-500',
    saved: 'bg-yellow-500',
    rejected: 'bg-red-500'
}[status];
```

**Right:**

```typescript
// In features/jobs/constants/jobConstants.ts
export const JOB_STATUS_COLORS = {
    new: 'bg-blue-500',
    applied: 'bg-green-500',
    saved: 'bg-yellow-500',
    rejected: 'bg-red-500'
} as const;

// In JobCard.tsx
import { JOB_STATUS_COLORS } from '@/features/jobs/constants';
const statusColor = JOB_STATUS_COLORS[status];

// In JobsList.tsx
import { JOB_STATUS_COLORS } from '@/features/jobs/constants';
const statusColor = JOB_STATUS_COLORS[status];
```

**Why This Matters:**

- Single source of truth
- Easy to update colors globally
- Prevents inconsistencies
- Follows DRY principle

---

### ❌ 7. Not Using Feature-Based Structure

**Wrong:**

```
src/
├── components/
│   ├── JobCard.tsx
│   ├── ProfileForm.tsx
│   ├── DashboardStats.tsx
│   └── SettingsPage.tsx
├── hooks/
│   ├── useJobs.ts
│   ├── useProfiles.ts
│   └── useSettings.ts
└── stores/
    ├── jobsStore.ts
    └── profilesStore.ts
```

**Right:**

```
src/
├── features/
│   ├── jobs/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   ├── profiles/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   └── settings/
│       ├── components/
│       └── hooks/
└── shared/
    └── components/
```

**Why This Matters:**

- Better code organization
- Easier to find files
- Clear feature boundaries
- Scales better as project grows

---

### ❌ 8. Components Larger Than 200 Lines

**Wrong:**

```typescript
// JobDetailModal.tsx (450 lines)
export function JobDetailModal({ jobId }: Props) {
    // 450 lines of code...
    // - Job details
    // - AI analysis display
    // - Action buttons
    // - Status updates
    // - Notes section
    // All in one file!
}
```

**Right:**

```typescript
// JobDetailModal.tsx (80 lines)
export function JobDetailModal({ jobId }: Props) {
    return (
        <Modal>
            <JobDetailHeader job={job} />
            <JobDetailTabs>
                <JobOverview job={job} />
                <AIAnalysis analysis={analysis} />
            </JobDetailTabs>
            <JobActions job={job} onUpdate={handleUpdate} />
        </Modal>
    );
}

// JobDetailHeader.tsx (40 lines)
// JobOverview.tsx (120 lines)
// AIAnalysis.tsx (80 lines)
// JobActions.tsx (60 lines)
```

**Why This Matters:**

- Easier to understand
- Easier to test
- Better code reuse
- Follows single responsibility principle

---

## Database Anti-Patterns

### ❌ 9. Not Using Parameterized Queries

**Wrong:**

```typescript
// In job.repository.ts - SQL INJECTION RISK!
async findByStatus(status: string) {
    const sql = `SELECT * FROM jobs WHERE status = '${status}'`;  // DANGEROUS
    return this.db.all(sql);
}
```

**Right:**

```typescript
// In job.repository.ts
async findByStatus(status: string) {
    const sql = "SELECT * FROM jobs WHERE status = ?";
    return this.db.all(sql, [status]);  // Safe - parameterized query
}
```

**Why This Matters:**

- Prevents SQL injection attacks
- Security critical
- Standard best practice

---

### ❌ 10. Not Handling Database Errors

**Wrong:**

```typescript
// In job.repository.ts
async create(job: JobInput) {
    // WRONG - No error handling
    const result = await this.db.run(
        "INSERT INTO jobs (...) VALUES (...)",
        [...]
    );
    return result.lastID;
}
```

**Right:**

```typescript
// In job.repository.ts
async create(job: JobInput) {
    try {
        const result = await this.db.run(
            "INSERT INTO jobs (...) VALUES (...)",
            [...]
        );
        return result.lastID;
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            throw new Error(`Job already exists: ${job.serpapi_job_id}`);
        }
        throw error;
    }
}
```

**Why This Matters:**

- Better error messages
- Easier debugging
- Graceful failure handling
- User-friendly error feedback

---

## More Patterns Coming...

This document will be updated as development progresses and new anti-patterns are discovered.

**How to Contribute:**

- Found a common mistake? Add it here
- Fixed a bug? Document the anti-pattern
- Code review? Note recurring issues

---

**Last Updated:** January 2026
**Status:** Initial patterns (will grow during development)
