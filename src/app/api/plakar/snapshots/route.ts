import { NextRequest, NextResponse } from 'next/server';
import { runPlakar, parseSnapshotList } from '@/lib/plakar';

export async function POST(req: NextRequest) {
    try {
        const { repository, passphrase } = await req.json();

        if (!repository || !passphrase) {
            return NextResponse.json(
                { success: false, error: 'repository and passphrase are required.' },
                { status: 400 }
            );
        }

        const result = await runPlakar(
            ['at', repository, 'ls'],
            passphrase,
            30000
        );

        const snapshots = parseSnapshotList(result.stdout + result.stderr);

        return NextResponse.json({
            success: result.success,
            snapshots,
            raw: result.stdout + result.stderr,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
