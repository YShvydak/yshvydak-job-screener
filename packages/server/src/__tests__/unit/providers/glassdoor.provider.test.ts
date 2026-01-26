/**
 * Glassdoor Provider Unit Tests
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'
import {GlassdoorProvider} from '../../../providers/glassdoor.provider'

// Mock fetch
global.fetch = vi.fn()

// Mock environment config
vi.mock('../../../config/environment.config', () => ({
    env: {
        GLASSDOOR_KEY: 'test_glassdoor_key',
        NODE_ENV: 'test',
    },
}))

describe('GlassdoorProvider', () => {
    let provider: GlassdoorProvider

    beforeEach(() => {
        provider = new GlassdoorProvider({apiKey: 'test_glassdoor_key'})
        vi.clearAllMocks()
    })

    describe('Basic Properties', () => {
        it('should have correct name and displayName', () => {
            expect(provider.name).toBe('glassdoor')
            expect(provider.displayName).toBe('Glassdoor')
        })

        it('should be available when API key is configured', () => {
            expect(provider.isAvailable()).toBe(true)
        })

        it('should return supported fields', () => {
            const fields = provider.getSupportedFields()
            expect(fields).toContain('keywords')
            expect(fields).toContain('location')
        })
    })

    describe('testConnection', () => {
        it('should successfully test connection', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'OK', data: {jobs: []}}),
            } as Response)

            const result = await provider.testConnection()

            expect(result.ok).toBe(true)
            expect(result.responseTime).toBeGreaterThanOrEqual(0)
        })

        it('should handle connection errors', async () => {
            vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

            const result = await provider.testConnection()

            expect(result.ok).toBe(false)
            expect(result.error).toContain('Network error')
        })

        it('should handle API errors', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'ERROR', message: 'Invalid API key'}),
            } as Response)

            const result = await provider.testConnection()

            expect(result.ok).toBe(false)
            expect(result.error).toContain('Invalid API key')
        })
    })

    describe('search', () => {
        it('should search with all parameters', async () => {
            const mockResponse = {
                status: 'OK',
                data: {
                    total_count: 1,
                    jobs: [
                        {
                            job_id: 123,
                            job_title: 'Senior Developer',
                            company_name: 'Tech Corp',
                            location_name: 'San Francisco, CA',
                            job_link: 'https://glassdoor.com/job/123',
                            age_in_days: 2,
                        },
                    ],
                },
            }

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await provider.search({
                keywords: 'senior developer',
                location: 'San Francisco, CA',
            })

            expect(result.jobs).toHaveLength(1)
            expect(result.provider).toBe('glassdoor')
            expect(result.jobs[0]).toMatchObject({
                provider_job_id: '123',
                title: 'Senior Developer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                apply_link: 'https://glassdoor.com/job/123',
                posted_date: '2 days ago',
            })
        })

        it('should search without location', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'OK', data: {jobs: []}}),
            } as Response)

            await provider.search({
                keywords: 'developer',
            })

            const fetchCall = vi.mocked(fetch).mock.calls[0]
            expect(fetchCall[0]).toContain('query=developer')
            expect(fetchCall[0]).not.toContain('location=')
        })

        it('should handle empty results', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'OK', data: {jobs: []}}),
            } as Response)

            const result = await provider.search({keywords: 'test'})

            expect(result.jobs).toEqual([])
        })

        it('should handle missing data field', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'OK'}),
            } as Response)

            const result = await provider.search({keywords: 'test'})

            expect(result.jobs).toEqual([])
        })

        it('should handle search errors', async () => {
            vi.mocked(fetch).mockRejectedValue(new Error('API Error'))

            await expect(provider.search({keywords: 'test'})).rejects.toThrow('API Error')
        })

        it('should handle API error status', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({status: 'ERROR', message: 'Invalid parameters'}),
            } as Response)

            await expect(provider.search({keywords: 'test'})).rejects.toThrow(
                'Glassdoor API error: Invalid parameters'
            )
        })

        it('should format age_in_days correctly', async () => {
            const mockResponse = {
                status: 'OK',
                data: {
                    jobs: [
                        {job_id: 1, job_title: 'Job 1', age_in_days: 0},
                        {job_id: 2, job_title: 'Job 2', age_in_days: 1},
                        {job_id: 3, job_title: 'Job 3', age_in_days: 5},
                        {job_id: 4, job_title: 'Job 4', age_in_days: 30},
                    ],
                },
            }

            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            } as Response)

            const result = await provider.search({keywords: 'test'})

            expect(result.jobs[0].posted_date).toBe('Today')
            expect(result.jobs[1].posted_date).toBe('1 day ago')
            expect(result.jobs[2].posted_date).toBe('5 days ago')
            expect(result.jobs[3].posted_date).toBe('1 month ago')
        })
    })
})
