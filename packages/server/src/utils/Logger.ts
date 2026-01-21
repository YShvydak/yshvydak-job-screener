/**
 * Simple logger utility
 * Provides formatted console output for different log levels
 */
export class Logger {
    /**
     * Log info message
     */
    static info(message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ℹ️  INFO: ${message}`, data || '');
    }

    /**
     * Log error message
     */
    static error(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ ERROR: ${message}`, error || '');
    }

    /**
     * Log warning message
     */
    static warn(message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] ⚠️  WARN: ${message}`, data || '');
    }

    /**
     * Log debug message (only in development)
     */
    static debug(message: string, data?: any): void {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] 🐛 DEBUG: ${message}`, data || '');
        }
    }

    /**
     * Log success message
     */
    static success(message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅ SUCCESS: ${message}`, data || '');
    }
}
