---
paths:
    - packages/server/src/repositories/**
    - packages/server/src/database/**
---

# Database Rules (SQLite)

## Job Deduplication (CRITICAL)

**ALWAYS check before insert:**

```typescript
// CORRECT
const existing = await this.jobRepository.findBySerpAPIId(serpApiJobId)
if (!existing) {
    await this.jobRepository.create(jobData)
}

// WRONG - will fail on duplicate
await this.jobRepository.create(jobData)
```

**Database constraint:** `UNIQUE(serpapi_job_id)`

## Schema Overview

### search_profiles

- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `keywords` TEXT NOT NULL
- `location` TEXT (can be empty for global search)
- `date_posted` TEXT (today, 3days, week, month)
- `radius` INTEGER (km)
- `active` INTEGER (0/1)

### jobs

- `id` TEXT PRIMARY KEY (UUID)
- `serpapi_job_id` TEXT UNIQUE (for deduplication)
- `profile_id` TEXT (FK to search_profiles)
- `title`, `company`, `location`, `description`
- `apply_link`, `posted_date`, `source`
- `status` TEXT DEFAULT 'new' (new/applied/saved/rejected)

### ai_analyses

- `id` TEXT PRIMARY KEY
- `job_id` TEXT UNIQUE (one analysis per job)
- `match_score` INTEGER (0-100)
- `recommendation` TEXT (APPLY/MAYBE/SKIP)
- `strengths`, `gaps` TEXT (JSON arrays)
- `reasoning` TEXT

### settings

- `key` TEXT PRIMARY KEY
- `value` TEXT NOT NULL
- Key values: `cv_content`, `last_search_date`

## SQL Best Practices

### Parameterized queries (ALWAYS):

```typescript
// CORRECT
const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?')
stmt.get(id)

// WRONG - SQL injection risk
this.db.prepare(`SELECT * FROM jobs WHERE id = '${id}'`)
```

### Transactions (for multiple operations):

```typescript
const transaction = this.db.transaction(() => {
    this.db.run('INSERT INTO jobs ...')
    this.db.run('INSERT INTO ai_analyses ...')
})
transaction()
```

## Repository Methods Pattern

```typescript
// Find by ID
findById(id: string): Entity | null {
    const stmt = this.db.prepare('SELECT * FROM table WHERE id = ?');
    return stmt.get(id) as Entity || null;
}

// Find all
findAll(): Entity[] {
    const stmt = this.db.prepare('SELECT * FROM table ORDER BY created_at DESC');
    return stmt.all() as Entity[];
}

// Create
create(input: EntityInput): Entity {
    const id = uuidv4();
    const stmt = this.db.prepare('INSERT INTO table (...) VALUES (...)');
    stmt.run(id, ...);
    return this.findById(id)!;
}
```
