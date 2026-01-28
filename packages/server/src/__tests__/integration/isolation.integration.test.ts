/**
 * Data Isolation Integration Tests
 * Ensures users cannot access or modify each other's data
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'
import {seedProfile, seedJob} from '../helpers/database'

describe('Data Isolation Integration', () => {
    let server: TestServerInstance
    let tokenA: string
    let tokenB: string
    let userIdA: string
    let userIdB: string

    beforeAll(async () => {
        server = await setupTestServer({useRealAuth: true})
    })

    afterAll(async () => {
        await teardownTestServer(server)
    })

    beforeEach(async () => {
        cleanTestDatabase(server)

        // Register User A
        const regA = await request(server.app)
            .post('/api/auth/register')
            .send({email: 'userA@example.com', password: 'password123'})
        tokenA = regA.body.data.token
        userIdA = regA.body.data.user.id

        // Register User B
        const regB = await request(server.app)
            .post('/api/auth/register')
            .send({email: 'userB@example.com', password: 'password123'})
        tokenB = regB.body.data.token
        userIdB = regB.body.data.user.id
    })

    describe('Search Profiles Isolation', () => {
        it('should only return own profiles', async () => {
            // Seed a profile for User A
            seedProfile(server.db, {id: 'profile-A', user_id: userIdA, name: 'Profile A'})
            // Seed a profile for User B
            seedProfile(server.db, {id: 'profile-B', user_id: userIdB, name: 'Profile B'})

            // Call as User A
            const resA = await request(server.app)
                .get('/api/profiles')
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200)

            expect(resA.body.data.profiles).toHaveLength(1)
            expect(resA.body.data.profiles[0].name).toBe('Profile A')

            // Call as User B
            const resB = await request(server.app)
                .get('/api/profiles')
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200)

            expect(resB.body.data.profiles).toHaveLength(1)
            expect(resB.body.data.profiles[0].name).toBe('Profile B')
        })

        it('should prevent access to other user profile details', async () => {
            const profileA = seedProfile(server.db, {
                id: 'profile-A',
                user_id: userIdA,
                name: 'Profile A',
            })

            // Call as User B to get Profile A
            const response = await request(server.app)
                .get(`/api/profiles/${profileA.id}`)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404) // Should return 404 since it's not found in User B's profiles

            expect(response.body.success).toBe(false)
        })
    })

    describe('Jobs Isolation', () => {
        it('should only return own jobs', async () => {
            const profileA = seedProfile(server.db, {id: 'profile-A', user_id: userIdA})
            const profileB = seedProfile(server.db, {id: 'profile-B', user_id: userIdB})

            seedJob(server.db, {
                id: 'job-A',
                user_id: userIdA,
                profile_id: profileA.id,
                title: 'Job A',
            })
            seedJob(server.db, {
                id: 'job-B',
                user_id: userIdB,
                profile_id: profileB.id,
                title: 'Job B',
            })

            // User A request
            const resA = await request(server.app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200)
            expect(resA.body.data.jobs).toHaveLength(1)
            expect(resA.body.data.jobs[0].title).toBe('Job A')

            // User B request
            const resB = await request(server.app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200)
            expect(resB.body.data.jobs).toHaveLength(1)
            expect(resB.body.data.jobs[0].title).toBe('Job B')
        })

        it('should prevent updating other user job status', async () => {
            const profileA = seedProfile(server.db, {id: 'profile-A', user_id: userIdA})
            const jobA = seedJob(server.db, {
                id: 'job-A',
                user_id: userIdA,
                profile_id: profileA.id,
            })

            // User B tries to update User A's job
            await request(server.app)
                .patch(`/api/jobs/${jobA.id}/status`)
                .send({status: 'saved'})
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404)
        })

        it('should prevent deleting other user job', async () => {
            const profileA = seedProfile(server.db, {id: 'profile-A', user_id: userIdA})
            const jobA = seedJob(server.db, {
                id: 'job-A',
                user_id: userIdA,
                profile_id: profileA.id,
            })

            // User B tries to delete User A's job
            await request(server.app)
                .delete(`/api/jobs/${jobA.id}`)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404)

            // Verify job A still exists in DB
            const stmt = server.db.prepare('SELECT id FROM jobs WHERE id = ?')
            expect(stmt.get(jobA.id)).toBeDefined()
        })
    })

    describe('Settings Isolation', () => {
        it('should isolate CV content between users', async () => {
            // Set CV for User A
            await request(server.app)
                .post('/api/settings/cv')
                .send({content: 'CV content A'})
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200)

            // Call as User B
            const resB = await request(server.app)
                .get('/api/settings/cv')
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200)

            expect(resB.body.data.cv_content).toBe('') // User B should have empty CV
        })
    })
})
