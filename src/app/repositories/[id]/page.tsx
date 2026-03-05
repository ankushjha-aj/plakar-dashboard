'use client';
import { useState, useEffect, Suspense, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Snap { timestamp: string; snapshotId: string; size: string; duration: string; path: string; }
interface SnapFile { date: string; permissions: string; uid: string; gid: string; size: string; path: string; name: string; isDir: boolean; }

function RepoSnapshotsContent({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const repoPath = searchParams.get('path');

    // Unwrap params 
    const unwrappedParams = use(params);
    const rawId = unwrappedParams.id;
    const repoName = rawId.startsWith('snapshots-') ? decodeURIComponent(rawId.substring(10)) : decodeURIComponent(rawId);

    const [snapshots, setSnapshots] = useState<Snap[]>([]);
    const [passphrase, setPassphrase] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlockError, setUnlockError] = useState('');
    const [unlocking, setUnlocking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [deleteMsg, setDeleteMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Integrity Check
    const [checkingHealth, setCheckingHealth] = useState(false);
    const [healthStatus, setHealthStatus] = useState<'idle' | 'healthy' | 'error'>('idle');
    const [healthDetail, setHealthDetail] = useState('');

    // File Browser Modal
    const [fbOpen, setFbOpen] = useState(false);
    const [fbSnap, setFbSnap] = useState<Snap | null>(null);
    const [fbFiles, setFbFiles] = useState<SnapFile[]>([]);
    const [fbLoading, setFbLoading] = useState(false);
    const [fbError, setFbError] = useState('');
    const [fbBrowsePath, setFbBrowsePath] = useState('');
    const [fbSearch, setFbSearch] = useState('');
    const [fbPage, setFbPage] = useState(1);
    const fbPerPage = 50;
    const [fbDirMeta, setFbDirMeta] = useState<{ date: string; permissions: string; uid: string; gid: string }>({ date: '', permissions: '', uid: '', gid: '' });

    // If no repoPath is provided, redirect back to repositories
    useEffect(() => {
        if (!repoPath) {
            router.replace('/repositories');
            return;
        }
        // Auto-unlock if passphrase was passed from repositories page
        const storedPass = sessionStorage.getItem('plakarUnlockPass');
        if (storedPass && !isUnlocked) {
            sessionStorage.removeItem('plakarUnlockPass');
            setPassphrase(storedPass);
            // Auto-trigger unlock
            (async () => {
                setUnlocking(true);
                try {
                    const r = await fetch('/api/plakar/snapshots', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ repository: repoPath, passphrase: storedPass })
                    });
                    const d = await r.json();
                    if (d.success) {
                        const sorted = (d.snapshots || []).sort((a: Snap, b: Snap) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        setSnapshots(sorted);
                        setIsUnlocked(true);
                    } else {
                        setUnlockError(d.error || 'Wrong passphrase.');
                    }
                } catch {
                    setUnlockError('Network error.');
                }
                setUnlocking(false);
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoPath, router]);

    const performUnlock = async () => {
        if (!passphrase || !repoPath) return;
        setUnlocking(true);
        setUnlockError('');

        try {
            const r = await fetch('/api/plakar/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repoPath, passphrase })
            });
            const d = await r.json();

            if (d.success) {
                const sorted = (d.snapshots || []).sort((a: Snap, b: Snap) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setSnapshots(sorted);
                setIsUnlocked(true);
                setUnlockError('');
            } else {
                setUnlockError(d.error || 'Wrong passphrase or repository error.');
            }
        } catch {
            setUnlockError('Network error.');
        }
        setUnlocking(false);
    };

    const handleSearch = () => {
        setActiveSearch(searchQuery.toLowerCase());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!isUnlocked) {
                performUnlock();
            } else {
                handleSearch();
            }
        }
    };

    const openFileBrowser = async (snap: Snap, subPath = '') => {
        if (!repoPath) return;
        setFbSnap(snap); setFbFiles([]); setFbError(''); setFbOpen(true); setFbLoading(true); setFbBrowsePath(subPath); setFbSearch(''); setFbPage(1);
        try {
            const r = await fetch('/api/plakar/snapshot-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repoPath, snapshotId: snap.snapshotId, passphrase, subPath })
            });
            const d = await r.json();
            if (d.success) {
                setFbFiles(d.files);
                if (d.dirMeta) setFbDirMeta(d.dirMeta);
            }
            else setFbError(d.error || 'Failed to load files.');
        } catch { setFbError('Network error.'); }
        setFbLoading(false);
    };

    const browseTo = (dirPath: string) => {
        if (!fbSnap) return;
        setFbSearch('');
        setFbPage(1);
        openFileBrowser(fbSnap, dirPath);
    };

    const downloadFile = async (filePath: string) => {
        if (!fbSnap || !repoPath) return;
        try {
            const r = await fetch('/api/plakar/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repoPath, snapshotId: fbSnap.snapshotId, filePath, passphrase })
            });
            if (!r.ok) { const d = await r.json(); alert(d.error || 'Download failed.'); return; }
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filePath.split('/').pop() || 'file'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed.'); }
    };

    const handleDelete = async (snapId: string) => {
        if (!repoPath || !confirm(`Permanently delete snapshot ${snapId}?`)) return;
        try {
            const r = await fetch('/api/plakar/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: repoPath, snapshotId: snapId, passphrase }) });
            const d = await r.json();
            if (d.success) {
                setDeleteMsg(`Snapshot ${snapId} deleted.`);
                performUnlock(); // Refresh list silently
            } else setDeleteMsg(`Failed: ${d.message}`);
        } catch { setDeleteMsg('Network error.'); }
    };

    const handleCheckHealth = async () => {
        if (!repoPath) return;
        setCheckingHealth(true);
        setHealthStatus('idle');
        setHealthDetail('');

        try {
            const r = await fetch('/api/plakar/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repoPath, passphrase })
            });
            const d = await r.json();

            if (d.success || d.raw.toLowerCase().includes('ok') || d.raw.toLowerCase().includes('success')) {
                setHealthStatus('healthy');
                setHealthDetail('Repository integrity is fully verified. No corruption detected.');
            } else {
                setHealthStatus('error');
                setHealthDetail(d.error || d.raw || 'Integrity check failed with errors.');
            }
        } catch {
            setHealthStatus('error');
            setHealthDetail('Network error while running check.');
        }
        setCheckingHealth(false);
    };

    const filteredSnapshots = snapshots.filter(s => {
        if (!activeSearch) return true;
        return s.snapshotId.toLowerCase().includes(activeSearch) ||
            s.path.toLowerCase().includes(activeSearch) ||
            new Date(s.timestamp).toLocaleDateString().includes(activeSearch);
    });

    if (!repoPath) return null;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-[#090b14] p-4 sm:p-8 font-sans">
            <div className="relative z-10 w-full animate-fade-in-up">

                {isUnlocked && (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button onClick={() => router.push('/repositories')} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors">
                                    <span className="material-icons-round text-sm">arrow_back</span>
                                </button>
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-100 dark:border-indigo-400/20">REPOSITORY</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1e2330] dark:text-white mb-2">
                                {repoName}
                            </h1>
                            <p className="text-[#64748b] dark:text-slate-400 text-sm font-mono max-w-2xl break-all">
                                {repoPath}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search snapshots..."
                                    className="w-full pl-4 pr-11 py-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/60 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow placeholder:text-slate-400"
                                />
                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                    <button
                                        onClick={handleSearch}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-600 transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        <span className="material-icons-round text-[20px]">search</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {isUnlocked && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Repository Health</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Verify your backups are structurally sound and safe to restore.</p>

                            {healthStatus !== 'idle' && (
                                <div className={`mt-3 flex items-start gap-2 text-sm p-3 rounded-lg border ${healthStatus === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'}`}>
                                    <span className="material-icons-round text-[18px]">{healthStatus === 'healthy' ? 'check_circle' : 'error'}</span>
                                    <div>
                                        <p className="font-bold">{healthStatus === 'healthy' ? 'Healthy Repository' : 'Integrity Issues Detected'}</p>
                                        <p className="text-xs mt-0.5 opacity-80 whitespace-pre-wrap">{healthDetail}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleCheckHealth}
                            disabled={checkingHealth}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${checkingHealth ? 'bg-indigo-100 text-indigo-400 hidden-spin' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20'}`}
                        >
                            {checkingHealth ? (
                                <>
                                    <span className="spinner border-2 border-indigo-500/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full w-4 h-4 animate-spin" />
                                    Verifying Block Integrity...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round text-[18px]">health_and_safety</span>
                                    Verify Health
                                </>
                            )}
                        </button>
                    </div>
                )}

                {deleteMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in-scale">
                        <span className="material-icons-round text-emerald-500">info</span>
                        <span className="text-sm font-bold flex-1">{deleteMsg}</span>
                        <button onClick={() => setDeleteMsg('')} className="p-1 opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
                            <span className="material-icons-round text-sm">close</span>
                        </button>
                    </div>
                )}

                {!isUnlocked ? (
                    unlocking ? (
                        /* Auto-unlocking spinner — no form flash */
                        <div className="flex flex-col items-center justify-center py-32 animate-fade-in-up">
                            <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Unlocking repository...</span>
                        </div>
                    ) : (
                        <div className="max-w-[500px] mx-auto mt-12 mb-12 animate-fade-in-up">
                            {/* Back Link */}
                            <div className="mb-6 flex">
                                <button onClick={() => router.push('/repositories')} className="flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                    <span className="material-icons-round text-[16px]">arrow_back</span>
                                    Back to repository list
                                </button>
                            </div>

                            {/* Card */}
                            <div className="bg-white dark:bg-[#151c2f] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-[#e2e8f0] dark:border-slate-800 rounded-2xl overflow-hidden relative">
                                {/* Top Background Section */}
                                <div className="bg-slate-50/80 dark:bg-[#1a233a] py-14 flex justify-center items-center">
                                    {/* Lock icon circle */}
                                    <div className="w-[60px] h-[60px] bg-white dark:bg-[#232e4a] rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100/50 dark:border-slate-700/50 relative z-10 transition-transform hover:scale-105">
                                        <span className="material-icons-round text-[28px]">lock</span>
                                    </div>
                                </div>

                                {/* Divider line under header in light mode (simulated) */}
                                <div className="h-[1px] w-full bg-[#f1f5f9] dark:bg-slate-800"></div>

                                {/* Bottom Content Section */}
                                <div className="px-10 py-8 text-center bg-white dark:bg-[#111827]">
                                    <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-3">Repository Locked</h2>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                        Access to <span className="font-bold text-slate-700 dark:text-slate-300 mx-1">{repoName}</span> / <span className="font-bold text-slate-700 dark:text-slate-300 mx-1 break-all">{repoPath}</span> requires authorization.
                                    </p>

                                    <div className="text-left mb-7">
                                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 font-sans tracking-wide">Passphrase</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={passphrase}
                                                onChange={e => setPassphrase(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Enter your repository passphrase"
                                                className="w-full pl-4 pr-12 py-3 bg-[#f8fafc] dark:bg-slate-900/50 border border-[#e2e8f0] dark:border-slate-800/80 rounded-[10px] text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                title="Toggle visibility"
                                            >
                                                <span className="material-icons-round text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                            </button>

                                            {unlockError && (
                                                <div className="absolute -bottom-6 left-0 text-[11px] text-red-500 font-bold flex items-center gap-1 animate-fade-in-up">
                                                    <span className="material-icons-round text-[12px]">error</span>
                                                    {unlockError}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={performUnlock}
                                        disabled={unlocking || !passphrase}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[10px] text-sm transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 mb-6 shadow-sm cursor-pointer"
                                    >
                                        {unlocking ? <span className="spinner border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin" /> : (
                                            <>
                                                <span className="material-icons-round text-[18px]">lock</span>
                                                Unlock Repository
                                            </>
                                        )}
                                    </button>

                                    <div className="bg-[#f8fafc] dark:bg-slate-800/50 py-2.5 rounded-[10px] flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-icons-round text-[15px] opacity-80">verified_user</span>
                                        <span className="text-[12px] font-semibold tracking-wide">End-to-end encrypted storage</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    /* Unlocked State - Snapshots List */
                    <div className="bg-white dark:bg-[#0f172a] shadow-[0_2px_20px_-5px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden animate-fade-in-up">
                        {filteredSnapshots.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                                    <span className="material-icons-round text-3xl">inbox</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                                    {activeSearch ? 'No snapshots found' : 'No snapshots yet'}
                                </h3>
                                <p className="text-slate-500 text-sm max-w-sm">
                                    {activeSearch
                                        ? "We couldn't find any snapshots matching your search query."
                                        : "This repository doesn't have any snapshots. Run a backup to get started."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-[#f8fafc]/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                                            <th className="px-6 py-4 text-left text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest min-w-[140px]">Snapshot ID</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Source Path</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest min-w-[120px]">Created</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest min-w-[100px]">Size</th>
                                            <th className="px-6 py-4 text-right text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest min-w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {filteredSnapshots.map((s, idx) => (
                                            <tr
                                                key={s.snapshotId}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => openFileBrowser(s)}
                                                            className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors cursor-pointer"
                                                        >
                                                            {s.snapshotId} — <span className="font-sans">{s.path.replace(/[\\/]+$/, '').split(/[\\/]/).pop()}</span>
                                                        </button>
                                                        {idx === 0 && !activeSearch && (
                                                            <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 max-w-[250px]">
                                                        <span className="material-icons-round text-[16px] text-slate-400">folder</span>
                                                        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 truncate" title={s.path}>{s.path}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">{new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700">{s.size}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openFileBrowser(s)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                                            title="Browse Files"
                                                        >
                                                            <span className="material-icons-round text-[18px]">folder_open</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(s.snapshotId)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                                            title="Delete Snapshot"
                                                        >
                                                            <span className="material-icons-round text-[18px]">delete_outline</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* File Browser Modal (Enhanced — matching Plakar UI) */}
                {fbOpen && (() => {
                    // Compute folder name from browse path or snapshot path
                    const currentFolderName = fbBrowsePath
                        ? fbBrowsePath.split('/').filter(Boolean).pop() || 'Root'
                        : (fbSnap?.path ? fbSnap.path.split('/').filter(Boolean).pop() || 'Root' : 'Root');

                    // Version dropdown: all snapshots that share the same backed-up path
                    const snapshotPath = fbSnap?.path || '';
                    const versions = snapshots.filter(s => s.path === snapshotPath).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    // Filter files by search
                    const filteredFiles = fbSearch
                        ? fbFiles.filter(f => f.name.toLowerCase().includes(fbSearch.toLowerCase()))
                        : fbFiles;

                    // Pagination
                    const totalPages = Math.max(1, Math.ceil(filteredFiles.length / fbPerPage));
                    const pagedFiles = filteredFiles.slice((fbPage - 1) * fbPerPage, fbPage * fbPerPage);

                    // Relative time helper
                    const relativeTime = (ts: string) => {
                        const diff = Date.now() - new Date(ts).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'just now';
                        if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `about ${hrs} hour${hrs > 1 ? 's' : ''} ago`;
                        const days = Math.floor(hrs / 24);
                        return `${days} day${days > 1 ? 's' : ''} ago`;
                    };

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-scale" onClick={() => setFbOpen(false)}>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden h-[90vh] border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>

                                {/* ── Breadcrumb Bar ── */}
                                <div className="px-6 py-2.5 bg-slate-50 dark:bg-[#0b1120] border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-xs">
                                    <button onClick={() => setFbOpen(false)} className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold cursor-pointer">Snapshots</button>
                                    <span className="text-slate-300 dark:text-slate-600">{'>'}</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{fbSnap?.snapshotId?.substring(0, 8)}</span>
                                    {fbBrowsePath && fbBrowsePath.split('/').filter(Boolean).map((seg, i, arr) => {
                                        const segPath = '/' + arr.slice(0, i + 1).join('/');
                                        const isLast = i === arr.length - 1;
                                        return (
                                            <span key={segPath} className="flex items-center gap-1.5">
                                                <span className="text-slate-300 dark:text-slate-600">{'>'}</span>
                                                <button
                                                    onClick={() => !isLast && browseTo(segPath)}
                                                    className={`font-bold ${isLast ? 'text-slate-700 dark:text-slate-300' : 'text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer'}`}
                                                >
                                                    {seg}
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* ── Folder Title & Metadata ── */}
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{currentFolderName}</h2>
                                        <button onClick={() => setFbOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                            <span className="material-icons-round text-[20px]">close</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                                        {fbDirMeta.date && (
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Last modified</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(fbDirMeta.date).toLocaleString('sv-SE').replace(' ', ' ')}</span>
                                            </div>
                                        )}
                                        {fbDirMeta.permissions && (
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Mode</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{fbDirMeta.permissions}</span>
                                            </div>
                                        )}
                                        {fbDirMeta.uid && (
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Owner user</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{fbDirMeta.uid}</span>
                                            </div>
                                        )}
                                        {fbDirMeta.gid && (
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Owner group</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{fbDirMeta.gid}</span>
                                            </div>
                                        )}
                                        {/* Version Dropdown */}
                                        {versions.length > 0 && (
                                            <div className="relative group/ver">
                                                <span className="text-slate-400 dark:text-slate-500 block">Version</span>
                                                <button className="font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                                                    {fbSnap?.snapshotId?.substring(0, 8)}
                                                    <span className="material-icons-round text-[14px]">arrow_drop_down</span>
                                                </button>
                                                <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover/ver:opacity-100 group-hover/ver:visible transition-all z-30 overflow-hidden">
                                                    {versions.map((v, vi) => {
                                                        const isCurrent = v.snapshotId === fbSnap?.snapshotId;
                                                        const isNewer = vi > 0;
                                                        return (
                                                            <button
                                                                key={v.snapshotId}
                                                                onClick={() => !isCurrent && openFileBrowser(v, fbBrowsePath)}
                                                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm transition-colors ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'}`}
                                                            >
                                                                <span className={`material-icons-round text-[16px] ${isCurrent ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                                    {isCurrent ? 'radio_button_checked' : 'schedule'}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.snapshotId.substring(0, 8)}</span>
                                                                    {isNewer && <span className="text-[10px] font-bold text-slate-400 ml-2">No changes</span>}
                                                                </div>
                                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{relativeTime(v.timestamp)}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Search + Filter Bar ── */}
                                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-[#0f172a]">
                                    <div className="relative flex-1 max-w-xs">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-[18px]">search</span>
                                        <input
                                            type="text"
                                            value={fbSearch}
                                            onChange={e => { setFbSearch(e.target.value); setFbPage(1); }}
                                            placeholder="Search filename..."
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    {fbBrowsePath && (
                                        <button onClick={() => {
                                            const parentPath = fbBrowsePath.split('/').filter(Boolean).slice(0, -1).join('/');
                                            browseTo(parentPath ? '/' + parentPath : '');
                                        }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer">
                                            <span className="material-icons-round text-[18px]">arrow_back</span>
                                            Back
                                        </button>
                                    )}
                                </div>

                                {/* ── Modal Body ── */}
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a]">
                                    {fbLoading && (
                                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                                            <span className="spinner border-2 border-indigo-500/20 border-t-indigo-500 rounded-full w-8 h-8 animate-spin mb-4" />
                                            <span className="font-bold text-sm">Loading files...</span>
                                        </div>
                                    )}
                                    {fbError && (
                                        <div className="m-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-4 flex items-center gap-3">
                                            <span className="material-icons-round">error</span>
                                            <span className="text-sm font-bold flex-1">{fbError}</span>
                                        </div>
                                    )}
                                    {!fbLoading && !fbError && filteredFiles.length > 0 && (
                                        <table className="min-w-full">
                                            <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-3 text-left w-[50%]">Name</th>
                                                    <th className="px-4 py-3 text-left">Size</th>
                                                    <th className="px-4 py-3 text-left">Modified</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                {/* Parent Directory (..) */}
                                                {fbBrowsePath && (
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => {
                                                        const parentPath = fbBrowsePath.split('/').filter(Boolean).slice(0, -1).join('/');
                                                        browseTo(parentPath ? '/' + parentPath : '');
                                                    }}>
                                                        <td className="px-6 py-3 whitespace-nowrap" colSpan={4}>
                                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                <span className="material-icons-round text-lg text-indigo-400">folder</span>
                                                                <span>..</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {pagedFiles.map((f, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                        <td className="px-6 py-3 whitespace-nowrap">
                                                            <div
                                                                className={`flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200 ${f.isDir ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
                                                                onClick={() => f.isDir && browseTo(f.path)}
                                                            >
                                                                <span className={`material-icons-round text-lg ${f.isDir ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                                    {f.isDir ? 'folder' : 'description'}
                                                                </span>
                                                                <span className="truncate max-w-[350px]" title={f.path}>{f.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-[13px] font-bold text-slate-500 dark:text-slate-400">{f.size || (f.isDir ? '' : '0 B')}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                                            {f.date ? new Date(f.date).toLocaleString('sv-SE').replace(' ', ' ') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                            {!f.isDir && (
                                                                <button
                                                                    onClick={() => downloadFile(f.path)}
                                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all ml-auto cursor-pointer"
                                                                    title="Download File"
                                                                >
                                                                    <span className="material-icons-round text-[18px]">download</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    {!fbLoading && filteredFiles.length === 0 && !fbError && (
                                        <div className="py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                                                <span className="material-icons-round text-3xl">topic</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{fbSearch ? 'No matching files' : 'No files found'}</h3>
                                            <p className="text-slate-500 text-sm">{fbSearch ? `No files match "${fbSearch}"` : 'This snapshot appears to be empty.'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Footer: Pagination ── */}
                                {!fbLoading && filteredFiles.length > 0 && (
                                    <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1120] flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                        <span>{filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}</span>
                                        <div className="flex items-center gap-3">
                                            <span>Display: {fbPerPage}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setFbPage(Math.max(1, fbPage - 1))}
                                                    disabled={fbPage <= 1}
                                                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-icons-round text-[16px]">chevron_left</span>
                                                </button>
                                                <span className="px-2">Page {fbPage} of {totalPages}</span>
                                                <button
                                                    onClick={() => setFbPage(Math.min(totalPages, fbPage + 1))}
                                                    disabled={fbPage >= totalPages}
                                                    className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-icons-round text-[16px]">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

export default function RepoSnapshotsPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="animate-pulse text-center py-24 text-slate-400 font-bold dark:bg-[#090b14] min-h-[calc(100vh-4rem)]"><span className="spinner border-2 border-indigo-500 border-t-transparent rounded-full w-8 h-8 animate-spin mx-auto mb-4 block" />Loading Repository...</div>}>
            <RepoSnapshotsContent params={params} />
        </Suspense>
    );
}
