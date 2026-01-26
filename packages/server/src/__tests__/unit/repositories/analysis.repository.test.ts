/**
 * AnalysisRepository Unit Tests
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import {AnalysisRepository} from '../../../repositories/analysis.repository'
import {JobRepository} from '../../../repositories/job.repository'
import {fixtures} from '../../helpers/fixtures'

describe('AnalysisRepository', () => {
    let db: Database.Database
    let repository: AnalysisRepository
    let jobRepository: JobRepository

    beforeEach(() => {
        db = new Database(':memory:')

        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Create a test profile for foreign key constraint
        const now = new Date().toISOString()
        db.prepare(
            `
      INSERT INTO search_profiles (id, name, keywords, location, date_posted, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
        ).run('test-profile', 'Test Profile', 'test keywords', 'Test Location', 'week', 1, now, now)

        repository = new AnalysisRepository(db)
        jobRepository = new JobRepository(db)
    })

    afterEach(() => {
        db.close()
    })

    function createJob(providerJobId: string, title: string) {
        return jobRepository.create({
            profile_id: 'test-profile',
            provider: 'serpapi',
            provider_job_id: providerJobId,
            serpapi_job_id: providerJobId,
            title,
        })
    }

    describe('findByJobId', () => {
        it('should return null when analysis does not exist', () => {
            const result = repository.findByJobId('missing-job')
            expect(result).toBeNull()
        })

        it('should return analysis for job', () => {
            const job = createJob('serp_analysis_1', 'Analysis Job')

            repository.create({
                job_id: job.id,
                match_score: fixtures.analysis.match_score,
                recommendation: fixtures.analysis.recommendation as 'APPLY' | 'MAYBE' | 'SKIP',
                strengths: ['TypeScript'],
                gaps: ['Go'],
                reasoning: fixtures.analysis.reasoning,
            })

            const result = repository.findByJobId(job.id)
            expect(result).not.toBeNull()
            expect(result?.job_id).toBe(job.id)
            expect(result?.match_score).toBe(fixtures.analysis.match_score)
        })
    })

    describe('create', () => {
        it('should create analysis and stringify arrays', () => {
            const job = createJob('serp_analysis_2', 'Analysis Job 2')

            const result = repository.create({
                job_id: job.id,
                match_score: 90,
                recommendation: 'APPLY',
                strengths: ['TypeScript', 'React'],
                gaps: ['Go'],
                reasoning: 'Strong match',
            })

            expect(result.job_id).toBe(job.id)
            expect(result.match_score).toBe(90)
            expect(result.strengths).toBe(JSON.stringify(['TypeScript', 'React']))
            expect(result.gaps).toBe(JSON.stringify(['Go']))
        })
    })

    describe('hasAnalysis', () => {
        it('should return true when analysis exists', () => {
            const job = createJob('serp_analysis_3', 'Analysis Job 3')
            repository.create({
                job_id: job.id,
                match_score: 70,
                recommendation: 'MAYBE',
                strengths: ['Skill'],
                gaps: ['Gap'],
                reasoning: 'Ok match',
            })

            expect(repository.hasAnalysis(job.id)).toBe(true)
        })

        it('should return false when analysis does not exist', () => {
            expect(repository.hasAnalysis('missing-job')).toBe(false)
        })
    })

    describe('deleteByJobId', () => {
        it('should delete analysis for job', () => {
            const job = createJob('serp_analysis_4', 'Analysis Job 4')
            repository.create({
                job_id: job.id,
                match_score: 55,
                recommendation: 'MAYBE',
                strengths: ['Skill'],
                gaps: ['Gap'],
                reasoning: 'Ok match',
            })

            const result = repository.deleteByJobId(job.id)

            expect(result).toBe(true)
            expect(repository.findByJobId(job.id)).toBeNull()
        })

        it('should return false when analysis does not exist', () => {
            const result = repository.deleteByJobId('missing-job')
            expect(result).toBe(false)
        })
    })

    describe('getStats', () => {
        it('should return totals, averages, and byRecommendation counts', () => {
            const job1 = createJob('serp_stats_1', 'Stats Job 1')
            const job2 = createJob('serp_stats_2', 'Stats Job 2')
            const job3 = createJob('serp_stats_3', 'Stats Job 3')

            repository.create({
                job_id: job1.id,
                match_score: 80,
                recommendation: 'APPLY',
                strengths: ['A'],
                gaps: ['B'],
                reasoning: 'Good',
            })
            repository.create({
                job_id: job2.id,
                match_score: 50,
                recommendation: 'MAYBE',
                strengths: ['A'],
                gaps: ['B'],
                reasoning: 'Ok',
            })
            repository.create({
                job_id: job3.id,
                match_score: 20,
                recommendation: 'SKIP',
                strengths: ['A'],
                gaps: ['B'],
                reasoning: 'Bad',
            })

            const stats = repository.getStats()

            expect(stats.total).toBe(3)
            expect(stats.avgScore).toBeCloseTo((80 + 50 + 20) / 3)
            expect(stats.byRecommendation).toEqual({
                APPLY: 1,
                MAYBE: 1,
                SKIP: 1,
            })
        })

        it('should return zeros when no analyses exist', () => {
            const stats = repository.getStats()
            expect(stats.total).toBe(0)
            expect(stats.avgScore).toBe(0)
            expect(stats.byRecommendation).toEqual({
                APPLY: 0,
                MAYBE: 0,
                SKIP: 0,
            })
        })
    })
})
