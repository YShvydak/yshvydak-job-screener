# AI Job Analysis Feature

> **Feature:** Analyze jobs against user's CV using Google Gemini AI
> **Methods:** Cloud API or Local CLI
> **Status:** Production Ready

---

## Overview

The AI Analysis feature evaluates how well a job matches the user's CV/resume using Google Gemini AI. It provides:

- **Match Score** (0-100) - How well the candidate fits the job
- **Recommendation** (APPLY/MAYBE/SKIP) - Action recommendation
- **Strengths** - What makes the candidate a good fit
- **Gaps** - Skills or experience the candidate is missing
- **Reasoning** - Brief explanation of the assessment

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Jobs Page)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                                            │
│  │ Analyze Button  │ ← Split dropdown: Cloud / Local            │
│  │  (Cloud/Local)  │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐      ┌──────────────────┐                  │
│  │   jobStore.ts   │ ───► │ settingsStore.ts │                  │
│  │  analyzeJob()   │      │  aiMethod state  │                  │
│  └────────┬────────┘      └──────────────────┘                  │
└───────────┼──────────────────────────────────────────────────────┘
            │ POST /api/ai/analyze/:jobId?method=api|local
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express Server)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                                            │
│  │ ai.controller   │ ← Validates method param                   │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ai.service.ts                         │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  analyzeJob(jobId, cvContent, method?)                  │    │
│  │    │                                                     │    │
│  │    ├─► getEffectiveMethod() ─► settingsRepository       │    │
│  │    │                                                     │    │
│  │    ├─► Check if cached ─► analysisRepository            │    │
│  │    │                                                     │    │
│  │    └─► method === 'local'                               │    │
│  │          │                                               │    │
│  │          ├─ YES ─► generateAnalysisViaCLI()             │    │
│  │          │           └─► `gemini -p "..." --output-format json`
│  │          │                                               │    │
│  │          └─ NO ──► generateAnalysisViaAPI()             │    │
│  │                      └─► GoogleGenAI SDK                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │analysisRepository│ ← Saves result to ai_analyses table       │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File                                                      | Purpose                                      |
| --------------------------------------------------------- | -------------------------------------------- |
| `shared/src/types/job.types.ts`                           | `AIAnalysisMethod` type (`'api' \| 'local'`) |
| `packages/server/src/services/ai.service.ts`              | Core AI analysis logic                       |
| `packages/server/src/controllers/ai.controller.ts`        | HTTP endpoint handlers                       |
| `packages/server/src/repositories/settings.repository.ts` | AI method persistence                        |
| `packages/server/src/repositories/analysis.repository.ts` | Analysis storage                             |
| `packages/web/src/stores/settingsStore.ts`                | Frontend settings state                      |
| `packages/web/src/stores/jobStore.ts`                     | Job analysis actions                         |
| `packages/web/src/pages/Jobs.tsx`                         | Analyze button dropdown                      |
| `packages/web/src/pages/Settings.tsx`                     | Default method selection                     |

---

## Analysis Methods

### 1. Cloud API (Default)

Uses Google Gemini API via `@google/genai` SDK.

**Requirements:**

- `GEMINI_API_KEY` environment variable

**Pros:**

- Simple setup
- Always available with valid API key

**Cons:**

- Requires API key
- Internet connection required
- API usage costs

### 2. Local CLI

Uses Gemini CLI tool installed locally.

**Requirements:**

- `gemini` CLI installed and in PATH
- Authenticated via `gemini auth`

**Pros:**

- No API key needed in .env
- Uses local authentication
- May have different quota limits

**Cons:**

- Requires CLI installation
- CLI must be authenticated

---

## CLI Response Parsing

The Gemini CLI with `--output-format json` returns a wrapper object:

```json
{
  "session_id": "uuid",
  "response": "{\"match_score\": 85, ...}",  // Actual model response
  "stats": { ... }
}
```

The `extractCliResponse()` method handles:

1. Finding JSON in stdout (skipping warnings)
2. Extracting the `response` field
3. Passing to common parser

---

## API Endpoints

### Analyze Single Job

```
POST /api/ai/analyze/:jobId?method=api|local

Response:
{
  "success": true,
  "data": {
    "analysis": {
      "id": "uuid",
      "job_id": "uuid",
      "match_score": 85,
      "recommendation": "APPLY",
      "strengths": "[\"...\"]",
      "gaps": "[\"...\"]",
      "reasoning": "...",
      "analyzed_at": "2026-01-24T..."
    }
  }
}
```

### Analyze Batch

