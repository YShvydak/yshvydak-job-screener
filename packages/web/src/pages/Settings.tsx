import { useEffect, useState } from 'react';
import { AIAnalysisMethod } from '@yshvydak-job-screener/shared';
import { useSettingsStore } from '../stores/settingsStore';
import * as api from '../api/client';

interface APIStatus {
    serpapi: {
        configured: boolean;
        name: string;
        description: string;
    };
    gemini: {
        configured: boolean;
        name: string;
        description: string;
    };
}

export function Settings() {
    const { cvContent, hasCV, aiMethod, loading, error, fetchCV, saveCV, deleteCV, fetchAIMethod, setAIMethod } = useSettingsStore();
    const [editingCV, setEditingCV] = useState(false);
    const [cvText, setCvText] = useState('');
    const [clearingJobs, setClearingJobs] = useState(false);
    const [clearJobsError, setClearJobsError] = useState<string | null>(null);
    const [clearJobsMessage, setClearJobsMessage] = useState<string | null>(null);
    const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);
    const [loadingApiStatus, setLoadingApiStatus] = useState(true);

    useEffect(() => {
        fetchCV();
        fetchAIMethod();
        fetchAPIStatus();
    }, []);

    const fetchAPIStatus = async () => {
        setLoadingApiStatus(true);
        try {
            const data = await api.get<{ status: APIStatus }>('/settings/api-status');
            setApiStatus(data.status);
        } catch (err) {
            console.error('Failed to fetch API status:', err);
        } finally {
            setLoadingApiStatus(false);
        }
    };

    useEffect(() => {
        setCvText(cvContent);
    }, [cvContent]);

    const handleSaveCV = async () => {
        try {
            await saveCV(cvText);
            setEditingCV(false);
        } catch {
            // Error handled in store
        }
    };

    const handleDeleteCV = async () => {
        if (confirm('Delete your CV? This will disable AI job matching.')) {
            try {
                await deleteCV();
            } catch {
                // Error handled in store
            }
        }
    };

    const handleClearJobs = async () => {
        if (!confirm('Delete all jobs? This cannot be undone.')) {
            return;
        }

        setClearingJobs(true);
        setClearJobsError(null);
        setClearJobsMessage(null);
        try {
            await api.del('/jobs');
            setClearJobsMessage('All jobs have been deleted.');
        } catch (err) {
            setClearJobsError((err as Error).message);
        } finally {
            setClearingJobs(false);
        }
    };

    const handleAIMethodChange = async (method: AIAnalysisMethod) => {
        try {
            await setAIMethod(method);
        } catch {
            // Error handled in store
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="mt-1 text-gray-600">
                    Configure your job screener
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* CV Section */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                CV / Resume
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Your CV is used by AI to analyze job matches. Paste your CV text below.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {hasCV && (
                                <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                                    CV Uploaded
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {editingCV ? (
                        <div className="space-y-4">
                            <textarea
                                value={cvText}
                                onChange={(e) => setCvText(e.target.value)}
                                rows={20}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Paste your CV/resume text here..."
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setCvText(cvContent);
                                        setEditingCV(false);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCV}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save CV'}
                                </button>
                            </div>
                        </div>
                    ) : hasCV ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                    {cvContent}
                                </pre>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleDeleteCV}
                                    className="px-4 py-2 text-red-600 hover:text-red-800"
                                >
                                    Delete CV
                                </button>
                                <button
                                    onClick={() => setEditingCV(true)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Edit CV
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">
                                No CV uploaded yet. Upload your CV to enable AI job matching.
                            </p>
                            <button
                                onClick={() => setEditingCV(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add CV
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Analysis Method */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        AI Analysis Method
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Choose how job analysis is performed
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="aiMethod"
                            value="api"
                            checked={aiMethod === 'api'}
                            onChange={() => handleAIMethodChange('api')}
                            disabled={loading}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <p className="font-medium text-gray-900">Cloud API</p>
                            <p className="text-sm text-gray-500">
                                Use Google Gemini API (requires GEMINI_API_KEY in .env)
                            </p>
                        </div>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="aiMethod"
                            value="local"
                            checked={aiMethod === 'local'}
                            onChange={() => handleAIMethodChange('local')}
                            disabled={loading}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <p className="font-medium text-gray-900">Local CLI</p>
                            <p className="text-sm text-gray-500">
                                Use local Gemini CLI (requires 'gemini' command installed)
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* API Status */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        API Status
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        External API connections status
                    </p>
                </div>
                <div className="p-6">
                    {loadingApiStatus ? (
                        <div className="text-center py-4 text-gray-500">Loading API status...</div>
                    ) : apiStatus ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">{apiStatus.serpapi.name}</p>
                                    <p className="text-sm text-gray-500">{apiStatus.serpapi.description}</p>
                                </div>
                                <span className={`px-3 py-1 text-sm rounded-full ${apiStatus.serpapi.configured
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {apiStatus.serpapi.configured ? 'Configured' : 'Requires API Key'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-gray-900">{apiStatus.gemini.name}</p>
                                    <p className="text-sm text-gray-500">{apiStatus.gemini.description}</p>
                                </div>
                                <span className={`px-3 py-1 text-sm rounded-full ${apiStatus.gemini.configured
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {apiStatus.gemini.configured ? 'Configured' : 'Requires API Key'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-red-500">Failed to load API status</div>
                    )}
                    <p className="mt-4 text-sm text-gray-500">
                        API keys are configured in the server's .env file.
                    </p>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow border border-red-200">
                <div className="p-6 border-b border-red-100">
                    <h3 className="text-lg font-medium text-red-700">
                        Danger Zone
                    </h3>
                    <p className="mt-1 text-sm text-red-600">
                        This action is irreversible.
                    </p>
                </div>
                <div className="p-6 space-y-3">
                    {clearJobsError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {clearJobsError}
                        </div>
                    )}
                    {clearJobsMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                            {clearJobsMessage}
                        </div>
                    )}
                    <button
                        onClick={handleClearJobs}
                        disabled={clearingJobs}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {clearingJobs ? 'Clearing Jobs...' : 'Delete All Jobs'}
                    </button>
                </div>
            </div>
        </div>
    );
}
