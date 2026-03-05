# Plakar Installation Guide

This guide covers how to install the **Plakar CLI** on macOS, Linux, and Windows. The CLI is required for this dashboard to function — the dashboard is a web UI layer on top of the CLI binary.

> **Requirement:** Go 1.23.3 or higher (if installing from source)

---

## macOS

### Option 1 — Homebrew (Recommended)

The easiest way to install Plakar on macOS is via [Homebrew](https://brew.sh).

```bash
# Add the Plakar tap
brew tap PlakarKorp/plakar

# Install
brew install plakar

# Verify installation
plakar --version
```

### Option 2 — Install via Go toolchain

If you have Go installed (version 1.23.3+):

```bash
go install github.com/PlakarKorp/plakar/cmd/plakar@latest
```

Make sure your Go binary path is in your shell PATH:
```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

Add the above line to your `~/.zshrc` or `~/.bash_profile` to make it permanent.

### Option 3 — Build from Source

```bash
# Clone the repository
git clone https://github.com/PlakarKorp/plakar.git
cd plakar

# Build
go build ./cmd/plakar

# Move binary to a path location
mv plakar /usr/local/bin/plakar

# Verify
plakar --version
```

---

## Linux

### Option 1 — Install via Go toolchain (Recommended)

```bash
# Install Go first (if not already installed)
# Ubuntu / Debian
sudo apt update && sudo apt install golang-go

# Fedora / RHEL
sudo dnf install golang

# Then install Plakar
go install github.com/PlakarKorp/plakar/cmd/plakar@latest

# Add to PATH (add this to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(go env GOPATH)/bin"

# Verify
plakar --version
```

### Option 2 — Build from Source

```bash
git clone https://github.com/PlakarKorp/plakar.git
cd plakar
go build ./cmd/plakar
sudo mv plakar /usr/local/bin/plakar

# Verify
plakar --version
```

### Option 3 — Package Manager (Debian/Ubuntu)

Check for a `.deb` package in the [GitHub Releases](https://github.com/PlakarKorp/plakar/releases) page:

```bash
# Download the latest .deb release
wget https://github.com/PlakarKorp/plakar/releases/latest/download/plakar_linux_amd64.deb

# Install
sudo dpkg -i plakar_linux_amd64.deb

# Verify
plakar --version
```

---

## Windows

### Option 1 — PowerShell Installer (via this Dashboard)

This dashboard provides a downloadable PowerShell install script on the **Overview** page. This is the easiest method for Windows users.

1. Open the Plakar Dashboard
2. Go to the **Overview** page
3. Click **Download Install Script (.ps1)**
4. Run the downloaded script in PowerShell as Administrator:
   ```powershell
   ./install-plakar.ps1
   ```

### Option 2 — Install via Go toolchain

```powershell
# Install Go from https://go.dev/dl/ first
# Then run:
go install github.com/PlakarKorp/plakar/cmd/plakar@latest

# Add Go bin to PATH (usually auto-added on Windows)
# Verify
plakar --version
```

### Option 3 — Build from Source (PowerShell)

```powershell
git clone https://github.com/PlakarKorp/plakar.git
cd plakar
go build .\cmd\plakar
# Move plakar.exe to a location in your PATH
```

---

## Verifying Installation

After installation on any platform, run:

```bash
plakar --version
```

Expected output (version number may differ):
```
plakar version 0.x.x
```

If the command is not found, ensure the binary is in your system PATH.

---

## Connecting to the Dashboard

Once Plakar CLI is installed, start this dashboard:

```bash
npm run dev
# Open http://localhost:3000
```

The dashboard will automatically detect the Plakar binary. The **Settings** page shows the detected path, version, and architecture. A green "CLI Connected" indicator on the Overview page confirms everything is working.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `plakar: command not found` | Check that Go bin dir is in your PATH |
| `permission denied` | Run with `sudo` or move binary to `/usr/local/bin` |
| Dashboard shows "CLI Not Found" | Verify `which plakar` or `where plakar` returns a path |
| Dashboard on Windows shows "CLI Not Found" | Ensure `plakar.exe` is in `%USERPROFILE%\plakar-cli\` or in PATH |
