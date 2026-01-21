import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function Settings() {
    const { cvContent, hasCV, loading, error, fetchCV, saveCV, deleteCV } = useSettingsStore();
    const [editingCV, setEditingCV] = useState(false);
    const [cvText, setCvText] = useState('');

    useEffect(() => {
        fetchCV();
    }, []);

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
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">SerpAPI</p>
                                <p className="text-sm text-gray-500">Job search API</p>
                            </div>
                            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                                Requires API Key
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900">Google Gemini</p>
                                <p className="text-sm text-gray-500">AI job analysis</p>
                            </div>
                            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                                Requires API Key
                            </span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        API keys are configured in the server's .env file.
                    </p>
                </div>
            </div>
        </div>
    );
}
