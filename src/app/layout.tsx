import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 h-screen overflow-hidden flex transition-colors duration-300">
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
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none z-0" />
          <div className="container mx-auto px-8 py-10 relative z-10 max-w-6xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
