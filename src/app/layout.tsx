import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Plakar Dashboard',
  description: 'Manage encrypted backups, view snapshots, and restore files visually.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-[#f0f2f5] dark:bg-[#080d1a] text-slate-800 dark:text-slate-200 min-h-screen flex flex-col transition-colors duration-500 noise-overlay">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t = localStorage.getItem('plakar-theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            })();`,
          }}
        />
        {/* Animated background */}
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="grid-overlay" />

        <Header />
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10 relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
