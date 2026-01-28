/**
 * Auth API Integration Tests
 */

import {describe, it, expect, beforeAll, afterAll, beforeEach} from 'vitest'
import request from 'supertest'
import {
    setupTestServer,
    teardownTestServer,
    cleanTestDatabase,
    type TestServerInstance,
} from '../helpers/testServer'

describe('Auth API Integration', () => {
    let server: TestServerInstance

    // Use real auth middleware for this test suite
    beforeAll(async () => {
        server = await setupTestServer({useRealAuth: true})
    })

    afterAll(async () => {
        await teardownTestServer(server)
    })

    beforeEach(() => {
        cleanTestDatabase(server)
    })

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(server.app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123',
                })
                .expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.token).toBeDefined()
            expect(response.body.data.user.email).toBe('newuser@example.com')
            expect(response.body.data.user.password_hash).toBeUndefined()
        })

        it('should fail if email is invalid', async () => {
            const response = await request(server.app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                })
                .expect(400)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('Invalid email')
        })

        it('should fail if password is too short', async () => {
            const response = await request(server.app)
                .post('/api/auth/register')
                .send({
                    email: 'user@example.com',
                    password: '123',
                })
                .expect(400)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('Password')
        })

        it('should fail if user already exists', async () => {
            // Register first user
            await request(server.app).post('/api/auth/register').send({
                email: 'existing@example.com',
                password: 'password123',
            })

            // Try to register again
            const response = await request(server.app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                })
                .expect(400)

            expect(response.body.success).toBe(false)
            expect(response.body.error).toContain('already exists')
        })
    })

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Pre-register a user for login tests
            await request(server.app).post('/api/auth/register').send({
                email: 'login@example.com',
                password: 'password123',
            })
        })

        it('should login successfully with correct credentials', async () => {
            const response = await request(server.app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                })
                .expect(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.token).toBeDefined()
            expect(response.body.data.user.email).toBe('login@example.com')
        })

        it('should fail with incorrect password', async () => {
            const response = await request(server.app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                })
                .expect(401)

            expect(response.body.success).toBe(false)
        })

        it('should fail with non-existent email', async () => {
            const response = await request(server.app)
                .post('/api/auth/login')
                .send({
                    email: 'missing@example.com',
                    password: 'password123',
                })
                .expect(401)

            expect(response.body.success).toBe(false)
        })
    })

    describe('Protected Routes', () => {
        let token: string

        beforeEach(async () => {
            const authResponse = await request(server.app).post('/api/auth/register').send({
                email: 'auth@example.com',
                password: 'password123',
            })
            token = authResponse.body.data.token
        })

        it('should allow access with valid token', async () => {
            // Access a protected route (e.g., getting settings or profiles)
            // Using /api/settings as it's simple
            const response = await request(server.app)
                .get('/api/settings')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)

            expect(response.body.success).toBe(true)
        })

        it('should deny access without token', async () => {
            await request(server.app).get('/api/settings').expect(401)
        })

        it('should deny access with invalid token', async () => {
            await request(server.app)
                .get('/api/settings')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401)
        })
    })
})
