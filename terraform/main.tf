terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    environment = "production"
    project     = "planning-poker"
  }
}

# Storage Account for Container Registry
resource "azurerm_storage_account" "container_storage" {
  name                     = "poker${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    environment = "production"
    project     = "planning-poker"
  }
}

# Container Registry (free tier)
resource "azurerm_container_registry" "acr" {
  name                = "poker${random_string.storage_suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic" # $5/month but within free trial

  tags = {
    environment = "production"
    project     = "planning-poker"
  }
}

# Container Group for Backend (using Container Instances - pay per second)
resource "azurerm_container_group" "backend" {
  name                = "${var.app_name}-backend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  restart_policy      = "Always"
  ip_address_type     = "Public"
  dns_name_label      = "${var.app_name}-backend-${random_string.suffix.result}"

  container {
    name   = "backend"
    image  = "node:20-alpine"
    cpu    = "0.5"   # Half CPU - very cheap
    memory = "0.5"   # 512MB - very cheap

    ports {
      port     = 8080
      protocol = "TCP"
    }

    environment_variables = {
      "NODE_ENV" = "production"
      "PORT"     = "8080"
    }

    # Use commands to start the server
    commands = ["sh", "-c", "cd /app && npm install && npm start"]
  }

  tags = {
    environment = "production"
    project     = "planning-poker"
  }

  depends_on = [azurerm_resource_group.main]
}

# Static Web App for Frontend (truly free)
resource "azurerm_static_web_app" "frontend" {
  name                = "${var.app_name}-frontend-${random_string.suffix.result}"
  location            = "westus2"  # Available in free tier
  resource_group_name = azurerm_resource_group.main.name
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = {
    environment = "production"
    project     = "planning-poker"
  }
}

# Random suffixes for unique names
resource "random_string" "suffix" {
  length  = 4
  special = false
  lower   = true
}

resource "random_string" "storage_suffix" {
  length  = 10
  special = false
  lower   = true
  numeric = true
}
