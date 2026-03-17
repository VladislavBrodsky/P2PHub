#!/bin/bash
# Permanent fix for macOS P2PHub permissions

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Applying permanent permission fix to $PROJECT_ROOT..."

# 1. Reset ownership to the current user
sudo chown -R $(id -u):$(id -g) "$PROJECT_ROOT"

# 2. Reset basic permissions
sudo chmod -R 755 "$PROJECT_ROOT"

# 3. Clear all macOS extended attributes (including quarantine and provenance)
sudo xattr -rc "$PROJECT_ROOT"

# 4. Clear all macOS file flags (like uchg/immutable)
sudo chflags -R nouchg "$PROJECT_ROOT"

# 5. Specifically ensure frontend directory is fully accessible
chmod -R 777 "$PROJECT_ROOT/frontend"

echo "------------------------------------------------"
echo "Fix complete. Please try your command (e.g., 'git status' or 'npm run build') now."
