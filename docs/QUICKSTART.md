# Quick Start Guide

Get YShvydak Job Screener running in 5 minutes.

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js)
- **SerpAPI Key** ([get free key](https://serpapi.com/users/sign_up))
- **Google Gemini API Key** ([get free key](https://ai.google.dev/))

---

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/yshvydak/yshvydak-job-screener.git
cd yshvydak-job-screener
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for all packages (server + web).

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your favorite editor
```

**.env file:**

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

**Get API Keys:**

1. **SerpAPI:** [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up)
   - Free tier: 100 searches/month
   - Copy your API key

2. **Google Gemini AI:** [https://ai.google.dev/](https://ai.google.dev/)
   - Free tier available
   - Create API key in Google AI Studio

### Step 4: Start Development Server

```bash
npm run dev
```

This will start:
- **Backend API** on `http://localhost:3001`
- **Frontend UI** on `http://localhost:3000`

### Step 5: Open in Browser

Navigate to `http://localhost:3000`

You should see the Job Screener dashboard!

> **Note:** If port 3000 is busy, Vite may use 3001, 3002, etc. Check terminal output for actual port.

---

## First Steps

### 1. Upload Your CV

1. Click **Settings** (⚙️ icon)
2. Click **Upload CV**
3. Select your CV file (`.md` or `.txt` format)
4. Click **Save**

**Note:** AI job analysis requires your CV to compare against job descriptions.

### 2. Create a Search Profile

1. Go to **Profiles** page
2. Click **Create New Profile**
3. Fill in search criteria:
   - **Name:** e.g., "QA Automation Worldwide" (required)
   - **Keywords:** e.g., "QA Automation Engineer, SDET" (required)
   - **Location:** e.g., "Tel Aviv, Israel" (optional - leave empty for global search)
   - **Date Posted:** e.g., "Last 7 days" (optional)
   - **Radius:** e.g., "50 km" (optional, only with location)
4. Click **Create**

> **Tip:** Leave location empty to search for jobs worldwide!

### 3. Run Your First Search

1. On the **Profiles** page, find your profile
2. Click **Search Now**
3. Choose whether to **Analyze with AI** (optional)
4. Wait for search to complete (10-30 seconds)
5. View results on **Jobs** page

### 4. Review Jobs

1. Go to **Jobs** page
2. See job listings with:
   - Match score (if AI analysis was used)
   - Job title, company, location
   - Status badge
3. Click on a job to see details
4. Take action:
   - **Apply Now** → Opens job link
   - **Mark as Applied** → Track application
   - **Save for Later** → Save to review later
   - **Reject** → Hide from main list

---

## Troubleshooting

### "Database not found"

**Solution:** Database is created automatically on first run. If you see this error:

```bash
mkdir -p data
npm run dev
```

### "SerpAPI quota exceeded"

**Solution:** Free tier has 100 searches/month. Options:
1. Wait for next month
2. Upgrade SerpAPI plan
3. Use fewer search profiles

### "Gemini AI error"

**Solution:** Check your API key:
1. Verify `GEMINI_API_KEY` in `.env`
2. Check [Google AI Studio](https://ai.google.dev/) for API key status
3. Ensure API is enabled

### "Port already in use"

**Solution:** Change ports in `.env`:

```bash
PORT=3002           # Backend port
VITE_PORT=3001      # Frontend port
```

Then restart: `npm run dev`

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- Read [API_REFERENCE.md](API_REFERENCE.md) for API documentation
- Check [requirements.md](../requirements.md) for product specification

---

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/yshvydak/yshvydak-job-screener/issues)
- **Documentation:** See [docs/](.) directory
- **Email:** y.shvydak@gmail.com

---

**Enjoy automated job searching! 🎯**
