variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region (used for compute, not Firestore location)"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "firestore_location" {
  description = "Firestore database location"
  type        = string
  default     = "eur3" # Multi-region Europe
}

