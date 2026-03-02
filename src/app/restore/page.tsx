'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

type OSType = 'windows' | 'macos' | 'linux';

export default function RestorePage() {
    const [detectedOS, setDetectedOS] = useState<OSType>('windows');

    const [repo, setRepo] = useState('');
    const [snapId, setSnapId] = useState('');
    const [dest, setDest] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [browsing, setBrowsing] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [conflictDetected, setConflictDetected] = useState(false);
    const [overwriting, setOverwriting] = useState(false);
    const [overwriteProgress, setOverwriteProgress] = useState(0);

    const [knownRepos, setKnownRepos] = useState<{ name: string, path: string }[]>([]);
    const [recentDests, setRecentDests] = useState<string[]>([]);
    const [repoSnapshots, setRepoSnapshots] = useState<{ snapshotId: string, timestamp: string, path: string, size: string }[]>([]);
    const [fetchingSnaps, setFetchingSnaps] = useState(false);
    const [noSnapsFound, setNoSnapsFound] = useState(false);
    const [wrongPassword, setWrongPassword] = useState(false);

    useEffect(() => {
        fetch('/api/plakar/status').then(r => r.json()).then(d => { if (d.os) setDetectedOS(d.os); }).catch(() => { });

        fetch('/api/plakar/repos').then(r => r.json()).then(d => {
            if (d.repos) setKnownRepos(d.repos);
        }).catch(() => { });

        try {
            const saved = localStorage.getItem('plakarRecentDests');
            if (saved) setRecentDests(JSON.parse(saved));
        } catch (e) { }
    }, []);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSnapshots = useCallback((repoPath: string, passphrase: string) => {
        setFetchingSnaps(true);
        setNoSnapsFound(false);
        setWrongPassword(false);
        fetch('/api/plakar/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repository: repoPath, passphrase })
        })
            .then(r => r.json())
            .then(d => {
                if (d.success && d.snapshots && d.snapshots.length > 0) {
                    setRepoSnapshots(d.snapshots);
                    setNoSnapsFound(false);
                    setWrongPassword(false);
                } else if (!d.success) {
                    // Wrong password or invalid repo
                    setRepoSnapshots([]);
                    setNoSnapsFound(false);
                    setWrongPassword(true);
                } else {
                    // Success but no snapshots
                    setRepoSnapshots([]);
                    setNoSnapsFound(true);
                    setWrongPassword(false);
                }
            })
            .catch(() => {
                setRepoSnapshots([]);
                setWrongPassword(true);
            })
            .finally(() => setFetchingSnaps(false));
    }, []);

    useEffect(() => {
        if (!repo || !pass) {
            setRepoSnapshots([]);
            setFetchingSnaps(false);
            return;
        }

        // Debounce: wait 400ms after user stops typing before fetching
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setFetchingSnaps(true);
            fetchSnapshots(repo, pass);
        }, 400);

        setConflictDetected(false); // Reset conflict on change

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [repo, pass, dest, snapId, fetchSnapshots]);

    const browse = async (t: 'repo' | 'dest') => {
        setBrowsing(true);
        try {
            const r = await fetch('/api/plakar/pick-folder'); const d = await r.json();
            if (d.success && d.path) { if (t === 'repo') setRepo(d.path); else setDest(d.path); }
        } catch { }
        setBrowsing(false);
    };

    const restore = async (forceOverwrite = false) => {
        if (!repo || !snapId || !dest || !pass) return;
        setLoading(true); setResult(null); setConflictDetected(false);

        let progressInterval: ReturnType<typeof setInterval> | null = null;

        if (forceOverwrite) {
            setOverwriting(true);
            setOverwriteProgress(0);
            progressInterval = setInterval(() => {
                setOverwriteProgress(p => (p < 99 ? p + Math.floor(Math.random() * 5) + 1 : 99));
            }, 500);
        }

        try {
            const r = await fetch('/api/plakar/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repo, snapshotId: snapId, destination: dest, passphrase: pass, force: forceOverwrite })
            });
            const d = await r.json();

            if (progressInterval) clearInterval(progressInterval);

            if (forceOverwrite) {
                setOverwriteProgress(100);
                setTimeout(() => setOverwriting(false), 800);
            }

            const combinedOutput = ((d.message || '') + ' ' + (d.error || '') + ' ' + (d.details || '')).toLowerCase();
            if (!forceOverwrite && (combinedOutput.includes('exists') || combinedOutput.includes('file exists'))) {
                setConflictDetected(true);
                setLoading(false);
                return;
            }

            if (d.success) {
                try {
                    const updated = [dest, ...recentDests.filter(s => s !== dest)].slice(0, 5);
                    localStorage.setItem('plakarRecentDests', JSON.stringify(updated));
                    setRecentDests(updated);
                } catch (e) { }
                setResult({ ok: true, msg: d.message || 'Restore successful!' });

                setTimeout(() => {
                    setRepo('');
                    setPass('');
                    setSnapId('');
                    setDest('');
                    setResult(null);
                    setRepoSnapshots([]);
                    setNoSnapsFound(false);
                    setWrongPassword(false);
                }, 3000);
            } else {
                setResult({ ok: false, msg: d.message || d.error });
            }
        } catch {
            if (progressInterval) clearInterval(progressInterval);
            if (forceOverwrite) setOverwriting(false);
            setResult({ ok: false, msg: 'Network error.' });
        }
        setLoading(false);
    };

    const InputRow = ({ label, icon, val, set, placeholder, mono, browseTarget, dropdown, disabled, loading }: { label: string; icon: string; val: string; set: (v: string) => void; placeholder: string; mono?: boolean; browseTarget?: 'repo' | 'dest', dropdown?: React.ReactNode, disabled?: boolean, loading?: boolean }) => (
        <div className={(disabled && !loading) ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <div className="flex items-center justify-between mb-1.5">
                <label className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${(disabled && loading) ? "opacity-50" : ""}`}>{label}</label>
                {dropdown}
            </div>
            <div className={`relative flex items-center ${(disabled && loading) ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons-round text-slate-400 text-lg">{icon}</span>
                </div>
                <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={placeholder} disabled={disabled || loading}
                    className={`block w-full pl-10 ${browseTarget ? 'pr-24' : ''} py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 ${mono ? 'font-mono' : ''}`} />
                {browseTarget && <button onClick={() => browse(browseTarget)} disabled={browsing || disabled || loading} type="button"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer">Browse</button>}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up w-full">
            <div className="text-center space-y-2 mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Restore Data</h1>
                <p className="text-slate-500 dark:text-slate-400">Recover files from your encrypted snapshots. Select a source repository and define your destination.</p>
            </div>

            {result && (
                <div className={`rounded-md p-4 border shadow-sm mb-6 flex items-start gap-3 ${result.ok ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'}`}>
                    <span className={`material-icons-round ${result.ok ? 'text-green-500' : 'text-red-500'}`}>{result.ok ? 'check_circle' : 'error'}</span>
                    <p className={`text-sm ${result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{result.msg}</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-glow rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                        <span className="material-icons-round text-blue-600 dark:text-blue-400 mt-0.5">info</span>
                        <div><h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Destination Tip</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400/80 mt-1">We recommend restoring to a new empty folder to avoid overwriting existing files.</p></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Source Configuration</h3>
                        </div>
                        <InputRow
                            label="Repository Path"
                            icon="folder_open"
                            val={repo}
                            set={setRepo}
                            placeholder={detectedOS === 'windows' ? 'C:\\Users\\You\\Desktop\\MyBackups' : '~/Desktop/MyBackups'}
                            browseTarget="repo"
                            dropdown={
                                knownRepos.length > 0 ? (
                                    <select
                                        className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-0 rounded-md py-1 px-2 cursor-pointer focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%204L9%201%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-0.5rem)_center] pr-6"
                                        onChange={(e) => {
                                            if (e.target.value) setRepo(e.target.value);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Dashboard Repo...</option>
                                        {knownRepos.map(r => (
                                            <option key={r.path} value={r.path}>{r.name} ({r.path})</option>
                                        ))}
                                    </select>
                                ) : undefined
                            }
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Repository Passphrase</label>
                            <div className="relative flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-icons-round text-slate-400 text-lg">vpn_key</span></div>
                                <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter passphrase to decrypt"
                                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <span className="material-icons-round text-lg">{showPass ? 'visibility' : 'visibility_off'}</span></button>
                            </div>
                        </div>
                        <InputRow
                            label="Snapshot ID"
                            icon="qr_code_2"
                            val={snapId}
                            set={setSnapId}
                            placeholder={fetchingSnaps ? "Fetching snapshots..." : "e.g. 8f4a2b1c"}
                            mono
                            disabled={!pass || fetchingSnaps || repoSnapshots.length === 0}
                            loading={fetchingSnaps}
                            dropdown={
                                fetchingSnaps ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800 animate-pulse">
                                        <span className="spinner w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        Fetching Snapshots...
                                    </div>
                                ) : repoSnapshots.length > 0 ? (
                                    <select
                                        className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-0 rounded-md py-1 px-2 cursor-pointer focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%204L9%201%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-0.5rem)_center] pr-6"
                                        onChange={(e) => {
                                            if (e.target.value) setSnapId(e.target.value);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Snapshot...</option>
                                        {repoSnapshots.map(s => {
                                            const d = new Date(s.timestamp).toLocaleString();
                                            const folderName = s.path ? s.path.split('/').filter(Boolean).pop() || s.path : '';
                                            return <option key={s.snapshotId} value={s.snapshotId}>{s.snapshotId.substring(0, 8)} — {folderName} ({d})</option>;
                                        })}
                                    </select>
                                ) : undefined
                            }
                        />
                    </div>

                    {/* Wrong Password Notice */}
                    {wrongPassword && !fetchingSnaps && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-fade-in-up">
                            <span className="material-icons-round text-red-500 mt-0.5">error</span>
                            <div>
                                <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Incorrect Passphrase</h4>
                                <p className="text-sm text-red-700 dark:text-red-400/80 mt-0.5">
                                    The passphrase you entered is incorrect or the repository path is invalid. Please check and try again.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* No Snapshots Found Notice */}
                    {noSnapsFound && !fetchingSnaps && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 animate-fade-in-up">
                            <span className="material-icons-round text-amber-500 mt-0.5">info</span>
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">No Snapshots Found</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-0.5">
                                    This repository does not contain any backups yet. Please create a backup first using the <strong>Backup</strong> page.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Restore Destination</h3>
                        </div>
                        <InputRow
                            label="Restore Destination Path"
                            icon="drive_file_move"
                            val={dest}
                            set={setDest}
                            placeholder={detectedOS === 'windows' ? 'C:\\Users\\You\\Desktop\\Restored' : '~/Desktop/Restored'}
                            browseTarget="dest"
                            disabled={!pass || fetchingSnaps || repoSnapshots.length === 0}
                            dropdown={
                                recentDests.length > 0 ? (
                                    <select
                                        className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-0 rounded-md py-1 px-2 cursor-pointer focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%204L9%201%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-0.5rem)_center] pr-6"
                                        onChange={(e) => {
                                            if (e.target.value) setDest(e.target.value);
                                            e.target.value = ""; // Reset selector
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Recent Destinations...</option>
                                        {recentDests.map(sd => (
                                            <option key={sd} value={sd}>{sd}</option>
                                        ))}
                                    </select>
                                ) : undefined
                            }
                        />
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button onClick={() => restore(false)} disabled={loading || !repo || !snapId || !dest || !pass}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50">
                            {loading && !overwriting ? <><span className="spinner border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin mr-2" />Restoring...</> :
                                overwriting ? <><span className="spinner border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin mr-2" />Overwriting {overwriteProgress > 100 ? 100 : overwriteProgress}%...</> :
                                    <><span className="material-icons-round text-lg">download</span>Restore Now</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Overwrite Confirmation Modal */}
            {conflictDetected && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in-scale">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                        <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-500/20">
                            <span className="material-icons-round text-2xl">warning</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Files Already Exist
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                            Some files already exist in the selected destination directory. Do you want to overwrite the existing files with the restored versions?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setConflictDetected(false); setDest(''); }}
                                disabled={overwriting}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer">
                                Cancel
                            </button>
                            <button
                                onClick={() => restore(true)}
                                disabled={overwriting}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 active:scale-95 disabled:opacity-50 cursor-pointer">
                                {overwriting ? (
                                    <><span className="spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Overwriting {Math.min(overwriteProgress, 100)}%</>
                                ) : (
                                    "Overwrite Files"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
