import {JobProvider, ProviderStatus} from '@yshvydak-job-screener/shared'
import {IJobSearchProvider} from './types'

/**
 * Registry for job search providers
 * Manages provider registration and retrieval
 */
export class ProviderRegistry {
    private providers: Map<JobProvider, IJobSearchProvider> = new Map()

    /**
     * Register a provider
     */
    register(provider: IJobSearchProvider): void {
        this.providers.set(provider.name, provider)
    }

    /**
     * Get a provider by name
     */
    get(name: JobProvider): IJobSearchProvider | undefined {
        return this.providers.get(name)
    }

    /**
     * Get all registered providers
     */
    getAll(): IJobSearchProvider[] {
        return Array.from(this.providers.values())
    }

    /**
     * Get only available (configured) providers
     */
    getAvailable(): IJobSearchProvider[] {
        return this.getAll().filter((p) => p.isAvailable())
    }

    /**
     * Get provider status for all registered providers
     */
    getStatus(): ProviderStatus[] {
        return this.getAll().map((p) => ({
            name: p.name,
            displayName: p.displayName,
            available: p.isAvailable(),
            configured: p.isAvailable(),
        }))
    }

    /**
     * Get first available provider (fallback)
     */
    getFirstAvailable(): IJobSearchProvider | undefined {
        return this.getAvailable()[0]
    }
}
