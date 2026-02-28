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

  return (
    <div className="animate-fade-in-up">

      {/* ─── Top status bar ─── */}
      <div className="flex items-center justify-between mb-4 lg:mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.15em]">System Online</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/compare"
            className="glass-card px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2"
          >
            <span className="material-icons-round text-sm">compare</span>
            <span className="hidden sm:inline">Compare</span>
          </Link>
          {status && (
            <div className={`glass-card flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold ${status.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${status.installed ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
              CLI {status.installed ? `v${status.version}` : 'N/A'}
            </div>
          )}
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="mb-16 lg:mb-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">by Ankush</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-5 lg:mb-6 tracking-tight leading-[1.08]">
            Secure your data with{' '}
            <span className="text-gradient">Plakar</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-8 lg:mb-10 max-w-2xl">
            The Open Source standard for unified resilience. Secure your Cloud, SaaS, and On-Prem data with native zero-trust encryption and enterprise-grade architecture.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/backup?init=true"
              className="btn-glow inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-indigo-500/50 transition-all"
            >
              <span className="material-icons-round text-lg">add</span>
              New Repository
            </Link>
            <Link
              href="/repositories"
              className="glass-card inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <span className="material-icons-round text-lg">storage</span>
              View Repositories
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CLI Not Found Banner ─── */}
      {status && !status.installed && (
        <div className="mb-12 lg:mb-16 animate-fade-in-up">
          <div className="rounded-2xl border-2 border-red-300/50 dark:border-red-500/20 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/10 p-6 lg:p-8 relative overflow-hidden">
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
      <section className="mb-16 lg:mb-20">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {[
            { href: '/backup', icon: 'backup', color: 'from-indigo-500 via-blue-500 to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', title: 'Run Backup', desc: 'Create encrypted snapshots of your files instantly.' },
            { href: '/snapshots', icon: 'folder_open', color: 'from-purple-500 via-fuchsia-500 to-pink-400', bg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400', title: 'Browse Snapshots', desc: 'Explore data history, audit changes and download.' },
            { href: '/restore', icon: 'replay', color: 'from-emerald-500 via-teal-500 to-cyan-400', bg: 'bg-teal-50 dark:bg-teal-900/20', iconColor: 'text-teal-600 dark:text-teal-400', title: 'Restore Files', desc: 'Recover specific files from any snapshot version.' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="group relative glass-card rounded-xl p-6 overflow-hidden flex items-start gap-4">
              <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500`} />
              <div className={`relative z-10 p-3 ${a.bg} rounded-lg ${a.iconColor} flex-shrink-0`}>
                <span className="material-icons-round text-2xl">{a.icon}</span>
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a.desc}</p>
              </div>
              <span className="relative z-10 material-icons-round text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all self-center">arrow_forward</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── What is Plakar? ─── */}
      <section className="mb-16 lg:mb-20">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">What is Plakar?</h2>
        </div>
        <div className="gradient-border overflow-hidden">
          {/* Description header */}
          <div className="p-6 lg:p-8 border-b border-slate-100/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-base lg:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              <strong className="text-slate-900 dark:text-white">Plakar</strong> is the open-source standard for unified data resilience. It provides enterprise-grade backup and restore capabilities with developer-friendly tooling — encrypted, deduplicated snapshots with instant browsing and zero-knowledge workflows across cloud and on-prem environments.
            </p>
          </div>
          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {[
              { icon: 'memory', color: 'text-indigo-500', divider: 'border-b sm:border-b sm:border-r', title: 'Kloset Engine', desc: 'Performs high-density deduplication before encryption — slashing storage costs without exposing plaintext.' },
              { icon: 'security', color: 'text-emerald-500', divider: 'border-b', title: 'Zero-Trust Architecture', desc: 'Assumes network is compromised and storage is untrusted. Data safety is mathematically guaranteed.' },
              { icon: 'lock', color: 'text-purple-500', divider: 'border-b sm:border-b-0 sm:border-r', title: 'Immutable Snapshots', desc: 'Read-only by design. Cryptographic checks guarantee restore integrity with zero bit-rot.' },
              { icon: 'public', color: 'text-cyan-500', divider: '', title: 'CNCF & Linux Foundation', desc: 'Committed to open standards and vendor-lock-free data storage. No proprietary chains attached.' },
            ].map(item => (
              <div key={item.title} className={`p-6 lg:p-8 ${item.divider} border-slate-100/60 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors`}>
                <div className="flex gap-4">
                  <span className={`material-icons-round text-3xl ${item.color} mt-0.5 flex-shrink-0`}>{item.icon}</span>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security & Encryption ─── */}
      <section className="mb-16 lg:mb-20">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">Security &amp; Encryption</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Security cards */}
          <div className="flex-1 space-y-4">
            {[
              { icon: 'enhanced_encryption', color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400', title: 'AES-256-GCM Encryption', desc: 'Your passphrase never leaves the client — all encryption and decryption happens locally on your machine, ensuring true zero-knowledge privacy.' },
              { icon: 'data_object', color: 'from-purple-500 to-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400', title: 'Content-Aware Deduplication', desc: 'Data is chunked into content-defined blocks. Identical blocks across snapshots are stored only once, dramatically reducing storage.' },
              { icon: 'verified_user', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', title: 'SHA-256 Integrity Proofs', desc: 'During restore, every block is cryptographically verified — guaranteeing zero bit-rot and tamper detection.' },
              { icon: 'code', color: 'from-amber-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', title: 'Open Formats, No Lock-In', desc: 'Data is stored in open formats, readable by open-source code. Your backups are portable and vendor-free.' },
            ].map(item => (
              <div key={item.title} className="glass-card rounded-xl p-5 flex gap-4 items-start">
                <div className={`p-3 rounded-lg ${item.bg} flex-shrink-0`}>
                  <span className="material-icons-round">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lock visual panel — binary rain only */}
          <div className="lg:w-56 xl:w-64 flex-shrink-0 relative rounded-2xl overflow-hidden bg-indigo-950 dark:bg-[#060b14] flex items-center justify-center border border-indigo-900/60 dark:border-slate-800 shadow-2xl min-h-[320px] lg:min-h-0">

            {/* ── Binary rain columns ── */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              {[
                { chars: '10110010', left: '6%', dur: '3.2s', delay: '0s' },
                { chars: '01001101', left: '18%', dur: '4.1s', delay: '-1.4s' },
                { chars: '11010011', left: '30%', dur: '2.8s', delay: '-0.6s' },
                { chars: '00110110', left: '43%', dur: '3.7s', delay: '-2.1s' },
                { chars: '10101010', left: '56%', dur: '4.5s', delay: '-0.9s' },
                { chars: '01110100', left: '70%', dur: '3.0s', delay: '-1.7s' },
                { chars: '11001001', left: '82%', dur: '4.8s', delay: '-0.3s' },
                { chars: '10010110', left: '93%', dur: '3.5s', delay: '-2.5s' },
              ].map((col, i) => (
                <div
                  key={i}
                  className="absolute top-0 font-mono text-[10px] leading-[1.9] flex flex-col"
                  style={{
                    left: col.left,
                    color: i % 3 === 0
                      ? 'rgba(129,140,248,0.55)'   /* indigo */
                      : i % 3 === 1
                        ? 'rgba(167,139,250,0.45)'   /* violet */
                        : 'rgba(52,211,153,0.4)',     /* emerald */
                    animation: `binary-rain ${col.dur} linear infinite`,
                    animationDelay: col.delay,
                  }}
                >
                  {col.chars.split('').map((b, j) => (
                    <span
                      key={j}
                      style={{
                        animation: `char-flicker ${parseFloat(col.dur) * 0.8}s ease-in-out infinite`,
                        animationDelay: `${j * 0.14}s`,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* ── Soft radial glow ── */}
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
            />

            {/* ── Bottom fade ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 dark:from-[#060b14]/80 via-transparent to-transparent" />

            {/* ── Lock + status ── */}
            <div className="relative z-10 flex flex-col items-center text-center px-5">
              <div className="relative mb-5">
                <div
                  className="absolute -inset-6 rounded-full blur-2xl"
                  style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)' }}
                />
                <span
                  className="material-icons-round text-7xl relative"
                  style={{ color: '#818cf8', filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.85))' }}
                >
                  lock
                </span>
              </div>

              {/* Block progress bar */}
              <div className="flex gap-[3px] mb-4">
                {[1, 1, 1, 1, 1, 0, 0, 0].map((filled, i) => (
                  <div
                    key={i}
                    className="w-3 h-1.5 rounded-sm"
                    style={{
                      background: filled ? `rgba(99,102,241,${0.45 + i * 0.07})` : 'rgba(255,255,255,0.07)',
                      boxShadow: filled ? '0 0 5px rgba(99,102,241,0.5)' : 'none',
                      animation: filled ? 'block-fill 2.4s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.28}s`,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{ animation: 'dot-bounce 1.1s ease-in-out infinite', boxShadow: '0 0 5px rgba(52,211,153,0.9)' }}
                />
                <span className="text-[9px] font-mono text-emerald-400 tracking-[0.22em]">ENCRYPTING</span>
              </div>
              <div className="text-[9px] font-mono text-indigo-400/50 tracking-wider">AES-256-GCM · SHA-256</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── How This Dashboard Works ─── */}
      <section className="mb-12 lg:mb-16">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">How This Dashboard Works</h2>
        </div>
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-3xl">
            This dashboard is a <strong className="text-slate-900 dark:text-white">web-based UI layer</strong> built on top of the Plakar CLI. It communicates with the locally installed{' '}
            <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono">plakar</code>{' '}
            binary through internal API routes — translating browser actions into CLI commands.
          </p>

          {/* Timeline steps */}
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300/60 dark:before:via-slate-700/60 before:to-transparent">
            {[
              { step: '01', icon: 'add_circle', color: 'text-indigo-500', title: 'Create a Repository', desc: 'Navigate to Backup → Initialize Mode. Select a folder, set a passphrase.', cmd: 'plakar on <path> create' },
              { step: '02', icon: 'backup', color: 'text-purple-500', title: 'Run a Backup', desc: 'Choose source directory + target repository. Creates encrypted, deduplicated snapshot.', cmd: 'plakar on <repo> push <source>' },
              { step: '03', icon: 'folder_open', color: 'text-cyan-500', title: 'Browse Snapshots', desc: 'Unlock a repository with your passphrase. Browse the file tree, download individual files.' },
              { step: '04', icon: 'restore', color: 'text-emerald-500', title: 'Restore Files', desc: 'Recover files from any snapshot to any destination. All decryption is client-side.' },
            ].map((item, idx) => (
              <div key={item.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                {/* Step bubble */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <span className="text-xs font-bold text-indigo-500">{item.step}</span>
                </div>
                {/* Card */}
                <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-slate-100/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <span className={`material-icons-round ${item.color}`}>{item.icon}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  {item.cmd && (
                    <div className="mt-3 bg-slate-900 dark:bg-black/40 rounded-lg p-3 font-mono text-xs text-slate-300 border border-slate-700 dark:border-white/5 overflow-x-auto">
                      <span className="text-purple-400">plakar</span>
                      {' '}
                      <span className="text-slate-300">{item.cmd.replace('plakar ', '')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info bar */}
          <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm text-emerald-800 dark:text-emerald-400">
            <span className="material-icons-round text-lg flex-shrink-0">info</span>
            <p>The entire architecture runs locally — no cloud dependency, no external calls. Your data stays on your machine.</p>
          </div>
        </div>
      </section >

      {/* ─── Footer ─── */}
      < div className="border-t border-slate-200/30 dark:border-white/5 pt-6 pb-4 text-center" >
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Powered by <strong className="text-slate-600 dark:text-slate-300">Ankush Kumar Jha</strong>
        </p>
      </div >

    </div >
  );
}
