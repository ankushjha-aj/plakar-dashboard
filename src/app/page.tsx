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

export default function OverviewPage() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
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
    <div className="animate-fade-in-up w-full">



      {/* ─── What is Plakar? ─── */}
      <section className="mb-16 lg:mb-20 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">What is Plakar?</h2>
          </div>
          {status && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status.installed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} animate-pulse`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${status.installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {status.installed ? 'CLI Connected' : 'CLI Not Found'}
              </span>
            </div>
          )}
        </div>
        <div className="gradient-border overflow-hidden w-full">
          {/* Description header */}
          <div className="p-5 lg:p-6 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed w-full">
              <p>
                <strong className="text-slate-900 dark:text-white">Plakar</strong> is a modern, open-source, snapshot-based backup tool designed to securely back up and restore files, directories, and applications. It focuses on simplicity, strong encryption, and efficient storage. Instead of copying everything on each backup, Plakar creates snapshot IDs that represent the exact state of your data at a specific moment in time. Each snapshot is incremental, meaning only the changes from previous backups are stored, which significantly reduces storage usage and improves performance.
              </p>
              <p>
                Plakar uses content-addressed storage, so identical data blocks are stored only once (deduplication). This makes it efficient for environments where backups run frequently. All data inside a repository is encrypted, ensuring security even if the storage backend is compromised. It is primarily CLI-driven, making it ideal for DevOps workflows, automation pipelines, cron jobs, and infrastructure environments. Because it does not provide a heavy built-in UI, many users build custom dashboards to visualize repositories, snapshots, and restore operations.
              </p>
              <p>
                In short, Plakar is a lightweight, secure, automation-friendly backup system built around snapshot IDs, incremental backups, encryption, and repository-based storage, making it well-suited for server environments and modern infrastructure workflows.
              </p>
            </div>
          </div>
          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
            {[
              { icon: 'memory', color: 'text-indigo-500', title: 'Kloset Engine', desc: 'Performs high-density deduplication before encryption — slashing storage costs without exposing plaintext.' },
              { icon: 'security', color: 'text-emerald-500', title: 'Zero-Trust Architecture', desc: 'Assumes network is compromised and storage is untrusted. Data safety is mathematically guaranteed.' },
              { icon: 'lock', color: 'text-purple-500', title: 'Immutable Snapshots', desc: 'Read-only by design. Cryptographic checks guarantee restore integrity with zero bit-rot.' },
              { icon: 'public', color: 'text-cyan-500', title: 'CNCF & Linux Foundation', desc: 'Committed to open standards and vendor-lock-free data storage. No proprietary chains attached.' },
            ].map(item => (
              <div key={item.title} className="p-5 lg:p-6 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors w-full group">
                <div className="flex flex-col gap-4">
                  <span className={`material-icons-round text-3xl ${item.color} mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform`}>{item.icon}</span>
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
      <section className="mb-16 lg:mb-20 w-full">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">Security &amp; Encryption</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
          {/* Security cards */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
            {[
              { icon: 'enhanced_encryption', color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400', title: 'AES-256-GCM Encryption', desc: 'Your passphrase never leaves the client — all encryption and decryption happens locally on your machine, ensuring true zero-knowledge privacy.' },
              { icon: 'data_object', color: 'from-purple-500 to-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400', title: 'Content-Aware Deduplication', desc: 'Data is chunked into content-defined blocks. Identical blocks across snapshots are stored only once, dramatically reducing storage.' },
              { icon: 'verified_user', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', title: 'SHA-256 Integrity Proofs', desc: 'During restore, every block is cryptographically verified — guaranteeing zero bit-rot and tamper detection.' },
              { icon: 'code', color: 'from-amber-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', title: 'Open Formats, No Lock-In', desc: 'Data is stored in open formats, readable by open-source code. Your backups are portable and vendor-free.' },
            ].map(item => (
              <div key={item.title} className="glass-card rounded-xl p-5 flex gap-4 items-start w-full h-full">
                <div className={`p-3 rounded-lg ${item.bg} flex-shrink-0`}>
                  <span className="material-icons-round">{item.icon}</span>
                </div>
                <div className="flex-1 h-full">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lock visual panel — binary rain only */}
          <div className="lg:w-72 flex-shrink-0 relative rounded-2xl overflow-hidden bg-indigo-950 dark:bg-[#060b14] flex items-center justify-center border border-indigo-900/60 dark:border-slate-800 shadow-2xl min-h-[320px] lg:min-h-full">

            {/* ── Binary rain columns ── */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden w-full">
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
              className="absolute inset-0 w-full"
              style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
            />

            {/* ── Bottom fade ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 dark:from-[#060b14]/80 via-transparent to-transparent w-full" />

            {/* ── Lock + status ── */}
            <div className="relative z-10 flex flex-col items-center text-center px-5 w-full">
              <div className="relative mb-5 w-full flex justify-center">
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
              <div className="flex gap-[3px] mb-4 w-full justify-center">
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

              <div className="flex items-center justify-center gap-1.5 mb-1 w-full">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5"
                  style={{ animation: 'dot-bounce 1.1s ease-in-out infinite', boxShadow: '0 0 5px rgba(52,211,153,0.9)' }}
                />
                <span className="text-[9px] font-mono text-emerald-400 tracking-[0.22em]">ENCRYPTING</span>
              </div>
              <div className="text-[9px] font-mono text-indigo-400/50 tracking-wider text-center w-full">AES-256-GCM · SHA-256</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── How This Dashboard Works ─── */}
      <section className="mb-12 lg:mb-16 w-full">
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white">How This Dashboard Works</h2>
        </div>
        <div className="glass-card rounded-2xl p-6 lg:p-8 w-full">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 w-full">
            This dashboard is a <strong className="text-slate-900 dark:text-white">web-based UI layer</strong> built on top of the Plakar CLI. It communicates with the locally installed{' '}
            <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono">plakar</code>{' '}
            binary through internal API routes — translating browser actions into CLI commands.
          </p>

          {/* Timeline steps */}
          <div className="relative w-full space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300/60 dark:before:via-slate-700/60 before:to-transparent">
            {[
              { step: '01', icon: 'add_circle', color: 'text-indigo-500', title: 'Create a Repository', desc: 'Navigate to Backup → Initialize Mode. Select a folder, set a passphrase.', cmd: 'plakar on <path> create' },
              { step: '02', icon: 'backup', color: 'text-purple-500', title: 'Run a Backup', desc: 'Choose source directory + target repository. Creates encrypted, deduplicated snapshot.', cmd: 'plakar on <repo> push <source>' },
              { step: '03', icon: 'folder_open', color: 'text-cyan-500', title: 'Browse Snapshots', desc: 'Unlock a repository with your passphrase. Browse the file tree, download individual files.' },
              { step: '04', icon: 'restore', color: 'text-emerald-500', title: 'Restore Files', desc: 'Recover files from any snapshot to any destination. All decryption is client-side.' },
            ].map((item, idx) => (
              <div key={item.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group w-full">
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
          <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm text-emerald-800 dark:text-emerald-400 w-full">
            <span className="material-icons-round text-lg flex-shrink-0">info</span>
            <p>The entire architecture runs locally — no cloud dependency, no external calls. Your data stays on your machine.</p>
          </div>
        </div>
      </section >

      {/* ─── Footer ─── */}
      <div className="border-t border-slate-200/30 dark:border-white/5 pt-6 pb-4 text-center w-full" >
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Powered by <Link href="https://github.com/ankushjha-aj" target="_blank" rel="noopener noreferrer"><strong className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">Ankush Kumar Jha</strong></Link>
        </p>
      </div>

    </div>
  );
}
