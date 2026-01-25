/**
 * Profiles API Integration Tests
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedProfile} from '../helpers/database'
import {fixtures} from '../helpers/fixtures'

describe('Profiles API Integration', () => {
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

    it('GET /api/profiles should return empty list', async () => {
        const response = await request(server.app).get('/api/profiles').expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profiles).toEqual([])
    })

    it('POST /api/profiles should create profile', async () => {
        const payload = {
            name: fixtures.profile.name,
            keywords: fixtures.profile.keywords,
            location: fixtures.profile.location,
            date_posted: fixtures.profile.date_posted,
            radius: fixtures.profile.radius,
        }

        const response = await request(server.app).post('/api/profiles').send(payload).expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profile.name).toBe(payload.name)
    })

    it('POST /api/profiles should reject profile without date_posted', async () => {
        const payload = {
            name: fixtures.profile.name,
            keywords: fixtures.profile.keywords,
            location: fixtures.profile.location,
            // date_posted is missing
            radius: fixtures.profile.radius,
        }

        const response = await request(server.app).post('/api/profiles').send(payload).expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Date posted is required')
    })

    it('GET /api/profiles/:id should return profile', async () => {
        const created = seedProfile(server.db)

        const response = await request(server.app).get(`/api/profiles/${created.id}`).expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profile.id).toBe(created.id)
    })

    it('GET /api/profiles/:id should return 404 when missing', async () => {
        const response = await request(server.app).get('/api/profiles/missing-id').expect(404)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Profile not found')
    })

    it('GET /api/profiles/active should return only active profiles', async () => {
        seedProfile(server.db, fixtures.profile)
        seedProfile(server.db, fixtures.profileInactive)

        const response = await request(server.app).get('/api/profiles/active').expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profiles).toHaveLength(1)
        expect(response.body.data.profiles[0].id).toBe(fixtures.profile.id)
    })

    it('PUT /api/profiles/:id should update profile', async () => {
        const created = seedProfile(server.db)

        const response = await request(server.app)
            .put(`/api/profiles/${created.id}`)
            .send({name: 'Updated Profile'})
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profile.name).toBe('Updated Profile')
    })

    it('PUT /api/profiles/:id should handle update without date_posted (uses existing or default)', async () => {
        const created = seedProfile(server.db)

        const response = await request(server.app)
            .put(`/api/profiles/${created.id}`)
            .send({name: 'Updated Without Date'})
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profile.name).toBe('Updated Without Date')
        // Should preserve existing date_posted or use default
        expect(response.body.data.profile.date_posted).toBeDefined()
    })

    it('PATCH /api/profiles/:id/toggle should toggle active status', async () => {
        const created = seedProfile(server.db)

        const response = await request(server.app)
            .patch(`/api/profiles/${created.id}/toggle`)
            .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data.profile.active).toBe(0)
    })

    it('DELETE /api/profiles/:id should delete profile', async () => {
        const created = seedProfile(server.db)

        const response = await request(server.app).delete(`/api/profiles/${created.id}`).expect(200)

        expect(response.body.success).toBe(true)

        const getResponse = await request(server.app).get(`/api/profiles/${created.id}`)
        expect(getResponse.status).toBe(404)
    })
})
