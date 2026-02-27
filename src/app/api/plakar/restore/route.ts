import { NextRequest, NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';

export async function POST(req: NextRequest) {
    try {
        const { repository, snapshotId, destination, passphrase } =
            await req.json();

        if (!repository || !snapshotId || !destination || !passphrase) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'repository, snapshotId, destination, and passphrase are required.',
                },
                { status: 400 }
            );
        }

        const result = await runPlakar(
            ['at', repository, 'restore', '-to', destination, snapshotId],
            passphrase
        );

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? `Restore successful to ${destination}`
                : 'Restore failed.',
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
