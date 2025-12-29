# Install git hooks for Lemon API (Windows)
# This script configures Git to use the .githooks directory

Write-Host "🔧 Installing Git hooks..." -ForegroundColor Cyan

try {
    # Set the hooks path to .githooks
    git config core.hooksPath .githooks
    
    Write-Host "✅ Git hooks installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The pre-commit hook will now run automatically before each commit."
    Write-Host "It will scan for secrets using Gitleaks (if installed)."
    Write-Host ""
    Write-Host "To install Gitleaks on Windows:" -ForegroundColor Yellow
    Write-Host "  Option 1: scoop install gitleaks"
    Write-Host "  Option 2: choco install gitleaks"
    Write-Host "  Option 3: Download from https://github.com/gitleaks/gitleaks/releases"
}
catch {
    Write-Host "❌ Failed to install hooks: $_" -ForegroundColor Red
    exit 1
}
