/**
 * Jobs API Integration Tests
 *
 * Tests full HTTP request/response cycle for /api/jobs endpoints
 * Uses Supertest for HTTP assertions and isolated test database
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedProfile, seedJob, seedAnalysis} from '../helpers/database'
import {fixtures} from '../helpers/fixtures'

describe('Jobs API Integration', () => {
    let server: TestServerInstance

    beforeAll(async () => {
        server = await setupTestServer()
    })

    afterAll(async () => {
        await teardownTestServer(server)
    })

    beforeEach(() => {
        cleanTestDatabase(server)
    })

    // ============================================
    // GET /api/jobs - List all jobs
    // ============================================
    describe('GET /api/jobs', () => {
        it('should return empty array when no jobs exist', async () => {
            const response = await request(server.app).get('/api/jobs').expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.jobs).toEqual([])
        })

        it('should return all jobs without analysis by default', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Act
            const response = await request(server.app).get('/api/jobs').expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.jobs).toHaveLength(1)
            expect(response.body.data.jobs[0].title).toBe(fixtures.job.title)
            // Analysis not included by default
            expect(response.body.data.jobs[0].analysis).toBeUndefined()
        })

        it('should return jobs with analysis when includeAnalysis=true', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)
            seedAnalysis(server.db)

            // Act
            const response = await request(server.app)
                .get('/api/jobs?includeAnalysis=true')
                .expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.jobs).toHaveLength(1)
            expect(response.body.data.jobs[0].analysis).toBeDefined()
            expect(response.body.data.jobs[0].analysis.match_score).toBe(
                fixtures.analysis.match_score
            )
        })

        it('should filter jobs by status', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-1',
                serpapi_job_id: 'serp_1',
                status: 'new',
            })
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-2',
                serpapi_job_id: 'serp_2',
                status: 'applied',
            })

            // Act
            const response = await request(server.app).get('/api/jobs?status=applied').expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.jobs).toHaveLength(1)
            expect(response.body.data.jobs[0].status).toBe('applied')
        })

        it('should filter jobs by profileId', async () => {
            // Arrange
            seedProfile(server.db, {...fixtures.profile, id: 'profile-a'})
            seedProfile(server.db, {...fixtures.profile, id: 'profile-b', name: 'Profile B'})
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-a',
                serpapi_job_id: 'serp_a',
                profile_id: 'profile-a',
            })
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-b',
                serpapi_job_id: 'serp_b',
                profile_id: 'profile-b',
            })

            // Act
            const response = await request(server.app)
                .get('/api/jobs?profileId=profile-a')
                .expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.jobs).toHaveLength(1)
            expect(response.body.data.jobs[0].profile_id).toBe('profile-a')
        })
    })

    // ============================================
    // GET /api/jobs/:id - Get single job
    // ============================================
    describe('GET /api/jobs/:id', () => {
        it('should return job by id', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Act
            const response = await request(server.app)
                .get(`/api/jobs/${fixtures.job.id}`)
                .expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.job.id).toBe(fixtures.job.id)
            expect(response.body.data.job.title).toBe(fixtures.job.title)
        })

        it('should return 404 for non-existent job', async () => {
            const response = await request(server.app).get('/api/jobs/non-existent-id').expect(404)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('not found')
        })
    })

    // ============================================
    // PATCH /api/jobs/:id/status - Update job status
    // ============================================
    describe('PATCH /api/jobs/:id/status', () => {
        it('should update job status', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Act
            const response = await request(server.app)
                .patch(`/api/jobs/${fixtures.job.id}/status`)
                .send({status: 'applied'})
                .expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.job.status).toBe('applied')
        })

        it('should return 500 when job not found (error thrown by service)', async () => {
            // Note: Current implementation throws error which becomes 500
            // Ideally this should be 404, but testing actual behavior
            const response = await request(server.app)
                .patch('/api/jobs/non-existent-id/status')
                .send({status: 'applied'})
                .expect(500)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('not found')
        })

        it('should return 400 when status is missing', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Act
            const response = await request(server.app)
                .patch(`/api/jobs/${fixtures.job.id}/status`)
                .send({})
                .expect(400)

            // Assert
            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('required')
        })

        it('should return 500 for invalid status (error thrown by validation)', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Note: validateStatus throws error which becomes 500
            // Ideally this should be 400
            const response = await request(server.app)
                .patch(`/api/jobs/${fixtures.job.id}/status`)
                .send({status: 'invalid_status'})
                .expect(500)

            // Assert
            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('Invalid status')
        })
    })

    // ============================================
    // DELETE /api/jobs/:id - Delete job
    // ============================================
    describe('DELETE /api/jobs/:id', () => {
        it('should delete job', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)

            // Act
            const response = await request(server.app)
                .delete(`/api/jobs/${fixtures.job.id}`)
                .expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.message).toContain('deleted')

            // Verify job is deleted
            const getResponse = await request(server.app).get(`/api/jobs/${fixtures.job.id}`)
            expect(getResponse.status).toBe(404)
        })

        it('should return 500 when job not found (error thrown by service)', async () => {
            // Note: Current implementation throws error which becomes 500
            const response = await request(server.app)
                .delete('/api/jobs/non-existent-id')
                .expect(500)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('not found')
        })

        it('should cascade delete analysis when job is deleted', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db)
            seedAnalysis(server.db)

            // Verify analysis exists
            const analysisBefore = server.db
                .prepare('SELECT * FROM ai_analyses WHERE job_id = ?')
                .get(fixtures.job.id)
            expect(analysisBefore).toBeDefined()

            // Act
            await request(server.app).delete(`/api/jobs/${fixtures.job.id}`).expect(200)

            // Assert - analysis should be deleted too (CASCADE)
            const analysisAfter = server.db
                .prepare('SELECT * FROM ai_analyses WHERE job_id = ?')
                .get(fixtures.job.id)
            expect(analysisAfter).toBeUndefined()
        })
    })

    // ============================================
    // DELETE /api/jobs - Delete all jobs
    // ============================================
    describe('DELETE /api/jobs', () => {
        it('should delete all jobs and analyses', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db, {...fixtures.job, id: 'job-1', serpapi_job_id: 'serp_1'})
            seedJob(server.db, {...fixtures.job, id: 'job-2', serpapi_job_id: 'serp_2'})
            seedAnalysis(server.db, {...fixtures.analysis, job_id: 'job-1'})
            seedAnalysis(server.db, {
                ...fixtures.analysisLowScore,
                job_id: 'job-2',
                id: 'analysis-2',
            })

            // Act
            const response = await request(server.app).delete('/api/jobs').expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.deletedCount).toBe(2)

            const jobs = await request(server.app).get('/api/jobs').expect(200)
            expect(jobs.body.data.jobs).toHaveLength(0)

            const analyses = server.db.prepare('SELECT * FROM ai_analyses').all()
            expect(analyses).toHaveLength(0)
        })

        it('should return 0 when no jobs exist', async () => {
            // Act
            const response = await request(server.app).delete('/api/jobs').expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.deletedCount).toBe(0)
        })
    })

    // ============================================
    // GET /api/jobs/stats - Job statistics
    // ============================================
    describe('GET /api/jobs/stats', () => {
        it('should return job counts by status', async () => {
            // Arrange
            seedProfile(server.db)
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-1',
                serpapi_job_id: 'serp_1',
                status: 'new',
            })
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-2',
                serpapi_job_id: 'serp_2',
                status: 'new',
            })
            seedJob(server.db, {
                ...fixtures.job,
                id: 'job-3',
                serpapi_job_id: 'serp_3',
                status: 'applied',
            })

            // Act
            const response = await request(server.app).get('/api/jobs/stats').expect(200)

            // Assert
            expect(response.body.success).toBe(true)
            expect(response.body.data.stats.new).toBe(2)
            expect(response.body.data.stats.applied).toBe(1)
            expect(response.body.data.stats.total).toBe(3)
        })

        it('should return zeros when no jobs exist', async () => {
            const response = await request(server.app).get('/api/jobs/stats').expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.stats.total).toBe(0)
        })
    })
})
