# Azure Deployment Guide for Planning Poker

## 📋 Prerequisites

1. **Azure Account** - Free tier (12 months free)
   - Sign up: https://azure.microsoft.com/en-us/free/

2. **Required Tools**
   - [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
   - [Terraform](https://www.terraform.io/downloads.html)
   - [Node.js 20+](https://nodejs.org/)
   - Git

3. **Installation Check**
   ```bash
   az --version
   terraform --version
   node --version
   ```

## 🚀 Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads required Azure provider plugins.

### 2. Review Resources

```bash
terraform plan
```

This shows all resources that will be created:
- Resource Group
- App Service Plan (F1 - Free)
- App Service for Node.js backend
- Static Web App for Next.js frontend
- Application Insights for monitoring

### 3. Deploy Infrastructure

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Check prerequisites
2. Log you into Azure
3. Show deployment plan
4. Create all Azure resources

**Expected output:**
```
Backend URL: https://poker-backend.azurewebsites.net
Frontend URL: https://poker-frontend.azurewebsites.net
```

### 4. Deploy Backend

```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

This will:
1. Install Node.js dependencies
2. Package the server code
3. Deploy to App Service

### 5. Deploy Frontend

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

This will:
1. Install dependencies
2. Build Next.js
3. Deploy to Static Web App

### 6. Configure Environment Variables

After deployment, set the backend URL in the frontend:

```bash
# Get your backend URL
terraform output -json deployment_info | jq '.backend_url'

# Update frontend .env.production with backend URL
```

## 💰 Cost Breakdown (12 Months Free)

| Resource | Tier | Cost |
|----------|------|------|
| App Service | F1 | $0/month |
| Static Web App | Free | $0/month |
| Application Insights | Free | $0/month (5GB logs) |
| **Total** | | **$0/month** |

After 12 months:
- App Service: ~$15/month
- Static Web App: ~$10/month
- Total: ~$25/month

## 📝 Configuration

Edit `terraform.tfvars` to customize:

```hcl
resource_group_name = "rg-planning-poker"
location            = "eastus"  # Free tier available
app_name            = "poker"
```

## 🔄 Updating Your App

### Update Backend
```bash
# Make changes to server/
cd terraform
./deploy-backend.sh
```

### Update Frontend
```bash
# Make changes to client/
cd terraform
./deploy-frontend.sh
```

## 📊 Monitoring

View logs and performance:

```bash
# View backend logs
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
az webapp log tail --name poker-backend --resource-group $RESOURCE_GROUP

# View Application Insights
az monitor app-insights app-state show --app poker-insights --resource-group $RESOURCE_GROUP
```

## 🛑 Destroying Resources

To avoid any costs after free tier expires:

```bash
terraform destroy
```

This removes all Azure resources.

## ⚠️ Free Tier Limitations

For 7 users, you should be fine, but be aware:

- **App Service F1**: 60 min/day usage limit (resets daily)
- **Static Web App**: Shared infrastructure, no auto-scaling
- **Connection limits**: 256 concurrent connections per instance

## 🔗 Useful Links

- [Azure App Service Pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/windows/)
- [Azure Static Web Apps Pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/)
- [Azure Free Account FAQ](https://azure.microsoft.com/en-us/free/free-account-faq/)
- [Terraform Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest)

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs
az webapp log tail --name poker-backend --resource-group rg-planning-poker

# Restart app
az webapp restart --name poker-backend --resource-group rg-planning-poker
```

### Frontend not loading
```bash
# Check Static Web App status
az staticwebapp show --name poker-frontend --resource-group rg-planning-poker
```

### Terraform error
```bash
# Refresh state
terraform refresh

# Destroy and retry
terraform destroy
terraform apply
```

## 📞 Support

- Azure Support: https://azure.microsoft.com/en-us/support/
- Terraform Docs: https://www.terraform.io/docs
- Planning Poker Repo: Your GitHub repo

---

**Estimated deployment time: 5-10 minutes** ⏱️
