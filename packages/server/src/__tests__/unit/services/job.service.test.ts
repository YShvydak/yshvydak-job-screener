/**
 * JobService Unit Tests
 */

import {describe, it, expect, beforeEach, vi} from 'vitest'
import {JobService} from '../../../services/job.service'
import {JobRepository} from '../../../repositories/job.repository'
import type {Job, JobStatus} from '@yshvydak-job-screener/shared'

describe('JobService', () => {
    const jobRepository = {
        findAll: vi.fn(),
        findAllWithAnalysis: vi.fn(),
        findById: vi.fn(),
        updateStatus: vi.fn(),
        updateDescription: vi.fn(),
        delete: vi.fn(),
        deleteAll: vi.fn(),
        countByStatus: vi.fn(),
    } as unknown as JobRepository

    let service: JobService
    const userId = 'test-user-id'

    beforeEach(() => {
        vi.resetAllMocks()
        service = new JobService(jobRepository)
    })

    it('should return jobs with filters', () => {
        const jobs: Job[] = [
            {id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'} as Job,
        ]
        jobRepository.findAll = vi.fn().mockReturnValue(jobs)

        const result = service.getAll(userId, {status: 'new'})

        expect(jobRepository.findAll).toHaveBeenCalledWith(userId, {status: 'new'})
        expect(result).toBe(jobs)
    })

    it('should return jobs with analysis', () => {
        const jobs = [{id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'}]
        jobRepository.findAllWithAnalysis = vi.fn().mockReturnValue(jobs)

        const result = service.getAllWithAnalysis(userId, {minScore: 70})

        expect(jobRepository.findAllWithAnalysis).toHaveBeenCalledWith(userId, {minScore: 70})
        expect(result).toBe(jobs)
    })

    it('should return job by id', () => {
        const job = {id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'new'}
        jobRepository.findById = vi.fn().mockReturnValue(job)

        const result = service.getById('job-1', userId)

        expect(jobRepository.findById).toHaveBeenCalledWith('job-1', userId)
        expect(result).toBe(job)
    })

    it('should update status when valid', () => {
        const job = {id: 'job-1', serpapi_job_id: 'serp_1', title: 'Job 1', status: 'applied'}
        jobRepository.findById = vi.fn().mockReturnValue(job) // Called for check
        jobRepository.updateStatus = vi.fn().mockReturnValue(job)

        const result = service.updateStatus('job-1', 'applied', userId)

        expect(jobRepository.updateStatus).toHaveBeenCalledWith('job-1', 'applied')
        expect(result).toBe(job)
    })

    it('should throw when status is invalid', () => {
        const invalidStatus = 'invalid' as JobStatus

        expect(() => service.updateStatus('job-1', invalidStatus, userId)).toThrow('Invalid status')
        expect(jobRepository.updateStatus).not.toHaveBeenCalled()
    })

    it('should throw when job does not exist on update', () => {
        jobRepository.findById = vi.fn().mockReturnValue(null) // Check fails
        jobRepository.updateStatus = vi.fn().mockReturnValue(null)

        expect(() => service.updateStatus('missing-id', 'applied', userId)).toThrow('Job not found')
    })

    it('should update description of job', () => {
        const job = {id: 'job-1', title: 'Job 1'}
        jobRepository.findById = vi.fn().mockReturnValue(job)
        jobRepository.updateDescription = vi.fn().mockReturnValue({...job, description: 'New Desc'})

        const result = service.updateDescription('job-1', 'New Desc', userId)
        expect(result.description).toBe('New Desc')
        expect(jobRepository.updateDescription).toHaveBeenCalledWith('job-1', 'New Desc')
    })

    it('should delete job', () => {
        jobRepository.findById = vi.fn().mockReturnValue({id: 'job-1'})
        jobRepository.delete = vi.fn().mockReturnValue(true)

        expect(() => service.delete('job-1', userId)).not.toThrow()
        expect(jobRepository.delete).toHaveBeenCalledWith('job-1')
    })

    it('should throw when deleting missing job', () => {
        jobRepository.findById = vi.fn().mockReturnValue(null)
        jobRepository.delete = vi.fn().mockReturnValue(false)

        expect(() => service.delete('missing-id', userId)).toThrow('Job not found')
    })

    it('should return stats from repository', () => {
        jobRepository.countByStatus = vi.fn().mockReturnValue({
            new: 1,
            applied: 2,
            saved: 0,
            rejected: 0,
            total: 3,
        })

        const result = service.getStats(userId)

        expect(result.total).toBe(3)
        expect(jobRepository.countByStatus).toHaveBeenCalledWith(userId)
    })

    it('should clear all jobs and return deleted count', () => {
        jobRepository.deleteAll = vi.fn().mockReturnValue(5)

        const result = service.clearAll(userId)

        expect(result).toBe(5)
        expect(jobRepository.deleteAll).toHaveBeenCalledWith(userId)
    })
})
