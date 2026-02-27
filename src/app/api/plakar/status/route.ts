import { NextResponse } from 'next/server';
import { runPlakar, findPlakarPath } from '@/lib/plakar';

export async function GET() {
    const plakarPath = findPlakarPath();

    if (!plakarPath) {
        return NextResponse.json({
            installed: false,
            version: null,
            path: null,
            error: 'plakar executable not found.',
        });
    }

    const result = await runPlakar(['version'], undefined, 10000);

    // Version output looks like: "plakar/v1.0.6"
    const versionMatch = (result.stdout + result.stderr).match(
        /plakar\/v?([\d.]+\S*)/i
    );

    return NextResponse.json({
        installed: result.success,
        version: versionMatch ? versionMatch[1] : null,
        path: plakarPath,
        raw: result.stdout + result.stderr,
    });
}
