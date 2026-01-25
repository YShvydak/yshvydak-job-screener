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
 * Seed a search profile into the database
 */
export function seedProfile(
    db: Database,
    data: Partial<typeof fixtures.profile> = fixtures.profile
) {
    const profile = {...fixtures.profile, ...data}
    const stmt = db.prepare(`
    INSERT INTO search_profiles (id, name, keywords, location, date_posted, radius, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        profile.id,
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
export function seedJob(db: Database, data: Partial<typeof fixtures.job> = fixtures.job) {
    const job = {...fixtures.job, ...data}
    const now = new Date().toISOString()
    const stmt = db.prepare(`
    INSERT INTO jobs (
      id, profile_id, serpapi_job_id, title, company, location,
      description, apply_link, posted_date, source, status,
      fetched_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        job.id,
        job.profile_id,
        job.serpapi_job_id,
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
export function seedSettings(db: Database, cvContent: string = fixtures.settings.cv_content) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES ('cv_content', ?, ?)
  `)
    stmt.run(cvContent, new Date().toISOString())
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
    return db.prepare('SELECT * FROM jobs WHERE serpapi_job_id = ?').get(serpApiId)
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
 * Get CV content from settings
 */
export function getCVContent(db: Database): string | null {
    const result = db.prepare("SELECT value FROM settings WHERE key = 'cv_content'").get() as
        | {value: string}
        | undefined
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
    db.exec("DELETE FROM settings WHERE key != 'cv_content'")
    db.exec("UPDATE settings SET value = '' WHERE key = 'cv_content'")
}

/**
 * Clean only jobs and analyses (keeps profiles and settings)
 */
export function cleanJobsAndAnalyses(db: Database) {
    db.exec('DELETE FROM ai_analyses')
    db.exec('DELETE FROM jobs')
}
