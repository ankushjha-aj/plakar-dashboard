import { NextRequest, NextResponse } from 'next/server';
import { runPlakar, parseBackupResult } from '@/lib/plakar';

export async function POST(req: NextRequest) {
    try {
        const { repository, source, passphrase } = await req.json();

        if (!repository || !source || !passphrase) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'repository, source, and passphrase are required.',
                },
                { status: 400 }
            );
        }

        const result = await runPlakar(
            ['at', repository, 'backup', source],
            passphrase
        );

        const snapshotId = parseBackupResult(result.stdout + result.stderr);

        return NextResponse.json({
            success: result.success,
            snapshotId,
            message: result.success
                ? `Backup successful. Snapshot ID: ${snapshotId}`
                : 'Backup failed.',
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
