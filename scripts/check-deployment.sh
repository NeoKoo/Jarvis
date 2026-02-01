#!/bin/bash

# Deployment Verification Script for Jarvis on Zeabur
# This script checks the repository status before deployment

set -e

echo "🔍 Jarvis Deployment Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Git Remote
echo "📡 Checking git remote..."
REMOTE_URL=$(git remote get-url origin)
if [[ "$REMOTE_URL" == *"github.com/NeoKoo/Jarvis"* ]]; then
    echo -e "${GREEN}✓${NC} Git remote correctly configured: $REMOTE_URL"
else
    echo -e "${RED}✗${NC} Git remote may be incorrect: $REMOTE_URL"
    echo "  Expected: https://github.com/NeoKoo/Jarvis.git"
fi
echo ""

# Check 2: Current Branch
echo "🌿 Checking current branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "main" ]; then
    echo -e "${GREEN}✓${NC} On main branch"
else
    echo -e "${YELLOW}⚠${NC} On branch: $CURRENT_BRANCH (expected: main)"
fi
echo ""

# Check 3: Uncommitted Changes
echo "📝 Checking for uncommitted changes..."
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓${NC} No uncommitted changes"
else
    echo -e "${YELLOW}⚠${NC} You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes before deployment? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        git push origin main
        echo -e "${GREEN}✓${NC} Changes committed and pushed"
    fi
fi
echo ""

# Check 4: Remote Sync
echo "🔄 Checking remote sync..."
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✓${NC} Local and remote are in sync"
else
    echo -e "${YELLOW}⚠${NC} Local and remote are out of sync"
    echo "  Local:  $LOCAL_COMMIT"
    echo "  Remote: $REMOTE_COMMIT"
    echo ""
    read -p "Do you want to push local changes to remote? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        echo -e "${GREEN}✓${NC} Changes pushed to remote"
    fi
fi
echo ""

# Check 5: Environment Variables
echo "🔐 Checking environment files..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists (not deployed, for reference only)"
else
    echo -e "${YELLOW}⚠${NC} .env.local not found (create from .env.local.example if needed)"
fi

if [ -f ".env.local.example" ]; then
    echo -e "${GREEN}✓${NC} .env.local.example exists"
fi
echo ""

# Check 6: Build Files
echo "🏗️  Checking build configuration..."
if [ -f "package.json" ]; then
    if grep -q '"build":' package.json; then
        echo -e "${GREEN}✓${NC} Build script found in package.json"
    else
        echo -e "${RED}✗${NC} Build script missing from package.json"
    fi
else
    echo -e "${RED}✗${NC} package.json not found"
fi

if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✓${NC} next.config.js exists"
else
    echo -e "${RED}✗${NC} next.config.js not found"
fi

if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Dockerfile exists (ready for Zeabur)"
else
    echo -e "${YELLOW}⚠${NC} Dockerfile not found (optional but recommended)"
fi
echo ""

# Check 7: Repository Accessibility
echo "🌐 Checking GitHub repository..."
if curl -s -o /dev/null -w "%{http_code}" https://github.com/NeoKoo/Jarvis | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Repository is accessible at https://github.com/NeoKoo/Jarvis"
else
    echo -e "${RED}✗${NC} Repository may not be accessible"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✓ Pre-deployment checks complete!${NC}"
echo ""
echo "Next steps for Zeabur deployment:"
echo "1. Go to https://dash.zeabur.com"
echo "2. Create new project or select existing"
echo "3. Import from Git → GitHub → NeoKoo/Jarvis"
echo "4. Select 'main' branch"
echo "5. Configure:"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo "   - Node.js Version: 20.x"
echo "6. Add environment variables (see ZEABUR_DEPLOYMENT.md)"
echo "7. Deploy! 🚀"
echo ""
