#!/bin/bash

# Script to verify deployment readiness
# Run this before deploying to catch common issues

echo "🔍 Verifying Strata Trader Deployment Readiness..."
echo ""

ERRORS=0

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ In correct directory"

# Check backend files
echo ""
echo "📦 Checking Backend..."

if [ ! -f "backend/package.json" ]; then
    echo "❌ backend/package.json not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ backend/package.json exists"
fi

if [ ! -f "backend/src/main.ts" ]; then
    echo "❌ backend/src/main.ts not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ backend/src/main.ts exists"
fi

if [ ! -f "backend/build.sh" ]; then
    echo "❌ backend/build.sh not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ backend/build.sh exists"

    # Check if executable
    if [ ! -x "backend/build.sh" ]; then
        echo "⚠️  Warning: backend/build.sh is not executable"
        echo "   Run: chmod +x backend/build.sh"
    fi
fi

# Check frontend files
echo ""
echo "🎨 Checking Frontend..."

if [ ! -f "frontend/package.json" ]; then
    echo "❌ frontend/package.json not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ frontend/package.json exists"
fi

if [ ! -f "frontend/src/main.ts" ]; then
    echo "❌ frontend/src/main.ts not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ frontend/src/main.ts exists"
fi

if [ ! -f "frontend/vercel.json" ]; then
    echo "❌ frontend/vercel.json not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ frontend/vercel.json exists"
fi

if [ ! -f "frontend/src/environments/environment.production.ts" ]; then
    echo "❌ frontend/src/environments/environment.production.ts not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ frontend/src/environments/environment.production.ts exists"
fi

# Check deployment config files
echo ""
echo "⚙️  Checking Deployment Configs..."

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ render.yaml exists"
fi

if [ ! -f "DEPLOYMENT.md" ]; then
    echo "⚠️  Warning: DEPLOYMENT.md not found (recommended)"
else
    echo "✅ DEPLOYMENT.md exists"
fi

# Check for sensitive files that shouldn't be committed
echo ""
echo "🔐 Checking for sensitive files..."

if [ -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env found (should not be in git)"
    if grep -q "backend/.env" .gitignore; then
        echo "   ✅ But it's in .gitignore"
    else
        echo "   ❌ And it's NOT in .gitignore!"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "frontend/.env" ]; then
    echo "⚠️  Warning: frontend/.env found (should not be in git)"
fi

# Check git status
echo ""
echo "📦 Checking Git Status..."

if [ -d ".git" ]; then
    echo "✅ Git repository found"

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: You have uncommitted changes"
        echo "   Commit and push before deploying"
    else
        echo "✅ No uncommitted changes"
    fi

    # Check remote
    if git remote get-url origin &> /dev/null; then
        REMOTE=$(git remote get-url origin)
        echo "✅ Git remote configured: $REMOTE"
    else
        echo "❌ No git remote configured"
        echo "   Run: git remote add origin <your-repo-url>"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ Not a git repository"
    echo "   Run: git init"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Ready for deployment"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push your code to GitHub"
    echo "2. Follow DEPLOYMENT.md for detailed instructions"
    echo "3. Deploy backend to Render"
    echo "4. Deploy frontend to Vercel"
    exit 0
else
    echo "❌ Found $ERRORS error(s)"
    echo "Please fix the errors above before deploying"
    exit 1
fi
