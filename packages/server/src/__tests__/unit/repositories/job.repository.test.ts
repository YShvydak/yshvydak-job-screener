/**
 * JobRepository Unit Tests
 *
 * ⚠️ CRITICAL: Tests for job deduplication via provider_job_id + user_id
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
    const userId = 'test-user-id'

    beforeEach(() => {
        // Use in-memory database for fast tests
        db = new Database(':memory:')

        // Load schema
        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Create a test user
        const now = new Date().toISOString()
        db.prepare(
            `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
        ).run(userId, 'test@example.com', 'hash', now, now)

        // Create a test profile for foreign key constraint
        db.prepare(
            `
      INSERT INTO search_profiles (id, user_id, name, keywords, location, date_posted, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
        ).run(
            'test-profile',
            userId,
            'Test Profile',
            'test keywords',
            'Test Location',
            'week',
            1,
            now,
            now
        )

        repository = new JobRepository(db)
    })

    afterEach(() => {
        db.close()
    })

    // ============================================
    // findByProviderJobId - CRITICAL DEDUPLICATION
    // ============================================
    describe('findByProviderJobId (CRITICAL - Deduplication)', () => {
        it('should return job when provider_job_id exists for user', () => {
            // Arrange - insert a job directly
            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO jobs (id, user_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-1', userId, 'serpapi', 'serp_123', 'Developer', now, now, now)

            // Act
            const result = repository.findByProviderJobId('serpapi', 'serp_123', userId)

            // Assert
            expect(result).not.toBeNull()
            expect(result?.provider_job_id).toBe('serp_123')
            expect(result?.title).toBe('Developer')
        })

        it('should NOT return job belonging to another user', () => {
            // Arrange - insert a job for another user
            const otherUserId = 'other-user'
            const now = new Date().toISOString()

            // Create other user
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )

            db.prepare(
                `
        INSERT INTO jobs (id, user_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?)
      `
            ).run('job-2', otherUserId, 'serpapi', 'serp_123', 'Other Dev', now, now, now)

            // Act - try to find it with current userId
            const result = repository.findByProviderJobId('serpapi', 'serp_123', userId)

            // Assert
            expect(result).toBeNull()
        })

        it('should return null when provider_job_id does not exist', () => {
            // Act
            const result = repository.findByProviderJobId('serpapi', 'non_existent_id', userId)

            // Assert
            expect(result).toBeNull()
        })
    })

    // ============================================
    // create
    // ============================================
    describe('create', () => {
        it('should create a new job with all fields', () => {
            // Act
            const result = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'serp_new_123',
                    title: 'Senior Engineer',
                    company: 'Test Company',
                    location: 'Remote',
                    description: 'Great job opportunity',
                    apply_link: 'https://example.com/apply',
                    posted_date: '2 days ago',
                    source: 'LinkedIn',
                },
                userId
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.id).toBeDefined()
            expect(result.user_id).toBe(userId)
            expect(result.provider_job_id).toBe('serp_new_123')
            expect(result.title).toBe('Senior Engineer')
        })

        it('should throw error on duplicate provider_job_id for SAME user', () => {
            // Arrange - create first job
            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'serp_duplicate',
                    title: 'First Job',
                },
                userId
            )

            // Act & Assert - try to create duplicate
            expect(() => {
                repository.create(
                    {
                        profile_id: 'test-profile',
                        provider: 'serpapi',
                        provider_job_id: 'serp_duplicate',
                        title: 'Duplicate Job',
                    },
                    userId
                )
            }).toThrow() // SQLite UNIQUE constraint violation
        })

        it('should ALLOW duplicate provider_job_id for DIFFERENT users', () => {
            // Arrange - create first job for current user
            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'shared_job_id',
                    title: 'User 1 Job',
                },
                userId
            )

            // Create another user
            const otherUserId = 'other-user'
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )

            // Create profile for other user
            db.prepare(
                `INSERT INTO search_profiles (id, user_id, name, keywords, location) VALUES (?, ?, ?, ?, ?)`
            ).run('other-profile', otherUserId, 'Other Profile', 'keys', 'loc')

            // Act - create same job (same provider_job_id) for other user
            const result = repository.create(
                {
                    profile_id: 'other-profile',
                    provider: 'serpapi',
                    provider_job_id: 'shared_job_id',
                    title: 'User 2 Job',
                },
                otherUserId
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.user_id).toBe(otherUserId)
            expect(result.provider_job_id).toBe('shared_job_id')
        })
    })

    // ============================================
    // findAll
    // ============================================
    describe('findAll', () => {
        it('should return only jobs belonging to the user', () => {
            // Arrange
            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'my_job',
                    title: 'My Job',
                },
                userId
            )

            // Other user job
            const otherUserId = 'other-user'
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )

            const now = new Date().toISOString()
            db.prepare(
                `INSERT INTO jobs (id, user_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run('job-other', otherUserId, 'serpapi', 'other_job', 'Other', 'new', now, now, now)

            // Act
            const result = repository.findAll(userId)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('My Job')
        })

        it('should filter by profileId per user', () => {
            // Arrange
            // Create another profile for same user
            db.prepare(
                `INSERT INTO search_profiles (id, user_id, name, keywords, location) VALUES (?, ?, ?, ?, ?)`
            ).run('profile-2', userId, 'P2', 'k', 'l')

            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'j1',
                    title: 'J1',
                },
                userId
            )

            repository.create(
                {
                    profile_id: 'profile-2',
                    provider: 'serpapi',
                    provider_job_id: 'j2',
                    title: 'J2',
                },
                userId
            )

            // Act
            const result = repository.findAll(userId, {profileId: 'test-profile'})

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('J1')
        })
    })

    // ============================================
    // updateStatus
    // ============================================
    describe('updateStatus', () => {
        it('should update job status', () => {
            const job = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'serp_status',
                    title: 'Status Test',
                },
                userId
            )

            const updated = repository.updateStatus(job.id, 'applied')
            expect(updated?.status).toBe('applied')
        })

        // Note: updateStatus implements finding by ID only currently.
        // Ideally it should also verify ownership, but repository methods are usually trusting caller or checking logic in service layer.
        // However, standard crud often ignores userId for simple ID lookups unless enforced.
        // The current implementation of updateStatus finds by ID.
    })

    // ============================================
    // updateDescription
    // ============================================
    describe('updateDescription', () => {
        it('should update job description', () => {
            const job = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'desc_test',
                    title: 'Desc Test',
                },
                userId
            )

            const updated = repository.updateDescription(job.id, 'New Desc')
            expect(updated?.description).toBe('New Desc')
        })
    })

    // ============================================
    // delete
    // ============================================
    describe('delete', () => {
        it('should delete existing job', () => {
            const job = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'serp_delete',
                    title: 'Delete Me',
                },
                userId
            )

            const result = repository.delete(job.id)
            expect(result).toBe(true)
            expect(repository.findById(job.id)).toBeNull()
        })
    })

    // ============================================
    // deleteAll
    // ============================================
    describe('deleteAll', () => {
        it('should delete all jobs for user but NOT others', () => {
            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'j1',
                    title: 'Job 1',
                },
                userId
            )

            // Other user job
            const otherUserId = 'other-user'
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )
            const now = new Date().toISOString()
            db.prepare(
                `INSERT INTO jobs (id, user_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run('job-other', otherUserId, 'serpapi', 'other_job', 'Other', 'new', now, now, now)

            const deleted = repository.deleteAll(userId)

            expect(deleted).toBe(1)
            expect(repository.findAll(userId)).toHaveLength(0)

            // Check other user job still exists
            const stmt = db.prepare('SELECT count(*) as count FROM jobs WHERE user_id = ?')
            const row = stmt.get(otherUserId) as {count: number}
            expect(row.count).toBe(1)
        })
    })

    // ============================================
    // countByStatus
    // ============================================
    describe('countByStatus', () => {
        it('should return correct counts per status for user', () => {
            // Job 1 (new)
            repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'j1',
                    title: 'J1',
                },
                userId
            )

            // Job 2 (applied)
            const j2 = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'j2',
                    title: 'J2',
                },
                userId
            )
            repository.updateStatus(j2.id, 'applied')

            // Other user job (should not count)
            const otherUserId = 'other-user'
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )
            const now = new Date().toISOString()
            db.prepare(
                `INSERT INTO jobs (id, user_id, provider, provider_job_id, title, status, fetched_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run('job-other', otherUserId, 'serpapi', 'other_job', 'Other', 'new', now, now, now)

            const counts = repository.countByStatus(userId)

            expect(counts.new).toBe(1)
            expect(counts.applied).toBe(1)
            expect(counts.total).toBe(2)
        })
    })

    // ============================================
    // findAllWithAnalysis
    // ============================================
    describe('findAllWithAnalysis', () => {
        it('should return jobs with analysis data for user', () => {
            const job = repository.create(
                {
                    profile_id: 'test-profile',
                    provider: 'serpapi',
                    provider_job_id: 'analysis_job',
                    title: 'Analysis Test',
                },
                userId
            )

            const now = new Date().toISOString()
            db.prepare(
                `
        INSERT INTO ai_analyses (id, job_id, match_score, recommendation, strengths, gaps, reasoning, analyzed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
            ).run('analysis-1', job.id, 85, 'APPLY', '[]', '[]', 'Good', now)

            const result = repository.findAllWithAnalysis(userId)

            expect(result).toHaveLength(1)
            expect(result[0].analysis).toBeDefined()
            expect(result[0].analysis?.match_score).toBe(85)
        })
    })
})
