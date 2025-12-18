variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secrets" {
  description = "Map of secret name to description"
  type        = map(string)
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}

