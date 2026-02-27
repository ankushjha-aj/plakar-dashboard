# Plakar Dashboard – Custom GUI (Web App)

A local Next.js web application that provides a visual GUI for managing [Plakar](https://plakar.io) encrypted backups. No terminal commands needed — just run the app and use the browser.

---

## Prerequisites

1. **Node.js** (v18 or later) — [Download](https://nodejs.org)
2. **Plakar CLI** installed and accessible from PATH (see `README.md` for CLI installation instructions)

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture

```
Browser (localhost:3000)
    │
    ├──→ Frontend (Next.js TSX Pages)
    │       User fills in Source Path, Destination, Passphrase
    │       Clicks "Run Backup" / "Load Snapshots" / "Restore Now"
    │
    └──→ API Routes (Next.js Server-Side)
            Receives form data as JSON
            Spawns `plakar.exe` as a child process
            Pipes passphrase to stdin
            Parses CLI output into structured JSON
            Returns results to the frontend
```

The app runs **entirely on your local machine**. No data is sent to the internet.

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| **Dashboard** | `/` | Detects Plakar CLI, shows version, quick-action shortcuts |
| **Backup** | `/backup` | Initialize a new repository OR run a backup |
| **Snapshots** | `/snapshots` | List all snapshots in a repository with timestamps and IDs |
| **Restore** | `/restore` | Restore files from a specific Snapshot ID |
| **Settings** | `/settings` | View detected Plakar path and version info |

---

## API Endpoints

All routes are under `/api/plakar/` and accept JSON.

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/plakar/status` | — | Detect Plakar CLI and return version |
| POST | `/api/plakar/create` | `{ repository, passphrase }` | Initialize a new Kloset |
| POST | `/api/plakar/backup` | `{ repository, source, passphrase }` | Run a backup and return Snapshot ID |
| POST | `/api/plakar/snapshots` | `{ repository, passphrase }` | List all snapshots |
| POST | `/api/plakar/restore` | `{ repository, snapshotId, destination, passphrase }` | Restore from a snapshot |
| POST | `/api/plakar/delete` | `{ repository, snapshotId, passphrase }` | Delete a snapshot |

---

## Project Structure

```
plakar-dashboard/
├── src/
│   ├── lib/
│   │   └── plakar.ts          # Core helper: finds & executes plakar.exe
│   ├── components/
│   │   └── Sidebar.tsx         # Sidebar navigation
│   └── app/
│       ├── layout.tsx          # Root layout with sidebar
│       ├── globals.css         # Dark-themed design system
│       ├── page.tsx            # Dashboard (home)
│       ├── backup/page.tsx     # Backup & init page
│       ├── snapshots/page.tsx  # Snapshot listing
│       ├── restore/page.tsx    # Restore page
│       ├── settings/page.tsx   # Settings page
│       └── api/plakar/
│           ├── status/route.ts
│           ├── create/route.ts
│           ├── backup/route.ts
│           ├── snapshots/route.ts
│           ├── restore/route.ts
│           └── delete/route.ts
├── README.md                   # CLI installation guide (untouched)
├── customgui-readme.md         # This file
└── package.json
```

---

## License

Plakar is open-source software. This dashboard is a community wrapper built on top of the Plakar CLI.
Visit [plakar.io](https://plakar.io) for the official project.
