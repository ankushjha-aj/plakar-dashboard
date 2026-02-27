'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/backup', label: 'Backup', icon: '🔒' },
    { href: '/snapshots', label: 'Snapshots', icon: '📸' },
    { href: '/restore', label: 'Restore', icon: '♻️' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('plakar-theme') || 'dark';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('plakar-theme', next);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">P</div>
                <div>
                    <div className="sidebar-logo-text">Plakar</div>
                    <div className="sidebar-logo-sub">Dashboard</div>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${pathname === item.href ? 'active' : ''
                            }`}
                    >
                        <span className="sidebar-link-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
            {/* Theme toggle at the bottom */}
            <div
                style={{
                    padding: '16px 12px',
                    borderTop: '1px solid var(--border-color)',
                }}
            >
                <button className="sidebar-link" onClick={toggleTheme} style={{ width: '100%' }}>
                    <span className="sidebar-link-icon">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </span>
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </div>
        </aside>
    );
}
