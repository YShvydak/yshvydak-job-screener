/**
 * SerpAPI Provider Unit Tests
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'
import {SerpAPIProvider} from '../../../providers/serpapi.provider'

// Mock serpapi
vi.mock('serpapi', () => ({
    getJson: vi.fn(),
    config: {api_key: ''},
}))

// Mock environment config
vi.mock('../../../config/environment.config', () => ({
    env: {
        SERPAPI_KEY: 'test_serpapi_key',
        NODE_ENV: 'test',
    },
}))

describe('SerpAPIProvider', () => {
    let provider: SerpAPIProvider

    beforeEach(() => {
        provider = new SerpAPIProvider({apiKey: 'test_serpapi_key'})
        vi.clearAllMocks()
    })

    describe('Basic Properties', () => {
        it('should have correct name and displayName', () => {
            expect(provider.name).toBe('serpapi')
            expect(provider.displayName).toBe('Google Jobs (SerpAPI)')
        })

        it('should be available when API key is configured', () => {
            expect(provider.isAvailable()).toBe(true)
        })

        it('should return supported fields', () => {
            const fields = provider.getSupportedFields()
            expect(fields).toContain('keywords')
            expect(fields).toContain('location')
            expect(fields).toContain('date_posted')
            expect(fields).toContain('radius')
        })
    })

    describe('testConnection', () => {
        it('should successfully test connection', async () => {
            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({jobs_results: []})

            const result = await provider.testConnection()

            expect(result.ok).toBe(true)
            expect(result.responseTime).toBeGreaterThanOrEqual(0)
            expect(vi.mocked(getJson)).toHaveBeenCalledWith({
                engine: 'google_jobs',
                q: 'test',
                hl: 'en',
                num: 1,
            })
        })

        it('should handle connection errors', async () => {
            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockRejectedValue(new Error('API Error'))

            const result = await provider.testConnection()

            expect(result.ok).toBe(false)
            expect(result.error).toContain('API Error')
        })
    })

    describe('search', () => {
        it('should search with all parameters', async () => {
            const {getJson} = await import('serpapi')
            const mockResponse = {
                jobs_results: [
                    {
                        job_id: 'job_123',
                        title: 'Software Engineer',
                        company_name: 'Test Corp',
                        location: 'New York, NY',
                        description: 'Test description',
                        apply_options: [{link: 'https://example.com/apply'}],
                        detected_extensions: {posted_at: '2 days ago'},
                        via: 'LinkedIn',
                    },
                ],
            }
            vi.mocked(getJson).mockResolvedValue(mockResponse)

            const result = await provider.search({
                keywords: 'software engineer',
                location: 'New York, NY',
                date_posted: 'week',
                radius: 50,
            })

            expect(result.jobs).toHaveLength(1)
            expect(result.provider).toBe('serpapi')
            expect(result.jobs[0]).toMatchObject({
                provider_job_id: 'job_123',
                title: 'Software Engineer',
                company: 'Test Corp',
                location: 'New York, NY',
            })

            expect(vi.mocked(getJson)).toHaveBeenCalledWith({
                engine: 'google_jobs',
                q: 'software engineer',
                hl: 'en',
                location: 'New York, NY',
                lrad: '31', // 50km ≈ 31 miles
                chips: 'date_posted:week',
            })
        })

        it('should search without optional parameters', async () => {
            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({jobs_results: []})

            await provider.search({
                keywords: 'developer',
            })

            expect(vi.mocked(getJson)).toHaveBeenCalledWith({
                engine: 'google_jobs',
                q: 'developer',
                hl: 'en',
            })
        })

        it('should handle empty results', async () => {
            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockResolvedValue({})

            const result = await provider.search({keywords: 'test'})

            expect(result.jobs).toEqual([])
        })

        it('should use share_link as fallback for job_id', async () => {
            const {getJson} = await import('serpapi')
            const mockResponse = {
                jobs_results: [
                    {
                        title: 'QA Engineer',
                        company_name: 'QA Corp',
                        share_link: 'https://example.com/jobs/qa-123',
                    },
                ],
            }
            vi.mocked(getJson).mockResolvedValue(mockResponse)

            const result = await provider.search({keywords: 'qa'})

            expect(result.jobs[0].provider_job_id).toBe('https://example.com/jobs/qa-123')
        })

        it('should handle search errors', async () => {
            const {getJson} = await import('serpapi')
            vi.mocked(getJson).mockRejectedValue(new Error('Search failed'))

            await expect(provider.search({keywords: 'test'})).rejects.toThrow('Search failed')
        })
    })
})
