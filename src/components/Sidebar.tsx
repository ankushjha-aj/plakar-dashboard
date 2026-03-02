'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';

interface StatusInfo {
    installed: boolean;
    version: string;
}

const navItems = [
    { href: '/', label: 'Overview', icon: 'home' },
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/repositories', label: 'Repositories', icon: 'storage' },
    { href: '/backup', label: 'Backup', icon: 'backup' },
    { href: '/restore', label: 'Restore', icon: 'restore' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/plakar/status')
            .then(res => res.json())
            .then((data: StatusInfo) => {
                if (data.installed && data.version) {
                    setVersion(data.version);
                }
            })
            .catch(() => { });
    }, []);

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
                <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-800 dark:text-white">PLAKAR</span>
                    {version && (
                        <span className="font-sans text-xs font-bold text-slate-400">
                            v{version}
                        </span>
                    )}
                </div>
                <div className="ml-auto"><ThemeToggle collapsed={true} /></div>
            </div>

            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                    <div className="w-64 h-full bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-100 dark:border-slate-800">
                            <img src="/logo.png" alt="Plakar" className="w-8 h-8 object-contain" />
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-lg text-slate-800 dark:text-white">PLAKAR</span>
                                {version && (
                                    <span className="font-sans text-xs font-bold text-slate-400">
                                        v{version}
                                    </span>
                                )}
                            </div>
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
                                    className={`flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-sm transition-all ${isActive(item.href)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`material-icons-round text-[16px] ${isActive(item.href) ? 'text-indigo-500' : ''}`}>{item.icon}</span>
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
                        <div className="flex items-center justify-between w-full">
                            <Link href="/" className="flex items-center gap-3">
                                <img
                                    src="/logo.png"
                                    alt="Plakar Logo"
                                    className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                                />
                                <div className="flex items-center gap-4 mt-0.5">
                                    <span className="font-extrabold text-[18px] tracking-tight text-slate-800 dark:text-white leading-[1] pr-2">PLAKAR</span>
                                </div>
                            </Link>
                            {version && (
                                <span className="font-sans text-xs font-bold text-slate-400">
                                    v{version}
                                </span>
                            )}
                        </div>
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
                                    className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-4 ${collapsed ? 'px-0 py-2' : 'px-3 py-2'} text-sm font-medium rounded-sm transition-all duration-200 ${active
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                >
                                    <span className={`material-icons-round text-[16px] ${active ? 'text-indigo-500' : ''}`}>
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
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 flex flex-col gap-1">
                    {!collapsed ? (
                        <>
                            <ThemeToggle collapsed={false} />
                            <Link href="/settings" className="flex items-center gap-4 px-3 py-2 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300">
                                <span className="material-icons-round text-[16px] text-slate-900 dark:text-white">settings</span>
                                <span className="text-sm font-medium">Settings</span>
                            </Link>

                            <div className="mt-4 flex items-center justify-between pb-1">
                                <div className="flex gap-2.5">
                                    <Link href="https://github.com/ankushjha-aj" target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5" title="GitHub">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-slate-900 dark:text-white">
                                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                                        </svg>
                                        <span>GitHub</span>
                                    </Link>
                                    <Link href="https://www.linkedin.com/in/jhaankush/" target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5" title="LinkedIn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-[#0A66C2]">
                                            <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                                        </svg>
                                        <span>LinkedIn</span>
                                    </Link>
                                </div>
                                <button onClick={toggle} className="p-1.5 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                    <span className="material-icons-round text-[18px]">keyboard_double_arrow_left</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <ThemeToggle collapsed={true} />
                            <Link href="/settings" className="p-2 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                <span className="material-icons-round text-[18px]">settings</span>
                            </Link>
                            <button onClick={toggle} className="p-2 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mt-2">
                                <span className="material-icons-round text-[18px]">keyboard_double_arrow_right</span>
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
