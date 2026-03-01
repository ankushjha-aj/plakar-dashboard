'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

    // Repositories fetched from Plakar
    const [knownRepos, setKnownRepos] = useState<{ name: string, path: string }[]>([]);

    // Recent source paths from local storage
    const [recentSources, setRecentSources] = useState<string[]>([]);

    // Previous backup tracking
    const [lastBackupInfo, setLastBackupInfo] = useState<{ lastBackup: string; snapshotCount: number } | null>(null);

    useEffect(() => {
        const qr = searchParams.get('repo');
        if (qr) setRepository(qr);
        fetch('/api/plakar/status').then(r => r.json()).then(d => { if (d.os) setDetectedOS(d.os); }).catch(() => { });

        // Fetch known repositories to populate the dropdown
        fetch('/api/plakar/repos')
            .then(r => r.json())
            .then(d => {
                if (d.repos) {
                    setKnownRepos(d.repos);
                }
            })
            .catch(() => { });

        // Load recent sources from local storage
        try {
            const saved = localStorage.getItem('plakarRecentSources');
            if (saved) {
                setRecentSources(JSON.parse(saved));
            }
        } catch (e) { }
    }, [searchParams]);

    // Fetch backup history when source/repository change
    useEffect(() => {
        if (!source || !repository) {
            setLastBackupInfo(null);
            return;
        }
        fetch(`/api/plakar/backup-history?repo=${encodeURIComponent(repository)}`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.history) {
                    const match = d.history.find((h: { sourcePath: string }) => h.sourcePath === source);
                    if (match) {
                        setLastBackupInfo({ lastBackup: match.lastBackup, snapshotCount: match.snapshots.length });
                    } else {
                        setLastBackupInfo(null);
                    }
                }
            })
            .catch(() => setLastBackupInfo(null));
    }, [source, repository]);

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

    const handleBackup = async () => {
        if (!repository || !source || !passphrase) return;
        setLoading(true); setResult(null);
        try {
            const res = await fetch('/api/plakar/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository, source, passphrase }) });
            const data = await res.json();
            const folderName = source.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || source;

            if (data.success) {
                // Save successful source path to local storage
                try {
                    const updated = [source, ...recentSources.filter(s => s !== source)].slice(0, 5);
                    localStorage.setItem('plakarRecentSources', JSON.stringify(updated));
                    setRecentSources(updated);
                } catch (e) { }

                // Save backup history to server
                try {
                    await fetch('/api/plakar/backup-history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ repository, sourcePath: source, folderName, snapshotId: data.snapshotId })
                    });
                } catch (e) { }
            }

            setResult({
                success: data.success,
                message: data.success
                    ? `Backup successful — ${folderName} (Snapshot: ${data.snapshotId || 'unknown'})`
                    : data.message || data.error,
                snapshotId: data.snapshotId
            });

            // After success, reset all fields
            if (data.success) {
                setTimeout(() => {
                    setRepository('');
                    setSource('');
                    setPassphrase('');
                    setResult(null);
                    setLastBackupInfo(null);
                }, 3000);
            }
        } catch { setResult({ success: false, message: 'Network error.' }); }
        setLoading(false);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center pt-10 sm:pt-16 px-4">

            {/* Background watermark icon (shield) */}
            <div className="fixed -bottom-32 -right-32 opacity-[0.03] dark:opacity-[0.02] pointer-events-none z-0 text-slate-900 dark:text-white">
                <span className="material-icons-round" style={{ fontSize: '600px' }}>shield</span>
            </div>

            {/* Header */}
            <div className="text-center z-10 w-full mb-8">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1e2330] dark:text-white mb-2">
                    Manage Your Backups
                </h1>
                <p className="text-[#64748b] dark:text-slate-400 text-base sm:text-lg font-medium">
                    Secure, encrypted, and efficient snapshots for your files.
                </p>
            </div>

            {/* Main White Card */}
            <div className="bg-white dark:bg-[#0f172a] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/5 rounded-2xl w-full z-10 p-6 sm:p-8 relative">

                {/* Alert Notification */}
                {result && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'} dark:bg-transparent dark:border-opacity-20`}>
                        <span className="material-icons-round mt-0.5">{result.success ? 'check_circle' : 'error'}</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold">{result.success ? 'Success!' : 'Error'}</h3>
                            <p className="text-sm opacity-90">
                                {result.message}
                                {result.snapshotId && <> — Snapshot: <span className="font-mono font-bold">{result.snapshotId}</span></>}
                            </p>
                        </div>
                        <button onClick={() => setResult(null)} className="opacity-50 hover:opacity-100">
                            <span className="material-icons-round text-sm">close</span>
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Repository Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                Repository Location
                            </label>
                            {/* Dashboard Selector */}
                            {knownRepos.length > 0 && (
                                <select
                                    className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-0 rounded-md py-1 px-2 cursor-pointer focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%204L9%201%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-0.5rem)_center] pr-6"
                                    onChange={(e) => {
                                        if (e.target.value) setRepository(e.target.value);
                                        e.target.value = ""; // Reset selector
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select from Dashboard...</option>
                                    {knownRepos.map(r => (
                                        <option key={r.path} value={r.path}>{r.name} ({r.path})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <input
                                type="text"
                                value={repository}
                                onChange={(e) => setRepository(e.target.value)}
                                placeholder={detectedOS === 'windows' ? 'C:\\SecureVault\\PlakarBackups' : '/Volumes/SecureVault/PlakarBackups'}
                                className="flex-1 px-4 py-3 border-0 text-[14px] text-slate-800 dark:text-slate-200 bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium font-mono"
                            />
                            <button
                                onClick={() => openNativePicker('repo')}
                                disabled={browsing}
                                className="bg-[#f8fafc] dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 w-14 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                                title="Browse Native Folders"
                            >
                                <span className="material-icons-round text-[20px]">folder</span>
                            </button>
                        </div>
                    </div>

                    {/* Source Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                Source to Backup
                            </label>
                            {/* Recent Sources Selector */}
                            {recentSources.length > 0 && (
                                <select
                                    className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-0 rounded-md py-1 px-2 cursor-pointer focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%204L9%201%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-0.5rem)_center] pr-6"
                                    onChange={(e) => {
                                        if (e.target.value) setSource(e.target.value);
                                        e.target.value = ""; // Reset selector
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Recent Sources...</option>
                                    {recentSources.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <input
                                type="text"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder={detectedOS === 'windows' ? 'C:\\Documents\\Work\\Projects' : '~/Documents/Work/Projects'}
                                className="flex-1 px-4 py-3 border-0 text-[14px] text-slate-800 dark:text-slate-200 bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium font-mono"
                            />
                            <button
                                onClick={() => openNativePicker('source')}
                                disabled={browsing}
                                className="bg-[#f8fafc] dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 w-14 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                <span className="material-icons-round text-[20px]">pie_chart</span>
                            </button>
                        </div>
                    </div>

                    {/* Previously Backed Up Notice */}
                    {lastBackupInfo && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-icons-round text-amber-500 mt-0.5">history</span>
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Previously Backed Up</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-0.5">
                                    This folder was last backed up on <strong>{new Date(lastBackupInfo.lastBackup).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> ({lastBackupInfo.snapshotCount} snapshot{lastBackupInfo.snapshotCount !== 1 ? 's' : ''} total).
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400/60 mt-1.5 flex items-center gap-1">
                                    <span className="material-icons-round text-[14px]">storage</span>
                                    Plakar uses deduplication — unchanged files won&apos;t consume extra storage. Only modified or new files will take additional space.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Passphrase Input */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Encryption Passphrase
                        </label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="••••••••••••"
                                className="flex-1 px-4 py-3 border-0 text-[14px] text-slate-800 dark:text-slate-200 bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="bg-white dark:bg-slate-900 w-14 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <span className="material-icons-round text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                        <p className="mt-2.5 text-[11px] font-medium text-[#94a3b8]">
                            Plakar never stores this passphrase. It is only held in memory during the backup process.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleBackup}
                            disabled={loading || !repository || !source || !passphrase}
                            className="w-full flex justify-center py-3.5 px-4 text-[15px] font-bold rounded-xl text-white bg-[#3f3fbb] hover:bg-[#343499] shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><span className="spinner border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin mr-2" />Running...</>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span className="material-icons-round text-[20px]">cloud_upload</span>
                                    Run Backup Now
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Status Indicators */}
            <div className="w-full px-2 py-4 flex justify-between items-center text-[12px] font-medium z-10">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    Local Mode: <span className="text-slate-800 dark:text-slate-200 font-bold">Active</span>
                </div>
                <Link href="/" className="text-[#3f3fbb] dark:text-indigo-400 hover:text-[#5252e1] dark:hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 group font-bold">
                    Plakar Dashboard
                    <span className="material-icons-round text-[14px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                </Link>
            </div>
        </div>
    );
}

export default function BackupPage() {
    return (
        <Suspense fallback={<div className="animate-pulse text-center py-20 text-slate-400 font-medium">Loading...</div>}>
            <BackupPageContent />
        </Suspense>
    );
}
