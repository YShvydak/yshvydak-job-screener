---
paths:
  - packages/server/src/services/search.service.ts
  - packages/server/src/controllers/search.controller.ts
---

# SerpAPI Integration Rules

## Configuration

**Engine:** `google_jobs`
**Base URL:** `https://serpapi.com/search`

## Request Parameters

### Always included:
```typescript
{
    engine: 'google_jobs',
    q: profile.keywords,      // REQUIRED - search query
    hl: 'en',                 // ALWAYS - English results
    api_key: process.env.SERPAPI_KEY
}
```

### Optional (only if provided):
```typescript
// Location - OPTIONAL (empty = global search)
if (profile.location && profile.location.trim()) {
    params.location = profile.location;

    // Radius only with location
    if (profile.radius) {
        params.lrad = Math.round(profile.radius * 0.621371); // km to miles
    }
}

// Date filter
if (profile.date_posted) {
    params.chips = `date_posted:${profile.date_posted}`;
}
```

## Response Handling

### Success with results:
```typescript
if (response.jobs_results) {
    return response.jobs_results; // Array of jobs
}
```

### No results (VALID response, not error):
```typescript
if (response.error?.includes("hasn't returned any results")) {
    return []; // Empty array, not an error
}
```

### Actual error:
```typescript
if (response.error) {
    throw new Error(`SerpAPI error: ${response.error}`);
}
```

## Job Mapping

SerpAPI field → Our field:
- `job_id` → `serpapi_job_id` (UNIQUE, for deduplication)
- `title` → `title`
- `company_name` → `company`
- `location` → `location`
- `description` → `description`
- `apply_options[0].link` → `apply_link`
- `detected_extensions.posted_at` → `posted_date`
- `via` → `source`

## Testing SerpAPI Queries

Use SerpAPI Playground: https://serpapi.com/playground?engine=google_jobs

1. Set engine: `google_jobs`
2. Set query (q): your keywords
3. Optionally set location
4. Test and verify results
5. Replicate exact params in code
