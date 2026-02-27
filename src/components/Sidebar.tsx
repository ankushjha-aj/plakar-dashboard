'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: 'dashboard' },
    { href: '/backup', label: 'Backup', icon: 'backup' },
    { href: '/snapshots', label: 'Snapshots', icon: 'history' },
    { href: '/restore', label: 'Restore', icon: 'restore' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('plakar-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('plakar-theme', 'light');
        }
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between z-20 transition-colors duration-300">
            {/* Top section */}
            <div>
                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                            P
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                            Plakar
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive
                                        ? 'active'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                            >
                                <span className="material-icons-round text-[20px]">
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
                {/* Theme toggle */}
                <div className="flex items-center justify-between px-2 mb-4">
                    <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                        Theme
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                    >
                        <span className="material-icons-round text-sm">
                            {dark ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
