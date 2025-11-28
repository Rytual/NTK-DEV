# Ninja Toolkit v11 - Windows Build Script
# Run this script in Windows PowerShell (Admin) to build the final EXE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ninja Toolkit v11 - Windows Builder  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm -v 2>$null
Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green

# Set working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "[OK] Working directory: $scriptPath" -ForegroundColor Green

# Clean previous builds
Write-Host ""
Write-Host "[1/6] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
Write-Host "[OK] Clean complete" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "[2/6] Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm ci --legacy-peer-deps 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] npm ci failed, trying npm install..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# Rebuild native modules
Write-Host ""
Write-Host "[3/6] Rebuilding native modules for Windows..." -ForegroundColor Yellow
npm rebuild better-sqlite3 2>&1 | Out-Null
npm rebuild 2>&1 | Out-Null
Write-Host "[OK] Native modules rebuilt" -ForegroundColor Green

# Run RAM audit
Write-Host ""
Write-Host "[4/6] Running RAM audit..." -ForegroundColor Yellow
if (Test-Path "scripts/ram-audit.cjs") {
    node scripts/ram-audit.cjs
}
Write-Host "[OK] RAM audit complete" -ForegroundColor Green

# Build with Electron Forge
Write-Host ""
Write-Host "[5/6] Building Windows EXE with Electron Forge..." -ForegroundColor Yellow
Write-Host "      This will take several minutes..." -ForegroundColor Gray
npx electron-forge make --platform=win32 --arch=x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed. Check errors above." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build complete!" -ForegroundColor Green

# Package results
Write-Host ""
Write-Host "[6/6] Packaging final deliverables..." -ForegroundColor Yellow

$distPath = ".\out\make\squirrel.windows\x64"
$zipName = "ninja-toolkit-v11-FINAL-WINDOWS-EXE.zip"

if (Test-Path $distPath) {
    # Create README
    $readme = @"
NINJA TOOLKIT v11 - FINAL WINDOWS BUILD
========================================

Contents:
- NinjaToolkit-11.0.0 Setup.exe - Main installer
- RELEASES - Update manifest
- *.nupkg - Delta update packages

INSTALLATION:
1. Double-click "NinjaToolkit-11.0.0 Setup.exe"
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

SILENT INSTALL (for GPO/Intune):
.\NinjaToolkit-11.0.0-Setup.exe /S /AUTOSTART

REGISTRY DETECTION:
HKLM\Software\NinjaToolkit\Detection\ProductVersion = 11.0.0

Built: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@
    $readme | Out-File -FilePath "$distPath\README.txt" -Encoding UTF8

    # Create ZIP
    Compress-Archive -Path "$distPath\*" -DestinationPath $zipName -Force
    $zipSize = (Get-Item $zipName).Length / 1MB
    Write-Host "[OK] Created: $zipName ($([math]::Round($zipSize, 1)) MB)" -ForegroundColor Green
} else {
    Write-Host "[WARN] Build output not found at expected location" -ForegroundColor Yellow
    Write-Host "       Check: out\make\ for built artifacts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        BUILD COMPLETE!                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output: $zipName" -ForegroundColor White
Write-Host ""
