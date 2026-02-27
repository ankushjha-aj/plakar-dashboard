'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SavedRepo { path: string; name: string; createdAt: string; }

export default function DashboardPage() {
  const [status, setStatus] = useState<{ installed: boolean; version: string; path: string } | null>(null);
  const [repos, setRepos] = useState<SavedRepo[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    fetch('/api/plakar/repos').then(r => r.json()).then(d => setRepos(d.repos || [])).catch(() => { });
    if (!localStorage.getItem('plakar-comparison-seen')) setShowComparison(true);
  }, []);

  const dismissComparison = () => { setShowComparison(false); localStorage.setItem('plakar-comparison-seen', '1'); };

  const removeRepo = async (p: string) => {
    await fetch('/api/plakar/repos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: p }) });
    setRepos(repos.filter(r => r.path !== p));
  };

  return (
    <div className="animate-fade-in-up">
      {/* Feature Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={dismissComparison}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plakar Dashboard vs Plakar UI</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">See how our dashboard goes beyond the built-in CLI interface.</p>
              </div>
              <button onClick={dismissComparison} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="material-icons-round text-slate-500">close</span>
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Feature</th>
                  <th className="text-center py-3 px-2 font-semibold text-slate-500">Plakar UI</th>
                  <th className="text-center py-3 px-2 font-semibold text-indigo-600 dark:text-indigo-400">Our Dashboard</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {[
                    ['Browse Snapshots', true, true],
                    ['Browse Files in Snapshot', true, true],
                    ['Download Files', true, true],
                    ['Create Repository', false, true],
                    ['Run Backup from UI', false, true],
                    ['Restore Files from UI', false, true],
                    ['Delete Snapshots', false, true],
                    ['Native OS Folder Picker', false, true],
                    ['Multi-Repo Dashboard', false, true],
                    ['Dark / Light Theme', false, true],
                    ['Passphrase Security Prompt', false, true],
                  ].map(([feat, plakar, ours]) => (
                    <tr key={feat as string} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">{feat as string}</td>
                      <td className="py-2.5 px-2 text-center">{plakar ? <span className="text-green-500 material-icons-round text-base">check_circle</span> : <span className="text-red-400 material-icons-round text-base">cancel</span>}</td>
                      <td className="py-2.5 px-2 text-center"><span className="text-green-500 material-icons-round text-base">check_circle</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button onClick={dismissComparison} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all">Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400">Here&apos;s what&apos;s happening with your data today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowComparison(true)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700">
            <span className="material-icons-round text-xs mr-1 align-text-bottom">compare</span>Dashboard vs Plakar UI
          </button>
          {status && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.installed ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status.installed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              CLI: {status.installed ? `v${status.version}` : 'Not Found'}
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:glass-panel p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 transition-all hover:border-indigo-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><span className="material-icons-round">cloud_upload</span></div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300">Local</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{repos.length} Repo{repos.length !== 1 ? 's' : ''}</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registered repositories</p>
        </div>
        <div className="bg-white dark:glass-panel p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 transition-all hover:border-indigo-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400"><span className="material-icons-round">lock</span></div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300">AES-256</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Encrypted</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Data secured at rest</p>
        </div>
        <div className="bg-white dark:glass-panel p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 transition-all hover:border-indigo-500/30">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"><span className="material-icons-round">shield</span></div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300">Dedup</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Efficient</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Only changed data is stored</p>
        </div>
      </div>

      {/* Your Repositories */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your Repositories</h2>
          <Link href="/backup" className="text-sm font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
            <span className="material-icons-round text-sm">add</span> New Repository
          </Link>
        </div>
        {repos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
            <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600 mb-3 block">inventory_2</span>
            <p className="text-slate-500 dark:text-slate-400 mb-4">No repositories registered yet.</p>
            <Link href="/backup" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition-all">
              <span className="material-icons-round text-base">add</span>Create Your First Repository
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map(repo => (
              <div key={repo.path} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-indigo-500/30 transition-all hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <span className="material-icons-round">folder_special</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{repo.name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate max-w-[180px]" title={repo.path}>{repo.path}</p>
                    </div>
                  </div>
                  <button onClick={() => removeRepo(repo.path)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-all" title="Remove">
                    <span className="material-icons-round text-sm">close</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Added {new Date(repo.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link href={`/backup?repo=${encodeURIComponent(repo.path)}`} className="flex-1 text-center text-xs font-medium py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">Backup</Link>
                  <Link href={`/snapshots?repo=${encodeURIComponent(repo.path)}`} className="flex-1 text-center text-xs font-medium py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">Snapshots</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/backup" className="group relative overflow-hidden bg-white dark:glass-panel p-6 rounded-2xl text-left border border-slate-200 dark:border-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300"><span className="material-icons-round text-2xl">add</span></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">New Backup</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create a new snapshot of your local files.</p>
          </div>
        </Link>
        <Link href="/snapshots" className="group relative overflow-hidden bg-white dark:glass-panel p-6 rounded-2xl text-left border border-slate-200 dark:border-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300"><span className="material-icons-round text-2xl">folder_open</span></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">View Snapshots</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Browse your encrypted data history.</p>
          </div>
        </Link>
        <Link href="/restore" className="group relative overflow-hidden bg-white dark:glass-panel p-6 rounded-2xl text-left border border-slate-200 dark:border-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4 group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300"><span className="material-icons-round text-2xl">replay</span></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Restore Files</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Recover lost files from any point in time.</p>
          </div>
        </Link>
      </div>

      {/* How Plakar Works */}
      <div className="bg-slate-100 dark:bg-[#162032] rounded-3xl p-8 border border-slate-200 dark:border-slate-700/30">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">How Plakar Works</h2>
          <a href="https://plakar.io" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
            Documentation<span className="material-icons-round text-sm">arrow_forward</span>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
          {[
            { icon: 'source', color: 'text-indigo-500', title: '1. Select Source', desc: 'Choose directories or files you want to secure.' },
            { icon: 'lock_reset', color: 'text-purple-500', title: '2. Encrypt & Push', desc: 'Data is chunked, deduplicated, encrypted, and stored.' },
            { icon: 'cloud_download', color: 'text-emerald-500', title: '3. Restore Anytime', desc: 'Restore specific files or full snapshots anytime.' },
          ].map(s => (
            <div key={s.title} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-[#162032] flex items-center justify-center mb-4 shadow-sm">
                <span className={`material-icons-round text-4xl ${s.color}`}>{s.icon}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{s.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 px-4">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
