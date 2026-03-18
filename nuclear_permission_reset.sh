#!/bin/bash
# NUCLEAR macOS Permission Reset & Clean for P2PHub
# This script removes junk, resets core files, and cleans the Git index.

# 1. Junk files to be PERMANENTLY REMOVED from the repo
JUNK_FILES=(
"RAILWAY_GOOGLE_SHEETS_FIX.txt"
"backend/pytest_errors.txt"
"backend/ruff_errors.txt"
"backend/test_notif_debug.txt"
"comms_283.txt"
"deployment_error_audit_2026-02-14.json"
"hardcoded_ru.txt"
"hardcoded_ru_2.txt"
"missing_keys.txt"
"test_write.txt"
"frontend/src/data/img/test.txt"
)

# 2. Core files to be RESET (recreated with fresh metadata)
CORE_FILES=$(find . -maxdepth 4 -name "*.json" -o -name "*.tsx" -o -name "*.ts" -o -name "requirements.txt" | grep -v "node_modules" | grep -v "venv")

echo "--- STEP 1: Removing junk files and clearing from Git index ---"
for file in "${JUNK_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Deleting and untracking: $file"
        git rm --cached "$file" 2>/dev/null
        rm -f "$file"
    fi
done

# Clear idea logs
rm -f ideas/logs.*.json 2>/dev/null

echo "--- STEP 2: Resetting core files to clear macOS metadata ---"
# We only do this for the files currently reporting "Operation not permitted" in git status
git status 2>&1 | grep "Operation not permitted" | cut -d: -f1 | while read -r file; do
    file=$(echo $file | xargs) # trim whitespace
    if [ -f "$file" ]; then
        echo "Resetting: $file"
        content=$(cat "$file" 2>/dev/null)
        if [ $? -eq 0 ]; then
            git rm --cached "$file" 2>/dev/null
            rm -f "$file"
            echo "$content" > "$file"
            git add "$file"
        else
            echo "FAILED to read $file - trying with sudo"
            content=$(sudo cat "$file" 2>/dev/null)
            if [ $? -eq 0 ]; then
                git rm --cached "$file" 2>/dev/null
                sudo rm -f "$file"
                echo "$content" | sudo tee "$file" > /dev/null
                git add "$file"
            fi
        fi
    fi
done

echo "--- STEP 3: Updating .gitignore to prevent future junk ---"
cat >> .gitignore <<EOF

# P2PHub Junk/Debug
*.txt
*.log
backend/pytest_errors.txt
backend/ruff_errors.txt
backend/test_notif_debug.txt
comms_283.txt
deployment_error_audit_*.json
missing_keys.txt
ideas/logs.*.json
EOF

# Remove duplicates from .gitignore
sort -u .gitignore -o .gitignore

echo "--- STEP 4: Deep clean Git index ---"
git gc --prune=now
git update-index --refresh

echo "------------------------------------------------"
echo "Nuclear Reset Complete. Please check 'git status'."
