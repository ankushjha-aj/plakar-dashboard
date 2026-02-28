'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

type OSType = 'windows' | 'macos' | 'linux';

function BackupPageContent() {
    const [detectedOS, setDetectedOS] = useState<OSType>('windows');
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
        fetch('/api/plakar/status').then(r => r.json()).then(d => { if (d.os) setDetectedOS(d.os); }).catch(() => { });
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
        setLoading(true); setResult(null);
        try {
            const res = await fetch('/api/plakar/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository, passphrase }) });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error });
        } catch { setResult({ success: false, message: 'Network error.' }); }
        setLoading(false);
    };

    const handleBackup = async () => {
        if (!repository || !source || !passphrase) return;
        setLoading(true); setResult(null);
        try {
            const res = await fetch('/api/plakar/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository, source, passphrase }) });
            const data = await res.json();
            setResult({ success: data.success, message: data.message || data.error, snapshotId: data.snapshotId });
        } catch { setResult({ success: false, message: 'Network error.' }); }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Hero header */}
            <div className="text-center mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-bold text-indigo-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        {initMode ? 'Initialize Mode' : 'Backup Mode'}
                    </div>
                    <ThemeToggle />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    {initMode ? 'Initialize ' : 'Manage Your '}
                    <span className="text-gradient">{initMode ? 'Repository' : 'Backups'}</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {initMode ? 'Create a new encrypted repository for your data.' : 'Secure, encrypted, and efficient snapshots for your files.'}
                </p>
            </div>

            {/* Alert */}
            {result && (
                <div className={`glass-card rounded-xl p-5 mb-6 flex items-start gap-3 animate-fade-in-scale ${result.success ? 'border-emerald-500/30' : 'border-red-500/30'}`} style={{ borderWidth: '1px' }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${result.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        <span className="material-icons-round">{result.success ? 'check_circle' : 'error'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold ${result.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.success ? 'Success!' : 'Error'}
                        </h3>
                        <p className={`text-sm mt-0.5 ${result.success ? 'text-emerald-700/70 dark:text-emerald-300/70' : 'text-red-700/70 dark:text-red-300/70'}`}>
                            {result.message}
                            {result.snapshotId && <> — Snapshot: <span className="font-mono font-bold">{result.snapshotId}</span></>}
                        </p>
                    </div>
                    <button onClick={() => setResult(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        <span className="material-icons-round text-sm text-slate-400">close</span>
                    </button>
                </div>
            )}

            {/* Main form card */}
            <div className="gradient-border rounded-2xl">
                <div className="relative z-10">
                    {/* Mode toggle */}
                    <div className="p-3 border-b border-slate-200/30 dark:border-white/5">
                        <div className="flex p-1 space-x-1 glass-card rounded-xl max-w-md mx-auto">
                            <button onClick={() => setInitMode(false)}
                                className={`flex-1 rounded-lg py-2.5 text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 cursor-pointer ${!initMode ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                <span className="material-icons-round text-base">backup</span> Run Backup
                            </button>
                            <button onClick={() => setInitMode(true)}
                                className={`flex-1 rounded-lg py-2.5 text-sm font-bold flex justify-center items-center gap-2 transition-all duration-300 cursor-pointer ${initMode ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                <span className="material-icons-round text-base">create_new_folder</span> Initialize Repo
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 space-y-6">
                        {/* Repository input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                <span className="w-6 h-6 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                                    <span className="material-icons-round text-indigo-500 text-sm">dns</span>
                                </span>
                                Repository Location
                            </label>
                            <div className="flex rounded-xl overflow-hidden glass-card">
                                <input type="text" value={repository} onChange={(e) => setRepository(e.target.value)}
                                    placeholder={detectedOS === 'windows' ? 'e.g. C:\\Users\\You\\Desktop\\MyBackups' : 'e.g. ~/Desktop/MyBackups'}
                                    className="flex-1 px-4 py-3.5 text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:ring-0 focus:outline-none placeholder:text-slate-400"
                                />
                                <button onClick={() => openNativePicker('repo')} disabled={browsing}
                                    className="px-5 text-sm font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 border-l border-slate-200/30 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors flex items-center gap-2 cursor-pointer">
                                    <span className="material-icons-round text-lg">folder_open</span> Browse
                                </button>
                            </div>
                        </div>

                        {/* Source input */}
                        {!initMode && (
                            <div className="animate-fade-in-up">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                    <span className="w-6 h-6 rounded-md bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                                        <span className="material-icons-round text-purple-500 text-sm">source</span>
                                    </span>
                                    Source to Backup
                                </label>
                                <div className="flex rounded-xl overflow-hidden glass-card">
                                    <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
                                        placeholder={detectedOS === 'windows' ? 'e.g. C:\\Users\\You\\Documents' : 'e.g. ~/Documents'}
                                        className="flex-1 px-4 py-3.5 text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:ring-0 focus:outline-none placeholder:text-slate-400"
                                    />
                                    <button onClick={() => openNativePicker('source')} disabled={browsing}
                                        className="px-5 text-sm font-bold text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 border-l border-slate-200/30 dark:border-white/5 hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors flex items-center gap-2 cursor-pointer">
                                        <span className="material-icons-round text-lg">folder_open</span> Browse
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Passphrase input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                <span className="w-6 h-6 rounded-md bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                    <span className="material-icons-round text-amber-500 text-sm">lock</span>
                                </span>
                                Encryption Passphrase
                            </label>
                            <div className="relative rounded-xl overflow-hidden glass-card">
                                <input type={showPass ? 'text' : 'password'} value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="block w-full px-4 pr-12 py-3.5 text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:ring-0 focus:outline-none placeholder:text-slate-400"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                                    <span className="material-icons-round text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1.5 font-medium">
                                <span className="material-icons-round text-xs">info</span>
                                {initMode ? 'Create a strong passphrase. You will need it for all future operations!' : 'Required to unlock the repository for writing.'}
                            </p>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button onClick={initMode ? handleCreateRepo : handleBackup}
                                disabled={loading || !repository || !passphrase || (!initMode && !source)}
                                className="btn-glow w-full flex justify-center py-4 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-indigo-500/30 cursor-pointer">
                                {loading ? (
                                    <><span className="spinner mr-2" />{initMode ? 'Initializing...' : 'Backing up...'}</>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <span className="material-icons-round text-lg">{initMode ? 'create_new_folder' : 'backup'}</span>
                                        {initMode ? 'Initialize Repository' : 'Run Backup Now'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-slate-200/30 dark:border-white/5 flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                            Local Mode
                        </div>
                        <div className="text-gradient font-bold">Plakar Dashboard</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BackupPage() {
    return (
        <Suspense fallback={<div className="animate-pulse text-center py-20 text-slate-400">Loading...</div>}>
            <BackupPageContent />
        </Suspense>
    );
}
