'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

const navItems = [
    { href: '/', label: 'Dashboard', icon: 'dashboard' },
    { href: '/repositories', label: 'Repositories', icon: 'storage' },
    { href: '/backup', label: 'Backup', icon: 'backup' },
    { href: '/snapshots', label: 'Snapshots', icon: 'history' },
    { href: '/restore', label: 'Restore', icon: 'restore' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle } = useSidebar();

    return (
        <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 glass-panel flex flex-col z-30 transition-all duration-300 ease-in-out`}>

            {/* Top — Hamburger + Logo */}
            <div className={`h-20 flex items-center flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5'} gap-3`}>
                <button
                    onClick={toggle}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex-shrink-0"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className="material-icons-round text-xl">menu</span>
                </button>
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/30 animate-glow-pulse">
                                P
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
                        </div>
                        <div>
                            <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-white block leading-tight">
                                Plakar
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                Dashboard
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pt-1">
                <nav className={`${collapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
                    {!collapsed && (
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 px-3 mb-2">
                            Navigation
                        </p>
                    )}
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`sidebar-link flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                    ? 'active'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                            >
                                <span className={`material-icons-round text-[20px] ${isActive ? 'text-indigo-500' : ''}`}>
                                    {item.icon}
                                </span>
                                {!collapsed && item.label}
                                {!collapsed && isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom — Security badge */}
            {!collapsed && (
                <div className="flex-shrink-0 p-4">
                    <div className="gradient-border p-3 rounded-xl">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-icons-round text-indigo-400 text-base">security</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Secured</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                AES-256 encrypted, deduplicated backups.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
