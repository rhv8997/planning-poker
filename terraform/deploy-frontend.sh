#!/bin/bash
set -e

echo "🎨 Deploying Frontend (Next.js App)"
echo "==================================="
echo ""

# Get resource group and app name from terraform
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
FRONTEND_NAME=$(terraform output -json deployment_info | jq -r '.frontend_name')

echo "Resource Group: $RESOURCE_GROUP"
echo "Frontend App: $FRONTEND_NAME"
echo ""

# Navigate to client directory
cd ../../client

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build Next.js
echo "🔨 Building Next.js application..."
npm run build

# Deploy
echo "🚀 Deploying to Azure Static Web App..."
cd out

# Create deployment package if needed
echo "📦 Preparing deployment..."

# Deploy using Azure CLI
az staticwebapp update \
  --name "$FRONTEND_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source . || echo "Using ZIP deployment..."

# Alternative: ZIP deployment
cd ..
rm -rf deployment-frontend.zip
zip -r deployment-frontend.zip .next public -x ".next/cache/*"

# If direct update doesn't work, use ZIP
az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "${FRONTEND_NAME}-backend" \
  --src deployment-frontend.zip || true

echo ""
echo "✅ Frontend deployed successfully!"
echo "🌐 Frontend URL: https://$FRONTEND_NAME.azurewebsites.net"
