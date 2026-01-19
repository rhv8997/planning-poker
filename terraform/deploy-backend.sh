#!/bin/bash
set -e

echo "📦 Deploying Backend (Node.js Server)"
echo "===================================="
echo ""

# Get resource group and app name from terraform
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
BACKEND_NAME=$(terraform output -json deployment_info | jq -r '.backend_name')

echo "Resource Group: $RESOURCE_GROUP"
echo "Backend App: $BACKEND_NAME"
echo ""

# Navigate to server directory
cd ../../server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build (if needed)
if [ -f "package.json" ]; then
    echo "✅ Dependencies installed"
fi

# Deploy to App Service
echo "🚀 Deploying to Azure App Service..."
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deployment.zip
zip -r deployment.zip server -x "server/node_modules/*" "server/.git/*"

# Deploy
echo "⬆️  Uploading to Azure..."
az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$BACKEND_NAME" \
  --src deployment.zip

echo ""
echo "✅ Backend deployed successfully!"
echo "🌐 Backend URL: https://$BACKEND_NAME.azurewebsites.net"
echo ""
echo "Visit the URL above to verify deployment. You should see 'Cannot GET /' if backend is running."
