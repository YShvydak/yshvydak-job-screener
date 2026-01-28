/**
 * Database Seeding Helpers for Tests
 *
 * Usage:
 *   import { seedProfile, seedJob, getAllJobs } from '../helpers/database'
 *   seedProfile(db, fixtures.profile)
 */

import type {Database} from 'better-sqlite3'
import {fixtures} from './fixtures'

// ============================================
// SEEDING FUNCTIONS
// ============================================

/**
 * Seed a user into the database
 */
export function seedUser(db: Database, userId = 'test-user-id', email = 'test@example.com') {
    const now = new Date().toISOString()
    const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)
    stmt.run(userId, email, 'hash', now, now)
    return {id: userId, email}
}

/**
 * Seed a search profile into the database
 */
export function seedProfile(
    db: Database,
    data: Partial<typeof fixtures.profile> & {user_id?: string} = {}
) {
    const userId = data.user_id || 'test-user-id'
    // Ensure user exists
    seedUser(db, userId)

    const profile = {...fixtures.profile, user_id: userId, ...data}
    const stmt = db.prepare(`
    INSERT INTO search_profiles (id, user_id, name, keywords, location, date_posted, radius, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        profile.id,
        userId,
        profile.name,
        profile.keywords,
        profile.location,
        profile.date_posted,
        profile.radius,
        profile.active
    )
    return profile
}

/**
 * Seed a job into the database
 */
export function seedJob(
    db: Database,
    data: Partial<typeof fixtures.job> & {user_id?: string} = {}
) {
    const userId = data.user_id || 'test-user-id'
    // Ensure user exists
    seedUser(db, userId)

    const job = {...fixtures.job, user_id: userId, ...data}
    const now = new Date().toISOString()
    const stmt = db.prepare(`
    INSERT INTO jobs (
      id, user_id, profile_id, provider, provider_job_id, title, company, location,
      description, apply_link, posted_date, source, status,
      fetched_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        job.id,
        userId,
        job.profile_id,
        job.provider,
        job.provider_job_id,
        job.title,
        job.company,
        job.location,
        job.description,
        job.apply_link,
        job.posted_date,
        job.source,
        job.status,
        now,
        now,
        now
    )
    return job
}

/**
 * Seed an AI analysis into the database
 */
export function seedAnalysis(
    db: Database,
    data: Partial<typeof fixtures.analysis> = fixtures.analysis
) {
    const analysis = {...fixtures.analysis, ...data}
    const now = new Date().toISOString()
    const stmt = db.prepare(`
    INSERT INTO ai_analyses (
      id, job_id, match_score, recommendation, strengths, gaps, reasoning, analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        analysis.id,
        analysis.job_id,
        analysis.match_score,
        analysis.recommendation,
        analysis.strengths,
        analysis.gaps,
        analysis.reasoning,
        now
    )
    return analysis
}

/**
 * Seed settings into the database
 */
export function seedSettings(
    db: Database,
    userId = 'test-user-id',
    cvContent: string = fixtures.settings.cv_content
) {
    // Ensure user exists
    seedUser(db, userId)

    const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at)
    VALUES (?, 'cv_content', ?, ?)
  `)
    stmt.run(userId, cvContent, new Date().toISOString())
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get all jobs from database
 */
export function getAllJobs(db: Database) {
    return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all()
}

/**
 * Get job by ID
 */
export function getJobById(db: Database, id: string) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
}

/**
 * Get job by SerpAPI ID
 */
export function getJobBySerpApiId(db: Database, serpApiId: string) {
    // Note: This relies on internal implementation details if we mapped serpapi to provider_job_id
    return db
        .prepare('SELECT * FROM jobs WHERE provider = ? AND provider_job_id = ?')
        .get('serpapi', serpApiId)
}

/**
 * Get all profiles
 */
export function getAllProfiles(db: Database) {
    return db.prepare('SELECT * FROM search_profiles ORDER BY created_at DESC').all()
}

/**
 * Get profile by ID
 */
export function getProfileById(db: Database, id: string) {
    return db.prepare('SELECT * FROM search_profiles WHERE id = ?').get(id)
}

/**
 * Get all analyses
 */
export function getAllAnalyses(db: Database) {
    return db.prepare('SELECT * FROM ai_analyses ORDER BY analyzed_at DESC').all()
}

/**
 * Get analysis by job ID
 */
export function getAnalysisByJobId(db: Database, jobId: string) {
    return db.prepare('SELECT * FROM ai_analyses WHERE job_id = ?').get(jobId)
}

/**
 * Get CV content from user_settings
 */
export function getCVContent(db: Database, userId = 'test-user-id'): string | null {
    const result = db
        .prepare("SELECT value FROM user_settings WHERE user_id = ? AND key = 'cv_content'")
        .get(userId) as {value: string} | undefined
    return result?.value ?? null
}

// ============================================
// COUNT HELPERS
// ============================================

/**
 * Count jobs in database
 */
export function getJobCount(db: Database): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as {count: number}
    return result.count
}

/**
 * Count profiles in database
 */
export function getProfileCount(db: Database): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM search_profiles').get() as {
        count: number
    }
    return result.count
}

/**
 * Count analyses in database
 */
export function getAnalysisCount(db: Database): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM ai_analyses').get() as {
        count: number
    }
    return result.count
}

// ============================================
// CLEANUP HELPERS
// ============================================

/**
 * Clean all data from database (respects foreign key order)
 */
export function cleanDatabase(db: Database) {
    // Order matters for foreign key constraints
    db.exec('DELETE FROM ai_analyses')
    db.exec('DELETE FROM job_notes')
    db.exec('DELETE FROM jobs')
    db.exec('DELETE FROM search_profiles')
    db.exec('DELETE FROM user_settings')
    db.exec('DELETE FROM users')
}

/**
 * Clean only jobs and analyses (keeps profiles and settings)
 */
export function cleanJobsAndAnalyses(db: Database) {
    db.exec('DELETE FROM ai_analyses')
    db.exec('DELETE FROM jobs')
}
