# Dashboard Features vs. Plakar Native UI

Plakar is a **CLI-first tool** — it has no official built-in graphical interface. This dashboard was built to fill that gap by providing a web-based UI layer on top of the Plakar binary. Below is a feature-by-feature comparison.

---

## Feature Comparison Table

| Feature | Plakar CLI | This Dashboard |
|---|---|---|
| Create a repository | ✅ CLI command | ✅ Visual form with folder picker |
| Run a backup | ✅ CLI command | ✅ Point-and-click with repo dropdown |
| Browse snapshots | ✅ `plakar ls` | ✅ Visual table with dates, sizes, IDs |
| Restore files | ✅ CLI command | ✅ GUI with overwrite confirmation prompt |
| Delete snapshots | ✅ `plakar rm` | ✅ One-click delete with confirmation |
| Download individual files | ❌ No native support | ✅ Download from snapshot via browser |
| Dark / Light mode | ❌ None | ✅ Full theme toggle with persistence |
| Repository management | ❌ No registry | ✅ Saved repo list with nicknames |
| Backup history per folder | ❌ No tracking | ✅ Tracks last backup date + snapshot count |
| Activity log | ❌ None | ✅ Recent actions log (backups, restores) |
| Auto-detect CLI path | ❌ Manual PATH setup | ✅ Automatic detection across all OSes |
| Passphrase recovery hint | ❌ None | ✅ Optional local passphrase recovery |
| Archive / unarchive repos | ❌ None | ✅ Archive repos to keep list clean |
| Native folder picker | ❌ None | ✅ OS-native folder picker dialog |
| CLI install scripts | ❌ Manual setup | ✅ Downloadable PowerShell installer (Windows) |
| Status indicator | ❌ None | ✅ Live "CLI Connected" badge on Overview |
| Encryption panel visualization | ❌ None | ✅ Animated AES-256 encryption display |

---

## Exclusive Dashboard Features (Not in Plakar CLI)

### 1. Visual Repository Registry
The CLI has no concept of "saved repositories." You must type the full path every time. The dashboard maintains a local list of your repositories with custom names and creation dates.

### 2. Backup History Tracking
The CLI does not track which folder you backed up to which repository. The dashboard logs every backup with:
- Source folder path
- Repository path
- Snapshot ID
- Date & time
- Snapshot count per folder

### 3. One-Click File Download
The Plakar CLI can restore files to disk, but cannot serve them via HTTP. The dashboard adds a **download** feature that lets you download individual files directly from any snapshot through the browser.

### 4. Overwrite Confirmation on Restore
When restoring to a path where a file already exists, the CLI will silently overwrite it. The dashboard shows a **confirmation popup** asking whether to overwrite, preventing accidental data loss.

### 5. Activity Log
A real-time log of recent backup and restore operations, visible in the sidebar — something Plakar CLI has no equivalent for.

### 6. Dark / Light Mode
The CLI is terminal-based and has no visual theming. The dashboard fully supports both dark and light mode with smooth transitions and persisted preference.

### 7. Archive System for Repositories
Repositories can be "archived" in the dashboard to hide them from the active list without deleting them — helpful when managing many repos over time.

### 8. Native OS Folder Picker
Instead of typing file paths, the dashboard integrates a **native OS folder picker dialog** that lets you visually select source directories.

### 9. CLI Status Monitoring
The dashboard continuously checks whether the Plakar CLI is installed, displays its version and path, and gives OS-specific install instructions if not found.

---

## What the Dashboard Does NOT Replace

The dashboard is a **UI companion**, not a replacement for the CLI. Certain workflows are still best done via CLI:

- **Scheduled / automated backups** — use cron jobs or Task Scheduler with `plakar backup`
- **Remote repositories** — SSH, S3, or other remote targets (dashboard currently supports local paths only)
- **Scripted multi-repo operations** — batch deletes, syncs, or cross-repo operations
- **CI/CD integration** — pipeline-based backup automation

---

## Summary

> The Plakar Dashboard turns a powerful but text-only backup tool into an accessible, visual experience — without sacrificing any of Plakar's core security or performance characteristics.
