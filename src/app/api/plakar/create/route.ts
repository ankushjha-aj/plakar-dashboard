import { NextRequest, NextResponse } from 'next/server';
import { runPlakar } from '@/lib/plakar';

export async function POST(req: NextRequest) {
    try {
        const { repository, passphrase } = await req.json();

        if (!repository || !passphrase) {
            return NextResponse.json(
                { success: false, error: 'repository and passphrase are required.' },
                { status: 400 }
            );
        }

        const result = await runPlakar(
            ['at', repository, 'create'],
            passphrase,
            30000
        );

        // Extract a meaningful error message from stderr if present
        const allOutput = (result.stdout + ' ' + result.stderr).toLowerCase();
        let errorDetail = '';
        if (allOutput.includes('insecure password') || allOutput.includes('insecure')) {
            errorDetail = 'Passphrase is too weak. Use a longer passphrase with mixed characters (e.g. S3cur3!P@ssw0rd2026).';
        } else if (!result.success) {
            errorDetail = (result.stderr || result.stdout || 'Unknown error from Plakar CLI.').trim();
        }

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? 'Repository created successfully!'
                : errorDetail || 'Failed to create repository.',
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
