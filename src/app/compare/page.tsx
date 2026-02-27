'use client';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const features = [
    { name: 'Browse Snapshots', plakar: true, dashboard: true, note: 'Both allow browsing snapshots within a repository.' },
    { name: 'Browse Files in Snapshot', plakar: true, dashboard: true, note: 'Navigate the file tree within any snapshot.' },
    { name: 'Download Files', plakar: true, dashboard: true, note: 'Download individual files from snapshots.' },
    { name: 'Create Repository', plakar: false, dashboard: true, note: 'Initialize new encrypted repos from the browser.' },
    { name: 'Run Backup from UI', plakar: false, dashboard: true, note: 'Push snapshots to repos without touching the CLI.' },
    { name: 'Restore from UI', plakar: false, dashboard: true, note: 'Recover files to any destination via browser.' },
    { name: 'Native Folder Picker', plakar: false, dashboard: true, note: 'System folder picker for selecting paths.' },
    { name: 'Multi-Repo Dashboard', plakar: false, dashboard: true, note: 'Manage all repositories in one list view.' },
    { name: 'Dark / Light Theme', plakar: false, dashboard: true, note: 'Toggle between dark and light mode.' },
    { name: 'Passphrase Prompt', plakar: false, dashboard: true, note: 'Secure passphrase entry for repo access.' },
    { name: 'Repository Stats', plakar: false, dashboard: true, note: 'At-a-glance stats: count, encryption, dates.' },
    { name: 'Latest Tags', plakar: false, dashboard: true, note: 'Highlights newest repos and snapshots.' },
];

const designDiffs = [
    { aspect: 'Interface', plakar: 'Terminal-based CLI output', dashboard: 'Modern glassmorphism web UI with animations' },
    { aspect: 'Theme', plakar: 'Terminal colors only', dashboard: 'Dark + Light mode with gradient accents' },
    { aspect: 'Navigation', plakar: 'CLI flags and commands', dashboard: 'Sidebar navigation with collapsible menu' },
    { aspect: 'Feedback', plakar: 'Text stdout/stderr', dashboard: 'Animated toasts, spinners, status badges' },
    { aspect: 'Discovery', plakar: 'Manual repo path entry', dashboard: 'Auto-discovered repos with list view' },
];

const archDiffs = [
    { aspect: 'Frontend', plakar: 'Built-in Go HTTP server with embedded React UI', dashboard: 'Next.js 16 with Tailwind CSS v4' },
    { aspect: 'Backend', plakar: 'Direct Go binary execution', dashboard: 'Next.js API routes invoking plakar CLI' },
    { aspect: 'Auth', plakar: 'No passphrase required (local daemon)', dashboard: 'Client-side passphrase for every repo unlock' },
    { aspect: 'Data Flow', plakar: 'In-process memory access', dashboard: 'CLI stdout parsing via child_process' },
    { aspect: 'Deployment', plakar: 'Single binary, auto-starts', dashboard: 'npm run dev or Docker container' },
];

export default function ComparePage() {
    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-bold text-indigo-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Comparison
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link href="/" className="glass-card px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2">
                            <span className="material-icons-round text-sm">arrow_back</span> Back
                        </Link>
                    </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    Dashboard vs <span className="text-gradient">Plakar UI</span>
                </h1>
                <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-xl">
                    A detailed comparison of features, design, and architecture between the built-in Plakar UI and our custom dashboard.
                </p>
            </div>

            {/* Feature Comparison */}
            <div className="mb-10 lg:mb-14">
                <div className="flex items-center gap-3 mb-5 lg:mb-6">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Feature Comparison</h2>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200/30 dark:border-white/5 grid grid-cols-12 gap-3">
                        <div className="col-span-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Feature</div>
                        <div className="col-span-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] text-center">Plakar UI</div>
                        <div className="col-span-2 text-[10px] font-black text-gradient uppercase tracking-[0.15em] text-center">Dashboard</div>
                        <div className="col-span-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] hidden sm:block">Notes</div>
                    </div>
                    <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                        {features.map(f => (
                            <div key={f.name} className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                <div className="col-span-5 text-sm font-medium text-slate-700 dark:text-slate-300">{f.name}</div>
                                <div className="col-span-2 text-center">
                                    <span className={`material-icons-round text-base ${f.plakar ? 'text-emerald-500' : 'text-red-400/50'}`}>
                                        {f.plakar ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="material-icons-round text-base text-emerald-500">check_circle</span>
                                </div>
                                <div className="col-span-3 text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{f.note}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Design Differences */}
            <div className="mb-10 lg:mb-14">
                <div className="flex items-center gap-3 mb-5 lg:mb-6">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-fuchsia-500 to-pink-500" />
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Design Differences</h2>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200/30 dark:border-white/5 grid grid-cols-12 gap-3">
                        <div className="col-span-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Aspect</div>
                        <div className="col-span-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Plakar UI</div>
                        <div className="col-span-5 text-[10px] font-black text-gradient uppercase tracking-[0.15em]">Our Dashboard</div>
                    </div>
                    <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                        {designDiffs.map(d => (
                            <div key={d.aspect} className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                <div className="col-span-3 text-sm font-medium text-slate-700 dark:text-slate-300">{d.aspect}</div>
                                <div className="col-span-4 text-xs text-slate-500 dark:text-slate-400">{d.plakar}</div>
                                <div className="col-span-5 text-xs text-slate-600 dark:text-slate-300 font-medium">{d.dashboard}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Architecture Differences */}
            <div className="mb-10 lg:mb-14">
                <div className="flex items-center gap-3 mb-5 lg:mb-6">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Architecture Differences</h2>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200/30 dark:border-white/5 grid grid-cols-12 gap-3">
                        <div className="col-span-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Layer</div>
                        <div className="col-span-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Plakar UI</div>
                        <div className="col-span-5 text-[10px] font-black text-gradient uppercase tracking-[0.15em]">Our Dashboard</div>
                    </div>
                    <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                        {archDiffs.map(a => (
                            <div key={a.aspect} className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                <div className="col-span-3 text-sm font-medium text-slate-700 dark:text-slate-300">{a.aspect}</div>
                                <div className="col-span-4 text-xs text-slate-500 dark:text-slate-400">{a.plakar}</div>
                                <div className="col-span-5 text-xs text-slate-600 dark:text-slate-300 font-medium">{a.dashboard}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Back CTA */}
            <div className="text-center pb-6">
                <Link href="/" className="btn-glow inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                    <span className="material-icons-round text-lg">arrow_back</span> Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
