/**
 * JobRepository Unit Tests
 *
 * ⚠️ CRITICAL: Tests for job deduplication via serpapi_job_id
 * This is the most important test file - prevents duplicate jobs in database
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import {JobRepository} from '../../../repositories/job.repository'

describe('JobRepository', () => {
    let db: Database.Database
    let repository: JobRepository

    beforeEach(() => {
        // Use in-memory database for fast tests
        db = new Database(':memory:')

        // Load schema
        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Create a test profile for foreign key constraint
        const now = new Date().toISOString()
        db.prepare(
            `
      INSERT INTO search_profiles (id, name, keywords, location, date_posted, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
        ).run('test-profile', 'Test Profile', 'test keywords', 'Test Location', 'week', 1, now, now)

        repository = new JobRepository(db)
    })

    afterEach(() => {
        db.close()
    })

    // ============================================
    // findBySerpAPIId - CRITICAL DEDUPLICATION
    // ============================================
    describe('findBySerpAPIId (CRITICAL - Deduplication)', () => {
        it('should return job when serpapi_job_id exists', () => {
            // Arrange - insert a job directly
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-1', 'serp_123', 'Developer', now, now, now)

            // Act
            const result = repository.findBySerpAPIId('serp_123')

            // Assert
            expect(result).not.toBeNull()
            expect(result?.serpapi_job_id).toBe('serp_123')
            expect(result?.title).toBe('Developer')
        })

        it('should return null when serpapi_job_id does not exist', () => {
            // Act
            const result = repository.findBySerpAPIId('non_existent_id')

            // Assert
            expect(result).toBeNull()
        })

        it('should return null for empty string serpapi_job_id', () => {
            // Act
            const result = repository.findBySerpAPIId('')

            // Assert
            expect(result).toBeNull()
        })

        it('should find correct job among multiple jobs', () => {
            // Arrange - insert multiple jobs
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-1', 'serp_111', 'Job 1', now, now, now)

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-2', 'serp_222', 'Job 2', now, now, now)

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-3', 'serp_333', 'Job 3', now, now, now)

            // Act
            const result = repository.findBySerpAPIId('serp_222')

            // Assert
            expect(result).not.toBeNull()
            expect(result?.id).toBe('job-2')
            expect(result?.title).toBe('Job 2')
        })
    })

    // ============================================
    // create
    // ============================================
    describe('create', () => {
        it('should create a new job with all fields', () => {
            // Arrange - create profile first (FK constraint)
            db.prepare(
                `
        INSERT INTO search_profiles (id, name, keywords, location)
        VALUES (?, ?, ?, ?)
      `
            ).run('profile-1', 'Test Profile', 'developer', 'Remote')

            // Act
            const result = repository.create({
                profile_id: 'profile-1',
                serpapi_job_id: 'serp_new_123',
                title: 'Senior Engineer',
                company: 'Test Company',
                location: 'Remote',
                description: 'Great job opportunity',
                apply_link: 'https://example.com/apply',
                posted_date: '2 days ago',
                source: 'LinkedIn',
            })

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBeDefined()
            expect(result.serpapi_job_id).toBe('serp_new_123')
            expect(result.title).toBe('Senior Engineer')
            expect(result.company).toBe('Test Company')
            expect(result.status).toBe('new') // Default status
        })

        it('should create job with minimal required fields', () => {
            // Act
            const result = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_minimal',
                title: 'Minimal Job',
            })

            // Assert
            expect(result).toBeDefined()
            expect(result.serpapi_job_id).toBe('serp_minimal')
            expect(result.title).toBe('Minimal Job')
            expect(result.company).toBeNull()
            expect(result.location).toBeNull()
        })

        it('should throw error on duplicate serpapi_job_id (UNIQUE constraint)', () => {
            // Arrange - create first job
            repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_duplicate',
                title: 'First Job',
            })

            // Act & Assert - try to create duplicate
            expect(() => {
                repository.create({
                    profile_id: 'test-profile',
                    serpapi_job_id: 'serp_duplicate',
                    title: 'Duplicate Job',
                })
            }).toThrow() // SQLite UNIQUE constraint violation
        })

        it('should generate unique UUID for each job', () => {
            // Act
            const job1 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_1',
                title: 'Job 1',
            })

            const job2 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_2',
                title: 'Job 2',
            })

            // Assert
            expect(job1.id).not.toBe(job2.id)
            expect(job1.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
        })
    })

    // ============================================
    // findById
    // ============================================
    describe('findById', () => {
        it('should return job when id exists', () => {
            // Arrange
            const created = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_find',
                title: 'Find Me',
            })

            // Act
            const result = repository.findById(created.id)

            // Assert
            expect(result).not.toBeNull()
            expect(result?.id).toBe(created.id)
        })

        it('should return null when id does not exist', () => {
            // Act
            const result = repository.findById('non-existent-uuid')

            // Assert
            expect(result).toBeNull()
        })
    })

    // ============================================
    // findAll
    // ============================================
    describe('findAll', () => {
        beforeEach(() => {
            // Create profiles first (FK constraint)
            db.prepare(
                `
        INSERT INTO search_profiles (id, name, keywords, location)
        VALUES (?, ?, ?, ?)
      `
            ).run('profile-a', 'Profile A', 'developer', 'Remote')

            db.prepare(
                `
        INSERT INTO search_profiles (id, name, keywords, location)
        VALUES (?, ?, ?, ?)
      `
            ).run('profile-b', 'Profile B', 'engineer', 'NYC')

            // Seed some jobs
            repository.create({serpapi_job_id: 'serp_1', title: 'Job 1', profile_id: 'profile-a'})
            repository.create({serpapi_job_id: 'serp_2', title: 'Job 2', profile_id: 'profile-a'})
            repository.create({serpapi_job_id: 'serp_3', title: 'Job 3', profile_id: 'profile-b'})
        })

        it('should return all jobs without filters', () => {
            // Act
            const result = repository.findAll()

            // Assert
            expect(result).toHaveLength(3)
        })

        it('should filter by profileId', () => {
            // Act
            const result = repository.findAll({profileId: 'profile-a'})

            // Assert
            expect(result).toHaveLength(2)
            expect(result.every((j) => j.profile_id === 'profile-a')).toBe(true)
        })

        it('should filter by status', () => {
            // Arrange - update one job status
            const jobs = repository.findAll()
            repository.updateStatus(jobs[0].id, 'applied')

            // Act
            const result = repository.findAll({status: 'applied'})

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].status).toBe('applied')
        })

        it('should return empty array when no jobs match filter', () => {
            // Act
            const result = repository.findAll({profileId: 'non-existent'})

            // Assert
            expect(result).toEqual([])
        })
    })

    // ============================================
    // updateStatus
    // ============================================
    describe('updateStatus', () => {
        it('should update job status', () => {
            // Arrange
            const job = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_status',
                title: 'Status Test',
            })
            expect(job.status).toBe('new')

            // Act
            const updated = repository.updateStatus(job.id, 'applied')

            // Assert
            expect(updated).not.toBeNull()
            expect(updated?.status).toBe('applied')
        })

        it('should return null when job does not exist', () => {
            // Act
            const result = repository.updateStatus('non-existent', 'applied')

            // Assert
            expect(result).toBeNull()
        })

        it('should update updated_at timestamp', () => {
            // Arrange
            const job = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_timestamp',
                title: 'Timestamp Test',
            })
            const originalUpdatedAt = job.updated_at

            // Small delay to ensure timestamp difference
            const startTime = Date.now()
            while (Date.now() - startTime < 10) {
                // busy wait
            }

            // Act
            const updated = repository.updateStatus(job.id, 'saved')

            // Assert
            expect(updated?.updated_at).not.toBe(originalUpdatedAt)
        })
    })

    // ============================================
    // delete
    // ============================================
    describe('delete', () => {
        it('should delete existing job', () => {
            // Arrange
            const job = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_delete',
                title: 'Delete Me',
            })

            // Act
            const result = repository.delete(job.id)

            // Assert
            expect(result).toBe(true)
            expect(repository.findById(job.id)).toBeNull()
        })

        it('should return false when job does not exist', () => {
            // Act
            const result = repository.delete('non-existent')

            // Assert
            expect(result).toBe(false)
        })
    })

    // ============================================
    // deleteAll
    // ============================================
    describe('deleteAll', () => {
        it('should delete all jobs and return count', () => {
            // Arrange
            repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_delete_all_1',
                title: 'Job 1',
            })
            repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_delete_all_2',
                title: 'Job 2',
            })

            // Act
            const deleted = repository.deleteAll()

            // Assert
            expect(deleted).toBe(2)
            expect(repository.findAll()).toHaveLength(0)
        })

        it('should return 0 when no jobs exist', () => {
            // Act
            const deleted = repository.deleteAll()

            // Assert
            expect(deleted).toBe(0)
        })
    })

    // ============================================
    // countByStatus
    // ============================================
    describe('countByStatus', () => {
        it('should return correct counts per status', () => {
            // Arrange
            const job1 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_c1',
                title: 'Job 1',
            })
            const job2 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_c2',
                title: 'Job 2',
            })
            repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_c3',
                title: 'Job 3',
            })

            repository.updateStatus(job1.id, 'applied')
            repository.updateStatus(job2.id, 'applied')

            // Act
            const counts = repository.countByStatus()

            // Assert
            expect(counts.new).toBe(1)
            expect(counts.applied).toBe(2)
            expect(counts.saved).toBe(0)
            expect(counts.rejected).toBe(0)
            expect(counts.total).toBe(3)
        })

        it('should return zeros when no jobs exist', () => {
            // Act
            const counts = repository.countByStatus()

            // Assert
            expect(counts.total).toBe(0)
            expect(counts.new).toBe(0)
        })
    })

    // ============================================
    // findAllWithAnalysis
    // ============================================
    describe('findAllWithAnalysis', () => {
        it('should return jobs with analysis data when analysis exists', () => {
            // Arrange - create job and analysis
            const job = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_analysis',
                title: 'Analysis Test',
            })

            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, strengths, gaps, reasoning, analyzed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
            ).run('analysis-1', job.id, 85, 'APPLY', '["skill1"]', '["gap1"]', 'Good match', now)

            // Act
            const result = repository.findAllWithAnalysis()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].analysis).toBeDefined()
            expect(result[0].analysis?.match_score).toBe(85)
            expect(result[0].analysis?.recommendation).toBe('APPLY')
        })

        it('should return jobs without analysis when no analysis exists', () => {
            // Arrange
            repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_no_analysis',
                title: 'No Analysis',
            })

            // Act
            const result = repository.findAllWithAnalysis()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].analysis).toBeUndefined()
        })

        it('should filter by minScore', () => {
            // Arrange - create jobs with different scores
            const job1 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_s1',
                title: 'High Score',
            })
            const job2 = repository.create({
                profile_id: 'test-profile',
                serpapi_job_id: 'serp_s2',
                title: 'Low Score',
            })

            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, analyzed_at)
        VALUES (?, ?, ?, ?, ?)
      `
            ).run('a1', job1.id, 90, 'APPLY', now)

            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, analyzed_at)
        VALUES (?, ?, ?, ?, ?)
      `
            ).run('a2', job2.id, 40, 'SKIP', now)

            // Act
            const result = repository.findAllWithAnalysis({minScore: 70})

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('High Score')
        })

        // ============================================
        // Sorting Behavior Tests
        // ============================================
        it('should sort jobs by fetched_at DESC (newest first)', () => {
            // Arrange - create jobs with different fetched_at timestamps
            const baseTime = new Date('2026-01-24T10:00:00Z').getTime()

            // Insert jobs directly with specific timestamps
            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-1',
                'serp_old',
                'Old Job',
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString()
            )

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-2',
                'serp_new',
                'New Job',
                new Date(baseTime + 60000).toISOString(), // 1 minute later
                new Date(baseTime + 60000).toISOString(),
                new Date(baseTime + 60000).toISOString()
            )

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-3',
                'serp_middle',
                'Middle Job',
                new Date(baseTime + 30000).toISOString(), // 30 seconds later
                new Date(baseTime + 30000).toISOString(),
                new Date(baseTime + 30000).toISOString()
            )

            // Act
            const result = repository.findAllWithAnalysis()

            // Assert - should be sorted newest first
            expect(result).toHaveLength(3)
            expect(result[0].title).toBe('New Job')
            expect(result[1].title).toBe('Middle Job')
            expect(result[2].title).toBe('Old Job')
        })

        it('should maintain chronological order when AI analysis is added', () => {
            // Arrange - create jobs with different timestamps
            const baseTime = new Date('2026-01-24T10:00:00Z').getTime()

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-1',
                'serp_1',
                'Oldest Job',
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString()
            )

            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-2',
                'serp_2',
                'Newest Job',
                new Date(baseTime + 120000).toISOString(), // 2 minutes later
                new Date(baseTime + 120000).toISOString(),
                new Date(baseTime + 120000).toISOString()
            )

            // Add AI analysis to the OLDEST job with high match score
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, strengths, gaps, reasoning, analyzed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
            ).run(
                'analysis-1',
                'job-1',
                95,
                'APPLY',
                '["skill1"]',
                '["gap1"]',
                'Excellent match',
                now
            )

            // Act
            const result = repository.findAllWithAnalysis()

            // Assert - newest job should still be first, even though oldest has higher match score
            expect(result).toHaveLength(2)
            expect(result[0].title).toBe('Newest Job')
            expect(result[0].analysis).toBeUndefined()
            expect(result[1].title).toBe('Oldest Job')
            expect(result[1].analysis?.match_score).toBe(95)
        })

        it('should sort multiple analyzed jobs by fetched_at, not match_score', () => {
            // Arrange - create jobs with different timestamps and match scores
            const baseTime = new Date('2026-01-24T10:00:00Z').getTime()

            // Job 1: Oldest, highest score
            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-1',
                'serp_1',
                'Old High Score',
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString(),
                new Date(baseTime).toISOString()
            )

            // Job 2: Newest, lowest score
            db.prepare(
                `
        INSERT INTO jobs (id, serpapi_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?)
      `
            ).run(
                'job-2',
                'serp_2',
                'New Low Score',
                new Date(baseTime + 60000).toISOString(),
                new Date(baseTime + 60000).toISOString(),
                new Date(baseTime + 60000).toISOString()
            )

            const now = new Date().toISOString()

            // Add high score to old job
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, analyzed_at)
        VALUES (?, ?, ?, ?, ?)
      `
            ).run('a1', 'job-1', 90, 'APPLY', now)

            // Add low score to new job
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, analyzed_at)
        VALUES (?, ?, ?, ?, ?)
      `
            ).run('a2', 'job-2', 30, 'SKIP', now)

            // Act
            const result = repository.findAllWithAnalysis()

            // Assert - should be sorted by fetched_at DESC, not match_score
            expect(result).toHaveLength(2)
            expect(result[0].title).toBe('New Low Score')
            expect(result[0].analysis?.match_score).toBe(30)
            expect(result[1].title).toBe('Old High Score')
            expect(result[1].analysis?.match_score).toBe(90)
        })
    })
})
