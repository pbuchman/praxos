# Secret Manager Module
# Creates Secret Manager secrets for application configuration.

resource "google_secret_manager_secret" "secrets" {
  for_each = var.secrets

  secret_id = each.key
  labels    = var.labels

  replication {
    auto {}
  }
}

# Note: Secret values must be populated manually or via gcloud.
# This module creates empty secrets with replication configured.
# See docs/setup/02-terraform-bootstrap.md for how to populate secrets.

