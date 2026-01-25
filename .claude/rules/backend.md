---
paths:
    - packages/server/**
---

# Backend Development Rules

## Layered Architecture (MANDATORY)

**Flow:** Controller → Service → Repository → Database

### Controllers (`controllers/*.ts`)

- HTTP request/response handling ONLY
- Extract parameters, validate input format
- Delegate ALL business logic to services
- Use `ResponseHelper.success()` / `ResponseHelper.error()`
- NEVER call repositories directly

### Services (`services/*.ts`)

- Business logic and orchestration
- Call repositories for data access
- Call external APIs (SerpAPI, Gemini)
- Throw errors for invalid business conditions
- NEVER execute raw SQL

### Repositories (`repositories/*.ts`)

- Data access ONLY (SQL queries)
- Return domain models
- Handle database-specific logic
- ALWAYS use parameterized queries (SQL injection prevention)

## Code Patterns

### Creating new endpoint:

1. Add route in `routes/*.routes.ts`
2. Add controller method in `controllers/*.controller.ts`
3. Add service method in `services/*.service.ts`
4. Add repository method if needed in `repositories/*.repository.ts`

### Error handling:

```typescript
// In service - throw error
if (!profile) {
    throw new Error('Profile not found')
}

// In controller - caught by ResponseHelper
try {
    const result = await service.method()
    ResponseHelper.success(res, result)
} catch (error) {
    ResponseHelper.error(res, error.message)
}
```

## File Naming

- Controllers: `{entity}.controller.ts`
- Services: `{entity}.service.ts`
- Repositories: `{entity}.repository.ts`
- Routes: `{entity}.routes.ts`
