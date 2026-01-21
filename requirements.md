# YShvydak Job Screener — Product Specification (opensource)

**Project:** AI-Powered YShvydak Job Screener Web Application  
**Type:** Open Source (Personal Job Search Automation)  
**Target Users:** Job seekers who want automated AI-powered job matching  
**Tech Stack:** @google/genai + SerpAPI  
**Deployment:** Self-hosted (Raspberry Pi 5 8GB)

---

## 🎯 Product Vision

**Problem:** Manual job search is time-consuming. Need to:

- Check multiple job boards daily
- Read dozens of job descriptions
- Manually evaluate if job matches skills
- Track which jobs applied to

**Solution:** Automated job screener that:

- Searches jobs automatically (daily)
- AI analyzes match with your profile
- Shows only relevant jobs with match scores
- Tracks application status

---

## 👤 User Personas

**Goals:**

- Find QA Automation Engineer jobs in Israel
- Focus on high-match jobs (save time)
- Track applications (applied, rejected, interested)
- Get notified about new high-match jobs

**Pain Points:**

- Too many irrelevant jobs on job boards
- Hard to evaluate if job matches skills
- Forget which jobs already applied to
- Miss new job postings

---

## 🎨 User Experience Overview

### Core User Flow

```
1. Setup (One-time)
   - Upload CV
   - Configure API keys (SerpAPI, Gemini in .env)
   - Create search profiles
   ↓
2. Automated Daily Search (Background)
   - Open web app
   - See new jobs (Searches active profile)
   - Analyze with AI scores option optionaly (after the 'See new jobs' step only)
   - AI analyzes each job (after the 'Analyze with AI scores option' step only)
   ↓
4. Review AI Analysis (if AI analys was used in the previous step)
   - Match score, strengths, gaps
   - Read AI reasoning
   ↓
5. Take Action
   - Apply to job (external link)
   - Save for later
   - Reject
   ↓
6. Track Progress
   - Mark status (Applied/Saved/Rejected)
   - Add notes
   - View statistics
```

---

## 📱 Application Structure

### Pages & Navigation

```
┌─────────────────────────────────────────┐
│  Job Screener         [Settings] [👤]   │
├─────────────────────────────────────────┤
│                                         │
│  Navigation:                            │
│  [Dashboard] [Jobs] [Profiles] [Stats]  │
│                                         │
└─────────────────────────────────────────┘
```

**Pages:**

1. **Dashboard** (`/`) — Overview + Recent high-match jobs
2. **Jobs Browser** (`/jobs`) — All jobs with filters
3. **Search Profiles** (`/profiles`) — Manage search criteria
4. **Statistics** (`/stats`) — Analytics (optional MVP+)
5. **Settings** (`/settings`) — App configuration

---

## 📋 Feature Breakdown

### ✅ MVP Features (Must Have)

#### 1. Search Profiles Management

**What:** Define search criteria for job searches (should support SerpAPI format)

**User Flow:**

```
User → /profiles → "Create New Profile"
  ↓
Fill form:
  - Profile Name: "QA Automation - Tel Aviv"
  - Keywords: "QA Automation Engineer, SDET, Test Automation"
  - Location: "Tel Aviv, Israel"
  - Date Posted: "Last 7 days"
  - Radius: "50 km"
  ↓
Save → Profile created ✅
```

**UI Components:**

- Profile list (cards)
- Create/Edit form
- Delete confirmation
- "Search Now" button (manual trigger)
- Active/Inactive toggle

**Database:**

```sql
search_profiles:
  - id, name, keywords, location, date_posted, radius, active
```

---

#### 2. Manual Job Search

**What:** Trigger job search on-demand

**User Flow:**

```
User → /profiles → Click "Search Now" on profile
  ↓
Loading spinner appears
  ↓
Backend:
  1. Call SerpAPI (get jobs)
  2. For each job → Gemini AI analysis
  3. Save to SQLite (should prevent saving an existing job)
  ↓
Redirect to /jobs
  ↓
User sees new jobs with AI scores ✅
```

**UI Feedback:**

- Loading state: "Searching jobs... (Step 1/3: Fetching from SerpAPI)"
- Progress indicator
- Success message: "Found 5 new jobs!"
- Error handling: "Search failed. Try again."

---

#### 3. Jobs Browser with AI Analysis

**What:** View all jobs with AI match scores and recommendations (prevent jobs duplications)

**User Flow:**

```
User → /jobs
  ↓
Sees job list with filters:
  - Status: [All] [New] [Applied] [Saved] [Rejected]
  - Match Score: [All] [>80%] [>60%] [>40%]
  - Date: [All] [Today] [This Week] [This Month]
  - Sort by: [Match Score ↓] [Date ↓]
  ↓
Click on job card → /jobs/:id (details page)
```

**Job Card Design:**

