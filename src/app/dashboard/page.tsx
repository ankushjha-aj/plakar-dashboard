'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getActivityLog, clearActivityLog, ActivityEntry } from '@/lib/activityLog';

interface RepoInfo { path: string; name: string; createdAt: string; isArchived?: boolean; }
interface StatusInfo {
  installed: boolean;
  version: string;
  path: string;
  os: 'windows' | 'macos' | 'linux';
  arch: string;
}

// Icon + colour for each activity type
const activityMeta: Record<ActivityEntry['type'], { icon: string; color: string; bg: string; label: string }> = {
  backup: { icon: 'backup', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', label: 'Backup' },
  restore: { icon: 'restore', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Restore' },
  repo_created: { icon: 'create_new_folder', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', label: 'Repository' },
  repo_archived: { icon: 'inventory_2', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Archived' },
  repo_restored: { icon: 'unarchive', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/30', label: 'Restored' },
};

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  const activeRepos = repos.filter(r => !r.isArchived);

  // Load everything on mount
  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    fetch('/api/plakar/repos').then(r => r.json()).then(d => setRepos(d.repos || [])).catch(() => { });
    setActivityLog(getActivityLog());
  }, []);

  // Poll activity log every 3s so it auto-refreshes if user performs actions in another tab
  useEffect(() => {
    const id = setInterval(() => setActivityLog(getActivityLog()), 3000);
    return () => clearInterval(id);
  }, []);

  // Track scroll position in the log card
  const handleLogScroll = () => {
    const el = logScrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 10);
  };

  const downloadInstallScript = async (file: 'ps1' | 'readme') => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/plakar/install-scripts?file=${file}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file === 'ps1' ? 'install-plakar.ps1' : 'install-plakar-readme.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setDownloading(false);
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── Page Title ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Your Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">An overview of your backup system at a glance.</p>
      </div>

      {/* ── CLI Not Found Banner ── */}
      {status && !status.installed && (
        <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-950/20 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-xl text-red-500">error_outline</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-red-700 dark:text-red-400 mb-1">Plakar CLI Not Found</h3>
              <p className="text-sm text-red-600/80 dark:text-red-300/70 mb-3">
                Install the Plakar CLI to enable backup, restore, and snapshot operations.
              </p>
              {status.os === 'macos' && (
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                  <code className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">brew install plakar</code>
                </div>
              )}
              {status.os === 'linux' && (
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                  <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all">
                    curl -sSfL https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_linux_amd64.tar.gz | sudo tar xz -C /usr/local/bin
                  </code>
                </div>
              )}
              {status.os === 'windows' && (
                <button onClick={() => downloadInstallScript('ps1')} disabled={downloading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                  <span className="material-icons-round text-lg">download</span>
                  {downloading ? 'Downloading...' : 'Download Install Script'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding card (zero repos) ── */}
      {status?.installed && activeRepos.length === 0 && activityLog.length === 0 && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-[#111827] dark:to-purple-950/20 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
              <span className="material-icons-round text-white text-3xl">rocket_launch</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Welcome to Plakar Dashboard!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Start by creating your first encrypted backup repository, then push your first backup. Activity will appear here automatically.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/repositories"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                <span className="material-icons-round text-lg">add_circle</span>
                Create Repository
              </Link>
              <Link href="/backup"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <span className="material-icons-round text-lg text-indigo-500">backup</span>
                Run a Backup
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Single stat: Total Repositories ── */}
      <div className="mb-8">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="material-icons-round text-indigo-500 text-xl">dns</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Repositories</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {status?.installed
                  ? <span className="text-emerald-500 font-bold">● CLI v{status.version}</span>
                  : <span className="text-red-400 font-bold">● CLI not found</span>
                }
              </p>
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{activeRepos.length}</p>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left+Center: Activity Log (spans 2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1">

            {/* Log header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-indigo-400 text-lg">schedule</span>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Recent Activity</h2>
                {activityLog.length > 0 && (
                  <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    {activityLog.length}
                  </span>
                )}
              </div>
              {activityLog.length > 0 && (
                <button
                  onClick={() => { clearActivityLog(); setActivityLog([]); }}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                  title="Clear all activity"
                >
                  <span className="material-icons-round text-[14px]">delete_sweep</span>
                  Clear
                </button>
              )}
            </div>

            {/* Log scroll area — fixed max height, shows scrollbar when full */}
            <div
              ref={logScrollRef}
              onScroll={handleLogScroll}
              className="overflow-y-auto relative"
              style={{ maxHeight: '480px' }}
            >
              {activityLog.length === 0 ? (
                /* Empty state */
                <div className="py-16 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons-round text-2xl text-slate-300 dark:text-slate-600">history</span>
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">No activity yet</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every backup, restore, and repository action will be recorded here automatically.
                  </p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-sm mx-auto text-left">
                    {[
                      { icon: 'create_new_folder', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'Create a repository' },
                      { icon: 'backup', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'Run a backup' },
                      { icon: 'restore', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'Restore a snapshot' },
                    ].map(item => (
                      <div key={item.text} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <span className={`material-icons-round text-base ${item.color}`}>{item.icon}</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activityLog.map((entry, i) => {
                    const meta = activityMeta[entry.type];
                    return (
                      <div
                        key={entry.id}
                        className="px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className={`material-icons-round text-base ${meta.color}`}>{meta.icon}</span>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{entry.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{entry.detail}</p>
                        </div>

                        {/* Badge + Time */}
                        <div className="flex-shrink-0 text-right">
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">{relativeTime(entry.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* "Scroll for more" indicator when log is long and user hasn't scrolled down */}
            {activityLog.length >= 8 && !isAtBottom && (
              <div className="flex-shrink-0 px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-gradient-to-t from-white dark:from-[#111827] to-transparent text-center">
                <button
                  onClick={() => logScrollRef.current?.scrollTo({ top: logScrollRef.current.scrollHeight, behavior: 'smooth' })}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mx-auto"
                >
                  <span className="material-icons-round text-[14px] animate-bounce">keyboard_arrow_down</span>
                  {activityLog.length - 7} more entries below
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-1.5">
              {[
                { href: '/backup', icon: 'backup', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', hov: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400', label: 'New Backup', sub: 'Create an encrypted snapshot' },
                { href: '/restore', icon: 'restore', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', hov: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400', label: 'Restore Files', sub: 'Recover from a snapshot' },
                { href: '/repositories', icon: 'storage', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', hov: 'group-hover:text-purple-600 dark:group-hover:text-purple-400', label: 'Repositories', sub: 'Manage & browse repositories' },
                { href: '/compare', icon: 'compare_arrows', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/30', hov: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400', label: 'Compare Snapshots', sub: 'Diff two backup points' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-icons-round ${a.color} text-lg`}>{a.icon}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold text-slate-700 dark:text-slate-200 ${a.hov} transition-colors`}>{a.label}</p>
                    <p className="text-[11px] text-slate-400">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Repository Overview (up to 3) */}
          {activeRepos.length > 0 && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Repositories</h2>
                <Link href="/repositories" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
                  Manage <span className="material-icons-round text-[13px]">open_in_new</span>
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeRepos.slice(0, 3).map((repo, idx) => {
                  const isCloud = repo.path.startsWith('s3://') || repo.path.toLowerCase().includes('cloud');
                  return (
                    <div key={idx} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCloud ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                        <span className={`material-icons-round text-base ${isCloud ? 'text-cyan-400' : 'text-indigo-400'}`}>{isCloud ? 'cloud' : 'dns'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{repo.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{repo.path}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 flex-shrink-0">{formatDate(repo.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
              {activeRepos.length > 3 && (
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/60 text-center">
                  <Link href="/repositories" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
                    +{activeRepos.length - 3} more →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* System Info */}
          {status?.installed && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">System Info</h2>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'CLI Version', value: status.version, className: 'font-mono font-bold text-slate-700 dark:text-slate-300' },
                  { label: 'Platform', value: `${status.os} / ${status.arch}`, className: 'font-bold text-slate-700 dark:text-slate-300 capitalize' },
                  { label: 'Encryption', value: 'AES-256-GCM', className: 'font-bold text-emerald-600 dark:text-emerald-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400 font-medium">{row.label}</span>
                    <span className={row.className}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
