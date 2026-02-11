#!/bin/bash

# Setup script for local Git hooks

HOOKS_DIR=".git/hooks"
PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"

echo "🔧 Setting up local git hooks..."

# Create pre-push hook
cat << 'EOF' > "$PRE_PUSH_HOOK"
#!/bin/bash

echo "🔍 Running pre-push checks..."

# Check if we are in the backend directory or need to cd into it
if [ -d "backend" ]; then
    cd backend
fi

# Run import verification
export PYTHONPATH=$PYTHONPATH:.
python3 scripts/verify_imports.py

if [ $? -ne 0 ]; then
    echo "❌ Pre-push checks FAILED! Please fix the errors before pushing."
    exit 1
fi

echo "✅ Pre-push checks passed!"
exit 0
EOF

# Make it executable
chmod +x "$PRE_PUSH_HOOK"

echo "✅ Local pre-push hook installed successfully."
