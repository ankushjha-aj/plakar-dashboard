'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface RepoInfo { path: string; name: string; createdAt: string; }
interface StatusInfo {
  installed: boolean;
  version: string;
  path: string;
  os: 'windows' | 'macos' | 'linux';
  arch: string;
}

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    fetch('/api/plakar/repos').then(r => r.json()).then(d => setRepos(d.repos || [])).catch(() => { });
  }, []);

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

  /** Returns OS-appropriate path placeholder */
  const examplePath = (name: string) => {
    if (status?.os === 'macos' || status?.os === 'linux') return `~/Desktop/${name}`;
    return `C:\\Users\\You\\Desktop\\${name}`;
  };

  return (
    <div className="animate-fade-in-up">

      {/* ─── Hero ─── */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.15em]">System Online</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/compare" className="glass-card px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2">
              <span className="material-icons-round text-sm">compare</span><span className="hidden sm:inline">Compare</span>
            </Link>
            {status && (
              <div className={`glass-card flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold ${status.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${status.installed ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
                CLI {status.installed ? `v${status.version}` : 'N/A'}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 lg:mb-5 tracking-tight leading-[1.1]">
            Secure your data<br />
            with <span className="text-gradient">Plakar</span>
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-3">by Ankush</p>
          <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-6 lg:mb-8">
            The Open Source standard for unified resilience. Secure your Cloud, SaaS and On-Prem data with native zero-trust encryption.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/backup?init=true" className="btn-glow inline-flex items-center gap-2 px-5 py-3 lg:px-7 lg:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-indigo-500/50 transition-all">
              <span className="material-icons-round text-lg">add</span> New Repository
            </Link>
            <Link href="/repositories" className="glass-card inline-flex items-center gap-2 px-5 py-3 lg:px-7 lg:py-3.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
              <span className="material-icons-round text-lg">storage</span> Repositories
            </Link>
          </div>
        </div>
      </div>

      {/* ─── CLI Not Found Banner ─── */}
      {status && !status.installed && (
        <div className="mb-10 lg:mb-14 animate-fade-in-up">
          <div className="rounded-2xl border-2 border-red-300/50 dark:border-red-500/20 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/10 p-6 lg:p-8 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-2xl text-red-500">error_outline</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-red-700 dark:text-red-400 mb-1">
                    Plakar CLI Not Found
                  </h3>
                  <p className="text-sm text-red-600/80 dark:text-red-300/70 leading-relaxed">
                    The Plakar CLI binary was not detected on your system. Install it to enable backup, restore, and snapshot operations.
                  </p>
                </div>
              </div>

              {/* OS-specific instructions */}
              {status.os === 'windows' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-icons-round text-sm align-middle mr-1 text-blue-500">computer</span>
                    Windows Installation
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Download and run the PowerShell installer script. It will download the latest Plakar binary, install it to <code className="text-xs px-1.5 py-0.5 rounded bg-white/70 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono">%USERPROFILE%\plakar-cli</code>, and add it to your PATH.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadInstallScript('ps1')}
                      disabled={downloading}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 hover:shadow-blue-500/40 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-icons-round text-lg">download</span>
                      {downloading ? 'Downloading...' : 'Install Plakar (Windows)'}
                    </button>
                    <button
                      onClick={() => downloadInstallScript('readme')}
                      className="inline-flex items-center gap-2 px-5 py-3 glass-card rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                    >
                      <span className="material-icons-round text-lg">description</span>
                      Download README
                    </button>
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
                      <span className="text-slate-400 select-none">$</span> powershell -ExecutionPolicy Bypass -File install-plakar.ps1
                    </p>
                  </div>
                </div>
              )}

              {status.os === 'macos' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-icons-round text-sm align-middle mr-1 text-slate-500">laptop_mac</span>
                    macOS Installation
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Via Homebrew (recommended)</p>
                      <code className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">brew install plakar</code>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Via curl</p>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all">
                        curl -sSfL https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_darwin_amd64.tar.gz | tar xz -C /usr/local/bin
                      </code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    After installing, restart your terminal and verify with: <code className="font-mono text-indigo-500">plakar version</code>
                  </p>
                </div>
              )}

              {status.os === 'linux' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="material-icons-round text-sm align-middle mr-1 text-amber-500">terminal</span>
                    Linux Installation
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Debian / Ubuntu (apt)</p>
                      <code className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">sudo apt install plakar</code>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">RHEL / Fedora (yum/dnf)</p>
                      <code className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">sudo dnf install plakar</code>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Via curl (universal)</p>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono break-all">
                        curl -sSfL https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_linux_amd64.tar.gz | sudo tar xz -C /usr/local/bin
                      </code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    After installing, restart your terminal and verify with: <code className="font-mono text-indigo-500">plakar version</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center gap-3 mb-5 lg:mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 stagger-children">
          {[
            { href: '/backup', icon: 'backup', color: 'from-indigo-500 via-blue-500 to-cyan-400', title: 'Run Backup', desc: 'Encrypted snapshot of your files.' },
            { href: '/snapshots', icon: 'folder_open', color: 'from-purple-500 via-fuchsia-500 to-pink-400', title: 'Browse Snapshots', desc: 'Explore data history & download.' },
            { href: '/restore', icon: 'replay', color: 'from-emerald-500 via-teal-500 to-cyan-400', title: 'Restore Files', desc: 'Recover from any snapshot.' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="glass-card rounded-xl px-4 py-3 group relative overflow-hidden flex items-center gap-4">
              <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-icons-round text-lg">{a.icon}</span>
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.desc}</p>
              </div>
              <span className="relative z-10 material-icons-round text-sm text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">arrow_forward</span>
            </Link>
          ))}
        </div>
      </div>



      {/* ─── What is Plakar? ─── */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center gap-3 mb-5 lg:mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">What is Plakar?</h2>
        </div>
        <div className="glass-card rounded-2xl p-5 lg:p-6 mb-4">
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
            <strong className="text-slate-900 dark:text-white">Plakar</strong> is the open-source standard for unified data resilience. It provides enterprise-grade backup and restore capabilities with developer-friendly tooling — encrypted, deduplicated snapshots with instant browsing and zero-knowledge workflows across cloud and on-prem environments.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: 'memory', color: 'text-indigo-500', title: 'Kloset Engine', desc: 'Performs high-density deduplication before encryption — slashing storage costs without exposing plaintext.' },
              { icon: 'security', color: 'text-emerald-500', title: 'Zero-Trust Architecture', desc: 'Assumes network is compromised and storage is untrusted. Data safety is mathematically guaranteed.' },
              { icon: 'lock', color: 'text-purple-500', title: 'Immutable Snapshots', desc: 'Read-only by design. Cryptographic checks guarantee restore integrity with zero bit-rot.' },
              { icon: 'public', color: 'text-cyan-500', title: 'CNCF & Linux Foundation', desc: 'Committed to open standards and vendor-lock-free data storage. No proprietary chains.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100/50 dark:border-white/5">
                <span className={`material-icons-round text-xl ${item.color} mt-0.5 flex-shrink-0`}>{item.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Security & Encryption ─── */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center gap-3 mb-5 lg:mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500" />
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">Security & Encryption</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 items-stretch">
          <div className="flex-1 glass-card rounded-2xl p-5 lg:p-6">
            <div className="space-y-4">
              {[
                { icon: 'enhanced_encryption', color: 'from-indigo-500 to-blue-600', title: 'AES-256-GCM Encryption', desc: 'Your passphrase never leaves the client — all encryption and decryption happens locally on your machine, ensuring true zero-knowledge privacy.' },
                { icon: 'data_object', color: 'from-purple-500 to-pink-600', title: 'Content-Aware Deduplication', desc: 'Data is chunked into content-defined blocks. Identical blocks across snapshots are stored only once, dramatically reducing storage.' },
                { icon: 'verified_user', color: 'from-emerald-500 to-teal-600', title: 'SHA-256 Integrity Proofs', desc: 'During restore, every block is cryptographically verified — guaranteeing zero bit-rot and tamper detection.' },
                { icon: 'code', color: 'from-amber-500 to-orange-600', title: 'Open Formats, No Lock-In', desc: 'Data is stored in open formats, readable by open-source code. Your backups are portable and vendor-free.' },
              ].map(item => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                    <span className="material-icons-round text-base">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-56 flex-shrink-0 flex items-center">
            <img src="/security-shield.png" alt="Security & Encryption" className="w-full rounded-2xl shadow-lg shadow-indigo-500/10 border border-slate-200/20 dark:border-white/5" />
          </div>
        </div>
      </div>

      {/* ─── How This Dashboard Works ─── */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center gap-3 mb-5 lg:mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">How This Dashboard Works</h2>
        </div>
        <div className="glass-card rounded-2xl p-5 lg:p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
            This dashboard is a <strong className="text-slate-800 dark:text-white">web-based UI layer</strong> built on top of the Plakar CLI. It communicates with the locally installed <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono">plakar</code> binary through internal API routes — translating browser actions into CLI commands.
          </p>
          <div className="space-y-3">
            {[
              { step: '01', icon: 'add_circle', color: 'text-indigo-500', title: 'Create a Repository', desc: 'Navigate to Backup → Initialize Mode. Select a folder, set a passphrase.', cmd: 'plakar on <path> create' },
              { step: '02', icon: 'backup', color: 'text-purple-500', title: 'Run a Backup', desc: 'Choose source directory + target repository. Creates encrypted, deduplicated snapshot.', cmd: 'plakar on <repo> push <source>' },
              { step: '03', icon: 'folder_open', color: 'text-cyan-500', title: 'Browse Snapshots', desc: 'Unlock a repository with your passphrase. Browse the file tree, download individual files.' },
              { step: '04', icon: 'restore', color: 'text-emerald-500', title: 'Restore Files', desc: 'Recover files from any snapshot to any destination. All decryption is client-side.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 items-start p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100/50 dark:border-white/5">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-[9px] font-black text-indigo-400 tracking-[0.2em]">{item.step}</span>
                  <span className={`material-icons-round text-xl ${item.color}`}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  {item.cmd && (
                    <code className="inline-block mt-1.5 text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono">{item.cmd}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-100/50 dark:border-white/5">
            <span className="material-icons-round text-emerald-500 text-xs align-middle mr-1">info</span>
            The entire architecture runs locally — no cloud dependency, no external calls. Your data stays on your machine.
          </p>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-slate-200/30 dark:border-white/5 pt-6 pb-4 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Powered by <strong className="text-slate-600 dark:text-slate-300">Ankush Kumar Jha</strong>
        </p>
      </div>

    </div>
  );
}
