# Plakar Dashboard

A local web application that gives you a **visual interface** to manage your [Plakar](https://plakar.io) encrypted backups — no terminal commands needed.

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20%2F%20Light-6366f1) ![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black) ![Platform](https://img.shields.io/badge/Platform-Windows-0078D6)

---

## What is This?

**Plakar** is an open-source encrypted backup tool that runs via CLI. This dashboard wraps it into a clean, browser-based GUI so you can:

- 🔒 **Create** encrypted backup repositories
- 📤 **Backup** any folder with one click
- 📸 **View snapshots** — every backup creates an immutable point-in-time snapshot
- ♻️ **Restore** files from any snapshot
- 🗑️ **Delete** old snapshots you no longer need
- 📂 **Browse folders** using the native Windows file picker

All operations happen **locally on your machine**. No data is sent to the internet.

---

## How It Works

```
You (Browser)  →  Next.js App (localhost:3000)  →  Plakar CLI (on your PC)
     ↑                                                    ↓
     └──────────── Results displayed ←──── Encrypted backup stored
```

1. **Select** your source folder and destination through the UI
2. **Plakar** shreds, deduplicates, compresses, and encrypts your files
3. **Snapshots** are created — each one is an immutable backup you can restore anytime

---

## Pages

| Page | What It Does |
|------|-------------|
| **Dashboard** | Shows Plakar CLI status, version, and quick-action shortcuts |
| **Backup** | Initialize a new repository or push a backup |
| **Snapshots** | List all snapshots with timestamps, IDs, and sizes |
| **Restore** | Recover files from any snapshot to any destination |
| **Settings** | View detected CLI path and app information |

---

## Getting Started

### Prerequisites
- **Windows 10/11**
- **Node.js** v18+ — [Download](https://nodejs.org)
- **Plakar CLI** — [Download from GitHub Releases](https://github.com/PlakarKorp/plakar/releases)

### Installation

```bash
# Clone the repository
git clone https://github.com/ankushjha-aj/plakar-dashboard.git
cd plakar-dashboard

# Install dependencies
npm install

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Installing Plakar CLI

```powershell
# Download and extract (change the path to your preferred location)
Invoke-WebRequest -Uri "https://github.com/PlakarKorp/plakar/releases/download/v1.0.6/plakar_1.0.6_windows_amd64.tar.gz" -OutFile "$env:TEMP\plakar.tar.gz"
mkdir -Force "$HOME\plakar-cli"
tar -xf "$env:TEMP\plakar.tar.gz" -C "$HOME\plakar-cli"

# Add to PATH
$env:PATH += ";$HOME\plakar-cli"
```

---

## Features

- 🌗 **Dark / Light theme** toggle with saved preference
- 📂 **Native Windows folder picker** — Browse button opens the real OS dialog
- 🔐 **Passphrase-based encryption** — AES-256 via Plakar
- 📊 **Deduplication** — only new/changed data is stored, saving space
- 🕐 **Immutable snapshots** — backups can never be accidentally modified
- ⚡ **Fast** — runs entirely on your local machine

---

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript
- **Backend:** Next.js API Routes (server-side)
- **CLI Integration:** Plakar via `PLAKAR_PASSPHRASE` env var
- **Styling:** Custom CSS with dark/light theme support

---

## License

This is a community-built GUI wrapper for [Plakar](https://plakar.io), which is open-source software by PlakarKorp.
