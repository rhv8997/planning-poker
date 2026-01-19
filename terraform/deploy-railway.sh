#!/bin/bash
set -e

echo "🚀 Planning Poker - Railway Deployment"
echo "======================================"
echo ""
echo "This script deploys the backend to Railway.app"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install it first."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI not found. Installing via Homebrew..."
    brew install gh
fi

echo "📋 Prerequisites:"
echo "1. GitHub account (for this repo)"
echo "2. Railway account (free at railway.app)"
echo ""

read -p "Have you created a Railway account and connected it to this GitHub repo? (yes/no) " -r response
if [ "$response" != "yes" ]; then
    echo "❌ Please set up Railway first:"
    echo "   1. Go to https://railway.app"
    echo "   2. Sign up with GitHub"
    echo "   3. Create new project → Deploy from GitHub repo"
    echo "   4. Select this repository"
    exit 1
fi

echo ""
echo "✅ Great! Railway will automatically deploy the backend."
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub: git push origin main"
echo "2. Railway will automatically build and deploy"
echo "3. Get your backend URL from Railway dashboard"
echo "4. Update NEXT_PUBLIC_BACKEND_URL in .env.local:"
echo "   export NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app"
echo ""
echo "Then deploy frontend:"
echo "   npm run deploy-frontend"
