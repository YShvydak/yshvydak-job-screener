import {SearchProfile, SearchProfileInput} from '@yshvydak-job-screener/shared'
import {ProfileRepository} from '../repositories/profile.repository'
import {Logger} from '../utils/Logger'

/**
 * Service layer for search profile business logic
 */
export class ProfileService {
    constructor(private profileRepository: ProfileRepository) {}

    /**
     * Get all profiles for a user
     */
    getAll(userId: string): SearchProfile[] {
        return this.profileRepository.findAll(userId)
    }

    /**
     * Get active profiles only for a user
     */
    getActive(userId: string): SearchProfile[] {
        return this.profileRepository.findActive(userId)
    }

    /**
     * Get profile by ID
     */
    getById(id: string, userId: string): SearchProfile | null {
        return this.profileRepository.findById(id, userId)
    }

    /**
     * Create a new profile
     */
    create(input: SearchProfileInput, userId: string): SearchProfile {
        this.validateInput(input)

        const profile = this.profileRepository.create(input, userId)
        Logger.success('Profile created', {id: profile.id, name: profile.name, userId})

        return profile
    }

    /**
     * Update an existing profile
     */
    update(id: string, input: Partial<SearchProfileInput>, userId: string): SearchProfile {
        const existing = this.profileRepository.findById(id, userId)
        if (!existing) {
            throw new Error(`Profile not found: ${id}`)
        }

        const shouldValidate =
            input.name !== undefined ||
            input.keywords !== undefined ||
            input.location !== undefined ||
            input.radius !== undefined ||
            input.date_posted !== undefined

        if (shouldValidate) {
            this.validateInput({
                name: input.name ?? existing.name,
                keywords: input.keywords ?? existing.keywords,
                location: input.location ?? existing.location,
                date_posted: input.date_posted ?? existing.date_posted ?? 'today',
                radius: input.radius ?? existing.radius ?? undefined,
            })
        }

        const updated = this.profileRepository.update(id, input)
        Logger.info('Profile updated', {id, changes: Object.keys(input)})

        return updated!
    }

    /**
     * Toggle profile active status
     */
    toggleActive(id: string): SearchProfile {
        const profile = this.profileRepository.toggleActive(id)
        if (!profile) {
            throw new Error(`Profile not found: ${id}`)
        }

        Logger.info('Profile status toggled', {
            id,
            active: profile.active === 1,
        })

        return profile
    }

    /**
     * Delete a profile
     */
    delete(id: string): void {
        const deleted = this.profileRepository.delete(id)
        if (!deleted) {
            throw new Error(`Profile not found: ${id}`)
        }

        Logger.info('Profile deleted', {id})
    }

    /**
     * Validate profile input
     */
    private validateInput(input: SearchProfileInput): void {
        if (!input.name || input.name.trim().length === 0) {
            throw new Error('Profile name is required')
        }

        if (!input.keywords || input.keywords.trim().length === 0) {
            throw new Error('Keywords are required')
        }

        // Location is optional - empty means global search

        if (input.radius !== undefined && (input.radius < 0 || input.radius > 500)) {
            throw new Error('Radius must be between 0 and 500 km')
        }

        if (!input.date_posted) {
            throw new Error('Date posted is required')
        }

        const validDatePosted = ['today', '3days', 'week', 'month']
        if (!validDatePosted.includes(input.date_posted)) {
            throw new Error(
                `Invalid date_posted value. Must be one of: ${validDatePosted.join(', ')}`
            )
        }
    }
}
