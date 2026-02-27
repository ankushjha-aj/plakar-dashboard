import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
    try {
        const { currentPath } = await req.json();

        // If no path provided, return the system drives / home directory
        if (!currentPath) {
            const homeDir = os.homedir();
            const desktopPath = path.join(homeDir, 'Desktop');

            return NextResponse.json({
                success: true,
                currentPath: homeDir,
                parentPath: path.dirname(homeDir),
                entries: [
                    { name: 'Desktop', path: desktopPath, isDirectory: true },
                    {
                        name: 'Documents',
                        path: path.join(homeDir, 'Documents'),
                        isDirectory: true,
                    },
                    {
                        name: 'Downloads',
                        path: path.join(homeDir, 'Downloads'),
                        isDirectory: true,
                    },
                ],
            });
        }

        // Read the given directory
        const entries: { name: string; path: string; isDirectory: boolean }[] = [];

        const items = readdirSync(currentPath, { withFileTypes: true });
        for (const item of items) {
            // Only show directories (not files), skip hidden/system folders
            if (item.name.startsWith('.') || item.name.startsWith('$')) continue;

            const fullPath = path.join(currentPath, item.name);
            try {
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    entries.push({
                        name: item.name,
                        path: fullPath,
                        isDirectory: true,
                    });
                }
            } catch {
                // Skip inaccessible entries
            }
        }

        // Sort alphabetically
        entries.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            success: true,
            currentPath,
            parentPath: path.dirname(currentPath),
            entries,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
