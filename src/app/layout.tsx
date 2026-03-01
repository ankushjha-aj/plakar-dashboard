import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider } from '@/components/SidebarContext';

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
      <body suppressHydrationWarning className="bg-[#f0f2f5] dark:bg-[#080d1a] text-slate-800 dark:text-slate-200 min-h-screen flex transition-colors duration-500 noise-overlay">
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

        <SidebarProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative z-10 h-screen">
            <div className="px-6 lg:px-10 pt-6 pb-10 relative z-10 w-full">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
