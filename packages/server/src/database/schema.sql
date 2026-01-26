-- YShvydak Job Screener Database Schema
-- SQLite 3

-- Search Profiles (user-defined search criteria)
CREATE TABLE IF NOT EXISTS search_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    keywords TEXT NOT NULL,           -- Comma-separated keywords
    location TEXT NOT NULL,
    date_posted TEXT,                 -- today, 3days, week, month
    radius INTEGER,                   -- km
    preferred_provider TEXT,          -- Optional: serpapi, glassdoor, etc.
    active INTEGER DEFAULT 1,         -- boolean (0/1)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jobs (fetched from job search providers)
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,              -- UUID
    profile_id TEXT,
    provider TEXT DEFAULT 'serpapi',  -- Job provider: serpapi, glassdoor, etc.
    provider_job_id TEXT,             -- External job ID from provider
    serpapi_job_id TEXT,              -- DEPRECATED: Kept for backward compatibility
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    description TEXT,
    apply_link TEXT,
    posted_date TEXT,
    source TEXT,                      -- LinkedIn, Indeed, etc.
    status TEXT DEFAULT 'new',        -- new, applied, saved, rejected
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES search_profiles(id) ON DELETE SET NULL
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS ai_analyses (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    match_score INTEGER,              -- 0-100
    recommendation TEXT,              -- APPLY, MAYBE, SKIP
    strengths TEXT,                   -- JSON array as string
    gaps TEXT,                        -- JSON array as string
    reasoning TEXT,                   -- AI explanation
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(job_id)                    -- One analysis per job
);

-- Settings (app configuration)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Job Notes (optional MVP+)
CREATE TABLE IF NOT EXISTS job_notes (
    job_id TEXT PRIMARY KEY,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_profile_id ON jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_fetched_at ON jobs(fetched_at);
CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_provider_job_id ON jobs(provider, provider_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_match_score ON ai_analyses(match_score);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_job_id ON ai_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_search_profiles_active ON search_profiles(active);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('cv_content', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_search_date', '');
