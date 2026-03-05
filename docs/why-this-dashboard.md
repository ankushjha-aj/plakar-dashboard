# Why This Dashboard Exists

## The Problem

Plakar is a technically excellent backup tool — encrypted, deduplicated, fast, and open-source. But it has one significant barrier: **it is entirely CLI-based**.

For many users — developers, small teams, or non-technical users managing personal backups — working with a terminal for every backup and restore operation is friction. There is:

- No way to visually browse repositories or snapshots
- No history of what was backed up and when
- No GUI to select folders or download individual files
- No status dashboard to verify the CLI is working
- No repository registry — you must remember every full path

**This dashboard was built to solve exactly these problems.**

---

## Why It's Needed

### 1. Accessibility for Non-CLI Users
Not everyone is comfortable with terminal commands. This dashboard makes Plakar's powerful backup engine accessible to users who prefer a point-and-click interface — without sacrificing any of Plakar's core security or features.

### 2. Visibility Into Your Backups
The CLI gives you output in the terminal, then it's gone. The dashboard maintains:
- A **history** of every backup with dates, snapshot IDs, and source paths
- An **activity log** of recent operations
- A **snapshot browser** to see what's stored

### 3. Safer Restores
Restoring via CLI silently overwrites existing files. The dashboard adds a **confirmation dialog** before overwriting, preventing accidental data loss.

### 4. Multi-Repository Management
If you maintain multiple Plakar repositories (e.g., one per project, one per machine), tracking them all by full path in the terminal is hard. The dashboard provides a named, searchable **repository registry**.

### 5. It Runs 100% Locally
Unlike cloud backup dashboards, this dashboard:
- Makes **no internet calls**
- Stores all metadata **on your machine** in `~/.plakar-dashboard/`
- Never sends your passphrase, file names, or repository paths anywhere
- Can run completely offline

---

## Is Plakar Open Source? Can You Expand It?

### Yes — Plakar is fully open source
- **License:** OpenBSD (BSD 2-Clause) — use, modify, redistribute freely
- **Repository:** [github.com/PlakarKorp/plakar](https://github.com/PlakarKorp/plakar)
- **Governance:** Backed by PlakarKorp and affiliated with CNCF / Linux Foundation

### And so is This Dashboard
This dashboard is also open source and built to be extended.

---

## How You Can Expand This Dashboard

Since both Plakar CLI and this dashboard are open source, the expansion possibilities are wide. Here are the most impactful directions:

### 🔌 Add Remote Repository Support
Plakar already supports remote stores (S3, SSH, etc.) via CLI. The dashboard could expose a UI to:
- Configure remote backends (AWS S3, Backblaze B2, SFTP)
- Browse and restore from remote snapshots
- Schedule syncs between local and remote

### ⏰ Scheduled Backup Automation
Add a cron/task scheduler UI in the dashboard that:
- Lets users define backup schedules (daily, weekly, on login)
- Writes the appropriate `crontab` entry (macOS/Linux) or Task Scheduler task (Windows)
- Shows the last run status and next scheduled time

### 📊 Storage Analytics Dashboard
Visualize repository health with charts:
- Storage used per snapshot over time
- Deduplication savings (how much space was saved)
- Most frequently backed-up file types
- Repository growth trends

### 👤 Multi-User / Team Mode
Add simple authentication so the dashboard can be hosted on a local server and accessed by multiple team members — each with their own repository access.

### 🔔 Notifications
Integrate success/failure notifications via:
- Desktop notifications (using the Web Notifications API)
- Email alerts (using Nodemailer, already researched for this project)
- Webhook / Slack integration for DevOps teams

### 🗄️ SQLite Database Backend
Replace the current JSON file storage with a lightweight SQLite database for:
- Faster queries on large snapshot histories
- Better multi-repo metadata management
- Advanced filtering and search

### 🌍 REST API Layer
Expose the dashboard's backend as a documented REST API so that:
- Other tools can trigger Plakar backups programmatically
- CI/CD pipelines can check backup status
- Custom scripts can pull snapshot metadata

### 🤝 Contributing to Plakar Itself
You can also contribute directly to the Plakar CLI:
- Submit bug reports and feature requests at [GitHub Issues](https://github.com/PlakarKorp/plakar/issues)
- Open pull requests for new connectors, storage backends, or CLI improvements
- Join community discussions: [GitHub Discussions](https://github.com/PlakarKorp/plakar/discussions)

---

## Summary

> This dashboard is not just a UI — it's a bridge between Plakar's powerful, secure backup engine and the users who need it most. It keeps everything local, private, and in the user's control, while dramatically lowering the barrier to using one of the best open-source backup tools available.
