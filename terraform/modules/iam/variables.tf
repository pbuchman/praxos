variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "services" {
  description = "Map of service configurations"
  type = map(object({
    name      = string
    app_path  = string
    port      = number
    min_scale = number
    max_scale = number
  }))
}

variable "secret_ids" {
  description = "Map of secret names to their IDs"
  type        = map(string)
}

