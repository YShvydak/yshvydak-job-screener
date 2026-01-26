-- Migration: Add multi-provider support
-- Run this migration on existing databases

-- Step 1: Add provider columns to jobs table
ALTER TABLE jobs ADD COLUMN provider TEXT DEFAULT 'serpapi';
ALTER TABLE jobs ADD COLUMN provider_job_id TEXT;

-- Step 2: Migrate existing data (copy serpapi_job_id to provider_job_id)
UPDATE jobs SET provider_job_id = serpapi_job_id WHERE provider_job_id IS NULL;

-- Step 3: Add preferred_provider to search_profiles
ALTER TABLE search_profiles ADD COLUMN preferred_provider TEXT DEFAULT NULL;

-- Step 4: Create new indexes
CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_provider_job_id ON jobs(provider, provider_job_id);
