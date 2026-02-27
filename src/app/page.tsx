'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardPage() {
  const [status, setStatus] = useState<{ installed: boolean; version: string; path: string } | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetch('/api/plakar/status').then(r => r.json()).then(setStatus).catch(() => { });
    if (!localStorage.getItem('plakar-comparison-seen')) setShowComparison(true);
  }, []);

  const dismissComparison = () => { setShowComparison(false); localStorage.setItem('plakar-comparison-seen', '1'); };

  return (
    <div className="animate-fade-in-up">
      {/* Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={dismissComparison}>
          <div className="gradient-border max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="relative z-10 p-6 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dashboard vs Plakar UI</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">How our dashboard goes beyond the built-in CLI interface.</p>
              </div>
              <button onClick={dismissComparison} className="p-2 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
                <span className="material-icons-round text-slate-400">close</span>
              </button>
            </div>
            <div className="relative z-10 p-6 overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200/50 dark:border-white/5">
                  <th className="text-left py-3 px-2 font-bold text-slate-700 dark:text-slate-300">Feature</th>
                  <th className="text-center py-3 px-2 font-bold text-slate-500">Plakar UI</th>
                  <th className="text-center py-3 px-2 font-bold text-gradient">Our Dashboard</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                  {[
                    ['Browse Snapshots', true, true], ['Browse Files', true, true], ['Download Files', true, true],
                    ['Create Repository', false, true], ['Run Backup from UI', false, true], ['Restore from UI', false, true],
                    ['Delete Snapshots', false, true], ['Native Folder Picker', false, true], ['Multi-Repo Dashboard', false, true],
                    ['Dark / Light Theme', false, true], ['Passphrase Prompt', false, true],
                  ].map(([feat, plakar, ours]) => (
                    <tr key={feat as string} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                      <td className="py-3 px-2 text-slate-700 dark:text-slate-300 font-medium">{feat as string}</td>
                      <td className="py-3 px-2 text-center">{plakar ? <span className="text-emerald-500 material-icons-round text-base">check_circle</span> : <span className="text-red-400/60 material-icons-round text-base">cancel</span>}</td>
                      <td className="py-3 px-2 text-center"><span className="text-emerald-500 material-icons-round text-base">check_circle</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="relative z-10 p-4 border-t border-slate-200/50 dark:border-white/5 flex justify-end">
              <button onClick={dismissComparison} className="btn-glow px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-0.5 cursor-pointer">Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.15em]">System Online</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button onClick={() => setShowComparison(true)} className="glass-card px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-icons-round text-sm">compare</span><span className="hidden sm:inline">Compare</span>
            </button>
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
          <p className="text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-6 lg:mb-8">
            Enterprise-grade encrypted backups with deduplication. Create repositories, take snapshots, and restore files — all from your browser.
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

      {/* Quick Actions */}
      <div className="mb-10 lg:mb-14">
        <div className="flex items-center gap-3 mb-5 lg:mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 stagger-children">
          {[
            { href: '/backup', icon: 'backup', color: 'from-indigo-500 via-blue-500 to-cyan-400', title: 'Run Backup', desc: 'Create an encrypted snapshot of your local files with one click.' },
            { href: '/snapshots', icon: 'folder_open', color: 'from-purple-500 via-fuchsia-500 to-pink-400', title: 'Browse Snapshots', desc: 'Explore your encrypted data history and download files.' },
            { href: '/restore', icon: 'replay', color: 'from-emerald-500 via-teal-500 to-cyan-400', title: 'Restore Files', desc: 'Recover files from any snapshot to any destination.' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="glass-card rounded-2xl p-5 lg:p-7 group relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-lg mb-4 lg:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <span className="material-icons-round text-xl lg:text-2xl">{a.icon}</span>
                </div>
                <h3 className="text-base lg:text-lg font-extrabold text-slate-900 dark:text-white mb-2">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a.desc}</p>
                <div className="mt-3 lg:mt-4 flex items-center gap-1 text-indigo-500 text-sm font-bold opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300">
                  Get started <span className="material-icons-round text-sm">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-2xl lg:rounded-3xl p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">How Plakar Works</h2>
          </div>
          <a href="https://plakar.io" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
            Docs <span className="material-icons-round text-sm">open_in_new</span>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden md:block absolute top-14 left-[18%] right-[18%] h-[2px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30" />
          {[
            { icon: 'source', gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/25', num: '01', title: 'Select Source', desc: 'Choose files to protect.' },
            { icon: 'enhanced_encryption', gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/25', num: '02', title: 'Encrypt & Push', desc: 'Deduplicated and encrypted.' },
            { icon: 'cloud_download', gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', num: '03', title: 'Restore Anytime', desc: 'Recover files or snapshots.' },
          ].map(s => (
            <div key={s.title} className="relative z-10 flex flex-col items-center text-center group">
              <div className={`w-20 h-20 lg:w-28 lg:h-28 rounded-2xl lg:rounded-3xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 lg:mb-5 shadow-xl ${s.shadow} group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-300`}>
                <span className="material-icons-round text-3xl lg:text-4xl text-white">{s.icon}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">{s.num}</span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{s.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
