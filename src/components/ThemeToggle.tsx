'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggle = () => {
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
        <button
            onClick={toggle}
            className="px-3 py-2 sm:px-4 sm:py-2.5 mt-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <span className="material-icons-round text-xl">
                {dark ? 'dark_mode' : 'light_mode'}
            </span>
        </button>
    );
}
