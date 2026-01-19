variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "rg-planning-poker"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus" # Free tier available in eastus
}

variable "app_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "poker"
}

variable "backend_repo_url" {
  description = "Git repository URL for backend"
  type        = string
  default     = "" # Leave empty if deploying manually
}

variable "frontend_repo_url" {
  description = "Git repository URL for frontend"
  type        = string
  default     = "" # Leave empty if deploying manually
}

variable "backend_repo_branch" {
  description = "Git branch for backend"
  type        = string
  default     = "main"
}

variable "frontend_repo_branch" {
  description = "Git branch for frontend"
  type        = string
  default     = "main"
}
