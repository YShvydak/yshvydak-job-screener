# 🎯 YShvydak Job Screener

AI-powered job search automation that finds, analyzes, and scores job postings to help you focus on the best matches.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

---

## 🌟 Features

- 🔐 **Multi-User Authentication** - Secure login, registration, and per-user data isolation
- 🔍 **Automated Job Search** - Integrates with SerpAPI, Glassdoor, and more
- 🔌 **Multi-Provider Support** - Unify jobs from different sources
- 🤖 **AI-Powered Matching** - Google Gemini AI analyzes job fit based on your CV
- 📊 **Match Scoring** - Get 0-100% match scores with strengths and gaps analysis
- 📋 **Search Profiles** - Save and reuse search criteria (keywords, location, etc.)
- 📝 **Application Tracking** - Track job status (new, applied, saved, rejected)
- 💾 **Self-Hosted** - Runs on your Raspberry Pi 5 (or any server)

---

## 🔐 Authentication & Multi-User Support

This project supports full multi-user authentication with data isolation.

- **Secure Registration & Login** (Email/Password with Bcrypt)
- **JWT-based Session Management**
- **Per-User Data Isolation** (Jobs, Profiles, CVs are private)
- **Protected Routes** & API Endpoints

See [docs/AUTH_README.md](docs/AUTH_README.md) for full details.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 10+
- SerpAPI key ([get here](https://serpapi.com))
- Google Gemini API key ([get here](https://ai.google.dev))

### Installation

```bash
# Clone the repository
git clone https://github.com/yshvydak/yshvydak-job-screener.git
cd yshvydak-job-screener

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Access the app at `http://localhost:3000`

For detailed setup instructions, see [QUICKSTART.md](docs/QUICKSTART.md)

---

## 📖 Documentation

### For Users

- [📋 Product Specification](requirements.md) - What this app does
- [⚙️ Configuration Guide](docs/CONFIGURATION.md) - Environment setup
- [🚀 Quick Start](docs/QUICKSTART.md) - Get running in 5 minutes

### For Developers

- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design and structure
- [💻 Development Guide](docs/DEVELOPMENT.md) - Best practices and workflows
- [📚 API Reference](docs/API_REFERENCE.md) - API endpoints documentation

### For AI Assistants

- [🤖 CLAUDE.md](CLAUDE.md) - Quick reference for AI development
- [📂 File Locations](docs/ai/FILE_LOCATIONS.md) - Complete file structure
- [⚠️ Anti-Patterns](docs/ai/ANTI_PATTERNS.md) - Common mistakes to avoid
- [🗺️ Concept Map](docs/ai/CONCEPT_MAP.md) - System flows and diagrams

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)             │
│  - Dashboard, Jobs Browser, Search Profiles     │
└─────────────────┬───────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────┐
│  Backend (Express + TypeScript)                 │
│  Controller → Service → Repository → Database   │
│  ├─ SearchService (Provider Orchestration)      │
│  ├─ AIService (Gemini AI job analysis)          │
│  └─ JobRepository (SQLite storage)              │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │ Provider Layer    │
   ┌────▼─────┐       ┌─────▼────┐
   │ SerpAPI  │       │ Glassdoor│
   │ (Google) │       │ (Scraper)│
   └──────────┘       └──────────┘
```

**Tech Stack:**

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend:** Express.js, TypeScript, SQLite
- **External APIs:** SerpAPI (job search), Google Gemini AI (analysis)
- **Monorepo:** Turborepo

---

## 📊 How It Works

1. **Create Search Profile** - Define your job search criteria (keywords, location, etc.)
2. **Trigger Search** - Click "Search Now" to fetch jobs from multiple boards via SerpAPI
3. **AI Analysis** (Optional) - Gemini AI analyzes each job against your CV
4. **Review Results** - See jobs with match scores, strengths, and gaps
5. **Take Action** - Apply, save for later, or reject jobs
6. **Track Progress** - Monitor your application status

---

## 🔐 Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/jobs.db

# API Keys (REQUIRED)
SERPAPI_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Provider Keys (OPTIONAL)
GLASSDOOR_KEY=your_glassdoor_key

# Frontend
VITE_PORT=3000
VITE_API_BASE_URL=http://localhost:3001/api
```

See [CONFIGURATION.md](docs/CONFIGURATION.md) for complete setup.

---

## 🧪 Development

```bash
# Start all packages in development mode
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint:fix

# Format code
npm run format
```

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for complete development guide.

---

## 📝 API Endpoints

### Jobs

- `GET /api/jobs` - List all jobs with filters
- `GET /api/jobs/:id` - Get job details with AI analysis
- `PATCH /api/jobs/:id/status` - Update job status

### Search Profiles

- `GET /api/profiles` - List all search profiles
- `POST /api/profiles` - Create new profile
- `POST /api/search/run` - Trigger manual search

### Settings

- `GET /api/settings` - Get all settings
- `POST /api/settings/cv` - Upload CV for AI matching

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete reference.

---

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Follow the development guidelines in [DEVELOPMENT.md](docs/DEVELOPMENT.md)
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [SerpAPI](https://serpapi.com) - Job search API
- [Google Gemini AI](https://ai.google.dev) - AI analysis
- [Claude Code](https://claude.ai) - AI-assisted development

---

## 📧 Contact

**Yurii Shvydak** - y.shvydak@gmail.com

**Project Link:** [https://github.com/yshvydak/yshvydak-job-screener](https://github.com/yshvydak/yshvydak-job-screener)

---

**Built with ❤️ for making job search less painful**
