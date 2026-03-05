'use client';
import { useEffect, useState } from 'react';

interface StatusInfo {
    installed: boolean;
    version: string;
    path: string;
    os: 'windows' | 'macos' | 'linux';
    arch: string;
}

function PassphraseHintsList() {
    const [repos, setRepos] = useState<{ path: string; name: string; createdAt: string; hint?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPath, setEditingPath] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchRepos = async () => {
        try {
            const res = await fetch('/api/plakar/repos');
            const data = await res.json();
            if (data.repos) setRepos(data.repos);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchRepos();
    }, []);

    const handleSaveHint = async (path: string) => {
        try {
            await fetch('/api/plakar/repos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, hint: editValue })
            });
            fetchRepos();
            setEditingPath(null);
        } catch { }
    };

    if (loading) return <div className="p-6 text-sm text-slate-500">Loading repositories...</div>;
    if (repos.length === 0) return <div className="p-6 text-sm text-slate-500 text-center py-10 bg-slate-50 dark:bg-slate-900/50">No repositories found.</div>;

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {repos.map(repo => (
                <div key={repo.path} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                        <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                            {repo.name} <span className="text-xs font-normal text-slate-500 font-mono ml-2">({repo.path})</span>
                        </div>

                        {editingPath === repo.path ? (
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Enter a new passphrase hint..."
                                    className="flex-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5 px-3"
                                    maxLength={100}
                                />
                                <button
                                    onClick={() => handleSaveHint(repo.path)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingPath(null)}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="mt-2 text-sm">
                                {repo.hint ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            <strong className="text-slate-700 dark:text-slate-200">Hint:</strong> {repo.hint}
                                        </span>
                                        <button
                                            onClick={() => { setEditingPath(repo.path); setEditValue(repo.hint || ''); }}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 italic">No hint set.</span>
                                        <button
                                            onClick={() => { setEditingPath(repo.path); setEditValue(''); }}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                        >
                                            Add Hint
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/50 p-4 flex items-start gap-3">
                <span className="material-icons-round text-amber-500 text-[20px] mt-0.5">warning</span>
                <p className="text-[12px] text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                    Hints are stored on this machine in plain text to help jog your memory. If you completely forget your passphrase, your backup data <strong>cannot be recovered</strong>.
                </p>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [status, setStatus] = useState<StatusInfo | null>(null);

    useEffect(() => {
        fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    }, []);

    return (
        <div className="animate-fade-in-up w-full space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your Plakar configuration and preferences.</p>
            </div>

            {/* CLI Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <span className="material-icons-round">terminal</span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Plakar CLI Information</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Details about the detected command-line interface.</p>
                        </div>
                    </div>
                    {status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.installed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.installed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {status.installed ? 'Detected' : 'Not Found'}
                        </span>
                    )}
                </div>
                <div className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Version</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-icons-round text-slate-400 text-sm">tag</span>
                                </div>
                                <input readOnly value={status?.version || 'Loading...'} className="block w-full pl-10 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-mono py-2.5" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Architecture</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-icons-round text-slate-400 text-sm">memory</span>
                                </div>
                                <input readOnly value={status ? `${status.os}/${status.arch}` : 'Loading...'} className="block w-full pl-10 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-mono py-2.5" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Executable Path</label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 text-sm">$</span>
                            <input readOnly value={status?.path || 'Scanning...'} className="flex-1 block w-full px-3 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-mono" />
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">This is the binary currently being used by the dashboard for operations.</p>
                    </div>
                </div>

                {/* CLI Not Installed — Install Guidance */}
                {status && !status.installed && (
                    <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-900/10">
                        <div className="flex items-start gap-3">
                            <span className="material-icons-round text-amber-500 mt-0.5">warning</span>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">CLI Not Detected</h4>
                                <p className="text-sm text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
                                    {status.os === 'windows' && 'Download the PowerShell installer from the Dashboard page, or manually download from GitHub releases.'}
                                    {status.os === 'macos' && 'Install via Homebrew: brew install plakar — or download from GitHub releases.'}
                                    {status.os === 'linux' && 'Install via your package manager (apt/dnf) or download from GitHub releases.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Passphrase Hints */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <span className="material-icons-round">lightbulb</span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Passphrase Hints</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Manage optional hints to help you remember your passphrases.</p>
                        </div>
                    </div>
                </div>
                <div className="p-0">
                    <PassphraseHintsList />
                </div>
            </div>

            {/* About */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                            <span className="material-icons-round">info</span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">About Plakar</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Information about the project.</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-6">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        Plakar is a backup tool designed to be secure, fast, and easy to use. It allows you to create snapshots of your directories and files, which are deduplicated, compressed, and encrypted before being stored.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4 text-sm">
                        This dashboard provides a convenient interface to manage your Plakar repositories, browse snapshots, and restore files. It is an open-source project built with security and privacy in mind.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                                <svg className="h-6 w-6 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Open Source</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Contribute or view source on GitHub</p>
                            </div>
                        </div>
                        <a href="https://github.com/PlakarKorp/plakar" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors">
                            View Repository
                            <span className="material-icons-round text-sm ml-2">open_in_new</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
