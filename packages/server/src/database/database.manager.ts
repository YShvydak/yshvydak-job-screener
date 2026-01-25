import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

/**
 * DatabaseManager - Wrapper around better-sqlite3
 * Provides a simplified interface for database operations
 */
export class DatabaseManager {
    private db: Database.Database

    constructor(dbPath: string) {
        // Ensure database directory exists
        const dbDir = path.dirname(dbPath)
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, {recursive: true})
        }

        // Initialize database connection
        this.db = new Database(dbPath, {
            verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        })

        // Enable foreign keys
        this.db.pragma('foreign_keys = ON')

        // Enable WAL mode for better concurrency
        this.db.pragma('journal_mode = WAL')

        // Initialize schema
        this.initSchema()
    }

    /**
     * Initialize database schema from SQL file
     */
    private initSchema(): void {
        const schemaPath = path.join(__dirname, 'schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf8')

        // Execute schema (better-sqlite3 supports multiple statements)
        this.db.exec(schema)

        console.log('✅ Database schema initialized')
    }

    /**
     * Execute a write query (INSERT, UPDATE, DELETE)
     * Returns the result with lastInsertRowid and changes
     */
    run(sql: string, params: any[] = []): Database.RunResult {
        const stmt = this.db.prepare(sql)
        return stmt.run(params)
    }

    /**
     * Execute a query that returns a single row
     * Returns undefined if no row found
     */
    get<T = any>(sql: string, params: any[] = []): T | undefined {
        const stmt = this.db.prepare(sql)
        return stmt.get(params) as T | undefined
    }

    /**
     * Execute a query that returns multiple rows
     * Returns empty array if no rows found
     */
    all<T = any>(sql: string, params: any[] = []): T[] {
        const stmt = this.db.prepare(sql)
        return stmt.all(params) as T[]
    }

    /**
     * Execute a transaction
     * Commits on success, rolls back on error
     */
    transaction<T>(fn: () => T): T {
        const txn = this.db.transaction(fn)
        return txn()
    }

    /**
     * Close the database connection
     */
    close(): void {
        this.db.close()
        console.log('✅ Database connection closed')
    }

    /**
     * Get the underlying better-sqlite3 database instance
     * Use this for advanced operations
     */
    getDB(): Database.Database {
        return this.db
    }
}
