import { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { SearchProfile, SearchProfileInput } from '@yshvydak-job-screener/shared';

/**
 * Repository for search_profiles table operations
 */
export class ProfileRepository {
    constructor(private db: Database) {}

    /**
     * Find all profiles
     */
    findAll(): SearchProfile[] {
        const stmt = this.db.prepare(`
            SELECT * FROM search_profiles
            ORDER BY created_at DESC
        `);
        return stmt.all() as SearchProfile[];
    }

    /**
     * Find active profiles only
     */
    findActive(): SearchProfile[] {
        const stmt = this.db.prepare(`
            SELECT * FROM search_profiles
            WHERE active = 1
            ORDER BY created_at DESC
        `);
        return stmt.all() as SearchProfile[];
    }

    /**
     * Find profile by ID
     */
    findById(id: string): SearchProfile | null {
        const stmt = this.db.prepare('SELECT * FROM search_profiles WHERE id = ?');
        return (stmt.get(id) as SearchProfile) || null;
    }

    /**
     * Create a new profile
     */
    create(input: SearchProfileInput): SearchProfile {
        const id = uuidv4();
        const now = new Date().toISOString();

        const stmt = this.db.prepare(`
            INSERT INTO search_profiles (
                id, name, keywords, location, date_posted, radius, active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        `);

        stmt.run(
            id,
            input.name,
            input.keywords,
            input.location,
            input.date_posted || null,
            input.radius || null,
            now,
            now
        );

        return this.findById(id)!;
    }

    /**
     * Update an existing profile
     */
    update(id: string, input: Partial<SearchProfileInput>): SearchProfile | null {
        const existing = this.findById(id);
        if (!existing) return null;

        const now = new Date().toISOString();

        const stmt = this.db.prepare(`
            UPDATE search_profiles
            SET name = ?, keywords = ?, location = ?, date_posted = ?, radius = ?, updated_at = ?
            WHERE id = ?
        `);

        stmt.run(
            input.name ?? existing.name,
            input.keywords ?? existing.keywords,
            input.location ?? existing.location,
            input.date_posted ?? existing.date_posted,
            input.radius ?? existing.radius,
            now,
            id
        );

        return this.findById(id);
    }

    /**
     * Toggle profile active status
     */
    toggleActive(id: string): SearchProfile | null {
        const existing = this.findById(id);
        if (!existing) return null;

        const newActive = existing.active === 1 ? 0 : 1;
        const now = new Date().toISOString();

        const stmt = this.db.prepare(`
            UPDATE search_profiles
            SET active = ?, updated_at = ?
            WHERE id = ?
        `);

        stmt.run(newActive, now, id);
        return this.findById(id);
    }

    /**
     * Delete a profile
     */
    delete(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM search_profiles WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}
