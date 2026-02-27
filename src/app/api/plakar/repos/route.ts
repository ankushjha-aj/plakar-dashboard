import { NextResponse } from 'next/server';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';

const REPOS_DIR = path.join(os.homedir(), '.plakar-dashboard');
const REPOS_FILE = path.join(REPOS_DIR, 'repos.json');

export interface SavedRepo {
    path: string;
    name: string;
    createdAt: string;
}

function ensureDir() {
    if (!existsSync(REPOS_DIR)) mkdirSync(REPOS_DIR, { recursive: true });
}

function loadRepos(): SavedRepo[] {
    ensureDir();
    if (!existsSync(REPOS_FILE)) return [];
    try {
        return JSON.parse(readFileSync(REPOS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function saveRepos(repos: SavedRepo[]) {
    ensureDir();
    writeFileSync(REPOS_FILE, JSON.stringify(repos, null, 2), 'utf-8');
}

export async function GET() {
    return NextResponse.json({ repos: loadRepos() });
}

export async function POST(request: Request) {
    const { path: repoPath, name } = await request.json();
    if (!repoPath) {
        return NextResponse.json({ success: false, error: 'Path is required.' }, { status: 400 });
    }

    const repos = loadRepos();
    // Don't add duplicates
    if (repos.some((r) => r.path === repoPath)) {
        return NextResponse.json({ success: true, message: 'Repository already registered.' });
    }

    const repoName = name || path.basename(repoPath);
    repos.push({ path: repoPath, name: repoName, createdAt: new Date().toISOString() });
    saveRepos(repos);

    return NextResponse.json({ success: true, message: `Repository "${repoName}" registered.` });
}

export async function DELETE(request: Request) {
    const { path: repoPath } = await request.json();
    if (!repoPath) {
        return NextResponse.json({ success: false, error: 'Path is required.' }, { status: 400 });
    }

    let repos = loadRepos();
    repos = repos.filter((r) => r.path !== repoPath);
    saveRepos(repos);

    return NextResponse.json({ success: true, message: 'Repository removed from dashboard.' });
}
