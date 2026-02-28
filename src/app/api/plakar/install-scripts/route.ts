import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * GET /api/plakar/install-scripts?file=ps1|readme
 * Returns the requested installation file for download.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || 'ps1';

    try {
        if (file === 'readme') {
            const content = readFileSync(
                path.join(process.cwd(), 'public', 'install-plakar-readme.txt'),
                'utf-8'
            );
            return new Response(content, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="install-plakar-readme.txt"',
                },
            });
        }

        // Default: PowerShell script
        const content = readFileSync(
            path.join(process.cwd(), 'public', 'install-plakar.ps1'),
            'utf-8'
        );
        return new Response(content, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="install-plakar.ps1"',
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'File not found';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
