# Configuration Guide

Environment variables and configuration options for YShvydak Job Screener.

---

## Environment Variables

### Required Variables

```bash
# API Keys (REQUIRED)
SERPAPI_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get API Keys:**

- SerpAPI: [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up)
- Gemini AI: [https://ai.google.dev/](https://ai.google.dev/)

---

### Server Configuration

```bash
# Server Port
PORT=3001

# Environment Mode
NODE_ENV=development  # or 'production'

# Database Path
DATABASE_PATH=./data/jobs.db
```

**Defaults:**

- `PORT`: 3001
- `NODE_ENV`: development
- `DATABASE_PATH`: ./data/jobs.db

---

### Frontend Configuration

```bash
# Frontend Development Port
VITE_PORT=3000

# API Base URL
VITE_API_BASE_URL=http://localhost:3001/api
```

**Defaults:**

- `VITE_PORT`: 3000
- `VITE_API_BASE_URL`: http://localhost:3001/api

---

## .env.example

Create `.env` file in project root:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/jobs.db

# API Keys (REQUIRED)
SERPAPI_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend Configuration
VITE_PORT=3000
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## SerpAPI Configuration

**Engine:** `google_jobs`

**Supported Parameters:**

- `q`: Keywords (from search profile)
- `location`: Location (from search profile)
- `date_posted`: today, 3days, week, month
- `radius`: Radius in kilometers

**Free Tier:** 100 searches/month

**Documentation:** [https://serpapi.com/google-jobs-api](https://serpapi.com/google-jobs-api)

---

## Gemini AI Configuration

**Model:** `gemini-pro`

**Usage:**

- Job matching analysis
- Match score calculation (0-100)
- Strengths and gaps identification

**Free Tier:** Available with limits

**Documentation:** [https://ai.google.dev/docs](https://ai.google.dev/docs)

---

## Database Configuration

**Type:** SQLite 3

**Location:** Specified in `DATABASE_PATH`

**Schema:** Auto-initialized on first run

**Tables:**

- `jobs` - Job listings
- `ai_analyses` - AI match analyses
- `search_profiles` - Search profiles
- `settings` - App settings (CV, etc.)
- `job_notes` - Job notes (MVP+)

---

## Port Configuration

### Development

- **Backend:** `PORT` (default: 3001)
- **Frontend:** `VITE_PORT` (default: 3000)

### Production

You can run both on same port:

```bash
PORT=3000
VITE_API_BASE_URL=http://localhost:3000/api
```

Backend serves frontend build at production.

---

## Environment Modes

### Development

```bash
NODE_ENV=development
```

**Features:**

- Hot reload
- Detailed error messages
- Debug logging
- CORS enabled

### Production

```bash
NODE_ENV=production
```

**Features:**

- Optimized builds
- Minimal logging
- Error handling
- Performance optimization

---

## Security Best Practices

### API Keys

❌ **NEVER:**

- Commit `.env` to version control
- Hardcode API keys in code
- Share API keys publicly

✅ **ALWAYS:**

- Use `.env` for sensitive data
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation

### Database

✅ **Recommendations:**

- Regular backups of SQLite file
- Secure file permissions
- Limit database access

---

## Troubleshooting

### "Missing API keys"

**Error:** `Missing required API keys in environment`

**Solution:**

1. Check `.env` file exists
2. Verify `SERPAPI_KEY` and `GEMINI_API_KEY` are set
3. Restart server: `npm run dev`

### "Database connection failed"

**Error:** `SQLITE_CANTOPEN: unable to open database`

**Solution:**

1. Create data directory: `mkdir -p data`
2. Check `DATABASE_PATH` in `.env`
3. Verify write permissions

### "Port already in use"

**Error:** `Error: listen EADDRINUSE: address already in use`

**Solution:**

1. Change `PORT` or `VITE_PORT` in `.env`
2. Or kill existing process:
    ```bash
    lsof -ti:3001 | xargs kill  # Kill process on port 3001
    ```

---

## Configuration Validation

The app validates configuration on startup:

```typescript
// Validates:
- API keys present
- Database path writable
- Port available
- Valid NODE_ENV
```

**If validation fails, app won't start.**

---

## Related Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 5 minutes
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guidelines

---

**Last Updated:** January 2026
