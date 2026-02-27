# Plakar Backup Setup Guide (Windows)

This document is a comprehensive guide to understanding, installing, and using **Plakar**—a powerful open-source backup tool. It is designed so that anyone can replicate these steps on their own Windows machine.

---

## What is Plakar & How Does it Work?

Before installing, it is vital to understand *how* Plakar secures your data. Plakar operates a bit differently from a simple "copy and paste" backup. 

### The Core Concepts (The "Safe" Analogy)
* **The "Data" Folder (Your Desk):** This is where your original, readable files live (e.g., `Documents\Work`).
* **The "Kloset" Repository (The Safe):** This is the destination folder where Plakar securely stores your backups. **You cannot open this folder to look at your files directly.** When Plakar backs something up, it shreds the files into tiny chunks, compresses them, encrypts them with a password you provide, and stores them in this "Safe". Only Plakar has the key to put the puzzle pieces back together.
* **The Snapshot ID (The Receipt):** Every time you run a backup, Plakar takes a mathematical "picture" of exactly what your source data folder looks like at that specific second. It assigns this picture a unique **Snapshot ID** (like `39d2282a`). 

### Why is Plakar Smart? (Deduplication)
If you backup 3 files today, and then tomorrow you add a 4th file and edit the 1st file:
- Plakar **does not** re-upload the unchanged files.
- It sees you already backed up the identical pieces of the old files yesterday.
- It *only* encrypts and saves the brand new 4th file and the newly edited pieces of the 1st file.
- It gives you a **new Snapshot ID** that points to everything seamlessly. 

This means your backups are blazing fast, they never overwrite your old backups (they are immutable), and they take up fractionally less hard drive space!

---

## 1. Fast Installation (PowerShell)

You can install Plakar using the pre-built executable directly from GitHub. Open a **PowerShell** window and run the following lines sequentially.

*(Note: Change `C:\path\to\install` to wherever you want the Plakar application to live, such as `C:\Plakar`)*

### Step 1: Download and Extract Plakar
```powershell
# Set the download URL (replace with latest version if required)
$Url = "https://github.com/PlakarKorp/plakar/releases/download/v1.0.6/plakar_1.0.6_windows_amd64.tar.gz"
$OutPath = "$env:TEMP\plakar.tar.gz"

# Download the archive
Invoke-WebRequest -Uri $Url -OutFile $OutPath

# Create the destination directory for the CLI
mkdir -Force "C:\path\to\install"

# Extract the archive
tar -xf $OutPath -C "C:\path\to\install"
```

### Step 2: Add Plakar to your System PATH
This lets you execute the `plakar` command from any folder in your computer.
```powershell
# Read the current PATH
$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')

# Add the new directory if it isn't already there
if ($currentPath -notmatch 'C:\\path\\to\\install') {
    [Environment]::SetEnvironmentVariable('Path', "$currentPath;C:\path\to\install", 'User')
}

# Apply to current session
$env:PATH += ";C:\path\to\install"
```

### Step 3: Verify Installation
```powershell
plakar version
```

---

## 2. Setting Up Your First Backup

Decide on two folders:
1. **Source Folder:** The folder containing important files you want to protect (e.g., `C:\MyData`).
2. **Destination Folder (Kloset):** The folder where Plakar will store the encrypted backup database (e.g., `D:\MyBackups`).

### Phase A: Initialize the Secure Safe (Kloset)
You must initialize the target destination folder.

```powershell
plakar at "C:\Path\To\Your\Destination\Folder" create
```
> **⚠️ CRITICAL:** You will be prompted to type a strong passphrase. **If you lose this passphrase, your backups are permanently unrecoverable.** 

### Phase B: Push Your First Backup
Backup your source folder into the Safe.

```powershell
plakar at "C:\Path\To\Your\Destination\Folder" backup "C:\Path\To\Your\Source\Folder"
```
*(You will need to enter your passphrase to confirm).*

When finished, Plakar will output a **Snapshot ID** (e.g. `63b957c7`).

### Phase C: Running Future Backups
Whenever you edit files, delete files, or add new files to your source folder in the future, **run the exact same Phase B command again.** Plakar is smart enough to handle the changes and will generate a new Snapshot ID. 

---

## 3. Viewing and Restoring Your Data

### How to Find Your Snapshot IDs
You **do not need to write down or memorize** your Snapshot IDs when you do a backup!

If it has been months and you need to restore a file, you simply ask Plakar to show you a list of all backups it has ever taken.

Run the `ls` (list) command:
```powershell
plakar at "C:\Path\To\Your\Destination\Folder" ls
```

When you enter your passphrase, Plakar will output a tidy list with timestamps and the Snapshot IDs. It looks exactly like this:
> `2026-02-27T08:55:02Z   39d2282a      84 B        0s /C:/Path/To/Source`
> `2026-02-27T08:45:08Z   63b957c7      84 B        0s /C:/Path/To/Source`

If you wanted to restore your files from 8:45 AM, you simply highlight the `63b957c7` ID with your mouse, copy it, and paste it into the `restore` command.

### Restoring Files from a Snapshot ID
If you ever need to restore everything exactly as it was at a certain Snapshot ID, tell Plakar where to spit the unencrypted files out:
```powershell
# NOTE: Never restore directly into your live Source folder to prevent accidental overwrites. Create a "Restore" folder.
plakar at "C:\Path\To\Your\Destination\Folder" restore -to "C:\Path\To\A\Restore\Folder" [SNAPSHOT_ID_GOES_HERE]
```

### Method 2: The Plakar Web UI (Read-Only Interface)
While you must use the command-line to *push* files into the backup, Plakar features a very nice Web UI for *viewing* your Kloset.

The Web UI allows you to:
- View all your different Snapshot points in time.
- Click through the folder structures to see exactly what files were backed up.
- Search for specific files across your entire repository.
- Click to download/restore individual files back to your computer.

To launch the UI dashboard locally, run:
```powershell
plakar at "C:\Path\To\Your\Destination\Folder" ui
```
You can then open your web browser (usually at `http://localhost:3000`) to navigate your secure backups visually.
