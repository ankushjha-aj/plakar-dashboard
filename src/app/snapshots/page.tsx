'use client';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

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
                const sorted = (d.snapshots || []).sort((a: Snap, b: Snap) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setUnlocked(prev => [...prev.filter(u => u.repo.path !== repo.path), { repo, passphrase: pw, snapshots: sorted }]);
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
                const entry = unlocked.find(u => u.repo.path === repoPath);
                if (entry) unlockRepo(entry.repo);
            } else setDeleteMsg(`Failed: ${d.message}`);
        } catch { setDeleteMsg('Network error.'); }
    };

    const lockedRepos = savedRepos.filter(r => !isUnlocked(r.path));

    return (
        <div className="animate-fade-in-up">
            {/* Hero */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-bold text-purple-500">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        Snapshot Gallery
                    </div>
                    <ThemeToggle />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    Browse <span className="text-gradient">Snapshots</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg">Unlock your repositories to explore and download files from any point in time.</p>
            </div>

            {deleteMsg && (
                <div className="glass-card rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in-scale border border-blue-500/20">
                    <span className="material-icons-round text-blue-500">info</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex-1">{deleteMsg}</span>
                    <button onClick={() => setDeleteMsg('')} className="p-1 text-blue-400 hover:text-blue-600 cursor-pointer"><span className="material-icons-round text-sm">close</span></button>
                </div>
            )}

            {/* Locked repos */}
            {lockedRepos.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Locked Repositories</h2>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full glass-card text-slate-500">{lockedRepos.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
                        {lockedRepos.map(repo => (
                            <div key={repo.path} className="glass-card rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                        <span className="material-icons-round">lock</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{repo.name}</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate" title={repo.path}>{repo.path}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 glass-card rounded-xl overflow-hidden">
                                        <input type="password" value={passInputs[repo.path] || ''} onChange={e => setPassInputs(prev => ({ ...prev, [repo.path]: e.target.value }))}
                                            placeholder="Enter passphrase..." onKeyDown={e => { if (e.key === 'Enter') unlockRepo(repo); }}
                                            className="w-full px-4 py-3 text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:ring-0 focus:outline-none placeholder:text-slate-400" />
                                    </div>
                                    <button onClick={() => unlockRepo(repo)} disabled={loadingRepo === repo.path || !passInputs[repo.path]}
                                        className="btn-glow px-5 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer">
                                        <span className="material-icons-round text-sm">{loadingRepo === repo.path ? 'hourglass_empty' : 'lock_open'}</span>
                                        {loadingRepo === repo.path ? '...' : 'Unlock'}
                                    </button>
                                </div>
                                {repoErrors[repo.path] && <p className="mt-3 text-xs text-red-500 flex items-center gap-1 font-medium"><span className="material-icons-round text-xs">error</span>{repoErrors[repo.path]}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {savedRepos.length === 0 && (
                <div className="gradient-border rounded-2xl">
                    <div className="relative z-10 py-16 text-center">
                        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                            <span className="material-icons-round text-4xl text-purple-400">inventory_2</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">No repositories registered yet.</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Create a repository from the Backup page first.</p>
                    </div>
                </div>
            )}

            {/* Unlocked repos */}
            {unlocked.map(({ repo, passphrase, snapshots }) => (
                <div key={repo.path} className="mb-10 animate-fade-in-up">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <span className="material-icons-round text-sm">lock_open</span>
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{repo.name}</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{repo.path}</p>
                        </div>
                        <span className="ml-auto px-3 py-1 text-xs rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="glass-card rounded-2xl overflow-hidden">
                        {snapshots.length === 0 ? (
                            <div className="py-16 text-center">
                                <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 mb-3 block">inbox</span>
                                <p className="text-slate-500 font-medium">No snapshots yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200/30 dark:border-white/5">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Snapshot ID</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Source Path</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Created</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Size</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                                        {snapshots.map((s, idx) => (
                                            <tr key={s.snapshotId} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openFileBrowser(s, repo.path, repo.name, passphrase)}
                                                            className="font-mono text-sm text-indigo-500 font-bold bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 dark:border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all duration-200 cursor-pointer">
                                                            {s.snapshotId}
                                                        </button>
                                                        {idx === 0 && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white uppercase tracking-wider shadow-lg shadow-indigo-500/20">
                                                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 font-medium"><span className="material-icons-round text-base text-slate-400">folder</span>{s.path}</div></td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{new Date(s.timestamp).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{s.size}</span></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openFileBrowser(s, repo.path, repo.name, passphrase)} className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer" title="Browse"><span className="material-icons-round text-lg">folder_open</span></button>
                                                        <button onClick={() => handleDelete(repo.path, s.snapshotId, passphrase)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete"><span className="material-icons-round text-lg">delete_outline</span></button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setFbOpen(false)}>
                    <div className="gradient-border max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="relative z-10 p-5 border-b border-slate-200/30 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-icons-round text-indigo-500">folder_open</span>
                                    Snapshot <span className="font-mono text-indigo-500">{fbSnap?.snapshotId}</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold">{fbRepoName}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{fbSnap?.path}</span>
                                </div>
                            </div>
                            <button onClick={() => setFbOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"><span className="material-icons-round text-slate-400">close</span></button>
                        </div>
                        <div className="relative z-10 flex-1 overflow-y-auto">
                            {fbLoading && <div className="flex items-center justify-center py-16"><span className="spinner mr-3 text-indigo-500" /><span className="text-slate-500 font-medium">Loading files...</span></div>}
                            {fbError && <div className="m-4 glass-card rounded-xl p-4 border border-red-500/20 text-sm text-red-500 font-medium">{fbError}</div>}
                            {fbFiles.length > 0 && (
                                <table className="min-w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/30 dark:border-white/5">
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Name</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Size</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Date</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                                        {fbFiles.map((f, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <td className="px-5 py-3.5 whitespace-nowrap"><div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    <span className={`material-icons-round text-base ${f.isDir ? 'text-amber-500' : 'text-slate-400'}`}>{f.isDir ? 'folder' : 'description'}</span>
                                                    <span className="truncate max-w-[280px]" title={f.path}>{f.name}</span>
                                                </div></td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{f.size}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{f.date ? new Date(f.date).toLocaleDateString() : '-'}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                    {!f.isDir && (
                                                        <button onClick={() => downloadFile(f.path)} className="opacity-40 group-hover:opacity-100 p-2 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer" title="Download">
                                                            <span className="material-icons-round text-lg">download</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!fbLoading && fbFiles.length === 0 && !fbError && <div className="py-16 text-center text-slate-500"><span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 block mb-3">description</span><p className="font-medium">No files found</p></div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