```
POST /api/ai/analyze-batch?method=api|local
Body: { "jobIds": ["id1", "id2", ...] }
```

### Get/Set Default Method

```
GET /api/settings/ai-method
PUT /api/settings/ai-method
Body: { "method": "api" | "local" }
```

---

## Database Schema

```sql
CREATE TABLE ai_analyses (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    match_score INTEGER NOT NULL,
    recommendation TEXT NOT NULL CHECK(recommendation IN ('APPLY', 'MAYBE', 'SKIP')),
    strengths TEXT NOT NULL,  -- JSON array as string
    gaps TEXT NOT NULL,       -- JSON array as string
    reasoning TEXT,
    analyzed_at TEXT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
```

---

## Frontend UI

### Settings Page

Radio buttons to select default method:

- **Cloud API** - Uses Google Gemini API
- **Local CLI** - Uses gemini command

### Jobs Page

Split button with dropdown:

- Primary click: Uses default method
- Dropdown: Choose specific method
    - "Analyze (Cloud)"
    - "Analyze (Local)"

---

## Error Handling

| Error             | Message                                                                        | Cause                |
| ----------------- | ------------------------------------------------------------------------------ | -------------------- |
| API key missing   | "GEMINI_API_KEY is not configured. Please use local CLI or configure API key." | No API key in .env   |
| CLI not installed | "Gemini CLI is not installed. Please install it or use the Cloud API method."  | `gemini` not in PATH |
| CLI timeout       | "Gemini CLI timed out. The analysis took too long to complete."                | Execution > 60s      |
| Parse error       | "AI analysis failed to parse. Please try again."                               | Invalid JSON from AI |
| Job not found     | "Job not found: {id}"                                                          | Invalid job ID       |
| No CV             | "CV content is not configured. Please upload your CV in settings."             | CV not uploaded      |

---

## Caching

Analysis results are **cached per job**:

- First analysis is saved to database
- Subsequent requests return cached result
- Cache is method-agnostic (same result regardless of method used)

To re-analyze: Delete the job and re-fetch, or add a "Re-analyze" feature.

---

## Testing

### Unit Tests

```
packages/server/src/__tests__/unit/services/ai.service.test.ts
```

- API method tests
- CLI method tests
- Method selection tests
- Utility tests

### Integration Tests

```
packages/server/src/__tests__/integration/settings.integration.test.ts
```

- GET/PUT /api/settings/ai-method endpoints

### Run Tests

```bash
npm test
```

---

## Configuration

### Environment Variables

```env
# Required for Cloud API method
GEMINI_API_KEY=your-api-key-here
```

### CLI Setup

```bash
# Install Gemini CLI
npm install -g @anthropic-ai/gemini-cli

# Authenticate
gemini auth

# Verify installation
which gemini
gemini --version
```

---

## Prompt Structure

The prompt sent to Gemini:

```
You are a career advisor AI. Analyze how well this job matches the candidate's CV/resume.

## Job Details
Title: {title}
Company: {company}
Location: {location}
Description: {description}

## Candidate's CV/Resume
{cv_content}

## Task
Analyze the job-candidate fit and provide:
1. A match score from 0-100
2. A recommendation: APPLY (score >= 70), MAYBE (score 40-69), or SKIP (score < 40)
3. List of strengths (what makes this candidate a good fit)
4. List of gaps (skills or experience the candidate is missing)
5. Brief reasoning for your assessment

## Response Format (JSON only, no markdown)
{
  "match_score": <number 0-100>,
  "recommendation": "<APPLY|MAYBE|SKIP>",
  "strengths": ["<strength1>", ...],
  "gaps": ["<gap1>", ...],
  "reasoning": "<brief explanation>"
}
```

---

## Extending the Feature

### Adding New Methods

1. Add method value to `AIAnalysisMethod` type
2. Implement `generateAnalysisVia{Method}()` in ai.service.ts
3. Update `analyzeJob()` switch logic
4. Update frontend dropdown options

### Customizing Prompts

Edit `buildPrompt()` in `ai.service.ts`

### Changing Models

- API: Change `model` param in `generateAnalysisViaAPI()`
- CLI: Add model flag to CLI command

---

## Troubleshooting

### "AI analysis failed to parse"

- Check Gemini response format in logs
- Verify prompt is generating valid JSON
- Try the other method (API vs CLI)

### CLI Not Found

```bash
# Check if installed
which gemini

# If not found, install
npm install -g @anthropic-ai/gemini-cli
```

### Authentication Issues

```bash
# Re-authenticate CLI
gemini auth logout
gemini auth
```

---

**Last Updated:** January 2026
