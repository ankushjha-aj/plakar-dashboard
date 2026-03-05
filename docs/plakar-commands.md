# Plakar CLI Commands Reference

A complete reference of all useful Plakar CLI commands. Use these to interact with your repositories, snapshots, and files directly from the terminal.

> **General Syntax:**
> ```bash
> plakar [global options] at <repository-path> <command> [command options] [arguments]
> ```
> If no `at <path>` is given, Plakar uses the default repository at `~/.plakar`.

---

## Global Options

| Option | Description |
|---|---|
| `at <path>` | Specify the repository path to operate on |
| `-passphrase <pass>` | Provide the passphrase directly (avoid in scripts — use env var instead) |
| `PLAKAR_PASSPHRASE=<pass>` | **Recommended:** set via environment variable instead of flag |
| `-keyfile <file>` | Use a key file for the passphrase |
| `-quiet` | Suppress all output except errors |
| `--version` | Show installed Plakar version |
| `--help` | Show help for any command |

---

## Repository Commands

### `create` — Initialize a new repository

```bash
# Create a new encrypted repository
plakar at /path/to/repo create

# With passphrase via environment variable (recommended)
PLAKAR_PASSPHRASE="YourStrongPass!" plakar at /path/to/repo create
```

---

## Backup Commands

### `backup` — Create a snapshot of a directory

```bash
# Basic backup (backs up current directory to default repo)
plakar backup

# Backup a specific source to a specific repo
plakar at /path/to/repo backup /path/to/source

# With passphrase via env var
PLAKAR_PASSPHRASE="YourPass" plakar at /path/to/repo backup /path/to/source

# Assign a tag to the snapshot
plakar at /path/to/repo backup -tag daily /path/to/source

# Assign multiple tags
plakar at /path/to/repo backup -tag daily,production /path/to/source

# Exclude specific patterns
plakar at /path/to/repo backup -exclude "*.tmp" -exclude "*.log" /path/to/source

# Exclude patterns from a file
plakar at /path/to/repo backup -excludes ~/my-excludes.txt /path/to/source

# Dry run — see what would be backed up without creating a snapshot
plakar at /path/to/repo backup -dry-run /path/to/source

# Backup with integrity check after completion
plakar at /path/to/repo backup -check /path/to/source

# Set concurrency (default: 8 × CPU cores + 1)
plakar at /path/to/repo backup -concurrency 4 /path/to/source

# Skip extended attributes
plakar at /path/to/repo backup -no-xattr /path/to/source
```

---

## Listing Commands

### `ls` — List snapshots or browse snapshot contents

```bash
# List all snapshots in a repository
plakar at /path/to/repo ls

# List snapshots with full UUIDs (instead of short IDs)
plakar at /path/to/repo ls -uuid

# Filter by tag
plakar at /path/to/repo ls -tag daily

# Show only the latest snapshot
plakar at /path/to/repo ls -latest

# Show snapshots older than 30 days
plakar at /path/to/repo ls -before 30d

# Show snapshots created in the last 7 days
plakar at /path/to/repo ls -since 7d

# Browse contents of a specific snapshot
plakar at /path/to/repo ls abc12345

# Recursively list contents of a path inside a snapshot
plakar at /path/to/repo ls -recursive abc12345:/path/inside/snapshot
```

---

## Restore Commands

### `restore` — Recover files from a snapshot

```bash
# Restore all files from a snapshot to the current directory
plakar at /path/to/repo restore abc12345

# Restore to a specific directory
plakar at /path/to/repo restore -to /recovery/dir abc12345

# Restore a specific file from a snapshot
plakar at /path/to/repo restore -to /recovery/dir abc12345:notes.md

# Restore a specific directory from a snapshot
plakar at /path/to/repo restore -to /recovery/dir abc12345:/path/to/folder

# Restore without preserving file permissions
plakar at /path/to/repo restore -skip-permissions -to /recovery/dir abc12345

# Restore the latest snapshot matching a tag
plakar at /path/to/repo restore -tag daily -latest -to /recovery/dir

# Restore quiet (no output)
plakar at /path/to/repo restore -quiet -to /recovery/dir abc12345
```

