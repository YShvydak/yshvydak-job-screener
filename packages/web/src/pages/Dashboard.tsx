import {useEffect} from 'react'
import {Link} from 'react-router-dom'
import {useJobStore} from '../stores/jobStore'
import {useProfileStore} from '../stores/profileStore'
import {useSettingsStore} from '../stores/settingsStore'

export function Dashboard() {
    const {stats, fetchStats} = useJobStore()
    const {profiles, fetchProfiles} = useProfileStore()
    const {hasCV, fetchCV} = useSettingsStore()

    useEffect(() => {
        fetchStats()
        fetchProfiles()
        fetchCV()
    }, [])

    const activeProfiles = profiles.filter((p) => p.active === 1)

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="mt-1 text-gray-600">Overview of your job search activity</p>
            </div>

            {/* Setup Status */}
            {!hasCV && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="text-yellow-600 text-xl mr-3">!</span>
                        <div>
                            <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                            <p className="mt-1 text-sm text-yellow-700">
                                Upload your CV in{' '}
                                <Link to="/settings" className="underline font-medium">
                                    Settings
                                </Link>{' '}
                                to enable AI job matching.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total Jobs" value={stats.total} color="gray" />
                <StatCard label="New" value={stats.new} color="blue" />
                <StatCard label="Saved" value={stats.saved} color="green" />
                <StatCard label="Applied" value={stats.applied} color="purple" />
                <StatCard label="Rejected" value={stats.rejected} color="red" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Profiles */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Active Search Profiles
                        </h3>
                        <Link to="/profiles" className="text-sm text-blue-600 hover:text-blue-800">
                            Manage
                        </Link>
                    </div>
                    {activeProfiles.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                            No active profiles.{' '}
                            <Link to="/profiles" className="text-blue-600">
                                Create one
                            </Link>
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {activeProfiles.slice(0, 3).map((profile) => (
                                <li
                                    key={profile.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div>
                                        <p className="font-medium text-gray-900">{profile.name}</p>
                                        <p className="text-sm text-gray-500">{profile.location}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="space-y-3">
                        <Link
                            to="/jobs"
                            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md text-center font-medium hover:bg-blue-700 transition-colors">
                            View Jobs
                        </Link>
                        <Link
                            to="/profiles"
                            className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-md text-center font-medium hover:bg-gray-200 transition-colors">
                            Create Search Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    color,
}: {
    label: string
    value: number
    color: 'gray' | 'blue' | 'green' | 'purple' | 'red'
}) {
    const colors = {
        gray: 'bg-gray-100 text-gray-800',
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        purple: 'bg-purple-100 text-purple-800',
        red: 'bg-red-100 text-red-800',
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
        </div>
    )
}
