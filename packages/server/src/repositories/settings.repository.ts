import {Database} from 'better-sqlite3'

/**
 * Repository for settings table operations
 */
export class SettingsRepository {
    constructor(private db: Database) {}

    /**
     * Get a setting value by key
     */
    get(key: string): string | null {
        const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?')
        const row = stmt.get(key) as {value: string} | undefined
        return row?.value || null
    }

    /**
     * Set a setting value
     */
    set(key: string, value: string): void {
        const now = new Date().toISOString()
        const stmt = this.db.prepare(`
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
        `)
        stmt.run(key, value, now, value, now)
    }

    /**
     * Delete a setting
     */
    delete(key: string): boolean {
        const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?')
        const result = stmt.run(key)
        return result.changes > 0
    }

    /**
     * Get all settings
     */
    getAll(): Record<string, string> {
        const stmt = this.db.prepare('SELECT key, value FROM settings')
        const rows = stmt.all() as {key: string; value: string}[]

        const result: Record<string, string> = {}
        rows.forEach((row) => {
            result[row.key] = row.value
        })
        return result
    }

    // Convenience methods for common settings

    /**
     * Get CV content
     */
    getCV(): string {
        return this.get('cv_content') || ''
    }

    /**
     * Set CV content
     */
    setCV(content: string): void {
        this.set('cv_content', content)
    }

    /**
     * Get AI analysis method (default: 'api')
     */
    getAIAnalysisMethod(): 'api' | 'local' {
        const value = this.get('ai_analysis_method')
        if (value === 'local') {
            return 'local'
        }
        return 'api' // default
    }

    /**
     * Set AI analysis method
     */
    setAIAnalysisMethod(method: 'api' | 'local'): void {
        this.set('ai_analysis_method', method)
    }
}
