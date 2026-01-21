import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../../../..', '.env') });

/**
 * Environment configuration with validation
 */
class EnvironmentConfig {
    // Server
    public readonly PORT: number;
    public readonly NODE_ENV: string;

    // Database
    public readonly DATABASE_PATH: string;

    // API Keys (REQUIRED)
    public readonly SERPAPI_KEY: string;
    public readonly GEMINI_API_KEY: string;

    constructor() {
        // Server configuration
        this.PORT = parseInt(process.env.PORT || '3001', 10);
        this.NODE_ENV = process.env.NODE_ENV || 'development';

        // Database configuration
        this.DATABASE_PATH = process.env.DATABASE_PATH || './data/jobs.db';

        // API Keys (REQUIRED)
        this.SERPAPI_KEY = process.env.SERPAPI_KEY || '';
        this.GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

        // Validate configuration
        this.validate();
    }

    /**
     * Validate required environment variables
     */
    private validate(): void {
        const missing: string[] = [];

        if (!this.SERPAPI_KEY) {
            missing.push('SERPAPI_KEY');
        }

        if (!this.GEMINI_API_KEY) {
            missing.push('GEMINI_API_KEY');
        }

        if (missing.length > 0) {
            const message = `Missing required environment variables: ${missing.join(', ')}\n` +
                `Please check your .env file and ensure all required variables are set.`;

            if (this.NODE_ENV === 'development') {
                // In development, warn but allow starting server
                console.warn(`⚠️  WARNING: ${message}`);
                console.warn('⚠️  Some features (SerpAPI search, Gemini AI) will not work until configured.');
            } else {
                // In production, fail fast
                throw new Error(message);
            }
        } else {
            console.log('✅ Environment configuration validated');
        }
    }

    /**
     * Check if running in development mode
     */
    public isDevelopment(): boolean {
        return this.NODE_ENV === 'development';
    }

    /**
     * Check if running in production mode
     */
    public isProduction(): boolean {
        return this.NODE_ENV === 'production';
    }
}

// Export singleton instance
export const env = new EnvironmentConfig();
