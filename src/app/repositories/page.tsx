'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface SavedRepo { path: string; name: string; createdAt: string; }

export default function RepositoriesPage() {
    const [repos, setRepos] = useState<SavedRepo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/plakar/repos').then(r => r.json()).then(d => {
            const all = d.repos || [];
            // Sort latest first (most recently created on top)
            all.sort((a: SavedRepo, b: SavedRepo) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRepos(all);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const totalRepos = repos.length;
    const latestRepo = repos.length > 0 ? repos[0] : null;

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-bold text-indigo-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Repository Manager
                    </div>
                    <ThemeToggle />
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    Your <span className="text-gradient">Repositories</span>
                </h1>
                <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-lg">
                    All your encrypted backup repositories in one place.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-8 lg:mb-10 stagger-children">
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <span className="material-icons-round text-xl">storage</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{totalRepos}</div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Repositories</p>
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <span className="material-icons-round text-xl">lock</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">AES-256</div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Encryption Standard</p>
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                        <span className="material-icons-round text-xl">schedule</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {latestRepo ? new Date(latestRepo.createdAt).toLocaleDateString() : '—'}
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Created</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <h2 className="text-base lg:text-lg font-extrabold text-slate-900 dark:text-white">All Repositories</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full glass-card text-slate-500">{totalRepos}</span>
                </div>
                <Link href="/backup?init=true" className="btn-glow text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                    <span className="material-icons-round text-base">add</span> New Repository
                </Link>
            </div>

            {/* Loading */}
            {
                loading && (
                    <div className="glass-card rounded-2xl py-16 flex items-center justify-center">
                        <span className="spinner mr-3 text-indigo-500" /><span className="text-slate-500 font-medium">Loading repositories...</span>
                    </div>
                )
            }

            {/* Empty state */}
            {
                !loading && repos.length === 0 && (
                    <div className="gradient-border rounded-2xl">
                        <div className="relative z-10 py-16 text-center">
                            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
                                <span className="material-icons-round text-4xl text-indigo-400">inventory_2</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No repositories yet</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">Create your first encrypted repository to get started.</p>
                            <Link href="/backup?init=true" className="btn-glow inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                                <span className="material-icons-round text-base">add</span>Create Repository
                            </Link>
                        </div>
                    </div>
                )
            }

            {/* Repository list */}
            {
                !loading && repos.length > 0 && (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200/30 dark:border-white/5 hidden md:grid grid-cols-12 gap-4">
                            <div className="col-span-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">#</div>
                            <div className="col-span-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Repository</div>
                            <div className="col-span-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Location</div>
                            <div className="col-span-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Created</div>
                            <div className="col-span-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] text-right">Actions</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                            {repos.map((repo, idx) => {
                                const isLatest = idx === 0;
                                return (
                                    <div
                                        key={repo.path}
                                        className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                                    >
                                        {/* Index */}
                                        <div className="col-span-1 hidden md:block">
                                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{String(idx + 1).padStart(2, '0')}</span>
                                        </div>

                                        {/* Name + badge */}
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${isLatest ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20 animate-glow-pulse' : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/10'}`}>
                                                <span className="material-icons-round text-lg">folder_special</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{repo.name}</h3>
                                                    {isLatest && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white uppercase tracking-wider shadow-lg shadow-indigo-500/20 flex-shrink-0">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Path */}
                                        <div className="col-span-4 hidden md:block">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" title={repo.path}>{repo.path}</p>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-2 hidden md:block">
                                            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{new Date(repo.createdAt).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(repo.createdAt).toLocaleTimeString()}</div>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 flex items-center justify-end gap-1">
                                            <Link href={`/backup?repo=${encodeURIComponent(repo.path)}`} className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors opacity-40 group-hover:opacity-100" title="Backup">
                                                <span className="material-icons-round text-lg">backup</span>
                                            </Link>
                                            <Link href={`/snapshots?repo=${encodeURIComponent(repo.path)}`} className="p-2 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors opacity-40 group-hover:opacity-100" title="Snapshots">
                                                <span className="material-icons-round text-lg">history</span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
