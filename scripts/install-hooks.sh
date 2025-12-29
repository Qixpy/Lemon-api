#!/bin/bash
# Install git hooks for Lemon API (macOS/Linux)
# This script configures Git to use the .githooks directory

set -e

echo "🔧 Installing Git hooks..."

# Set the hooks path to .githooks
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now run automatically before each commit."
echo "It will scan for secrets using Gitleaks (if installed)."
echo ""
echo "To install Gitleaks:"
echo "  macOS: brew install gitleaks"
echo "  Linux: See https://github.com/gitleaks/gitleaks#installing"