```
┌─────────────────────────────────────────────────┐
│ Senior QA Automation Engineer            85% 🟢 │
│ Company A • Tel Aviv • Posted 2 days ago        │
│                                                  │
│ 🤖 AI Recommendation: APPLY                     │
│                                                  │
│ ✅ Strengths:                                    │
│ • Playwright experience matches perfectly       │
│ • CI/CD automation required (your strength)     │
│ • TypeScript - your primary language            │
│                                                  │
│ ⚠️ Gaps:                                         │
│ • Cypress mentioned (you don't have)            │
│                                                  │
│ 💡 "Strong match. Your Playwright expertise     │
│    and CI/CD skills align perfectly."           │
│                                                  │
│ [View Details] [Apply Now] [Save] [Reject]      │
└─────────────────────────────────────────────────┘
```

**Color Coding:**

- 🟢 Green (80-100%): APPLY
- 🟡 Yellow (60-79%): MAYBE
- 🔴 Red (0-59%): SKIP

---

#### 4. Job Details Page

**What:** Full job description + expanded AI analysis

**User Flow:**

```
User → /jobs/:id
  ↓
Sees:
  - Full job description
  - Company info
  - Location details
  - Expanded AI analysis
  - Action buttons
  ↓
Actions:
  - "Apply Now" → Opens apply_link in new tab
  - "Mark as Applied" → Status = applied
  - "Save for Later" → Status = saved
  - "Reject" → Status = rejected
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back to Jobs                          │
├─────────────────────────────────────────┤
│                                         │
│ Senior QA Automation Engineer      85% │
│ Company A                               │
│ Tel Aviv, Israel • Full-time            │
│ Posted: 2 days ago                      │
│                                         │
│ [Apply Now] [Save] [Reject]             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 📄 Job Description                      │
│ [Full description text...]              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 🤖 AI Match Analysis                    │
│                                         │
│ Match Score: 85%                        │
│ Recommendation: APPLY                   │
│                                         │
│ ✅ Strengths (3):                       │
│ • Playwright experience matches...      │
│ • CI/CD automation required...          │
│ • TypeScript - your primary...          │
│                                         │
│ ⚠️ Gaps (1):                            │
│ • Cypress experience mentioned...       │
│                                         │
│ 💡 Reasoning:                           │
│ "Strong match (85%). Your Playwright... │
│                                         │
└─────────────────────────────────────────┘
```

---

#### 5. Automated Daily Search (Background) - NOT IN DEVELOPMENT SCOPE FOR NOW!!!

**What:** Cron job runs daily, searches jobs automatically

**User Flow (Background):**

```
09:00 AM (daily) → node-cron triggers
  ↓
For each active search profile:
  1. Call SerpAPI
  2. Gemini AI analysis
  3. Save to SQLite
  ↓
Filter: jobs with score > 70%
  ↓
If high-match jobs found:
  → Send Telegram notification
```

**Telegram Notification:**

```
🆕 Job Screener Alert

Found 3 high-match jobs!

1. Senior QA Automation (85%) - Company A
   📍 Tel Aviv • Posted today

2. SDET Infrastructure (82%) - Company B
   📍 Remote • Posted today

3. QA Engineer (78%) - Company C
   📍 Herzliya • Posted today

👉 View jobs: http://raspberry-pi:5173/jobs?filter=new
```

**Settings:**

- Schedule time (default: 09:00)
- Notification threshold (default: 70%)
- Telegram chat ID

---

#### 6. Dashboard (Overview)

**What:** Quick overview of job search status

**User Flow:**

```
User → / (homepage)
  ↓
Sees:
  - Stats cards (Total, New, Applied, High Matches)
  - Recent high-match jobs (top 5)
  - Quick actions
```

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────┐
│  📊 Job Search Dashboard                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   127    │ │    12    │ │    23    │        │
│  │  Total   │ │   New    │ │  High    │        │
│  │  Jobs    │ │  Today   │ │ Matches  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  ┌──────────┐ ┌──────────┐                     │
│  │     8    │ │    15    │                     │
│  │ Applied  │ │  Saved   │                     │
│  └──────────┘ └──────────┘                     │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  🎯 High Match Jobs (Score > 80%)               │
│                                                  │
│  [Job Card 1 - 85%]                             │
│  [Job Card 2 - 82%]                             │
│  [Job Card 3 - 81%]                             │
│                                                  │
│  [View All Jobs →]                              │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚡ Quick Actions                                │
│  [Create New Search Profile]                    │
│  [Run Manual Search]                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

#### 7. Settings Page

**What:** Configure app behavior

**Settings:**

