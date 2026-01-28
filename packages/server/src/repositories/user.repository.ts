import {Database} from 'better-sqlite3'
import {v4 as uuidv4} from 'uuid'
import {User, CreateUserDTO, UpdateUserDTO} from '../types/user.types'

/**
 * Repository for users table operations
 * Handles all database operations for user management
 */
export class UserRepository {
    constructor(private db: Database) {}

    /**
     * Find all users
     */
    findAll(): User[] {
        const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC')
        return stmt.all() as User[]
    }

    /**
     * Find user by ID
     */
    findById(id: string): User | null {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?')
        return (stmt.get(id) as User) || null
    }

    /**
     * Find user by email
     */
    findByEmail(email: string): User | null {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?')
        return (stmt.get(email) as User) || null
    }

    /**
     * Create a new user
     */
    create(input: CreateUserDTO & {password_hash: string}): User {
        const id = uuidv4()
        const now = new Date().toISOString()

        const stmt = this.db.prepare(`
            INSERT INTO users (
                id, email, password_hash, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?)
        `)

        stmt.run(id, input.email, input.password_hash, now, now)

        return this.findById(id)!
    }

    /**
     * Update user
     */
    update(id: string, input: UpdateUserDTO & {password_hash?: string}): User | null {
        const existing = this.findById(id)
        if (!existing) return null

        const now = new Date().toISOString()
        const updates: string[] = []
        const params: any[] = []

        if (input.email !== undefined) {
            updates.push('email = ?')
            params.push(input.email)
        }

        if (input.password_hash !== undefined) {
            updates.push('password_hash = ?')
            params.push(input.password_hash)
        }

        if (updates.length === 0) {
            return existing
        }

        updates.push('updated_at = ?')
        params.push(now)
        params.push(id)

        const stmt = this.db.prepare(`
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = ?
        `)

        stmt.run(...params)
        return this.findById(id)
    }

    /**
     * Delete a user
     */
    delete(id: string): boolean {
        const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
        const result = stmt.run(id)
        return result.changes > 0
    }

    /**
     * Count total users
     */
    count(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users')
        const result = stmt.get() as {count: number}
        return result.count
    }

    /**
     * Check if email exists
     */
    emailExists(email: string, excludeUserId?: string): boolean {
        let stmt
        if (excludeUserId) {
            stmt = this.db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?')
            return !!stmt.get(email, excludeUserId)
        } else {
            stmt = this.db.prepare('SELECT 1 FROM users WHERE email = ?')
            return !!stmt.get(email)
        }
    }
}
