#Requires -Version 5.1
<#
.SYNOPSIS
    Installs the Plakar CLI on Windows.

.DESCRIPTION
    Downloads the latest Plakar CLI binary from GitHub releases,
    installs it to ~/plakar-cli, and adds it to the user PATH.

.NOTES
    Run with: powershell -ExecutionPolicy Bypass -File install-plakar.ps1
#>

$ErrorActionPreference = "Stop"

# ──── Configuration ────
$InstallDir   = Join-Path $env:USERPROFILE "plakar-cli"
$BinaryName   = "plakar.exe"
$GithubRepo   = "PlakarKorp/plakar"
$ReleaseAPI   = "https://api.github.com/repos/$GithubRepo/releases/latest"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Plakar CLI Installer (Windows)     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ──── Step 1: Create install directory ────
Write-Host "[1/5] Creating install directory..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "  → Created: $InstallDir" -ForegroundColor Green
} else {
    Write-Host "  → Already exists: $InstallDir" -ForegroundColor Green
}

# ──── Step 2: Detect architecture ────
Write-Host "[2/5] Detecting system architecture..." -ForegroundColor Yellow
$Arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }
Write-Host "  → Architecture: windows/$Arch" -ForegroundColor Green

# ──── Step 3: Download latest release ────
Write-Host "[3/5] Downloading latest Plakar release..." -ForegroundColor Yellow

try {
    # Query GitHub API for latest release
    $Headers = @{ "User-Agent" = "Plakar-Installer/1.0" }
    $Release = Invoke-RestMethod -Uri $ReleaseAPI -Headers $Headers -TimeoutSec 30

    # Find the Windows asset
    $Asset = $Release.assets | Where-Object {
        $_.name -match "windows" -and $_.name -match $Arch -and $_.name -match "\.(zip|tar\.gz|exe)$"
    } | Select-Object -First 1

    if (-not $Asset) {
        # Try a broader match
        $Asset = $Release.assets | Where-Object {
            $_.name -match "windows"
        } | Select-Object -First 1
    }

    if (-not $Asset) {
        Write-Host "  ✗ Could not find a Windows binary in the latest release." -ForegroundColor Red
        Write-Host "  → Please download manually from: https://github.com/$GithubRepo/releases" -ForegroundColor Yellow
        exit 1
    }

    $DownloadUrl = $Asset.browser_download_url
    $DownloadFile = Join-Path $env:TEMP $Asset.name
    Write-Host "  → Downloading: $($Asset.name)" -ForegroundColor Cyan

    Invoke-WebRequest -Uri $DownloadUrl -OutFile $DownloadFile -TimeoutSec 120

    # Extract if archive, or copy if exe
    if ($Asset.name -match "\.zip$") {
        Write-Host "  → Extracting archive..." -ForegroundColor Cyan
        Expand-Archive -Path $DownloadFile -DestinationPath $InstallDir -Force
        Remove-Item $DownloadFile -Force
    } elseif ($Asset.name -match "\.tar\.gz$") {
        Write-Host "  → Extracting tar.gz archive..." -ForegroundColor Cyan
        tar -xzf $DownloadFile -C $InstallDir 2>$null
        Remove-Item $DownloadFile -Force
    } else {
        Copy-Item $DownloadFile (Join-Path $InstallDir $BinaryName) -Force
        Remove-Item $DownloadFile -Force
    }

    # Ensure plakar.exe exists (might be nested in a subfolder)
    $ExePath = Join-Path $InstallDir $BinaryName
    if (-not (Test-Path $ExePath)) {
        $Found = Get-ChildItem -Path $InstallDir -Recurse -Filter $BinaryName | Select-Object -First 1
        if ($Found) {
            Move-Item $Found.FullName $ExePath -Force
        }
    }

    Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  → Please download manually from: https://github.com/$GithubRepo/releases" -ForegroundColor Yellow
    exit 1
}

# ──── Step 4: Add to PATH ────
Write-Host "[4/5] Configuring PATH..." -ForegroundColor Yellow
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$InstallDir", "User")
    $env:Path = "$env:Path;$InstallDir"
    Write-Host "  ✓ Added $InstallDir to user PATH" -ForegroundColor Green
    Write-Host "  → Note: Restart your terminal for PATH changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "  → Already in PATH" -ForegroundColor Green
}

# ──── Step 5: Verify installation ────
Write-Host "[5/5] Verifying installation..." -ForegroundColor Yellow
$PlakarExe = Join-Path $InstallDir $BinaryName
if (Test-Path $PlakarExe) {
    try {
        $Version = & $PlakarExe version 2>&1
        Write-Host "  ✓ Plakar installed: $Version" -ForegroundColor Green
    } catch {
        Write-Host "  ✓ Binary exists at: $PlakarExe" -ForegroundColor Green
        Write-Host "  → Could not determine version (this is OK)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ Binary not found after installation" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ Installation complete!" -ForegroundColor Green
Write-Host "  Binary:  $PlakarExe" -ForegroundColor White
Write-Host "  ⚠ Restart your terminal, then run:" -ForegroundColor Yellow
Write-Host "    plakar version" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
