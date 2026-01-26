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

        try {
            // Attempt 1: Execute schema directly
            // On a new DB, this works perfectly.
            // On an old DB, this might fail if CREATE INDEX references missing columns that migrations haven't added yet.
            this.db.exec(schema)
        } catch (error) {
            // If schema fails, it's likely due to missing columns on an existing DB.
            // We ignore this error and proceed to migrations, which should fix the structure.
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.warn(
                `⚠️  Initial schema verification needed migrations (${errorMessage}). Proceeding...`
            )
        }

        // Run migrations for existing databases
        // This adds missing columns (like 'provider') referenced by the schema indexes
        this.runMigrations()

        // Attempt 2: Re-run schema to ensure all objects (indexes, views, etc.) are created
        // Now that migrations have run, this should succeed even on old databases.
        try {
            this.db.exec(schema)
        } catch (error) {
            // If it still fails, we have a real problem
            console.error('❌ Final schema execution failed:', error)
            throw error
        }

        console.log('✅ Database schema initialized')
    }

    /**
     * Run migrations for existing databases
     */
    private runMigrations(): void {
        // Create migrations tracking table if not exists
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        const migrationsDir = path.join(__dirname, 'migrations')
        if (!fs.existsSync(migrationsDir)) {
            return
        }

        const files = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort()

        for (const file of files) {
            // Check if migration already executed
            const executed = this.db
                .prepare('SELECT 1 FROM schema_migrations WHERE name = ?')
                .get(file)

            if (executed) {
                continue
            }

            console.log(`🔄 Running migration: ${file}`)

            try {
                const migrationPath = path.join(migrationsDir, file)
                const migration = fs.readFileSync(migrationPath, 'utf8')

                // Execute migration
                this.db.exec(migration)

                // Mark as executed
                this.db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file)

                console.log(`✅ Migration completed: ${file}`)
            } catch (error) {
                // Some migrations may fail if columns already exist (that's ok)
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('duplicate column name')) {
                    console.log(`⏭️ Migration skipped (already applied): ${file}`)
                    this.db
                        .prepare('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)')
                        .run(file)
                } else {
                    console.error(`❌ Migration failed: ${file}`, error)
                    throw error
                }
            }
        }
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
