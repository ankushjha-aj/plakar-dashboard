import { NextRequest, NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
    try {
        const { repository, snapshotId, destination, passphrase, force } =
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

        const args = ['at', repository, 'restore', '-to', destination];
        args.push(snapshotId);

        if (force) {
            try {
                // Delete everything in the destination path so Plakar can restore cleanly
                await fs.rm(destination, { recursive: true, force: true });
            } catch (fsErr) {
                console.warn('Could not safely clean destination directory for overwrite:', fsErr);
            }
        }

        const result = await runPlakar(args, passphrase);

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
