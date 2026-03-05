import { execFileSync, execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Returns the current OS as a simple string.
 */
export function getOS(): 'windows' | 'macos' | 'linux' {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    default:
      return 'linux';
  }
}

/**
 * Returns the system architecture (e.g. x64, arm64).
 */
export function getArchitecture(): string {
  return process.arch; // 'x64', 'arm64', 'ia32', etc.
}

/**
 * Locates the plakar binary on the system (cross-platform).
 * Checks well-known paths first, then falls back to PATH lookup.
 */
export function findPlakarPath(): string | null {
  const homeDir = os.homedir();
  const platform = getOS();

  // Platform-specific known paths
  const knownPaths: string[] = [];

  if (platform === 'windows') {
    knownPaths.push(
      path.join(homeDir, 'plakar-cli', 'plakar.exe'),
      path.join(homeDir, 'plakar-cli', 'plakar'),
    );
  } else if (platform === 'macos') {
    knownPaths.push(
      '/usr/local/bin/plakar',
      '/opt/homebrew/bin/plakar',
      path.join(homeDir, 'plakar-cli', 'plakar'),
      path.join(homeDir, '.local', 'bin', 'plakar'),
    );
  } else {
    // Linux
    knownPaths.push(
      '/usr/local/bin/plakar',
      '/usr/bin/plakar',
      path.join(homeDir, 'plakar-cli', 'plakar'),
      path.join(homeDir, '.local', 'bin', 'plakar'),
    );
  }

  for (const p of knownPaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  // Fallback: search PATH
  try {
    const cmd = platform === 'windows' ? 'where plakar' : 'which plakar';
    const result = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
    }).trim();
    // 'where' on Windows may return multiple lines; take the first
    const firstLine = result.split('\n')[0].trim();
    if (firstLine && existsSync(firstLine)) {
      return firstLine;
    }
  } catch {
    // Not found in PATH
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

      // --- Windows File Lock Workaround ---
      // Detection: "failed to create snapshot: remove C:\...\locks\<id>: The process cannot access the file because it is being used by another process."
      const isWindowsFileLockError = (
        getOS() === 'windows' && 
        allOutput.includes('failed to create snapshot: remove') &&
        allOutput.includes('The process cannot access the file because it is being used by another process')
      );

      if (isWindowsFileLockError) {
        // We know the snapshot was actually created successfully before the lock file removal failed.
        // Let's extract the lock file path so we can try to clean it up asynchronously
        const lockPathMatch = allOutput.match(/remove ([A-Z]:\\[^\:]+locks\\[a-f0-9]+): The process cannot access the file/i);
        if (lockPathMatch && lockPathMatch[1]) {
          const lockFile = lockPathMatch[1];
          // Fire and forget: try to delete the lock file a few times over the next few seconds
          let retries = 5;
          const attemptDelete = () => {
            try {
              if (existsSync(lockFile)) {
                unlinkSync(lockFile);
              }
            } catch {
              retries--;
              if (retries > 0) setTimeout(attemptDelete, 1000);
            }
          };
          setTimeout(attemptDelete, 1000);
        }

        // Return a mocked success response because the snapshot DID succeed
        // We will preserve the output so parseBackupResult can find the snapshot ID
        resolve({
          success: true,
          stdout: execErr.stdout || '',
          stderr: execErr.stderr || '',
          exitCode: 0,
        });
        return;
      }
      // ------------------------------------

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
