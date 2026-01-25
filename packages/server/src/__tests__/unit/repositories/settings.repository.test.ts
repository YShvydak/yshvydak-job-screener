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

    beforeEach(() => {
        db = new Database(':memory:')

        const schemaPath = path.join(__dirname, '../../../database/schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')
        db.exec(schema)

        repository = new SettingsRepository(db)
    })

    afterEach(() => {
        db.close()
    })

    describe('get / set', () => {
        it('should return null for missing key', () => {
            const result = repository.get('missing_key')
            expect(result).toBeNull()
        })

        it('should set and get a value', () => {
            repository.set('theme', 'dark')

            const value = repository.get('theme')
            expect(value).toBe('dark')
        })

        it('should update existing value', () => {
            repository.set('theme', 'dark')
            repository.set('theme', 'light')

            const value = repository.get('theme')
            expect(value).toBe('light')
        })
    })

    describe('delete', () => {
        it('should delete existing key', () => {
            repository.set('temp_key', 'temp_value')

            const result = repository.delete('temp_key')
            expect(result).toBe(true)
            expect(repository.get('temp_key')).toBeNull()
        })

        it('should return false when key does not exist', () => {
            const result = repository.delete('missing_key')
            expect(result).toBe(false)
        })
    })

    describe('getAll', () => {
        it('should return all settings as key-value map', () => {
            repository.set('theme', 'dark')
            repository.set('language', 'en')

            const result = repository.getAll()

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
            const value = repository.getCV()
            expect(value).toBe('')
        })

        it('should set and get CV content', () => {
            repository.setCV(fixtures.settings.cv_content)

            const value = repository.getCV()
            expect(value).toBe(fixtures.settings.cv_content)
        })
    })

    describe('AI Analysis Method helpers', () => {
        it('should return "api" as default when not set', () => {
            const value = repository.getAIAnalysisMethod()
            expect(value).toBe('api')
        })

        it('should set and get method as "api"', () => {
            repository.setAIAnalysisMethod('api')

            const value = repository.getAIAnalysisMethod()
            expect(value).toBe('api')
        })

        it('should set and get method as "local"', () => {
            repository.setAIAnalysisMethod('local')

            const value = repository.getAIAnalysisMethod()
            expect(value).toBe('local')
        })

        it('should return "api" for invalid stored value', () => {
            // Simulate invalid value in database
            repository.set('ai_analysis_method', 'invalid_value')

            const value = repository.getAIAnalysisMethod()
            expect(value).toBe('api')
        })
    })
})
