# What is Plakar?

Plakar is an **open-source, snapshot-based backup tool** built for security, efficiency, and simplicity. It is developed under the [OpenBSD license](https://github.com/PlakarKorp/plakar) and is part of both the **CNCF (Cloud Native Computing Foundation)** and the **Linux Foundation** ecosystems.

> "Plakar is a backup tool designed to be secure, fast, and easy to use — storing your data in encrypted, deduplicated, immutable snapshots."

---

## Core Concept

Instead of copying your files every time, Plakar takes **snapshots** — a record of exactly what your files looked like at a specific point in time. Each snapshot is:

- **Incremental** — only stores what changed since the last backup
- **Encrypted** — your data is protected with AES-256-GCM
- **Deduplicated** — identical file blocks are stored only once, saving space
- **Immutable** — once created, a snapshot cannot be altered

---

## How It Works — Step by Step

```
1. SCAN          → Plakar scans the source directory for files to back up
2. DEDUPLICATE   → Identical chunks found across previous backups are skipped
3. COMPRESS      → Unique chunks are compressed to reduce size
4. ENCRYPT       → Compressed data is encrypted with AES-256-GCM
5. STORE         → Data is written to the repository as a new snapshot
6. RESTORE       → On request, Plakar reverses the process to recover your files
```

---

## Key Features

### 🔐 Zero-Knowledge Encryption
- Uses **AES-256-GCM** — the same standard used by banks and governments
- Your passphrase never leaves your machine; encryption and decryption happen **100% locally**
- Even if someone has access to your repository file, they cannot read your data without your passphrase

### 🗃️ Kloset Engine (Deduplication)
- Plakar's deduplication engine, called **Kloset**, identifies identical data blocks across all snapshots
- Identical blocks are stored only once — even if the same file exists in 100 snapshots
- Dramatically reduces storage usage for frequently backed-up data

### 📸 Immutable Snapshots
- Every backup creates a read-only snapshot with a unique ID (e.g., `a1b2c3d4`)
- Snapshots cannot be modified after creation — only deleted
- SHA-256 integrity checks verify every restored file has zero bit-rot

### ⚡ Incremental Backups
- After the first full backup, subsequent backups only store changed data
- Backups run fast and use minimal storage

### 🌐 Open Formats — No Vendor Lock-in
- No proprietary file formats — your data is always portable
- Repository structure is documented and readable with open-source code

### 🔧 CLI-First Design
- Plakar is primarily a **command-line tool** — designed for automation, scripts, cron jobs, and DevOps pipelines
- No heavy UI or background service required

---

## License

Plakar is distributed under the **OpenBSD license** (BSD 2-Clause equivalent):

```
Copyright (c) 2021 Gilles Chehade <gilles@poolp.org>
Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

In plain terms: **do whatever you want with it**, as long as you retain the copyright notice.

---

## Who Made It?

Plakar was created by **Gilles Chehade** (`gilles@poolp.org`) in 2021 and is actively maintained by [PlakarKorp](https://github.com/PlakarKorp/plakar).

---

## Official Links

| Resource | URL |
|---|---|
| Official Website | https://plakar.io |
| GitHub Repository | https://github.com/PlakarKorp/plakar |
| Documentation | https://plakar.io/docs/ |
| Community Discussions | https://github.com/PlakarKorp/plakar/discussions |
