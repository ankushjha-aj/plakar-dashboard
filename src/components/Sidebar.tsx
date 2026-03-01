'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';

const navItems = [
    { href: '/', label: 'Overview', icon: 'home' },
    { href: '/repositories', label: 'Repositories', icon: 'storage' },
    { href: '/backup', label: 'Backup', icon: 'backup' },
    { href: '/restore', label: 'Restore', icon: 'restore' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Check active: exact match for '/', startsWith for others
    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* ── Mobile top bar ── */}
            <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-white/97 dark:bg-[#111827]/97 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 flex items-center px-4 gap-3">
                <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                    <span className="material-icons-round text-xl">menu</span>
                </button>
                <img src="/logo.png" alt="Plakar" className="w-7 h-7 object-contain" />
                <span className="font-extrabold text-base text-slate-800 dark:text-white">Plakar</span>
                <div className="ml-auto"><ThemeToggle /></div>
            </div>

            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                    <div className="w-64 h-full bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-100 dark:border-slate-800">
                            <img src="/logo.png" alt="Plakar" className="w-8 h-8 object-contain" />
                            <span className="font-extrabold text-lg text-slate-800 dark:text-white">Plakar</span>
                            <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <nav className="flex-1 px-3 pt-4 space-y-0.5">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive(item.href)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`material-icons-round text-[20px] ${isActive(item.href) ? 'text-indigo-500' : ''}`}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Desktop Sidebar ── */}
            <aside className={`hidden md:flex ${collapsed ? 'w-[72px]' : 'w-[250px]'} flex-shrink-0 h-screen sticky top-0 flex-col border-r border-slate-200/60 dark:border-slate-800 bg-white/97 dark:bg-[#111827]/97 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out`}>

                {/* Logo Section */}
                <div className={`h-16 flex items-center flex-shrink-0 border-b border-slate-100 dark:border-slate-800 ${collapsed ? 'justify-center px-2' : 'px-5'} gap-3`}>
                    {!collapsed && (
                        <Link href="/" className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Plakar Logo"
                                className="w-9 h-9 object-contain drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                            />
                            <div>
                                <span className="font-extrabold text-[17px] tracking-tight text-slate-800 dark:text-white block leading-tight">Plakar</span>
                                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dashboard</span>
                            </div>
                        </Link>
                    )}
                    {collapsed && (
                        <Link href="/">
                            <img src="/logo.png" alt="Plakar" className="w-8 h-8 object-contain" />
                        </Link>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto pt-4">
                    <nav className={`${collapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} text-sm font-medium rounded-xl transition-all duration-200 ${active
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                >
                                    <span className={`material-icons-round text-[20px] ${active ? 'text-indigo-500' : ''}`}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && item.label}
                                    {!collapsed && active && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
                    {!collapsed ? (
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
                                <div className="ml-auto"><ThemeToggle /></div>
                            </div>
                            <button
                                onClick={toggle}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <span className="material-icons-round text-[16px]">chevron_left</span>
                                Collapse sidebar
                            </button>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2 flex flex-col items-center">
                            <ThemeToggle />
                            <button
                                onClick={toggle}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                title="Expand sidebar"
                            >
                                <span className="material-icons-round text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile spacer */}
            <div className="md:hidden h-14" />
        </>
    );
}
