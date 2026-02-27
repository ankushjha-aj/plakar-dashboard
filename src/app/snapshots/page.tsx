'use client';
import { useState, useEffect } from 'react';

interface Snap { timestamp: string; snapshotId: string; size: string; duration: string; path: string; }
interface SnapFile { date: string; permissions: string; size: string; path: string; name: string; isDir: boolean; }
interface SavedRepo { path: string; name: string; createdAt: string; }
interface UnlockedRepo { repo: SavedRepo; passphrase: string; snapshots: Snap[]; }

export default function SnapshotsPage() {
    const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([]);
    const [unlocked, setUnlocked] = useState<UnlockedRepo[]>([]);
    const [passInputs, setPassInputs] = useState<Record<string, string>>({});
    const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
    const [repoErrors, setRepoErrors] = useState<Record<string, string>>({});
    const [deleteMsg, setDeleteMsg] = useState('');

    // File browser modal
    const [fbOpen, setFbOpen] = useState(false);
    const [fbSnap, setFbSnap] = useState<Snap | null>(null);
    const [fbRepoName, setFbRepoName] = useState('');
    const [fbRepoPath, setFbRepoPath] = useState('');
    const [fbPass, setFbPass] = useState('');
    const [fbFiles, setFbFiles] = useState<SnapFile[]>([]);
    const [fbLoading, setFbLoading] = useState(false);
    const [fbError, setFbError] = useState('');

    useEffect(() => {
        fetch('/api/plakar/repos').then(r => r.json()).then(d => setSavedRepos(d.repos || [])).catch(() => { });
    }, []);

    const unlockRepo = async (repo: SavedRepo) => {
        const pw = passInputs[repo.path];
        if (!pw) return;
        setLoadingRepo(repo.path);
        setRepoErrors(prev => ({ ...prev, [repo.path]: '' }));
        try {
            const r = await fetch('/api/plakar/snapshots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: repo.path, passphrase: pw }) });
            const d = await r.json();
            if (d.success) {
                setUnlocked(prev => [...prev.filter(u => u.repo.path !== repo.path), { repo, passphrase: pw, snapshots: d.snapshots }]);
                setRepoErrors(prev => ({ ...prev, [repo.path]: '' }));
            } else {
                setRepoErrors(prev => ({ ...prev, [repo.path]: d.error || 'Wrong passphrase or invalid repository.' }));
            }
        } catch {
            setRepoErrors(prev => ({ ...prev, [repo.path]: 'Network error.' }));
        }
        setLoadingRepo(null);
    };

    const isUnlocked = (repoPath: string) => unlocked.some(u => u.repo.path === repoPath);

    const openFileBrowser = (snap: Snap, repoPath: string, repoName: string, passphrase: string) => {
        setFbSnap(snap); setFbRepoPath(repoPath); setFbRepoName(repoName); setFbPass(passphrase);
        setFbFiles([]); setFbError(''); setFbOpen(true);
        loadFiles(repoPath, snap.snapshotId, passphrase);
    };

    const loadFiles = async (repoPath: string, snapId: string, pw: string) => {
        setFbLoading(true); setFbError('');
        try {
            const r = await fetch('/api/plakar/snapshot-files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: repoPath, snapshotId: snapId, passphrase: pw }) });
            const d = await r.json();
            if (d.success) setFbFiles(d.files);
            else setFbError(d.error || 'Failed to load files.');
        } catch { setFbError('Network error.'); }
        setFbLoading(false);
    };

    const downloadFile = async (filePath: string) => {
        if (!fbSnap) return;
        try {
            const r = await fetch('/api/plakar/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: fbRepoPath, snapshotId: fbSnap.snapshotId, filePath, passphrase: fbPass }) });
            if (!r.ok) { const d = await r.json(); alert(d.error || 'Download failed.'); return; }
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filePath.split('/').pop() || 'file'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed.'); }
    };

    const handleDelete = async (repoPath: string, snapId: string, pw: string) => {
        if (!confirm(`Delete snapshot ${snapId}?`)) return;
        try {
            const r = await fetch('/api/plakar/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: repoPath, snapshotId: snapId, passphrase: pw }) });
            const d = await r.json();
            if (d.success) {
                setDeleteMsg(`Snapshot ${snapId} deleted.`);
                // Refresh that repo's snapshots
                const entry = unlocked.find(u => u.repo.path === repoPath);
                if (entry) unlockRepo(entry.repo);
            } else setDeleteMsg(`Failed: ${d.message}`);
        } catch { setDeleteMsg('Network error.'); }
    };

    const lockedRepos = savedRepos.filter(r => !isUnlocked(r.path));

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Snapshot Gallery</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Unlock your repositories to browse snapshots. Click any Snapshot ID to explore its files.</p>
            </div>

            {deleteMsg && (
                <div className="mb-6 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-900/50 text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <span className="material-icons-round text-base">info</span>{deleteMsg}
                    <button onClick={() => setDeleteMsg('')} className="ml-auto text-blue-400 hover:text-blue-600"><span className="material-icons-round text-sm">close</span></button>
                </div>
            )}

            {/* Locked repos — show unlock UI */}
            {lockedRepos.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        <span className="material-icons-round text-sm align-text-bottom mr-1">lock</span>
                        Locked Repositories ({lockedRepos.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lockedRepos.map(repo => (
                            <div key={repo.path} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <span className="material-icons-round">lock</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{repo.name}</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate" title={repo.path}>{repo.path}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-icons-round text-slate-400 text-sm">vpn_key</span></div>
                                        <input type="password" value={passInputs[repo.path] || ''} onChange={e => setPassInputs(prev => ({ ...prev, [repo.path]: e.target.value }))} placeholder="Passphrase"
                                            onKeyDown={e => { if (e.key === 'Enter') unlockRepo(repo); }}
                                            className="block w-full pl-9 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <button onClick={() => unlockRepo(repo)} disabled={loadingRepo === repo.path || !passInputs[repo.path]}
                                        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 shadow-glow transition-all disabled:opacity-50 flex items-center gap-1">
                                        <span className="material-icons-round text-sm">{loadingRepo === repo.path ? 'hourglass_empty' : 'lock_open'}</span>
                                        {loadingRepo === repo.path ? '...' : 'Unlock'}
                                    </button>
                                </div>
                                {repoErrors[repo.path] && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><span className="material-icons-round text-xs">error</span>{repoErrors[repo.path]}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {savedRepos.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                    <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 mb-3 block">inventory_2</span>
                    <p className="text-slate-500 dark:text-slate-400 mb-2">No repositories registered yet.</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Create a repository from the Backup page and it will appear here automatically.</p>
                </div>
            )}

            {/* Unlocked repos — show their snapshots */}
            {unlocked.map(({ repo, passphrase, snapshots }) => (
                <div key={repo.path} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <span className="material-icons-round text-sm">lock_open</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">{repo.name}</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{repo.path}</p>
                        </div>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        {snapshots.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 mb-2 block">inbox</span>
                                <p>No snapshots in this repository yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Snapshot ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source Path</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {snapshots.map(s => (
                                            <tr key={s.snapshotId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button onClick={() => openFileBrowser(s, repo.path, repo.name, passphrase)} className="font-mono text-sm text-indigo-500 font-medium bg-indigo-500/5 dark:bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/10 dark:border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer" title="Click to browse files">
                                                        {s.snapshotId}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2"><span className="material-icons-round text-base text-slate-400">folder</span>{s.path}</div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-500 dark:text-slate-400">{new Date(s.timestamp).toLocaleDateString()}</div><div className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{s.size}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openFileBrowser(s, repo.path, repo.name, passphrase)} className="text-indigo-500 hover:text-indigo-700 p-1 transition-colors" title="Browse files"><span className="material-icons-round text-lg">folder_open</span></button>
                                                        <button onClick={() => handleDelete(repo.path, s.snapshotId, passphrase)} className="text-red-500 hover:text-red-700 p-1 transition-colors" title="Delete"><span className="material-icons-round text-lg">delete_outline</span></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* File Browser Modal */}
            {fbOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setFbOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-icons-round text-indigo-500">folder_open</span>
                                    Snapshot <span className="font-mono text-indigo-500">{fbSnap?.snapshotId}</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 font-medium">{fbRepoName}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{fbSnap?.path}</span>
                                </div>
                            </div>
                            <button onClick={() => setFbOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><span className="material-icons-round text-slate-500">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1">
                            {fbLoading && <div className="flex items-center justify-center py-12"><span className="spinner mr-2 text-indigo-500" /><span className="text-slate-500">Loading files...</span></div>}
                            {fbError && <div className="m-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">{fbError}</div>}
                            {fbFiles.length > 0 && (
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Size</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {fbFiles.map((f, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-200">
                                                    <span className={`material-icons-round text-base ${f.isDir ? 'text-amber-500' : 'text-slate-400'}`}>{f.isDir ? 'folder' : 'description'}</span>
                                                    <span className="truncate max-w-[300px]" title={f.path}>{f.name}</span>
                                                </div></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{f.size}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    {!f.isDir && (
                                                        <button onClick={() => downloadFile(f.path)} className="opacity-60 group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 transition-all p-1" title="Download">
                                                            <span className="material-icons-round text-lg">download</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!fbLoading && fbFiles.length === 0 && !fbError && <div className="py-12 text-center text-slate-500"><span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 block mb-2">description</span>No files found.</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
