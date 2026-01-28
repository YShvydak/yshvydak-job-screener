import {useEffect, useState, useRef} from 'react'
import {JobWithAnalysis, JobStatus, AIAnalysisMethod} from '@yshvydak-job-screener/shared'
import {useJobStore} from '../stores/jobStore'
import {useSettingsStore} from '../stores/settingsStore'

const STATUS_OPTIONS: JobStatus[] = ['new', 'saved', 'applied', 'rejected']

const STATUS_COLORS: Record<JobStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    saved: 'bg-green-100 text-green-800',
    applied: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
}

export function Jobs() {
    const {
        jobs,
        loading,
        error,
        filters,
        analyzingJobs,
        fetchJobs,
        updateStatus,
        deleteJob,
        analyzeJob,
        setFilters,
    } = useJobStore()
    const {aiMethod, fetchAIMethod} = useSettingsStore()
    const [expandedJob, setExpandedJob] = useState<string | null>(null)

    useEffect(() => {
        fetchJobs()
        fetchAIMethod()
    }, [filters, fetchJobs, fetchAIMethod])

    const handleStatusChange = async (jobId: string, status: JobStatus) => {
        try {
            await updateStatus(jobId, status)
        } catch {
            // Error handled in store
        }
    }

    const handleAnalyze = async (jobId: string, method?: AIAnalysisMethod) => {
        try {
            await analyzeJob(jobId, method)
        } catch {
            // Error handled in store
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
                    <p className="mt-1 text-gray-600">{jobs.length} jobs found</p>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                    <select
                        value={filters.status || ''}
                        onChange={(e) =>
                            setFilters({status: (e.target.value as JobStatus) || undefined})
                        }
                        className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={
                            filters.hasAnalysis === undefined
                                ? ''
                                : filters.hasAnalysis
                                  ? 'true'
                                  : 'false'
                        }
                        onChange={(e) =>
                            setFilters({
                                hasAnalysis:
                                    e.target.value === '' ? undefined : e.target.value === 'true',
                            })
                        }
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                        <option value="">All Jobs</option>
                        <option value="true">With AI Analysis</option>
                        <option value="false">Without AI Analysis</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

            {/* Jobs List */}
            <div className="space-y-4">
                {jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        isExpanded={expandedJob === job.id}
                        onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        onStatusChange={handleStatusChange}
                        onAnalyze={handleAnalyze}
                        onDelete={deleteJob}
                        isAnalyzing={analyzingJobs.has(job.id)}
                        defaultMethod={aiMethod}
                    />
                ))}

                {!loading && jobs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No jobs found</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Run a search from your profiles to find jobs
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function JobCard({
    job,
    isExpanded,
    onToggle,
    onStatusChange,
    onAnalyze,
    onDelete,
    isAnalyzing,
    defaultMethod,
}: {
    job: JobWithAnalysis
    isExpanded: boolean
    onToggle: () => void
    onStatusChange: (jobId: string, status: JobStatus) => void
    onAnalyze: (jobId: string, method?: AIAnalysisMethod) => void
    onDelete: (jobId: string) => void
    isAnalyzing: boolean
    defaultMethod: AIAnalysisMethod
}) {
    const {updateDescription} = useJobStore()
    const [showDropdown, setShowDropdown] = useState(false)
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [descriptionText, setDescriptionText] = useState(job.description || '')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSaveDescription = async () => {
        try {
            await updateDescription(job.id, descriptionText)
            setIsEditingDescription(false)
        } catch (err) {
            console.error('Failed to update description:', err)
            alert('Failed to update description')
        }
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                {job.title}
                            </h3>
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[job.status]}`}>
                                {job.status}
                            </span>
                            {job.provider && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                    {job.provider === 'serpapi'
                                        ? 'SerpAPI'
                                        : job.provider === 'glassdoor'
                                          ? 'Glassdoor'
                                          : job.provider}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            {job.company} • {job.location}
                        </p>
                        {job.source && (
                            <p className="mt-1 text-xs text-gray-400">via {job.source}</p>
                        )}
                        {job.posted_date && (
                            <p className="mt-1 text-xs text-gray-500">Posted: {job.posted_date}</p>
                        )}
                    </div>

                    {/* Match Score */}
                    {job.analysis && (
                        <div className="ml-4 flex-shrink-0">
                            <div
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    job.analysis.match_score >= 70
                                        ? 'bg-green-100 text-green-800'
                                        : job.analysis.match_score >= 40
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                }`}>
                                {job.analysis.match_score}% Match
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>

                        {isEditingDescription ? (
                            <div className="space-y-2">
                                <textarea
                                    value={descriptionText}
                                    onChange={(e) => setDescriptionText(e.target.value)}
                                    className="w-full h-48 p-2 border border-gray-300 rounded-md text-sm font-sans"
                                    placeholder="Paste job description here..."
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleSaveDescription()
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsEditingDescription(false)
                                            setDescriptionText(job.description || '')
                                        }}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : job.description ? (
                            <div>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {job.description}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-3">
                                    Job description is not available from the search results. Please
                                    use the &quot;Apply&quot; button below to view full job details
                                    on the employer&apos;s website.
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsEditingDescription(true)
                                    }}
                                    className="text-sm text-blue-600 hover:underline">
                                    Paste description manually
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Analysis */}
                    {job.analysis && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                AI Analysis - {job.analysis.recommendation}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-green-700 mb-1">
                                        Strengths
                                    </p>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {JSON.parse(job.analysis.strengths || '[]').map(
                                            (s: string, i: number) => (
                                                <li key={i}>{s}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-red-700 mb-1">Gaps</p>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {JSON.parse(job.analysis.gaps || '[]').map(
                                            (g: string, i: number) => (
                                                <li key={i}>{g}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            </div>
                            {job.analysis.reasoning && (
                                <p className="mt-3 text-sm text-gray-600 italic">
                                    {job.analysis.reasoning}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <select
                                value={job.status}
                                onChange={(e) =>
                                    onStatusChange(job.id, e.target.value as JobStatus)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm rounded-md border-gray-300">
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {!job.analysis && (
                                <div className="relative" ref={dropdownRef}>
                                    <div className="inline-flex rounded-md shadow-sm">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (job.description) {
                                                    onAnalyze(job.id)
                                                }
                                            }}
                                            disabled={isAnalyzing || !job.description}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-l-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                                            {isAnalyzing ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Analyzing...</span>
                                                </>
                                            ) : (
                                                <span>
                                                    Analyze (
                                                    {defaultMethod === 'api' ? 'Cloud' : 'Local'})
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!job.description) return
                                                setShowDropdown(!showDropdown)
                                            }}
                                            disabled={isAnalyzing || !job.description}
                                            className="px-2 py-1 text-sm bg-blue-600 text-white rounded-r-md border-l border-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    {showDropdown && (
                                        <div className="absolute left-0 bottom-full mb-1 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setShowDropdown(false)
                                                    onAnalyze(job.id, 'api')
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md">
                                                Analyze (Cloud)
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setShowDropdown(false)
                                                    onAnalyze(job.id, 'local')
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md">
                                                Analyze (Local)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {job.apply_link && (
                                <a
                                    href={job.apply_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                                    Apply
                                </a>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Delete this job?')) {
                                    onDelete(job.id)
                                }
                            }}
                            className="text-sm text-red-600 hover:text-red-800">
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
