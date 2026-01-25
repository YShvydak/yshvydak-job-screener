/**
 * Search API Integration Tests
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach, vi} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedProfile} from '../helpers/database'
import {fixtures} from '../helpers/fixtures'

describe('Search API Integration', () => {
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

    it('POST /api/search/run should validate profileId', async () => {
        const response = await request(server.app).post('/api/search/run').send({}).expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('profileId is required')
    })

    it('POST /api/search/run should return search results', async () => {
        seedProfile(server.db, fixtures.profile)

        const executeSpy = vi
            .spyOn(server.services.search, 'executeSearch')
            .mockResolvedValue({jobsFound: 2, newJobs: 1, analyzed: false})

        const response = await request(server.app)
            .post('/api/search/run')
            .send({profileId: fixtures.profile.id})
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.result.jobsFound).toBe(2)
        expect(executeSpy).toHaveBeenCalledWith(fixtures.profile.id)
    })

    it('POST /api/search/run should return error when service fails', async () => {
        seedProfile(server.db, fixtures.profile)

        vi.spyOn(server.services.search, 'executeSearch').mockRejectedValue(
            new Error('Search failed')
        )

        const response = await request(server.app)
            .post('/api/search/run')
            .send({profileId: fixtures.profile.id})
            .expect(500)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Search failed')
    })
})
