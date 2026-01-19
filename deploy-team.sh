#!/bin/bash
set -e

echo "🚀 Planning Poker - Complete Team Deployment"
echo "============================================="
echo ""
echo "This script will:"
echo "1. Deploy backend to Railway"
echo "2. Deploy frontend to GitHub Pages"
echo "3. Share access with your team"
echo ""

# Check prerequisites
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install it."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it."
    exit 1
fi

echo "📋 Step 1: Backend Deployment to Railway"
echo "=========================================="
echo ""
echo "Follow these steps:"
echo "1. Go to https://railway.app"
echo "2. Sign up with GitHub"
echo "3. Create new project → Deploy from GitHub"
echo "4. Select this repository and 'server' directory"
echo "5. Copy your Railway backend URL"
echo ""

read -p "Enter your Railway backend URL (e.g., https://planning-poker-abc123.railway.app): " railway_url

if [ -z "$railway_url" ]; then
    echo "❌ Backend URL required"
    exit 1
fi

echo ""
echo "📋 Step 2: Update Frontend Configuration"
echo "========================================="
echo ""
echo "Updating frontend to use Railway backend..."

# Update environment file
cat > client/.env.production << EOF
NEXT_PUBLIC_BACKEND_URL=$railway_url
EOF

echo "✅ Environment configured: $railway_url"

echo ""
echo "📋 Step 3: Deploy Frontend to GitHub Pages"
echo "=========================================="
echo ""

# Build frontend
echo "Building frontend..."
cd client
npm install --frozen-lockfile
npm run build
cd ..

echo "✅ Frontend built successfully"
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
git add .
git commit -m "🚀 Deploy to production with Railway backend" || true
git push origin main

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🎉 Your Planning Poker is now live!"
echo ""
echo "Access your app:"
echo "   Frontend: https://github.com/settings/pages (check your repo)"
echo "   Backend: $railway_url"
echo ""
echo "Share with your team:"
echo "   1. Get the GitHub Pages URL from repo Settings → Pages"
echo "   2. Send: https://yourusername.github.io/planning-poker"
echo ""
echo "👥 Team members can now:"
echo "   1. Visit the URL"
echo "   2. Enter their name"
echo "   3. Create or join a room"
echo "   4. Start planning!"
