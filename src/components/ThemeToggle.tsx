'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
    collapsed?: boolean;
}

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
    const [theme, setTheme] = useState<Theme>('system');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('plakar-theme') as Theme | null;
        if (stored === 'light' || stored === 'dark') {
            setTheme(stored);
        } else {
            setTheme('system');
        }
    }, []);

    const toggle = () => {
        const nextTheme: Record<Theme, Theme> = {
            light: 'dark',
            dark: 'system',
            system: 'light',
        };
        const next = nextTheme[theme];
        setTheme(next);

        if (next === 'system') {
            localStorage.removeItem('plakar-theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            localStorage.setItem('plakar-theme', next);
            if (next === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    if (!mounted) {
        return <div className={collapsed ? "w-8 h-8 rounded-lg" : "min-w-[70px] h-6"} />; // prevent hydration mismatch
    }

    let icon = 'phonelink_setup';
    if (theme === 'light') icon = 'light_mode';
    if (theme === 'dark') icon = 'dark_mode';

    if (collapsed) {
        return (
            <button
                onClick={toggle}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={`Current theme: ${theme}. Click to change.`}
            >
                {theme === 'system' ? (
                    <span className="text-[14px] font-bold font-mono">S</span>
                ) : (
                    <span className="material-icons-round text-[18px]">{icon}</span>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            className="flex w-full gap-4 items-center rounded-sm px-3 py-2 outline-0 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer font-sans"
            title={`Current theme: ${theme}. Click to change.`}
        >
            <div className="flex items-center gap-3">
                <span className="material-icons-round text-[16px] inline-flex">{icon}</span>
                <span className="text-sm font-medium capitalize truncate">{theme} theme</span>
            </div>
        </button>
    );
}
