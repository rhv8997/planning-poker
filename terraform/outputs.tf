output "backend_url" {
  description = "URL of the backend container"
  value       = "https://${azurerm_container_group.backend.fqdn}:8080"
}

output "frontend_url" {
  description = "URL of the Static Web App frontend"
  value       = azurerm_static_web_app.frontend.default_host_name
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_url" {
  description = "Container Registry URL"
  value       = azurerm_container_registry.acr.login_server
}

output "deployment_info" {
  description = "Complete deployment information"
  value = {
    backend_url           = "https://${azurerm_container_group.backend.fqdn}:8080"
    frontend_url          = azurerm_static_web_app.frontend.default_host_name
    resource_group        = azurerm_resource_group.main.name
    location              = azurerm_resource_group.main.location
    container_registry    = azurerm_container_registry.acr.login_server
    estimated_monthly_cost = "~$5-10 (within free trial credits)"
  }
}
