# Plakar Dashboard

> A beautiful, browser-based GUI for managing your [Plakar](https://plakar.io) encrypted backups — no terminal required.

![Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white) ![Plakar](https://img.shields.io/badge/Backed%20by-Plakar%20CLI-6366f1) ![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-0078D6) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [What is Plakar?](#-what-is-plakar)
- [What is this Dashboard?](#-what-is-this-dashboard)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Step 1 — Install Node.js](#step-1--install-nodejs)
  - [Step 2 — Install Plakar CLI](#step-2--install-plakar-cli)
  - [Step 3 — Clone & Run the Dashboard](#step-3--clone--run-the-dashboard)
- [First-Time Setup](#-first-time-setup)
- [Pages Reference](#-pages-reference)
- [Configuration](#-configuration)
- [FAQ & Troubleshooting](#-faq--troubleshooting)
- [Contributing](#-contributing)
- [License](#️-license)

---

## 🔐 What is Plakar?

**Plakar** is a modern, open-source, snapshot-based backup tool built around **security-first** principles:

- **Immutable Snapshots** — Every backup creates a read-only, cryptographically verified point-in-time snapshot.
- **AES-256-GCM Encryption** — All data is encrypted before it leaves your machine. Your passphrase never leaves the client.
- **Content-Addressed Deduplication** — Identical data blocks are stored only once, massively reducing storage usage.
- **Zero-Trust Architecture** — Designed assuming the storage backend may be compromised. Safety is mathematically guaranteed.
- **SHA-256 Integrity Proofs** — Every block is verified on restore, guaranteeing zero bit-rot.

Plakar is a CLI-first tool, maintained by [PlakarKorp](https://github.com/PlakarKorp/plakar) and part of the CNCF ecosystem. This dashboard wraps it in a clean, browser-based GUI.

---

## 🖥️ What is this Dashboard?

This is a **local web application** built with **Next.js 16** that gives you a visual interface to manage Plakar encrypted backups without touching the terminal.

```
You (Browser)  →  Next.js App (localhost:3000)  →  Plakar CLI (on your machine)
     ↑                                                      ↓
     └──────────── Snapshots, repos, status ←── Encrypted backup stored locally
```

All operations happen **100% locally**. No cloud dependency. No external API calls. Your data stays on your machine.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌗 **Dark / Light Theme** | Full dark and light mode with saved preference |
| 📁 **Native Folder Picker** | Browse button opens the real OS file dialog |
| 🔐 **AES-256 Encryption** | All backups are encrypted via Plakar passphrase |
| 📸 **Snapshot Browser** | List, browse, and explore every backup ever made |
| ♻️ **File Restore** | Recover any file from any snapshot to any destination |
| 📦 **Repository Manager** | Create, archive, and manage multiple backup repositories |
| 🆚 **Snapshot Comparison** | Diff two backup points to see what changed |
| 📊 **Deduplication** | Only changed blocks are stored — saves space |
| 🖥️ **Multi-OS Support** | macOS, Linux, and Windows (64-bit) |
| ⚡ **Zero Latency** | Runs entirely on your local machine |
| 🔔 **Overwrite Prompt** | Confirmation popup if restoring over an existing file |

---

## 📸 Screenshots

### Dashboard
The main dashboard shows your backup stats, repository list, snapshot activity, and quick action shortcuts — all without needing a passphrase.

<img width="1898" height="941" alt="dashboard-plakar page" src="https://github.com/user-attachments/assets/aaf99778-159f-4f22-9099-f5966543b991" />

### Repositories Page
Manage all your encrypted backup repositories. Create new ones, archive old ones, and click any row to unlock it with your passphrase.

<img width="1912" height="942" alt="repo-plakar" src="https://github.com/user-attachments/assets/c62f4731-a858-474b-bb4b-9ee44c31d158" />

### Backup Page
Choose a source folder and a target repository to create an encrypted, deduplicated snapshot with one click.

<img width="1919" height="934" alt="backup-plakar" src="https://github.com/user-attachments/assets/a32726fb-3769-43db-bf03-d89a25ebc588" />

### Restore Page
Select a repository, unlock it, browse its file tree, and restore any file or folder to any destination on your machine.

<img width="1912" height="941" alt="restore-plakar" src="https://github.com/user-attachments/assets/24b63325-d455-4aa7-89fc-5acc9e11eedc" />

### Settings Page
View the detected Plakar CLI path, version, platform information, and dashboard configuration.

<img width="1895" height="941" alt="settings-plakar" src="https://github.com/user-attachments/assets/eb91e617-32f6-4082-b6b0-fa1d4573374e" />

---

## 📋 Prerequisites

Before you start, you need two things installed on your machine:

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | v18 or later | JavaScript runtime for the dashboard |
| **Plakar CLI** | v1.0+ | The backup engine this dashboard wraps |

---

## 🚀 Installation

### Step 1 — Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org). Choose the **LTS** version.

Verify your install:
```bash
node --version   # Should print v18.x.x or higher
npm --version    # Should print 9.x.x or higher
```

---

### Step 2 — Install Plakar CLI

#### 🍎 macOS (Homebrew — Recommended)

```bash
brew install plakar
```

Verify:
```bash
plakar version
```

#### 🐧 Linux (AMD64)

```bash
curl -sSfL \
  https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_linux_amd64.tar.gz \
  | sudo tar xz -C /usr/local/bin

plakar version
```

For ARM (e.g., Raspberry Pi / AWS Graviton):
```bash
curl -sSfL \
  https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_linux_arm64.tar.gz \
  | sudo tar xz -C /usr/local/bin
```

#### 🪟 Windows (PowerShell)

Run these commands in **PowerShell as Administrator**:

```powershell
# Download Plakar CLI
$url = "https://github.com/PlakarKorp/plakar/releases/download/v1.0.6/plakar_1.0.6_windows_amd64.tar.gz"
$dest = "$env:TEMP\plakar.tar.gz"
Invoke-WebRequest -Uri $url -OutFile $dest

# Extract to a folder
$folder = "$HOME\plakar-cli"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
tar -xf $dest -C $folder

# Add to PATH for this session
$env:PATH += ";$folder"

# Verify
plakar version
```

> **Tip:** To make the PATH change permanent on Windows, add `$HOME\plakar-cli` to your **System Environment Variables → PATH**.

---

### Step 3 — Clone & Run the Dashboard

```bash
# Clone the repository
git clone https://github.com/ankushjha-aj/plakar-dashboard.git
cd plakar-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

You should see the **Overview** page confirming that Plakar CLI is connected.

---

## 🏁 First-Time Setup

Once the dashboard is running:

### 1. Create Your First Repository

1. Click **Repositories** in the left sidebar
2. Click **New Repository** (top-right button)
3. Enter or browse to a folder path (e.g., `/Users/you/my-backups`)
4. Set a **strong passphrase** — this encrypts all your data. **Store it safely.** You cannot recover data without it.
5. Click **Create Repository** → you'll see a success message

### 2. Run Your First Backup

1. Click **Backup** in the left sidebar
2. Under **Push Mode**, select the folder you want to back up (Source)
3. Select or type the repository path you just created
4. Enter the passphrase
5. Click **Start Backup** and wait for the confirmation

### 3. View Your Snapshots

1. Click **Repositories**
2. Click on your newly created repository row
3. Enter your passphrase → you'll be taken to the Snapshots page
4. Browse files, compare snapshots, or restore individual files

---

## 📑 Pages Reference

| Page | URL | What it does |
|---|---|---|
| **Overview** | `/` | What is Plakar, security model, how the dashboard works |
| **Dashboard** | `/dashboard` | Stats (repos, snapshots, size), quick actions, repo overview, activity feed |
| **Backup** | `/backup` | Initialize a new repository OR push a backup snapshot |
| **Repositories** | `/repositories` | List all repositories, create new, archive, unlock to browse |
| **Snapshot Browser** | `/repositories/snapshots-*` | Browse file tree of any snapshot in a repository |
| **Restore** | `/restore` | Recover files from any snapshot to any destination |
| **Compare** | `/compare` | Diff two snapshots side-by-side to see what changed |
| **Settings** | `/settings` | CLI path, version info, platform detection |

---

## ⚙️ Configuration

The dashboard auto-detects the Plakar CLI binary from your system `PATH`. No configuration file is needed for a standard install.

### Environment Variables

You can override settings by creating a `.env.local` file in the project root:

```bash
# Optional: Override Plakar binary path (useful if not in PATH)
PLAKAR_BIN=/usr/local/bin/plakar

# Optional: Change the dev server port (default: 3000)
PORT=3001
```

### Passphrase Security

- Passphrases are **never stored on disk**
- They are held in **`sessionStorage`** (cleared when the browser tab closes)
- All encryption/decryption happens via the Plakar CLI running locally
- The Next.js API routes pass passphrases as an environment variable (`PLAKAR_PASSPHRASE`) to the CLI subprocess — they are never logged

---

## ❓ FAQ & Troubleshooting

### "Plakar CLI Not Found" banner is showing

The dashboard cannot find the `plakar` binary in your system `PATH`.

**Fix:** Run `which plakar` (macOS/Linux) or `where plakar` (Windows) to check if it's installed. If not, follow [Step 2](#step-2--install-plakar-cli) above.

If it's installed but not found, add its location to `PATH` or create a `.env.local` with `PLAKAR_BIN=/path/to/plakar`.

---

### "Invalid passphrase or failed to access repository"

The passphrase you entered doesn't match the one used when the repository was created.

**Note:** There is no passphrase recovery. If you've forgotten your passphrase, the data in that repository cannot be decrypted.

---

### Backup fails with "permission denied"

The folder you are trying to back up has restricted permissions.

**Fix (macOS):** Grant Terminal (or your browser/Node.js) Full Disk Access in **System Settings → Privacy & Security → Full Disk Access**.

**Fix (Linux):** Run `sudo chmod -R a+r /path/to/source` or run the dashboard with appropriate permissions.

---

### The folder picker button doesn't open a dialog

The native folder picker uses a system-level API. On some configurations it may not work.

**Fix:** Type the folder path directly into the text input instead of using the Browse button.

---

### `npm run dev` fails with "Cannot find module"

The `node_modules` folder may be missing or corrupted.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Port 3000 is already in use

Another process is using port 3000.

**Fix:**
```bash
npm run dev -- --port 3001
```

Then open `http://localhost:3001` instead.

---

### "No repositories yet" but I've created repositories before

The repository list is stored in a local JSON file. If that file is missing or if you're running the dashboard from a different directory, repositories won't appear.

**Fix:** Make sure you always run `npm run dev` from the same `plakar-dashboard` directory.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository on GitHub
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test them with `npm run dev`
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request on GitHub

Please follow the existing code style (TypeScript, functional React components, CSS variables for theming).

---

## ⚖️ License

This project is a **community-built GUI** wrapper for [Plakar](https://plakar.io), which is open-source software by [PlakarKorp](https://github.com/PlakarKorp). 

This dashboard is released under the **MIT License**.

Built with ❤️ by [Ankush Kumar Jha](https://github.com/ankushjha-aj).

---

> **Plakar** is part of the Linux Foundation and committed to open standards. Your data is stored in open formats and is never locked in.
