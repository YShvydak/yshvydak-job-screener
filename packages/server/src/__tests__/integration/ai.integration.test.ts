/**
 * AI API Integration Tests
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach, vi} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedProfile, seedJob, seedAnalysis, seedSettings} from '../helpers/database'
import {fixtures} from '../helpers/fixtures'

describe('AI API Integration', () => {
    let server: TestServerInstance

    beforeAll(async () => {
        server = await setupTestServer()
    })

    afterAll(async () => {
        await teardownTestServer(server)
    })

    beforeEach(() => {
        cleanTestDatabase(server)
        vi.restoreAllMocks()
    })

    it('POST /api/ai/analyze/:jobId should require CV', async () => {
        const response = await request(server.app).post('/api/ai/analyze/test-job').expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('CV content is not configured')
    })

    it('POST /api/ai/analyze/:jobId should return analysis', async () => {
        seedSettings(server.db, 'test-user-id', fixtures.settings.cv_content)

        const analysis = {
            id: fixtures.analysis.id,
            job_id: fixtures.analysis.job_id,
            match_score: fixtures.analysis.match_score,
            recommendation: fixtures.analysis.recommendation as 'APPLY' | 'MAYBE' | 'SKIP',
            strengths: fixtures.analysis.strengths,
            gaps: fixtures.analysis.gaps,
            reasoning: fixtures.analysis.reasoning,
            analyzed_at: new Date().toISOString(),
        }

        vi.spyOn(server.services.ai, 'analyzeJob').mockResolvedValue(analysis)

        const response = await request(server.app)
            .post(`/api/ai/analyze/${fixtures.job.id}`)
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.analysis.match_score).toBe(fixtures.analysis.match_score)
    })

    it('POST /api/ai/analyze-batch should validate jobIds', async () => {
        const response = await request(server.app)
            .post('/api/ai/analyze-batch')
            .send({})
            .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('jobIds array is required')
    })

    it('POST /api/ai/analyze-batch should return analyses', async () => {
        seedSettings(server.db, 'test-user-id', fixtures.settings.cv_content)

        vi.spyOn(server.services.ai, 'analyzeJobs').mockResolvedValue([])

        const response = await request(server.app)
            .post('/api/ai/analyze-batch')
            .send({jobIds: ['job-1', 'job-2']})
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.total).toBe(2)
        expect(response.body.data.analyzed).toBe(0)
    })

    it('GET /api/ai/analysis/:jobId should return analysis when exists', async () => {
        seedProfile(server.db)
        seedJob(server.db)
        seedAnalysis(server.db)

        const response = await request(server.app)
            .get(`/api/ai/analysis/${fixtures.job.id}`)
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.analysis.match_score).toBe(fixtures.analysis.match_score)
        expect(response.body.data.analysis.strengths).toEqual(
            JSON.parse(fixtures.analysis.strengths)
        )
    })

    it('GET /api/ai/analysis/:jobId should return 404 when missing', async () => {
        const response = await request(server.app).get('/api/ai/analysis/missing-job').expect(404)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Analysis not found')
    })

    it('GET /api/ai/stats should return stats', async () => {
        seedProfile(server.db)
        seedJob(server.db)
        seedAnalysis(server.db)

        const response = await request(server.app).get('/api/ai/stats').expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.stats.total).toBe(1)
    })
})
