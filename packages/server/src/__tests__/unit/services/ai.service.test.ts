/**
 * AIService Unit Tests
 *
 * Tests for AI-powered job analysis using Google Gemini API and CLI
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'

// Hoist mocks to fix initialization order
const execAsync = vi.hoisted(() => vi.fn())
const generateContent = vi.hoisted(() => vi.fn())
const env = vi.hoisted(() => ({GEMINI_API_KEY: 'test-key'}))

// Mock child_process for CLI tests
vi.mock('child_process', () => ({
    exec: vi.fn(),
}))
vi.mock('util', () => ({
    promisify: () => execAsync,
}))

vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        models = {generateContent}
    },
}))

vi.mock('../../../config/environment.config', () => ({env}))

import {AIService} from '../../../services/ai.service'
import {AnalysisRepository} from '../../../repositories/analysis.repository'
import {JobRepository} from '../../../repositories/job.repository'
import {SettingsRepository} from '../../../repositories/settings.repository'
import {fixtures} from '../../helpers/fixtures'
import type {AIAnalysis, Job} from '@yshvydak-job-screener/shared'

describe('AIService', () => {
    const analysisRepository = {
        findByJobId: vi.fn(),
        create: vi.fn(),
        getStats: vi.fn(),
    } as unknown as AnalysisRepository

    const jobRepository = {
        findById: vi.fn(),
    } as unknown as JobRepository

    const settingsRepository = {
        getAIAnalysisMethod: vi.fn().mockReturnValue('api'),
    } as unknown as SettingsRepository

    let service: AIService

    const job: Job = {
        id: 'job-1',
        profile_id: 'profile-1',
        provider: 'serpapi',
        provider_job_id: 'serp_1',
        serpapi_job_id: 'serp_1',
        title: 'Senior Engineer',
        company: 'Test Co',
        location: 'Remote',
        description: 'Build things',
        apply_link: 'https://example.com/apply',
        posted_date: '1 day ago',
        source: 'LinkedIn',
        status: 'new',
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    const existingAnalysis: AIAnalysis = {
        id: 'analysis-1',
        job_id: 'job-1',
        match_score: 80,
        recommendation: 'APPLY',
        strengths: JSON.stringify(['TypeScript']),
        gaps: JSON.stringify(['Go']),
        reasoning: 'Good fit',
        analyzed_at: new Date().toISOString(),
    }

    beforeEach(() => {
        vi.resetAllMocks()
        env.GEMINI_API_KEY = 'test-key'
        settingsRepository.getAIAnalysisMethod = vi.fn().mockReturnValue('api')
        service = new AIService(analysisRepository, jobRepository, settingsRepository)
    })

    // ============================================
    // API Method Tests
    // ============================================
    describe('API method', () => {
        it('should throw when API key is missing', async () => {
            env.GEMINI_API_KEY = ''
            service = new AIService(analysisRepository, jobRepository, settingsRepository)

            await expect(service.analyzeJob('job-1', fixtures.settings.cv_content)).rejects.toThrow(
                'GEMINI_API_KEY is not configured'
            )
        })

        it('should throw when job is not found', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(null)

            await expect(
                service.analyzeJob('missing-job', fixtures.settings.cv_content)
            ).rejects.toThrow('Job not found')
        })

        it('should return existing analysis without calling Gemini', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(existingAnalysis)

            const result = await service.analyzeJob(job.id, fixtures.settings.cv_content)

            expect(result).toBe(existingAnalysis)
            expect(generateContent).not.toHaveBeenCalled()
            expect(analysisRepository.create).not.toHaveBeenCalled()
        })

        it('should generate and save analysis when not cached', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            generateContent.mockResolvedValue({
                text: JSON.stringify(fixtures.geminiAnalysisResponse),
            })

            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            const result = await service.analyzeJob(job.id, fixtures.settings.cv_content)

            expect(analysisRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    job_id: job.id,
                    match_score: fixtures.geminiAnalysisResponse.match_score,
                    recommendation: fixtures.geminiAnalysisResponse.recommendation,
                    strengths: fixtures.geminiAnalysisResponse.strengths,
                    gaps: fixtures.geminiAnalysisResponse.gaps,
                    reasoning: fixtures.geminiAnalysisResponse.reasoning,
                })
            )
            expect(result).toBe(existingAnalysis)
        })

        it('should fall back to safe defaults on malformed Gemini response', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            generateContent.mockResolvedValue({text: fixtures.invalid.malformedJson})

            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            await service.analyzeJob(job.id, fixtures.settings.cv_content)

            expect(analysisRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    match_score: 0,
                    recommendation: 'SKIP',
                    strengths: [],
                    gaps: ['Unable to analyze job description'],
                    reasoning: 'AI analysis failed to parse. Please try again.',
                })
            )
        })
    })

    // ============================================
    // CLI Method Tests
    // ============================================
    describe('CLI method', () => {
        beforeEach(() => {
            settingsRepository.getAIAnalysisMethod = vi.fn().mockReturnValue('local')
            // Mock CLI availability check
            execAsync.mockResolvedValueOnce({stdout: '/usr/local/bin/gemini'})
            service = new AIService(analysisRepository, jobRepository, settingsRepository)
        })

        it('should throw when CLI is not available', async () => {
            execAsync.mockReset()
            execAsync.mockRejectedValueOnce(new Error('command not found'))
            service = new AIService(analysisRepository, jobRepository, settingsRepository)

            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            await expect(
                service.analyzeJob(job.id, fixtures.settings.cv_content, 'local')
            ).rejects.toThrow('Gemini CLI is not installed')
        })

        it('should parse CLI wrapper response correctly', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            execAsync.mockResolvedValueOnce({
                stdout: JSON.stringify(fixtures.geminiCliResponse.wrapper),
            })

            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            const result = await service.analyzeJob(job.id, fixtures.settings.cv_content, 'local')

            expect(analysisRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    job_id: job.id,
                    match_score: 85,
                    recommendation: 'APPLY',
                })
            )
            expect(result).toBe(existingAnalysis)
        })

        it('should handle CLI output with warnings', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            execAsync.mockResolvedValueOnce({
                stdout: fixtures.geminiCliResponse.withWarnings,
            })

            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            const result = await service.analyzeJob(job.id, fixtures.settings.cv_content, 'local')

            expect(analysisRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    match_score: 75,
                    recommendation: 'APPLY',
                })
            )
            expect(result).toBe(existingAnalysis)
        })

        it('should handle CLI timeout', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            execAsync.mockRejectedValueOnce({killed: true, message: 'timeout'})

            await expect(
                service.analyzeJob(job.id, fixtures.settings.cv_content, 'local')
            ).rejects.toThrow('Gemini CLI timed out')
        })
    })

    // ============================================
    // Method Selection Tests
    // ============================================
    describe('method selection', () => {
        it('should use API method when explicitly specified', async () => {
            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            generateContent.mockResolvedValue({
                text: JSON.stringify(fixtures.geminiAnalysisResponse),
            })
            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            await service.analyzeJob(job.id, fixtures.settings.cv_content, 'api')

            expect(generateContent).toHaveBeenCalled()
        })

        it('should use default method from settings when not specified', async () => {
            settingsRepository.getAIAnalysisMethod = vi.fn().mockReturnValue('api')
            service = new AIService(analysisRepository, jobRepository, settingsRepository)

            jobRepository.findById = vi.fn().mockReturnValue(job)
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            generateContent.mockResolvedValue({
                text: JSON.stringify(fixtures.geminiAnalysisResponse),
            })
            analysisRepository.create = vi.fn().mockReturnValue(existingAnalysis)

            await service.analyzeJob(job.id, fixtures.settings.cv_content)

            expect(settingsRepository.getAIAnalysisMethod).toHaveBeenCalled()
            expect(generateContent).toHaveBeenCalled()
        })

        it('should pass method to batch analysis', async () => {
            const spy = vi.spyOn(service, 'analyzeJob')
            spy.mockResolvedValue(existingAnalysis)

            await service.analyzeJobs(['job-1', 'job-2'], fixtures.settings.cv_content, 'api')

            expect(spy).toHaveBeenCalledWith('job-1', fixtures.settings.cv_content, 'api')
            expect(spy).toHaveBeenCalledWith('job-2', fixtures.settings.cv_content, 'api')
        })
    })

    // ============================================
    // Utility Tests
    // ============================================
    describe('utilities', () => {
        it('should parse analysis arrays in getAnalysis', () => {
            analysisRepository.findByJobId = vi.fn().mockReturnValue(existingAnalysis)

            const result = service.getAnalysis(job.id)

            expect(result?.strengths).toEqual(['TypeScript'])
            expect(result?.gaps).toEqual(['Go'])
        })

        it('should return null when no analysis exists', () => {
            analysisRepository.findByJobId = vi.fn().mockReturnValue(null)

            const result = service.getAnalysis('nonexistent')

            expect(result).toBeNull()
        })

        it('should return stats from repository', () => {
            analysisRepository.getStats = vi.fn().mockReturnValue({
                total: 2,
                avgScore: 70,
                byRecommendation: {APPLY: 1, MAYBE: 1, SKIP: 0},
            })

            const result = service.getStats()

            expect(result.total).toBe(2)
        })

        it('should return only successful analyses in batch', async () => {
            const spy = vi.spyOn(service, 'analyzeJob')
            spy.mockResolvedValueOnce(existingAnalysis).mockRejectedValueOnce(new Error('Failed'))

            const result = await service.analyzeJobs(
                ['job-1', 'job-2'],
                fixtures.settings.cv_content
            )

            expect(result).toHaveLength(1)
        })

        it('should check CLI availability', async () => {
            execAsync.mockResolvedValueOnce({stdout: '/usr/local/bin/gemini'})
            service = new AIService(analysisRepository, jobRepository, settingsRepository)

            const available = await service.isCliAvailable()

            expect(available).toBe(true)
        })

        it('should cache CLI availability check', async () => {
            execAsync.mockResolvedValueOnce({stdout: '/usr/local/bin/gemini'})
            service = new AIService(analysisRepository, jobRepository, settingsRepository)

            await service.isCliAvailable()
            await service.isCliAvailable()

            // Should only call exec once due to caching
            expect(execAsync).toHaveBeenCalledTimes(1)
        })
    })
})
