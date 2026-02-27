'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BackupPage() {
    const searchParams = useSearchParams();
    const [repository, setRepository] = useState('');
    const [source, setSource] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        snapshotId?: string;
    } | null>(null);
    const [initMode, setInitMode] = useState(false);

    useEffect(() => {
        const qr = searchParams.get('repo');
        if (qr) setRepository(qr);
        const init = searchParams.get('init');
        if (init === 'true') setInitMode(true);
    }, [searchParams]);

    const openNativePicker = async (target: 'repo' | 'source') => {
        setBrowsing(true);
        try {
            const res = await fetch('/api/plakar/pick-folder');
            const data = await res.json();
            if (data.success && data.path) {
                if (target === 'repo') setRepository(data.path);
                else setSource(data.path);
            }
        } catch { /* cancelled */ }
        setBrowsing(false);
    };

    const handleCreateRepo = async () => {
        if (!repository || !passphrase) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/plakar/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, passphrase }),
            });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error });
        } catch {
            setResult({ success: false, message: 'Network error.' });
        }
        setLoading(false);
    };

    const handleBackup = async () => {
        if (!repository || !source || !passphrase) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/plakar/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository, source, passphrase }),
            });
            const data = await res.json();
            setResult({
                success: data.success,
                message: data.message || data.error,
                snapshotId: data.snapshotId,
            });
        } catch {
            setResult({ success: false, message: 'Network error.' });
        }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                    Manage Your <span className="text-gradient">Backups</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    Secure, encrypted, and efficient snapshots for your local data.
                </p>
            </div>

            {/* Alert */}
            {result && (
                <div
                    className={`rounded-md p-4 border shadow-sm mb-6 flex items-start gap-3 ${result.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
                        }`}
                >
                    <span className={`material-icons-round ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                        {result.success ? 'check_circle' : 'error'}
                    </span>
                    <div className="flex-1">
                        <h3 className={`text-sm font-medium ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            {result.success ? 'Success!' : 'Error'}
                        </h3>
                        <p className={`mt-1 text-sm ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {result.message}
                            {result.snapshotId && (
                                <> — Snapshot ID: <span className="font-mono font-bold">{result.snapshotId}</span></>
                            )}
                        </p>
                    </div>
                    <button onClick={() => setResult(null)} className={`p-1 rounded hover:bg-opacity-20 ${result.success ? 'text-green-500 hover:bg-green-500' : 'text-red-500 hover:bg-red-500'}`}>
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Main card */}
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Mode toggle */}
                <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2">
                    <div className="flex p-1 space-x-1 bg-slate-200 dark:bg-slate-900 rounded-lg max-w-md mx-auto">
                        <button
                            onClick={() => setInitMode(false)}
                            className={`flex-1 rounded-md py-2 text-sm font-medium flex justify-center items-center gap-2 transition-all duration-200 ${!initMode
                                ? 'text-white bg-indigo-500 shadow-sm'
                                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className="material-icons-round text-base">backup</span>
                            Run Backup
                        </button>
                        <button
                            onClick={() => setInitMode(true)}
                            className={`flex-1 rounded-md py-2 text-sm font-medium flex justify-center items-center gap-2 transition-all duration-200 ${initMode
                                ? 'text-white bg-indigo-500 shadow-sm'
                                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className="material-icons-round text-base">create_new_folder</span>
                            Initialize Repository
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8 space-y-6">
                    {/* Repository input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Repository Location
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-icons-round text-slate-400 text-lg">dns</span>
                                </div>
                                <input
                                    type="text"
                                    value={repository}
                                    onChange={(e) => setRepository(e.target.value)}
                                    placeholder="e.g. C:\Users\You\Desktop\MyBackups"
                                    className="block w-full rounded-l-md pl-10 py-3 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                onClick={() => openNativePicker('repo')}
                                disabled={browsing}
                                className="-ml-px inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-r-md text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-icons-round text-lg">folder_open</span>
                                Browse
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Local path where snapshots are stored.
                        </p>
                    </div>

                    {/* Source input */}
                    {!initMode && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Source to Backup
                            </label>
                            <div className="flex rounded-md shadow-sm">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-round text-slate-400 text-lg">source</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        placeholder="e.g. C:\Users\You\Documents"
                                        className="block w-full rounded-l-md pl-10 py-3 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={() => openNativePicker('source')}
                                    disabled={browsing}
                                    className="-ml-px inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-r-md text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-icons-round text-lg">folder_open</span>
                                    Browse
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Passphrase input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Encryption Passphrase
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-round text-slate-400 text-lg">lock</span>
                            </div>
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="block w-full pl-10 pr-10 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <span className="material-icons-round text-lg">
                                    {showPass ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                            <span className="material-icons-round text-xs">info</span>
                            {initMode
                                ? 'Create a strong passphrase. You will need it for all future operations!'
                                : 'Required to unlock the repository for writing.'}
                        </p>
                    </div>

                    {/* Submit button */}
                    <div className="pt-4">
                        <button
                            onClick={initMode ? handleCreateRepo : handleBackup}
                            disabled={loading || !repository || !passphrase || (!initMode && !source)}
                            className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner mr-2" />
                                    {initMode ? 'Initializing...' : 'Backing up...'}
                                </>
                            ) : (
                                <>
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        <span className="material-icons-round">
                                            {initMode ? 'create_new_folder' : 'backup'}
                                        </span>
                                    </span>
                                    {initMode ? 'Initialize Repository' : 'Run Backup Now'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer bar */}
                <div className="bg-slate-50 dark:bg-slate-800/80 px-8 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Local Mode
                    </div>
                    <div>Plakar Dashboard</div>
                </div>
            </div>
        </div>
    );
}
