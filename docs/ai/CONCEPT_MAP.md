# Concept Map - System Flows

Visual diagrams and detailed explanations of system flows and dependencies.

---

## Manual Job Search Flow

```
User → /profiles → Click "Run Search" on profile
  ↓
Frontend: POST /api/search/run
  ├─ Body: { profileId: "uuid" }
  ↓
SearchController.runSearch()
  ├─ Validate request body
  ├─ Extract profileId
  └─ Delegate to SearchService
  ↓
SearchService.runSearch(profileId)
  │
  ├─→ Step 1: Get Profile
  │   └─ ProfileRepository.findById(profileId)
  │       └─ SELECT * FROM search_profiles WHERE id = ?
  │
  ├─→ Step 2: Select Provider & Build Parameters
  │   └─ ProviderRegistry.get(providerId)
  │       ├─ Resolve provider (default: 'serpapi' or profile.preferred_provider)
  │       └─ provider.buildParams(profile)
  │
  ├─→ Step 3: Execute Provider Search
  │   └─ provider.search()
  │       ├─ Call external API (SerpAPI, Glassdoor, etc.)
  │       ├─ Normalize results to common Job format
  │       └─ Return standardized jobs array
  │
  ├─→ Step 4: Save Jobs (Prevent Duplicates)
  │   └─ For each job result:
  │       ├─ Check: JobRepository.findByProviderJobId(provider, providerJobId)
  │       ├─ If NOT exists:
  │       │   └─ JobRepository.create({
  │       │       provider: 'serpapi',
  │       │       provider_job_id: 'external_id',
  │       │       profile_id: profileId,
  │       │       title: result.title,
  │       │       company: result.company,
  │       │       location: result.location,
  │       │       description: result.description,
  │       │       apply_link: result.apply_link,
  │       │       posted_date: result.posted_date,
  │       │       source: result.source,
  │       │       status: 'new'
  │       │     })
  │       └─ If EXISTS: Skip (already in database for this provider)
  │
  └─→ Return: { jobsFound, newJobs, analyzed: false }
  ↓
Frontend: Show alert with results
  ↓
User navigates to /jobs to see new jobs
```

---

## AI Job Analysis Flow

```
AIService.analyzeJob(jobId)
  ↓
  ├─→ Step 1: Get CV Content
  │   └─ SettingsRepository.get('cv_content')
  │       └─ SELECT value FROM settings WHERE key = 'cv_content'
  │
  ├─→ Step 2: Get Job Details
  │   └─ JobRepository.findById(jobId)
  │
  ├─→ Step 3: Build Gemini Prompt
  │   └─ buildPrompt(job, cvContent)
  │       ├─ Include CV content
  │       ├─ Include job description
  │       └─ Request JSON response: {
  │             matchScore: number (0-100),
  │             recommendation: "APPLY" | "MAYBE" | "SKIP",
  │             strengths: string[],
  │             gaps: string[],
  │             reasoning: string
  │           }
  │
  ├─→ Step 4: Call Gemini AI
  │   └─ model.generateContent(prompt)
  │       └─ Returns AI response text
  │
  ├─→ Step 5: Parse AI Response
  │   └─ parseAIResponse(responseText)
  │       ├─ Extract JSON from response
  │       ├─ Validate required fields
  │       └─ Return parsed analysis
  │
  └─→ Step 6: Save Analysis
      └─ AnalysisRepository.create({
            job_id: jobId,
            match_score: analysis.matchScore,
            recommendation: analysis.recommendation,
            strengths: JSON.stringify(analysis.strengths),
            gaps: JSON.stringify(analysis.gaps),
            reasoning: analysis.reasoning
          })
```

---

## Job Status Update Flow

```
User → Jobs page → Click status button
  ↓
Frontend: PATCH /api/jobs/:id/status
  ├─ Body: { status: "applied" }
  ↓
JobController.updateStatus()
  ├─ Validate status value
  └─ Delegate to JobService
  ↓
JobService.updateStatus(jobId, status)
  └─ JobRepository.updateStatus(jobId, status)
      └─ UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
  ↓
Return: Updated job object
  ↓
Frontend: Update UI (store update)
```

