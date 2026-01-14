#!/bin/bash
set -e

echo "🚀 Starting Release Process for opencode-plugin-repo-spec-zero..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   node_modules exists, skipping install (run 'npm ci' to force clean install)"
fi

# 2. Build
echo "🛠️  Building plugin..."
npm run build

# 3. Test
echo "🧪 Running tests..."
# Check if tests exist first to avoid error if empty
if [ -d "src" ]; then
    npm test
else
    echo "   No tests found, skipping."
fi

# 4. Package (The "Installer")
echo "📦 Packaging plugin..."
npm pack
PACKAGE_FILE=$(ls *.tgz | head -n 1)
echo "✅ Package created: $PACKAGE_FILE"

# 5. Git Status Check
echo "🔍 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "   Changes detected. Committing..."
    git add .
    git commit -m "chore: release artifacts"
fi

# 6. GitHub Remote Check
echo "globe_with_meridians: Checking remote..."
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote 'origin' found."
    echo "   To create a repo on GitHub, run:"
    echo "   gh repo create opencode-plugin-repo-spec-zero --public --source=."
    echo "   OR"
    echo "   git remote add origin <your-repo-url> && git push -u origin main"
else
    echo "⬆️  Pushing to origin..."
    git push origin main || echo "   Push failed (maybe branch mismatch or no permissions). Check manually."
fi

echo "🎉 Release process complete!"
echo "   To install this plugin in OpenCode locally, use the generated .tgz file or link the directory."
