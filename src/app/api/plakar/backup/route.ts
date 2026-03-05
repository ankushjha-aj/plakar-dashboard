import { NextRequest, NextResponse } from 'next/server';
import { runPlakar, parseBackupResult } from '@/lib/plakar';
import pathMod from 'path';
import os from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

function autoRegisterRepo(repoPath: string, hint?: string) {
    const dir = pathMod.join(os.homedir(), '.plakar-dashboard');
    const file = pathMod.join(dir, 'repos.json');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    let repos: { path: string; name: string; createdAt: string; hint?: string }[] = [];
    try { repos = JSON.parse(readFileSync(file, 'utf-8')); } catch { /* */ }
    if (!repos.some((r) => r.path === repoPath)) {
        repos.push({ path: repoPath, name: pathMod.basename(repoPath), createdAt: new Date().toISOString(), hint });
        writeFileSync(file, JSON.stringify(repos, null, 2), 'utf-8');
    }
}

export async function POST(req: NextRequest) {
    try {
        const { repository, source, passphrase, hint } = await req.json();

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

        if (result.success) {
            autoRegisterRepo(repository, hint);
        }

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
