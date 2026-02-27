import { NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';

export async function POST(request: Request) {
    const { repository, snapshotId, passphrase } = await request.json();

    if (!repository || !snapshotId || !passphrase) {
        return NextResponse.json(
            { success: false, error: 'Repository, snapshotId, and passphrase are required.' },
            { status: 400 }
        );
    }

    const result = await runPlakar(
        ['at', repository, 'ls', `${snapshotId}:`],
        passphrase
    );

    if (!result.success) {
        return NextResponse.json({
            success: false,
            error: result.stderr || 'Failed to list snapshot files.',
        });
    }

    // Parse ls output: "2026-02-10T14:40:57Z -rw-rw-rw-  0  0  1.1 KiB /path/to/file"
    const files = result.stdout
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

    return NextResponse.json({ success: true, files });
}