---

## Search Profile Creation Flow

```
User → /profiles → Click "Create Profile"
  ↓
Frontend: Display ProfileForm
  ↓
User fills form:
  ├─ Profile Name: "QA Jobs Worldwide" (required)
  ├─ Keywords: "QA Engineer, SDET" (required)
  ├─ Location: "" (OPTIONAL - empty = global search)
  ├─ Date Posted: "week" (optional)
  └─ Radius: 50 (optional, only with location)
  ↓
User clicks "Create"
  ↓
Frontend: POST /api/profiles
  ├─ Body: { name, keywords, location, date_posted, radius }
  ↓
ProfileController.create()
  ├─ Validate required fields (name, keywords)
  └─ Delegate to ProfileService
  ↓
ProfileService.create(profileData)
  ├─ Validate input
  │   ├─ name required
  │   ├─ keywords required
  │   ├─ date_posted required
  │   └─ location OPTIONAL (can be empty)
  └─ ProfileRepository.create({
        id: uuid(),
        name, keywords, location,
        date_posted, radius,
        active: 1
      })
  ↓
Return: Created profile object
  ↓
Frontend: Update profiles list
```

---

## CV Upload Flow

```
User → /settings → Upload CV section
  ↓
Frontend: Display textarea for CV content
  ↓
User pastes/types CV content
  ↓
User clicks "Save"
  ↓
Frontend: PUT /api/settings
  ├─ Body: { cv_content: "..." }
  ↓
SettingsController.update()
  └─ SettingsRepository.set('cv_content', cvContent)
      └─ INSERT OR REPLACE INTO settings (key, value)
         VALUES ('cv_content', ?)
  ↓
Return: { success: true }
  ↓
Frontend: Show success message
```

---

## Key Dependencies

```
Job Search Flow Dependencies:
├─ Provider Integration (SerpAPI/Glassdoor)
│   └─ Standardized via ProviderRegistry
├─ Job deduplication ← provider + provider_job_id uniqueness
└─ Optional AI analysis ← CV content from settings

AI Analysis Dependencies:
├─ CV content ← Settings table ('cv_content' key)
├─ Gemini AI API ← GEMINI_API_KEY environment variable
└─ Job details ← Jobs table

Data Integrity Dependencies:
├─ Job uniqueness ← UNIQUE constraint on provider + provider_job_id
├─ One analysis per job ← UNIQUE constraint on job_id
└─ Profile-job relationship ← Foreign key jobs.profile_id
```

---

## Database Entity Relationships

```
search_profiles (1) ──< (N) jobs
    │                      │
    │                      └──< (1) ai_analyses
    │
    └─ active: 0/1 (inactive/active)
    └─ location: can be empty (global search)

settings
    └─ key-value pairs (cv_content, etc.)
```

---

## Technology Integration Points

```
Frontend (React + Zustand)
    ↓ REST API (localhost:3000 → localhost:3001)
Backend (Express)
    ↓
    ├─→ Job Search Providers (Strategy Pattern)
    │   ├─ SerpAPI (Google Jobs)
    │   │   └─ Engine: google_jobs
    │   ├─ Glassdoor (Scraping/API)
    │   │   └─ Fallback logic
    │   └─ Returns: Standardized Job[]
    │
    ├─→ Google Gemini AI (Job Analysis)
    │   ├─ Package: @google/generative-ai
    │   ├─ Model: gemini-pro
    │   └─ Returns: JSON analysis
    │
    └─→ SQLite (Data Storage)
        ├─ Jobs persistence
        ├─ AI analyses storage
        ├─ Search profiles
        └─ Settings (CV content)
```

---

**Last Updated:** January 2026
**Status:** Reflects actual implementation
