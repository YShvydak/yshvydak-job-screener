/**
 * SettingsRepository Unit Tests
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import {SettingsRepository} from '../../../repositories/settings.repository'
import {fixtures} from '../../helpers/fixtures'

describe('SettingsRepository', () => {
    let db: Database.Database
    let repository: SettingsRepository
    const userId = 'test-user-id'

    beforeEach(() => {
        db = new Database(':memory:')

        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        // Create a test user
        const now = new Date().toISOString()
        db.prepare(
            `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
        ).run(userId, 'test@example.com', 'hash', now, now)

        repository = new SettingsRepository(db)
    })

    afterEach(() => {
        db.close()
    })

    describe('get / set', () => {
        it('should return null for missing key', () => {
            const result = repository.get(userId, 'missing_key')
            expect(result).toBeNull()
        })

        it('should set and get a value for user', () => {
            repository.set(userId, 'theme', 'dark')

            const value = repository.get(userId, 'theme')
            expect(value).toBe('dark')
        })

        it('should isolate settings between users', () => {
            // Set for current user
            repository.set(userId, 'theme', 'dark')

            // Create other user
            const otherUserId = 'other-user'
            db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(
                otherUserId,
                'other@example.com',
                'hash'
            )

            // Set for other user
            repository.set(otherUserId, 'theme', 'light')

            expect(repository.get(userId, 'theme')).toBe('dark')
            expect(repository.get(otherUserId, 'theme')).toBe('light')
        })

        it('should update existing value', () => {
            repository.set(userId, 'theme', 'dark')
            repository.set(userId, 'theme', 'light')

            const value = repository.get(userId, 'theme')
            expect(value).toBe('light')
        })
    })

    describe('delete', () => {
        it('should delete existing key for user', () => {
            repository.set(userId, 'temp_key', 'temp_value')

            const result = repository.delete(userId, 'temp_key')
            expect(result).toBe(true)
            expect(repository.get(userId, 'temp_key')).toBeNull()
        })

        it('should return false when key does not exist', () => {
            const result = repository.delete(userId, 'missing_key')
            expect(result).toBe(false)
        })
    })

    describe('getAll', () => {
        it('should return all settings as key-value map for user', () => {
            repository.set(userId, 'theme', 'dark')
            repository.set(userId, 'language', 'en')

            const result = repository.getAll(userId)

            expect(result).toEqual(
                expect.objectContaining({
                    theme: 'dark',
                    language: 'en',
                })
            )
        })
    })

    describe('CV helpers', () => {
        it('should return empty string when CV is not set', () => {
            const value = repository.getCV(userId)
            expect(value).toBe('')
        })

        it('should set and get CV content', () => {
            repository.setCV(userId, fixtures.settings.cv_content)

            const value = repository.getCV(userId)
            expect(value).toBe(fixtures.settings.cv_content)
        })
    })

    describe('AI Analysis Method helpers', () => {
        it('should return "api" as default when not set', () => {
            const value = repository.getAIAnalysisMethod(userId)
            expect(value).toBe('api')
        })

        it('should set and get method as "api"', () => {
            repository.setAIAnalysisMethod(userId, 'api')

            const value = repository.getAIAnalysisMethod(userId)
            expect(value).toBe('api')
        })

        it('should set and get method as "local"', () => {
            repository.setAIAnalysisMethod(userId, 'local')

            const value = repository.getAIAnalysisMethod(userId)
            expect(value).toBe('local')
        })

        it('should return "api" for invalid stored value', () => {
            // Simulate invalid value in database
            repository.set(userId, 'ai_analysis_method', 'invalid_value')

            const value = repository.getAIAnalysisMethod(userId)
            expect(value).toBe('api')
        })
    })
})
