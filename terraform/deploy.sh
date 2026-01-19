#!/bin/bash
set -e

echo "🚀 Planning Poker - Azure Deployment Setup"
echo "==========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install it:"
    echo "   https://www.terraform.io/downloads.html"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install it:"
    exit 1
fi

echo "✅ All prerequisites installed!"
echo ""

# Login to Azure
echo "🔐 Logging in to Azure..."
az login

# Get subscription info
SUBSCRIPTION=$(az account show --query id -o tsv)
echo "✅ Using subscription: $SUBSCRIPTION"
echo ""

# Initialize Terraform
echo "📦 Initializing Terraform..."
cd "$(dirname "$0")"
terraform init

# Show plan
echo ""
echo "📋 Terraform plan (review these resources):"
terraform plan -out=tfplan

echo ""
echo "❓ Review the resources above. Apply? (yes/no)"
read -r response

if [ "$response" != "yes" ]; then
    echo "❌ Deployment cancelled"
    rm -f tfplan
    exit 0
fi

# Apply
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Outputs:"
terraform output -json | jq .

echo ""
echo "🎉 Your Planning Poker app is deployed!"
echo ""
echo "Next steps:"
echo "1. Deploy backend:   ./deploy-backend.sh"
echo "2. Deploy frontend:  ./deploy-frontend.sh"
echo "3. Or use GitHub Actions for CI/CD"