---

## Snapshot Management

### `rm` — Delete snapshots

```bash
# Remove a specific snapshot by ID
plakar at /path/to/repo rm abc12345

# Remove multiple snapshots
plakar at /path/to/repo rm abc12345 def67890

# Remove snapshots older than 30 days
plakar at /path/to/repo rm -before 30d

# Remove snapshots older than 2 weeks
plakar at /path/to/repo rm -before 2w

# Remove snapshots with a specific tag
plakar at /path/to/repo rm -tag old-backups

# Remove the latest snapshot
plakar at /path/to/repo rm -latest
```

---

## Verification Commands

### `check` — Verify snapshot integrity

```bash
# Check all snapshots in a repository
plakar at /path/to/repo check

# Check a specific snapshot
plakar at /path/to/repo check abc12345

# Check with verbose output
plakar at /path/to/repo check -verbose abc12345
```

---

## Snapshot Info Commands

### `info` — Show detailed snapshot information

```bash
# Show info about a specific snapshot
plakar at /path/to/repo info abc12345

# Show repository-level info
plakar at /path/to/repo info
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PLAKAR_PASSPHRASE` | Passphrase for the repository (avoids interactive prompt) |
| `PLAKAR_REPOSITORY` | Default repository path (avoids typing `at /path` every time) |

**Examples:**
```bash
# Set a default repository for the session
export PLAKAR_REPOSITORY=/Volumes/Backup/MyRepo
export PLAKAR_PASSPHRASE="YourStrongPass!"

# Now you can run commands without specifying the path
plakar backup ~/Documents
plakar ls
plakar restore -to ~/restore abc12345
```

---

## Common Recipes

### Daily backup script (Linux/macOS cron)

```bash
#!/bin/bash
export PLAKAR_PASSPHRASE="YourPass!"
plakar at /Volumes/Backup/MyRepo backup -tag daily ~/Documents
```

Add to crontab (`crontab -e`):
```
0 2 * * * /path/to/backup-script.sh >> /var/log/plakar-backup.log 2>&1
```

### Backup and auto-delete snapshots older than 30 days

```bash
PLAKAR_PASSPHRASE="YourPass!" plakar at /path/to/repo backup ~/Documents
PLAKAR_PASSPHRASE="YourPass!" plakar at /path/to/repo rm -before 30d
```

### Check backup health after every run

```bash
PLAKAR_PASSPHRASE="YourPass!" plakar at /path/to/repo backup ~/Documents -check
```

### List repository contents without entering passphrase interactively

```bash
PLAKAR_PASSPHRASE="YourPass!" plakar at /path/to/repo ls
```

---

## Quick Reference Card

```
plakar at <repo> create                          → Create new repository
plakar at <repo> backup <source>                 → Back up a folder
plakar at <repo> backup -tag <tag> <source>      → Back up with a tag
plakar at <repo> backup -exclude "*.log" <src>   → Back up, skip .log files
plakar at <repo> backup -dry-run <source>        → Preview what would be backed up
plakar at <repo> ls                              → List all snapshots
plakar at <repo> ls <snapshotID>                 → Browse a snapshot's files
plakar at <repo> ls -tag <tag>                   → List snapshots by tag
plakar at <repo> ls -before 30d                  → List snapshots older than 30 days
plakar at <repo> restore -to <dir> <snapshotID>  → Restore snapshot to folder
plakar at <repo> restore -to <dir> <id>:<file>   → Restore single file
plakar at <repo> rm <snapshotID>                 → Delete a snapshot
plakar at <repo> rm -before 30d                  → Delete old snapshots
plakar at <repo> check <snapshotID>              → Verify snapshot integrity
plakar at <repo> info <snapshotID>               → Show snapshot details
```

---

## Further Help

```bash
# General help
plakar --help

# Help for a specific command
plakar backup --help
plakar restore --help
plakar ls --help
plakar rm --help
```

Official documentation: **https://plakar.io/docs/**
GitHub repository: **https://github.com/PlakarKorp/plakar**
