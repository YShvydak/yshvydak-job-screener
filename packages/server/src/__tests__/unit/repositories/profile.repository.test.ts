/**
 * ProfileRepository Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { ProfileRepository } from '../../../repositories/profile.repository'
import { fixtures } from '../../helpers/fixtures'
import type { DatePosted } from '@yshvydak-job-screener/shared'

describe('ProfileRepository', () => {
  let db: Database.Database
  let repository: ProfileRepository

  beforeEach(() => {
    db = new Database(':memory:')

    const schemaPath = path.join(__dirname, '../../../database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    db.exec(schema)

    repository = new ProfileRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('findAll', () => {
    it('should return all profiles', () => {
      repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })
      repository.create({
        name: fixtures.profileInactive.name,
        keywords: fixtures.profileInactive.keywords,
        location: fixtures.profileInactive.location,
        date_posted: fixtures.profileInactive.date_posted as DatePosted,
      })

      const result = repository.findAll()

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.name)).toEqual(
        expect.arrayContaining([fixtures.profile.name, fixtures.profileInactive.name])
      )
    })
  })

  describe('findActive', () => {
    it('should return only active profiles', () => {
      const active = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const inactive = repository.create({
        name: fixtures.profileInactive.name,
        keywords: fixtures.profileInactive.keywords,
        location: fixtures.profileInactive.location,
        date_posted: fixtures.profileInactive.date_posted as DatePosted,
      })
      repository.toggleActive(inactive.id)

      const result = repository.findActive()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(active.id)
      expect(result[0].active).toBe(1)
    })
  })

  describe('findById', () => {
    it('should return profile when id exists', () => {
      const created = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const result = repository.findById(created.id)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(created.id)
    })

    it('should return null when id does not exist', () => {
      const result = repository.findById('missing-id')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new profile with required fields', () => {
      const result = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      expect(result.id).toBeDefined()
      expect(result.name).toBe(fixtures.profile.name)
      expect(result.active).toBe(1)
      expect(result.date_posted).toBe(fixtures.profile.date_posted)
      expect(result.radius).toBeNull()
    })

    it('should persist optional fields when provided', () => {
      const result = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
        radius: fixtures.profile.radius,
      })

      expect(result.date_posted).toBe(fixtures.profile.date_posted)
      expect(result.radius).toBe(fixtures.profile.radius)
    })
  })

  describe('update', () => {
    it('should update profile fields', () => {
      const created = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const updated = repository.update(created.id, {
        name: 'Updated Name',
        keywords: 'updated keywords',
      })

      expect(updated).not.toBeNull()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.keywords).toBe('updated keywords')
    })

    it('should update updated_at timestamp', () => {
      const created = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const originalUpdatedAt = created.updated_at

      const startTime = Date.now()
      while (Date.now() - startTime < 10) {
        // busy wait
      }

      const updated = repository.update(created.id, { name: 'Changed' })

      expect(updated?.updated_at).not.toBe(originalUpdatedAt)
    })

    it('should return null when profile does not exist', () => {
      const updated = repository.update('missing-id', { name: 'Changed' })
      expect(updated).toBeNull()
    })
  })

  describe('toggleActive', () => {
    it('should toggle active status', () => {
      const created = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const toggled = repository.toggleActive(created.id)

      expect(toggled?.active).toBe(0)

      const toggledBack = repository.toggleActive(created.id)
      expect(toggledBack?.active).toBe(1)
    })

    it('should return null when profile does not exist', () => {
      const result = repository.toggleActive('missing-id')
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete existing profile', () => {
      const created = repository.create({
        name: fixtures.profile.name,
        keywords: fixtures.profile.keywords,
        location: fixtures.profile.location,
        date_posted: fixtures.profile.date_posted as DatePosted,
      })

      const result = repository.delete(created.id)

      expect(result).toBe(true)
      expect(repository.findById(created.id)).toBeNull()
    })

    it('should return false when profile does not exist', () => {
      const result = repository.delete('missing-id')
      expect(result).toBe(false)
    })
  })
})
