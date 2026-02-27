import { NextRequest, NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';

export async function POST(req: NextRequest) {
    try {
        const { repository, snapshotId, passphrase } = await req.json();

        if (!repository || !snapshotId || !passphrase) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'repository, snapshotId, and passphrase are required.',
                },
                { status: 400 }
            );
        }

        const result = await runPlakar(
            ['at', repository, 'rm', snapshotId],
            passphrase
        );

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? `Snapshot ${snapshotId} deleted successfully.`
                : 'Delete failed.',
            details: result.stdout + result.stderr,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
