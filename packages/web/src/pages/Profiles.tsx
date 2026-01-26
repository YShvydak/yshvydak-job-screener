import {useEffect, useState} from 'react'
import {
    SearchProfile,
    SearchProfileInput,
    DatePosted,
    JobProvider,
} from '@yshvydak-job-screener/shared'
import {useProfileStore} from '../stores/profileStore'

const DATE_POSTED_OPTIONS: {value: DatePosted; label: string}[] = [
    {value: 'today', label: 'Today'},
    {value: '3days', label: 'Last 3 days'},
    {value: 'week', label: 'Last week'},
    {value: 'month', label: 'Last month'},
]

export function Profiles() {
    const {
        profiles,
        loading,
        error,
        providers,
        fetchProfiles,
        fetchProviders,
        createProfile,
        updateProfile,
        toggleProfile,
        deleteProfile,
        runSearch,
    } = useProfileStore()
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchingId, setSearchingId] = useState<string | null>(null)

    useEffect(() => {
        fetchProfiles()
        fetchProviders()
    }, [])

    const handleRunSearch = async (profileId: string, provider?: JobProvider) => {
        setSearchingId(profileId)
        try {
            const result = await runSearch(profileId, provider)
            alert(`Found ${result.jobsFound} jobs, ${result.newJobs} new`)
        } catch (err) {
            alert('Search failed: ' + (err as Error).message)
        } finally {
            setSearchingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Search Profiles</h2>
                    <p className="mt-1 text-gray-600">Manage your job search criteria</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create Profile
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Create Form */}
            {isCreating && (
                <ProfileForm
                    providers={providers}
                    onSubmit={async (input) => {
                        await createProfile(input)
                        setIsCreating(false)
                    }}
                    onCancel={() => setIsCreating(false)}
                />
            )}

            {/* Profiles List */}
            <div className="space-y-4">
                {profiles.map((profile) =>
                    editingId === profile.id ? (
                        <ProfileForm
                            key={profile.id}
                            initialData={profile}
                            providers={providers}
                            onSubmit={async (input) => {
                                await updateProfile(profile.id, input)
                                setEditingId(null)
                            }}
                            onCancel={() => setEditingId(null)}
                        />
                    ) : (
                        <ProfileCard
                            key={profile.id}
                            profile={profile}
                            providers={providers}
                            isSearching={searchingId === profile.id}
                            onEdit={() => setEditingId(profile.id)}
                            onToggle={() => toggleProfile(profile.id)}
                            onDelete={() => {
                                if (confirm('Delete this profile?')) {
                                    deleteProfile(profile.id)
                                }
                            }}
                            onRunSearch={(provider) => handleRunSearch(profile.id, provider)}
                        />
                    )
                )}

                {!loading && profiles.length === 0 && !isCreating && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No search profiles yet</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="mt-4 text-blue-600 hover:text-blue-800">
                            Create your first profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function ProfileCard({
    profile,
    providers,
    isSearching,
    onEdit,
    onToggle,
    onDelete,
    onRunSearch,
}: {
    profile: SearchProfile
    providers: {name: JobProvider; displayName: string; available: boolean}[]
    isSearching: boolean
    onEdit: () => void
    onToggle: () => void
    onDelete: () => void
    onRunSearch: (provider?: JobProvider) => Promise<void>
}) {
    const [showProviderMenu, setShowProviderMenu] = useState(false)
    const isActive = profile.active === 1

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${!isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Keywords:</span> {profile.keywords}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span>{' '}
                        {profile.location || (
                            <span className="text-gray-400 italic">Global search</span>
                        )}
                        {profile.location && profile.radius && ` (${profile.radius} km radius)`}
                    </p>
                    {profile.date_posted && (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Date posted:</span>{' '}
                            {
                                DATE_POSTED_OPTIONS.find((o) => o.value === profile.date_posted)
                                    ?.label
                            }
                        </p>
                    )}
                    {profile.preferred_provider && (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Preferred provider:</span>{' '}
                            {providers.find((p) => p.name === profile.preferred_provider)
                                ?.displayName || profile.preferred_provider}
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Split-button for Run Search */}
                    <div className="relative inline-flex">
                        <button
                            onClick={() => onRunSearch(profile.preferred_provider ?? undefined)}
                            disabled={!isActive || isSearching}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-l-md hover:bg-blue-700 disabled:opacity-50">
                            {isSearching ? 'Searching...' : 'Run Search'}
                        </button>
                        <button
                            onClick={() => setShowProviderMenu(!showProviderMenu)}
                            disabled={!isActive || isSearching}
                            className="px-2 py-1 text-sm bg-blue-600 text-white border-l border-blue-500 rounded-r-md hover:bg-blue-700 disabled:opacity-50">
                            ▼
                        </button>
                        {showProviderMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[150px]">
                                {providers
                                    .filter((p) => p.available)
                                    .map((provider) => (
                                        <button
                                            key={provider.name}
                                            onClick={() => {
                                                setShowProviderMenu(false)
                                                onRunSearch(provider.name)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            {provider.displayName}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onEdit}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                        Edit
                    </button>
                    <button
                        onClick={onToggle}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                        {isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

function ProfileForm({
    initialData,
    providers,
    onSubmit,
    onCancel,
}: {
    initialData?: SearchProfile
    providers: {name: JobProvider; displayName: string; available: boolean}[]
    onSubmit: (input: SearchProfileInput) => Promise<void>
    onCancel: () => void
}) {
    const [name, setName] = useState(initialData?.name || '')
    const [keywords, setKeywords] = useState(initialData?.keywords || '')
    const [location, setLocation] = useState(initialData?.location || '')
    const [datePosted, setDatePosted] = useState<DatePosted>(initialData?.date_posted || 'today')
    const [radius, setRadius] = useState(initialData?.radius?.toString() || '')
    const [preferredProvider, setPreferredProvider] = useState<JobProvider | ''>(
        initialData?.preferred_provider || ''
    )
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onSubmit({
                name,
                keywords,
                location,
                date_posted: datePosted,
                radius: radius ? parseInt(radius, 10) : undefined,
                preferred_provider: preferredProvider || undefined,
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Profile Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Frontend Jobs Germany"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Keywords</label>
                <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., React, TypeScript, Frontend Developer"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Location <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Leave empty for global search, or e.g., Berlin, Germany"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Date Posted <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={datePosted}
                        onChange={(e) => setDatePosted(e.target.value as DatePosted)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        {DATE_POSTED_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Radius (km)</label>
                    <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        min="0"
                        max="500"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., 50"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Preferred Provider <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                    value={preferredProvider}
                    onChange={(e) => setPreferredProvider(e.target.value as JobProvider | '')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">Auto (use any available)</option>
                    {providers
                        .filter((p) => p.available)
                        .map((provider) => (
                            <option key={provider.name} value={provider.name}>
                                {provider.displayName}
                            </option>
                        ))}
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    )
}
