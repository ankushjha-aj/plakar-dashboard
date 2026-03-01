'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: 'dashboard' },
    { href: '/repositories', label: 'Repositories', icon: 'storage' },
    { href: '/backup', label: 'Backup', icon: 'backup' },
    { href: '/restore', label: 'Restore', icon: 'restore' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Header() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/40 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* ── Logo ── */}
                    <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                        <div className="relative">
                            <img
                                src="/logo.png"
                                alt="Plakar Logo"
                                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col justify-center">
                            <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-white leading-none">
                                Plakar
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mt-0.5">
                                Dashboard
                            </span>
                        </div>
                    </Link>

                    {/* ── Desktop Nav ── */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                >
                                    <span className={`material-icons-round text-[18px] ${isActive ? 'text-indigo-500' : ''}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                    {isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50 ml-0.5" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── Right: Theme toggle + status + mobile menu ── */}
                    <div className="flex items-center gap-2">
                        {/* System online dot */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.12em]">Online</span>
                        </div>

                        <ThemeToggle />

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
                        >
                            <span className="material-icons-round text-xl">{mobileOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Mobile Nav Dropdown ── */}
                {mobileOpen && (
                    <nav className="md:hidden pb-4 pt-2 border-t border-slate-200/40 dark:border-white/5 grid grid-cols-3 gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-icons-round text-xl ${isActive ? 'text-indigo-500' : ''}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </header>
    );
}
