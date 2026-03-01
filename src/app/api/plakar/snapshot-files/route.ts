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

    // Parse ls output: "2026-02-10T14:40:57Z drwxr-xr-x  501  20  1.1 KiB /path/to/file"
    // Fields: date, permissions, uid, gid, size, path
    const allFiles = result.stdout
        .trim()
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((line) => {
            const match = line.match(
                /^(\S+)\s+(\S+)\s+(\d+)\s+(\d+)\s+([\d.]+\s+\w+)\s+(.+)$/
            );
            if (match) {
                return {
                    date: match[1],
                    permissions: match[2],
                    uid: match[3],
                    gid: match[4],
                    size: match[5].trim(),
                    path: match[6].trim(),
                    name: match[6].trim().split('/').pop() || match[6].trim(),
                    isDir: match[2].startsWith('d'),
                };
            }
            // Fallback: just return the raw line
            return { date: '', permissions: '', uid: '', gid: '', size: '', path: line.trim(), name: line.trim(), isDir: false };
        });

    // Determine the base path (the root of the snapshot content)
    const browsePath = subPath || '';

    // Group files: show only direct children of the browsePath
    const directChildren = new Map<string, { date: string; permissions: string; uid: string; gid: string; size: string; path: string; name: string; isDir: boolean }>();

    // Track metadata for current directory
    let dirMeta = { date: '', permissions: '', uid: '', gid: '' };

    for (const f of allFiles) {
        const filePath = f.path;
        const normalizedPath = filePath.replace(/^\//, '');
        const normalizedBase = browsePath.replace(/^\//, '').replace(/\/$/, '');

        let relativePath: string;
        if (normalizedBase && normalizedPath.startsWith(normalizedBase)) {
            relativePath = normalizedPath.substring(normalizedBase.length).replace(/^\//, '');
        } else if (!normalizedBase) {
            relativePath = normalizedPath;
        } else {
            continue;
        }

        if (!relativePath) {
            // This is the current directory itself — capture its metadata
            dirMeta = { date: f.date, permissions: f.permissions, uid: f.uid, gid: f.gid };
            continue;
        }

        const segments = relativePath.split('/').filter(Boolean);
        if (segments.length === 0) continue;

        const topSegment = segments[0];

        if (!directChildren.has(topSegment)) {
            if (segments.length === 1 && !f.isDir) {
                directChildren.set(topSegment, {
                    ...f,
                    name: topSegment,
                });
            } else {
                const dirPath = normalizedBase ? `/${normalizedBase}/${topSegment}` : `/${topSegment}`;
                directChildren.set(topSegment, {
                    date: f.date,
                    permissions: 'd' + f.permissions.substring(1),
                    uid: f.uid,
                    gid: f.gid,
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

    return NextResponse.json({ success: true, files, dirMeta });
}
