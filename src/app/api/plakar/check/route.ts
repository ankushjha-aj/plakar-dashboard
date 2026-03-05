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

        // Run 'plakar check' which verifies integrity 
        // We use a high timeout (300000ms = 5 mins) as check can take time on large repos
        const result = await runPlakar(['at', repository, 'check'], passphrase, 300000);

        return NextResponse.json({
            success: result.success,
            raw: result.stdout + result.stderr,
            error: result.success ? null : result.stderr
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
