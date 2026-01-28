/**
 * Settings API Integration Tests
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedSettings} from '../helpers/database'
import {fixtures} from '../helpers/fixtures'

describe('Settings API Integration', () => {
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

    it('GET /api/settings should return settings map', async () => {
        seedSettings(server.db, 'test-user-id', '')
        const response = await request(server.app).get('/api/settings').expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.settings).toHaveProperty('cv_content')
    })

    it('GET /api/settings/cv should return empty when not set', async () => {
        const response = await request(server.app).get('/api/settings/cv').expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.cv_content).toBe('')
        expect(response.body.data.has_cv).toBe(false)
    })

    it('POST /api/settings/cv should validate input', async () => {
        const response = await request(server.app).post('/api/settings/cv').send({}).expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('CV content is required')
    })

    it('POST /api/settings/cv should update CV', async () => {
        const response = await request(server.app)
            .post('/api/settings/cv')
            .send({content: fixtures.settings.cv_content})
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.length).toBe(fixtures.settings.cv_content.length)
    })

    it('DELETE /api/settings/cv should clear CV', async () => {
        seedSettings(server.db, 'test-user-id', fixtures.settings.cv_content)

        const response = await request(server.app).delete('/api/settings/cv').expect(200)

        expect(response.body.success).toBe(true)

        const getResponse = await request(server.app).get('/api/settings/cv')
        expect(getResponse.body.data.cv_content).toBe('')
        expect(getResponse.body.data.has_cv).toBe(false)
    })

    // ============================================
    // AI Analysis Method
    // ============================================
    describe('AI Analysis Method', () => {
        it('GET /api/settings/ai-method should return default method', async () => {
            const response = await request(server.app).get('/api/settings/ai-method').expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.method).toBe('api')
        })

        it('PUT /api/settings/ai-method should update to "local"', async () => {
            const response = await request(server.app)
                .put('/api/settings/ai-method')
                .send({method: 'local'})
                .expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.method).toBe('local')

            // Verify persistence
            const getResponse = await request(server.app).get('/api/settings/ai-method')
            expect(getResponse.body.data.method).toBe('local')
        })

        it('PUT /api/settings/ai-method should update to "api"', async () => {
            // First set to local
            await request(server.app).put('/api/settings/ai-method').send({method: 'local'})

            // Then update to api
            const response = await request(server.app)
                .put('/api/settings/ai-method')
                .send({method: 'api'})
                .expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.method).toBe('api')
        })

        it('PUT /api/settings/ai-method should reject invalid method', async () => {
            const response = await request(server.app)
                .put('/api/settings/ai-method')
                .send({method: 'invalid'})
                .expect(400)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('Invalid method')
        })

        it('PUT /api/settings/ai-method should reject empty method', async () => {
            const response = await request(server.app)
                .put('/api/settings/ai-method')
                .send({})
                .expect(400)

            expect(response.body.success).toBe(false)
        })
    })

    // ============================================
    // API Status
    // ============================================
    describe('API Status', () => {
        it('GET /api/settings/api-status should return API configuration status', async () => {
            const response = await request(server.app).get('/api/settings/api-status').expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.status).toHaveProperty('serpapi')
            expect(response.body.data.status).toHaveProperty('gemini')
        })

        it('GET /api/settings/api-status should return correct structure for SerpAPI', async () => {
            const response = await request(server.app).get('/api/settings/api-status').expect(200)

            const {serpapi} = response.body.data.status
            expect(serpapi).toHaveProperty('configured')
            expect(serpapi).toHaveProperty('name')
            expect(serpapi).toHaveProperty('description')
            expect(typeof serpapi.configured).toBe('boolean')
            expect(serpapi.name).toBe('SerpAPI')
            expect(serpapi.description).toBe('Job search API')
        })

        it('GET /api/settings/api-status should return correct structure for Gemini', async () => {
            const response = await request(server.app).get('/api/settings/api-status').expect(200)

            const {gemini} = response.body.data.status
            expect(gemini).toHaveProperty('configured')
            expect(gemini).toHaveProperty('name')
            expect(gemini).toHaveProperty('description')
            expect(typeof gemini.configured).toBe('boolean')
            expect(gemini.name).toBe('Google Gemini')
            expect(gemini.description).toBe('AI job analysis')
        })

        it('GET /api/settings/api-status should report configured status based on environment', async () => {
            const response = await request(server.app).get('/api/settings/api-status').expect(200)

            const {serpapi, gemini} = response.body.data.status

            // In test environment, API keys should be configured (from .env or test setup)
            // This test validates the endpoint returns boolean values
            expect(typeof serpapi.configured).toBe('boolean')
            expect(typeof gemini.configured).toBe('boolean')
        })
    })
})