```
┌─────────────────────────────────────────┐
│  ⚙️ Settings                            │
├─────────────────────────────────────────┤
│                                         │
│  👤 Your Profile (for AI matching)     │
│  ├─ CV/Resume: [No file uploaded]      │
│  ├─ [Upload CV] (supports .md, .txt)   │
│  └─ Last updated: Never                │
│                                         │
│  ⏰ Automation Schedule (will be added in future release) │
│  ├─ Daily Search Time: [09:00] ⏰      │
│  ├─ Enabled: [✓]                       │
│  └─ AI Match Threshold: [70%] 📊       │
│      (Only show jobs above this score) │
│                                         │
│  🔑 API Keys                            │
│  └─ [Test Connection]                  │
│                                         │
│  💾 Data Management                     │
│  ├─ Database Size: 2.3 MB              │
│  ├─ Total Jobs: 127                    │
│  └─ [Clear Old Jobs] (>30 days)        │
│                                         │
│  [Save Settings]                        │
│                                         │
└─────────────────────────────────────────┘
```

**Note:** Telegram/Email notifications will be added in future release.

---

### 🚀 MVP+ Features (Nice to Have)

#### 8. Statistics & Analytics (Optional)

**What:** Visual analytics of job search

**Charts:**

- Jobs found per day (line chart)
- Match score distribution (bar chart)
- Top companies (pie chart)
- Application funnel (applied vs saved vs rejected)

---

#### 9. Notes on Jobs (Optional)

**What:** Add personal notes to jobs

**User Flow:**

```
User → Job Details → "Add Note"
  ↓
Text area appears
  ↓
Save note → Stored in SQLite
```

---

#### 10. Email Notifications (Optional) - NOT IN DEVELOPMENT SCOPE FOR NOW!!!

**What:** Alternative to Telegram (email notifications)

---

## 🎯 User Stories (MVP)

### Story 1: Create Search Profile

```
As a job seeker
I want to create a search profile with my criteria
So that the system knows what jobs to search for

Acceptance Criteria:
- Can create profile with name, keywords, location (full SerpAPI supporting)
- Can set date_posted filter (today, 3days, week, month)
- Can activate/deactivate profile
- Profile saved to SQLite
```

### Story 2: Manual Job Search

```
As a job seeker
I want to trigger job search manually
So that I can get results immediately without waiting

Acceptance Criteria:
- Click "Search Now" on profile
- See loading state with progress
- Jobs fetched from SerpAPI
- AI analysis completed for each job (optionaly)
- Jobs saved to database
- Redirected to jobs page
```

### Story 3: Browse Jobs with AI Scores

```
As a job seeker
I want to see jobs with AI match scores
So that I can focus on relevant jobs

Acceptance Criteria:
- Jobs displayed as cards with match score
- Color-coded by recommendation (APPLY/MAYBE/SKIP)
- Show AI strengths and gaps
- Filter by status, score, date
- Sort by score or date
```

### Story 4: View Job Details

```
As a job seeker
I want to see full job details and AI analysis
So that I can make informed decision

Acceptance Criteria:
- Full job description visible
- Expanded AI analysis
- Apply link opens in new tab
- Can mark status (applied/saved/rejected)
```

### Story 5: Automated Daily Search - NOT IN DEVELOPMENT SCOPE FOR NOW!!!

```
As a job seeker
I want jobs searched automatically every day
So that I don't miss new postings

Acceptance Criteria:
- Cron runs daily at configured time
- All active profiles searched
- AI analysis completed
- High-match jobs trigger notification
- Telegram message sent with summary
```

### Story 6: Dashboard Overview

```
As a job seeker
I want to see overview of my job search
So that I can track progress

Acceptance Criteria:
- Stats cards show totals
- Recent high-match jobs displayed
- Quick actions available
```

---

## 🎨 Design Principles

### 1. **Simplicity First**

- Clean, minimal UI
- Focus on job cards and AI scores
- No clutter

### 2. **AI Transparency**

- Always show WHY AI recommended/rejected
- Strengths and gaps visible
- Match score prominent

### 3. **Action-Oriented**

- Clear CTAs (Apply Now, Save, Reject)
- One-click status updates
- Fast navigation

### 4. **Mobile-Friendly**

- Responsive design
- Works on phone (Telegram → open link → mobile view)

---

## 🚫 Out of Scope (Not in MVP)

- ❌ Multi-user support
- ❌ Job application tracking (external links only)
- ❌ Resume builder
- ❌ Cover letter generator
- ❌ Interview scheduling
- ❌ Salary negotiation tools
- ❌ Company research integration

---

## 📊 Success Metrics

**MVP Success:**

- ✅ Automated search runs daily without errors
- ✅ AI analysis completes for all jobs (optionaly)
- ✅ Telegram notifications received - NOT IN DEVELOPMENT SCOPE FOR NOW!!!
- ✅ Can browse and filter jobs easily
- ✅ Application status tracking works

**User Satisfaction:**

- Saves time (no manual job board checking)
- High-match jobs are actually relevant
- Easy to use (no learning curve)

---

## 🌐 Open Source Considerations

### Configuration Files

**Option 2: Config file**

- `.env` file for API keys

---
