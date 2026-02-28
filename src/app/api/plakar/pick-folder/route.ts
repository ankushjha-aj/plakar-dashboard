import { NextResponse } from 'next/server';
import { execFileSync, execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Opens the native folder picker dialog (cross-platform).
 * - Windows: PowerShell FolderBrowserDialog
 * - macOS: osascript (AppleScript)
 * - Linux: zenity or kdialog
 */
export async function GET() {
    const platform = process.platform;

    try {
        if (platform === 'win32') {
            return handleWindows();
        } else if (platform === 'darwin') {
            return handleMacOS();
        } else {
            return handleLinux();
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

/** Windows: PowerShell FolderBrowserDialog */
function handleWindows() {
    const scriptPath = path.join(os.tmpdir(), 'plakar-folder-picker.ps1');
    try {
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

        try { unlinkSync(scriptPath); } catch { /* ignore */ }

        if (selectedPath === '::CANCELLED::' || !selectedPath) {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json({ success: true, path: selectedPath });
    } catch (err: unknown) {
        try { unlinkSync(scriptPath); } catch { /* ignore */ }
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

/** macOS: AppleScript folder dialog */
function handleMacOS() {
    try {
        const result = execSync(
            'osascript -e \'POSIX path of (choose folder with prompt "Select a folder")\'',
            { encoding: 'utf-8', timeout: 120000 }
        ).trim();

        if (!result) {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json({ success: true, path: result });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        // User cancelled the dialog
        if (msg.includes('User canceled') || msg.includes('-128')) {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json(
            { success: false, error: msg || 'Failed to open folder dialog on macOS.' },
            { status: 500 }
        );
    }
}

/** Linux: zenity or kdialog */
function handleLinux() {
    // Try zenity (GNOME/GTK)
    try {
        const result = execSync(
            'zenity --file-selection --directory --title="Select a folder"',
            { encoding: 'utf-8', timeout: 120000 }
        ).trim();

        if (!result) {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json({ success: true, path: result });
    } catch {
        // zenity not available or user cancelled — try kdialog
    }

    // Try kdialog (KDE)
    try {
        const result = execSync(
            'kdialog --getexistingdirectory ~',
            { encoding: 'utf-8', timeout: 120000 }
        ).trim();

        if (!result) {
            return NextResponse.json({ success: false, cancelled: true });
        }
        return NextResponse.json({ success: true, path: result });
    } catch {
        // kdialog not available either
    }

    return NextResponse.json(
        {
            success: false,
            error: 'No folder dialog available. Please install zenity (GNOME) or kdialog (KDE), or type the path manually.',
        },
        { status: 500 }
    );
}
