═══════════════════════════════════════════════════════════
  Plakar CLI — Windows Installation Guide
═══════════════════════════════════════════════════════════

WHAT THIS DOES
──────────────
The install-plakar.ps1 script will:
  1. Create a folder at %USERPROFILE%\plakar-cli
  2. Download the latest Plakar binary from GitHub
  3. Add the folder to your user PATH
  4. Verify the installation

HOW TO RUN
──────────
Option A — Right-click method:
  1. Right-click on install-plakar.ps1
  2. Select "Run with PowerShell"
  3. If prompted by Windows SmartScreen, click "More info" → "Run anyway"

Option B — Terminal method:
  1. Open PowerShell (search "PowerShell" in Start Menu)
  2. Navigate to the folder containing the script:
       cd C:\Users\YourName\Downloads
  3. Run the script:
       powershell -ExecutionPolicy Bypass -File install-plakar.ps1

EXECUTION POLICY NOTE
─────────────────────
If you see "running scripts is disabled on this system":
  1. Open PowerShell as Administrator
  2. Run: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  3. Type 'Y' to confirm
  4. Try running the script again

  The -Scope CurrentUser flag ensures this only affects your account.
  RemoteSigned allows local scripts while still blocking unsigned
  scripts downloaded from the internet.

AFTER INSTALLATION
──────────────────
  1. Close ALL open terminals / PowerShell / Command Prompt windows
  2. Open a new terminal window
  3. Run:  plakar version
  4. You should see output like:  plakar/v1.0.6
  5. Refresh the Plakar Dashboard — it should now detect the CLI

MANUAL INSTALLATION (ALTERNATIVE)
──────────────────────────────────
  1. Go to: https://github.com/PlakarKorp/plakar/releases/latest
  2. Download the Windows binary (e.g. plakar_windows_amd64.zip)
  3. Extract plakar.exe to a folder (e.g. C:\Users\You\plakar-cli\)
  4. Add that folder to your PATH:
     - Open Settings → System → About → Advanced system settings
     - Click "Environment Variables"
     - Under "User variables", select "Path" → Edit → New
     - Add the folder path (e.g. C:\Users\You\plakar-cli)
     - Click OK on all dialogs
  5. Restart your terminal and verify with: plakar version

TROUBLESHOOTING
───────────────
  Problem: "plakar is not recognized as a command"
  Solution: Restart your terminal. PATH changes only apply to new
            terminal sessions.

  Problem: Download fails or times out
  Solution: Check your internet connection, or download manually
            from https://github.com/PlakarKorp/plakar/releases

  Problem: Antivirus blocks the binary
  Solution: Add an exception for %USERPROFILE%\plakar-cli\plakar.exe
            in your antivirus settings.

SUPPORT
───────
  GitHub: https://github.com/PlakarKorp/plakar
  Issues: https://github.com/PlakarKorp/plakar/issues

═══════════════════════════════════════════════════════════
