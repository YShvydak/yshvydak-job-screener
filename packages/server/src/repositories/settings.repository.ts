import {Database} from 'better-sqlite3'
import {v4 as uuidv4} from 'uuid'

/**
 * Repository for user_settings table operations
 * Settings are now per-user for multi-user support
 */
export class SettingsRepository {
    constructor(private db: Database) {}

    /**
     * Get a setting value by key for a specific user
     * @param userId - User ID
     * @param key - Setting key
     */
    get(userId: string, key: string): string | null {
        const stmt = this.db.prepare(
            'SELECT value FROM user_settings WHERE user_id = ? AND key = ?'
        )
        const row = stmt.get(userId, key) as {value: string} | undefined
        return row?.value || null
    }

    /**
     * Set a setting value for a specific user
     * @param userId - User ID
     * @param key - Setting key
     * @param value - Setting value
     */
    set(userId: string, key: string, value: string): void {
        const now = new Date().toISOString()

        // Check if setting exists
        const existing = this.get(userId, key)

        if (existing !== null) {
            // Update existing
            const stmt = this.db.prepare(`
                UPDATE user_settings
                SET value = ?, updated_at = ?
                WHERE user_id = ? AND key = ?
            `)
            stmt.run(value, now, userId, key)
        } else {
            // Insert new
            const id = uuidv4()
            const stmt = this.db.prepare(`
                INSERT INTO user_settings (id, user_id, key, value, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `)
            stmt.run(id, userId, key, value, now)
        }
    }

    /**
     * Delete a setting for a specific user
     * @param userId - User ID
     * @param key - Setting key
     */
    delete(userId: string, key: string): boolean {
        const stmt = this.db.prepare('DELETE FROM user_settings WHERE user_id = ? AND key = ?')
        const result = stmt.run(userId, key)
        return result.changes > 0
    }

    /**
     * Get all settings for a specific user
     * @param userId - User ID
     */
    getAll(userId: string): Record<string, string> {
        const stmt = this.db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?')
        const rows = stmt.all(userId) as {key: string; value: string}[]

        const result: Record<string, string> = {}
        rows.forEach((row) => {
            result[row.key] = row.value
        })
        return result
    }

    // Convenience methods for common settings

    /**
     * Get CV content for a specific user
     * @param userId - User ID
     */
    getCV(userId: string): string {
        return this.get(userId, 'cv_content') || ''
    }

    /**
     * Set CV content for a specific user
     * @param userId - User ID
     * @param content - CV content
     */
    setCV(userId: string, content: string): void {
        this.set(userId, 'cv_content', content)
    }

    /**
     * Get AI analysis method for a specific user (default: 'api')
     * @param userId - User ID
     */
    getAIAnalysisMethod(userId: string): 'api' | 'local' {
        const value = this.get(userId, 'ai_analysis_method')
        if (value === 'local') {
            return 'local'
        }
        return 'api' // default
    }

    /**
     * Set AI analysis method for a specific user
     * @param userId - User ID
     * @param method - Analysis method
     */
    setAIAnalysisMethod(userId: string, method: 'api' | 'local'): void {
        this.set(userId, 'ai_analysis_method', method)
    }
}
