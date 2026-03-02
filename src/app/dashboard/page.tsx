'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RepoInfo { path: string; name: string; createdAt: string; }
interface StatusInfo {
  installed: boolean;
  version: string;
  path: string;
  os: 'windows' | 'macos' | 'linux';
  arch: string;
}
interface SnapInfo { snapshotId: string; timestamp: string; path: string; size: string; duration: string; }

export default function OverviewPage() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [allSnaps, setAllSnaps] = useState<SnapInfo[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    fetch('/api/plakar/repos').then(r => r.json()).then(d => setRepos(d.repos || [])).catch(() => { });
  }, []);

  // Fetch snapshots from all repos (use sessionStorage passphrase if available)
  useEffect(() => {
    if (repos.length === 0) return;
    setLoadingSnaps(true);
    const fetchAll = async () => {
      const snaps: SnapInfo[] = [];
      for (const repo of repos) {
        const storedPass = sessionStorage.getItem(`plakar_pass_${repo.path}`);
        if (!storedPass) continue;
        try {
          const r = await fetch('/api/plakar/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repository: repo.path, passphrase: storedPass })
          });
          const d = await r.json();
          if (d.success && d.snapshots) snaps.push(...d.snapshots);
        } catch { /* skip */ }
      }
      setAllSnaps(snaps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setLoadingSnaps(false);
    };
    fetchAll();
  }, [repos]);

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

  // Compute total size in MB
  const totalSizeMB = allSnaps.reduce((acc, s) => {
    const match = s.size.match(/([\d.]+)\s*(B|KiB|MiB|GiB|TB|KB|MB|GB)/i);
    if (!match) return acc;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'B') return acc + num / (1024 * 1024);
    if (unit === 'KB' || unit === 'KIB') return acc + num / 1024;
    if (unit === 'MB' || unit === 'MIB') return acc + num;
    if (unit === 'GB' || unit === 'GIB') return acc + num * 1024;
    if (unit === 'TB') return acc + num * 1024 * 1024;
    return acc;
  }, 0);

  const relativeTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `about ${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── Page Title ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Your dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">An overview of your data.</p>
      </div>

      {/* ── CLI Not Found Banner ── */}
      {status && !status.installed && (
        <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-950/20 p-5 relative overflow-hidden">
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
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                    <code className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">brew install plakar</code>
                  </div>
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
                <button
                  onClick={() => downloadInstallScript('ps1')}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-icons-round text-lg">download</span>
                  {downloading ? 'Downloading...' : 'Install Plakar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total snapshots</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{allSnaps.length}</p>
          <p className="text-xs text-slate-400 mt-1">{allSnaps.length} over the last 30 days</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Logical size</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {totalSizeMB >= 1024 ? `${(totalSizeMB / 1024).toFixed(1)} GB` : `${totalSizeMB.toFixed(0)} MB`}
          </p>
          <p className="text-xs text-slate-400 mt-1">{repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Repositories</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{repos.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {status?.installed ? (
              <span className="text-emerald-500 font-bold">● CLI v{status.version || 'installed'}</span>
            ) : (
              <span className="text-red-400 font-bold">● CLI not found</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Latest Snapshots (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Latest snapshots</h2>
            <Link href="/repositories" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
              View all <span className="material-icons-round text-[14px]">open_in_new</span>
            </Link>
          </div>

          {loadingSnaps && (
            <div className="py-12 text-center text-slate-400">
              <span className="spinner border-2 border-indigo-500/20 border-t-indigo-500 rounded-full w-6 h-6 animate-spin inline-block mb-2" />
              <p className="text-xs font-bold">Loading snapshots...</p>
            </div>
          )}

          {!loadingSnaps && allSnaps.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <span className="material-icons-round text-3xl mb-2 block">inbox</span>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No snapshots yet</p>
              <p className="text-xs text-slate-400 mt-1">Unlock a repository to see its snapshots here.</p>
            </div>
          )}

          {!loadingSnaps && allSnaps.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allSnaps.slice(0, 8).map((s, i) => {
                const folderName = s.path ? s.path.split('/').filter(Boolean).pop() || s.path : '';
                return (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 w-20 truncate">{s.snapshotId.substring(0, 8)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{folderName || s.path}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{relativeTime(s.timestamp)}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap w-16 text-right">{s.size}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">Quick actions</h2>
            <div className="space-y-2">
              <Link href="/backup" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-indigo-500 text-lg">backup</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">New Backup</p>
                  <p className="text-[11px] text-slate-400">Create an encrypted snapshot</p>
                </div>
              </Link>
              <Link href="/restore" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-emerald-500 text-lg">restore</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Restore Files</p>
                  <p className="text-[11px] text-slate-400">Recover from a snapshot</p>
                </div>
              </Link>
              <Link href="/repositories" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-purple-500 text-lg">storage</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Repositories</p>
                  <p className="text-[11px] text-slate-400">Manage & browse repositories</p>
                </div>
              </Link>
            </div>
          </div>

          {/* System Info Card */}
          {status && status.installed && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">System info</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Version</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{status.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{status.os} / {status.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Binary</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={status.path}>{status.path}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
