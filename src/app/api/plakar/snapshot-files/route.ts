import { NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';

export async function POST(request: Request) {
    const { repository, snapshotId, passphrase, subPath } = await request.json();

    if (!repository || !snapshotId || !passphrase) {
        return NextResponse.json(
            { success: false, error: 'Repository, snapshotId, and passphrase are required.' },
            { status: 400 }
        );
    }

    // If subPath is provided, list that specific directory inside the snapshot
    const lsTarget = subPath
        ? `${snapshotId}:${subPath}`
        : `${snapshotId}:`;

    const result = await runPlakar(
        ['at', repository, 'ls', lsTarget],
        passphrase
    );

    if (!result.success) {
        return NextResponse.json({
            success: false,
            error: result.stderr || 'Failed to list snapshot files.',
        });
    }

    // Parse ls output: "2026-02-10T14:40:57Z -rw-rw-rw-  0  0  1.1 KiB /path/to/file"
    const allFiles = result.stdout
        .trim()
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((line) => {
            const match = line.match(
                /^(\S+)\s+(\S+)\s+\d+\s+\d+\s+([\d.]+\s+\w+)\s+(.+)$/
            );
            if (match) {
                return {
                    date: match[1],
                    permissions: match[2],
                    size: match[3].trim(),
                    path: match[4].trim(),
                    name: match[4].trim().split('/').pop() || match[4].trim(),
                    isDir: match[2].startsWith('d'),
                };
            }
            // Fallback: just return the raw line
            return { date: '', permissions: '', size: '', path: line.trim(), name: line.trim(), isDir: false };
        });

    // Determine the base path (the root of the snapshot content)
    // Find the common prefix to show only top-level items relative to the browse path
    const browsePath = subPath || '';

    // Group files: show only direct children of the browsePath
    const directChildren = new Map<string, { date: string; permissions: string; size: string; path: string; name: string; isDir: boolean }>();

    for (const f of allFiles) {
        // Get the path relative to browseBase
        const filePath = f.path;

        // Strip leading slash for comparison
        const normalizedPath = filePath.replace(/^\//, '');
        const normalizedBase = browsePath.replace(/^\//, '').replace(/\/$/, '');

        // Get relative path from the base
        let relativePath: string;
        if (normalizedBase && normalizedPath.startsWith(normalizedBase)) {
            relativePath = normalizedPath.substring(normalizedBase.length).replace(/^\//, '');
        } else if (!normalizedBase) {
            relativePath = normalizedPath;
        } else {
            continue; // Not under our browse path
        }

        if (!relativePath) continue;

        // Get the first path segment (direct child)
        const segments = relativePath.split('/').filter(Boolean);
        if (segments.length === 0) continue;

        const topSegment = segments[0];

        if (!directChildren.has(topSegment)) {
            if (segments.length === 1 && !f.isDir) {
                // It's a direct file child
                directChildren.set(topSegment, {
                    ...f,
                    name: topSegment,
                });
            } else {
                // It's a directory (either explicitly or has children)
                const dirPath = normalizedBase ? `/${normalizedBase}/${topSegment}` : `/${topSegment}`;
                directChildren.set(topSegment, {
                    date: f.date,
                    permissions: 'd' + f.permissions.substring(1),
                    size: '',
                    path: dirPath,
                    name: topSegment,
                    isDir: true,
                });
            }
        }
    }

    // Sort: directories first, then alphabetical
    const files = Array.from(directChildren.values()).sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, files });
}
