/**
 * ProfileService Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfileService } from '../../../services/profile.service'
import { ProfileRepository } from '../../../repositories/profile.repository'
import type { SearchProfile } from '@yshvydak-job-screener/shared'

describe('ProfileService', () => {
  const profileRepository = {
    findAll: vi.fn(),
    findActive: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
  } as unknown as ProfileRepository

  let service: ProfileService

  const profile: SearchProfile = {
    id: 'profile-1',
    name: 'Test Profile',
    keywords: 'typescript',
    location: 'Remote',
    date_posted: 'week',
    radius: 50,
    active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new ProfileService(profileRepository)
  })

  it('should return all profiles', () => {
    profileRepository.findAll = vi.fn().mockReturnValue([profile])
    const result = service.getAll()
    expect(result).toHaveLength(1)
  })

  it('should return active profiles', () => {
    profileRepository.findActive = vi.fn().mockReturnValue([profile])
    const result = service.getActive()
    expect(result).toHaveLength(1)
  })

  it('should return profile by id', () => {
    profileRepository.findById = vi.fn().mockReturnValue(profile)
    const result = service.getById(profile.id)
    expect(result?.id).toBe(profile.id)
  })

  it('should validate input on create', () => {
    expect(() =>
      service.create({ name: '', keywords: 'react', location: '', date_posted: 'today' })
    ).toThrow('Profile name is required')

    expect(() =>
      service.create({ name: 'Test', keywords: '', location: '', date_posted: 'today' })
    ).toThrow('Keywords are required')

    expect(() =>
      service.create({ name: 'Test', keywords: 'react', location: '', date_posted: 'today', radius: 600 })
    ).toThrow('Radius must be between 0 and 500 km')

    expect(() =>
      service.create({ name: 'Test', keywords: 'react', location: '', date_posted: 'year' as any })
    ).toThrow('Invalid date_posted value')
  })

  it('should require date_posted on create', () => {
    expect(() =>
      service.create({ name: 'Test', keywords: 'react', location: '', date_posted: undefined as any })
    ).toThrow('Date posted is required')
  })

  it('should create profile when input is valid', () => {
    profileRepository.create = vi.fn().mockReturnValue(profile)

    const result = service.create({
      name: profile.name,
      keywords: profile.keywords,
      location: profile.location,
      date_posted: profile.date_posted || 'week',
      radius: profile.radius ?? undefined,
    })

    expect(result).toBe(profile)
    expect(profileRepository.create).toHaveBeenCalled()
  })

  it('should update profile when exists', () => {
    profileRepository.findById = vi.fn().mockReturnValue(profile)
    profileRepository.update = vi.fn().mockReturnValue({ ...profile, name: 'Updated' })

    const result = service.update(profile.id, { name: 'Updated' })

    expect(result.name).toBe('Updated')
  })

  it('should throw when updating missing profile', () => {
    profileRepository.findById = vi.fn().mockReturnValue(null)

    expect(() => service.update('missing', { name: 'Updated' })).toThrow('Profile not found')
  })

  it('should validate update input when changing fields', () => {
    profileRepository.findById = vi.fn().mockReturnValue(profile)

    expect(() => service.update(profile.id, { name: '' })).toThrow('Profile name is required')
    expect(() => service.update(profile.id, { keywords: '' })).toThrow('Keywords are required')
    expect(() => service.update(profile.id, { date_posted: 'invalid' as any })).toThrow('Invalid date_posted value')
  })

  it('should use default date_posted when updating profile with null date_posted', () => {
    const profileWithNullDate = { ...profile, date_posted: null }
    profileRepository.findById = vi.fn().mockReturnValue(profileWithNullDate)
    profileRepository.update = vi.fn().mockReturnValue({ ...profileWithNullDate, name: 'Updated' })

    const result = service.update(profile.id, { name: 'Updated' })

    expect(result.name).toBe('Updated')
    // Should use 'today' as fallback when existing profile has null date_posted
    expect(profileRepository.update).toHaveBeenCalled()
  })

  it('should toggle active status', () => {
    profileRepository.toggleActive = vi.fn().mockReturnValue({ ...profile, active: 0 })

    const result = service.toggleActive(profile.id)

    expect(result.active).toBe(0)
  })

  it('should throw when toggling missing profile', () => {
    profileRepository.toggleActive = vi.fn().mockReturnValue(null)
    expect(() => service.toggleActive('missing')).toThrow('Profile not found')
  })

  it('should delete profile', () => {
    profileRepository.delete = vi.fn().mockReturnValue(true)
    expect(() => service.delete(profile.id)).not.toThrow()
  })

  it('should throw when deleting missing profile', () => {
    profileRepository.delete = vi.fn().mockReturnValue(false)
    expect(() => service.delete('missing')).toThrow('Profile not found')
  })
})
