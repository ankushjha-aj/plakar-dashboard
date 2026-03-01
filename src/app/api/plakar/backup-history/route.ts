import { NextRequest, NextResponse } from 'next/server';
import pathMod from 'path';
import os from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

interface BackupRecord {
    repository: string;
    sourcePath: string;
    folderName: string;
    snapshotId: string;
    timestamp: string;
}

const HISTORY_FILE = pathMod.join(os.homedir(), '.plakar-dashboard', 'backup-history.json');

function readHistory(): BackupRecord[] {
    try {
        if (existsSync(HISTORY_FILE)) {
            return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
        }
    } catch { /* */ }
    return [];
}

function writeHistory(records: BackupRecord[]) {
    const dir = pathMod.dirname(HISTORY_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
    const repo = req.nextUrl.searchParams.get('repo');
    const history = readHistory();
    const filtered = repo ? history.filter(h => h.repository === repo) : history;

    // Group by folder name
    const grouped: Record<string, { folderName: string; sourcePath: string; snapshots: { snapshotId: string; timestamp: string }[]; lastBackup: string }> = {};

    for (const record of filtered) {
        if (!grouped[record.sourcePath]) {
            grouped[record.sourcePath] = {
                folderName: record.folderName,
                sourcePath: record.sourcePath,
                snapshots: [],
                lastBackup: record.timestamp,
            };
        }
        grouped[record.sourcePath].snapshots.push({
            snapshotId: record.snapshotId,
            timestamp: record.timestamp,
        });
        if (record.timestamp > grouped[record.sourcePath].lastBackup) {
            grouped[record.sourcePath].lastBackup = record.timestamp;
        }
    }

    return NextResponse.json({ success: true, history: Object.values(grouped) });
}

export async function POST(req: NextRequest) {
    try {
        const { repository, sourcePath, folderName, snapshotId } = await req.json();

        if (!repository || !sourcePath || !snapshotId) {
            return NextResponse.json({ success: false, error: 'Missing fields.' }, { status: 400 });
        }

        const history = readHistory();
        history.push({
            repository,
            sourcePath,
            folderName: folderName || pathMod.basename(sourcePath),
            snapshotId,
            timestamp: new Date().toISOString(),
        });
        writeHistory(history);

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
