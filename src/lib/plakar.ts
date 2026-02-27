import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Locates the plakar.exe binary on the system.
 */
export function findPlakarPath(): string | null {
  const homeDir = os.homedir();
  const knownPaths = [
    path.join(homeDir, 'plakar-cli', 'plakar.exe'),
    path.join(homeDir, 'plakar-cli', 'plakar'),
  ];

  for (const p of knownPaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

export interface PlakarResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Runs a plakar command with passphrase passed via PLAKAR_PASSPHRASE
 * environment variable. This works on Windows where plakar.exe reads
 * from the console handle (not stdin pipe), making pipe-based
 * approaches fail with "The handle is invalid".
 */
export function runPlakar(
  args: string[],
  passphrase?: string,
  timeoutMs: number = 120000
): Promise<PlakarResult> {
  return new Promise((resolve) => {
    const plakarPath = findPlakarPath();
    if (!plakarPath) {
      resolve({
        success: false,
        stdout: '',
        stderr: 'plakar executable not found on this system.',
        exitCode: -1,
      });
      return;
    }

    try {
      const env = { ...process.env };
      if (passphrase) {
        env.PLAKAR_PASSPHRASE = passphrase;
      }

      const output = execFileSync(plakarPath, args, {
        timeout: timeoutMs,
        encoding: 'utf-8',
        windowsHide: true,
        env,
      });

      resolve({
        success: true,
        stdout: output || '',
        stderr: '',
        exitCode: 0,
      });
    } catch (err: unknown) {
      const execErr = err as {
        stdout?: string;
        stderr?: string;
        status?: number;
        message?: string;
      };

      // Check if the error output contains useful messages
      const allOutput = (execErr.stdout || '') + (execErr.stderr || '');
      let errorMsg = execErr.stderr || execErr.message || 'Command failed.';

      if (allOutput.toLowerCase().includes('insecure password')) {
        errorMsg =
          'Passphrase is too weak. Use a longer passphrase with mixed characters (e.g. S3cur3!P@ssw0rd2026).';
      }

      resolve({
        success: false,
        stdout: execErr.stdout || '',
        stderr: errorMsg,
        exitCode: execErr.status ?? -1,
      });
    }
  });
}

/**
 * Parses the output of `plakar ls` into structured snapshot objects.
 */
export interface Snapshot {
  timestamp: string;
  snapshotId: string;
  size: string;
  duration: string;
  path: string;
}

export function parseSnapshotList(output: string): Snapshot[] {
  const lines = output.trim().split('\n').filter((l) => l.trim().length > 0);
  const snapshots: Snapshot[] = [];

  for (const line of lines) {
    const match = line.match(
      /^(\S+)\s+([a-f0-9]{8})\s+([\d.]+ \w+)\s+(\S+)\s+(.+)$/
    );
    if (match) {
      snapshots.push({
        timestamp: match[1],
        snapshotId: match[2],
        size: match[3],
        duration: match[4],
        path: match[5].trim(),
      });
    }
  }

  return snapshots;
}

/**
 * Parses the backup output to extract the new snapshot ID.
 */
export function parseBackupResult(output: string): string | null {
  const match = output.match(/snapshot\s+([a-f0-9]{8})/i);
  return match ? match[1] : null;
}
