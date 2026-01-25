---
paths:
    - packages/web/**
---

# Frontend Development Rules

## Architecture: Pages + Stores

### Pages (`pages/*.tsx`)

- Full page components with routing
- Compose UI from smaller components
- Use Zustand stores for state
- Handle user interactions

### Stores (`stores/*.ts`)

- Zustand state management
- API calls via `api/client.ts`
- Actions for state mutations
- Keep stores focused (one per domain)

### Components (`components/*.tsx`)

- Reusable UI components
- Props-driven, minimal state
- Tailwind CSS for styling

## Patterns

### API calls (always through store):

```typescript
// In store
const useJobStore = create((set) => ({
    jobs: [],
    loading: false,
    fetchJobs: async () => {
        set({loading: true})
        const jobs = await apiClient.get('/jobs')
        set({jobs, loading: false})
    },
}))

// In component
const {jobs, fetchJobs} = useJobStore()
useEffect(() => {
    fetchJobs()
}, [])
```

### Form handling:

```typescript
const [value, setValue] = useState('')
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await store.create({value})
}
```

## Styling

- Use Tailwind CSS classes
- Responsive: `sm:`, `md:`, `lg:` prefixes
- Dark mode: Not implemented yet

## Ports

- Development: `http://localhost:3000`
- API calls to: `http://localhost:3001/api`
