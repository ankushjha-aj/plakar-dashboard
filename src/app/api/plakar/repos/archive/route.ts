import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { runPlakar } from '@/lib/plakar';

const REPOS_DIR = path.join(os.homedir(), '.plakar-dashboard');
const REPOS_FILE = path.join(REPOS_DIR, 'repos.json');

export async function POST(req: NextRequest) {
    try {
        const { repository, passphrase } = await req.json();

        if (!repository || !passphrase) {
            return NextResponse.json(
                { success: false, error: 'Repository and passphrase are required.' },
                { status: 400 }
            );
        }

        // Validate passphrase by checking status
        const result = await runPlakar(['at', repository, 'ls'], passphrase);
        if (!result.success) {
            return NextResponse.json({ success: false, error: 'Invalid passphrase or repository.' }, { status: 401 });
        }

        if (existsSync(REPOS_FILE)) {
            const repos = JSON.parse(readFileSync(REPOS_FILE, 'utf-8'));
            const repoIndex = repos.findIndex((r: any) => r.path === repository);

            if (repoIndex >= 0) {
                repos[repoIndex].isArchived = true;
                writeFileSync(REPOS_FILE, JSON.stringify(repos, null, 2), 'utf-8');
                return NextResponse.json({ success: true, message: 'Repository archived successfully.' });
            }
        }

        return NextResponse.json({ success: false, error: 'Repository not found in dashboard.' }, { status: 404 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
