import { NextResponse } from 'next/server';
import { execSync, execFileSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Opens the native Windows FolderBrowserDialog via a PowerShell script file.
 * Since this app runs locally, we can safely spawn a system dialog.
 */
export async function GET() {
    const scriptPath = path.join(os.tmpdir(), 'plakar-folder-picker.ps1');

    try {
        // Write the PowerShell script to a temp file to avoid escaping issues
        const psScript = [
            'Add-Type -AssemblyName System.Windows.Forms',
            '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
            '$dialog.Description = "Select a folder"',
            '$dialog.ShowNewFolderButton = $true',
            '$null = $dialog.ShowDialog()',
            'if ($dialog.SelectedPath) {',
            '  Write-Output $dialog.SelectedPath',
            '} else {',
            '  Write-Output "::CANCELLED::"',
            '}',
        ].join('\n');

        writeFileSync(scriptPath, psScript, 'utf-8');

        const selectedPath = execFileSync('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath,
        ], {
            timeout: 120000,
            encoding: 'utf-8',
            windowsHide: false,
        }).trim();

        // Clean up
        try { unlinkSync(scriptPath); } catch { /* ignore */ }

        if (selectedPath === '::CANCELLED::' || !selectedPath) {
            return NextResponse.json({ success: false, cancelled: true });
        }

        return NextResponse.json({ success: true, path: selectedPath });
    } catch (err: unknown) {
        // Clean up on error
        try { unlinkSync(scriptPath); } catch { /* ignore */ }
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
