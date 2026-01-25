# Known Patterns to Check

Reference file for docs-audit skill. Contains patterns that indicate outdated documentation.

## Outdated Patterns

### Structure References

```
# Wrong (Feature-based)
features/jobs/components/
features/jobs/hooks/
features/jobs/store/
shared/components/atoms/
shared/components/molecules/

# Correct (Pages-based)
pages/Dashboard.tsx
pages/Jobs.tsx
pages/Profiles.tsx
pages/Settings.tsx
stores/jobStore.ts
stores/profileStore.ts
stores/settingsStore.ts
```

### Port Numbers

```
# Wrong
localhost:5173

# Correct
localhost:3000 (frontend)
localhost:3001 (backend)
```

### Location Parameter

```
# Wrong
location TEXT NOT NULL
Location is required
!input.location

# Correct
location TEXT (optional)
Location is optional
Empty location = global search
```

### SerpAPI Parameters

```
# Must be documented
hl: 'en' (English results)
location: optional
lrad: radius in miles (only with location)
```

### Non-existent Files

```
# These should NOT be referenced
app.ts
server.ts
cv.service.ts
dashboard.controller.ts
docs/features/
```

### Correct File References

```
# Entry point
packages/server/src/index.ts

# Services
packages/server/src/services/search.service.ts
packages/server/src/services/ai.service.ts
packages/server/src/services/job.service.ts
packages/server/src/services/profile.service.ts

# Repositories
packages/server/src/repositories/job.repository.ts
packages/server/src/repositories/profile.repository.ts
packages/server/src/repositories/settings.repository.ts
packages/server/src/repositories/analysis.repository.ts
```

## Token Budget Targets

| File                          | Max Lines | Max Tokens |
| ----------------------------- | --------- | ---------- |
| CLAUDE.md                     | 300       | 2500       |
| FILE_LOCATIONS.md             | 200       | 1600       |
| CONCEPT_MAP.md                | 300       | 2400       |
| ANTI_PATTERNS.md              | 200       | 1600       |
| DECISIONS.md                  | 400       | 3200       |
| DOCUMENTATION_UPDATE_RULES.md | 150       | 1200       |
| **Total docs/ai/**            | 1250      | 10000      |

## Vibe Coding Checklist

### CLAUDE.md First 50 Lines Must Have:

- [ ] Project name and stack
- [ ] Layered Architecture pattern
- [ ] Job deduplication rule
- [ ] Location is optional
- [ ] Context7-MCP requirement

### Quick Start Must Be Possible:

- [ ] `npm run dev` works
- [ ] Ports documented correctly
- [ ] API endpoints accessible
- [ ] Database auto-creates

### New Session Must Understand:

- [ ] Where to find files
- [ ] How data flows
- [ ] What NOT to do (anti-patterns)
- [ ] Key architectural decisions
