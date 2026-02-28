import { NextResponse } from 'next/server';
import { runPlakar, findPlakarPath } from '@/lib/plakar';
import { execFileSync } from 'child_process';
import path from 'path';
import os from 'os';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';

export async function POST(request: Request) {
    const { repository, snapshotId, filePath, passphrase } = await request.json();

    if (!repository || !snapshotId || !filePath || !passphrase) {
        return NextResponse.json(
            { success: false, error: 'All fields are required.' },
            { status: 400 }
        );
    }

    const plakarPath = findPlakarPath();
    if (!plakarPath) {
        return NextResponse.json(
            { success: false, error: 'Plakar CLI not found.' },
            { status: 500 }
        );
    }

    // Restore file to a temp directory then read and return it
    const tmpDir = path.join(os.tmpdir(), `plakar-dl-${Date.now()}`);

    try {
        const env = { ...process.env, PLAKAR_PASSPHRASE: passphrase };
        execFileSync(plakarPath, [
            'at', repository, 'restore', '-to', tmpDir, `${snapshotId}:${filePath}`
        ], { timeout: 60000, env, windowsHide: true });

        // The restored file will be at tmpDir + filePath
        const restoredPath = path.join(tmpDir, filePath);

        if (!existsSync(restoredPath)) {
            return NextResponse.json(
                { success: false, error: 'File not found after restore.' },
                { status: 404 }
            );
        }

        const fileBuffer = readFileSync(restoredPath);
        const fileName = path.basename(filePath);

        // Clean up
        try {
            const fs = require('fs');
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch { /* ignore */ }

        return new Response(fileBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (err: unknown) {
        const e = err as { stderr?: string; message?: string };
        return NextResponse.json(
            { success: false, error: e.stderr || e.message || 'Download failed.' },
            { status: 500 }
        );
    }
}
