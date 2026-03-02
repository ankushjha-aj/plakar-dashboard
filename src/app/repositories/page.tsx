'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface SavedRepo { path: string; name: string; createdAt: string; isArchived?: boolean; }

export default function RepositoriesPage() {
    const router = useRouter();
    const [repos, setRepos] = useState<SavedRepo[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'cloud' | 'local' | 'archived'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    // Action Modal State (Archive/Restore/Delete)
    const [actionRepo, setActionRepo] = useState<{ repo: SavedRepo, action: 'archive' | 'restore' | 'delete' } | null>(null);
    const [actionPassphrase, setActionPassphrase] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    // Unlock Passphrase Popup State
    const [unlockRepo, setUnlockRepo] = useState<SavedRepo | null>(null);
    const [unlockPass, setUnlockPass] = useState('');
    const [unlockShowPass, setUnlockShowPass] = useState(false);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [unlockError, setUnlockError] = useState('');

    // Init Modal State
    const [showInitModal, setShowInitModal] = useState(false);
    const [newRepoPath, setNewRepoPath] = useState('');
    const [newRepoPassphrase, setNewRepoPassphrase] = useState('');
    const [newRepoShowPass, setNewRepoShowPass] = useState(false);
    const [newRepoLoading, setNewRepoLoading] = useState(false);
    const [newRepoResult, setNewRepoResult] = useState<{ success: boolean; message: string; } | null>(null);

    const openNativePicker = async () => {
        try {
            const res = await fetch('/api/plakar/pick-folder');
            const data = await res.json();
            if (data.success && data.path) {
                setNewRepoPath(data.path);
            }
        } catch { /* cancelled */ }
    };

    const handleCreateRepo = async () => {
        if (!newRepoPath || !newRepoPassphrase) return;
        setNewRepoLoading(true);
        setNewRepoResult(null);
        try {
            const res = await fetch('/api/plakar/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repository: newRepoPath, passphrase: newRepoPassphrase }) });
            const data = await res.json();
            setNewRepoResult({ success: data.success, message: data.message || data.error });
            if (data.success) {
                fetchRepos();
                setTimeout(() => {
                    setShowInitModal(false);
                    setNewRepoPath('');
                    setNewRepoPassphrase('');
                    setNewRepoResult(null);
                }, 2000);
            }
        } catch {
            setNewRepoResult({ success: false, message: 'Network error.' });
        }
        setNewRepoLoading(false);
    };

    const fetchRepos = () => {
        setLoading(true);
        fetch('/api/plakar/repos').then(r => r.json()).then(d => {
            const all = d.repos || [];
            all.sort((a: SavedRepo, b: SavedRepo) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRepos(all);
        }).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRepos();
    }, []);

    const handleUnlockRepo = async () => {
        if (!unlockRepo || !unlockPass) return;
        setUnlockLoading(true);
        setUnlockError('');
        try {
            const r = await fetch('/api/plakar/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: unlockRepo.path, passphrase: unlockPass })
            });
            const d = await r.json();
            if (d.success) {
                // Store passphrase in sessionStorage for the snapshot page to auto-unlock
                sessionStorage.setItem('plakarUnlockPass', unlockPass);
                setUnlockRepo(null);
                router.push(`/repositories/snapshots-${encodeURIComponent(unlockRepo.name)}?path=${encodeURIComponent(unlockRepo.path)}`);
            } else {
                setUnlockError('Invalid passphrase or failed to access repository.');
            }
        } catch {
            setUnlockError('Network error. Please try again.');
        }
        setUnlockLoading(false);
    };

    const totalRepos = repos.filter(r => !r.isArchived).length;
    const latestRepo = repos.filter(r => !r.isArchived).length > 0 ? repos.filter(r => !r.isArchived)[0] : null;

    const filteredRepos = repos.filter(r => {
        const isCloud = r.path.startsWith('s3://') || r.path.toLowerCase().includes('cloud');
        const isArchived = !!r.isArchived;

        if (activeTab === 'archived' && !isArchived) return false;
        if (activeTab !== 'archived' && isArchived) return false;
        if (activeTab === 'cloud' && !isCloud) return false;
        if (activeTab === 'local' && isCloud) return false;

        if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.path.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        return true;
    });

    const handleActionSubmit = async () => {
        if (!actionRepo || !actionPassphrase) return;
        setActionLoading(true);
        setActionError('');

        try {
            const endpoint = actionRepo.action === 'archive' ? '/api/plakar/repos/archive' : '/api/plakar/repos/restore';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: actionRepo.repo.path, passphrase: actionPassphrase })
            });
            const data = await res.json();

            if (data.success) {
                setActionRepo(null);
                setActionPassphrase('');
                fetchRepos();
            } else {
                setActionError(data.error || 'Failed to perform action.');
            }
        } catch (err) {
            setActionError('Network error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-[#080d1a] px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto rounded-md">

            {/* Header: Title + Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
                <div>
                    <h1 className="text-3xl font-black text-[#1e2330] dark:text-white mb-2 tracking-tight">
                        Your Repositories
                    </h1>
                    <p className="text-[15px] font-medium text-[#64748b] dark:text-slate-400">
                        Manage and monitor all your encrypted backup repositories.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search repositories..."
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    {/* New Repository Button */}
                    <button
                        onClick={() => setShowInitModal(true)}
                        className="btn-glow inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-indigo-500/50 transition-all">
                        <span className="material-icons-round text-lg">add_circle</span> New Repository
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Total Repos */}
                <div className="bg-white dark:bg-[#0f172a] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 px-7 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#eef2ff] dark:bg-[#4f46e5]/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <span className="material-icons-round text-[28px]">layers</span>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">Total Repositories</p>
                        <div className="text-[28px] font-black text-[#1e2330] dark:text-white leading-none">{totalRepos}</div>
                    </div>
                </div>

                {/* Encryption Standard */}
                <div className="bg-white dark:bg-[#0f172a] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 px-7 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] dark:bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                        <span className="material-icons-round text-[28px]">security</span>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">Encryption Standard</p>
                        <div className="text-[28px] font-black text-[#1e2330] dark:text-white leading-none">AES-256</div>
                    </div>
                </div>

                {/* Last Activity */}
                <div className="bg-white dark:bg-[#0f172a] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 px-7 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#e0e7ff] dark:bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                        <span className="material-icons-round text-[28px]">history</span>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">Last Activity</p>
                        <div className="text-[26px] font-black text-[#1e2330] dark:text-white leading-none">
                            {latestRepo ? 'Just now' : '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-6 px-2">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'all' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    <span className="material-icons-round text-[18px]">format_list_bulleted</span> All Repositories
                </button>
                <div
                    title="Coming soon"
                    className={`pb-3 border-b-2 font-bold text-sm flex items-center gap-2 border-transparent text-slate-400 cursor-not-allowed`}
                >
                    <span className="material-icons-round text-[18px]">cloud</span> Cloud
                </div>
                <button
                    onClick={() => setActiveTab('local')}
                    className={`pb-3 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'local' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    <span className="material-icons-round text-[18px]">folder</span> Local
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    className={`pb-3 border-b-2 font-bold text-sm flex items-center gap-2 ${activeTab === 'archived' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    <span className="material-icons-round text-[18px]">archive</span> Archived
                </button>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-[#0f172a] shadow-[0_2px_20px_-5px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden">

                {/* Table Header */}
                <div className="bg-[#f8fafc]/80 dark:bg-slate-800/40 px-6 py-4 grid grid-cols-12 gap-4 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="col-span-4 text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest flex items-center">Repository Name</div>
                    <div className="col-span-4 text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest flex items-center">Physical Location</div>
                    <div className="col-span-3 text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest flex items-center">Created At</div>
                    <div className="col-span-1 text-[11px] font-black text-[#64748b] dark:text-slate-500 uppercase tracking-widest flex items-center justify-end">Actions</div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <span className="spinner border-2 border-indigo-500/20 border-t-indigo-500 rounded-full w-8 h-8 animate-spin mb-4" />
                        <span className="font-bold text-sm">Loading repositories...</span>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredRepos.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                            <span className="material-icons-round text-3xl">inventory_2</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                            {searchQuery ? "No repository found." : "No repositories yet"}
                        </h3>
                        {searchQuery ? (
                            <p className="text-slate-500 text-sm max-w-sm mb-6">We couldn't find any repositories matching your search query.</p>
                        ) : activeTab === 'archived' ? (
                            <p className="text-slate-500 text-sm max-w-sm mb-6">You don't have any archived repositories yet.</p>
                        ) : (
                            <>
                                <p className="text-slate-500 text-sm max-w-sm mb-6">You haven't initialized any backup repositories yet. Create your first one to get started.</p>
                                <button onClick={() => setShowInitModal(true)} className="btn-glow inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-indigo-500/50 transition-all cursor-pointer">
                                    Initialize Repository
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Rows */}
                {!loading && filteredRepos.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredRepos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((repo, idx) => {
                            const isLatest = currentPage === 1 && idx === 0;
                            const d = new Date(repo.createdAt);
                            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                            // Mocking cloud vs disk icons for visual variety based on path (as per design)
                            const isCloud = repo.path.startsWith('s3://') || repo.path.includes('cloud');
                            const Icon = isCloud ? 'cloud' : 'dns';

                            return (
                                <div
                                    key={repo.path}
                                    onClick={() => {
                                        setUnlockRepo(repo);
                                        setUnlockPass('');
                                        setUnlockShowPass(false);
                                        setUnlockError('');
                                    }}
                                    className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                >

                                    {/* Name & Badge */}
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="text-slate-400 dark:text-slate-500">
                                            <span className="material-icons-round text-[28px]">{Icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-[14px] text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{repo.name}</h3>
                                                {isLatest && (
                                                    <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] font-medium text-slate-500">
                                                {isCloud ? 'Cloud Storage' : 'Local Drive'} • Encrypted
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location Badge */}
                                    <div className="col-span-4 flex items-center">
                                        <div className="flex items-center gap-2 max-w-full">
                                            <span className="material-icons-round text-[16px] text-slate-400 flex-shrink-0">{isCloud ? 'link' : 'folder'}</span>
                                            <span className="text-[13px] font-mono text-slate-600 dark:text-slate-400 truncate">{repo.path}</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-3 flex items-center text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                        {dateStr} <span className="ml-2 text-slate-400">{timeStr}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                        {/* Action Menu Trigger (3-dot) */}
                                        <div className="relative group/menu">
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                                <span className="material-icons-round text-[20px]">more_vert</span>
                                            </button>

                                            {/* Dropdown Menu */}
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all transform origin-top-right z-20 overflow-hidden">
                                                <div className="py-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionRepo({ repo, action: repo.isArchived ? 'restore' : 'archive' });
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors">
                                                        <span className="material-icons-round text-[16px] text-amber-500">{repo.isArchived ? 'restore' : 'inventory_2'}</span>
                                                        {repo.isArchived ? 'Restore Repository' : 'Archive Repository'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Future delete logic could go here
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                                        <span className="material-icons-round text-[16px]">delete_forever</span>
                                                        Delete (Local Only)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Table Footer / Pagination Block */}
                {!loading && filteredRepos.length > 0 && (
                    <div className="bg-[#f8fafc]/50 dark:bg-slate-800/20 px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRepos.length)}-{Math.min(currentPage * itemsPerPage, filteredRepos.length)} of {filteredRepos.length} repositories
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <span className="material-icons-round text-[16px]">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredRepos.length / itemsPerPage), p + 1))}
                                disabled={currentPage >= Math.ceil(filteredRepos.length / itemsPerPage)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <span className="material-icons-round text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Page Footer Status */}
            <div className="flex items-center justify-between mt-8 text-[12px] font-medium text-slate-400 px-2 pb-6">
                <div className="flex items-center gap-3">
                    <span>© 2024 Plakar Security. All rights reserved.</span>
                    <span>•</span>
                    <button className="hover:text-slate-600 transition-colors">System Status</button>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        Server: Local-Node-01
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="material-icons-round text-[14px]">cloud_done</span>
                        Sync Active
                    </div>
                </div>
            </div>

            {/* Action Modal (Archive/Restore) */}
            {actionRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-scale">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-500/20">
                                <span className="material-icons-round text-2xl">{actionRepo.action === 'archive' ? 'inventory_2' : 'restore'}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {actionRepo.action === 'archive' ? 'Archive Repository?' : 'Restore Repository?'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                                {actionRepo.action === 'archive'
                                    ? "Archiving this repository will move it to the Archived tab. To permanently delete it, you must remove the `.plakar` folder from your local system/recycle bin. Please enter your passphrase to confirm."
                                    : "Restoring this repository will move it back to your active lists. Please enter your passphrase to confirm."}
                            </p>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Passphrase
                                </label>
                                <input
                                    type="password"
                                    value={actionPassphrase}
                                    onChange={(e) => setActionPassphrase(e.target.value)}
                                    placeholder="Enter repository passphrase..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleActionSubmit()}
                                    autoFocus
                                />
                                {actionError && (
                                    <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                        <span className="material-icons-round text-[14px]">error_outline</span> {actionError}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setActionRepo(null); setActionPassphrase(''); setActionError(''); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleActionSubmit}
                                    disabled={actionLoading || !actionPassphrase}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 
                                        ${actionRepo.action === 'archive'
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'} 
                                        disabled:opacity-50`}>
                                    {actionLoading ? <span className="spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                                    {actionRepo.action === 'archive' ? 'Archive It' : 'Restore'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Init Repository Modal */}
            {showInitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden animate-fade-in-scale">
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Initialize Repository
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                        Create a secure new repository for your zero-trust data.
                                    </p>
                                </div>
                                <button onClick={() => { setShowInitModal(false); setNewRepoResult(null); }} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>

                            {newRepoResult && (
                                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${newRepoResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'} border dark:bg-opacity-10 dark:border-opacity-20`}>
                                    <span className="material-icons-round mt-0.5">{newRepoResult.success ? 'check_circle' : 'error'}</span>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold">{newRepoResult.success ? 'Success!' : 'Error'}</h3>
                                        <p className="text-sm opacity-90">{newRepoResult.message}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Repository Location
                                    </label>
                                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                        <input
                                            type="text"
                                            value={newRepoPath}
                                            onChange={(e) => setNewRepoPath(e.target.value)}
                                            placeholder="/Volumes/SecureVault/PlakarBackups"
                                            className="flex-1 px-4 py-3 border-0 text-[14px] text-slate-800 dark:text-slate-200 bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium font-mono"
                                        />
                                        <button
                                            onClick={openNativePicker}
                                            className="bg-[#f8fafc] dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 w-14 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <span className="material-icons-round text-[20px]">folder</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Encryption Passphrase
                                    </label>
                                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                        <input
                                            type={newRepoShowPass ? 'text' : 'password'}
                                            value={newRepoPassphrase}
                                            onChange={(e) => setNewRepoPassphrase(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="flex-1 px-4 py-3 border-0 text-[14px] text-slate-800 dark:text-slate-200 bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewRepoShowPass(!newRepoShowPass)}
                                            className="bg-white dark:bg-slate-900 w-14 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <span className="material-icons-round text-[20px]">{newRepoShowPass ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                                        Store this passphrase securely. You cannot recover your data without it.
                                    </p>
                                </div>

                                <div className="pt-3">
                                    <button
                                        onClick={handleCreateRepo}
                                        disabled={newRepoLoading || !newRepoPath || !newRepoPassphrase}
                                        className="w-full flex justify-center py-3.5 px-4 text-[15px] font-bold rounded-xl text-white bg-[#3f3fbb] hover:bg-[#343499] shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {newRepoLoading ? (
                                            <><span className="spinner border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin mr-2" />Initializing...</>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <span className="material-icons-round text-[20px]">create_new_folder</span>
                                                Create Repository
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Passphrase Popup */}
            {unlockRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-scale" onClick={() => setUnlockRepo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons-round text-indigo-500">lock</span>
                                Unlock Repository
                            </h2>
                            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                <span className="material-icons-round text-[14px]">folder</span>
                                {unlockRepo.name} — <span className="font-mono">{unlockRepo.path}</span>
                            </p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {unlockError && (
                                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg p-3 flex items-center gap-2 text-sm font-bold">
                                    <span className="material-icons-round text-[18px]">error</span>
                                    {unlockError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Passphrase</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-round text-slate-400 text-lg">vpn_key</span>
                                    </div>
                                    <input
                                        type={unlockShowPass ? 'text' : 'password'}
                                        value={unlockPass}
                                        onChange={e => setUnlockPass(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && unlockPass) {
                                                handleUnlockRepo();
                                            }
                                        }}
                                        placeholder="Enter passphrase to decrypt"
                                        autoFocus
                                        className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button type="button" onClick={() => setUnlockShowPass(!unlockShowPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <span className="material-icons-round text-lg">{unlockShowPass ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-[#0f172a]">
                            <button
                                onClick={() => setUnlockRepo(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnlockRepo}
                                disabled={!unlockPass || unlockLoading}
                                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {unlockLoading ? (
                                    <><span className="spinner border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin" />Verifying...</>
                                ) : (
                                    <><span className="material-icons-round text-[18px]">lock_open</span>Unlock</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
