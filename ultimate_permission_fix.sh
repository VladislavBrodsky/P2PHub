#!/bin/bash
# Ultimate macOS Permission Fix for P2PHub
# This script recreates the files to force-reset OS metadata/flags.

FILES=(
"RAILWAY_GOOGLE_SHEETS_FIX.txt"
"backend/pytest_errors.txt"
"backend/requirements.txt"
"backend/ruff_errors.txt"
"backend/test_notif_debug.txt"
"comms_283.txt"
"deployment_error_audit_2026-02-14.json"
"frontend/package-lock.json"
"frontend/package.json"
"frontend/public/robots.txt"
"frontend/public/tonconnect-manifest.json"
"frontend/tsconfig.json"
"frontend/tsconfig.node.json"
"hardcoded_ru.txt"
"hardcoded_ru_2.txt"
"knowledge_base_checklist.md"
"missing_keys.txt"
"package-lock.json"
"package.json"
"test_write.txt"
)

# Loop through and recreate text-based files
echo "Recreating problematic files..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        content=$(cat "$file" 2>/dev/null)
        if [ $? -eq 0 ]; then
            rm -f "$file"
            echo "$content" > "$file"
            chmod 644 "$file"
            echo "Successfully recreated $file"
        else
            echo "FAILED to read $file - skipping recreation."
        fi
    fi
done

# Special handling for directories and binaries
echo "Clearing attributes/flags on directories..."
sudo xattr -rc .
sudo chflags -R nouchg .
sudo chmod -R 755 .

echo "------------------------------------------------"
echo "Fix complete. Please run 'git status' to verify."
